/**
 * CACP SDK Agents API
 */

import type {
  Agent,
  AgentRegistration,
  AgentUpdate,
  AgentListOptions,
  AgentListResponse,
  CapabilityQuery,
  SemanticSearchQuery,
  HealthStatus,
} from "./types";
import { CacpClient } from "./client";

export class AgentsAPI {
  private readonly client: CacpClient;

  constructor(client: CacpClient) {
    this.client = client;
  }

  /**
   * Register a new agent
   */
  async register(options: AgentRegistration): Promise<Agent> {
    return this.client.post<Agent>("/v1/agents", options);
  }

  /**
   * Get an agent by ID
   */
  async get(agentId: string): Promise<Agent> {
    return this.client.get<Agent>(`/v1/agents/${agentId}`);
  }

  /**
   * List all agents
   */
  async list(options?: AgentListOptions): Promise<AgentListResponse> {
    return this.client.get<AgentListResponse>(
      "/v1/agents",
      options as Record<string, unknown>,
    );
  }

  /**
   * Update an agent
   */
  async update(agentId: string, options: AgentUpdate): Promise<Agent> {
    return this.client.patch<Agent>(`/v1/agents/${agentId}`, options);
  }

  /**
   * Delete an agent
   */
  async delete(agentId: string): Promise<void> {
    await this.client.delete(`/v1/agents/${agentId}`);
  }

  /**
   * Query agents by capability
   */
  async queryByCapability(options: CapabilityQuery): Promise<Agent[]> {
    const response = await this.client.get<{ agents: Agent[] }>(
      "/v1/agents/query",
      {
        capabilities: options.capabilities.join(","),
        match_all: options.matchAll ?? false,
        status: options.status,
        limit: options.limit ?? 100,
      },
    );
    return response.agents;
  }

  /**
   * Semantic search for agents
   */
  async semanticSearch(options: SemanticSearchQuery): Promise<Agent[]> {
    const response = await this.client.post<{ agents: Agent[] }>(
      "/v1/agents/semantic-search",
      options,
    );
    return response.agents;
  }

  /**
   * Get agent health status
   */
  async getHealth(agentId: string): Promise<HealthStatus> {
    return this.client.get<HealthStatus>(`/v1/agents/${agentId}/health`);
  }

  /**
   * Set agent status
   */
  async setStatus(agentId: string, status: string): Promise<Agent> {
    return this.update(agentId, { status: status as Agent["status"] });
  }

  /**
   * Send a heartbeat
   */
  async heartbeat(agentId: string): Promise<void> {
    await this.client.post(`/v1/agents/${agentId}/heartbeat`);
  }

  /**
   * Discover agents using natural language semantic search.
   *
   * Uses embeddings to find agents whose capabilities or descriptions
   * semantically match the query. This is powered by AI-based semantic matching.
   *
   * @param options - Discovery options
   * @returns Array of matching agents with similarity scores
   * @throws CacpError if semantic matching is not configured (missing API key)
   *
   * @example
   * ```typescript
   * const agents = await client.agents.discover({
   *   query: "I need an agent that can help with data analysis",
   *   threshold: 0.6,
   *   limit: 5
   * });
   * for (const agent of agents) {
   *   console.log(`${agent.name}: score=${agent.match_score}`);
   * }
   * ```
   */
  async discover(options: {
    query: string;
    threshold?: number;
    limit?: number;
  }): Promise<Agent[]> {
    const response = await this.client.post<{ agents: Agent[] }>(
      "/v1/agents/discover",
      {
        query: options.query,
        threshold: options.threshold ?? 0.7,
        limit: options.limit ?? 10,
      }
    );
    return response.agents;
  }
}
