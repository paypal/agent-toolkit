"""Toolkit for the OpenAI API."""

from typing import Dict, List, Any, Optional, Callable

from ..configuration import Context
from ..api import PayPalAPI
from .tool import create_openai_tools, handle_tool_call


class PayPalToolkit:
    """Toolkit for PayPal API integration with OpenAI."""

    _api: PayPalAPI
    _tools: List[Dict[str, Any]]
    _context: Optional[Context]

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        allowed_tools: Optional[List[str]] = None,
        context: Optional[Context] = None,
    ):
        """Initialize the PayPal toolkit."""
        self._api = PayPalAPI(client_id, client_secret, context)
        self._context = context
        self._tools = create_openai_tools(client_id, client_secret, allowed_tools, context)

    @property
    def tools(self) -> List[Dict[str, Any]]:
        """Get the OpenAI tools for this toolkit."""
        return self._tools

    def create_tool_handler(self) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
        """Create a handler for OpenAI tool calls."""
        def handler(tool_call: Dict[str, Any]) -> Dict[str, Any]:
            """Handle an OpenAI tool call."""
            return handle_tool_call(self._api, tool_call, self._context)
        
        return handler

    def register_handlers(
        self, client: Any, add_to_registry: bool = False
    ) -> Dict[str, Callable]:
        """Register handlers for OpenAI tool calls.
        
        This can be used with the OpenAI SDK to register handlers for tool calls.
        
        Args:
            client: The OpenAI client.
            add_to_registry: Whether to add the handlers to the client's tool registry.
            
        Returns:
            Dict[str, Callable]: A dictionary of tool names to handler functions.
        """
        handlers = {}
        
        for tool in self._tools:
            method = tool["function"]["name"]
            
            # Create handler for this tool
            def make_handler(method=method):
                def handler(args):
                    try:
                        # Format arguments for the PayPal API
                        formatted_args = {}
                        for key, value in args.items():
                            # Convert from camelCase to snake_case
                            snake_key = "".join(
                                ["_" + c.lower() if c.isupper() else c for c in key]
                            ).lstrip("_")
                            formatted_args[snake_key] = value
                            
                        # Call the PayPal API
                        result = self._api.run(method, **formatted_args)
                        
                        # Parse result from JSON string
                        import json
                        return json.loads(result)
                    except Exception as e:
                        return {"error": str(e)}
                    
                return handler
            
            # Add handler to dictionary
            handlers[method] = make_handler()
        
        # Add handlers to client registry if requested
        if add_to_registry:
            if hasattr(client, "register_tool"):
                for name, handler in handlers.items():
                    client.register_tool(name, handler)
            else:
                raise ValueError("Client does not support tool registration")
        
        return handlers
