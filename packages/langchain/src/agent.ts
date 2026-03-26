import { BaseLLM } from '@langchain/core/language_models/base';
import { AgentAction, AgentFinish, BaseSingleActionAgent } from '@langchain/core/agents';
import { CacpClient } from '@cacp/sdk';

export interface CACPAgentOptions {
  client: CacpClient;
  remoteAgentId: string;
  name?: string;
  description?: string;
  llm?: BaseLLM;
}

export class CACPAgent extends BaseSingleActionAgent {
  client: CacpClient;
  remoteAgentId: string;
  name: string;
  description: string;
  llm?: BaseLLM;

  constructor(options: CACPAgentOptions) {
    super();
    this.client = options.client;
    this.remoteAgentId = options.remoteAgentId;
    this.name = options.name || 'CACP Agent';
    this.description = options.description || 'An agent that communicates via CACP';
    this.llm = options.llm;
  }

  lc_namespace = ['cacp', 'langchain'];

  get inputKeys() {
    return ['input'];
  }

  async plan(
    input: string,
    callbacks?: any
  ): Promise<AgentAction | AgentFinish> {
    try {
      const response = await this.client.messaging.rpcCall({
        toAgent: this.remoteAgentId,
        method: 'process',
        params: { input }
      });

      return {
        returnValues: { output: String(response.result) },
        log: `CACP Agent Response: ${response.result}`,
      } as AgentFinish;
    } catch (error: any) {
      return {
        returnValues: { output: `Error: ${error.message}` },
        log: `Error calling CACP agent: ${error.message}`,
      } as AgentFinish;
    }
  }

  async aplan(input: string, callbacks?: any): Promise<AgentAction | AgentFinish> {
    return this.plan(input, callbacks);
  }
}