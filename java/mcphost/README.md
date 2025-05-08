# Spring Boot MCP Integration Demo

This project demonstrates how to run the Model Context Protocol (MCP) server locally and integrate it with a Springboot 
application, allowing you to leverage various Large Language Models (LLMs) and utilize PayPal's MCP server to build 
agentic flows for your usecases. The configuration for running the MCP server locally is in the `application.yml` file.

## Prerequisites

Before you begin, ensure you have the following installed and configured:

-   **Node.js v18 or later:** This project requires Node.js for certain functionalities. 
    You can download it from [https://nodejs.org/](https://nodejs.org/).
-   **LLM API Key or Ollama Setup:** You will need an API key for your preferred Large Language Model (LLM)
    provider (e.g., Anthropic, OpenAI, etc.). Alternatively, you can set up [Ollama](https://ollama.com/) to run LLMs locally.
-   **PayPal Access Token:** You need to obtain a valid PayPal access token to interact with PayPal services. 
    You can find more information on how to get an access token in the [PayPal Developer documentation](https://developer.paypal.com/docs/api/reference/get-an-access-token/).

## Project Setup

This project is strictly designed to be a demo, showcasing how to connect a Spring Boot application to PayPal's MCP server.

### Dependency Management

This project utilizes Spring AI's capabilities to interact with LLMs. for illustrative purposes, 
uses the Anthropic spring-ai dependency:
```
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-anthropic</artifactId>
</dependency>
```
You can easily replace this with any other provider-specific Spring AI dependency, such as:

-   `openai`
-   `ollama`
-   `google`
-   `amazon`
-   `mistral`

In addition to the provider specific spring-ai dependency, developers are expected to update the 
LLM specific configuration in application.yml

### MCP Server Connectivity

The key to connecting your Springboot application to an MCP server is the following dependency:
```
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-client</artifactId>
</dependency>
```

## Running the Project

1.  **Clone the repository:**
```
    git clone <repository_url>
    
```
2. **Navigate to the project**:
```
    cd agent-toolkit/java/mcphost
   
```
3.  **Build the project:**
```
    mvn clean install
    
```
4.  **Run the application:**
```

    mvn spring-boot:run
    
```
5. **Sample Curl Command for testing your app**
```
curl --location 'http://localhost:8080/chat' \
--header 'Content-Type: application/json' \
--data '{
  "userPrompt": "your_prompt_goes_here"
}'
```

## Available tools

The PayPal Agent toolkit provides the following tools:

**Invoices**

- `create_invoice`: Create a new invoice in the PayPal system
- `list_invoices`: List invoices with optional pagination and filtering
- `get_invoice`: Retrieve details of a specific invoice
- `send_invoice`: Send an invoice to recipients
- `send_invoice_reminder`: Send a reminder for an existing invoice
- `cancel_sent_invoice`: Cancel a sent invoice
- `generate_invoice_qr_code`: Generate a QR code for an invoice

**Payments**

- `create_order`: Create an order in PayPal system based on provided details
- `get_order`: Retrieve the details of an order
- `pay_order`: Process payment for an authorized order

**Dispute Management**

- `list_disputes`: Retrieve a summary of all open disputes
- `get_dispute`: Retrieve detailed information of a specific dispute
- `accept_dispute_claim`: Accept a dispute claim

**Shipment Tracking**

- `create_shipment_tracking`: Create a shipment tracking record
- `get_shipment_tracking`: Retrieve shipment tracking information

**Catalog Management**

- `create_product`: Create a new product in the PayPal catalog
- `list_products`: List products with optional pagination and filtering
- `show_product_details`: Retrieve details of a specific product

**Subscription Management**

- `create_subscription_plan`: Create a new subscription plan
- `list_subscription_plans`: List subscription plans
- `show_subscription_plan_details`: Retrieve details of a specific subscription plan
- `create_subscription`: Create a new subscription
- `show_subscription_details`: Retrieve details of a specific subscription
- `cancel_subscription`: Cancel an active subscription

**Reporting and Insights**

- `list_transactions`: List transactions with optional pagination and filtering

## Contributing

Feel free to contribute to this project by opening issues or creating pull requests.