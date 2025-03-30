"""Example of using the PayPal Agent Toolkit with OpenAI."""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

from paypal_agent_toolkit.openai import PayPalToolkit
from paypal_agent_toolkit.configuration import Context

# Load environment variables
load_dotenv()

# Initialize the PayPal toolkit
paypal_toolkit = PayPalToolkit(
    client_id=os.getenv("PAYPAL_CLIENT_ID"),
    client_secret=os.getenv("PAYPAL_CLIENT_SECRET"),
)

# Get the PayPal tools
paypal_tools = paypal_toolkit.tools

# Create a tool call handler
tool_handler = paypal_toolkit.create_tool_handler()

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_conversation(prompt):
    """Run a conversation with the AI assistant."""
    
    # Start the conversation
    messages = [
        {"role": "system", "content": "You are a helpful assistant that can work with PayPal."},
        {"role": "user", "content": prompt},
    ]
    
    # Create a function to process messages
    def process_messages(messages):
        response = client.chat.completions.create(
            model="gpt-4-turbo",  # Adjust based on your needs
            messages=messages,
            tools=paypal_tools,
            tool_choice="auto",
        )
        
        response_message = response.choices[0].message
        
        # Add the assistant's message to the conversation
        messages.append(response_message.model_dump())
        
        # Check if the assistant needs to use tools
        if response_message.tool_calls:
            for tool_call in response_message.tool_calls:
                # Get function name and arguments
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                # Call the tool and get the result
                result = tool_handler(tool_call)
                
                # Add the tool result to the conversation
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": json.dumps(result),
                })
            
            # Get a new response from the assistant
            return process_messages(messages)
        
        return messages, response_message.content
    
    # Process the conversation
    updated_messages, final_response = process_messages(messages)
    
    return final_response

if __name__ == "__main__":
    # Example prompt
    prompt = "I need to create an invoice for my customer XYZ Corp. They purchased 2 hours of consulting for $150 per hour."
    
    # Run the conversation
    response = run_conversation(prompt)
    
    # Print the response
    print("\nAI Assistant Response:")
    print(response)
