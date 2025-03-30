declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  import { Readable, Writable } from 'node:stream';
  import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';
  import { Transport } from '@modelcontextprotocol/sdk/shared/transport';

  export class StdioServerTransport implements Transport {
    constructor(_stdin?: Readable, _stdout?: Writable);
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;
    start(): Promise<void>;
    close(): Promise<void>;
    send(message: JSONRPCMessage): Promise<void>;
  }
}