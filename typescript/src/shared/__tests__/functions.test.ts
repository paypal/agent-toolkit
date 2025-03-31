import {createOrder, getOrder} from '../functions';
import {ApiResponse, LinkHttpMethod, Order, OrdersController} from '@paypal/paypal-server-sdk';
import {TypeOf} from "zod";
import PayPalClient from "../client";
import {createOrderParameters} from "../parameters";

// Mock dependencies
jest.mock('@paypal/paypal-server-sdk');

describe('createOrder', () => {


    const response: Order = <Order>{"id":"4A572180UY881681N","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/4A572180UY881681N","rel":"self","method":LinkHttpMethod.Get},{"href":"https://www.sandbox.paypal.com/checkoutnow?token=4A572180UY881681N","rel":"payer-action","method":LinkHttpMethod.Get}]}

    const request: TypeOf<typeof createOrderParameters> =  {"currencyCode":"USD","items":[{"name":"Labor","itemCost":120,"quantity":1,"taxPercent":50,"itemTotal":180,"description":"1 hour of plumbing labor"},{"name":"Faucet","itemCost":65,"quantity":1,"taxPercent":12,"itemTotal":72.8,"description":"Standard faucet replacement"}],"returnUrl":"http://localhost:3000/thank-you","cancelUrl":"http://localhost:3000/thank-you"}

    let mockPayPalClient: jest.Mocked<PayPalClient>;
    let mockOrdersController: jest.Mocked<OrdersController>;
    let mockResponse: ApiResponse<Order>;

    beforeEach(() => {
        // Mock PayPal Client
        mockPayPalClient = {
            sdkClient: {}, // Fake SDK Client
        } as unknown as jest.Mocked<PayPalClient>;

        // Mock OrdersController
        mockOrdersController = new OrdersController(mockPayPalClient.sdkClient) as jest.Mocked<OrdersController>;
        (OrdersController as jest.Mock).mockImplementation(() => mockOrdersController);

        // Mock successful response
        mockResponse = { statusCode: 201, result: response } as unknown as ApiResponse<Order>;
        mockOrdersController.ordersCreate = jest.fn().mockResolvedValue(mockResponse);

        // Spy on console.error to check if it's called
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Clean up mocks after each test
    });

    it('should create an order successfully', async () => {
        const result = await createOrder(mockPayPalClient, request);
        expect(mockOrdersController.ordersCreate).toHaveBeenCalled();
        expect(result).toEqual({ status: "success", data: response });
    });

    it('should throw an error if order creation fails', async () => {
        mockOrdersController.ordersCreate.mockRejectedValue(new Error('API Error'));

        await expect(createOrder(mockPayPalClient, request)).rejects.toThrow('Failed to create order');
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw an error if parseOrderDetails fails', async () => {
        await expect(createOrder(mockPayPalClient, {} as any)).rejects.toThrow('Failed to parse order details');
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle error response format from PayPal API', async () => {
        mockOrdersController.ordersCreate.mockResolvedValue({ status: 500, body: "Connection reset" } as any);
        const result = await createOrder(mockPayPalClient, request);

        expect(mockOrdersController.ordersCreate).toHaveBeenCalled();
        expect(result).toEqual({ status: "systemError", error: "Connection reset" });

    });

    it('should log error if PayPal API throws an exception', async () => {
        mockOrdersController.ordersCreate.mockRejectedValue(new Error('Network error'));

        await expect(createOrder(mockPayPalClient, request)).rejects.toThrow('Failed to create order');
        expect(console.error).toHaveBeenCalledWith(new Error('Network error'));
    });
});

describe('getOrder', () => {
    const response: Order = <Order>{"id":"3RS32358LX7863943","intent":"CAPTURE","status":"CREATED","purchase_units":[{"reference_id":"default","amount":{"currency_code":"USD","value":"56.00","breakdown":{"item_total":{"currency_code":"USD","value":"50.00"},"tax_total":{"currency_code":"USD","value":"6.00"}}},"payee":{"email_address":"sb-pcxut30675321@business.example.com","merchant_id":"ML7TUQV4SJW68"},"items":[{"name":"Faucet","unit_amount":{"currency_code":"USD","value":"50.00"},"tax":{"currency_code":"USD","value":"6.00"},"quantity":"1","description":"Standard faucet replacement"}]}],"create_time":"2025-02-14T23:15:20Z","links":[{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/3RS32358LX7863943","rel":"self","method":"GET"},{"href":"https://www.sandbox.paypal.com/checkoutnow?token=3RS32358LX7863943","rel":"approve","method":"GET"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/3RS32358LX7863943","rel":"update","method":"PATCH"},{"href":"https://api.sandbox.paypal.com/v2/checkout/orders/3RS32358LX7863943/capture","rel":"capture","method":"POST"}]};

    const request = {id: "3RS32358LX7863943"};

    let mockPayPalClient: jest.Mocked<PayPalClient>;
    let mockOrdersController: jest.Mocked<OrdersController>;
    let mockResponse: ApiResponse<Order>;

    beforeEach(() => {
        // Mock PayPal Client
        mockPayPalClient = {
            sdkClient: {}, // Fake SDK Client
        } as unknown as jest.Mocked<PayPalClient>;

        // Mock OrdersController
        mockOrdersController = new OrdersController(mockPayPalClient.sdkClient) as jest.Mocked<OrdersController>;
        (OrdersController as jest.Mock).mockImplementation(() => mockOrdersController);

        // Mock successful response
        mockResponse = { statusCode: 200, result: response } as unknown as ApiResponse<Order>;
        mockOrdersController.ordersGet = jest.fn().mockResolvedValue(mockResponse);

        // Spy on console.error to check if it's called
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Clean up mocks after each test
    });

    it('should retrieve an order successfully', async () => {
        const result = await getOrder(mockPayPalClient, request);
        expect(mockOrdersController.ordersGet).toHaveBeenCalled();
        expect(result).toEqual({ status: "success", data: response });
    });

    it('should throw an error if order retrieval fails', async () => {
        mockOrdersController.ordersGet.mockRejectedValue(new Error('API Error'));

        await expect(getOrder(mockPayPalClient, request)).rejects.toThrow('Failed to retrieve order');
        expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle error response format from PayPal API', async () => {
        mockOrdersController.ordersGet.mockResolvedValue({ status: 500, body: "Connection reset" } as any);
        const result = await getOrder(mockPayPalClient, request);

        expect(mockOrdersController.ordersGet).toHaveBeenCalled();
        expect(result).toEqual({ status: "systemError", error: "Connection reset" });

    });

    it('should log error if PayPal API throws an exception', async () => {
        mockOrdersController.ordersGet.mockRejectedValue(new Error('Network error'));

        await expect(getOrder(mockPayPalClient, request)).rejects.toThrow('Failed to retrieve order');
        expect(console.error).toHaveBeenCalledWith(new Error('Network error'));
    });
});
