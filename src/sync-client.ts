/**
 * Synchronous CACP Client Wrapper for TypeScript/Node.js (Simplified)
 *
 * Provides a synchronous-looking interface using deasync for blocking behavior.
 *
 * NOTE: Install deasync for this to work:
 *   npm install deasync
 */

import type { Agent, AgentRegistration, AgentUpdate, AgentStatus, AgentListResponse } from "./types";
import type { Message, MessageType } from "./types";
import type { RpcCallOptions, RpcResponse } from "./types";
import type { Task, TaskCreateOptions, TaskListResponse } from "./types";
import type { Group, GroupCreateOptions, GroupUpdateOptions, GroupMember, BroadcastResult, MemberAddOptions } from "./types";
import type {
  AuthRegisterResponse,
  AuthLoginResponse,
  AuthTokenResponse,
  AuthRefreshResponse,
  RegisterRequest,
  LoginRequest,
  TokenRequest,
} from "./auth";
import type {
  APIKey,
  APIKeyCreated,
  APIKeyListResponse,
  CreateAPIKeyRequest,
} from "./apiKeys";
import { AgentsAPI } from "./agents";
import { MessagingAPI } from "./messaging";
import { TasksAPI } from "./tasks";
import { GroupsAPI } from "./groups";
import { AuthAPI } from "./auth";
import { APIKeysAPI } from "./apiKeys";
import type { CacpClientOptions } from "./types";
import { CacpClient } from "./client";

/**
 * Sync wrapper that uses deasync for blocking
 */
function waitForPromiseResult<T>(promise: Promise<T>): T {
  try {
    const deasync = require("deasync");
    let result: T | undefined;
    let error: Error | undefined;
    let completed = false;

    promise
      .then((r) => {
        result = r;
        completed = true;
      })
      .catch((e) => {
        error = e as Error;
        completed = true;
      });

    deasync.loopWhile(() => !completed);

    if (error) {
      throw error;
    }
    return result!;
  } catch (err) {
    if ((err as Error).message.includes("Cannot find module 'deasync'")) {
      throw new Error(
        'SyncCacpClient requires the "deasync" package. Install with: npm install deasync',
      );
    }
    throw err;
  }
}

/**
   * Synchronous wrapper for Agents API
   */
  export class SyncAgentsAPI {
    private readonly _asyncApi: AgentsAPI;

    constructor(asyncApi: AgentsAPI) {
      this._asyncApi = asyncApi;
    }

    register(params: AgentRegistration): Agent {
      return waitForPromiseResult(this._asyncApi.register(params));
    }

    list(options?: { status?: AgentStatus; limit?: number; offset?: number }): Agent[] {
      const result = waitForPromiseResult<AgentListResponse>(
        this._asyncApi.list(options),
      );
      return result.agents;
    }

    get(agentId: string): Agent {
      return waitForPromiseResult(this._asyncApi.get(agentId));
    }

    update(agentId: string, params: AgentUpdate): Agent {
      return waitForPromiseResult(this._asyncApi.update(agentId, params));
    }

    delete(agentId: string): void {
      waitForPromiseResult(this._asyncApi.delete(agentId));
    }

    queryByCapability(
      capabilities: string[],
      options?: { matchAll?: boolean; limit?: number },
    ): Agent[] {
      return waitForPromiseResult(
        this._asyncApi.queryByCapability({
          capabilities,
          matchAll: options?.matchAll,
          limit: options?.limit,
        }),
      );
    }

    discover(options: {
      query: string;
      threshold?: number;
      limit?: number;
    }): Agent[] {
      return waitForPromiseResult(this._asyncApi.discover(options));
    }
  }

/**
   * Synchronous wrapper for Messaging API
   */
  export class SyncMessagingAPI {
    private readonly _asyncApi: MessagingAPI;

    constructor(asyncApi: MessagingAPI) {
      this._asyncApi = asyncApi;
    }

    send(options: {
      toAgent: string;
      content: Record<string, unknown>;
      messageType?: MessageType;
      fromAgent?: string;
      metadata?: Record<string, unknown>;
    }): Message {
      return waitForPromiseResult(this._asyncApi.send(options));
    }

    rpcCall(options: RpcCallOptions): RpcResponse {
      return waitForPromiseResult(this._asyncApi.rpcCall(options));
    }

    get(messageId: string): Message {
      return waitForPromiseResult(this._asyncApi.get(messageId));
    }
  }

/**
 * Synchronous wrapper for Tasks API
 */
export class SyncTasksAPI {
  private readonly _asyncApi: TasksAPI;

  constructor(asyncApi: TasksAPI) {
    this._asyncApi = asyncApi;
  }

  create(params: TaskCreateOptions): Task {
    return waitForPromiseResult(this._asyncApi.create(params));
  }

  get(taskId: string): Task {
    return waitForPromiseResult(this._asyncApi.get(taskId));
  }

  list(options?: { status?: string; taskType?: string; limit?: number }): Task[] {
    const result = waitForPromiseResult<TaskListResponse>(
      this._asyncApi.list(options),
    );
    return result.tasks;
  }

  cancel(taskId: string): Task {
    return waitForPromiseResult(this._asyncApi.cancel(taskId));
  }

  retry(taskId: string): Task {
    return waitForPromiseResult(this._asyncApi.retry(taskId));
  }
}

