"""PayPal Agentic Toolkit."""
from typing import List
from agents import FunctionTool
from pydantic import PrivateAttr
from ..shared.tools import tools
from ..openai.tool import PayPalTool
from ..shared.paypal_client import PayPalClient
from ..shared.configuration import Configuration, is_tool_allowed
from ..shared.api import PayPalAPI

class PayPalToolkit:

    _tools: List[FunctionTool] = PrivateAttr(default=[])
    _openai_tools = []
    _paypal_api: PayPalAPI = PrivateAttr(default=None)
    SOURCE = "OPEN-AI"

    def __init__(self, client_id, secret, configuration: Configuration):
        self.configuration = configuration
        
        self.context = configuration.context if configuration and configuration.context else Configuration.Context.default()
        self.context.source = self.SOURCE
        self._paypal_api = PayPalAPI(client_id=client_id, secret=secret, context=self.context)

        filtered_tools = [
            tool for tool in tools if is_tool_allowed(tool, configuration)
        ]

        self._tools = [
            PayPalTool(self._paypal_api, tool)
            for tool in filtered_tools
        ]
  
        self._openai_tools = [
            {
                "type": "function",
                "function": {
                    "name": tool["method"],
                    "description": tool["description"],
                    "parameters": tool["args_schema"].model_json_schema(),
                }
            }
            for tool in filtered_tools
        ]
        
    def get_openai_chat_tools(self):
        """Get the tools in the openai chat assistant."""
        return self._openai_tools
    
    def get_paypal_api(self):
        return self._paypal_api
    
    def get_tools(self) -> List[FunctionTool]:
        """Get the tools in the openai agent."""
        return self._tools
