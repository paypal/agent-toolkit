# Prompts

## Available tools

The PayPal Agent toolkit provides the following tools:

### **Invoices**

---

**`create_invoice`** - Creates a new invoice in the PayPal system.

- `recipient_email` (string): Email address of the invoice recipient.
- `items` (array): List of items or services to include in the invoice. Each item should have.
  - `name` (string): Name of the item.
  - `quantity` (number): Quantity of the item.
  - `unit_price` (number): Price per unit of the item.

> **Example Prompt**:
> Create an invoice for {customer_email} including 2 hours of consulting at $150 per hour

---

**`list_invoices`** - Lists invoices with optional pagination and filtering.

- `page` (number, optional): Page number for pagination.
- `page_size` (number, optional): Number of invoices per page.
- `status` (string, optional): Filter invoices by status (e.g., SENT, PAID).

> **Example Prompt**:
> List all {status} invoices on page {page} with {page_size} invoices per page

---

**`get_invoice`** - Retrieves details of a specific invoice.

- `invoice_id` (string): The unique identifier of the invoice.

> **Example Prompt**:
> What are the details of invoice {invoice_id}?

---

**`send_invoice`** - Sends an existing invoice to the specified recipient.

- `invoice_id` (string): The unique identifier of the invoice to be sent.

> **Example Prompt**:
> Send invoice {invoice_id} to the client

---

**`send_invoice_reminder`** - Sends a reminder for an existing invoice.

- `invoice_id` (string): The unique identifier of the invoice.

> **Example Prompt**:
> Send a reminder for invoice {invoice_id}

---

**`cancel_sent_invoice`** - Cancels a sent invoice.

- `invoice_id` (string): The unique identifier of the invoice to cancel.

> **Example Prompt**:
> Cancel the sent invoice {invoice_id}

---

**`generate_invoice_qr_code`** - Generates a QR code for an invoice.

- `invoice_id` (string): The unique identifier of the invoice.

> **Example Prompt**:
> Generate a QR code for invoice {invoice_id}

### **Payments**

---

**`create_order`** - Creates an order in the PayPal system based on provided details.

- `items` (array): List of items to include in the order. Each item should have.
  - `name` (string): Name of the item.
  - `quantity` (number): Quantity of the item.
  - `unit_price` (number): Price per unit of the item.
- `currency` (string): Currency code (e.g., USD, EUR).

> **Example Prompt**:
> Place an order for {quantity} units of '{item_name}' at ${unit_price} each

---

**`get_order`** - Retrieves the details of an order.

- `order_id` (string): The unique identifier of the order.

> **Example Prompt**:
> Get details for order {order_id}

---

**`pay_order`** - Captures payment for an authorized order.

- `order_id` (string): The unique identifier of the order to capture.

> **Example Prompt**:
> Capture payment for order {order_id}

### **Dispute Management**

---

**`list_disputes`** - Retrieves a summary of all disputes with optional filtering.

- `status` (string, optional): Filter disputes by status (e.g., OPEN, RESOLVED).

> **Example Prompt**:
> List all {status} disputes

---

**`get_dispute`** - Retrieves detailed information of a specific dispute.

- `dispute_id` (string): The unique identifier of the dispute.

> **Example Prompt**:
> Get details for dispute {dispute_id}

---

**`accept_dispute_claim`** - Accepts a dispute claim, resolving it in favor of the buyer.

- `dispute_id` (string): The unique identifier of the dispute.

> **Example Prompt**:
> Accept the dispute with ID {dispute_id}

### **Shipment Tracking**

---

**`create_shipment_tracking`** - Creates a shipment tracking record for a PayPal transaction.

- `tracking_number` (string, required): The tracking number for the shipment.
- `transaction_id` (string, required): The transaction ID associated with the shipment.
- `carrier` (string, required): The carrier handling the shipment. (e.g.,FEDEX, UPS)
- `order_id:` (string, optional): The order ID for which shipment needs to be created.
- `status:` (string, optional, enum): The current status of the shipment. Allowed values are['ON_HOLD', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'LOCAL_PICKUP'], default value: 'SHIPPED'.

> **Example Prompt**:
> Add tracking number '{tracking_number}' with carrier '{carrier}' to PayPal order ID - {order_id}.

