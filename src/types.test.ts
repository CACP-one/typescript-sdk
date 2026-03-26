import { describe, it, expect } from 'vitest';
import type {
  Agent,
  AgentStatus,
  Message,
  MessageStatus,
  MessageType,
  RpcResponse,
} from './types';

describe('Types', () => {
  describe('Agent Types', () => {
    it('should define valid AgentStatus values', () => {
      const statuses: AgentStatus[] = ['online', 'offline', 'degraded', 'error', 'maintenance'];
      expect(statuses).toHaveLength(5);
    });

    it('should define valid MessageType values', () => {
      const types: MessageType[] = ['message', 'request', 'response', 'notification', 'broadcast', 'rpc'];
      expect(types).toHaveLength(6);
    });

    it('should define valid MessageStatus values', () => {
      const statuses: MessageStatus[] = ['pending', 'delivered', 'processing', 'completed', 'failed', 'timeout'];
      expect(statuses).toHaveLength(6);
    });

    it('should create a valid Agent object', () => {
      const agent: Agent = {
        id: 'agent_123',
        name: 'test-agent',
        description: 'A test agent',
        capabilities: ['chat', 'code'],
        status: 'online',
        metadata: { version: '1.0' },
      };

      expect(agent.id).toBe('agent_123');
      expect(agent.capabilities).toContain('chat');
    });
  });

  describe('Message Types', () => {
    it('should create a valid Message object', () => {
      const message: Message = {
        id: 'msg_123',
        fromAgent: 'agent_1',
        toAgent: 'agent_2',
        content: { text: 'Hello' },
        messageType: 'message',
        status: 'pending',
        priority: 'normal',
        metadata: {},
      };

      expect(message.id).toBe('msg_123');
      expect(message.content).toEqual({ text: 'Hello' });
    });
  });

  describe('RPC Types', () => {
    it('should create a valid RpcResponse with result', () => {
      const response: RpcResponse = {
        id: 'rpc_123',
        fromAgent: 'agent_456',
        result: { sum: 30 },
        executionTime: 0.05,
      };

      expect(response.id).toBe('rpc_123');
      expect(response.result).toEqual({ sum: 30 });
      expect(response.error).toBeUndefined();
    });

    it('should create a valid RpcResponse with error', () => {
      const response: RpcResponse = {
        id: 'rpc_123',
        fromAgent: 'agent_456',
        error: { code: 500, message: 'Internal error' },
      };

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(500);
      expect(response.result).toBeUndefined();
    });
  });
});