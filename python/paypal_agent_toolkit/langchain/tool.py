"""Tools for LangChain."""

from typing import Dict, List, Any, Optional, Union, Type, Callable

from ..configuration import Context
from ..api import PayPalAPI


def create_langchain_tool(
    api: PayPalAPI,
    method: str,
    name: str,
    description: str,
    schema_class: Type,
    context: Optional[Context] = None,
) -> Dict[str, Any]:
    """Create a LangChain tool.
    
    Args:
        api: The PayPal API instance.
        method: The method name.
        name: The tool name.
        description: The tool description.
        schema_class: The schema class for the tool arguments.
        context: Optional context for the API.
        
    Returns:
        A LangChain tool definition.
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
        "args_schema": schema_class,
        "return_direct": False,
    }
    
    return tool


def create_langchain_tools(
    client_id: str,
    client_secret: str,
    allowed_tools: Optional[List[str]] = None,
    context: Optional[Context] = None,
) -> List[Dict[str, Any]]:
    """Create LangChain tools for the PayPal API.
    
    Args:
        client_id: The PayPal client ID.
        client_secret: The PayPal client secret.
        allowed_tools: Optional list of allowed tool names.
        context: Optional context for the API.
        
    Returns:
        A list of LangChain tool definitions.
    """
    from ..tools import tools as base_tools
    
    # Initialize the PayPal API
    api = PayPalAPI(client_id, client_secret, context)
    
    # Filter tools based on allowed_tools
    if allowed_tools:
        tools_to_create = [t for t in base_tools if t["method"] in allowed_tools]
    else:
        tools_to_create = base_tools
    
    # Create LangChain tools
    langchain_tools = []
    for tool in tools_to_create:
        langchain_tool = create_langchain_tool(
            api,
            tool["method"],
            tool["name"],
            tool["description"],
            tool["args_schema"],
            context,
        )
        langchain_tools.append(langchain_tool)
    
    return langchain_tools
