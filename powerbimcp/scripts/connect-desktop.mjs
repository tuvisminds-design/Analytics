#!/usr/bin/env node
/**
 * Read-only Power BI Desktop connection attempt.
 *
 * Official path:
 *   1. ListLocalInstances (find msmdsrv / PBIDesktop on this machine)
 *   2. Match the .pbix file name to a local Analysis Services catalog
 *   3. Connect with Data Source=localhost:<port>
 *
 * Does not create, update, delete, or export model objects.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { projectRootFrom, startReadonlyServer } from "./mcp-client.mjs";

const root = projectRootFrom(import.meta.url);
const requested = process.argv[2] || "ITSM_Service_Intelligence.pbix";
const requestedBase = requested.replace(/\.pbix$/i, "");
const client = startReadonlyServer(root);

const result = {
  probedAt: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  requestedFile: requested,
  connected: false,
  reason: null,
  localInstances: [],
  connections: [],
  connect: null,
  diagnostics: {
    isLinux: process.platform !== "win32",
    adomdWindowsOnly: process.platform !== "win32",
    pbixOnDisk: [],
  },
  errors: [],
};

function parseTool(toolResult) {
  const block = toolResult?.content?.[0];
  if (block?.type === "text") {
    try {
      return JSON.parse(block.text);
    } catch {
      return block.text;
    }
  }
  return toolResult;
}

function callTool(name, request) {
  return client.request("tools/call", {
    name,
    arguments: { request },
  });
}

function findPbixFiles() {
  const roots = [root, path.resolve(root, ".."), os.homedir()];
  const hits = [];
  for (const dir of roots) {
    const candidate = path.join(dir, requested);
    if (fs.existsSync(candidate)) {
      hits.push(candidate);
    }
  }
  return hits;
}

function matchInstance(instances) {
  const needle = requestedBase.toLowerCase();
  return (instances || []).find((item) => {
    const hay = JSON.stringify(item).toLowerCase();
    return hay.includes(needle) || hay.includes(requested.toLowerCase());
  });
}

function connectionStringFor(instance) {
  if (instance?.connectionString) return instance.connectionString;
  if (instance?.port) return `Data Source=localhost:${instance.port}`;
  if (instance?.dataSource) return `Data Source=${instance.dataSource}`;
  return null;
}

try {
  result.diagnostics.pbixOnDisk = findPbixFiles();
  await client.waitUntilReady();
  await client.request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "powerbimcp-desktop-connect", version: "0.1.0" },
  });
  client.notify("notifications/initialized", {});

  const local = parseTool(
    await callTool("connection_operations", { operation: "ListLocalInstances" })
  );
  result.localInstances = local?.data || [];

  if (!result.localInstances.length) {
    result.reason =
      process.platform === "win32"
        ? `No local Power BI Desktop Analysis Services instance is running. Open ${requested} in Power BI Desktop on this machine and retry.`
        : `Power BI Desktop connections require Windows. This host is ${process.platform}/${process.arch}, ListLocalInstances returned 0, and ADOMD Desktop attach is Windows-only.`;
  } else {
    const matched = matchInstance(result.localInstances) || result.localInstances[0];
    const connectionString = connectionStringFor(matched);
    if (!connectionString) {
      result.reason =
        "Local instances were found but no localhost port / connection string was returned.";
      result.connect = matched;
    } else {
      const connect = parseTool(
        await callTool("connection_operations", {
          operation: "Connect",
          connectionString,
          initialCatalog: requestedBase,
        })
      );
      result.connect = connect;
      const message = String(connect?.message || "");
      result.connected = /success/i.test(message) && !/error/i.test(message);
      if (!result.connected) {
        result.reason = message || "Connect did not succeed.";
      }
    }
  }

  const listed = parseTool(
    await callTool("connection_operations", { operation: "ListConnections" })
  );
  result.connections = listed?.data || [];
  if (result.connected && result.connections.length) {
    await callTool("connection_operations", { operation: "Disconnect" });
  }
} catch (err) {
  result.errors.push(err.message);
  if (err.rpc) result.errors.push(JSON.stringify(err.rpc));
  result.reason = result.reason || err.message;
} finally {
  await client.close();
}

const outPath = path.join(root, "docs/mcp-desktop-connect-result.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
process.exit(result.connected ? 0 : 2);
