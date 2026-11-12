# powerbimcp

Workspace for the **Power BI Authoring MCP server** (`powerbi-authoring-local`).
It uses the official `@microsoft/powerbi-modeling-mcp` package, starts the
server in **read-only** mode, and includes a tiny TMDL sample so the server can
be exercised without Power BI Desktop.

## Why this folder exists

The Cloud Agent session registered the MCP server as:

```text
cmd.exe /c npx -y @microsoft/powerbi-modeling-mcp@latest --start --readonly
```

`cmd.exe` is Windows-only, so Cursor could not discover any Power BI tools on
Linux. This project:

- launches the server with `npx` / the Linux binary
- installs `bin/cmd-shim.sh` as `cmd.exe` so the Windows-style Cloud MCP config
  still starts (`./scripts/install-cmd-shim.sh`)

GitHub App tokens for this agent cannot create `tuvisminds-design/powerbimcp`.
Until that repository exists, the project lives here and can be split out with
`scripts/create-standalone-repo.sh`.

## Quick start

```bash
cd powerbimcp
npm install
npm run probe              # initialize + tools/list (no model writes)
npm run connect:readonly   # open the sample TMDL folder and list objects
```

`npm run probe` last reported **21 tools, 6 prompts, 4 resources**.
`npm run connect:readonly` loaded **2 tables, 1 measure, 1 relationship** from
`models/SampleSales.SemanticModel/definition` and disconnected without exporting
or saving.

## Cursor / VS Code MCP config

Checked-in files:

- `.cursor/mcp.json` — Cursor (`mcpServers`, `npx`, `--readonly`)
- `.vscode/mcp.json` — VS Code (`servers`, same args)

Do not wrap the command in `cmd.exe` unless you are on Windows and `npx` is not
on PATH.

Review the [Power BI Authoring MCP Server EULA](https://go.microsoft.com/fwlink/?LinkId=2381247)
before use.

## Sample model

`models/SampleSales` is a static PBIP/TMDL fixture (`Date`, `Sales`, one
relationship, measure `Sales Amount`). It is not a live Desktop or Fabric
dataset. Read it with `ConnectFolder`; do not run `ExportToTmdlFolder` or other
write operations unless you intend to change it.

## Desktop vs this Cloud Agent

`Connect to 'ITSM_Service_Intelligence.pbix' in Power BI Desktop` talks to a
local `msmdsrv.exe` started by Desktop. That is Windows-only and must run on
the same machine as the MCP server. This Linux Cloud Agent cannot attach to
that file.

For Cloud Agents, save the report as a Power BI Project and connect to the
TMDL folder instead. Details: [How it works](docs/HOW_IT_WORKS.md).

```bash
npm run connect:desktop -- ITSM_Service_Intelligence.pbix
```

## Docs

- [How connections work](docs/HOW_IT_WORKS.md)
- [Connection report](docs/CONNECTION.md)
- [Capabilities](docs/CAPABILITIES.md)
- Official server: [microsoft/powerbi-modeling-mcp](https://github.com/microsoft/powerbi-modeling-mcp)
