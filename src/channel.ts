/**
 * Phoenix Channels WebSocket Client
 *
 * Implements the Phoenix Channels protocol for CACP WebSocket communication.
 * Message format: [ref, event, topic, payload]
 */

import type { CacpClient } from "./client";
import { WebSocketError, ConnectionError } from "./errors";

/**
 * Represents a Phoenix Channel message in tuple format [ref, event, topic, payload].
 */
export class PhoenixMessage {
  constructor(
    public ref: string,
    public event: string,
    public topic: string,
    public payload: Record<string, unknown> = {}
  ) {}

  /**
   * Create a PhoenixMessage from a tuple array.
   */
  static fromTuple(message: unknown[]): PhoenixMessage {
    if (!Array.isArray(message) || message.length < 4) {
      throw new Error(`Invalid Phoenix message tuple: ${JSON.stringify(message)}`);
    }
    const payload =
      typeof message[3] === "object" && message[3] !== null
        ? (message[3] as Record<string, unknown>)
        : {};
    return new PhoenixMessage(
      String(message[0]),
      String(message[1]),
      String(message[2]),
      payload
    );
  }

  /**
   * Convert to tuple format [ref, event, topic, payload].
   */
  toTuple(): (string | Record<string, unknown>)[] {
    return [this.ref, this.event, this.topic, this.payload];
  }

  /**
   * Serialize to JSON string.
   */
  toJSON(): string {
    return JSON.stringify(this.toTuple());
  }

  /**
   * Deserialize from JSON string.
   */
  static fromJSON(json: string): PhoenixMessage {
    const message = JSON.parse(json);
    return PhoenixMessage.fromTuple(message);
  }
}

export type MessageHandler = (payload: Record<string, unknown>) => void;

/**
 * Represents a Phoenix Channel subscribed to a topic.
 */
export class PhoenixChannel {
  readonly topic: string;
  readonly params: Record<string, unknown>;

  private joined = false;
  private joinEventPromise: Promise<void> | null = null;
  private joinEventResolve: (() => void) | null = null;
  private readonly eventHandlers: Map<string, Set<MessageHandler>> = new Map();

  constructor(topic: string, params?: Record<string, unknown>) {
    this.topic = topic;
    this.params = params ?? {};
    this._initJoinEvent();
  }

  get isJoined(): boolean {
    return this.joined;
  }

  /**
   * Initialize join event promise.
   */
  private _initJoinEvent(): void {
    this.joined = false;
    this.joinEventPromise = new Promise((resolve) => {
      this.joinEventResolve = resolve;
    });
  }

