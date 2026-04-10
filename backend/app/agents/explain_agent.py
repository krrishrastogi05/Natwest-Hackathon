"""
Explain Agent: Takes raw results and produces plain English explanations
with source citations. Always runs last in the pipeline.
"""
import json
from app.utils.gemini_client import gemini


EXPLAIN_SYSTEM_PROMPT = """You are a friendly data analyst explaining results to a business user who is NOT technical.

Context:
- User asked: {question}
- Agent used: {agent_type}
- SQL query (if any): {sql_query}
- Python code (if any): {python_code_summary}
- Columns used: {columns_used}
- Row count analyzed: {row_count}
- Total rows in dataset: {total_rows}
- Web search results (if any): {web_results}

Rules:
1. Start with the DIRECT answer in the first sentence. Lead with the key number or finding.
2. Use 2-4 plain English sentences maximum.
3. NO SQL, NO Python code, NO technical jargon in the explanation.
4. Mention specific numbers and percentages — be precise.
5. If web search results are relevant, mention them briefly as corroborating context in one sentence.
6. If there's a notable outlier or trend, highlight it.
7. End with a brief actionable insight if there's one.
8. Do NOT say "Based on the data" or "According to the analysis" — just state the finding directly.
"""


async def run_explain_agent(
    question: str,
    result_data: list | str,
    agent_type: str = "sql_agent",
    sql_query: str | None = None,
    python_code: str | None = None,
    columns_used: list[str] | None = None,
    row_count: int = 0,
    total_rows: int = 0,
    web_results: list[dict] | None = None,
) -> str:
    """
    Generate a plain English explanation of the analysis results.

    Returns:
        Plain English explanation string.
    """
    # Format web results for prompt
    web_str = "None"
    if web_results:
        web_str = "\n".join([
            f"- {r['title']}: {r['snippet'][:100]}" for r in web_results[:3]
        ])

    # Format result data (truncate if too long)
    if isinstance(result_data, list):
        result_str = json.dumps(result_data[:20], indent=2)
    else:
        result_str = str(result_data)[:2000]

    # Summarize code if present (don't send full code to explain agent)
    code_summary = "N/A"
    if python_code:
        code_summary = f"Python analysis code was executed ({len(python_code)} characters)"

    system_prompt = EXPLAIN_SYSTEM_PROMPT.format(
        question=question,
        agent_type=agent_type,
        sql_query=sql_query or "N/A",
        python_code_summary=code_summary,
        columns_used=", ".join(columns_used) if columns_used else "N/A",
        row_count=row_count,
        total_rows=total_rows,
        web_results=web_str,
    )

    explanation = await gemini.generate(
        prompt=f"Analysis result:\n{result_str}",
        system_instruction=system_prompt,
        temperature=0.3,
    )

    return explanation
