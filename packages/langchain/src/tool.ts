import { Tool } from '@langchain/core/tools';
import { CacpClient } from '@cacp/sdk';

export interface CACPAgentToolInput {
  query: string;
}

export interface CACPAgentToolOptions {
  name: string;
  description: string;
  client: CacpClient;
  capability: string;
  method?: string;
  version?: string;
}

export class CACPAgentTool extends Tool {
  name: string;
  description: string;
  client: CacpClient;
  capability: string;
  method: string;
  version: string;

  constructor(options: CACPAgentToolOptions) {
    super();
    this.name = options.name;
    this.description = options.description;
    this.client = options.client;
    this.capability = options.capability;
    this.method = options.method || 'process';
    this.version = options.version || '1.0.0';
  }

  protected async _call(input: string): Promise<string> {
    try {
      const agents = await this.client.agents.queryByCapability([this.capability]);
      
      if (!agents || agents.length === 0) {
        return `No agent found with capability: ${this.capability}`;
      }

      const response = await this.client.messaging.rpcCall({
        toAgent: agents[0].id,
        method: this.method,
        params: { input }
      });

      return String(response.result);
    } catch (error: any) {
      return `Error calling CACP agent: ${error.message}`;
    }
  }

  static async fromClient(
    client: CacpClient,
    capability: string,
    options: Partial<CACPAgentToolOptions> = {}
  ): Promise<CACPAgentTool> {
    const name = options.name || capability
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    
    const description = options.description || `Use a CACP agent with ${capability} capability`;

    return new CACPAgentTool({
      name,
      description,
      client,
      capability,
      method: options.method,
      version: options.version,
    });
  }
}