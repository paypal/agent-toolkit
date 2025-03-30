"""Toolkit for LangChain."""

from typing import Dict, List, Any, Optional, Union

from ..configuration import Context
from .tool import create_langchain_tools


class PayPalToolkit:
    """Toolkit for PayPal API integration with LangChain."""

    _tools: List[Dict[str, Any]]

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        allowed_tools: Optional[List[str]] = None,
        context: Optional[Context] = None,
    ):
        """Initialize the PayPal toolkit.
        
        Args:
            client_id: The PayPal client ID.
            client_secret: The PayPal client secret.
            allowed_tools: Optional list of allowed tool names.
            context: Optional context for the API.
        """
        self._tools = create_langchain_tools(client_id, client_secret, allowed_tools, context)

    @property
    def tools(self) -> List[Dict[str, Any]]:
        """Get the LangChain tools for this toolkit."""
        return self._tools

    def get_tools(self) -> List[Any]:
        """Get the LangChain tools for this toolkit.
        
        Returns:
            A list of LangChain tool objects.
        """
        try:
            # Try to import LangChain
            from langchain.tools import Tool
            
            # Convert our tool definitions to LangChain Tool objects
            lc_tools = []
            for tool in self._tools:
                lc_tool = Tool(
                    name=tool["name"],
                    description=tool["description"],
                    func=tool["func"],
                    args_schema=tool["args_schema"],
                    return_direct=tool["return_direct"],
                )
                lc_tools.append(lc_tool)
            
            return lc_tools
        except ImportError:
            raise ImportError(
                "LangChain is required to use this toolkit. "
                "Please install it with `pip install langchain`."
            )
