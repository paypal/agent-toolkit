"""PayPal Agentic Tools."""
import json
from agents import FunctionTool
from agents.run_context import RunContextWrapper

from paypal_agent_toolkit.common.api import PayPalAPI

def PayPalTool(api: PayPalAPI, tool) -> FunctionTool:
    async def on_invoke_tool(ctx: RunContextWrapper, input_str: str) -> str:
        return api.run(tool["method"], input_str)

    parameters = tool["args_schema"]

    # Enforce schema constraints
    parameters.update({
        "additionalProperties": False,
        "type": "object"
    })

    # Remove unnecessary metadata
    for key in ["description", "title"]:
        parameters.pop(key, None)

    # Clean up properties if they exist
    for prop in parameters.get("properties", {}).values():
        for key in ["title", "default"]:
            prop.pop(key, None)

    return FunctionTool(
        name=tool["method"],
        description=tool["description"],
        params_json_schema=parameters,
        on_invoke_tool=on_invoke_tool,
        strict_json_schema=False
    )