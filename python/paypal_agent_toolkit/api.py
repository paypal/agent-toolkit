"""Util that calls PayPal."""

from __future__ import annotations

import json
import requests
from typing import Optional
from pydantic import BaseModel

from .configuration import Context

from .functions import (
    create_invoice,
    list_invoices,
    send_invoice,
    send_invoice_reminder,
    cancel_sent_invoice,
    create_product,
    list_products,
    update_product,
    create_subscription_plan,
    list_subscription_plans,
)


class PayPalAPI(BaseModel):
    """Wrapper for PayPal API"""

    _context: Context
    _client_id: str
    _client_secret: str
    _access_token: Optional[str] = None

    def __init__(self, client_id: str, client_secret: str, context: Optional[Context] = None):
        super().__init__()

        self._context = context if context is not None else Context()
        self._client_id = client_id
        self._client_secret = client_secret
        
        # In a real implementation, we would fetch and store an access token here
        self._access_token = self._get_access_token()

    def _get_access_token(self) -> str:
        """
        Get an access token from PayPal.
        In a real implementation, this would make an actual API call to obtain a token.
        """
        # Placeholder for actual token retrieval
        return "ACCESS_TOKEN_PLACEHOLDER"

    def run(self, method: str, *args, **kwargs) -> str:
        """
        Run a method with the given arguments.
        
        Args:
            method: The method to run.
            *args: Positional arguments to pass to the method.
            **kwargs: Keyword arguments to pass to the method.
            
        Returns:
            str: The result of the method call, serialized as JSON.
        """
        # Check if access token is still valid, refresh if needed
        # In a real implementation, token validity would be checked
        if not self._access_token:
            self._access_token = self._get_access_token()
        
        # Route the method call to the appropriate function
        if method == "create_invoice":
            return json.dumps(create_invoice(self._context, *args, **kwargs))
        elif method == "list_invoices":
            return json.dumps(list_invoices(self._context, *args, **kwargs))
        elif method == "send_invoice":
            return json.dumps(send_invoice(self._context, *args, **kwargs))
        elif method == "send_invoice_reminder":
            return json.dumps(send_invoice_reminder(self._context, *args, **kwargs))
        elif method == "cancel_sent_invoice":
            return json.dumps(cancel_sent_invoice(self._context, *args, **kwargs))
        elif method == "create_product":
            return json.dumps(create_product(self._context, *args, **kwargs))
        elif method == "list_products":
            return json.dumps(list_products(self._context, *args, **kwargs))
        elif method == "update_product":
            return json.dumps(update_product(self._context, *args, **kwargs))
        elif method == "create_subscription_plan":
            return json.dumps(create_subscription_plan(self._context, *args, **kwargs))
        elif method == "list_subscription_plans":
            return json.dumps(list_subscription_plans(self._context, *args, **kwargs))
        else:
            raise ValueError(f"Invalid method {method}")