  /**
   * Wait until the channel is joined.
   */
  async waitUntilJoined(timeout = 5000): Promise<void> {
    if (!this.joinEventPromise) {
      throw new Error("Join event not initialized");
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout waiting to join channel: ${this.topic}`)), timeout);
    });

    await Promise.race([this.joinEventPromise, timeoutPromise]);
  }

  /**
   * Register a handler for a specific event.
   */
  on(event: string, handler: MessageHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove a handler for a specific event.
   */
  off(event: string, handler: MessageHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to registered handlers.
   */
  emit(event: string, payload: Record<string, unknown>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Mark the channel as joined.
   */
  _markJoined(): void {
    this.joined = true;
    if (this.joinEventResolve) {
      this.joinEventResolve();
    }
  }

  /**
   * Reset join state for reconnection.
   */
  _resetJoin(): void {
    this._initJoinEvent();
  }
}

/**
 * Phoenix Channels WebSocket Client.
 *
 * Implements the Phoenix Channel protocol:
 * - Message format: [ref, event, topic, payload]
 * - Heartbeat: heartbeat event to "phoenix" topic every 30s
 * - Channel join: phx_join event
 * - Auto-reconnect with exponential backoff
 */
export class PhoenixChannelClient {
  private readonly client: CacpClient;

  private ws: WebSocket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000;
  private readonly heartbeatInterval = 30000;

  private refCounter = 0;
  private readonly channels = new Map<string, PhoenixChannel>();
  private readonly globalHandlers: Set<(message: PhoenixMessage) => void> = new Set();
  private readonly pendingRequests = new Map<string, {
    resolve: (value: Record<string, unknown>) => void;
    reject: (error: Error) => void;
  }>();

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(client: CacpClient) {
    this.client = client;
  }

  /**
   * Check if connected.
   */
  get isConnected(): boolean {
    return this.connected && this.ws !== null;
  }

  /**
   * Connect to the Phoenix Channel endpoint.
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    const baseUrl = this.client.getWebSocketUrl();
    const wsUrl = `${baseUrl}/websocket?vsn=2.0.0`;

    return new Promise((resolve, reject) => {
      try {
        const WebSocketImpl = typeof WebSocket !== "undefined" ? WebSocket : require("ws");
        this.ws = new WebSocketImpl(wsUrl);

        if (!this.ws) {
          reject(new ConnectionError("Failed to create WebSocket"));
          return;
        }

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;

          this._startHeartbeat();
          this._resubscribeChannels();

          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const message = PhoenixMessage.fromJSON(event.data);
            this._handleMessage(message);
          } catch (error) {
            console.error("Failed to parse Phoenix message:", error);
          }
        };

        this.ws.onclose = () => {
          this.connected = false;
          this._stopHeartbeat();
          this._attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          if (!this.connected) {
            reject(new ConnectionError("Failed to connect Phoenix Channel"));
          }
        };
      } catch (error) {
        reject(new ConnectionError(`Failed to create WebSocket: ${error}`));
      }
    });
  }

  /**
   * Close the Phoenix Channel connection.
   */
  async close(): Promise<void> {
    this._stopHeartbeat();

    for (const channel of this.channels.values()) {
      await this.leaveChannel(channel.topic);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    this.channels.clear();
  }

  /**
   * Get or create a channel for the given topic.
   */
  channel(topic: string, params?: Record<string, unknown>): PhoenixChannel {
    let channel = this.channels.get(topic);
    if (!channel) {
      channel = new PhoenixChannel(topic, params);
      this.channels.set(topic, channel);
    }
    return channel;
  }

  /**
   * Join a Phoenix channel.
   */
  async joinChannel(topic: string, params?: Record<string, unknown>): Promise<PhoenixChannel> {
    const channel = this.channel(topic, params);

    if (channel.isJoined) {
      return channel;
    }

    const message = new PhoenixMessage(
      String(this._nextRef()),
      "phx_join",
      topic,
      params ?? {}
    );

    try {
      await this._sendRequest(message, 5000);
    } catch (error) {
      throw new WebSocketError(`Failed to join channel ${topic}: ${error}`);
    }

    channel._markJoined();
    console.log(`Joined channel: ${topic}`);

    return channel;
  }

  /**
   * Leave a Phoenix channel.
   */
  async leaveChannel(topic: string): Promise<void> {
    const channel = this.channels.get(topic);
    if (!channel || !channel.isJoined) {
      return;
    }

    const message = new PhoenixMessage(
      String(this._nextRef()),
      "phx_leave",
      topic,
      {}
    );

    try {
      await this._send(message);
    } catch (error) {
      console.warn(`Error sending leave for channel ${topic}:`, error);
    }

    channel._resetJoin();
  }

  /**
   * Push an event to a channel.
   */
  async push(topic: string, event: string, payload?: Record<string, unknown>): Promise<void> {
    const message = new PhoenixMessage(
      String(this._nextRef()),
      event,
      topic,
      payload ?? {}
    );

    await this._send(message);
  }

  /**
   * Send a request and wait for response.
   */
  async request(
    topic: string,
    event: string,
    payload?: Record<string, unknown>,
    timeout = 5000
  ): Promise<Record<string, unknown>> {
    const message = new PhoenixMessage(
      String(this._nextRef()),
      event,
      topic,
      payload ?? {}
    );

    return this._sendRequest(message, timeout);
  }

  /**
   * Subscribe to messages for an agent (backward compatibility).
   */
  subscribe(agentId: string): void {
    const topic = `agent:${agentId}`;
    this.channel(topic);
  }

  /**
   * Unsubscribe from messages for an agent.
   */
 async unsubscribe(agentId: string): Promise<void> {
    const topic = `agent:${agentId}`;
    await this.leaveChannel(topic);
  }

  /**
   * Send a message through WebSocket (backward compatibility).
   */
  async send(options: {
    toAgent: string;
    content: Record<string, unknown>;
    messageType?: string;
    fromAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const topic = `agent:${options.toAgent}`;

    const payload: Record<string, unknown> = {
      message: {
        content: options.content,
        message_type: options.messageType ?? "message",
      },
    };

    if (options.fromAgent) {
      const msg = payload.message as Record<string, unknown>;
      msg.sender = { agent_id: options.fromAgent };
    }
    if (options.metadata) {
      const msg = payload.message as Record<string, unknown>;
      msg.metadata = options.metadata;
    }

    await this.push(topic, "send", payload);
  }

  /**
   * Send an RPC request through WebSocket.
   */
  async sendRpc(options: {
    toAgent: string;
    method: string;
    params: Record<string, unknown>;
    requestId?: string;
    fromAgent?: string;
  }): Promise<void> {
    const topic = `agent:${options.toAgent}`;

    const payload: Record<string, unknown> = {
      message: {
        method: options.method,
        params: options.params,
      },
    };

    if (options.requestId) {
      const msg = payload.message as Record<string, unknown>;
      msg.correlation_id = options.requestId;
    }
    if (options.fromAgent) {
      const msg = payload.message as Record<string, unknown>;
      msg.sender = { agent_id: options.fromAgent };
    }

    await this.push(topic, "rpc_request", payload);
  }

  /**
   * Register a global message handler.
   */
  onMessage(handler: (payload: Record<string, unknown>) => void): void {
    this.globalHandlers.add((message: PhoenixMessage) => {
      handler(message.payload);
    });
  }

  /**
   * Send a Phoenix message.
   */
  private async _send(message: PhoenixMessage): Promise<void> {
    if (!this.ws || !this.connected) {
      throw new WebSocketError("WebSocket not connected");
    }

    try {
      this.ws.send(message.toJSON());
      console.debug(`Sent: ${message.event} on ${message.topic}`);
    } catch (error) {
      console.error("Error sending message:", error);
      throw new WebSocketError(`Failed to send message: ${error}`);
    }
  }

  /**
   * Send a request and wait for phx_reply.
   */
  private async _sendRequest(
    message: PhoenixMessage,
    timeout: number
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(message.ref, { resolve, reject });

      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(message.ref);
        reject(new Error(`Timeout waiting for phx_reply to ${message.event}`));
      }, timeout);

      this.pendingRequests.set(message.ref, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      this._send(message).catch((error) => {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(message.ref);
        reject(error);
      });
    });
  }

  /**
   * Handle an incoming Phoenix message.
   */
  private _handleMessage(message: PhoenixMessage): void {
    console.debug(`Received: ${message.event} on ${message.topic}`);

    if (message.event === "phx_reply") {
      this._handleReply(message);
    } else if (message.event === "phx_error") {
      this._handleError(message);
    } else if (message.event === "phx_close") {
      console.warn(`Channel closed: ${message.topic}`);
      const channel = this.channels.get(message.topic);
      if (channel) {
        channel._resetJoin();
      }
    } else {
      const channel = this.channels.get(message.topic);
      if (channel) {
        channel.emit(message.event, message.payload);
      }

      for (const handler of this.globalHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error("Error in global message handler:", error);
        }
      }
    }
  }

  /**
   * Handle a phx_reply message.
   */
  private _handleReply(message: PhoenixMessage): void {
    const pending = this.pendingRequests.get(message.ref);
    if (pending) {
      if (message.payload.status === "ok") {
        pending.resolve(message.payload);
      } else {
        pending.reject(new WebSocketError(`phx_reply error: ${JSON.stringify(message.payload)}`));
      }
      this.pendingRequests.delete(message.ref);
    }
  }

  /**
   * Handle a phx_error message.
   */
  private _handleError(message: PhoenixMessage): void {
    const pending = this.pendingRequests.get(message.ref);
    if (pending) {
      pending.reject(new WebSocketError(`Phoenix error: ${JSON.stringify(message.payload)}`));
      this.pendingRequests.delete(message.ref);
    }
  }

  /**
   * Get next message reference.
   */
  private _nextRef(): number {
    return ++this.refCounter;
  }

  /**
   * Start heartbeat timer.
   */
  private _startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.ws) {
        const message = new PhoenixMessage(
          String(this._nextRef()),
          "heartbeat",
          "phoenix",
          {}
        );
        this._send(message).catch((error) => {
          console.debug("Heartbeat error:", error);
        });
        console.debug("Sent Phoenix heartbeat");
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer.
   */
  private _stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff.
   */
  private _attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnect failed:", error);
      });
    }, delay);
  }

  /**
   * Resubscribe to all channels after reconnect.
   */
  private async _resubscribeChannels(): Promise<void> {
    for (const [topic, channel] of this.channels.entries()) {
      try {
        if (channel.isJoined) {
          channel._resetJoin();
          await this.joinChannel(topic, channel.params);
        }
      } catch (error) {
        console.warn(`Failed to resubscribe to ${topic}:`, error);
      }
    }
  }
}