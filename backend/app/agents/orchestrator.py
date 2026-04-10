"""
Orchestrator Agent: Routes user questions to the appropriate specialist agents
and assembles the final response matching the API contract.

This is THE BRAIN of DataTalk.
"""
import json
from app.utils.gemini_client import gemini
from app.agents.sql_agent import run_sql_agent
from app.agents.code_agent import run_code_agent
from app.agents.search_agent import run_search_agent, build_search_query
from app.agents.explain_agent import run_explain_agent
from app.core.confidence import calculate_confidence


CLASSIFY_SYSTEM_PROMPT = """You are a routing agent for a data analysis platform. Given a user question and a database schema, classify the question into exactly one category.

Categories:
- "sql_query": Questions answerable with a SQL query (aggregations, filters, grouping, counts, totals, averages, comparisons between groups, rankings, top/bottom N)
- "visualization": Questions explicitly requesting charts, plots, graphs, or visual representation. Also route here if question says "show me", "plot", "chart", "visualize", "graph"
- "statistical_analysis": Questions requiring Python code (correlations, distributions, regressions, statistical tests, clustering, predictions, outlier detection, complex calculations)
- "web_search": Questions about external context, news, trends, events, or industry information NOT answerable from the data
- "general": Greetings ("hello"), meta-questions about the data ("what columns do you have?"), or questions about the tool itself ("what can you do?")

Schema: {schema}
Semantic Layer: {semantic_layer}

Respond with ONLY a JSON object:
{{"category": "...", "needs_web_context": true/false, "search_query": "..." or null, "reasoning": "one sentence"}}

"needs_web_context" should be true if the question has a "why" component or asks about external factors that might relate to the data trends.
"""


async def process_question(
    question: str,
    session: dict,
    options: dict = {},
) -> dict:
    """
    Main orchestrator: classify the question, route to agents, assemble response.

    Args:
        question: User's natural language question.
        session: Session dict with db, df, schema, semantic_layer.
        options: Optional settings (include_chart, include_web_search).

    Returns:
        Complete response dict matching the API contract.
    """
    schema = session["schema"]
    semantic_layer = session.get("semantic_layer")
    include_chart = options.get("include_chart", True)
    include_web = options.get("include_web_search", True)

    # Step 1: Classify the question
    classification = await _classify_question(question, schema, semantic_layer)
    category = classification.get("category", "sql_query")
    needs_web = classification.get("needs_web_context", False) and include_web

    # Step 2: Route to appropriate agent(s)
    result = {}

    if category == "general":
        result = await _handle_general(question, schema)

    elif category in ("sql_query", "visualization"):
        # SQL Agent
        sql_result = await run_sql_agent(
            question=question,
            session=session,
            include_chart=include_chart or category == "visualization",
        )
        result = {
            "agent_used": "sql_agent",
            "sql_query": sql_result["sql_query"],
            "python_code": None,
            "chart": sql_result.get("chart"),
            "matplotlib_image": None,
            "data": sql_result.get("data", []),
            "columns_used": sql_result.get("columns_used", []),
            "row_count": sql_result.get("row_count", 0),
            "total_rows": sql_result.get("total_rows", 0),
            "error": sql_result.get("error"),
        }

        # If chart data exists, cap it at 50 data points for frontend
        if result["chart"] and sql_result.get("data"):
            result["chart"]["data"] = sql_result["data"][:50]

    elif category == "statistical_analysis":
        # Code Agent
        code_result = await run_code_agent(
            question=question,
            session=session,
        )
        result = {
            "agent_used": "code_agent",
            "sql_query": None,
            "python_code": code_result.get("python_code"),
            "chart": None,
            "matplotlib_image": (
                code_result["matplotlib_images"][0]
                if code_result.get("matplotlib_images")
                else None
            ),
            "data": [],
            "columns_used": [],
            "row_count": len(session["df"]),
            "total_rows": len(session["df"]),
            "error": code_result.get("error"),
            "stdout": code_result.get("stdout", ""),
        }

    elif category == "web_search":
        # Search Agent only
        search_query = classification.get("search_query") or build_search_query(question)
        search_result = await run_search_agent(query=search_query)
        result = {
            "agent_used": "search_agent",
            "sql_query": None,
            "python_code": None,
            "chart": None,
            "matplotlib_image": None,
            "data": [],
            "columns_used": [],
            "row_count": 0,
            "total_rows": len(session.get("df", [])),
            "web_results": search_result.get("results", []),
        }

    # Step 3: Fetch web context (if needed and not already a web search)
    web_results = result.get("web_results", [])
    if needs_web and category != "web_search":
        try:
            search_query = classification.get("search_query") or build_search_query(question)
            search_result = await run_search_agent(query=search_query, max_results=3)
            web_results = search_result.get("results", [])
        except Exception:
            web_results = []

    # Step 4: Generate plain English explanation
    explanation_data = result.get("data", [])
    if result.get("stdout"):
        explanation_data = result["stdout"]

    try:
        answer = await run_explain_agent(
            question=question,
            result_data=explanation_data,
            agent_type=result.get("agent_used", "unknown"),
            sql_query=result.get("sql_query"),
            python_code=result.get("python_code"),
            columns_used=result.get("columns_used", []),
            row_count=result.get("row_count", 0),
            total_rows=result.get("total_rows", 0),
            web_results=web_results if web_results else None,
        )
    except Exception as e:
        answer = result.get(
            "stdout",
            f"I analyzed your question but couldn't generate a summary. Error: {str(e)}",
        )

    # For general questions, use the pre-built answer
    if category == "general" and result.get("answer"):
        answer = result["answer"]

    # Step 5: Calculate confidence score
    confidence = calculate_confidence(
        rows_used=result.get("row_count", 0),
        total_rows=result.get("total_rows", 0),
        columns_used=result.get("columns_used", []),
        schema=schema,
        question=question,
        web_results=web_results,
        sql_error=result.get("error"),
    )

    # Step 6: Build sources list
    sources = []
    if result.get("columns_used"):
        sources.append({
            "type": "column",
            "value": f"{', '.join(result['columns_used'])} ({result.get('row_count', 0):,} rows)",
        })
    if web_results:
        for wr in web_results[:3]:
            sources.append({
                "type": "web",
                "value": wr.get("title", "Web article"),
                "url": wr.get("url", ""),
            })

    # Step 7: Assemble final response (matches the API contract exactly)
    return {
        "answer": answer,
        "agent_used": result.get("agent_used", "unknown"),
        "sql_query": result.get("sql_query"),
        "python_code": result.get("python_code"),
        "chart": result.get("chart"),
        "matplotlib_image": result.get("matplotlib_image"),
        "confidence": confidence,
        "sources": sources,
        "from_cache": False,
    }


