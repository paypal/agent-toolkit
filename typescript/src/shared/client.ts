import {Client, Environment, LogLevel} from '@paypal/paypal-server-sdk';

function toBoolean(value?: string): boolean {
    return value? value.toLowerCase() === "true" : false;
}

class PayPalClient {
    readonly sdkClient: Client;

    constructor({clientId, clientSecret, environment, logRequestDetails, logResponseDetails, debug}: {
        clientId: string,
        clientSecret: string,
        environment?: string,
        logRequestDetails?: string,
        logResponseDetails?: string,
        debug?: string
    }) {
        const logRequest:boolean = toBoolean(logRequestDetails);
        const logResponse:boolean = toBoolean(logResponseDetails);
        const showDebugHeader: boolean = toBoolean(debug);
        this.sdkClient = new Client({
            clientCredentialsAuthCredentials: {
                oAuthClientId: clientId,
                oAuthClientSecret: clientSecret
            },
            timeout: 0,
            environment: (environment as Environment) || Environment.Sandbox,
            ...((logRequest || logResponse || showDebugHeader) && {
                logging: {
                    logLevel: LogLevel.Info,
                    maskSensitiveHeaders: !showDebugHeader,
                    ...(logRequestDetails && {
                        logRequest: {
                            logBody: logRequest,
                        },
                    }),
                    ...(logResponseDetails && {
                        logResponse: {
                            logBody: logResponse,
                            logHeaders: logResponse,
                        },
                    }),
                },
            }),
        });
    }

}

export default PayPalClient;
