/**
 * CACP SDK WebSocket Client
 */

import { CacpClient } from "./client";
import { PhoenixChannelClient } from "./channel";
import type { WebSocketSendOptions, WebSocketSubscribeOptions } from "./types";

type MessageHandler = (message: Record<string, unknown>) => void;

export class WebSocketClient {
  private readonly phoenixClient: PhoenixChannelClient;

  constructor(client: CacpClient) {
    this.phoenixClient = new PhoenixChannelClient(client);
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.phoenixClient.isConnected;
  }

  /**
   * Get the underlying PhoenixChannelClient
   */
  get phoenixChannelClient(): PhoenixChannelClient {
    return this.phoenixClient;
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    await this.phoenixClient.connect();
  }

  /**
   * Close the WebSocket connection
   */
  async close(): Promise<void> {
    await this.phoenixClient.close();
  }

  /**
   * Subscribe to messages for an agent
   */
  async subscribe(options: WebSocketSubscribeOptions): Promise<void> {
    this.phoenixClient.subscribe(options.agentId);
  }

  /**
   * Unsubscribe from messages
   */
  async unsubscribe(options: WebSocketSubscribeOptions): Promise<void> {
    await this.phoenixClient.unsubscribe(options.agentId);
  }

  /**
   * Send a message through WebSocket
   */
  async send(options: WebSocketSendOptions): Promise<void> {
    await this.phoenixClient.send({
      toAgent: options.toAgent,
      content: options.content,
      messageType: options.messageType,
      fromAgent: options.fromAgent,
      metadata: options.metadata,
    });
  }

  /**
   * Send an RPC request through WebSocket
   */
  async sendRpc(options: {
    toAgent: string;
    method: string;
    params: Record<string, unknown>;
    requestId?: string;
    fromAgent?: string;
  }): Promise<void> {
    await this.phoenixClient.sendRpc({
      toAgent: options.toAgent,
      method: options.method,
      params: options.params,
      requestId: options.requestId,
      fromAgent: options.fromAgent,
    });
  }

  /**
   * Send an RPC response through WebSocket
   */
  async sendResponse(options: {
    toAgent: string;
    requestId: string;
    result?: unknown;
    error?: { code?: number; message: string };
    fromAgent?: string;
  }): Promise<void> {
    const topic = `agent:${options.toAgent}`;

    const payload: Record<string, unknown> = {
      request_id: options.requestId,
    };

    if (options.result !== undefined) {
      payload.result = options.result;
    }
    if (options.error) {
      payload.error = options.error;
    }

    await this.phoenixClient.push(topic, "rpc_response", payload);
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): void {
    this.phoenixClient.onMessage(handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(_handler: MessageHandler): void {
    // Handlers are managed by PhoenixChannelClient
  }
}