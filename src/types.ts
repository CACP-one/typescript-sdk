/**
 * CACP SDK Type Definitions
 */

/**
 * Callback invoked before an HTTP request is sent
 */
export type OnRequestCallback = (
  method: string,
  path: string,
  headers: Record<string, string>
) => void;

/**
 * Callback invoked after an HTTP response is received
 */
export type OnResponseCallback = (
  path: string,
  status: number,
  response: Record<string, unknown>
) => void;

/**
 * Logger interface for SDK operations
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Represents the operational status of an agent.
 * - `online`: Agent is available and responding
 * - `offline`: Agent is not available
 * - `degraded`: Agent is available but with reduced functionality
 * - `error`: Agent is in an error state
 * - `maintenance`: Agent is under maintenance
 */
export type AgentStatus =
  | "online"
  | "offline"
  | "degraded"
  | "error"
  | "maintenance";

/**
 * Represents the type of a message.
 * - `message`: Standard message
 * - `request`: Request message expecting a response
 * - `response`: Response to a request
 * - `notification`: One-way notification
 * - `broadcast`: Message sent to multiple agents
 * - `rpc`: RPC call message
 */
export type MessageType =
  | "message"
  | "request"
  | "response"
  | "notification"
  | "broadcast"
  | "rpc";

/**
 * Represents the delivery status of a message.
 * - `pending`: Message is queued for delivery
 * - `delivered`: Message has been delivered to recipient
 * - `processing`: Message is being processed by recipient
 * - `completed`: Message processing is complete
 * - `failed`: Message delivery or processing failed
 * - `timeout`: Message timed out
 */
export type MessageStatus =
  | "pending"
  | "delivered"
  | "processing"
  | "completed"
  | "failed"
  | "timeout";

/**
 * Represents the priority level of a message.
 * - `low`: Low priority message
 * - `normal`: Normal priority message (default)
 * - `high`: High priority message
 * - `urgent`: Urgent message requiring immediate attention
 */
export type MessagePriority = "low" | "normal" | "high" | "urgent";

export interface Agent {
  /** Unique identifier for the agent */
  id: string;
  /** Human-readable name of the agent */
  name: string;
  /** Optional description of the agent's purpose */
  description?: string;
  /** List of capabilities this agent provides */
  capabilities: string[];
  /** Current operational status */
  status: AgentStatus;
  /** Additional metadata associated with the agent */
  metadata: Record<string, unknown>;
  /** ID of the organization this agent belongs to */
  organizationId?: string;
  /** Timestamp when the agent was created */
  createdAt?: string;
  /** Timestamp when the agent was last updated */
  updatedAt?: string;
  /** Timestamp when the agent was last seen */
  lastSeenAt?: string;
  /** Relevance score for search results (0-1) */
  matchScore?: number;
}

/** Options for registering a new agent */
export interface AgentRegistration {
  /** Human-readable name for the agent (required) */
  name: string;
  /** Optional description of the agent's purpose */
  description?: string;
  /** List of capabilities this agent provides (at least one required) */
  capabilities: string[];
  /** Additional metadata associated with the agent */
  metadata?: Record<string, unknown>;
}

/** Options for updating an existing agent */
export interface AgentUpdate {
  /** New name for the agent */
  name?: string;
  /** New description */
  description?: string;
  /** Updated list of capabilities */
  capabilities?: string[];
  /** Updated metadata */
  metadata?: Record<string, unknown>;
  /** New status */
  status?: AgentStatus;
}

/** Options for listing agents */
export interface AgentListOptions {
  /** Filter by status */
  status?: AgentStatus;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/** Options for querying agents by capability */
export interface CapabilityQuery {
  /** Capabilities to search for */
  capabilities: string[];
  /** If true, agent must have all capabilities; if false, any capability matches */
  matchAll?: boolean;
  /** Filter by status */
  status?: AgentStatus;
  /** Maximum number of results */
  limit?: number;
}

/** Options for semantic search */
export interface SemanticSearchQuery {
  /** Natural language search query */
  query: string;
  /** Maximum number of results */
  limit?: number;
  /** Minimum relevance threshold (0-1) */
  threshold?: number;
}

/** Represents a message in the system */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Sender agent ID */
  fromAgent?: string;
  /** Recipient agent ID */
  toAgent?: string;
  /** Message content */
  content: Record<string, unknown>;
  /** Type of message */
  messageType: MessageType;
  /** Current delivery status */
  status: MessageStatus;
  /** Message priority level */
  priority: MessagePriority;
  /** Additional metadata */
  metadata: Record<string, unknown>;
  /** Timestamp when the message was created */
  createdAt?: string;
  /** Timestamp when the message was delivered */
  deliveredAt?: string;
  /** Timestamp when processing completed */
  completedAt?: string;
  /** Error message if the message failed */
  error?: string;
}

