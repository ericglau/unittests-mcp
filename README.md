# Unit Tests MCP Server

[![NPM Package](https://img.shields.io/npm/v/@ericglau/unittests-mcp)](https://www.npmjs.com/package/@ericglau/unittests-mcp)

A Model Context Protocol (MCP) server that provides prompts for AI agents to generate unit tests.

## Setup

Configure your MCP client to invoke `npx -y @ericglau/unittests-mcp` using stdio.

### Examples:

#### Cursor/Windsurf/Claude Desktop
```
{
  "mcpServers": {
    "unittests-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@ericglau/unittests-mcp"
      ]
    }
  }
}
```

#### Claude Code
```
claude mcp add unittests-mcp -- npx -y @ericglau/unittests-mcp
```

#### VS Code (GitHub Copilot)
```
{
  "servers": {
    "unittests-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@ericglau/unittests-mcp"
      ]
    }
  }
}
```
