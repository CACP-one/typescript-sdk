import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MessagingAPI } from './messaging';
import { CacpClient } from './client';
import type { Message, RpcResponse } from './types';
import { MessageError, RpcError, TimeoutError } from './errors';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MessagingAPI', () => {
  let client: CacpClient;
  let messaging: MessagingAPI;

  beforeEach(() => {
    client = new CacpClient({
      baseUrl: 'http://localhost:4001',
      apiKey: 'test-key',
    });
    messaging = new MessagingAPI(client);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('send', () => {
    it('should send a message', async () => {
      const mockMessage: Message = {
        id: 'msg_123',
        toAgent: 'agent_456',
        content: { text: 'Hello' },
        messageType: 'message',
        status: 'pending',
        priority: 'normal',
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockMessage)),
      });

      const result = await messaging.send({
        toAgent: 'agent_456',
        content: { text: 'Hello' },
      });

      expect(result.id).toBe('msg_123');
      expect(result.toAgent).toBe('agent_456');
      expect(result.status).toBe('pending');
    });
  });

  describe('get', () => {
    it('should get a message by ID', async () => {
      const mockMessage: Message = {
        id: 'msg_123',
        toAgent: 'agent_456',
        fromAgent: 'agent_789',
        content: { text: 'Hello' },
        messageType: 'message',
        status: 'delivered',
        priority: 'normal',
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockMessage)),
      });

      const result = await messaging.get('msg_123');

      expect(result.id).toBe('msg_123');
      expect(result.status).toBe('delivered');
    });
  });

  describe('getStatus', () => {
    it('should get message status', async () => {
      const mockMessage: Message = {
        id: 'msg_123',
        toAgent: 'agent_456',
        content: {},
        messageType: 'message',
        status: 'completed',
        priority: 'normal',
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockMessage)),
      });

      const status = await messaging.getStatus('msg_123');

      expect(status).toBe('completed');
    });
  });

  describe('rpcCall', () => {
    it('should make an RPC call', async () => {
      const mockResponse: RpcResponse = {
        id: 'rpc_123',
        fromAgent: 'agent_456',
        result: { sum: 30 },
        executionTime: 0.05,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const result = await messaging.rpcCall({
        toAgent: 'agent_456',
        method: 'add',
        params: { a: 10, b: 20 },
      });

      expect(result.id).toBe('rpc_123');
      expect(result.result).toEqual({ sum: 30 });
    });

    it('should throw RpcError on error response', async () => {
      const mockResponse: RpcResponse = {
        id: 'rpc_123',
        fromAgent: 'agent_456',
        error: { code: 500, message: 'Internal error' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      await expect(
        messaging.rpcCall({
          toAgent: 'agent_456',
          method: 'add',
          params: {},
        })
      ).rejects.toThrow(RpcError);
    });
  });

  describe('broadcast', () => {
    it('should broadcast a message', async () => {
      const mockResponse = {
        messages: [
          {
            id: 'msg_1',
            toAgent: 'agent_1',
            content: { event: 'test' },
            messageType: 'broadcast',
            status: 'pending',
            priority: 'normal',
            metadata: {},
          },
          {
            id: 'msg_2',
            toAgent: 'agent_2',
            content: { event: 'test' },
            messageType: 'broadcast',
            status: 'pending',
            priority: 'normal',
            metadata: {},
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const result = await messaging.broadcast({
        content: { event: 'test' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].messageType).toBe('broadcast');
    });
  });

  describe('cancel', () => {
    it('should cancel a message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(messaging.cancel('msg_123')).resolves.not.toThrow();
    });
  });

  describe('retry', () => {
    it('should retry a failed message', async () => {
      const mockMessage: Message = {
        id: 'msg_new',
        toAgent: 'agent_456',
        content: { text: 'Hello' },
        messageType: 'message',
        status: 'pending',
        priority: 'normal',
        metadata: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockMessage)),
      });

      const result = await messaging.retry('msg_123');

      expect(result.id).toBe('msg_new');
      expect(result.status).toBe('pending');
    });
  });
});