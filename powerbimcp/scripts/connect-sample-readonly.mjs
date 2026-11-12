#!/usr/bin/env node
/**
 * Read-only: connect to the sample TMDL folder, list tables/measures/relationships,
 * then disconnect. Does not create, update, delete, or refresh model objects.
 */
import fs from "node:fs";
import path from "node:path";
import { projectRootFrom, startReadonlyServer } from "./mcp-client.mjs";

const root = projectRootFrom(import.meta.url);
const folderPath = path.join(root, "models/SampleSales.SemanticModel/definition");
const client = startReadonlyServer(root);
const result = {
  probedAt: new Date().toISOString(),
  folderPath,
  connected: false,
  connection: null,
  tables: null,
  measures: null,
  relationships: null,
  errors: [],
};

function callTool(name, request) {
  return client.request("tools/call", {
    name,
    arguments: { request },
  });
}

try {
  await client.waitUntilReady();
  await client.request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "powerbimcp-readonly-connect", version: "0.1.0" },
  });
  client.notify("notifications/initialized", {});

  const connection = await callTool("connection_operations", {
    operation: "ConnectFolder",
    folderPath,
  });
  result.connection = connection;
  result.connected = true;

  result.tables = await callTool("table_operations", { operation: "List" });
  result.measures = await callTool("measure_operations", { operation: "List" });
  result.relationships = await callTool("relationship_operations", { operation: "List" });

  await callTool("connection_operations", { operation: "Disconnect" });
} catch (err) {
  result.errors.push(err.message);
  if (err.rpc) {
    result.errors.push(JSON.stringify(err.rpc));
  }
} finally {
  await client.close();
}

const outPath = path.join(root, "docs/mcp-sample-connect-result.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(result.errors.length ? 1 : 0);
