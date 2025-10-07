import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  registerBasicPrompt(server);
  registerBasicWithTargetPrompt(server);
  registerTestGenerationWorkflowPrompt(server);
}

// Example of a basic prompt
function registerBasicPrompt(server: McpServer) {
  server.registerPrompt(
    "basic",
    {
      title: "Unit Tests",
      description:
        "Generate unit tests for the code at the provided locations.",
      argsSchema: {
        fileOrFolder: z
          .string()
          .describe("The file or folder path to generate unit tests for."),
      },
    },
    ({ fileOrFolder }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `\
Create unit tests for the file or folder at the following path: \`${fileOrFolder}\``,
          },
        },
      ],
    })
  );
}

// Example of a context-aware prompt
function registerBasicWithTargetPrompt(server: McpServer) {
  server.registerPrompt(
    "basic-with-target",
    {
      title: "Unit Tests with Target",
      description:
        "Generate unit tests for the code at the provided locations, to the specified file or folder.",
      argsSchema: {
        fileOrFolder: z
          .string()
          .describe("The file or folder path to generate unit tests for."),
        targetFileOrFolder: completable(z.string(), (_value, context) => {
          const fileOrFolder = context?.arguments?.["fileOrFolder"];
          if (fileOrFolder) {
            if (fileOrFolder.endsWith(".ts")) {
              return [`${fileOrFolder.slice(0, -3)}.test.ts`];
            }
          }
          return [];
        }).describe("Where to write the unit tests."),
      },
    },
    ({ fileOrFolder, targetFileOrFolder }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `\
Create unit tests for the file or folder at the following path: \`${fileOrFolder}\`

Write the unit tests to the following path: \`${targetFileOrFolder}\``,
          },
        },
      ],
    })
  );
}

function registerTestGenerationWorkflowPrompt(server: McpServer) {
  server.registerPrompt(
    "workflow",
    {
      title: "Unit Tests Workflow",
      description:
        "Generate unit tests workflow prompt for the code with different options",
      argsSchema: {
        fileOrFolder: z
          .string()
          .describe("The file or folder path to generate unit tests for."),

        functionToTest: z
          .string()
          .describe("The file or folder path to generate unit tests for."),

        language: z
          .string()
          .optional()
          .describe(
            "Optional explicit override for language. If omitted, inferred will be attempted from fileOrFolder extension."
          ),
      },
    },
    ({ fileOrFolder, functionToTest, language }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `
Task:
Generate unit tests for the given function(s) in a codebase. Work in phases. Output only the requested artifacts.

Inputs
- fileOrFolder: ${fileOrFolder}
- functionToTest: ${functionToTest}
- language: ${language}

Procedure:
Phase 1 — Detect language and environment:
1) ${
              language
                ? `Assume programming language is ${language}`
                : "Identify programming language from fileOrFolder file extension"
            }
2) Detect testing framework used in the codebase by analyzing dependencies file and existing test files.
3) If multiple frameworks detected, choose the one used for unit tests. Prefer the one already present in existing tests file close to fileOrFolder file location.

Phase 2 — Locate placement:
3) Search for existing tests covering the target module. Decide if test should be appended to existing file testing the module or if new file should be created to test the module.
4) If creating new file analyze existing test files to correctly use same naming file convention for the new file name and extensions
5) If appending new file to existing file set up test cases in similar way as the test already included in the file, If creating new file analyze existing test files to correctly set up the testing framework in a similar way

Phase 3 — Analyze code under test:
6) Parse signatures, inputs, outputs, side effects, exceptional paths, async/await, throw or reverts.
7) Map branches and guards. Identify boundary values and invariants. Mark non-determinism sources (time, RNG, I/O).

Phase 4 — Design cases:
8) Create a minimal set for branch coverage. Include happy paths, boundary/edge cases, and failure modes.
9) Add security-focused cases: invalid/tainted inputs, injection payloads, path traversal, overflow/underflow, encoding pitfalls, language appropriate cases, fuzz/property checks for pure functions.
10) Always try to avoid mock too wide code surface but if needed define mocking/stubbing plan attempting to follow existing mocking patterns to never hit real network, database, filesystem, clock, or randomness.

Phase 5 — Emit tests:
11) Produce tests consistent with the framework’s style and project imports. Keep small, pure helpers. No hidden side effects.
12) Ensure deterministic execution.

Phase 6 — Validate statically:
12) Self-check imports, assertion usage, and lints. Avoid duplicate tests. Output estimated coverage from new tests.

Constraints:
- No original code file writes, or schema changes.
- Use meaningful test case name.
- Prefer pure helpers and table-driven tests.

Language specifics:
- typescript/javascript: respect tsconfig/moduleResolution. Detect framework in package.json. Use fake timers instead of real time.
- rust: use #[cfg(test)] modules, proptest when property tests enabled.

Produce results now.`,
          },
        },
      ],
    })
  );
}
