"""Tools for CrewAI."""

from typing import Dict, List, Any, Optional, Union, Type, Callable

from ..configuration import Context
from ..api import PayPalAPI


def create_crewai_tool(
    api: PayPalAPI,
    method: str,
    name: str,
    description: str,
    context: Optional[Context] = None,
) -> Dict[str, Any]:
    """Create a CrewAI tool.
    
    Args:
        api: The PayPal API instance.
        method: The method name.
        name: The tool name.
        description: The tool description.
        context: Optional context for the API.
        
    Returns:
        A CrewAI tool definition.
    """
    # Define a function that will be called when the tool is used
    def run_tool(*args, **kwargs) -> str:
        try:
            # Format arguments and call the API
            result = api.run(method, **kwargs)
            return result
        except Exception as e:
            return f"Error: {str(e)}"
    
    # Create the tool
    tool = {
        "func": run_tool,
        "name": name,
        "description": description,
    }
    
    return tool


def create_crewai_tools(
    client_id: str,
    client_secret: str,
    allowed_tools: Optional[List[str]] = None,
    context: Optional[Context] = None,
) -> List[Dict[str, Any]]:
    """Create CrewAI tools for the PayPal API.
    
    Args:
        client_id: The PayPal client ID.
        client_secret: The PayPal client secret.
        allowed_tools: Optional list of allowed tool names.
        context: Optional context for the API.
        
    Returns:
        A list of CrewAI tool definitions.
    """
    from ..tools import tools as base_tools
    
    # Initialize the PayPal API
    api = PayPalAPI(client_id, client_secret, context)
    
    # Filter tools based on allowed_tools
    if allowed_tools:
        tools_to_create = [t for t in base_tools if t["method"] in allowed_tools]
    else:
        tools_to_create = base_tools
    
    # Create CrewAI tools
    crewai_tools = []
    for tool in tools_to_create:
        crewai_tool = create_crewai_tool(
            api,
            tool["method"],
            tool["name"],
            tool["description"],
            context,
        )
        crewai_tools.append(crewai_tool)
    
    return crewai_tools
