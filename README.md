# Unit Tests MCP Server

A Model Context Protocol (MCP) server that provides prompts for AI agents to generate unit tests.

## Running this project

### Install dependencies
- `npm install`

### Run the development MCP server
1. From the root directory, run `npm run watch` to compile and watch for changes.
2. Configure your AI agent's MCP client to run `node <ABSOLUTE_PATH_TO_UNITTESTS_MCP_PROJECT_ROOT>/dist/cli.js` using stdio, replacing `<ABSOLUTE_PATH_TO_UNITTESTS_MCP_PROJECT_ROOT>` with the absolute path to the root directory of this repository.
3. When you make changes to the MCP server's code, refresh the MCP server in your IDE to pick up the changes.

### Examples:

#### Cursor/Windsurf
```json
{
  "mcpServers": {
    "unittests-mcp": {
      "command": "node",
      "args": [
        "<ABSOLUTE_PATH_TO_UNITTESTS_MCP_PROJECT_ROOT>/dist/cli.js"
      ]
    }
  }
}
```

#### Claude Code
```bash
claude mcp add unittests-mcp -- node <ABSOLUTE_PATH_TO_UNITTESTS_MCP_PROJECT_ROOT>/dist/cli.js
```

#### VS Code (GitHub Copilot)
```json
{
  "servers": {
    "unittests-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "<ABSOLUTE_PATH_TO_UNITTESTS_MCP_PROJECT_ROOT>/dist/cli.js"
      ]
    }
  }
}
```
