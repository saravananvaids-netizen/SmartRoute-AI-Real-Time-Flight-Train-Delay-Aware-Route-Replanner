"""
SmartRoute AI - Base Transit API Client
Handles API keys from environment variables, failure timeouts, rate limits,
data source classification (Live, Cached, or Simulated Demo), and last-updated timestamps.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class BaseTransitClient(ABC):
    def __init__(self, name: str):
        self.name = name
        self.last_updated: Optional[str] = None
        self.cache: Dict[str, Any] = {}

    def get_timestamp(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    @abstractmethod
    def fetch_status(self, origin: str, destination: str, date: str) -> Dict[str, Any]:
        """Fetch transport status or schedule."""
        pass

    def wrap_response(
        self,
        data: Any,
        source: str = "Live API",
        status: str = "success",
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        self.last_updated = self.get_timestamp()
        return {
            "client": self.name,
            "status": status,
            "source": source,  # "Live API", "Cached", or "Simulated Demonstration"
            "last_updated": self.last_updated,
            "error": error_message,
            "data": data
        }
