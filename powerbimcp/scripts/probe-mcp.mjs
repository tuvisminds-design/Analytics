#!/usr/bin/env node
/**
 * Read-only probe of the local Power BI Authoring MCP server.
 * Performs initialize / tools/list / prompts/list / resources/list only.
 * Does not connect to a semantic model or invoke modeling write tools.
 */
import fs from "node:fs";
import path from "node:path";
import { projectRootFrom, resolveMcpBinary, startReadonlyServer } from "./mcp-client.mjs";

const root = projectRootFrom(import.meta.url);
const { command, args } = resolveMcpBinary(root);
const client = startReadonlyServer(root);

const result = {
  probedAt: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  command,
  args: [...args, "--start", "--readonly", "--accepteula"],
  connected: false,
  initialize: null,
  tools: [],
  prompts: [],
  resources: [],
  errors: [],
};

try {
  await client.waitUntilReady();
  const initialize = await client.request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "powerbimcp-probe", version: "0.1.0" },
  });
  result.connected = true;
  result.initialize = initialize;
  client.notify("notifications/initialized", {});

  const tools = await client.request("tools/list", {});
  result.tools = (tools?.tools || []).map((tool) => ({
    name: tool.name,
    description: tool.description || "",
    readOnlyHint: tool.annotations?.readOnlyHint ?? null,
    destructiveHint: tool.annotations?.destructiveHint ?? null,
  }));

  try {
    const prompts = await client.request("prompts/list", {});
    result.prompts = (prompts?.prompts || []).map((prompt) => ({
      name: prompt.name,
      description: prompt.description || "",
    }));
  } catch (err) {
    result.errors.push(`prompts/list: ${err.message}`);
  }

  try {
    const resources = await client.request("resources/list", {});
    result.resources = (resources?.resources || []).map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description || "",
    }));
  } catch (err) {
    result.errors.push(`resources/list: ${err.message}`);
  }
} catch (err) {
  result.errors.push(err.message);
} finally {
  await client.close();
}

const outPath = path.join(root, "docs/mcp-probe-result.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(result.errors.length || !result.connected ? 1 : 0);
