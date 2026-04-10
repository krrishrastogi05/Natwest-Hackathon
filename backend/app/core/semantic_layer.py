"""
Semantic layer management.
Stores metric definitions (name → SQL expression) per session.
"""
import json


class SemanticLayerManager:
    """Manages semantic layer metric definitions."""

    def __init__(self):
        self.metrics: list[dict] = []

    def get_metrics(self) -> list[dict]:
        """Return all defined metrics."""
        return self.metrics

    def set_metrics(self, metrics: list[dict]):
        """Replace all metrics."""
        self.metrics = metrics

    def add_metric(self, name: str, expression: str, description: str = ""):
        """Add a single metric definition."""
        # Remove existing metric with same name
        self.metrics = [m for m in self.metrics if m["name"] != name]
        self.metrics.append({
            "name": name,
            "expression": expression,
            "description": description,
        })

    def remove_metric(self, name: str):
        """Remove a metric by name."""
        self.metrics = [m for m in self.metrics if m["name"] != name]

    def to_json(self) -> str:
        """Serialize to JSON string for inclusion in LLM prompts."""
        if not self.metrics:
            return "No custom metrics defined."
        return json.dumps(self.metrics, indent=2)

    def to_dict_list(self) -> list[dict]:
        """Return as list of dicts."""
        return self.metrics