/**
   * Synchronous wrapper for Groups API
   */
  export class SyncGroupsAPI {
    private readonly _asyncApi: GroupsAPI;

    constructor(asyncApi: GroupsAPI) {
      this._asyncApi = asyncApi;
    }

    create(params: GroupCreateOptions): Group {
      return waitForPromiseResult(this._asyncApi.create(params));
    }

    get(groupId: string): Group {
      return waitForPromiseResult(this._asyncApi.get(groupId));
    }

    list(options?: { limit?: number }): Group[] {
      const result = waitForPromiseResult<{ groups: Group[]; total: number }>(
        this._asyncApi.list(options),
      );
      return result.groups;
    }

    update(groupId: string, params: GroupUpdateOptions): Group {
      return waitForPromiseResult(this._asyncApi.update(groupId, params));
    }

    delete(groupId: string): void {
      waitForPromiseResult(this._asyncApi.delete(groupId));
    }

    addMember(groupId: string, options: MemberAddOptions): GroupMember {
      return waitForPromiseResult(this._asyncApi.addMember(groupId, options));
    }

    removeMember(groupId: string, agentId: string): void {
      waitForPromiseResult(this._asyncApi.removeMember(groupId, agentId));
    }

    broadcast(
      groupId: string,
      message: Record<string, unknown>,
      excludeSender?: boolean,
    ): BroadcastResult {
      return waitForPromiseResult(
        this._asyncApi.broadcast(groupId, message, excludeSender),
      );
    }
  }

/**
 * Synchronous wrapper for Auth API
 */
export class SyncAuthAPI {
  private readonly _asyncApi: AuthAPI;

  constructor(asyncApi: AuthAPI) {
    this._asyncApi = asyncApi;
  }

  register(params: RegisterRequest): AuthRegisterResponse {
    return waitForPromiseResult(this._asyncApi.register(params));
  }

  login(params: LoginRequest): AuthLoginResponse {
    return waitForPromiseResult(this._asyncApi.login(params));
  }

  get_token(params: TokenRequest): AuthTokenResponse {
    return waitForPromiseResult(this._asyncApi.get_token(params));
  }

  refresh_token(): AuthRefreshResponse {
    return waitForPromiseResult(this._asyncApi.refresh_token());
  }
}

/**
 * Synchronous wrapper for API Keys API
 */
export class SyncAPIKeysAPI {
  private readonly _asyncApi: APIKeysAPI;

  constructor(asyncApi: APIKeysAPI) {
    this._asyncApi = asyncApi;
  }

  create(params?: CreateAPIKeyRequest): APIKeyCreated {
    return waitForPromiseResult(this._asyncApi.create(params));
  }

  list(): APIKeyListResponse {
    return waitForPromiseResult(this._asyncApi.list());
  }

  get(keyId: string): APIKey {
    return waitForPromiseResult(this._asyncApi.get(keyId));
  }

  delete(keyId: string): void {
    waitForPromiseResult(this._asyncApi.delete(keyId));
  }
}

/**
 * Synchronous CACP Client
 *
 * Example:
 * ```typescript
 * import { SyncCacpClient } from "cacp-sdk";
 *
 * const client = new SyncCacpClient({
 *   baseUrl: "http://localhost:4001",
 *   apiKey: "your-key",
 * });
 *
 * const agent = client.agents.register({
 *   name: "my-agent",
 *   capabilities: ["chat"]
 * });
 *
 * console.log(`Registered agent: ${agent.id}`);
 *
 * client.close();
 * ```
 */
export class SyncCacpClient {
  private readonly _asyncClient: CacpClient;
  private _agents?: SyncAgentsAPI;
  private _messaging?: SyncMessagingAPI;
  private _tasks?: SyncTasksAPI;
  private _groups?: SyncGroupsAPI;
  private _auth?: SyncAuthAPI;
  private _apiKeys?: SyncAPIKeysAPI;

  constructor(options: CacpClientOptions) {
    this._asyncClient = new CacpClient(options);
  }

  get agents(): SyncAgentsAPI {
    if (!this._agents) {
      this._agents = new SyncAgentsAPI(this._asyncClient.agents);
    }
    return this._agents;
  }

  get messaging(): SyncMessagingAPI {
    if (!this._messaging) {
      this._messaging = new SyncMessagingAPI(this._asyncClient.messaging);
    }
    return this._messaging;
  }

  get tasks(): SyncTasksAPI {
    if (!this._tasks) {
      this._tasks = new SyncTasksAPI(this._asyncClient.tasks);
    }
    return this._tasks;
  }

  get groups(): SyncGroupsAPI {
    if (!this._groups) {
      this._groups = new SyncGroupsAPI(this._asyncClient.groups);
    }
    return this._groups;
  }

  get auth(): SyncAuthAPI {
    if (!this._auth) {
      this._auth = new SyncAuthAPI(this._asyncClient.auth);
    }
    return this._auth;
  }

  get apiKeys(): SyncAPIKeysAPI {
    if (!this._apiKeys) {
      this._apiKeys = new SyncAPIKeysAPI(this._asyncClient.apiKeys);
    }
    return this._apiKeys;
  }

  close(): void {
    waitForPromiseResult(this._asyncClient.close());
  }

  get config() {
    return {
      baseUrl: this._asyncClient.getBaseUrl(),
      webSocketUrl: this._asyncClient.getWebSocketUrl(),
    };
  }
}