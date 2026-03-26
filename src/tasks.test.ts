/**
 * Tests for Tasks API
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CacpClient } from "./client";
import { TasksAPI } from "./tasks";
import type { Task } from "./tasks";

describe("TasksAPI", () => {
  let client: CacpClient;
  let tasksApi: TasksAPI;

  beforeEach(() => {
    client = new CacpClient({
      baseUrl: "http://localhost:4001",
      apiKey: "test-key",
    });
    tasksApi = client.tasks;
  });

  describe("create", () => {
    it("should create a new task", async () => {
      const mockTask: Task = {
        id: "task_abc123",
        taskType: "data-processing",
        status: "pending",
        priority: "normal",
        payload: { data_source: "s3://bucket/data.csv" },
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        metadata: {},
      };

      vi.spyOn(client, "post").mockResolvedValue(mockTask);

      const task = await tasksApi.create({
        taskType: "data-processing",
        payload: { data_source: "s3://bucket/data.csv" },
        priority: "normal",
      });

      expect(task.id).toBe("task_abc123");
      expect(task.taskType).toBe("data-processing");
      expect(task.status).toBe("pending");
      expect(client.post).toHaveBeenCalledWith("/v1/tasks", {
        taskType: "data-processing",
        payload: { data_source: "s3://bucket/data.csv" },
        priority: "normal",
      });
    });

    it("should create a scheduled task", async () => {
      const mockTask: Task = {
        id: "task_def456",
        taskType: "scheduled-job",
        status: "pending",
        priority: "high",
        retryCount: 0,
        maxRetries: 5,
        createdAt: new Date().toISOString(),
        scheduledAt: new Date().toISOString(),
        metadata: {},
      };

      vi.spyOn(client, "post").mockResolvedValue(mockTask);

      const task = await tasksApi.create({
        taskType: "scheduled-job",
        priority: "high",
        maxRetries: 5,
        scheduledAt: new Date().toISOString(),
      });

      expect(task.maxRetries).toBe(5);
      expect(task.scheduledAt).toBeDefined();
    });
  });

  describe("get", () => {
    it("should get a task by ID", async () => {
      const mockTask: Task = {
        id: "task_xyz789",
        taskType: "data-processing",
        status: "running",
        priority: "normal",
        payload: { data_source: "s3://bucket/data.csv" },
        retryCount: 1,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        metadata: {},
      };

      vi.spyOn(client, "get").mockResolvedValue(mockTask);

      const task = await tasksApi.get("task_xyz789");

      expect(task.id).toBe("task_xyz789");
      expect(task.status).toBe("running");
      expect(task.retryCount).toBe(1);
      expect(client.get).toHaveBeenCalledWith("/v1/tasks/task_xyz789");
    });
  });

  describe("list", () => {
    it("should list tasks with filters", async () => {
      const mockResponse = {
        tasks: [
          {
            id: "task_1",
            taskType: "data-processing",
            status: "running" as const,
            priority: "normal",
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date().toISOString(),
            metadata: {},
          },
          {
            id: "task_2",
            taskType: "analysis",
            status: "running" as const,
            priority: "normal",
            retryCount: 1,
            maxRetries: 3,
            createdAt: new Date().toISOString(),
            metadata: {},
          },
        ],
        count: 2,
      };

      vi.spyOn(client, "get").mockResolvedValue(mockResponse);

      const tasks = await tasksApi.list({
        status: "running",
        limit: 10,
      });

      expect(tasks.tasks).toHaveLength(2);
      expect(tasks.total).toBe(2);
      expect(tasks.tasks[0].status).toBe("running");
      expect(tasks.tasks[1].status).toBe("running");
    });

    it("should list all tasks without filters", async () => {
      const mockResponse = {
        tasks: [
          {
            id: "task_1",
            taskType: "data-processing",
            status: "completed" as const,
            priority: "normal",
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            metadata: {},
          },
        ],
        count: 1,
      };

      vi.spyOn(client, "get").mockResolvedValue(mockResponse);

      const tasks = await tasksApi.list();

      expect(tasks.tasks).toHaveLength(1);
      expect(tasks.total).toBe(1);
      expect(tasks.limit).toBe(100);
      expect(tasks.offset).toBe(0);
    });

    it("should apply multiple filters", async () => {
      const mockResponse = {
        tasks: [
          {
            id: "task_1",
            taskType: "data-processing",
            status: "failed" as const,
            priority: "high",
            senderAgentId: "agent_abc",
            retryCount: 3,
            maxRetries: 3,
            createdAt: new Date().toISOString(),
            metadata: {},
          },
        ],
        count: 1,
      };

      vi.spyOn(client, "get").mockResolvedValue(mockResponse);

      const tasks = await tasksApi.list({
        status: "failed",
        taskType: "data-processing",
        senderAgentId: "agent_abc",
        priority: "high",
      });

      expect(tasks.tasks[0].priority).toBe("high");
      expect(tasks.tasks[0].senderAgentId).toBe("agent_abc");
    });
  });

  describe("cancel", () => {
    it("should cancel a task", async () => {
      const mockTask: Task = {
        id: "task_xyz789",
        taskType: "data-processing",
        status: "cancelled",
        priority: "normal",
        retryCount: 1,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        metadata: {},
      };

      vi.spyOn(client, "post").mockResolvedValue(mockTask);

      const task = await tasksApi.cancel("task_xyz789");

      expect(task.status).toBe("cancelled");
      expect(client.post).toHaveBeenCalledWith("/v1/tasks/task_xyz789/cancel");
    });
  });

  describe("retry", () => {
    it("should retry a failed task", async () => {
      const mockTask: Task = {
        id: "task_xyz789",
        taskType: "data-processing",
        status: "queued",
        priority: "normal",
        retryCount: 2,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        metadata: {},
      };

      vi.spyOn(client, "post").mockResolvedValue(mockTask);

      const task = await tasksApi.retry("task_xyz789");

      expect(task.status).toBe("queued");
      expect(task.retryCount).toBe(2);
      expect(client.post).toHaveBeenCalledWith("/v1/tasks/task_xyz789/retry");
    });
  });

  describe("lazy initialization", () => {
    it("should lazy initialize tasks API", () => {
      expect(client["tasks"]).toBeDefined();
      const tasksApi2 = client.tasks;
      expect(tasksApi).toBe(tasksApi2);
    });
  });
});