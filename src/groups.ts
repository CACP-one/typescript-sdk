/**
 * CACP SDK Groups API
 */

import type { CacpClient } from "./client";
import type { Group, GroupCreateOptions, GroupUpdateOptions, GroupMember, BroadcastResult, MemberAddOptions } from "./types";

export class GroupsAPI {
  private readonly client: CacpClient;

  constructor(client: CacpClient) {
    this.client = client;
  }

  /**
   * Create a new group
   */
  async create(options: GroupCreateOptions): Promise<Group> {
    return this.client.post<Group>("/v1/groups", options);
  }

  /**
   * List all groups
   */
  async list(options?: { limit?: number; offset?: number }): Promise<{ groups: Group[]; total: number; limit: number; offset: number }> {
    const response = await this.client.get<{ groups: Group[]; count: number }>(
      "/v1/groups",
      options as Record<string, unknown>,
    );

    return {
      groups: response.groups,
      total: response.count,
      limit: options?.limit ?? 100,
      offset: options?.offset ?? 0,
    };
  }

  /**
   * Get a group by ID (including members)
   */
  async get(groupId: string): Promise<Group> {
    return this.client.get<Group>(`/v1/groups/${groupId}`);
  }

  /**
   * Update an existing group
   */
  async update(groupId: string, options: GroupUpdateOptions): Promise<Group> {
    return this.client.put<Group>(`/v1/groups/${groupId}`, options);
  }

  /**
   * Delete a group
   */
  async delete(groupId: string): Promise<void> {
    await this.client.delete(`/v1/groups/${groupId}`);
  }

  /**
   * Add a member to a group
   */
  async addMember(groupId: string, options: MemberAddOptions): Promise<GroupMember> {
    return this.client.post<GroupMember>(`/v1/groups/${groupId}/members`, options);
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, agentId: string): Promise<void> {
    await this.client.delete(`/v1/groups/${groupId}/members/${agentId}`);
  }

  /**
   * Broadcast a message to all members of a group
   */
  async broadcast(
    groupId: string,
    message: Record<string, unknown>,
    excludeSender: boolean = true,
  ): Promise<BroadcastResult> {
    return this.client.post<BroadcastResult>(`/v1/groups/${groupId}/message`, {
      message,
      exclude_sender: excludeSender,
    });
  }
}