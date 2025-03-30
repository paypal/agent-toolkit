"""Tools for the OpenAI API."""

from typing import Dict, List, Any, Optional

from ..configuration import Context
from ..api import PayPalAPI
from ..tools import tools as base_tools


def create_openai_tool(
    tool_config: Dict[str, Any], schema_getter
) -> Dict[str, Any]:
    """Create an OpenAI tool from a tool config."""
    type_map = {
        "string": {"type": "string"},
        "integer": {"type": "integer"},
        "number": {"type": "number"},
        "boolean": {"type": "boolean"},
        "array": {"type": "array", "items": {}},
        "object": {"type": "object", "properties": {}},
    }

    def get_json_schema_for_field(field_info):
        json_schema = {}

        # Handle nested objects
        if field_info.annotation.__origin__ == dict:
            json_schema = type_map["object"].copy()
            # For simplicity, we'll treat all dict values as having arbitrary properties
            # In a production environment, you might want to define more specific schemas
            json_schema["additionalProperties"] = True
            
        # Handle arrays
        elif field_info.annotation.__origin__ == list:
            json_schema = type_map["array"].copy()
            # For simplicity, we'll treat all list items as having arbitrary types
            # In a production environment, you might want to define more specific schemas
            json_schema["items"] = {"type": "object", "additionalProperties": True}
            
        # Handle primitive types
        elif field_info.annotation == str:
            json_schema = type_map["string"].copy()
        elif field_info.annotation == int:
            json_schema = type_map["integer"].copy()
        elif field_info.annotation == float:
            json_schema = type_map["number"].copy()
        elif field_info.annotation == bool:
            json_schema = type_map["boolean"].copy()
        else:
            # Default to string for unknown types
            json_schema = type_map["string"].copy()

        # Add description if available
        if field_info.description:
            json_schema["description"] = field_info.description

        return json_schema

    schema = schema_getter(tool_config["args_schema"])
    properties = {}
    required = []
    
    # Process each field in the schema
    for name, field_info in schema["properties"].items():
        if field_info.get("title"):
            prop_name = field_info["title"]
        else:
            prop_name = name

        properties[prop_name] = get_json_schema_for_field(field_info)
        
        # Check if field is required
        if name in schema.get("required", []):
            required.append(prop_name)

    return {
        "type": "function",
        "function": {
            "name": tool_config["method"],
            "description": tool_config["description"],
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required,
            },
        },
    }


def format_tool_args(args: Dict[str, Any]) -> Dict[str, Any]:
    """Format tool arguments for the PayPal API."""
    formatted_args = {}
    for key, value in args.items():
        # Convert keys from camelCase to snake_case
        snake_key = "".join(
            ["_" + c.lower() if c.isupper() else c for c in key]
        ).lstrip("_")
        formatted_args[snake_key] = value
    return formatted_args


def create_openai_tools(
    client_id: str,
    client_secret: str,
    allowed_tools: Optional[List[str]] = None,
    context: Optional[Context] = None,
) -> List[Dict[str, Any]]:
    """Create OpenAI tools for the PayPal API."""
    
    def get_schema(schema_class):
        # This is a simplified schema retrieval for this example
        # In a real implementation, you would use schema_class.schema() and process it
        fields = {}
        for name, field in schema_class.__fields__.items():
            fields[name] = field
        return {"properties": fields, "required": schema_class.__fields_set__}
    
    tools_to_create = []
    
    if allowed_tools:
        # Filter tools based on allowed_tools
        for tool in base_tools:
            if tool["method"] in allowed_tools:
                tools_to_create.append(tool)
    else:
        # Use all tools
        tools_to_create = base_tools
    
    # Create OpenAI tools
    openai_tools = []
    for tool in tools_to_create:
        openai_tool = create_openai_tool(tool, get_schema)
        openai_tools.append(openai_tool)
    
    return openai_tools


def handle_tool_call(
    api: PayPalAPI, tool_call: Dict[str, Any], context: Optional[Context] = None
) -> Dict[str, Any]:
    """Handle a tool call from the OpenAI API."""
    # Extract the tool name and arguments
    method = tool_call["function"]["name"]
    args = tool_call["function"]["arguments"]
    
    # Parse arguments from JSON string if needed
    if isinstance(args, str):
        import json
        try:
            args = json.loads(args)
        except json.JSONDecodeError:
            return {"error": "Invalid JSON in tool arguments"}
    
    # Format arguments for the PayPal API
    formatted_args = format_tool_args(args)
    
    try:
        # Run the tool
        result = api.run(method, **formatted_args)
        
        # Parse result from JSON string
        import json
        result_obj = json.loads(result)
        
        return result_obj
    except Exception as e:
        return {"error": str(e)}
