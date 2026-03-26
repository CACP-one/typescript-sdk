/**
 * CACP SDK Auth API
 *
 * Authentication and token management operations.
 */

import type { CacpClient } from "./client";

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface Organization {
  id: string;
  name: string;
  plan_type?: string;
}

export interface AuthRegisterResponse {
  token: string;
  user: User;
  organization: Organization;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
  organization_id: string;
}

export interface AuthTokenResponse {
  token: string;
  user?: User;
  agent_id?: string;
  organization_id: string;
  token_type?: string;
}

export interface AuthRefreshResponse {
  token: string;
  token_type: string;
  user?: User;
  agent_id?: string;
  organization_id: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  user_name: string;
  organization_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenRequest {
  api_key: string;
}

export class AuthAPI {
  private readonly client: CacpClient;

  constructor(client: CacpClient) {
    this.client = client;
  }

  /**
   * Register a new user and create an organization.
   *
   * @param options - Registration details
   * @returns AuthRegisterResponse with token, user, and organization
   * @throws ValidationError if required fields are missing or invalid
   *
   * @example
   * ```typescript
   * const result = await client.auth.register({
   *   email: "user@example.com",
   *   password: "secure-password",
   *   user_name: "John Doe",
   *   organization_name: "Acme Corp"
   * });
   * console.log(`Token: ${result.token}`);
   * ```
   */
  async register(options: RegisterRequest): Promise<AuthRegisterResponse> {
    return this.client.post<AuthRegisterResponse>("/v1/auth/register", {
      email: options.email,
      password: options.password,
      user_name: options.user_name,
      organization_name: options.organization_name,
    });
  }

  /**
   * Login with email and password.
   *
   * @param options - Login credentials
   * @returns AuthLoginResponse with token and user info
   * @throws AuthenticationError if credentials are invalid (code 5001)
   *
   * @example
   * ```typescript
   * const result = await client.auth.login({
   *   email: "user@example.com",
   *   password: "secure-password"
   * });
   * console.log(`Token: ${result.token}`);
   * ```
   */
  async login(options: LoginRequest): Promise<AuthLoginResponse> {
    return this.client.post<AuthLoginResponse>("/v1/auth/login", {
      email: options.email,
      password: options.password,
    });
  }

  /**
   * Exchange an API key for a JWT token.
   *
   * @param options - API key to exchange
   * @returns AuthTokenResponse with token and owner info
   * @throws AuthenticationError if API key is invalid (code 5002) or expired (code 5003)
   *
   * @example
   * ```typescript
   * const result = await client.auth.get_token({ api_key: "cacp_xxx..." });
   * console.log(`Token: ${result.token}`);
   * ```
   */
  async get_token(options: TokenRequest): Promise<AuthTokenResponse> {
    return this.client.post<AuthTokenResponse>("/v1/auth/token", {
      api_key: options.api_key,
    });
  }

  /**
   * Refresh the current JWT token.
   *
   * The current JWT token must be provided in the Authorization header.
   * Returns a new token with extended expiration.
   *
   * @returns AuthRefreshResponse with new token
   * @throws AuthenticationError if token is invalid or expired (codes 5005, 5006)
   *
   * @example
   * ```typescript
   * // Assuming client is initialized with a JWT token
   * const result = await client.auth.refresh_token();
   * console.log(`New token: ${result.token}`);
   * ```
   */
  async refresh_token(): Promise<AuthRefreshResponse> {
    return this.client.post<AuthRefreshResponse>("/v1/auth/refresh");
  }
}