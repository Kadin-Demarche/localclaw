#!/usr/bin/env bash
set -euo pipefail

cd /repo

export LOCALCLAW_STATE_DIR="/tmp/localclaw-test"
export LOCALCLAW_CONFIG_PATH="${LOCALCLAW_STATE_DIR}/localclaw.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${LOCALCLAW_STATE_DIR}/credentials"
mkdir -p "${LOCALCLAW_STATE_DIR}/agents/main/sessions"
echo '{}' >"${LOCALCLAW_CONFIG_PATH}"
echo 'creds' >"${LOCALCLAW_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${LOCALCLAW_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm localclaw reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${LOCALCLAW_CONFIG_PATH}"
test ! -d "${LOCALCLAW_STATE_DIR}/credentials"
test ! -d "${LOCALCLAW_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${LOCALCLAW_STATE_DIR}/credentials"
echo '{}' >"${LOCALCLAW_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm localclaw uninstall --state --yes --non-interactive

test ! -d "${LOCALCLAW_STATE_DIR}"

echo "OK"
