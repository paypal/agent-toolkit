import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

import os
import sys
from crewai import Agent, Crew, Task

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
from paypal_agent_toolkit.crewai.toolkit import PayPalToolkit
from paypal_agent_toolkit.shared.configuration import Configuration, Context


#uncomment after setting the env file
# load_dotenv()
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
OPENAI_API_VERSION = "2024-02-15-preview"


toolkit = PayPalToolkit(
    client_id=PAYPAL_CLIENT_ID,
    secret=PAYPAL_SECRET,
    configuration=Configuration(
        actions={"orders": {"create": True, "get": True, "capture": True}},
        context=Context(sandbox=True)
    )
)

agent = Agent(
    role="PayPal Assistant",
    goal="Help users create and manage PayPal transactions",
    backstory="You are a finance assistant skilled in PayPal operations.",
    tools=toolkit.get_tools(),
    allow_delegation=False
)

task = Task(
    description="Create an PayPal order for $50 for Premium News service.",
    expected_output="A PayPal order ID",
    agent=agent
)

crew = Crew(agents=[agent], tasks=[task], verbose=True,
    planning=True,)

result = crew.kickoff()
print(result)
