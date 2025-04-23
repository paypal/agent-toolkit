"""
PayPal Agent Toolkit for CrewAI.
"""

from typing import List, Optional
from pydantic import PrivateAttr, BaseModel

from ..shared.api import PayPalAPI
from ..shared.tools import tools
from ..shared.configuration import Configuration, is_tool_allowed
from .tool import PayPalTool


class PayPalToolkit:
    _tools: List = PrivateAttr()
    SOURCE = "CREWAI"
    def __init__(
        self, client_id: str, secret: str, configuration: Optional[Configuration] = None
    ):
        super().__init__()
        self._tools = []
        self.context = configuration.context if configuration and configuration.context else Configuration.Context.default()
        self.context.source = self.SOURCE
        paypal_api = PayPalAPI(client_id=client_id, secret=secret, context=self.context)

        filtered_tools = [
            tool for tool in tools if is_tool_allowed(tool, configuration)
        ]
        for tool in filtered_tools:
            args_schema = tool.get("args_schema")
    
            # Validate it's a subclass of BaseModel
            if args_schema and not issubclass(args_schema, BaseModel):
                raise TypeError(f"args_schema for '{tool['method']}' must be a Pydantic BaseModel")

            self._tools.append(
                PayPalTool(
                    name=tool["method"],
                    description=tool["description"],
                    method=tool["method"],
                    paypal_api=paypal_api,
                    args_schema=args_schema,
                )
            )

    def get_tools(self) -> List:
        """Return a list of enabled PayPal tools."""
        return self._tools
