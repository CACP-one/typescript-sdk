/**
 * Example: Using CACPAgentTool with LangChain.js
 *
 * This example demonstrates how to use a CACP agent as a LangChain.js tool.
 */

import { AgentExecutor } from '@langchain/core/agents';
import { ChatOpenAI } from '@langchain/openai';
import { CACPAgentTool, CacpClient } from '@cacp/langchain';

async function main() {
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
  // Create agent (simplified for example)
  const result = await tool.invoke(
    "Analyze the sentiment of: 'I love this product!'"
  );
  
  console.log('Result:', result);
}

main().catch(console.error);