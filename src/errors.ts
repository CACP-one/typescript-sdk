/**
 * CACP SDK Error Classes
 */

export class CacpError extends Error {
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;
  public readonly brokerCode?: number;
  public readonly requestId?: string;

  constructor(
    message: string,
    code?: string,
    details?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(message);
    this.name = "CacpError";
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  override toString(): string {
    if (this.code) {
      return `[${this.code}] ${this.message}`;
    }
    return this.message;
  }
}

// Authentication Errors (5000-5099)

export class AuthenticationError extends CacpError {
  constructor(message: string = "Authentication failed", requestId?: string) {
    super(message, "AUTH_ERROR", undefined, requestId);
    this.name = "AuthenticationError";
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  public readonly brokerCode: number;

  constructor(message: string = "Invalid credentials", brokerCode: number = 5001) {
    super(message, "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
    this.brokerCode = brokerCode;
  }
}

export class MissingOrganizationError extends AuthenticationError {
  public readonly brokerCode: number;

  constructor(message: string = "Missing organization context", brokerCode: number = 5003) {
    super(message, "MISSING_ORGANIZATION");
    this.name = "MissingOrganizationError";
    this.brokerCode = brokerCode;
  }
}

export class AccountDisabledError extends AuthenticationError {
  public readonly brokerCode: number;

  constructor(message: string = "Account disabled", brokerCode: number = 5005) {
    super(message, "ACCOUNT_DISABLED");
    this.name = "AccountDisabledError";
    this.brokerCode = brokerCode;
  }
}

export class InvalidTokenError extends AuthenticationError {
  public readonly brokerCode: number;

  constructor(message: string = "Invalid token", brokerCode: number = 5006) {
    super(message, "INVALID_TOKEN");
    this.name = "InvalidTokenError";
    this.brokerCode = brokerCode;
  }
}

// Rate Limit & Quota Errors (6000-6099)

export class RateLimitError extends CacpError {
  public readonly retryAfter?: number;
  public readonly brokerCode: number;

  constructor(retryAfter?: number, message: string = "Rate limit exceeded", brokerCode: number = 6001, requestId?: string) {
    const msg = retryAfter
      ? `${message}. Retry after ${retryAfter} seconds`
      : message;
    super(msg, "RATE_LIMIT_EXCEEDED", undefined, requestId);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    this.brokerCode = brokerCode;
  }
}

export class QuotaExceededError extends CacpError {
  public readonly brokerCode: number;

  constructor(message: string = "Quota exceeded", brokerCode: number = 6002) {
    super(message, "QUOTA_EXCEEDED");
    this.name = "QuotaExceededError";
    this.brokerCode = brokerCode;
  }
}

// Group Errors (7000-7099)

export class GroupError extends CacpError {
  public readonly groupId?: string;

  constructor(message: string, groupId?: string, code?: string) {
    super(message, code || "GROUP_ERROR");
    this.name = "GroupError";
    this.groupId = groupId;
  }
}

export class GroupNotFoundError extends GroupError {
  public readonly brokerCode: number;

  constructor(groupId: string, message?: string, brokerCode: number = 7002) {
    super(message || `Group not found: ${groupId}`, groupId, "GROUP_NOT_FOUND");
    this.name = "GroupNotFoundError";
    this.brokerCode = brokerCode;
  }
}

export class AgentNotInGroupError extends GroupError {
  public readonly agentId: string;
  public readonly brokerCode: number;

  constructor(groupId: string, agentId: string, message?: string, brokerCode: number = 7003) {
    super(
      message || `Agent ${agentId} not in group ${groupId}`,
      groupId,
      "AGENT_NOT_IN_GROUP"
    );
    this.name = "AgentNotInGroupError";
    this.agentId = agentId;
    this.brokerCode = brokerCode;
  }
}

export class InsufficientFundsError extends CacpError {
  public readonly brokerCode: number;

  constructor(message: string = "Insufficient funds", brokerCode: number = 7001) {
    super(message, "INSUFFICIENT_FUNDS");
    this.name = "InsufficientFundsError";
    this.brokerCode = brokerCode;
  }
}

export class DuplicateGroupError extends GroupError {
  public readonly groupName: string;
  public readonly brokerCode: number;

  constructor(groupName: string, message?: string, brokerCode: number = 7006) {
    super(
      message || `Group already exists: ${groupName}`,
      undefined,
      "DUPLICATE_GROUP"
    );
    this.name = "DuplicateGroupError";
    this.groupName = groupName;
    this.brokerCode = brokerCode;
  }
}

export class AgentAlreadyInGroupError extends GroupError {
  public readonly agentId: string;
  public readonly brokerCode: number;

  constructor(groupId: string, agentId: string, message?: string, brokerCode: number = 7007) {
    super(
      message || `Agent ${agentId} already in group ${groupId}`,
      groupId,
      "AGENT_ALREADY_IN_GROUP"
    );
    this.name = "AgentAlreadyInGroupError";
    this.agentId = agentId;
    this.brokerCode = brokerCode;
  }
}

export class CannotRemoveLastAgentError extends GroupError {
  public readonly brokerCode: number;

  constructor(groupId: string, message?: string, brokerCode: number = 7008) {
    super(
      message || `Cannot remove last agent from group ${groupId}`,
      groupId,
      "CANNOT_REMOVE_LAST_AGENT"
    );
    this.name = "CannotRemoveLastAgentError";
    this.brokerCode = brokerCode;
  }
}

// Agent Errors (2000-2099)

export class AgentNotFoundError extends CacpError {
  public readonly agentId: string;
  public readonly brokerCode: number;

  constructor(agentId: string, message?: string, brokerCode: number = 2001) {
    super(message || `Agent not found: ${agentId}`, "AGENT_NOT_FOUND");
    this.name = "AgentNotFoundError";
    this.agentId = agentId;
    this.brokerCode = brokerCode;
  }
}

export class NoMatchingAgentsError extends CacpError {
  public readonly brokerCode: number;

  constructor(message: string = "No matching agents", brokerCode: number = 2008) {
    super(message, "NO_MATCHING_AGENTS");
    this.name = "NoMatchingAgentsError";
    this.brokerCode = brokerCode;
  }
}

// Message Errors (3000-3099)

export class MessageError extends CacpError {
  public readonly messageId?: string;

  constructor(message: string, messageId?: string, code?: string) {
    super(message, code || "MESSAGE_ERROR");
    this.name = "MessageError";
    this.messageId = messageId;
  }
}

export class ValidationError extends CacpError {
  public readonly field?: string;
  public readonly brokerCode?: number;

  constructor(message: string, field?: string, brokerCode?: number, requestId?: string) {
    super(message, "VALIDATION_ERROR", undefined, requestId);
    this.name = "ValidationError";
    this.field = field;
    this.brokerCode = brokerCode;
  }
}

// Task Errors

export class TaskNotFoundError extends CacpError {
  public readonly taskId: string;

  constructor(taskId: string, message?: string) {
    super(message || `Task not found: ${taskId}`, "TASK_NOT_FOUND");
    this.name = "TaskNotFoundError";
    this.taskId = taskId;
  }
}

export class TaskStateError extends CacpError {
  public readonly taskId?: string;
  public readonly currentStatus?: string;

  constructor(
    message: string,
    taskId?: string,
    currentStatus?: string,
  ) {
    let msg = message;
    if (taskId && currentStatus) {
      msg = `${message} (taskId: ${taskId}, status: ${currentStatus})`;
    }
    super(msg, "TASK_STATE_ERROR");
    this.name = "TaskStateError";
    this.taskId = taskId;
    this.currentStatus = currentStatus;
  }
}

export class DuplicateTaskError extends CacpError {
  public readonly taskId: string;
  public readonly brokerCode: number;

  constructor(taskId: string, message?: string, brokerCode: number = 2009) {
    super(message || `Task already exists: ${taskId}`, "DUPLICATE_TASK");
    this.name = "DuplicateTaskError";
    this.taskId = taskId;
    this.brokerCode = brokerCode;
  }
}

export class TaskError extends CacpError {
  public readonly taskId?: string;

  constructor(message: string, taskId?: string, code?: string) {
    super(message, code || "TASK_ERROR");
    this.name = "TaskError";
    this.taskId = taskId;
  }
}

// Permission Errors (4000-4099)

export class PermissionError extends CacpError {
  public readonly brokerCode: number;

  constructor(message: string = "Insufficient permissions", brokerCode: number = 4003) {
    super(message, "PERMISSION_ERROR");
    this.name = "PermissionError";
    this.brokerCode = brokerCode;
  }
}

export class AuthenticationRequiredError extends CacpError {
  public readonly brokerCode: number;

  constructor(message: string = "Authentication required", brokerCode: number = 4001) {
    super(message, "AUTHENTICATION_REQUIRED");
    this.name = "AuthenticationRequiredError";
    this.brokerCode = brokerCode;
  }
}

export class RpcNotFoundError extends CacpError {
  public readonly brokerCode: number;

  constructor(message: string = "RPC request not found", brokerCode: number = 4004) {
    super(message, "RPC_NOT_FOUND");
    this.name = "RpcNotFoundError";
    this.brokerCode = brokerCode;
  }
}

// Connection & General Errors

export class ConnectionError extends CacpError {
  constructor(message: string = "Connection error", requestId?: string) {
    super(message, "CONNECTION_ERROR", undefined, requestId);
    this.name = "ConnectionError";
  }
}

export class TimeoutError extends CacpError {
  public readonly operation: string;
  public readonly timeout?: number;

  constructor(operation: string, timeout?: number, requestId?: string) {
    let message = `Operation timed out: ${operation}`;
    if (timeout) {
      message += ` (after ${timeout}s)`;
    }
    super(message, "TIMEOUT", undefined, requestId);
    this.name = "TimeoutError";
    this.operation = operation;
    this.timeout = timeout;
  }
}

export class WebSocketError extends CacpError {
  constructor(message: string) {
    super(message, "WEBSOCKET_ERROR");
    this.name = "WebSocketError";
  }
}

export class RpcError extends CacpError {
  public readonly method?: string;
  public readonly rpcCode?: number;

  constructor(message: string, method?: string, rpcCode?: number) {
    super(message, "RPC_ERROR");
    this.name = "RpcError";
    this.method = method;
    this.rpcCode = rpcCode;
  }
}

export class MemberError extends CacpError {
  public readonly groupId?: string;
  public readonly agentId?: string;

  constructor(
    message: string,
    groupId?: string,
    agentId?: string,
    code?: string,
  ) {
    super(message, code || "MEMBER_ERROR");
    this.name = "MemberError";
    this.groupId = groupId;
    this.agentId = agentId;
  }
}

export interface BrokerErrorResponse {
  error?: {
    code?: number;
    message?: string;
    agent_id?: string;
    group_id?: string;
    task_id?: string;
    retry_after?: number;
    group_name?: string;
    [key: string]: unknown;
  };
}

/**
 * Raise the appropriate error based on broker error code.
 *
 * @param response - Response from broker, expected to have 'error' key
 *                   with 'code' and 'message' fields.
 *
 * @throws CacpError - Appropriate error based on error code.
 *
 * @example
 * ```typescript
 * const response = { error: { code: 2001, message: "Agent not found" } };
 * throw createErrorFromResponse(response);
 * // Throws: AgentNotFoundError
 * ```
 */
export function createErrorFromResponse(response: BrokerErrorResponse, requestId?: string): CacpError {
  const error = response.error || {};
  const code = error.code;
  const message = error.message || "Unknown error";

  if (!code) {
    return new CacpError(message, undefined, undefined, requestId);
  }

  // Create error instance based on code
  // Agent Errors (2000-2099)
  if (code === 2001 || code === 2008) {
    return new AgentNotFoundError(error.agent_id || "", message, code);
  } else if ([2009].includes(code)) {
    return new DuplicateTaskError(error.task_id || "", message, code);
  }

  // Authentication Errors (5000-5099)
  else if ([5001, 5002].includes(code)) {
    return new InvalidCredentialsError(message, code);
  } else if ([5003, 5004].includes(code)) {
    return new MissingOrganizationError(message, code);
  } else if (code === 5005) {
    return new AccountDisabledError(message, code);
  } else if (code === 5006) {
    return new InvalidTokenError(message, code);
  }

  // Rate Limit & Quota Errors (6000-6099)
  else if (code === 6001) {
    return new RateLimitError(error.retry_after, message, code, requestId);
  } else if (code === 6002) {
    return new QuotaExceededError(message, code);
  }

  // Task Errors
  else if (code === 6003 || code === 6004 || code === 6005) {
    return new TaskNotFoundError(error.task_id || "", message);
  }

  // Group Errors (7000-7099)
  else if (code === 7002) {
    return new GroupNotFoundError(error.group_id || "", message, code);
  } else if (code === 7003) {
    return new AgentNotInGroupError(
      error.group_id || "",
      error.agent_id || "",
      message,
      code,
    );
  } else if (code === 7006) {
    return new DuplicateGroupError(error.group_name || "", message, code);
  } else if (code === 7007) {
    return new AgentAlreadyInGroupError(
      error.group_id || "",
      error.agent_id || "",
      message,
      code,
    );
  } else if (code === 7008) {
    return new CannotRemoveLastAgentError(error.group_id || "", message, code);
  } else if (code === 7001) {
    return new InsufficientFundsError(message, code);
  }

  // Validation Errors (3000-3099)
  else if ([3001, 3002].includes(code)) {
    return new ValidationError(message, undefined, code, requestId);
  }

  // Permission Errors (4000-4099)
  else if (code === 4001) {
    return new AuthenticationRequiredError(message, code);
  } else if (code === 4003) {
    return new PermissionError(message, code);
  } else if (code === 4004) {
    return new RpcNotFoundError(message, code);
  }

  // Fallback
  else {
    return new CacpError(message, String(code), undefined, requestId);
  }
}