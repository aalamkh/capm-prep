#!/usr/bin/env bash
# Build "CAPM Prep.app" and place it on the Desktop.
#
# Idempotent: safe to re-run. If the .app already exists it gets replaced.
#
# What it does:
#   1. Sanity-check that we're on macOS with osacompile available.
#   2. Confirm the project has a production build (.next exists).
#   3. Compile launcher.applescript → "CAPM Prep.app", with the project
#      path baked in, then move it to ~/Desktop.
#   4. Print a usage summary.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_NAME="CAPM Prep.app"
DESKTOP_PATH="$HOME/Desktop/$APP_NAME"
SOURCE_SCRIPT="$SCRIPT_DIR/launcher.applescript"
TMP_SCRIPT="$(mktemp -t capm-launcher.XXXXXX.applescript)"
trap 'rm -f "$TMP_SCRIPT"' EXIT

# 1. Tooling checks -----------------------------------------------------------
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: this installer only runs on macOS." >&2
  exit 1
fi
if ! command -v osacompile >/dev/null 2>&1; then
  echo "Error: osacompile not found (expected at /usr/bin/osacompile)." >&2
  exit 1
fi

# 2. Ensure a production build exists ----------------------------------------
if [[ ! -d "$PROJECT_ROOT/.next" ]]; then
  echo "No .next/ build found — running 'npm run build' first…"
  (cd "$PROJECT_ROOT" && npm run build)
fi

# 3. Substitute project path into the AppleScript and compile to .app --------
sed "s|__PROJECT_PATH__|${PROJECT_ROOT//|/\\|}|g" "$SOURCE_SCRIPT" > "$TMP_SCRIPT"

if [[ -e "$DESKTOP_PATH" ]]; then
  echo "Replacing existing $APP_NAME on Desktop…"
  rm -rf "$DESKTOP_PATH"
fi

# osacompile creates a stay-open / one-shot AppleScript .app bundle.
osacompile -o "$DESKTOP_PATH" "$TMP_SCRIPT"

# 4. Strip extended attributes + ad-hoc codesign -----------------------------
# Without these, double-clicking the .app in Finder triggers Gatekeeper's
# "developer cannot be verified" dialog, and many users dismiss it without
# seeing the Open button. Ad-hoc signing keeps the warning to a single
# right-click → Open the very first time, then never again.
find "$DESKTOP_PATH" -exec xattr -c {} \; 2>/dev/null || true
codesign --force --deep --sign - "$DESKTOP_PATH" >/dev/null 2>&1 || true

# 5. Optionally apply a custom icon ------------------------------------------
ICON_ICNS="$SCRIPT_DIR/icon.icns"
if [[ -f "$ICON_ICNS" ]]; then
  echo "Applying custom icon → $APP_NAME"
  cp "$ICON_ICNS" "$DESKTOP_PATH/Contents/Resources/applet.icns"
  # Touch the bundle so Finder picks up the icon change.
  touch "$DESKTOP_PATH"
fi

cat <<SUMMARY

Installed: $DESKTOP_PATH

Double-click it to launch CAPM Prep.

  • First click starts the production server in the background, then opens
    http://localhost:3000 in your default browser.
  • Subsequent clicks just reopen the browser tab — no extra server is
    started if one's already running on port 3000.
  • Server log: /tmp/capm-prep.log
  • To stop the server later:  lsof -ti :3000 | xargs kill

Custom icon:
  Drop a 1024×1024 PNG at $SCRIPT_DIR/icon.png and run scripts/desktop-app/make-icon.sh,
  OR right-click the .app in Finder → Get Info → drag a PNG onto the icon
  in the top-left corner.
SUMMARY
