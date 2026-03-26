import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentsAPI } from './agents';
import { CacpClient } from './client';
import type { Agent, AgentListResponse, HealthStatus } from './types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AgentsAPI', () => {
  let client: CacpClient;
  let agents: AgentsAPI;

  beforeEach(() => {
    client = new CacpClient({
      baseUrl: 'http://localhost:4001',
      apiKey: 'test-key',
    });
    agents = new AgentsAPI(client);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new agent', async () => {
      const mockAgent: Agent = {
        id: 'agent_123',
        name: 'test-agent',
        description: 'Test agent',
        capabilities: ['chat', 'code'],
        status: 'offline',
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockAgent)),
      });

      const result = await agents.register({
        name: 'test-agent',
        description: 'Test agent',
        capabilities: ['chat', 'code'],
      });

      expect(result.id).toBe('agent_123');
      expect(result.name).toBe('test-agent');
      expect(result.capabilities).toContain('chat');
    });
  });

  describe('get', () => {
    it('should get an agent by ID', async () => {
      const mockAgent: Agent = {
        id: 'agent_123',
        name: 'test-agent',
        capabilities: ['chat'],
        status: 'online',
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockAgent)),
      });

      const result = await agents.get('agent_123');

      expect(result.id).toBe('agent_123');
      expect(result.status).toBe('online');
    });
  });

  describe('list', () => {
    it('should list all agents', async () => {
      const mockResponse: AgentListResponse = {
        agents: [
          { id: 'agent_1', name: 'agent-1', capabilities: [], status: 'online', metadata: {} },
          { id: 'agent_2', name: 'agent-2', capabilities: [], status: 'offline', metadata: {} },
        ],
        total: 2,
        limit: 100,
        offset: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const result = await agents.list();

      expect(result.total).toBe(2);
      expect(result.agents).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update an agent', async () => {
      const mockAgent: Agent = {
        id: 'agent_123',
        name: 'updated-agent',
        capabilities: ['chat'],
        status: 'online',
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockAgent)),
      });

      const result = await agents.update('agent_123', { name: 'updated-agent' });

      expect(result.name).toBe('updated-agent');
    });
  });

  describe('delete', () => {
    it('should delete an agent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(agents.delete('agent_123')).resolves.not.toThrow();
    });
  });

  describe('queryByCapability', () => {
    it('should query agents by capability', async () => {
      const mockResponse = {
        agents: [
          {
            id: 'agent_1',
            name: 'code-agent',
            capabilities: ['code-generation', 'python'],
            status: 'online',
            metadata: {},
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const result = await agents.queryByCapability({
        capabilities: ['code-generation'],
        matchAll: false,
      });

      expect(result).toHaveLength(1);
      expect(result[0].capabilities).toContain('code-generation');
    });
  });

  describe('semanticSearch', () => {
    it('should perform semantic search', async () => {
      const mockResponse = {
        agents: [
          {
            id: 'agent_1',
            name: 'data-analyst',
            capabilities: ['data-analysis'],
            status: 'online',
            metadata: {},
            matchScore: 0.85,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const result = await agents.semanticSearch({
        query: 'I need help with data analysis',
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].matchScore).toBe(0.85);
    });
  });

  describe('getHealth', () => {
    it('should get agent health status', async () => {
      const mockHealth: HealthStatus = {
        agentId: 'agent_123',
        status: 'online',
        healthScore: 95.5,
        metrics: [],
        lastCheck: new Date().toISOString(),
        issues: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockHealth)),
      });

      const result = await agents.getHealth('agent_123');

      expect(result.agentId).toBe('agent_123');
      expect(result.healthScore).toBe(95.5);
    });
  });

  describe('heartbeat', () => {
    it('should send a heartbeat', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(agents.heartbeat('agent_123')).resolves.not.toThrow();
    });
  });
});