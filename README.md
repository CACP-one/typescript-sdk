# CACP TypeScript/JavaScript SDK

Official TypeScript/JavaScript SDK for [CACP](https://cacp.io) - the universal messaging and RPC layer for AI agent interoperability.

CACP enables AI agents built on different frameworks (LangChain, AutoGen, CrewAI, Vertex AI, Claude Agents, etc.) to communicate using a single open standard protocol.

## Features

- ✅ **Complete API Coverage** - All broker endpoints (Agents, Messaging, Tasks, Groups, Auth, API Keys)
- 🔄 **Async & Sync Clients** - Both async (`CacpClient`) and synchronous (`SyncCacpClient`) options (Node.js)
- 🌐 **WebSocket Support** - Real-time communication using Phoenix Channels protocol
- 🔐 **Flexible Authentication** - API keys and JWT token support with user registration
- 📦 **Type Safety** - Full TypeScript type definitions
- 🛡️ **Error Handling** - Comprehensive error classes with broker error codes (1001-6002)
- 🔄 **Auto Retry** - Configurable retry logic with exponential backoff
- 📊 **Rate Limiting** - Built-in rate limit handling
- 🔍 **Semantic Discovery** - Natural language agent discovery
- 👥 **Team Management** - Groups API for agent teams
- 📋 **Task Tracking** - Long-running asynchronous task management
- 🌍 **Universal** - Works in Node.js, browsers, and edge runtimes
- 🎯 **Framework Integrations** - Works seamlessly with LangChain.js

## Installation

```bash
npm install @cacp/sdk
# or
yarn add @cacp/sdk
# or
pnpm add @cacp/sdk
```

**Minimum Node.js version:** 18+

**Dependencies:**
- `eventsource` - Server-Sent Events support
- `ws` - WebSocket polyfill (browsers)

## Quick Start

### Async Client (Recommended)

```typescript
import { CacpClient } from "@cacp/sdk";

async function main() {
  // Initialize client with API key
  const client = new CacpClient({
    baseUrl: "http://localhost:4001",
    apiKey: "your-api-key",
  });

  try {
    // Register an agent
    const agent = await client.agents.register({
      name: "my-agent",
      capabilities: ["chat", "analysis"],
      metadata: { version: "1.0.0" },
    });
    console.log(`✓ Registered agent: ${agent.agent_id}`);

    // Send a message
    const message = await client.messaging.send({
      sender_id: agent.agent_id,
      recipient_id: "other-agent-id",
      message_type: "chat",
      payload: { text: "Hello, world!" },
    });
    console.log(`✓ Sent message: ${message.message_id}`);
  } finally {
    await client.close();
  }
}

main();
```

### Synchronous Client (Node.js Only)

```typescript
import { SyncCacpClient } from "@cacp/sdk";

async function main() {
  // Initialize sync client (Node.js only)
  const client = new SyncCacpClient({
    baseUrl: "http://localhost:4001",
    apiKey: "your-api-key",
  });

  // All the same methods, but blocking (no await needed)
  const agent = client.agents.register({
    name: "my-agent",
    capabilities: ["chat"],
  });
  console.log(`✓ Registered agent: ${agent.agent_id}`);

  await client.close();
}

main();
```

### Browser Usage

```typescript
import { CacpClient } from "@cacp/sdk";

// Works in browsers with native fetch
const client = new CacpClient({
  baseUrl: "https://api.cacp.io",
  apiKey: "your-api-key",
});

async function loadAgents() {
  const agents = await client.agents.list();
  renderAgents(agents.agents);
}
```

## Authentication

### Using API Key (Recommended for Services)

```typescript
import { CacpClient } from "@cacp/sdk";

const client = new CacpClient({
  baseUrl: "http://localhost:4001",
  apiKey: "your-api-key-here",
});
```

### Using JWT Token (For Users)

```typescript
import { CacpClient } from "@cacp/sdk";

const client = new CacpClient({
  baseUrl: "http://localhost:4001",
  jwtToken: "your-jwt-token-here",
});
```

### User Registration & Login

```typescript
import { CacpClient } from "@cacp/sdk";

const client = new CacpClient({
  baseUrl: "http://localhost:4001",
});

// Register a new user
const registerResponse = await client.auth.register({
  user_name: "john_doe",
  email: "john@example.com",
  password: "secure-password",
});
console.log(`✓ User registered: ${registerResponse.user.user_id}`);

// Login to get JWT token
const loginResponse = await client.auth.login({
  email: "john@example.com",
  password: "secure-password",
});
console.log(`✓ JWT token: ${loginResponse.access_token}`);

// Use the token
const authenticatedClient = new CacpClient({
  baseUrl: "http://localhost:4001",
  jwtToken: loginResponse.access_token,
});

// Refresh token when expired
const refreshResponse = await client.auth.refreshToken({
  refresh_token: loginResponse.refresh_token!,
});
```

## API Modules

### 1. Agents API

Manage agent registration, discovery, and health.

```typescript
// Register an agent
const agent = await client.agents.register({
  name: "analysis-agent",
  capabilities: ["analysis", "reporting", "financial"],
  metadata: {
    version: "1.0.0",
    description: "Financial analysis agent",
    model: "gpt-4",
  },
});

// List all agents
const agents = await client.agents.list();
for (const agent of agents.agents) {
  console.log(`${agent.name}: ${agent.capabilities.join(", ")}`);
}

// Get agent by ID
const agent = await client.agents.get("agent-123");

// Update agent
const updated = await client.agents.update("agent-123", {
  capabilities: ["analysis", "reporting", "visualization"],
});

// Delete agent
await client.agents.delete("agent-123");

// Query agents by capability
const agents = await client.agents.query("financial");

// Semantic agent discovery (NEW!)
const discovered = await client.agents.discover({
  query: "Find agents that can analyze financial data and generate reports",
  limit: 5,
});

for (const agent of discovered.agents) {
  console.log(`✓ Found: ${agent.name}`);
  console.log(`  Capabilities: ${agent.capabilities.join(", ")}`);
  console.log(`  Match score: ${agent.match_score}`);
}
```

### 2. Messaging API

Send and receive messages between agents.

```typescript
// Send a message
const message = await client.messaging.send({
  sender_id: "agent-123",
  recipient_id: "agent-456",
  message_type: "task",
  payload: {
    task_id: "task-789",
    description: "Analyze Q4 financial data",
    data: {
      dataset: "q4_data.csv",
      metrics: ["revenue", "profit", "growth"],
    },
  },
});
console.log(`✓ Message sent: ${message.message_id}`);

// RPC call (method invocation)
const response = await client.messaging.rpcCall({
  sender_id: "agent-123",
  recipient_id: "agent-456",
  method: "process_data",
  params: { input: "some data" },
  timeout: 30,
});
console.log(`✓ RPC response: ${response.result}`);

// Get message status
const status = await client.messaging.getStatus("msg-123");
console.log(`Status: ${status.status}`);

// Get message details
const message = await client.messaging.get("msg-123");
```

### 3. Tasks API (NEW!)

Manage long-running asynchronous tasks.

```typescript
// Create a task
const task = await client.tasks.create({
  agent_id: "agent-123",
  operation: "data-analysis",
  input_data: {
    dataset: "financial_data.csv",
    analysis_type: "time_series",
  },
  metadata: { priority: "high" },
});
console.log(`✓ Task created: ${task.task_id}`);

// List tasks
const tasks = await client.tasks.list({
  agent_id: "agent-123",
  status: "running",
});

// Get task details
const task = await client.tasks.get("task-123");
console.log(`Task status: ${task.status}`);

// Cancel a task
await client.tasks.cancel("task-123");

// Retry a failed task
const task = await client.tasks.retry("task-123");

// Poll task status
while (task.status === "pending" || task.status === "running") {
  const updatedTask = await client.tasks.get(task.task_id);
  if (updatedTask.status !== task.status) {
    console.log(`Task status: ${updatedTask.status}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
console.log(`✓ Task completed: ${task.status}, output: ${task.output}`);
```

### 4. Groups API (NEW!)

Manage agent groups for team communication and broadcasting.

```typescript
// Create a group
const group = await client.groups.create({
  name: "data-science-team",
  description: "Team for data science tasks",
});
console.log(`✓ Group created: ${group.id}`);

// Add members to group
await client.groups.addMember("group-123", "agent-456");
await client.groups.addMember("group-123", "agent-789");

// List groups
const groups = await client.groups.list();
for (const group of groups.groups) {
  console.log(`${group.name}: ${group.members.length} members`);
}

// Get group details
const group = await client.groups.get("group-123");

// Update group
const updated = await client.groups.update("group-123", {
  description: "Updated description",
});

// Broadcast message to group
const result = await client.groups.broadcast({
  group_id: "group-123",
  sender_id: "agent-123",
  message_type: "task",
  payload: { task: "Please analyze Q4 data" },
});
console.log(`✓ Broadcast to ${result.delivered_to.length} agents`);

// Remove member from group
await client.groups.removeMember("group-123", "agent-456");

// Delete group
await client.groups.delete("group-123");
```

### 5. API Keys API (NEW!)

Manage API keys for your account.

```typescript
// Create an API key
const keyResponse = await client.apiKeys.create({
  name: "production-key",
  scopes: ["agents:read", "agents:write", "messaging:send"],
});
const apiKey = keyResponse.api_key;
console.log(`✓ API key created: ${keyResponse.key_id}`);
console.log(`  Key (save this!): ${apiKey}`);

// List API keys
const keys = await client.apiKeys.list();
for (const key of keys.api_keys) {
  console.log(`${key.name}: ${key.key_id}`);
}

// Get API key details
const key = await client.apiKeys.get("key-123");

// Delete an API key
await client.apiKeys.delete("key-123");
```

### 6. WebSocket Support

Real-time communication using Phoenix Channels protocol.

```typescript
import { CacpClient } from "@cacp/sdk";

async function websocketExample() {
  const client = new CacpClient({
    baseUrl: "http://localhost:4001",
    jwtToken: "your-jwt-token",
  });

  try {
    // Connect to WebSocket
    await client.websocket.connect();

    // Join agent channel
    await client.websocket.joinAgentChannel("agent-123");

    // Define message handler
    const handleMessage = (message: PhoenixMessage) => {
      console.log(`📨 Received: ${message.payload}`);
      if (message.event === "message") {
        // Handle incoming messages
      } else if (message.event === "rpc_response") {
        // Handle RPC responses
      }
    };

    // Subscribe to messages
    await client.websocket.subscribe(handleMessage);

    // Send message via WebSocket
    await client.websocket.send({
      recipient_id: "agent-456",
      message_type: "chat",
      payload: { text: "Hello via WebSocket!" },
    });

    // Keep connection alive
    await new Promise((resolve) => setTimeout(resolve, 60000));

    // Disconnect
    await client.websocket.close();
  } finally {
    await client.close();
  }
}

websocketExample();
```

## Complete Tutorial: Building a Multi-Agent System

Let's build a complete multi-agent system with agent teams, tasks, and real-time communication.

```typescript
import { CacpClient } from "@cacp/sdk";

async function buildMultiAgentSystem() {
  const client = new CacpClient({
    baseUrl: "http://localhost:4001",
    apiKey: "your-api-key",
  });

  try {
    // ========================================
    // Step 1: Register specialized agents
    // ========================================
    console.log("Step 1: Registering agents...");

    const dataAgent = await client.agents.register({
      name: "data-analyst",
      capabilities: ["data-analysis", "statistics", "visualization"],
      metadata: { specialty: "financial data" },
    });
    console.log(`  ✓ Registered: ${dataAgent.name}`);

    const reportAgent = await client.agents.register({
      name: "report-writer",
      capabilities: ["writing", "reporting", "formatting"],
      metadata: { specialty: "business reports" },
    });
    console.log(`  ✓ Registered: ${reportAgent.name}`);

    // ========================================
    // Step 2: Create an agent team (group)
    // ========================================
    console.log("\nStep 2: Creating agent team...");

    const team = await client.groups.create({
      name: "financial-analysis-team",
      description: "Team for financial data analysis and reporting",
    });
    console.log(`  ✓ Created group: ${team.id}`);

    await client.groups.addMember(team.id, dataAgent.agent_id!);
    await client.groups.addMember(team.id, reportAgent.agent_id!);
    console.log(`  ✓ Added 2 members to team`);

    // ========================================
    // Step 3: Create background tasks
    // ========================================
    console.log("\nStep 3: Creating tasks...");

    const analysisTask = await client.tasks.create({
      agent_id: dataAgent.agent_id!,
      operation: "analyze_financial_data",
      input_data: {
        dataset: "q4_2024.csv",
        metrics: ["revenue", "profit", "growth"],
      },
      metadata: { priority: "high" },
    });
    console.log(`  ✓ Created analysis task: ${analysisTask.task_id}`);

    // ========================================
    // Step 4: Broadcast work to team
    // ========================================
    console.log("\nStep 4: Broadcasting task to team...");

    const result = await client.groups.broadcast({
      group_id: team.id,
      sender_id: dataAgent.agent_id!,
      message_type: "task",
      payload: {
        action: "prepare_report",
        data: analysisTask.task_id,
      },
    });
    console.log(`  ✓ Broadcast to ${result.delivered_to.length} agents`);

    // ========================================
    // Step 5: Monitor task completion
    // ========================================
    console.log("\nStep 5: Monitoring task completion...");

    let task = analysisTask;
    while (task.status === "pending" || task.status === "running") {
      task = await client.tasks.get(task.task_id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (task.status === "completed") {
      console.log(`  ✓ Task completed successfully`);
      console.log(`  Output: ${task.output}`);
    } else {
      console.log(`  ✗ Task failed: ${task.error}`);
    }

    // ========================================
    // Step 6: Semantic discovery for help
    // ========================================
    console.log("\nStep 6: Discovering agents for next task...");

    const discovered = await client.agents.discover({
      query: "Find agents that can create charts and visualize data",
      limit: 3,
    });

    console.log(`  Found ${discovered.agents.length} agents:`);
    for (const agent of discovered.agents) {
      console.log(`    - ${agent.name} (score: ${agent.match_score.toFixed(2)})`);
    }

    // ========================================
    // Step 7: Cleanup
    // ========================================
    console.log("\nStep 7: Cleaning up...");

    await client.groups.delete(team.id);
    await client.agents.delete(dataAgent.agent_id!);
    await client.agents.delete(reportAgent.agent_id!);
    console.log("  ✓ Cleanup complete");
  } finally {
    await client.close();
  }
}

buildMultiAgentSystem();
```

## Configuration

### Basic Configuration

```typescript
import { CacpClient } from "@cacp/sdk";

const client = new CacpClient({
  baseUrl: "http://localhost:4001",
  apiKey: "your-api-key",
  timeout: 30,           // Request timeout in seconds
  maxRetries: 3,         // Maximum retry attempts
  retryDelay: 1,         // Initial retry delay in seconds
});
```

### Custom Logger

```typescript
import { CacpClient } from "@cacp/sdk";

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
  baseUrl: "http://localhost:4001",
  apiKey: "your-api-key",
  logger: new ConsoleLogger(),
});
```

### Request/Response Callbacks

```typescript
import { CacpClient } from "@cacp/sdk";

const client = new CacpClient({
  baseUrl: "http://localhost:4001",
  apiKey: "your-api-key",
  onRequest: (method, path, headers) => {
    console.log(`→ Request: ${method} ${path}`);
    console.log(`  Request ID: ${headers["X-Request-ID"]}`);
  },
  onResponse: (path, status, response) => {
    console.log(`← Response: ${status} for ${path}`);
  },
});
```

## Error Handling

Comprehensive error handling with specific error types:

```typescript
import {
  CacpError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  TimeoutError,
  AgentNotFoundError,
  MessageError,
  TaskNotFoundError,
  GroupNotFoundError,
  InvalidCredentialsError,
  QuotaExceededError,
  RpcNotFoundError,
} from "@cacp/sdk";

try {
  const agent = await client.agents.get("non-existent");
} catch (error) {
  if (error instanceof AgentNotFoundError) {
    console.error(`✗ Agent not found: ${error.message}`);
    console.error(`  Error code: ${error.code}`);
    console.error(`  Request ID: ${error.requestId}`);
  } else if (error instanceof RateLimitError) {
    console.error(
      `✗ Rate limited, retry after ${error.retryAfter} seconds`
    );
  } else if (error instanceof AuthenticationError) {
    console.error(`✗ Authentication failed: ${error.message}`);
  } else if (error instanceof InvalidCredentialsError) {
    console.error(`✗ Invalid credentials: ${error.message}`);
  } else if (error instanceof QuotaExceededError) {
    console.error(`✗ Quota exceeded: ${error.message}`);
  } else if (error instanceof CacpError) {
    console.error(`✗ CACP error: ${error.message} (code: ${error.code})`);
  } else {
    console.error(`Unknown error: ${error}`);
  }
}
```

### Common Error Codes

| Error Code | Error Type | Description |
|------------|------------|-------------|
| 1001 | InvalidCredentialsError | Invalid credentials |
| 1002 | AccountDisabledError | Account disabled |
| 1003 | InvalidTokenError | Invalid token |
| 1004 | QuotaExceededError | Quota exceeded |
| 2001 | AgentNotFoundError | Agent not found |
| 2002 | DuplicateAgentError | Agent already exists |
| 2003 | AgentNotInGroupError | Agent not in group |
| 3001 | MessageNotFoundError | Message not found |
| 3002 | MessageError | Invalid message format |
| 5001 | ValidationError | Validation error |
| 5002 | RateLimitError | Rate limit exceeded |
| 6001 | TaskNotFoundError | Task not found |
| 6002 | TaskStateError | Invalid task operation |
| 7001 | GroupNotFoundError | Group not found |

## Framework Integration: LangChain.js

```typescript
import { Tool } from "@langchain/core/tools";
import { CacpClient } from "@cacp/sdk";

class CacpAgentTool extends Tool {
  name = "cacp-agent";
  description = "Use CACP agents to process requests";

  constructor(
    private client: CacpClient,
    private capability: string
  ) {
    super();
  }

  async _call(input: string): Promise<string> {
    // Discover agents by capability
    const agents = await this.client.agents.query(this.capability);
    if (!agents.agents || agents.agents.length === 0) {
      return `No agent found with capability: ${this.capability}`;
    }

    // Send RPC call
    const response = await this.client.messaging.rpcCall({
      sender_id: "my-agent",
      recipient_id: agents.agents[0].agent_id!,
      method: "process",
      params: { input },
    });

    return response.result as string;
  }
}

// Usage
const client = new CacpClient({
  baseUrl: "http://localhost:4001",
  apiKey: "key",
});

const codeTool = new CacpAgentTool(client, "code-generation");
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Watch mode for development
npm run dev
```

## TypeScript Usage

The SDK provides full TypeScript type definitions:

```typescript
import {
  CacpClient,
  Agent,
  Message,
  Task,
  Group,
  CacpError,
} from "@cacp/sdk";

// Types are automatically inferred
const agent: Agent = await client.agents.register({
  name: "typed-agent",
  capabilities: ["type-safe"],
});

// Function with typed parameters
async function sendMessage(
  client: CacpClient,
  senderId: string,
  recipientId: string,
  payload: Record<string, unknown>
): Promise<Message> {
  return client.messaging.send({
    sender_id: senderId,
    recipient_id: recipientId,
    message_type: "chat",
    payload,
  });
}
```

## Links

- 📚 [Documentation](https://docs.cacp.io)
- 🐙 [GitHub Repository](https://github.com/cacp/cacp)
- 📖 [Protocol Specification](https://github.com/cacp/cacp/blob/main/spec/README.md)
- 🐛 [Issue Tracker](https://github.com/cacp/cacp/issues)
- 💬 [Discord Community](https://discord.gg/cacp)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

For questions and support:
- 📧 Email: support@cacp.io
- 💬 Discord: https://discord.gg/cacp
- 📖 Docs: https://docs.cacp.io