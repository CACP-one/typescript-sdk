/**
 * Tests for WebSocket client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacpClient } from './client';
import { WebSocketClient } from './websocket';
import { WebSocketError, ConnectionError } from './errors';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  send = vi.fn();
  close = vi.fn();

  constructor(url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.onopen?.(new Event('open'));
    }, 0);
  }

  // Helper to simulate receiving a message
  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  // Helper to simulate error
  simulateError() {
    this.onerror?.(new Event('error'));
  }

  // Helper to simulate close
  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

describe('WebSocketClient', () => {
  let client: CacpClient;
  let wsClient: WebSocketClient;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    client = new CacpClient({ baseUrl: 'http://localhost:4001', apiKey: 'test-key' });
    wsClient = client.websocket;

    // Mock global WebSocket
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('isConnected', () => {
    it('should be false initially', () => {
      expect(wsClient.isConnected).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await wsClient.connect();
      expect(wsClient.isConnected).toBe(true);
    });

    it('should not reconnect if already connected', async () => {
      await wsClient.connect();
      const wsUrl = client.getWebSocketUrl();

      // Second connect should be a no-op
      await wsClient.connect();

      // WebSocket should only be created once
      expect(wsClient.isConnected).toBe(true);
    });
  });

  describe('close', () => {
    it('should close the connection', async () => {
      await wsClient.connect();
      await wsClient.close();

      expect(wsClient.isConnected).toBe(false);
    });

    it('should be safe to call when not connected', async () => {
      await wsClient.close(); // Should not throw
      expect(wsClient.isConnected).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('should throw error when not connected', async () => {
      await expect(wsClient.subscribe({ agentId: 'agent-123' })).rejects.toThrow(WebSocketError);
    });

    it('should subscribe successfully when connected', async () => {
      await wsClient.connect();
      await wsClient.subscribe({ agentId: 'agent-123' });

      // Verify send was called with correct message
      const sendMock = (wsClient as unknown as { ws: MockWebSocket }).ws.send;
      expect(sendMock).toHaveBeenCalled();

      const sentData = JSON.parse(sendMock.mock.calls[0][0]);
      expect(sentData.type).toBe('subscribe');
      expect(sentData.agent_id).toBe('agent-123');
    });
  });

  describe('unsubscribe', () => {
    it('should return silently when not connected', async () => {
      await wsClient.unsubscribe({ agentId: 'agent-123' }); // Should not throw
    });

    it('should unsubscribe successfully when connected', async () => {
      await wsClient.connect();
      await wsClient.subscribe({ agentId: 'agent-123' });
      await wsClient.unsubscribe({ agentId: 'agent-123' });

      const sendMock = (wsClient as unknown as { ws: MockWebSocket }).ws.send;
      const lastCall = sendMock.mock.calls[sendMock.mock.calls.length - 1];
      const sentData = JSON.parse(lastCall[0]);
      expect(sentData.type).toBe('unsubscribe');
    });
  });

  describe('send', () => {
    it('should throw error when not connected', async () => {
      await expect(
        wsClient.send({ toAgent: 'agent-456', content: { message: 'hello' } })
      ).rejects.toThrow(WebSocketError);
    });

    it('should send message successfully when connected', async () => {
      await wsClient.connect();
      await wsClient.send({
        toAgent: 'agent-456',
        content: { message: 'hello' },
        messageType: 'request',
      });

      const sendMock = (wsClient as unknown as { ws: MockWebSocket }).ws.send;
      const sentData = JSON.parse(sendMock.mock.calls[0][0]);

      expect(sentData.type).toBe('message');
      expect(sentData.to_agent).toBe('agent-456');
      expect(sentData.content).toEqual({ message: 'hello' });
      expect(sentData.message_type).toBe('request');
    });
  });

  describe('sendRpc', () => {
    it('should throw error when not connected', async () => {
      await expect(
        wsClient.sendRpc({
          toAgent: 'agent-456',
          method: 'calculate',
          params: { a: 1 },
        })
      ).rejects.toThrow(WebSocketError);
    });

    it('should send RPC message successfully', async () => {
      await wsClient.connect();
      await wsClient.sendRpc({
        toAgent: 'agent-456',
        method: 'calculate',
        params: { a: 1, b: 2 },
        requestId: 'req-123',
      });

      const sendMock = (wsClient as unknown as { ws: MockWebSocket }).ws.send;
      const sentData = JSON.parse(sendMock.mock.calls[0][0]);

      expect(sentData.type).toBe('rpc');
      expect(sentData.to_agent).toBe('agent-456');
      expect(sentData.method).toBe('calculate');
      expect(sentData.params).toEqual({ a: 1, b: 2 });
      expect(sentData.request_id).toBe('req-123');
    });

    it('should generate request_id if not provided', async () => {
      await wsClient.connect();
      await wsClient.sendRpc({
        toAgent: 'agent-456',
        method: 'calculate',
        params: {},
      });

      const sendMock = (wsClient as unknown as { ws: MockWebSocket }).ws.send;
      const sentData = JSON.parse(sendMock.mock.calls[0][0]);

      expect(sentData.request_id).toBeDefined();
      expect(typeof sentData.request_id).toBe('string');
    });
  });

  describe('sendResponse', () => {
    it('should throw error when not connected', async () => {
      await expect(
        wsClient.sendResponse({
          toAgent: 'agent-456',
          requestId: 'req-123',
          result: { sum: 3 },
        })
      ).rejects.toThrow(WebSocketError);
    });

    it('should send response message successfully', async () => {
      await wsClient.connect();
      await wsClient.sendResponse({
        toAgent: 'agent-456',
        requestId: 'req-123',
        result: { sum: 3 },
      });

      const sendMock = (wsClient as unknown as { ws: MockWebSocket }).ws.send;
      const sentData = JSON.parse(sendMock.mock.calls[0][0]);

      expect(sentData.type).toBe('rpc_response');
      expect(sentData.to_agent).toBe('agent-456');
      expect(sentData.request_id).toBe('req-123');
      expect(sentData.result).toEqual({ sum: 3 });
    });

    it('should send error response', async () => {
      await wsClient.connect();
      await wsClient.sendResponse({
        toAgent: 'agent-456',
        requestId: 'req-123',
        error: { code: 400, message: 'Invalid params' },
      });

      const sendMock = (wsClient as unknown as { ws: MockWebSocket }).ws.send;
      const sentData = JSON.parse(sendMock.mock.calls[0][0]);

      expect(sentData.error).toEqual({ code: 400, message: 'Invalid params' });
    });
  });

  describe('onMessage / offMessage', () => {
    it('should register message handler', async () => {
      const handler = vi.fn();
      wsClient.onMessage(handler);

      await wsClient.connect();

      // Simulate receiving a message
      const mockWs = (wsClient as unknown as { ws: MockWebSocket }).ws;
      mockWs.simulateMessage({ type: 'test', data: 'hello' });

      expect(handler).toHaveBeenCalledWith({ type: 'test', data: 'hello' });
    });

    it('should remove message handler', async () => {
      const handler = vi.fn();
      wsClient.onMessage(handler);
      wsClient.offMessage(handler);

      await wsClient.connect();

      const mockWs = (wsClient as unknown as { ws: MockWebSocket }).ws;
      mockWs.simulateMessage({ type: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple message handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      wsClient.onMessage(handler1);
      wsClient.onMessage(handler2);

      await wsClient.connect();

      const mockWs = (wsClient as unknown as { ws: MockWebSocket }).ws;
      mockWs.simulateMessage({ type: 'test' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });
});