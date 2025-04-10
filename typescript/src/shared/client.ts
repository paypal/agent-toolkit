import { Client, Environment, LogLevel } from '@paypal/paypal-server-sdk';
import axios from 'axios';
import { Buffer } from 'buffer';
import { Context } from './configuration';

class PayPalClient {
    readonly sdkClient: Client;
    private clientId: string | undefined;
    private clientSecret: string | undefined;
    private isSandbox: boolean;

    constructor({ clientId, clientSecret, context }: {
        clientId: string,
        clientSecret: string,
        context: Context
    }) {
        const debugSdk = context.debug ?? false;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.isSandbox = context.isSandbox ?? true;
        this.sdkClient = new Client({
            clientCredentialsAuthCredentials: {
                oAuthClientId: clientId,
                oAuthClientSecret: clientSecret
            },
            timeout: 0,
            environment: this.isSandbox ? Environment.Sandbox : Environment.Production,
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
        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const url = this.isSandbox
            ? 'https://api.sandbox.paypal.com/v1/oauth2/token'
            : 'https://api.paypal.com/v1/oauth2/token';

        try {
            const response = await axios.post(
                url,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
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

}

export default PayPalClient;
