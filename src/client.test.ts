import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacpClient } from './client';
import { CacpError, AuthenticationError, RateLimitError, ValidationError } from './errors';

describe('CacpClient', () => {
  describe('initialization', () => {
    it('should initialize with base URL', () => {
      const client = new CacpClient({ baseUrl: 'http://localhost:4001' });
      expect(client.getBaseUrl()).toBe('http://localhost:4001');
    });

    it('should initialize with API key', () => {
      const client = new CacpClient({
        baseUrl: 'http://localhost:4001',
        apiKey: 'test-key',
      });
      expect(client.getBaseUrl()).toBe('http://localhost:4001');
    });

    it('should initialize with JWT token', () => {
      const client = new CacpClient({
        baseUrl: 'http://localhost:4001',
        jwtToken: 'test-jwt',
      });
      expect(client.getBaseUrl()).toBe('http://localhost:4001');
    });

    it('should convert HTTP URL to WebSocket URL', () => {
      const clientHttp = new CacpClient({ baseUrl: 'http://localhost:4001' });
      expect(clientHttp.getWebSocketUrl()).toBe('ws://localhost:4001/ws/v1');

      const clientHttps = new CacpClient({ baseUrl: 'https://api.cacp.io' });
      expect(clientHttps.getWebSocketUrl()).toBe('wss://api.cacp.io/ws/v1');
    });
  });

  describe('API modules', () => {
    it('should lazily initialize agents API', () => {
      const client = new CacpClient({ baseUrl: 'http://localhost:4001' });
      expect(client.agents).toBeDefined();
    });

    it('should lazily initialize messaging API', () => {
      const client = new CacpClient({ baseUrl: 'http://localhost:4001' });
      expect(client.messaging).toBeDefined();
    });

    it('should lazily initialize websocket client', () => {
      const client = new CacpClient({ baseUrl: 'http://localhost:4001' });
      expect(client.websocket).toBeDefined();
    });
  });
});

describe('Error Classes', () => {
  it('should create CacpError with message', () => {
    const error = new CacpError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('CacpError');
  });

  it('should create CacpError with code', () => {
    const error = new CacpError('Test error', 'TEST_CODE');
    expect(error.code).toBe('TEST_CODE');
    expect(error.toString()).toBe('[TEST_CODE] Test error');
  });

  it('should create AuthenticationError', () => {
    const error = new AuthenticationError('Invalid credentials');
    expect(error.message).toBe('Invalid credentials');
    expect(error.code).toBe('AUTH_ERROR');
  });

  it('should create RateLimitError with retry after', () => {
    const error = new RateLimitError(60, 'Too many requests');
    expect(error.retryAfter).toBe(60);
    expect(error.message).toContain('60');
  });

  it('should create ValidationError with field', () => {
    const error = new ValidationError('Invalid value', 'name');
    expect(error.field).toBe('name');
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});