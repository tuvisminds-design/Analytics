#!/usr/bin/env bash
# Turn this folder into a standalone git repository and print the commands
# needed to publish it as github.com/<owner>/powerbimcp.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-}"

if [[ -n "$DEST" ]]; then
  mkdir -p "$DEST"
  tar -C "$ROOT" --exclude node_modules --exclude .git -cf - . | tar -C "$DEST" -xf -
  cd "$DEST"
else
  cd "$ROOT"
fi

if [[ -d .git ]]; then
  echo "Git repository already exists in $(pwd)"
else
  git init -b main
  git add .
  git commit -m "Initial Power BI Authoring MCP workspace"
fi

cat <<'EOF'

This folder is now a git repository named powerbimcp.

GitHub App tokens used by Cloud Agents cannot create a new GitHub repository.
Create it from your account, then push:

  gh repo create tuvisminds-design/powerbimcp --public --source=. --remote=origin --push

Or:

  git remote add origin git@github.com:tuvisminds-design/powerbimcp.git
  git push -u origin main

EOF
