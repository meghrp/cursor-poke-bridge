import "dotenv/config";
import { Agent } from "@cursor/sdk";
import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({
  name: "cursor-poke-bridge",
  version: "1.0.0",
});

const runCursorAgentSchema = z.object({
  repoUrl: z
    .string()
    .min(1)
    .describe("GitHub repository clone URL, for example https://github.com/meghrp/cursor-poke-bridge.git"),
  prompt: z.string().min(1).describe("The prompt to execute in Cursor"),
  branch: z.string().optional().describe("Optional starting ref or branch name"),
  agentName: z.string().optional().describe("Optional name for the Cursor agent"),
  autoCreatePR: z.boolean().optional().default(false),
  workOnCurrentBranch: z.boolean().optional().default(true),
});

server.addTool({
  name: "run_cursor_agent",
  description: "Run a Cursor agent prompt against a GitHub repository connected to Cursor.",
  parameters: runCursorAgentSchema,
  execute: async ({ repoUrl, prompt, branch, agentName, autoCreatePR, workOnCurrentBranch }) => {
    const apiKey = process.env.CURSOR_TOKEN;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!apiKey) {
      throw new Error("CURSOR_TOKEN is not set");
    }

    if (!githubToken) {
      throw new Error("GITHUB_TOKEN is not set");
    }

    const result = await Agent.prompt(prompt, {
      apiKey,
      name: agentName ?? "cursor-poke-bridge",
      model: "claude-4-6-sonnet",
      cloud: {
        repos: [
          {
            url: repoUrl,
            ...(branch ? { startingRef: branch } : {}),
          },
        ],
        autoCreatePR,
        workOnCurrentBranch,
        envVars: {
          GITHUB_TOKEN: githubToken,
        },
      },
    });

    const branches = result.git?.branches?.length
      ? result.git.branches
          .map((entry) => {
            const parts = [entry.repoUrl];
            if (entry.branch) parts.push(`branch: ${entry.branch}`);
            if (entry.prUrl) parts.push(`pr: ${entry.prUrl}`);
            return parts.join(" | ");
          })
          .join("\n")
      : "none";

    return [
      `status: ${result.status}`,
      result.result ? `result:\n${result.result}` : "result: none",
      `durationMs: ${result.durationMs ?? "unknown"}`,
      `runId: ${result.id}`,
      `branches:\n${branches}`,
    ].join("\n\n");
  },
});

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

await server.start({
  transportType: "httpStream",
  httpStream: {
    host: "0.0.0.0",
    port,
    endpoint: "/mcp",
  },
});
