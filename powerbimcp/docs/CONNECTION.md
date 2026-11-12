# Power BI Authoring MCP connection report

This document records what this Cloud Agent found, then what worked after
moving the work into `powerbimcp`.

No tables, relationships, or measures were modified. The only MCP calls after
startup were `initialize`, `tools/list`, `prompts/list`, `resources/list`,
`connection_operations` (`ConnectFolder`, `Disconnect`), and `List` on tables,
measures, and relationships.

## 1. Cursor-attached `powerbi-authoring-local` (this Cloud Agent)

| Check | Result |
| --- | --- |
| Namespace | `powerbi-authoring-local` |
| Status | **error** — live tool discovery failed |
| Tools available to the agent | none |
| `mcp_auth` | Not applicable. This server is a local stdio command, not Cursor OAuth. |
| MCP resources | Server not ready |

The session MCP config launched:

```text
cmd.exe /c npx -y @microsoft/powerbi-modeling-mcp@latest --start --readonly
```

That command cannot start on this Linux Cloud Agent (`cmd.exe` is not installed).
Cursor therefore never registered tools from the server.

## 2. Direct Linux process (this repo)

The npm package supports Linux x64. Starting the bundled binary with
`--start --readonly --accepteula` **does** communicate over stdio JSON-RPC
(newline-delimited JSON).

| Check | Result |
| --- | --- |
| Package | `@microsoft/powerbi-modeling-mcp@1.0.1` |
| Native binary | `@microsoft/powerbi-modeling-mcp-linux-x64` |
| Protocol | MCP `2024-11-05`, NDJSON stdio |
| Server name | `powerbi-authoring-local` |
| Mode | ReadOnly |
| EULA | accepted for the probe process only |
| `tools/list` | 21 tools |
| `prompts/list` | 6 prompts |
| `resources/list` | 4 resources |
| Sample TMDL connect | 2 tables, 1 measure, 1 relationship loaded in memory |

See `mcp-probe-result.json` and `mcp-sample-connect-result.json`.

## How to connect from Cursor

Use `npx` directly. Do **not** wrap it in `cmd.exe` on Linux or macOS.

```json
{
  "mcpServers": {
    "powerbi-authoring-local": {
      "command": "npx",
      "args": [
        "-y",
        "@microsoft/powerbi-modeling-mcp@latest",
        "--start",
        "--readonly"
      ]
    }
  }
}
```

Before tools other than EULA acceptance work, review and accept the
[Power BI Authoring MCP Server EULA](https://go.microsoft.com/fwlink/?LinkId=2381247).
Interactive clients can call `accept_eula`. Unattended probes in this repo pass
`--accepteula` for the current process only.

Then connect to a model:

- Power BI Desktop: `Connect to '<File Name>' in Power BI Desktop`
- Fabric: `Connect to semantic model '<Name>' in Fabric Workspace '<Workspace>'`
- This sample: `Open semantic model from PBIP folder 'models/SampleSales.SemanticModel/definition'`

Keep `--readonly` unless you explicitly want modeling writes.
