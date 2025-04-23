
"""
Tool for interacting with the PayPal API.
"""

from __future__ import annotations
import json
from typing import Any, Optional, Type
from pydantic import BaseModel
from langchain.tools import BaseTool

from ..shared.api import PayPalAPI


class PayPalTool(BaseTool):
    """
    A LangChain-compatible tool that wraps a PayPal API method call.
    
    Attributes:
        paypal_api (PayPalAPI): An instance of the PayPal API client.
        method (str): The method name to invoke on the PayPal API.
        name (str): Human-readable name of the tool.
        description (str): Description of what the tool does.
        args_schema (Optional[Type[BaseModel]]): Optional argument schema for validation.
    """

    paypal_api: PayPalAPI
    method: str
    name: str = ""
    description: str = ""
    args_schema: Optional[Type[BaseModel]] = None

    def _run(self, *args: Any, **kwargs: Any) -> str:
        """
        Executes the configured PayPal API method.

        Returns:
            str: The result from the PayPal API, or an error message.
        """
        try:
            return self.paypal_api.run(self.method, kwargs)
        except Exception as e:
            return f"Error executing PayPalTool '{self.method}': {str(e)}"

    def __repr__(self):
        return f"<PayPalTool name={self.name}, method={self.method}>"

