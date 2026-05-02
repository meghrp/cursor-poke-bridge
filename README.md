# cursor-poke-bridge

A small MCP bridge that exposes a run_cursor_agent tool backed by FastMCP and the Cursor SDK.

## What it does

- Hosts an MCP server over HTTP streaming at /mcp
- Exposes a run_cursor_agent tool that asks Cursor to work on a GitHub repository
- Reads CURSOR_TOKEN and GITHUB_TOKEN from the environment

## Local structure

- index.ts: MCP server entrypoint
- package.json: TypeScript project metadata and scripts
- tsconfig.json: TypeScript configuration
- .env.example: environment variable template

## Run it on a Hetzner VPS

1. Install system dependencies

   sudo apt update
   sudo apt install -y git curl

2. Install Node.js 22+ and pm2

   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2

3. Clone the repository

   git clone https://github.com/meghrp/cursor-poke-bridge.git
   cd cursor-poke-bridge

4. Install dependencies

   npm install

5. Set environment variables

   cp .env.example .env
   nano .env

   Set these values:
   - CURSOR_TOKEN: your Cursor API token
   - GITHUB_TOKEN: a GitHub token that Cursor can use for repo access
   - PORT: the port you want the server to listen on, for example 3000

6. Start it with pm2

   pm2 start npm --name cursor-poke-bridge -- run start
   pm2 save
   pm2 startup

7. Make the MCP endpoint reachable

   The server listens on /mcp. If you are exposing it directly, the endpoint will look like:
   http://YOUR_VPS_IP:3000/mcp

   If you put it behind a domain and HTTPS reverse proxy, use the public https URL instead.

## Add it to Poke

Once the server is reachable, add it with poke mcp add and point it at the MCP endpoint:

   poke mcp add cursor-poke-bridge http://YOUR_VPS_IP:3000/mcp

If you are using a domain and HTTPS, replace the URL with the public https endpoint, for example:

   poke mcp add cursor-poke-bridge https://cursor-poke-bridge.example.com/mcp

## Tool usage

Example request payload for run_cursor_agent:

{
  "repoUrl": "https://github.com/meghrp/cursor-poke-bridge.git",
  "prompt": "Review the project and add a basic health check endpoint.",
  "branch": "main",
  "autoCreatePR": true,
  "workOnCurrentBranch": true
}
