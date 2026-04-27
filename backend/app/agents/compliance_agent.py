"""
Compliance Agent — three modes:
1. pre_screen(question): blocks PII queries before any agent runs
2. post_validate(question, data, schema): annotates responses with compliance findings
3. answer_compliance_question(question, schema): RAG-based policy Q&A
"""
from typing import List, Dict, Any
from app.core.compliance_rules import check_pii_query, run_all_applicable_rules
from app.core.compliance_kb import get_compliance_kb
from app.utils.gemini_client import gemini


COMPLIANCE_QA_PROMPT = """You are a compliance expert. Evaluate the user's question or proposed scenario against the regulatory excerpts provided below.

Rules for the answer:
1. Start with the DIRECT answer in bold in the first line. Lead with the key rule or finding.
2. Use clear bullet points for the requirements.
3. NO legal jargon. Use plain, professional English.
4. If there is a clear requirement, threshold, or limit, mention it specifically.
5. End with a "**Recommendation:**" line giving clear guidance.
6. Do NOT append "(Source: ...)" to your sentences. 
7. Format as clean markdown. Use **bold** for key numbers and findings.

Regulatory excerpts:
{context}

User question: {question}

Respond ONLY with a JSON object matching this schema:
{{
  "answer": "Your beautifully formatted markdown answer based on the rules above. IMPORTANT: Use \\n for newlines, do NOT use literal newlines.",
  "violation": true or false,
  "violation_reason": "If violation is true, provide a 1-sentence summary of the violation for the alert box. Otherwise 'No violations detected. Providing requested policy information.'"
}}
"""


PRE_SCREEN_PROMPT = """You are a Zero-Trust Data Privacy Gateway (Edge AI).
Your sole purpose is to screen user inputs for sensitive personal information before they hit the cloud.

CRITICAL INSTRUCTIONS:
1. BLOCK the request ONLY if it contains highly sensitive PII:
   - Aadhaar numbers (e.g., 12-digit formats like XXXX XXXX XXXX)
   - PAN cards (e.g., formats like ABCDE1234F)
   - SSN, Passports, Credit Card numbers, CVV, or PIN codes.
2. DO NOT BLOCK normal business queries.
3. DO NOT BLOCK queries about dates, years, monetary amounts, percentages, or aggregate data.
4. DO NOT BLOCK simple numbers or IDs unless they specifically resemble the sensitive formats above.
5. If in doubt, DO NOT block. Lean towards allowing the query.

User Input: {question}

Respond ONLY with a JSON object:
{{
  "block": true or false,
  "reason": "If blocked, a professional 1-sentence explanation of what was detected and why it's blocked. Else null."
}}
"""

async def pre_screen(question: str) -> Dict | None:
    """
    Check if the question should be blocked before any agent runs.
    Uses an LLM prompt simulating a local Edge model for zero-trust PII screening.
    """
    prompt = PRE_SCREEN_PROMPT.format(question=question)
    try:
        result = await gemini.generate_json(prompt=prompt, temperature=0.0)
        if result.get("block"):
            return {
                "answer": f"⚠️ **Security Gateway Warning:** {result.get('reason', 'Sensitive data detected in prompt.')}\n\nYou may be exposing sensitive data. Are you sure you want to proceed?",
                "agent_used": "security_gateway",
                "compliance": {
                    "status": "warning",
                    "annotations": [{
                        "rule": "ZERO_TRUST_GATEWAY",
                        "status": "warning",
                        "message": result.get("reason", "Sensitive data detected.")
                    }],
                },
                "sql_query": None,
                "python_code": None,
                "chart": None,
                "matplotlib_image": None,
                "data": [],
                "confidence": {"score": 0, "level": "Low", "breakdown": {}},
                "sources": [],
                "suggestions": [],
                "from_cache": False,
            }
    except Exception:
        pass
    return None


