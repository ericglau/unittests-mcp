import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "basic",
    {
      title: "Unit Tests",
      description: "Generate unit tests for the code at the provided locations.",
      argsSchema: {
        fileOrFolder: z.string().describe("The file or folder path to generate unit tests for."),
      }
    },
    ({ fileOrFolder }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `\
Create unit tests for the file or folder at the following path:\n\n${fileOrFolder}`
        }
      }]
    })
  );
}
