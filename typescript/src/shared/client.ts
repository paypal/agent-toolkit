import { Client, Environment, LogLevel } from '@paypal/paypal-server-sdk';
import axios from 'axios';
import { Buffer } from 'buffer';
import os from 'os';
import { version } from '../../package.json';
import { Context } from './configuration';

class PayPalClient {
    private _sdkClient: Client | undefined;
    private _clientId: string | undefined;
    private _clientSecret: string | undefined;
    private _isSandbox: boolean;
    private _accessToken: string | undefined;
    private _baseUrl: string
    private _context: Context

    constructor({ clientId, clientSecret, context }: {
        clientId: string,
        clientSecret: string,
        context: Context
    });

    constructor({ context, accessToken }: {
        context: Context,
        accessToken?: string
    });

    constructor({ clientId, clientSecret, context, accessToken }: {
        clientId?: string,
        clientSecret?: string,
        context: Context,
        accessToken?: string
    }) {
        const debugSdk = context.debug ?? false;
        this._clientId = clientId;
        this._clientSecret = clientSecret;
        this._context = context;
        this._isSandbox = context.isSandbox ?? true;
        this._accessToken = accessToken;
        if (this._clientId !== undefined && this._clientSecret !== undefined) {
            this.createSDKClient(this._clientId, this._clientSecret, debugSdk);
        }

        this._baseUrl = this._isSandbox
        ? 'https://api.sandbox.paypal.com'
        : 'https://api.paypal.com';
    }

    private createSDKClient(clientId: string, clientSecret: string, debugSdk: boolean) {

        this._sdkClient = new Client({
            clientCredentialsAuthCredentials: {
                oAuthClientId: clientId,
                oAuthClientSecret: clientSecret
            },
            timeout: 0,
            environment: this._isSandbox ? Environment.Sandbox : Environment.Production,
            ...(debugSdk && {
                logging: {
                    logLevel: LogLevel.Info,
                    maskSensitiveHeaders: true,
                    logRequest: {
                        logBody: true,
                    },
                    logResponse: {
                        logBody: true,
                        logHeaders: true,
                    },
                }
            }),
        });
    }

    async getAccessToken(): Promise<string> {
        const auth = Buffer.from(`${this._clientId}:${this._clientSecret}`).toString('base64');
        const url = this._baseUrl+'/v1/oauth2/token';
        try {
            const response = await axios.post(
                url,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': this.generateUserAgent(),
                    },
                }
            );
            return response.data.access_token;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to fetch access token: ${error.response?.data?.error_description || error.message}`);
            } else {
                throw new Error(`Failed to fetch access token: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    // Helper method to get base URL
    getBaseUrl(): string {
        return this._baseUrl;
    }

    // Helper method to get headers
    async getHeaders(): Promise<Record<string, string>> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        this._accessToken = this._accessToken || (await this.getAccessToken());
        headers['Authorization'] = `Bearer ${this._accessToken}`;

        // Add additional headers if needed
        if (this._context.request_id) {
            headers['PayPal-Request-Id'] = this._context.request_id;
        }

        if (this._context.tenant_context) {
            headers['PayPal-Tenant-Context'] = JSON.stringify(this._context.tenant_context);
        }

        headers['User-Agent'] = this.generateUserAgent();

        return headers;
    }

    private generateUserAgent(): string {
        const components = [
            `PayPal Agent Toolkit Typescript: ${this._context.source}`,
            `Version: ${version}`,
            `on OS: ${os.platform()} ${os.release()}`
        ];

        return components.filter(Boolean).join(', ');
    }

}

export default PayPalClient;
