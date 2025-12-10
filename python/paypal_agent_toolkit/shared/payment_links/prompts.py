CREATE_PAYMENT_LINK_PROMPT = """
Create a payment link on PayPal.

This function creates a shareable payment link that can be sent to customers for payment collection. The payment link supports products with pricing, tax calculation, shipping fees, product variants (size, color, material), quantity controls, custom customer notes, and return URLs.

Important limitations to note:
- Tax types: Only PERCENTAGE and PREFERENCE are supported. FLAT tax type will return a 422 error.
- Shipping types: Only FLAT and PREFERENCE are supported. PERCENTAGE shipping type will return a 422 error.
- Reusable mode: Use "MULTIPLE" for BUY_NOW type. SINGLE mode is not supported in the current version.
- Variants: Must have exactly one primary dimension. Other dimensions must be marked as non-primary.
- Pricing: Cannot specify unit_amount at both product level and variant option level. Choose one approach.
- Type: Use "BUY_NOW" for standard purchases.

Once created, the link can be shared with customers via email, social media, or embedded on websites.
"""

LIST_PAYMENT_LINKS_PROMPT = """
List payment links from PayPal.

This function retrieves a paginated list of payment links with optional filtering parameters. You can control pagination using page and page_size parameters. Set total_required to true to include the total count of payment links in the response.
"""

GET_PAYMENT_LINK_PROMPT = """
Get details of a specific payment link from PayPal.

This function retrieves comprehensive details about a payment link using its ID. The response includes the shareable URL, current status (ACTIVE, INACTIVE, etc.), line items with pricing, taxes, shipping, variant configurations, and return URL settings.

Payment link ID format: PLB-XXXXXXXXXXXX (PLB- prefix followed by 12-16 alphanumeric characters).
"""

UPDATE_PAYMENT_LINK_PROMPT = """
Update a payment link on PayPal.

This function performs a complete replacement of a payment link's configuration using a PUT operation. You must provide all required fields including payment_link_id, type, and line_items. The same limitations apply as when creating a payment link (tax types, shipping types, reusable mode, variants, and pricing rules).

Note: This is a full replacement operation. All fields must be provided, not just the ones you want to change.
"""

DELETE_PAYMENT_LINK_PROMPT = """
Delete a payment link created through the PayPal Pay Links & Buttons API.

This operation deactivates the payment link so it can no longer be used by customers.
Once deleted, the shareable link URL will stop working.

### Important notes
- Deletion removes the payment resource from active use. A deleted link cannot be used for future payments.
- If an invalid or non-existent payment link ID is provided, the PayPal API may return a 404 Not Found error.
- This operation does not affect completed transactions tied to the link.

### Required fields
- `id`: Unique identifier of the payment link you want to delete.

### Example usage
To delete a payment link:
delete_payment_link(
id="PR-1234567890"
)
"""
