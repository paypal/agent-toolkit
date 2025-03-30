from typing import Literal, Optional
from typing_extensions import TypedDict

# Define Object type
Object = Literal[
    "invoices",
    "products",
    "subscription_plans",
]


# Define Permission type
class Permission(TypedDict, total=False):
    create: Optional[bool]
    update: Optional[bool]
    read: Optional[bool]
    send: Optional[bool]
    cancel: Optional[bool]
    remind: Optional[bool]


# Define Actions type
class Actions(TypedDict, total=False):
    invoices: Optional[Permission]
    products: Optional[Permission]
    subscription_plans: Optional[Permission]


# Define Context type
class Context(TypedDict, total=False):
    merchant_id: Optional[str]


# Define Configuration type
class Configuration(TypedDict, total=False):
    actions: Optional[Actions]
    context: Optional[Context]


def is_tool_allowed(tool, configuration):
    for resource, permissions in tool.get("actions", {}).items():
        if resource not in configuration.get("actions", {}):
            return False
        for permission in permissions:
            if (
                not configuration["actions"]
                .get(resource, {})
                .get(permission, False)
            ):
                return False
    return True
