/**
 * CACP SDK API Keys API
 *
 * API key management operations.
 */

import type { CacpClient } from "./client";

export interface APIKey {
  id: string;
  name: string;
  scopes: string[];
  expires_at?: string;
  last_used_at?: string;
  created_at?: string;
}

export interface APIKeyCreated {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  expires_at?: string;
  created_at?: string;
  owner_type: string;
  owner_id: string;
  warning: string;
}

export interface APIKeyListResponse {
  api_keys: APIKey[];
  total: number;
}

export interface CreateAPIKeyRequest {
  name?: string;
  scopes?: string[];
  expires_in_days?: number;
}

export class APIKeysAPI {
  private readonly client: CacpClient;

  constructor(client: CacpClient) {
    this.client = client;
  }

  /**
   * Create a new API key.
   *
   * The API key can be used for authenticating API requests.
   * The key is only returned once - store it securely.
   *
   * @param options - Key creation options
   * @returns APIKeyCreated with the key and metadata
   * @throws ValidationError if request is invalid
   * @throws AuthenticationError if not authenticated
   *
   * @example
   * ```typescript
   * const key = await client.apiKeys.create({
   *   name: "Production Key",
   *   scopes: ["read", "write"],
   *   expires_in_days: 90
   * });
   * console.log(`Key: ${key.key}`);
   * console.log(`Warning: ${key.warning}`);
   * ```
   */
  async create(options?: CreateAPIKeyRequest): Promise<APIKeyCreated> {
    return this.client.post<APIKeyCreated>("/v1/api-keys", options || {});
  }

  /**
   * List all API keys for the authenticated user/agent.
   *
   * Note: The actual key values are not returned in the list.
   *
   * @returns APIKeyListResponse with list of keys and total count
   * @throws AuthenticationError if not authenticated
   *
   * @example
   * ```typescript
   * const result = await client.apiKeys.list();
   * for (const key of result.api_keys) {
   *   console.log(`${key.name}: ${key.scopes.join(", ")}`);
   * }
   * ```
   */
  async list(): Promise<APIKeyListResponse> {
    return this.client.get<APIKeyListResponse>("/v1/api-keys");
  }

  /**
   * Get details of a specific API key.
   *
   * @param keyId - The API key ID
   * @returns APIKey with details
   * @throws NotFoundError if the key doesn't exist (code 2001)
   * @throws AuthenticationError if not authenticated
   *
   * @example
   * ```typescript
   * const key = await client.apiKeys.get("key_123");
   * console.log(`Name: ${key.name}`);
   * console.log(`Last used: ${key.last_used_at}`);
   * ```
   */
  async get(keyId: string): Promise<APIKey> {
    return this.client.get<APIKey>(`/v1/api-keys/${keyId}`);
  }

  /**
   * Delete (revoke) an API key.
   *
   * After deletion, the key can no longer be used for authentication.
   *
   * @param keyId - The API key ID to delete
   * @throws NotFoundError if the key doesn't exist (code 2001)
   * @throws AuthenticationError if not authenticated
   *
   * @example
   * ```typescript
   * await client.apiKeys.delete("key_123");
   * console.log("Key revoked");
   * ```
   */
  async delete(keyId: string): Promise<void> {
    await this.client.delete(`/v1/api-keys/${keyId}`);
  }
}