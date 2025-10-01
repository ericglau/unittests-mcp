import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  registerBasicPrompt(server);
  registerBasicWithTargetPrompt(server);
}

// Example of a basic prompt
function registerBasicPrompt(server: McpServer) {
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
Create unit tests for the file or folder at the following path: \`${fileOrFolder}\``
        }
      }]
    })
  );
}

// Example of a context-aware prompt
function registerBasicWithTargetPrompt(server: McpServer) {
  server.registerPrompt(
    "basic-with-target",
    {
      title: "Unit Tests with Target",
      description: "Generate unit tests for the code at the provided locations, to the specified file or folder.",
      argsSchema: {
        fileOrFolder: z.string().describe("The file or folder path to generate unit tests for."),
        targetFileOrFolder: completable(z.string(), (_value, context) => {
          const fileOrFolder = context?.arguments?.["fileOrFolder"];
          if (fileOrFolder) {
            if (fileOrFolder.endsWith(".ts")) {
              return [`${fileOrFolder.slice(0, -3)}.test.ts`];
            }
          }
          return [];
        }).describe("Where to write the unit tests."),
      }
    },
    ({ fileOrFolder, targetFileOrFolder }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `\
Create unit tests for the file or folder at the following path: \`${fileOrFolder}\`

Write the unit tests to the following path: \`${targetFileOrFolder}\``
        }
      }]
    })
  );
}