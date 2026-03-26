/**
 * CACP SDK Main Client
 */

import type {
  CacpClientOptions,
  ErrorResponse,
  Logger,
  OnRequestCallback,
  OnResponseCallback,
} from "./types";
import { AgentsAPI } from "./agents";
import { MessagingAPI } from "./messaging";
import { TasksAPI } from "./tasks";
import { GroupsAPI } from "./groups";
import { AuthAPI } from "./auth";
import { APIKeysAPI } from "./apiKeys";
import { WebSocketClient } from "./websocket";
import {
  CacpError,
  AuthenticationError,
  ConnectionError,
  RateLimitError,
  TimeoutError,
  ValidationError,
  createErrorFromResponse,
} from "./errors";

const DEFAULT_TIMEOUT = 30;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1;
const DEFAULT_USER_AGENT = "cacp-sdk-typescript/0.1.0";

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export class CacpClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly jwtToken?: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly userAgent: string;
  private readonly logger?: Logger;
  private readonly onRequest?: OnRequestCallback;
  private readonly onResponse?: OnResponseCallback;

  private _agents?: AgentsAPI;
  private _messaging?: MessagingAPI;
  private _tasks?: TasksAPI;
  private _groups?: GroupsAPI;
  private _auth?: AuthAPI;
  private _apiKeys?: APIKeysAPI;
  private _websocket?: WebSocketClient;

  constructor(options: CacpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.jwtToken = options.jwtToken;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.logger = options.logger;
    this.onRequest = options.onRequest;
    this.onResponse = options.onResponse;
  }

  /**
   * Get the Agents API
   */
  get agents(): AgentsAPI {
    if (!this._agents) {
      this._agents = new AgentsAPI(this);
    }
    return this._agents;
  }

  /**
   * Get the Messaging API
   */
  get messaging(): MessagingAPI {
    if (!this._messaging) {
      this._messaging = new MessagingAPI(this);
    }
    return this._messaging;
  }

  /**
   * Get the Tasks API
   */
  get tasks(): TasksAPI {
    if (!this._tasks) {
      this._tasks = new TasksAPI(this);
    }
    return this._tasks;
  }

  /**
   * Get the Groups API
   */
  get groups(): GroupsAPI {
    if (!this._groups) {
      this._groups = new GroupsAPI(this);
    }
    return this._groups;
  }

  /**
   * Get the Auth API
   */
  get auth(): AuthAPI {
    if (!this._auth) {
      this._auth = new AuthAPI(this);
    }
    return this._auth;
  }

  /**
   * Get the API Keys API
   */
  get apiKeys(): APIKeysAPI {
    if (!this._apiKeys) {
      this._apiKeys = new APIKeysAPI(this);
    }
    return this._apiKeys;
  }

  /**
   * Get the WebSocket client
   */
  get websocket(): WebSocketClient {
    if (!this._websocket) {
      this._websocket = new WebSocketClient(this);
    }
    return this._websocket;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the WebSocket URL
   */
  getWebSocketUrl(): string {
    return this.baseUrl.replace(/^http/, "ws") + "/ws/v1";
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    } else if (this.jwtToken) {
      headers["Authorization"] = `Bearer ${this.jwtToken}`;
    }
    return headers;
  }

  /**
   * Get default headers for requests
   */
  private getDefaultHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": this.userAgent,
      ...this.getAuthHeaders(),
    };
  }

  /**
   * Make an HTTP request
   */
  async request<T>(
    method: string,
    path: string,
    options?: {
      params?: Record<string, unknown>;
      body?: unknown;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<T> {
    const requestId = generateRequestId();
    const url = new URL(`${this.baseUrl}${path}`);

    // Add query parameters
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const requestHeaders = {
      ...this.getDefaultHeaders(),
      "X-Request-ID": requestId,
      ...options?.headers,
    };

    const requestTimeout = options?.timeout ?? this.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      requestTimeout * 1000,
    );

    // Call onRequest callback
    if (this.onRequest) {
      try {
        this.onRequest(method, path, requestHeaders);
      } catch (e) {
        if (this.logger) {
          this.logger.warn(`onRequest callback failed: ${String(e)}`);
        }
      }
    }

    // Log request
    if (this.logger) {
      this.logger.debug(`Request: ${method} ${path} (ID: ${requestId})`);
    }

    let lastError: Error | null = null;
    let responseData: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers: requestHeaders,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};

        // Call onResponse callback
        if (this.onResponse) {
          try {
            this.onResponse(path, response.status, responseData as Record<string, unknown>);
          } catch (e) {
            if (this.logger) {
              this.logger.warn(`onResponse callback failed: ${String(e)}`);
            }
          }
        }

        // Log response
        if (this.logger) {
          this.logger.debug(`Response: ${response.status} for ${method} ${path} (ID: ${requestId})`);
        }

        if (response.ok) {
          return responseData as T;
        }

        await this.handleErrorResponse(response, attempt, requestId);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          throw new TimeoutError(`${method} ${path}`, requestTimeout, requestId);
        }

        if (error instanceof CacpError) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error(String(error));

        // Log error
        if (this.logger) {
          this.logger.warn(
            `Request error (attempt ${attempt}/${this.maxRetries}): ${String(lastError)} (ID: ${requestId})`
          );
        }

        // Wait before retry
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        }
      }
    }

    throw new ConnectionError(
      lastError?.message ?? `Failed to complete request: ${method} ${path}`,
      requestId,
    );
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(
    response: Response,
    attempt: number,
    requestId: string,
  ): Promise<void> {
    let errorData: ErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }

    // Try to use broker error code mapping first
    // Check if error is an object (BrokerErrorResponse)
    const errorObj = errorData.error;
    if (typeof errorObj === "object" && errorObj !== null) {
      try {
        throw createErrorFromResponse(errorData as any, requestId);
      } catch (e) {
        if (e instanceof CacpError) {
          throw e; // Re-raise mapped errors
        }
        // Fall through to HTTP status handling
      }
    }

    // Fallback to HTTP status code handling
    const errorMessage = typeof errorData.error === "string" 
      ? errorData.error 
      : `HTTP ${response.status}`;
    const errorCode = errorData.code;
    const errorDetails = errorData.details;

    // Log error
    if (this.logger) {
      this.logger.error(
        `Error response: ${response.status} - ${errorMessage} (ID: ${requestId}, code: ${errorCode})`
      );
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorMessage, requestId);
      case 400:
        throw new ValidationError(
          errorMessage,
          errorDetails?.field as string | undefined,
          undefined,
          requestId,
        );
      case 429:
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          retryAfter ? parseFloat(retryAfter) : undefined,
          errorMessage,
          undefined,
          requestId,
        );
      case 404:
        throw new CacpError(
          errorMessage,
          errorCode || "NOT_FOUND",
          errorDetails,
          requestId,
        );
      default:
        if (response.status >= 500 && attempt < this.maxRetries) {
          return; // Allow retry
        }
        throw new CacpError(
          errorMessage,
          errorCode || `HTTP_${response.status}`,
          errorDetails,
          requestId,
        );
    }
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  /**
   * Close the client and release resources
   */
  async close(): Promise<void> {
    if (this._websocket) {
      await this._websocket.close();
      this._websocket = undefined;
    }
  }
}
