#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR"
VERIFY=0

usage() {
  cat <<'EOF'
Usage: scripts/pack-local-npm.sh [--out <dir>] [--verify]

Builds and packs LocalClaw into a local npm tarball (no publish).

Options:
  --out <dir>   Output directory for the generated .tgz (default: repo root)
  --verify      Install tarball into a temp directory and run `localclaw --version`
  -h, --help    Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out)
      [[ $# -ge 2 ]] || {
        echo "Error: --out requires a directory argument." >&2
        exit 1
      }
      OUT_DIR="$2"
      shift 2
      ;;
    --verify)
      VERIFY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

mkdir -p "$OUT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  if ! command -v corepack >/dev/null 2>&1; then
    echo "Error: pnpm not found on PATH and corepack is unavailable." >&2
    exit 1
  fi
  SHIM_DIR="$(mktemp -d /tmp/localclaw-pack-pnpm-shim.XXXXXX)"
  cat > "$SHIM_DIR/pnpm" <<'EOF'
#!/usr/bin/env bash
exec corepack pnpm "$@"
EOF
  chmod +x "$SHIM_DIR/pnpm"
  export PATH="$SHIM_DIR:$PATH"
fi

echo "==> Packing LocalClaw to: $OUT_DIR"
PACK_RESULT="$(cd "$ROOT_DIR" && npm pack --pack-destination "$OUT_DIR" --silent)"
TARBALL_NAME="$(echo "$PACK_RESULT" | tail -n 1 | tr -d '\r')"
TARBALL_PATH="$OUT_DIR/$TARBALL_NAME"

if [[ ! -f "$TARBALL_PATH" ]]; then
  echo "Error: npm pack did not produce expected tarball at $TARBALL_PATH" >&2
  exit 1
fi

echo "Created: $TARBALL_PATH"
echo "Install globally: npm install -g \"$TARBALL_PATH\""
echo "Install locally: npm install \"$TARBALL_PATH\""

if [[ "$VERIFY" == "1" ]]; then
  TMP_DIR="$(mktemp -d /tmp/localclaw-pack-install.XXXXXX)"
  echo "==> Verifying install in: $TMP_DIR"
  npm install --prefix "$TMP_DIR" "$TARBALL_PATH" >/dev/null
  echo "==> Installed version:"
  "$TMP_DIR/node_modules/.bin/localclaw" --version
fi
