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
| Status | **ready** after installing `bin/cmd-shim.sh` as `/usr/local/bin/cmd.exe` |
| Tools discovered | Yes (21 modeling tools + `accept_eula`) |
| First tool calls | Blocked until the Power BI Authoring MCP EULA is accepted in that process |
| Desktop instances | Still 0 on this Linux VM |

The session MCP config launched:

```text
cmd.exe /c npx -y @microsoft/powerbi-modeling-mcp@latest --start --readonly
```

Linux has no Windows `cmd.exe`. `scripts/install-cmd-shim.sh` installs a POSIX
stand-in so that command becomes `npx ... --start --readonly`. That fixes
**server discovery**. It does not create a Power BI Desktop process.

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

## 3. Power BI Desktop: `ITSM_Service_Intelligence.pbix`

Attempted with the official sequence (`ListLocalInstances`, then Connect to
`localhost:<port>`). Result: **not connected**.

| Check | Result |
| --- | --- |
| `ListLocalInstances` | 0 |
| `.pbix` on this VM | not found |
| ADOMD Desktop attach | Windows-only |
| `ListConnections` | 0 |
| Model writes | none |

See [How it works](HOW_IT_WORKS.md) and `mcp-desktop-connect-result.json`.
