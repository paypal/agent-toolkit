# PayPal Agent Toolkit Examples

This example demonstrates how to use the PayPal Agentic Toolkit integrated with OpenAI, LangChain, and CrewAI to manage PayPal transactions through AI-powered applications.


## Prerequisites

Before setting up the workspace, ensure you have the following installed:
- Python 3.11 or higher
- `pip` (Python package manager)
- A PayPal developer account for API credentials

## Installing Dependencies

Set up a Python virtual environment and install the required dependencies:
```bash
# Step 1: Create a virtual environment
python -m venv venv

# Step 2: Activate the virtual environment
source venv/bin/activate  # On macOS/Linux
# For Windows:
# venv\Scripts\activate

# Step 3: Install required dependencies
pip install -r requirements.txt

```

## Environment Setup
Create and configure an .env file in the example directory to set your environment variables:
```env
# OpenAI Configuration
OPENAI_API_KEY=<your_openai_api_key>

# Amazon Bedrock Configuration
AWS_ACCESS_KEY_ID=AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=AWS_SECRET_ACCESS_KEY

# PayPal Configuration
PAYPAL_CLIENT_ID=<your_paypal_client_id>
PAYPAL_CLIENT_SECRET=<your_paypal_client_secret>

```
Replace the placeholders (<your_openai_api_key>, <your_paypal_client_id>, etc.) with your actual credentials.

## Running the Example
The examples read the `.env` file only after you uncomment `load_dotenv()` near the top of the script (in `crewai/app_agent.py`, also uncomment the `from dotenv import load_dotenv` import). Alternatively, export the variables in your shell.

Navigate to the example directory and run one of the scripts:
```bash
# OpenAI Agents SDK
cd openai && python app_agent.py

# OpenAI chatbot
cd openai && python app_assistant_chatbot.py

# LangChain, CrewAI or Amazon Bedrock
cd langchain && python app_agent.py
cd crewai && python app_agent.py
cd bedrock && python app_agent.py
```