/** Options for sending a message */
export interface MessageSendOptions {
  /** Recipient agent ID (required) */
  toAgent: string;
  /** Message content (required) */
  content: Record<string, unknown>;
  /** Type of message */
  messageType?: MessageType;
  /** Message priority level */
  priority?: MessagePriority;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Time-to-live in seconds */
  ttl?: number;
}

/** Options for broadcasting a message */
export interface BroadcastOptions {
  /** Message content */
  content: Record<string, unknown>;
  /** Type of broadcast message */
  messageType?: MessageType;
  /** Only send to agents with these capabilities */
  capabilityFilter?: string[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Options for making an RPC call */
export interface RpcCallOptions {
  /** Target agent ID */
  toAgent: string;
  /** Method name to call */
  method: string;
  /** Parameters to pass to the method */
  params?: Record<string, unknown>;
  /** Timeout in seconds */
  timeout?: number;
}

/** Response from an RPC call */
export interface RpcResponse {
  /** Unique identifier for the response */
  id: string;
  /** Result of the RPC call if successful */
  result?: unknown;
  /** Error details if the call failed */
  error?: { code?: number; message: string };
  /** Agent that sent the response */
  fromAgent: string;
  /** Execution time in milliseconds */
  executionTime?: number;
}

/** Represents a WebSocket message */
export interface WebSocketMessage {
  /** Message type */
  type: string;
  /** Message payload */
  payload: Record<string, unknown>;
  /** Timestamp when the message was sent */
  timestamp?: string;
}

/** Options for sending a WebSocket message */
export interface WebSocketSendOptions {
  /** Recipient agent ID */
  toAgent: string;
  /** Message content */
  content: Record<string, unknown>;
  /** Type of message */
  messageType?: string;
  /** Sender agent ID */
  fromAgent?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Options for WebSocket subscription */
export interface WebSocketSubscribeOptions {
  /** Agent ID to subscribe to */
  agentId: string;
}

/** Represents a health metric for an agent */
export interface HealthMetric {
  /** Agent ID */
  agentId: string;
  /** Name of the metric */
  metricName: string;
  /** Metric value */
  value: number;
  /** Unit of measurement */
  unit?: string;
  /** Timestamp when the metric was recorded */
  timestamp: string;
}

/** Represents the health status of an agent */
export interface HealthStatus {
  /** Agent ID */
  agentId: string;
  /** Current status */
  status: AgentStatus;
  /** Health score (0-100) */
  healthScore: number;
  /** List of health metrics */
  metrics: HealthMetric[];
  /** Timestamp of last health check */
  lastCheck: string;
  /** List of current issues */
  issues: string[];
}

/** Configuration options for the CACP client */
export interface CacpClientOptions {
  /** Base URL of the CACP API (required) */
  baseUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** JWT token for authentication */
  jwtToken?: string;
  /** Request timeout in seconds */
  timeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay between retries in seconds */
  retryDelay?: number;
  /** Connection pool size (not used in browser) */
  connectionPoolSize?: number;
  /** Whether to verify SSL certificates */
  verifySsl?: boolean;
  /** Custom user agent string */
  userAgent?: string;
  /** Custom logger for SDK operations */
  logger?: Logger;
  /** Callback invoked before each request */
  onRequest?: OnRequestCallback;
  /** Callback invoked after each response */
  onResponse?: OnResponseCallback;
}

/** Response from listing agents */
export interface AgentListResponse {
  /** List of agents */
  agents: Agent[];
  /** Total number of agents */
  total: number;
  /** Maximum results per page */
  limit: number;
  /** Current offset */
  offset: number;
}

/** Error response from the API */
export interface ErrorResponse {
  /** Error message */
  error: string;
  /** Error code */
  code?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Represents the status of a task.
 * - `pending`: Task is created but not yet queued
 * - `queued`: Task is queued for execution
 * - `running`: Task is currently executing
 * - `completed`: Task completed successfully
 * - `failed`: Task failed
 * - `cancelled`: Task was cancelled
 */
export type TaskStatus =
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Represents a task in the system
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  /** Type of the task */
  taskType: string;
  /** Current task status */
  status: TaskStatus;
  /** Task priority level */
  priority: string;
  /** Sender agent ID */
  senderAgentId?: string;
  /** Recipient agent ID */
  recipientAgentId?: string;
  /** Task payload data */
  payload: Record<string, unknown>;
  /** Task result if completed */
  result?: Record<string, unknown>;
  /** Error message if failed */
  errorMessage?: string;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Timestamp when the task was created */
  createdAt: string;
  /** Timestamp when the task is scheduled to run */
  scheduledAt?: string;
  /** Timestamp when execution started */
  startedAt?: string;
  /** Timestamp when the task completed */
  completedAt?: string;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/** Options for creating a new task */
export interface TaskCreateOptions {
  /** Type of task to create */
  taskType: string;
  /** Task payload data */
  payload?: Record<string, unknown>;
  /** Task priority level */
  priority?: string;
  /** Target agent ID */
  recipientAgentId?: string;
  /** Schedule for later execution */
  scheduledAt?: string;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Options for listing tasks */
export interface TaskListOptions {
  /** Filter by task status */
  status?: TaskStatus;
  /** Filter by task type */
  taskType?: string;
  /** Filter by sender agent */
  senderAgentId?: string;
  /** Filter by recipient agent */
  recipientAgentId?: string;
  /** Filter by priority */
  priority?: string;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/** Response from listing tasks */
export interface TaskListResponse {
  /** List of tasks */
  tasks: Task[];
  /** Total number of tasks */
  total: number;
  /** Maximum results per page */
  limit: number;
  /** Current offset */
  offset: number;
}

/**
 * Represents a member of a group
 */
export interface GroupMember {
  /** Agent ID */
  agentId: string;
  /** Member role (leader, member) */
  role: string;
  /** When the agent joined the group */
  joinedAt: string;
}

/**
 * Represents an agent group
 */
export interface Group {
  /** Unique group identifier */
  id: string;
  /** Group name */
  name: string;
  /** Group description */
  description?: string;
  /** Leader agent ID */
  leaderAgentId?: string;
  /** Aggregated capabilities */
  capabilities: string[];
  /** Group members */
  members: GroupMember[];
  /** Number of members */
  memberCount: number;
  /** Additional metadata */
  metadata: Record<string, unknown>;
  /** Organization ID */
  organizationId?: string;
  /** Timestamp when the group was created */
  createdAt?: string;
  /** Timestamp when the group was last updated */
  updatedAt?: string;
}

/** Options for creating a group */
export interface GroupCreateOptions {
  /** Group name */
  name: string;
  /** Group description */
  description?: string;
  /** Leader agent ID */
  leaderAgentId?: string;
  /** Group capabilities */
  capabilities?: string[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Options for updating a group */
export interface GroupUpdateOptions {
  /** New name */
  name?: string;
  /** New description */
  description?: string;
  /** New leader agent ID */
  leaderAgentId?: string;
  /** Updated capabilities */
  capabilities?: string[];
  /** Updated metadata */
  metadata?: Record<string, unknown>;
}

/** Options for listing groups */
export interface GroupListOptions {
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/** Response from listing groups */
export interface GroupListResponse {
  /** List of groups */
  groups: Group[];
  /** Total number of groups */
  total: number;
  /** Maximum results per page */
  limit: number;
  /** Current offset */
  offset: number;
}

/** Options for adding a member */
export interface MemberAddOptions {
  /** Agent ID to add */
  agentId: string;
  /** Member role */
  role?: string;
}

/** Result of broadcasting a message */
export interface BroadcastResult {
  /** Broadcast status */
  status: string;
  /** Group ID */
  groupId: string;
  /** Recipient agent IDs */
  recipients: string[];
  /** Number of recipients */
  recipientCount: number;
}
