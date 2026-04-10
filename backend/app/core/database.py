"""
DuckDB persistent database manager.
Each session gets its own .duckdb file — survives server restarts.
Far faster than SQLite for analytical queries on uploaded CSVs.
"""
import os
import duckdb
import pandas as pd
from typing import Any

os.makedirs("sessions", exist_ok=True)


class DatabaseManager:
    """Manages per-session DuckDB databases stored as .duckdb files."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.db_path = f"sessions/{session_id}.duckdb"
        self.connection = duckdb.connect(self.db_path)
        self.table_name = "data"

    def load_dataframe(self, df: pd.DataFrame, table_name: str = "data"):
        """Load a pandas DataFrame into DuckDB as a persistent table."""
        self.table_name = table_name
        # Register DataFrame as a temporary view, then persist as a real table
        self.connection.register("_df_temp", df)
        self.connection.execute(f"DROP TABLE IF EXISTS {table_name}")
        self.connection.execute(f"CREATE TABLE {table_name} AS SELECT * FROM _df_temp")
        self.connection.unregister("_df_temp")

    def execute_query(self, sql: str) -> dict[str, Any]:
        """Execute a SQL query and return results."""
        try:
            result = self.connection.execute(sql)
            columns = [desc[0] for desc in result.description] if result.description else []
            rows = result.fetchall()
            data = [dict(zip(columns, row)) for row in rows]
            return {
                "success": True,
                "data": data,
                "columns": columns,
                "row_count": len(data),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data": [],
                "columns": [],
                "row_count": 0,
            }

    def get_row_count(self) -> int:
        """Get total row count of the main table."""
        try:
            result = self.connection.execute(f"SELECT COUNT(*) FROM {self.table_name}")
            return result.fetchone()[0]
        except Exception:
            return 0

    def close(self):
        """Close the DuckDB connection."""
        try:
            self.connection.close()
        except Exception:
            pass

    def delete_file(self):
        """Delete the .duckdb file on session cleanup."""
        try:
            if os.path.exists(self.db_path):
                os.remove(self.db_path)
            # DuckDB may also create a .duckdb.wal write-ahead log
            wal_path = self.db_path + ".wal"
            if os.path.exists(wal_path):
                os.remove(wal_path)
        except Exception:
            pass
