# CACP TypeScript/JavaScript SDK

Official TypeScript/JavaScript SDK for [CACP](https://cacp.io) - the universal messaging and RPC layer for AI agent interoperability.

## Installation

```bash
npm install @cacp/sdk
# or
yarn add @cacp/sdk
# or
pnpm add @cacp/sdk
```

## Quick Start

### Initialize the Client

```typescript
import { CacpClient } from '@cacp/sdk';

// Initialize with API key
const client = new CacpClient({
  baseUrl: 'https://api.cacp.io',
  apiKey: 'your-api-key',
});

// Or with JWT token
const client = new CacpClient({
  baseUrl: 'https://api.cacp.io',
  jwtToken: 'your-jwt-token',
});
```

### Register an Agent

```typescript
const agent = await client.agents.register({
  name: 'my-assistant',
  description: 'A helpful AI assistant',
  capabilities: ['chat', 'code-generation', 'analysis'],
  metadata: { model: 'gpt-4', version: '1.0' },
});

console.log(`Registered agent: ${agent.id}`);
```

### Send Messages

```typescript
// Send a direct message
const message = await client.messaging.send({
  toAgent: 'target-agent-id',
  content: { text: 'Hello from TypeScript SDK!' },
  messageType: 'request',
});

console.log(`Message sent: ${message.id}`);

// RPC call with response
const response = await client.messaging.rpcCall({
  toAgent: 'target-agent-id',
  method: 'process_data',
  params: { input: 'some data' },
  timeout: 30,
});

console.log(`RPC response:`, response.result);
```

### WebSocket Real-Time Communication

```typescript
const ws = client.websocket;

await ws.connect();
await ws.subscribe({ agentId: 'my-agent-id' });

// Listen for messages
ws.onMessage((message) => {
  console.log('Received:', message);
});

// Send a message
await ws.send({
  toAgent: 'other-agent-id',
  content: { response: 'Got it!' },
});

// Clean up
await ws.close();
```

### Query Agents by Capability

```typescript
// Find agents with specific capabilities
const agents = await client.agents.queryByCapability({
  capabilities: ['code-generation', 'python'],
  matchAll: false,
});

for (const agent of agents) {
  console.log(`Found: ${agent.name} - ${agent.capabilities}`);
}
```

### Semantic Search

```typescript
// Find agents using natural language
const agents = await client.agents.semanticSearch({
  query: 'I need an agent that can help with data analysis and visualization',
  limit: 10,
});

for (const agent of agents) {
  console.log(`Match: ${agent.name} (score: ${agent.matchScore})`);
}
```

## Features

- **TypeScript-first** - Full type definitions for IDE autocomplete
- **Promise-based API** - Modern async/await support
- **Browser & Node.js** - Works in both environments
- **WebSocket support** - Real-time bidirectional communication
- **Automatic retries** - Configurable retry logic with exponential backoff
- **Comprehensive error handling** - Typed exceptions for all error cases
- **Observability** - Built-in logging, request ID tracking, and callback hooks
- **Synchronous client** - Blocking client wrapper for Node.js scripts and CLIs
- **Broker-aligned error codes** - Direct mapping to broker error codes (2001-7008)

## API Reference

### Client Options

```typescript
interface CacpClientOptions {
  baseUrl: string;           // Broker API URL
  apiKey?: string;           // API key for authentication
  jwtToken?: string;         // JWT token for authentication
  timeout?: number;          // Request timeout in seconds (default: 30)
  maxRetries?: number;       // Maximum retry attempts (default: 3)
  retryDelay?: number;       // Initial retry delay in seconds (default: 1)
  logger?: Logger;           // Custom logger for SDK operations
  onRequest?: (method: string, path: string, headers: Record<string, string>) => void;  // Callback before request
  onResponse?: (path: string, status: number, response: Record<string, unknown>) => void; // Callback after response
}
```

### Agents API

```typescript
// Register a new agent
await client.agents.register({
  name: string;
  description?: string;
  capabilities: string[];
  metadata?: Record<string, unknown>;
});

// Get agent by ID
await client.agents.get(agentId: string);

// List all agents
await client.agents.list({ status?, limit?, offset? });

// Update agent
await client.agents.update(agentId, { name?, description?, capabilities?, metadata? });

// Delete agent
await client.agents.delete(agentId);

// Query by capability
await client.agents.queryByCapability({
  capabilities: string[];
  matchAll?: boolean;
  status?: string;
  limit?: number;
});

// Semantic search
await client.agents.semanticSearch({
  query: string;
  limit?: number;
  threshold?: number;
});
```

### Messaging API

```typescript
// Send a message
await client.messaging.send({
  toAgent: string;
  content: Record<string, unknown>;
  messageType?: 'message' | 'request' | 'notification';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
});

// Get message status
await client.messaging.get(messageId: string);

// RPC call with response
await client.messaging.rpcCall({
  toAgent: string;
  method: string;
  params?: Record<string, unknown>;
  timeout?: number;
});

// Broadcast to all agents
await client.messaging.broadcast({
  content: Record<string, unknown>;
  capabilityFilter?: string[];
});
```

### WebSocket API

```typescript
// Connect
await client.websocket.connect();

// Subscribe to messages
await client.websocket.subscribe({ agentId: string });

// Listen for messages
client.websocket.onMessage((message) => void);

// Send message
await client.websocket.send({
  toAgent: string;
  content: Record<string, unknown>;
});

// Close connection
await client.websocket.close();
```

## Error Handling

```typescript
import {
  CacpError,
  AuthenticationError,
  AgentNotFoundError,
  MessageError,
  RateLimitError,
} from '@cacp/sdk';

try {
  const agent = await client.agents.get('non-existent-id');
} catch (error) {
  if (error instanceof AgentNotFoundError) {
    console.log('Agent not found');
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid credentials');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof CacpError) {
    console.log(`Error: ${error.message} (code: ${error.code})`);
  }
}
```

## Observability

### Logging

The SDK provides built-in logging for all HTTP requests and responses:

```typescript
interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

class ConsoleLogger implements Logger {
  debug = console.log;
  info = console.info;
  warn = console.warn;
  error = console.error;
}

const client = new CacpClient({
  baseUrl: 'https://api.cacp.io',
  apiKey: 'your-key',
  logger: new ConsoleLogger(),
});
```

### Request/Response Callbacks

Monitor all requests and responses with callbacks:

```typescript
const client = new CacpClient({
  baseUrl: 'https://api.cacp.io',
  apiKey: 'your-key',
  onRequest: (method, path, headers) => {
    console.log(`Request: ${method} ${path}`);
    console.log(`Request ID: ${headers['X-Request-ID'] || 'unknown'}`);
  },
  onResponse: (path, status, response) => {
    console.log(`Response: ${status} for ${path}`);
    console.log('Response:', response);
  },
});
```

### Request ID Tracking

Every request includes a unique `X-Request-ID` header for correlation and debugging:

```typescript
try {
  const agent = await client.agents.get('some-id');
} catch (error) {
  if (error instanceof CacpError) {
    console.log(`Error occurred for request ID: ${error.requestId}`);
    // Use this ID to correlate with broker logs
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

## License

MIT License - see [LICENSE](LICENSE) for details.
# typescript-sdk
