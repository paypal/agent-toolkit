#!/usr/bin/env python3
"""
Validation script for PayPal MCP Server configuration
"""

import json
import sys
from pathlib import Path

def validate_server_json():
    """Validate the server.json file structure and required fields"""
    try:
        server_json_path = Path(__file__).parent / "server.json"

        with open(server_json_path, 'r') as f:
            data = json.load(f)

        print('✅ server.json is valid JSON')

        # Check required fields
        required_fields = ['name', 'namespace', 'description', 'version', 'deployment']
        missing = [field for field in required_fields if field not in data]

        if missing:
            print(f'❌ Missing required fields: {missing}')
            return False

        print('✅ All required fields present')

        # Check deployment structure
        if 'remote' in data['deployment']:
            remote = data['deployment']['remote']
            if 'url' in remote and 'transport' in remote:
                print('✅ Remote deployment configuration valid')
            else:
                print('❌ Missing url or transport in remote deployment')
                return False

        # Validate PayPal-specific fields
        if data['name'] != 'paypal-mcp':
            print('❌ Server name should be "paypal-mcp"')
            return False

        if 'paypal' not in data['keywords']:
            print('❌ Missing "paypal" in keywords')
            return False

        print('✅ PayPal MCP server.json validation passed')
        return True

    except json.JSONDecodeError as e:
        print(f'❌ Invalid JSON: {e}')
        return False
    except Exception as e:
        print(f'❌ Validation error: {e}')
        return False

if __name__ == "__main__":
    success = validate_server_json()
    sys.exit(0 if success else 1)