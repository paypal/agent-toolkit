"""
This tool allows agents to interact with the PayPal API.
"""

from __future__ import annotations

from typing import Any, Optional, Type
from pydantic import BaseModel

from crewai_tools import BaseTool
from ..shared.api import PayPalAPI


class PayPalTool(BaseTool):
    """CrewAI-compatible tool for interacting with the PayPal API."""

    paypal_api: PayPalAPI
    method: str
    name: str = ""
    description: str = ""
    args_schema: Optional[Type[BaseModel]] = None

    def _run(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> str:
        """Use the PayPal API to run an operation."""
        return self.paypal_api.run(self.method, kwargs)
