from typing import Optional, Dict, Any

class Context:
    def __init__(
        self,
        merchant_id: Optional[str] = None,
        sandbox: Optional[bool] = None,
        access_token: Optional[str] = None,
        request_id: Optional[str] = None,
        tenant_context: Optional[Any] = None,
        debug: Optional[bool] = None,
        **kwargs: Any
    ):
        self.merchant_id = merchant_id
        self.sandbox = sandbox or False
        self.access_token = access_token
        self.request_id = request_id
        self.tenant_context = tenant_context
        self.debug = debug or False
        self.extra = kwargs

class Configuration:
    def __init__(self, actions: Dict[str, Dict[str, bool]], context: Optional[Context] = None):
        self.actions = actions
        self.context = context

def is_tool_allowed(tool: Dict[str, Dict[str, Dict[str, bool]]], configuration: Configuration) -> bool:
    for product, product_actions in tool.get("actions", {}).items():
        for action, allowed in product_actions.items():
            if configuration.actions.get(product, {}).get(action, False):
                return True
    return False