async def post_validate(question: str, data: List[Dict], schema: List[Dict] = None) -> Dict:
    """
    Run deterministic compliance rules against the result data.
    Returns: {"status": "compliant"|"warning"|"blocked", "annotations": [...]}
    """
    annotations = run_all_applicable_rules(question, data)

    # RAG AI Compliance Check against loaded guidelines
    kb = get_compliance_kb()
    if kb.is_loaded:
        chunks = kb.retrieve(question, top_k=2)
        if chunks:
            data_sample = data[:3] if data else []
            context = "\n\n".join(f"[{c['title']}]\n{c['text']}" for c in chunks)
            prompt = f"""You are a compliance monitor. 
Review the user's question and the query results against the provided compliance guidelines.
Determine if fulfilling this query or the data itself violates any of the guidelines.

Guidelines:
{context}

User Question: {question}
Data Sample: {data_sample}

Respond ONLY with a JSON object:
{{
  "violation": true or false,
  "violated_guideline": "Name of the guideline violated, or null",
  "reason": "Short explanation of why it violates the guideline, or null"
}}
"""
            try:
                ai_check = await gemini.generate_json(prompt=prompt, temperature=0.1)
                if ai_check.get("violation"):
                    annotations.append({
                        "rule": "AI_RAG_CHECK",
                        "status": "blocked" if "block" in ai_check.get("reason", "").lower() else "warning",
                        "message": f"AI Compliance Alert ({ai_check.get('violated_guideline', 'Policy')}): {ai_check.get('reason', 'Potential violation detected.')}"
                    })
            except Exception:
                pass

    if not annotations:
        return {
            "status": "compliant",
            "annotations": [{
                "rule": "GENERAL",
                "status": "compliant",
                "message": "No compliance issues detected for this analysis.",
            }],
        }

    has_warning = any(a["status"] == "warning" for a in annotations)
    has_blocked = any(a.get("status") == "blocked" for a in annotations)
    overall = "blocked" if has_blocked else ("warning" if has_warning else "compliant")
    return {"status": overall, "annotations": annotations}


async def answer_compliance_question(question: str, schema: List[Dict] = None) -> Dict:
    """
    RAG-based compliance Q&A: retrieve relevant policy chunks + Gemini explanation.
    Used when mode == "compliance".
    """
    kb = get_compliance_kb()
    if not kb.is_loaded:
        return {
            "answer": (
                "⚠️ Compliance knowledge base is not loaded. "
                "Please ensure compliance policy documents are present in the compliance_docs directory."
            ),
            "agent_used": "compliance_agent",
            "compliance": {"status": "warning", "annotations": []},
            "sql_query": None,
            "python_code": None,
            "chart": None,
            "matplotlib_image": None,
            "data": [],
            "confidence": {"score": 30, "level": "Low", "breakdown": {}},
            "sources": [],
            "suggestions": [],
            "from_cache": False,
        }

    # Retrieve relevant policy chunks
    chunks = kb.retrieve(question, top_k=4)
    if not chunks:
        return {
            "answer": "I couldn't find relevant regulatory information for this question in the loaded policy documents.",
            "agent_used": "compliance_agent",
            "compliance": {"status": "compliant", "annotations": []},
            "sql_query": None,
            "python_code": None,
            "chart": None,
            "matplotlib_image": None,
            "data": [],
            "confidence": {"score": 40, "level": "Low", "breakdown": {}},
            "sources": [],
            "suggestions": [],
            "from_cache": False,
        }

    context = "\n\n---\n\n".join(
        f"[Source: {c['title']}]\n{c['text']}" for c in chunks
    )

    prompt = COMPLIANCE_QA_PROMPT.format(context=context, question=question)

    try:
        result = await gemini.generate_json(prompt=prompt, temperature=0.2)
        answer = result.get("answer", "Error generating answer.")
        is_violation = result.get("violation", False)
        reason = result.get("violation_reason", "No violations detected. Providing requested policy information.")
    except Exception as e:
        answer = f"Error generating compliance answer: {str(e)}"
        is_violation = False
        reason = "Error processing compliance check."

    status = "warning" if is_violation else "compliant"

    sources = [
        {"type": "policy", "value": c["title"], "url": ""}
        for c in chunks
    ]

    confidence_score = min(95, int(max(c["score"] for c in chunks) * 100) + 50)

    return {
        "answer": answer,
        "agent_used": "compliance_agent",
        "compliance": {
            "status": status,
            "annotations": [{
                "rule": "AI_RAG_CHECK",
                "status": status,
                "message": f"AI Policy Check ({', '.join(c['title'] for c in chunks[:2])}): {reason}",
            }],
        },
        "sql_query": None,
        "python_code": None,
        "chart": None,
        "matplotlib_image": None,
        "data": [],
        "confidence": {
            "score": confidence_score,
            "level": "High" if confidence_score >= 75 else "Medium",
            "breakdown": {
                "row_coverage": 0,
                "data_completeness": 100,
                "schema_match": 0,
                "web_corroboration": 0,
                "compliance_check": confidence_score,
            },
        },
        "sources": sources,
        "suggestions": [
            "What are the provisioning requirements for NPA accounts?",
            "What is the PSL target for agriculture?",
            "What transactions require a Suspicious Transaction Report?",
        ],
        "from_cache": False,
    }
