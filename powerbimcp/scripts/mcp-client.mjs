#!/usr/bin/env node
/**
 * Minimal NDJSON MCP stdio client for the local Power BI Authoring server.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export function resolveMcpBinary(root) {
  const native = path.join(
    root,
    "node_modules/@microsoft/powerbi-modeling-mcp-linux-x64/dist/powerbi-modeling-mcp"
  );
  if (fs.existsSync(native)) {
    return { command: native, args: [] };
  }
  const wrapper = path.join(root, "node_modules/@microsoft/powerbi-modeling-mcp/index.js");
  if (fs.existsSync(wrapper)) {
    return { command: process.execPath, args: [wrapper] };
  }
  return { command: "npx", args: ["-y", "@microsoft/powerbi-modeling-mcp@latest"] };
}

export function startReadonlyServer(root, extraArgs = ["--start", "--readonly", "--accepteula"]) {
  const { command, args } = resolveMcpBinary(root);
  const proc = spawn(command, [...args, ...extraArgs], {
    cwd: root,
    env: { ...process.env, PBI_MODELING_MCP_ACCEPT_EULA: "true" },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stderr = "";
  let stdoutBuf = "";
  const pending = new Map();
  let nextId = 1;

  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString("utf8");
  });
  proc.stdout.on("data", (chunk) => {
    stdoutBuf += chunk.toString("utf8");
    const lines = stdoutBuf.split("\n");
    stdoutBuf = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      if (message.id != null && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) {
          reject(Object.assign(new Error(message.error.message), { rpc: message.error }));
        } else {
          resolve(message.result);
        }
      }
    }
  });

  function request(method, params) {
    const id = nextId++;
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timed out waiting for ${method}`));
      }, Number(process.env.MCP_REQUEST_TIMEOUT_MS || 20000));
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
    });
  }

  function notify(method, params) {
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
  }

  async function waitUntilReady(timeoutMs = 20000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (/transport reading messages/i.test(stderr) || /Application started/i.test(stderr)) {
        return;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  async function close() {
    try {
      proc.kill("SIGTERM");
    } catch {
      // ignore
    }
  }

  return { proc, request, notify, waitUntilReady, close, getStderr: () => stderr };
}

export function projectRootFrom(metaUrl) {
  return path.resolve(path.dirname(fileURLToPath(metaUrl)), "..");
}
