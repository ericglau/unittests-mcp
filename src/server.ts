import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { version } from '../package.json';
import { registerPrompts } from './prompts';

export function createServer() {
  const server = new McpServer(
    {
      name: 'unittests-mcp',
      version,
    },
    {
      instructions: `Provides prompts that can be used to generate unit tests.`,
    },
  );

  registerPrompts(server);

  return server;
}
