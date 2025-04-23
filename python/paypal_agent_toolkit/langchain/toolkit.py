"""PayPal Agent Toolkit."""

from typing import List, Optional
from pydantic import PrivateAttr

from ..shared.api import PayPalAPI
from ..shared.tools import tools
from ..shared.configuration import Configuration, Context, is_tool_allowed
from .tool import PayPalTool


class PayPalToolkit:
    """Toolkit for interacting with the PayPal API via tools."""

    _tools: List = PrivateAttr(default=[])
    SOURCE = "LANGCHAIN"
    def __init__(self, client_id, secret, configuration: Configuration):
        super().__init__()
        self.configuration = configuration
        self.context = configuration.context if configuration and configuration.context else Configuration.Context.default()
        self.context.source = self.SOURCE
        self._paypal_api = PayPalAPI(client_id=client_id, secret=secret, context=self.context)

        filtered_tools = [
            tool for tool in tools if is_tool_allowed(tool, configuration)
        ]

        self._tools = [
            PayPalTool(
                name=tool["method"],
                description=tool["description"],
                method=tool["method"],
                paypal_api=self._paypal_api, 
                args_schema=tool.get("args_schema"),
            )
            for tool in filtered_tools
        ]

    def get_tools(self) -> List[PayPalTool]:
        """Return a list of available PayPal tools."""
        return self._tools

    def get_paypal_api(self) -> PayPalAPI:
        """Expose the underlying PayPal API client."""
        return self._paypal_api