async def _classify_question(question: str, schema: list, semantic_layer) -> dict:
    """Classify the user's question to determine which agent to use."""
    schema_summary = json.dumps(
        [{"name": s["name"], "type": s["type"]} for s in schema],
        indent=2,
    )
    semantic_str = semantic_layer.to_json() if semantic_layer else "None"

    system_prompt = CLASSIFY_SYSTEM_PROMPT.format(
        schema=schema_summary,
        semantic_layer=semantic_str,
    )

    try:
        result = await gemini.generate_json(
            prompt=f"User question: {question}",
            system_instruction=system_prompt,
            temperature=0.1,
        )
        return result
    except Exception:
        # Default to sql_query if classification fails
        return {"category": "sql_query", "needs_web_context": False, "search_query": None}


async def _handle_general(question: str, schema: list) -> dict:
    """Handle general/meta questions without calling any agent."""
    question_lower = question.lower().strip()

    # Handle common greetings
    greetings = ["hello", "hi", "hey", "help", "what can you do"]
    if any(g in question_lower for g in greetings):
        columns = [s["name"] for s in schema]
        answer = (
            f"👋 Hello! I'm DataTalk, your AI data analyst. I can help you analyze your dataset "
            f"which has {len(schema)} columns: {', '.join(columns[:8])}{'...' if len(columns) > 8 else ''}.\n\n"
            f"Try asking me things like:\n"
            f"• \"What is the total amount by region?\"\n"
            f"• \"Show me monthly trends\"\n"
            f"• \"Run a correlation analysis\"\n"
            f"• \"Why did transactions drop in March?\"\n"
            f"• \"What's trending in banking news?\""
        )
    elif "column" in question_lower or "schema" in question_lower or "what data" in question_lower:
        column_info = "\n".join([
            f"• **{s['name']}** ({s['type']}) — e.g., {', '.join(s['sample_values'][:2])}"
            for s in schema
        ])
        answer = f"Your dataset has {len(schema)} columns:\n{column_info}"
    else:
        answer = "I'm here to help you analyze your data! Try asking a question about your dataset."

    return {
        "agent_used": "general",
        "sql_query": None,
        "python_code": None,
        "chart": None,
        "matplotlib_image": None,
        "data": [],
        "columns_used": [],
        "row_count": 0,
        "total_rows": 0,
        "answer": answer,
    }
