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

    # If there was a SQL error, low confidence
    if sql_error:
        return {
            "score": 20,
            "level": "Low",
            "breakdown": {
                "row_coverage": 0,
                "data_completeness": 0,
                "schema_match": 20,
                "web_corroboration": 0,
            },
        }

    # 1. Row Coverage (30% weight)
    if total_rows > 0:
        coverage_ratio = min(1.0, rows_used / total_rows)
        row_score = coverage_ratio * 100
    else:
        row_score = 0

    # 2. Data Completeness (30% weight)
    if columns_used and schema:
        schema_map = {col["name"].lower(): col for col in schema}
        missing_pcts = []
        for col_name in columns_used:
            col_info = schema_map.get(col_name.lower(), {})
            missing_pcts.append(col_info.get("missing_pct", 0))
        avg_missing = sum(missing_pcts) / max(len(missing_pcts), 1)
        completeness_score = max(0, 100 - avg_missing)
    else:
        completeness_score = 50  # Default when unknown

    # 3. Schema Match (20% weight)
    if columns_used:
        known_columns = {col["name"].lower() for col in schema}
        matched = sum(1 for c in columns_used if c.lower() in known_columns)
        schema_score = (matched / max(len(columns_used), 1)) * 100
    else:
        # Check if any schema column names appear in the question
        question_lower = question.lower()
        matches = sum(1 for col in schema if col["name"].lower() in question_lower)
        schema_score = min(100, matches * 25) if matches else 30

    # 4. Web Corroboration (20% weight)
    web_score = 0
    if web_results:
        # Each relevant article adds 25%, max 100%
        web_score = min(100, len(web_results) * 25)

    # Weighted total
    total = (
        row_score * 0.30
        + completeness_score * 0.30
        + schema_score * 0.20
        + web_score * 0.20
    )

    # Determine level
    if total >= 75:
        level = "High"
    elif total >= 50:
        level = "Medium"
    else:
        level = "Low"

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
