"""
File upload handler. Parses CSV, Excel, JSON, and TSV files into pandas DataFrames.
"""
import io
import os
import pandas as pd
from fastapi import UploadFile


ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json", ".tsv"}
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))


async def parse_upload(file: UploadFile) -> pd.DataFrame:
    """Parse an uploaded file into a pandas DataFrame."""
    # Validate extension
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {ext}. Please upload CSV, Excel, JSON, or TSV."
        )

    # Read file content
    content = await file.read()

    # Validate size
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise ValueError(
            f"File too large: {size_mb:.1f}MB. Maximum is {MAX_FILE_SIZE_MB}MB."
        )

    # Parse based on extension
    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(content))
        elif ext == ".tsv":
            df = pd.read_csv(io.BytesIO(content), sep="\t")
        elif ext in (".xlsx", ".xls"):
            df = pd.read_excel(io.BytesIO(content))
        elif ext == ".json":
            df = pd.read_json(io.BytesIO(content))
        else:
            raise ValueError(f"Unsupported format: {ext}")
    except Exception as e:
        raise ValueError(
            f"Failed to parse file: {str(e)}. Make sure the file has headers in the first row."
        )

    if df.empty:
        raise ValueError("The uploaded file is empty.")

    # Clean column names: strip whitespace, replace spaces with underscores, lowercase
    df.columns = [str(col).strip().replace(" ", "_").lower() for col in df.columns]

    # Drop fully empty columns
    df = df.dropna(axis=1, how="all")

    return df
