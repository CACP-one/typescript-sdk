/**
 * CACP SDK Messaging API
 */

import type {
  Message,
  MessageSendOptions,
  BroadcastOptions,
  RpcCallOptions,
  RpcResponse,
} from "./types";
import { CacpClient } from "./client";
import { MessageError, RpcError, TimeoutError } from "./errors";

export class MessagingAPI {
  private readonly client: CacpClient;

  constructor(client: CacpClient) {
    this.client = client;
  }

  /**
   * Send a message to another agent
   */
  async send(options: MessageSendOptions): Promise<Message> {
    return this.client.post<Message>("/v1/messages", {
      to_agent: options.toAgent,
      content: options.content,
      message_type: options.messageType ?? "message",
      priority: options.priority ?? "normal",
      metadata: options.metadata,
      ttl: options.ttl,
    });
  }

  /**
   * Get a message by ID
   */
  async get(messageId: string): Promise<Message> {
    return this.client.get<Message>(`/v1/messages/${messageId}`);
  }

  /**
   * Get message status
   */
  async getStatus(messageId: string): Promise<string> {
    const message = await this.get(messageId);
    return message.status;
  }

  /**
   * Wait for message completion
   */
  async waitForCompletion(
    messageId: string,
    options?: { timeout?: number; pollInterval?: number },
  ): Promise<Message> {
    const timeout = options?.timeout ?? 60;
    const pollInterval = options?.pollInterval ?? 1000;
    const startTime = Date.now();

    while (true) {
      const message = await this.get(messageId);

      if (message.status === "completed") {
        return message;
      }

      if (message.status === "failed") {
        throw new MessageError(message.error ?? "Message failed", messageId);
      }

      if (message.status === "timeout") {
        throw new TimeoutError(`wait_for_message(${messageId})`, timeout);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= timeout) {
        throw new TimeoutError(`wait_for_message(${messageId})`, timeout);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  async rpcCall(options: RpcCallOptions): Promise<RpcResponse> {
    const response = await this.client.request<RpcResponse>(
      "POST",
      "/v1/messages/rpc",
      {
        body: {
          to_agent: options.toAgent,
          method: options.method,
          params: options.params ?? {},
          timeout: options.timeout ?? 30,
        },
        timeout: (options.timeout ?? 30) + 5,
      },
    );

    if (response.error) {
      throw new RpcError(
        response.error.message,
        options.method,
        response.error.code,
      );
    }

    return response;
  }

  /**
   * Broadcast a message
   */
  async broadcast(options: BroadcastOptions): Promise<Message[]> {
    const response = await this.client.post<{ messages: Message[] }>(
      "/v1/messages/broadcast",
      {
        content: options.content,
        message_type: options.messageType ?? "broadcast",
        capability_filter: options.capabilityFilter,
        metadata: options.metadata,
      },
    );
    return response.messages;
  }

  /**
   * Cancel a message
   */
  async cancel(messageId: string): Promise<void> {
    await this.client.delete(`/v1/messages/${messageId}`);
  }

  /**
   * Retry a failed message
   */
  async retry(messageId: string): Promise<Message> {
    return this.client.post<Message>(`/v1/messages/${messageId}/retry`);
  }
}
