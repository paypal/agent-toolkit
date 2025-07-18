import os
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI 

from dotenv import load_dotenv

from paypal_agent_toolkit.langchain.toolkit import PayPalToolkit
from paypal_agent_toolkit.shared.configuration import Configuration, Context


#uncomment after setting the env file
# load_dotenv()
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
OPENAI_API_VERSION = "2024-02-15-preview"



# --- STEP 1: Setup OpenAI LLM ---
llm = ChatOpenAI(
    temperature=0.3,
    model="gpt-4o",  # or "gpt-3.5-turbo"
)


# --- STEP 2: Setup PayPal Configuration ---
configuration = Configuration(
    actions={
        "orders": {
            "create": True,
            "get": True,
            "capture": True,
        }
    },
    context=Context(
        sandbox=True
    )
)


# --- STEP 3: Build PayPal Toolkit ---
toolkit = PayPalToolkit(client_id=PAYPAL_CLIENT_ID, secret=PAYPAL_SECRET, configuration = configuration)
tools = toolkit.get_tools()



# --- STEP 4: Initialize LangChain Agent ---
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True
)


# --- STEP 5: Run Agent with Prompt ---
if __name__ == "__main__":
    prompt = "Create an PayPal order for $50 for Premium News service."
    result = agent.run(prompt)
    print("Agent Output:", result)
