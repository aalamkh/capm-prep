#!/usr/bin/env bash
# Convert scripts/desktop-app/icon.png (≥1024×1024 recommended) into an .icns
# and stamp it onto "CAPM Prep.app" on the Desktop. macOS only.
#
# Usage:
#   1. Place a square PNG at scripts/desktop-app/icon.png
#   2. ./scripts/desktop-app/make-icon.sh
#   3. Re-run the installer (or it's applied immediately).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_PNG="$SCRIPT_DIR/icon.png"
ICONSET="$SCRIPT_DIR/icon.iconset"
OUTPUT_ICNS="$SCRIPT_DIR/icon.icns"
DESKTOP_APP="$HOME/Desktop/CAPM Prep.app"

if [[ ! -f "$SOURCE_PNG" ]]; then
  echo "Drop a square PNG at $SOURCE_PNG (1024×1024 ideal) and re-run." >&2
  exit 1
fi

rm -rf "$ICONSET"
mkdir "$ICONSET"

# Standard macOS .iconset sizes.
declare -a SIZES=(16 32 64 128 256 512 1024)
for s in "${SIZES[@]}"; do
  sips -z "$s" "$s" "$SOURCE_PNG" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  if [[ "$s" -lt 1024 ]]; then
    next=$((s * 2))
    sips -z "$next" "$next" "$SOURCE_PNG" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
  fi
done

iconutil -c icns "$ICONSET" -o "$OUTPUT_ICNS"
rm -rf "$ICONSET"

echo "Built $OUTPUT_ICNS"

if [[ -d "$DESKTOP_APP" ]]; then
  cp "$OUTPUT_ICNS" "$DESKTOP_APP/Contents/Resources/applet.icns"
  touch "$DESKTOP_APP"
  echo "Applied to $DESKTOP_APP — refresh Finder if you don't see the new icon."
else
  echo "$DESKTOP_APP not found yet. Run scripts/desktop-app/install.sh first."
fi
