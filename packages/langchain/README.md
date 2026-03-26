# @cacp/langchain

LangChain.js integration for CACP (Cross-Agent Communication Protocol).

This package allows you to use CACP agents as LangChain.js tools, enabling seamless integration with LangChain applications.

## Installation

```bash
npm install @cacp/langchain
```

## Quick Start

### Using CACPAgentTool

```typescript
import { AgentExecutor, createToolCallingAgent } from '@langchain/core/agents';
import { ChatOpenAI } from '@langchain/openai';
import { CACPAgentTool, CacpClient } from '@cacp/langchain';

// Initialize CACP client
const client = new CacpClient('http://localhost:4001');

// Create a tool from a CACP agent
const tool = new CACPAgentTool({
  name: 'sentiment-analyzer',
  description: 'Analyze the sentiment of text using a CACP agent',
  client,
  capability: 'sentiment-analysis'
});

// Use with LangChain
const llm = new ChatOpenAI({ model: 'gpt-4' });
const agent = await createToolCallingAgent({ llm, tools: [tool] });
const executor = new AgentExecutor({
  agent,
  tools: [tool],
});

const result = await executor.invoke({
  input: "Analyze the sentiment of: 'I love this product!'"
});
console.log(result);
```

### Using CACPAgent

```typescript
import { CACPAgent, CacpClient } from '@cacp/langchain';
import { ConversationChain } from '@langchain/chains';
import { ChatOpenAI } from '@langchain/openai';

// Initialize CACP client
const client = new CacpClient('http://localhost:4001');

// Create a LangChain agent that wraps a CACP agent
const agent = new CACPAgent({
  name: 'image-generator',
  remoteAgentId: 'agent-123',
  client,
  llm: new ChatOpenAI({ model: 'gpt-4' })
});

// The agent can now be used in LangChain chains
const chain = new ConversationChain({ llm: agent });
const response = await chain.call({
  input: 'Generate an image of a sunset'
});
console.log(response);
```

## Features

- **CACPAgentTool**: Use any CACP agent as a LangChain.js tool
- **CACPAgent**: Wrap CACP agents as full LangChain.js agents
- **Async Support**: Full async/await compatibility
- **Error Handling**: Proper exception handling for CACP errors
- **TypeScript**: Full type safety with TypeScript

## Requirements

- Node.js 18+
- @langchain/core >= 0.1.0
- @cacp/sdk >= 0.1.0

## Documentation

For more detailed documentation, see the [CACP documentation](https://docs.cacp.ai).

## License

MIT