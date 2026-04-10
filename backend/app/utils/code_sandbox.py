"""
Sandboxed Python code execution.
Runs LLM-generated code with restricted imports and 30s timeout.
"""
import io
import sys
import base64
import traceback
import threading
from contextlib import redirect_stdout, redirect_stderr
from typing import Any


# Maximum execution time (seconds)
MAX_EXECUTION_TIME = 30


class CodeExecutionResult:
    """Result of sandboxed code execution."""
    def __init__(self):
        self.stdout: str = ""
        self.stderr: str = ""
        self.figures: list[str] = []  # base64 PNG strings
        self.error: str | None = None
        self.success: bool = False


def execute_code(code: str, dataframe=None) -> CodeExecutionResult:
    """
    Execute Python code in a sandboxed environment.

    Args:
        code: Python code string to execute.
        dataframe: pandas DataFrame to make available as 'df'.

    Returns:
        CodeExecutionResult with stdout, figures, and error info.
    """
    result = CodeExecutionResult()

    # Prepare the execution namespace
    import pandas as pd
    import numpy as np

    namespace = {
        "__builtins__": _get_safe_builtins(),
        "pd": pd,
        "np": np,
        "df": dataframe,
        "_figures": [],  # Code appends base64 figures here
    }

    # Add optional imports
    try:
        import matplotlib
        matplotlib.use("Agg")  # Non-interactive backend
        import matplotlib.pyplot as plt
        plt.style.use("dark_background")
        namespace["matplotlib"] = matplotlib
        namespace["plt"] = plt
    except ImportError:
        pass

    try:
        import seaborn as sns
        namespace["sns"] = sns
        namespace["seaborn"] = sns
    except ImportError:
        pass

    try:
        import scipy
        import scipy.stats
        namespace["scipy"] = scipy
    except ImportError:
        pass

    try:
        from sklearn import preprocessing, cluster
        import sklearn
        namespace["sklearn"] = sklearn
    except ImportError:
        pass

    # Add helper modules
    namespace["io"] = io
    namespace["base64"] = base64
    namespace["json"] = __import__("json")
    namespace["math"] = __import__("math")
    namespace["re"] = __import__("re")
    namespace["datetime"] = __import__("datetime")
    namespace["collections"] = __import__("collections")
    namespace["statistics"] = __import__("statistics")

    # Capture stdout and stderr
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()

    # Execute with timeout using a daemon thread
    execution_error = [None]
    execution_done = threading.Event()

    def run_code():
        try:
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                exec(code, namespace)
        except Exception as e:
            execution_error[0] = f"{type(e).__name__}: {str(e)}"
        finally:
            execution_done.set()

    thread = threading.Thread(target=run_code, daemon=True)
    thread.start()
    thread.join(timeout=MAX_EXECUTION_TIME)

    if thread.is_alive():
        result.error = f"Code execution timed out after {MAX_EXECUTION_TIME} seconds."
        result.success = False
        return result

    # Collect results
    result.stdout = stdout_capture.getvalue()
    result.stderr = stderr_capture.getvalue()
    result.figures = namespace.get("_figures", [])
    result.error = execution_error[0]
    result.success = execution_error[0] is None

    # Auto-capture any open matplotlib figures not manually saved
    try:
        import matplotlib.pyplot as plt
        for fig_num in plt.get_fignums():
            fig = plt.figure(fig_num)
            buf = io.BytesIO()
            fig.savefig(
                buf, format="png", dpi=150, bbox_inches="tight",
                facecolor="#111827", edgecolor="none",
            )
            buf.seek(0)
            result.figures.append(base64.b64encode(buf.read()).decode())
            plt.close(fig)
    except Exception:
        pass

    return result


def _get_safe_builtins() -> dict:
    """Return a restricted set of Python builtins (no open/exec/eval/import)."""
    import builtins
    safe = {}
    allowed = [
        "abs", "all", "any", "bool", "chr", "dict", "dir",
        "divmod", "enumerate", "filter", "float", "format",
        "frozenset", "getattr", "hasattr", "hash", "hex",
        "int", "isinstance", "issubclass", "iter", "len",
        "list", "map", "max", "min", "next", "oct", "ord",
        "pow", "print", "range", "repr", "reversed", "round",
        "set", "slice", "sorted", "str", "sum", "super",
        "tuple", "type", "vars", "zip",
        "True", "False", "None",
        "Exception", "ValueError", "TypeError", "KeyError",
        "IndexError", "RuntimeError", "StopIteration",
        "ZeroDivisionError", "AttributeError",
    ]
    for name in allowed:
        if hasattr(builtins, name):
            safe[name] = getattr(builtins, name)

    # Explicitly block: open, exec, eval, compile, __import__, input, exit, quit
    return safe
