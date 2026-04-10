"""
Schema extraction from pandas DataFrames.
Extracts column names, types, sample values, and missing percentages.
"""
import pandas as pd


def extract_schema(df: pd.DataFrame) -> list[dict]:
    """Extract schema information from a DataFrame."""
    schema = []
    for col in df.columns:
        col_type = _map_dtype(df[col].dtype)
        sample_vals = df[col].dropna().head(3).astype(str).tolist()
        missing_pct = round(df[col].isnull().sum() / len(df) * 100, 1)

        schema.append({
            "name": col,
            "type": col_type,
            "sample_values": sample_vals,
            "missing_pct": missing_pct,
        })
    return schema


def _map_dtype(dtype) -> str:
    """Map pandas dtype to DuckDB/SQL-friendly type name."""
    dtype_str = str(dtype)
    if "int" in dtype_str:
        return "INTEGER"
    elif "float" in dtype_str:
        return "REAL"
    elif "datetime" in dtype_str:
        return "DATETIME"
    elif "bool" in dtype_str:
        return "BOOLEAN"
    else:
        return "TEXT"


def assess_data_quality(df: pd.DataFrame) -> dict:
    """Assess overall data quality of a DataFrame."""
    total_cells = df.shape[0] * df.shape[1]
    total_missing = df.isnull().sum().sum()
    missing_pct = round(total_missing / max(total_cells, 1) * 100, 1)
    duplicate_rows = int(df.duplicated().sum())

    issues = []
    for col in df.columns:
        col_missing = round(df[col].isnull().sum() / len(df) * 100, 1)
        if col_missing > 20:
            issues.append(f"Column '{col}' has {col_missing}% missing values")

    # Overall score: 100 - missing% - (duplicates penalty)
    dup_penalty = min(10, duplicate_rows / max(len(df), 1) * 100)
    overall = round(max(0, 100 - missing_pct - dup_penalty))

    return {
        "overall_score": overall,
        "total_missing_pct": missing_pct,
        "duplicate_rows": duplicate_rows,
        "issues": issues,
    }


def suggest_metrics(df: pd.DataFrame) -> list[dict]:
    """Auto-suggest semantic layer metrics based on column names and types."""
    suggestions = []
    for col in df.columns:
        if df[col].dtype in ["int64", "float64"]:
            suggestions.append({
                "name": f"total_{col}",
                "expression": f"SUM({col})",
                "description": f"Sum of all {col} values",
            })
            suggestions.append({
                "name": f"avg_{col}",
                "expression": f"AVG({col})",
                "description": f"Average {col} value",
            })
    # Limit to top 6 suggestions
    return suggestions[:6]
