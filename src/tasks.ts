/**
 * CACP SDK Tasks API
 */

import type { CacpClient } from "./client";
import type { Task, TaskCreateOptions, TaskListResponse } from "./types";

export class TasksAPI {
  private readonly client: CacpClient;

  constructor(client: CacpClient) {
    this.client = client;
  }

  /**
   * Create a new task
   */
  async create(options: TaskCreateOptions): Promise<Task> {
    return this.client.post<Task>("/v1/tasks", options);
  }

  /**
   * Get a task by ID
   */
  async get(taskId: string): Promise<Task> {
    return this.client.get<Task>(`/v1/tasks/${taskId}`);
  }

  /**
   * List tasks with optional filters
   */
  async list(options?: {
    status?: string;
    taskType?: string;
    senderAgentId?: string;
    recipientAgentId?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<TaskListResponse> {
    const response = await this.client.get<{ tasks: Task[]; count: number }>(
      "/v1/tasks",
      options as Record<string, unknown>,
    );

    return {
      tasks: response.tasks,
      total: response.count,
      limit: options?.limit ?? 100,
      offset: options?.offset ?? 0,
    };
  }

  /**
   * Cancel a task
   */
  async cancel(taskId: string): Promise<Task> {
    return this.client.post<Task>(`/v1/tasks/${taskId}/cancel`);
  }

  /**
   * Retry a failed task
   */
  async retry(taskId: string): Promise<Task> {
    return this.client.post<Task>(`/v1/tasks/${taskId}/retry`);
  }
}