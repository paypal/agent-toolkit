// Create a minimal implementation matching what's needed
import {Readable, Writable} from 'node:stream';

/**
 * Server transport for stdio: this communicates with a MCP client by reading from
 * the current process' stdin and writing to stdout.
 */
export class StdioServerTransport {
  private _stdin: Readable;
  private _stdout: Writable;
  private _readBuffer: Buffer;
  private _started: boolean;

  constructor(_stdin: Readable = process.stdin, _stdout: Writable = process.stdout) {
    this._stdin = _stdin;
    this._stdout = _stdout;
    this._readBuffer = Buffer.alloc(0);
    this._started = false;
  }

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: any) => void;

  _ondata = (chunk: Buffer) => {
    // Add the chunk to the read buffer
    this._readBuffer = Buffer.concat([this._readBuffer, chunk]);
    this.processReadBuffer();
  };

  _onerror = (error: Error) => {
    if (this.onerror) {
      this.onerror(error);
    }
  };

  /**
   * Starts listening for messages on stdin.
   */
  async start(): Promise<void> {
    if (this._started) {
      return;
    }
    this._started = true;

    this._stdin.on('data', this._ondata);
    this._stdin.on('error', this._onerror);
  }

  private processReadBuffer() {
    // Look for a Content-Length header
    const headerMatch = this._readBuffer.toString().match(/Content-Length: (\d+)\r\n\r\n/);
    if (!headerMatch) {
      return;
    }
    
    const contentLength = parseInt(headerMatch[1], 10);
    const headerEnd = headerMatch.index! + headerMatch[0].length;
    
    // Check if we have enough data to read the entire message
    if (this._readBuffer.length < headerEnd + contentLength) {
      return;
    }
    
    // Extract the message and remove it from the buffer
    const message = this._readBuffer.subarray(headerEnd, headerEnd + contentLength).toString();
    this._readBuffer = this._readBuffer.subarray(headerEnd + contentLength);
    
    try {
      const parsed = JSON.parse(message);
      if (this.onmessage) {
        this.onmessage(parsed);
      }
    } catch (error) {
      if (this.onerror) {
        this.onerror(error instanceof Error ? error : new Error(String(error)));
      }
    }
    
    // Process any additional messages in the buffer
    if (this._readBuffer.length > 0) {
      this.processReadBuffer();
    }
  }

  async close(): Promise<void> {
    if (!this._started) {
      return;
    }
    this._started = false;
    
    this._stdin.off('data', this._ondata);
    this._stdin.off('error', this._onerror);
    
    if (this.onclose) {
      this.onclose();
    }
  }

  async send(message: any): Promise<void> {
    const content = JSON.stringify(message);
    const data = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n${content}`;
    this._stdout.write(data);
  }
}