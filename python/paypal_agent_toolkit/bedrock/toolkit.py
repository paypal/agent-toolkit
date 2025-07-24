from typing import List, Dict, Any
from pydantic import PrivateAttr
from ..shared.api import PayPalAPI
from ..shared.tools import tools
from ..shared.configuration import Configuration, is_tool_allowed

class BedrockTool:
    def __init__(self, name: str, description: str, inputSchema: Dict[str, Any]):
        self.toolSpec = {
            "name": name,
            "description": description,
            "inputSchema": {
                "json": inputSchema
            }
        }

class BedrockToolBlock:
    def __init__(self, toolUseId: str, name: str, input: Any):
        self.toolUseId = toolUseId
        self.name = name
        self.input = input

class BedrockToolResult:
    def __init__(self, toolUseId: str, content: List[Dict[str, Any]]):
        self.toolUseId = toolUseId
        self.content = content


class PayPalToolkit:
    """Toolkit for interacting with the PayPal API via tools."""

    _tools: List = PrivateAttr(default=[])
    _paypal_api: PayPalAPI = PrivateAttr(default=None)
    SOURCE = "BEDROCK"

    def __init__(self, client_id, secret, configuration: Configuration):
        super().__init__()
        self.configuration = configuration
        self.context = configuration.context if configuration and configuration.context else Configuration.Context.default()
        self.context.source = self.SOURCE
        self._paypal_api = PayPalAPI(client_id=client_id, secret=secret, context=self.context)

        filtered_tools = [
            tool for tool in tools if is_tool_allowed(tool, configuration)
        ]

        self._tools = [{
                "toolSpec": {
                    "name": tool["method"],
                    "description": tool["description"],
                    "inputSchema": {
                        "json": tool["args_schema"].model_json_schema()
                    }
                }
            }
            for tool in filtered_tools
        ]

    def get_tools(self) -> List[BedrockTool]:
        return self._tools

    async def handle_tool_call(self, tool_call: BedrockToolBlock) -> BedrockToolResult:
        try: 
            response = self._paypal_api.run(tool_call.name, tool_call.input)
            return BedrockToolResult(
                toolUseId=tool_call.toolUseId,
                content=[{"text": response}]
            )
        except Exception as e:
            print(f"Error handling tool call: {e}")
            