#!/bin/sh
# POSIX stand-in for Windows `cmd.exe /c ...`.
# Cursor Cloud often forwards a Windows MCP config:
#   cmd.exe /c npx -y @microsoft/powerbi-modeling-mcp@latest --start --readonly
# On Linux that fails because cmd.exe does not exist. Installing this file as
# /usr/local/bin/cmd.exe lets the same config start the Node MCP server.
if [ "$1" = "/c" ] || [ "$1" = "/C" ]; then
  shift
fi
exec "$@"
