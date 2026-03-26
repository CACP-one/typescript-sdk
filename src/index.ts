/**
 * CACP TypeScript SDK
 *
 * Official TypeScript/JavaScript SDK for CACP - the universal messaging
 * and RPC layer for AI agent interoperability.
 */

export { CacpClient } from "./client";
export * from "./types";
export type { Logger, OnRequestCallback, OnResponseCallback } from "./types";
export * from "./errors";
export * from "./agents";
export * from "./messaging";
export { TasksAPI } from "./tasks";
export { GroupsAPI } from "./groups";
export { AuthAPI } from "./auth";
export type {
  User,
  Organization,
  AuthRegisterResponse,
  AuthLoginResponse,
  AuthTokenResponse,
  AuthRefreshResponse,
  RegisterRequest,
  LoginRequest,
  TokenRequest,
} from "./auth";
export { APIKeysAPI } from "./apiKeys";
export type {
  APIKey,
  APIKeyCreated,
  APIKeyListResponse,
  CreateAPIKeyRequest,
} from "./apiKeys";
export * from "./websocket";
export { PhoenixMessage, PhoenixChannel, PhoenixChannelClient } from "./channel";

export {
  SyncCacpClient,
  SyncAgentsAPI,
  SyncMessagingAPI,
  SyncTasksAPI,
  SyncGroupsAPI,
  SyncAuthAPI,
  SyncAPIKeysAPI,
} from "./sync-client";