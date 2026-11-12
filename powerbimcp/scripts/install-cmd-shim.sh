#!/usr/bin/env bash
# Install a cmd.exe stand-in so Windows-style Cursor MCP configs can start on Linux.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/bin/cmd-shim.sh"
DEST="${1:-/usr/local/bin/cmd.exe}"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC" >&2
  exit 1
fi

install_cmd() {
  local dest="$1"
  mkdir -p "$(dirname "$dest")"
  cp "$SRC" "$dest"
  chmod 755 "$dest"
}

if [[ -w "$(dirname "$DEST")" ]]; then
  install_cmd "$DEST"
else
  sudo cp "$SRC" "$DEST"
  sudo chmod 755 "$DEST"
fi

echo "Installed cmd.exe shim at $DEST"
command -v cmd.exe || true
cmd.exe /c echo cmd-shim-ok
