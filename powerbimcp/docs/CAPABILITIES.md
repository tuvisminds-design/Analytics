# Power BI Authoring MCP capabilities

Observed from `@microsoft/powerbi-modeling-mcp@1.0.1` on Linux x64 in
read-only mode. Tool *names* are still advertised for write operations; the
server's WriteGuard blocks applying edits when `--readonly` is set.

`DataSourceOperationsTool` is skipped in Power BI compatibility mode.

## Server

- Name: `powerbi-authoring-local`
- Title: Power BI Authoring MCP Server (Local)
- Version: 1.0.1
- Transport: stdio (newline-delimited JSON-RPC)
- Targets: Power BI Desktop, Microsoft Fabric workspaces, local PBIP / TMDL files

## Tools (21)

Read-oriented (MCP `readOnlyHint: true`):

| Tool | Role |
| --- | --- |
| `connection_operations` | Connect, ConnectFabric, ConnectFolder, ConnectBimFile, Disconnect, GetConnection, ListConnections, ListLocalInstances |
| `dax_query_operations` | Execute and validate DAX (needs a live Analysis Services engine; not available on TMDL-only in-memory models) |
| `trace_operations` | Capture Analysis Services trace events |

Write-capable tools (blocked in `--readonly`, still listed):

| Tool | Role |
| --- | --- |
| `database_operations` | List databases; import/export TMDL or BIM; create/update; deploy to Fabric |
| `model_operations` | Get, create, update, refresh, stats, rename, export TMDL |
| `table_operations` | Create, update, delete, get, list, refresh, rename, schema, export |
| `column_operations` | Create, update, delete, get, list, rename, export TMDL |
| `measure_operations` | Create, update, delete, get, list, rename, move, export TMDL |
| `relationship_operations` | Create, update, delete, list, get, activate/deactivate, find |
| `partition_operations` | Partition CRUD and refresh |
| `transaction_operations` | Begin, commit, rollback |
| `named_expression_operations` | Power Query parameters / named expressions |
| `function_operations` | DAX user-defined functions |
| `calculation_group_operations` | Calculation groups and items |
| `calendar_operations` | Calendars and time-intelligence column groups |
| `query_group_operations` | Power Query groups |
| `user_hierarchy_operations` | User hierarchies |
| `security_role_operations` | RLS roles and table permissions |
| `perspective_operations` | Perspectives and members |
| `culture_operations` | Model cultures |
| `object_translation_operations` | Translations for model objects |

Safe read operations used in this repo: `List` / `Get` / `ConnectFolder` /
`Disconnect`. Do not call Create, Update, Delete, Rename, Move, Refresh, or
Deploy while working under the original read-only constraint.

## Prompts (6)

- `ConnectToPBIP`
- `ConnectToPowerBIDesktop`
- `ConnectToFabric`
- `CreateDAXQuery`
- `RunDAXQueryWithMetrics`
- `AnalyzeDAXQuery`

## Resources (4)

- `resource://powerbi_project_instructions`
- `resource://dax_query_instructions_and_examples`
- `resource://dax_udf_instructions_and_examples`
- `resource://calendar_instructions_and_examples`
