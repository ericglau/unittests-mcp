import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  registerBasicPrompt(server);
  registerBasicWithTargetPrompt(server);
  registerTestGenerationWorkflowPrompt(server);
  registerCrossLanguageReferencePrompt(server);
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
          .optional()
          .describe("The function to generate unit tests for."),

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
12) Self-check imports, assertion usage, compilation or type errors and lints. Avoid duplicate tests. Output estimated coverage from new tests.

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

function registerCrossLanguageReferencePrompt(server: McpServer) {
  server.registerPrompt(
    "reference",
    {
      title: "Unit Tests with Reference",
      description:
        "Generate unit tests for this implementation based on a reference implementation and tests.",
      argsSchema: {
        targetImplementation: z
          .string()
          .describe("The file or folder path containing the implementation to generate unit tests for."),

        referenceImplementation: z
          .string()
          .describe("The reference implementation's file or folder path. Can be from a different project/language."),

        referenceTests: z
          .string()
          .describe("The reference tests' file or folder path. Can be from a different project/language."),
      },
    },
    ({ targetImplementation, referenceImplementation, referenceTests }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `
Task:
Generate unit tests for the given function(s) in a codebase by analyzing a reference implementation and its tests, then adapting applicable test cases to the target implementation. Work in phases. Output only the requested artifacts.

Inputs
- targetImplementation (code under test): ${targetImplementation}
- referenceImplementation: ${referenceImplementation}
- referenceTests: ${referenceTests}

Procedure:
Phase 1 — Detect language and environment:
1) Infer programming languages for \`targetImplementation\`, \`referenceImplementation\` and \`referenceTests\` based on file extensions and by examining their contents.
2) Detect testing framework used in the target codebase by analyzing dependencies file and existing test files.
3) If multiple frameworks detected, choose the one used for unit tests. Prefer the one already present in existing tests file close to targetImplementation file location.

Phase 2 — Analyze reference implementation:
4) Examine the \`referenceImplementation\` to understand its core functionality, business logic, and API surface.
5) Identify key functions, methods, classes, and their signatures in the reference implementation.
6) Map the logical flow, data transformations, error handling patterns, and edge cases handled by the reference implementation.
7) Note any language-specific patterns, constraints, or behaviors that may need adaptation.

Phase 3 — Analyze reference tests:
8) Examine all test files in \`referenceTests\` to understand the testing strategy and coverage.
9) Catalog all test cases, grouping them by: functionality tested, test patterns (unit/integration/edge cases), input/output scenarios, error conditions, and boundary conditions.
10) Extract the core test logic and assertions, abstracting away language-specific syntax.
11) Identify which test cases validate core business logic vs language-specific implementation details.

Phase 4 — Map reference to target:
12) Compare \`referenceImplementation\` and \`targetImplementation\` to identify corresponding functions, methods, and logic flows.
13) Create a mapping between reference functions and target functions that implement similar or equivalent functionality.
14) Identify any functionality present in reference but missing in target, or vice versa.
15) Note differences in API design, parameter types, return values, and error handling approaches between the two implementations.

Phase 5 — Analyze current project test style:
16) Examine existing test files in the current project (near targetImplementation) to understand the project's testing conventions and patterns.
17) Identify the test file structure: describe blocks, test/it naming, beforeEach/afterEach hooks, test organization patterns.
18) Document scaffolding patterns: how test fixtures are created, how dependencies are instantiated, setup and teardown approaches.
19) Document mocking/stubbing style: which mocking library is used (if any), mocking patterns, spy usage, stub patterns, how external dependencies are handled.
20) Note assertion style and patterns: which assertion library, custom matchers, error assertion patterns.
21) Identify import conventions: relative vs absolute paths, aliasing patterns, how test utilities are imported.

Phase 6 — Locate test placement:
22) Search for existing tests covering the target module. Decide if test should be appended to existing file testing the module or if new file should be created to test the module.
23) If creating new file analyze existing test files to correctly use same naming file convention for the new file name and extensions.
24) If appending to existing file set up test cases in similar way as the tests already included in the file. If creating new file analyze existing test files to correctly set up the testing framework in a similar way.

Phase 7 — Analyze target implementation:
25) Parse signatures, inputs, outputs, side effects, exceptional paths, async/await, throw or reverts in the target implementation.
26) Map branches and guards. Identify boundary values and invariants. Mark non-determinism sources (time, RNG, I/O).

Phase 8 — Adapt and design test cases:
27) For each applicable test case from the reference tests, determine if it should be adapted for the target implementation.
28) Translate test scenarios from reference language/framework to target language/framework, preserving the core test logic.
29) Adapt input data, expected outputs, and assertions to match the target implementation's API and data types.
30) Add target-specific test cases for functionality not covered by reference tests but present in target implementation.
31) Include security-focused cases: invalid/tainted inputs, injection payloads, path traversal, overflow/underflow, encoding pitfalls, language-appropriate cases, fuzz/property checks for pure functions.
32) Always try to avoid mock too wide code surface but if needed define mocking/stubbing plan attempting to follow existing mocking patterns to never hit real network, database, filesystem, clock, or randomness.

Phase 9 — Emit tests:
33) Produce tests that strictly follow the existing test style patterns identified in Phase 5. Mimic the project's conventions for: test structure, describe/test organization, scaffolding setup, mocking patterns, assertion style, and import conventions.
34) Keep small, pure helpers. No hidden side effects.
35) Ensure deterministic execution and proper test isolation.
36) Use meaningful test case names that reflect both the original reference test intent and target-specific behavior, following the naming conventions observed in existing tests.
37) **IMPORTANT**: Write tests to the location that was decided in Phase 6.

Phase 10 — Validate statically:
38) Self-check imports, assertion usage, compilation or type errors and lints. Avoid duplicate tests.
39) Output estimated coverage from new tests and note which reference test cases were successfully adapted vs skipped and why.

Phase 11 — Run and verify tests:
40) Execute the newly added tests using a test command that filters specifically for the test file created/modified, using the deepest path possible to minimize execution time (e.g., run only the specific test file, not the entire test suite).
41) Review test results. If tests fail, analyze the failure messages and fix issues in the test code.
42) Repeat the test execution until all tests pass, making necessary adjustments to test setup, mocks, assertions, or test logic.
43) If tests continue to fail after multiple iterations, suggest next steps: verify the target implementation behavior, check if additional setup/teardown is needed, review if mocks are configured correctly, or identify if there are environmental dependencies not properly handled.

Constraints:
- No original code file writes, or schema changes.
- Prefer pure helpers and table-driven tests.
- Preserve the semantic intent of reference tests while adapting to target language idioms.

Language specifics:
- typescript/javascript: respect tsconfig/moduleResolution. Detect framework in package.json. Use fake timers instead of real time.
- rust: use #[cfg(test)] modules, proptest when property tests enabled.
- solidity: consider gas costs, revert conditions, and state changes in test design.

Cross-language adaptation notes:
- When adapting from smart contracts to other languages, pay special attention to numeric precision, error handling patterns, and state management differences.
- When adapting between different paradigms (OOP vs functional), focus on preserving the logical test scenarios rather than structural similarities.
- Consider language-specific constraints and capabilities when adapting test patterns.

Produce results now.`,
          },
        },
      ],
    })
  );
}