---

**`get_shipment_tracking`** - Gets shipment tracking information for a specific shipment.

- `order_id` (string, required): The order ID for which shipment needs to be created.
- `transaction_id` (string, optional): The transaction ID associated with the shipment.

> **Example Prompt**:
> Get the tracking number for PayPal order ID - {order_id}

### **Catalog Management**

---

**`create_product`** - Creates a new product in the PayPal catalog.

- `name` (string, required): The name of the product.
- `type` (string, required, enum): The type of the product. Allowed values are ['PHYSICAL', 'DIGITAL', 'SERVICE'].

> **Example Prompt**:
> Create a new product with the name '{product_name}' of type '{product_type}'.

---

**`list_products`** - Lists products from the PayPal catalog with optional pagination.

- `page` (number, optional): The specific page number to retrieve. Defaults to the first page if not provided.
- `page_size` (number, optional): The maximum number of products to return per page. Defaults to a system-defined limit if not provided.

> **Example Prompt**:
> List all products.

---

**`show_product_details`** - Shows details of a specific product from the PayPal catalog.

- `product_id` (string, required): The ID of the product to retrieve.

> **Example Prompt**:  
> Show the details for product id {product_id}.

### **Subscription Management**

---

**`create_subscription_plan`** - Creates a new subscription plan.

- `product_id` (string, required): The name of the subscription plan.
- `name` (string, required): The plan name.
- `billing_cycles` (array, required): An array of billing cycles for trial billing and regular billing. A plan can have at most two trial cycles and only one regular cycle.
  - `tenure_type` (string, required): The type of billing cycle: [REGULAR|TRIAL].
  - `sequence` (integer, required): The order in which this cycle is to run among other billing cycles.
  - `frequency`(integer, required): The frequency details for this billing cycle.
    - `interval_unit`(string, required): The interval at which the subscription is charged or billed.[DAY|WEEK|MONTH|YEAR]
- `payment_preferences` (array, required): The payment preferences for a subscription.
  - `auto_bill_outstanding` (boolean, optional): Indicates whether to automatically bill the outstanding amount in the next billing cycle. Default:true

> **Example Prompt**:  
> Create a {interval_unit} PayPal subscription plan for product '{product_name}' with billing cycle '{billing_cycle}', price '{price} {currency}'. Set trial period cycle to '{trial_period}'.

---

**`list_subscription_plans`** - Lists subscription plans.

- `product_id` (number, optional): List the subscription plans for a specific product.
- `page` (number, optional): The specific page number to retrieve. Defaults to the first page if not provided.
- `page_size` (number, optional): The maximum number of products to return per page. Defaults to a system-defined limit if not provided.

> **Example Prompt**:
> List all subscription plans.

---

**`show_subscription_plan_details`** - Shows details of a specific subscription plan.

- `billing_plan_id` (string, required): The ID of the subscription plan to retrieve.

> **Example Prompt**:
> Show the details for plan id {billing_plan_id}.

---

**`create_subscription`** - Creates a new subscription.

- `plan_id` (string, required): The ID of the subscription plan.
- `Subscriber` (array, optional): The subscriber request information.
  - `name` (string, optional): The name of the subscriber.
  - `email` (string, Optional): The email address of the subscriber.

> **Example Prompt**:
> Create a subscription for plan id {plan_id} with subscriber name as {subscriber_name} with email address {subscriber_email}.

---

**`show_subscription_details`** - Shows details of a specific subscription.

- `subscription_id` (string, required): The ID of the subscription to retrieve.

> **Example Prompt**:
> Show the details for subscription id {subscription_id}.

---

**`cancel_subscription`** - Cancels an active subscription.

- `subscription_id` (string, required): The ID of the subscription to be cancelled.
- `Reason` (string, optional): The reason for cancelling the subscription.

> **Example Prompt**:
> Cancel the subscription id {subscription_id}

### **Reporting and Insights**

---

**`list_transaction`** - Lists all transactions with optional pagination and filtering.

- `start_date` (string, optional): The start date for filtering transactions. Default value : 31 days
- `end_date` (string, optional): The end date for filtering transactions.

> **Example Prompt**:
> Get the list of my transactions for last {days} days.
