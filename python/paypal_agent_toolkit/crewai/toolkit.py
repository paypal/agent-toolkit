"""Toolkit for CrewAI."""

from typing import Dict, List, Any, Optional, Union

from ..configuration import Context
from .tool import create_crewai_tools


class PayPalToolkit:
    """Toolkit for PayPal API integration with CrewAI."""

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
        self._tools = create_crewai_tools(client_id, client_secret, allowed_tools, context)

    @property
    def tools(self) -> List[Dict[str, Any]]:
        """Get the CrewAI tools for this toolkit."""
        return self._tools

    def get_tools(self) -> List[Any]:
        """Get the CrewAI tools for this toolkit.
        
        Returns:
            A list of CrewAI tool objects.
        """
        try:
            # Try to import CrewAI
            from crewai.tools import Tool
            
            # Convert our tool definitions to CrewAI Tool objects
            crew_tools = []
            for tool in self._tools:
                crew_tool = Tool(
                    name=tool["name"],
                    description=tool["description"],
                    func=tool["func"],
                )
                crew_tools.append(crew_tool)
            
            return crew_tools
        except ImportError:
            raise ImportError(
                "CrewAI is required to use this toolkit. "
                "Please install it with `pip install crewai`."
            )
