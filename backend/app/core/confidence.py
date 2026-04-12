"""
Confidence Score Calculator.
Measures answer reliability across 4 weighted dimensions:
  - Row coverage (30%): How many rows contributed to the answer
  - Data completeness (30%): Missing value ratio in used columns
  - Schema match (20%): Did the question map to known columns?
  - Web corroboration (20%): Were relevant web results found?
"""
from typing import Optional


def calculate_confidence(
    rows_used: int = 0,
    total_rows: int = 0,
    columns_used: list[str] | None = None,
    schema: list[dict] | None = None,
    question: str = "",
    web_results: list[dict] | None = None,
    sql_query: str | None = None,
    null_counts: dict[str, int] | None = None,
    sql_error: str | None = None,
) -> dict:
    """
    Calculate a confidence score for an answer.

    Returns:
        Dict with score (0-100), level (High/Medium/Low), and breakdown.
    """
    if not columns_used:
        columns_used = []
    if not schema:
        schema = []

    # If there was a SQL error, very low confidence
    if sql_error:
        return {
            "score": 15,
            "level": "Low",
            "breakdown": {
                "row_coverage": 0,
                "data_completeness": 0,
                "schema_match": 10,
                "web_corroboration": 0,
            },
        }

    # 1. Row Coverage (30% weight)
    # DIAGNOSTIC: Cap score if coverage is extremely low on large datasets
    if total_rows > 0:
        coverage_ratio = rows_used / total_rows
        row_score = min(1.0, coverage_ratio) * 100
        if total_rows > 1000 and coverage_ratio < 0.01:
            row_score *= 0.8  # Penalty for extremely specific filters without explanation
    else:
        row_score = 0

    # 2. Data Completeness (30% weight)
    # Using real-time null counts from the result set if provided
    if columns_used and null_counts is not None and rows_used > 0:
        completeness_pcts = []
        for col in columns_used:
            nulls = null_counts.get(col, 0)
            completeness_pcts.append(max(0, 100 - (nulls / rows_used * 100)))
        completeness_score = sum(completeness_pcts) / len(completeness_pcts)
    elif columns_used and schema:
        # Fallback to global schema metadata
        schema_map = {col["name"].lower(): col for col in schema}
        missing_pcts = [schema_map.get(c.lower(), {}).get("missing_pct", 0) for c in columns_used]
        completeness_score = max(0, 100 - (sum(missing_pcts) / max(len(missing_pcts), 1)))
    else:
        completeness_score = 50

    # 3. Schema Match (20% weight)
    # Reward explicit SQL patterns (CAST, AS, COALESCE)
    schema_score = 60  # Base score for valid column mapping
    if sql_query:
        sql_upper = sql_query.upper()
        if "CAST(" in sql_upper: schema_score += 15
        if " AS " in sql_upper: schema_score += 15
        if "COALESCE(" in sql_upper: schema_score += 10
        schema_score = min(100, schema_score)
    elif columns_used:
        known_columns = {col["name"].lower() for col in schema}
        matched = sum(1 for c in columns_used if c.lower() in known_columns)
        schema_score = (matched / max(len(columns_used), 1)) * 100

    # 4. Web Corroboration (20% weight)
    # Reward specific, well-defined questions that have external analogues
    web_score = 0
    question_lower = question.lower()
    
    # Specificity bonus (presence of dates, years, or specific metrics)
    has_date = any(char.isdigit() for char in question) # Very basic check for year/date
    is_proprietary = any(kw in question_lower for kw in ["my", "internal", "id", "customer", "transaction"])
    
    if web_results:
        web_score = min(100, len(web_results) * 30)
        if has_date: web_score = min(100, web_score + 10)
    
    # If question is proprietary, corroboration stays naturally low; cap it unless web context exists
    if is_proprietary and not web_results:
        web_score = min(40, web_score)

    # Weighted total
    total = (
        row_score * 0.30
        + completeness_score * 0.30
        + schema_score * 0.20
        + web_score * 0.20
    )

    # Determine level
    if total >= 80: level = "High"
    elif total >= 55: level = "Medium"
    else: level = "Low"

    return {
        "score": round(total),
        "level": level,
        "breakdown": {
            "row_coverage": round(row_score),
            "data_completeness": round(completeness_score),
            "schema_match": round(schema_score),
            "web_corroboration": round(web_score),
        },
    }
