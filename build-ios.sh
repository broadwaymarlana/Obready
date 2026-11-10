#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=== ObjectionReady iOS Build ==="

# Require PRODUCTION_URL for release builds
if [ -z "${PRODUCTION_URL:-}" ]; then
  echo "ERROR: PRODUCTION_URL must be set for iOS release builds."
  echo "  Example: PRODUCTION_URL=https://objectionready.com ./scripts/build-ios.sh"
  exit 1
fi
export CAPACITOR_PROD=true
echo "  Production URL: $PRODUCTION_URL"

echo "Step 1: Building web assets..."
npm run build

echo "Step 2: Ensuring iOS platform exists..."
if [ ! -d "ios" ]; then
  echo "  iOS platform not found, adding..."
  npx cap add ios
fi

echo "Step 3: Syncing web assets to iOS project (production)..."
CAPACITOR_PROD=true PRODUCTION_URL="$PRODUCTION_URL" npx cap sync ios

ICON_SRC="$PROJECT_DIR/resources/ios/icon"
ICON_DEST="$PROJECT_DIR/ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [ -d "$ICON_DEST" ] && [ -d "$ICON_SRC" ]; then
  echo "Step 4: Copying app icons..."
  cp "$ICON_SRC/Contents.json" "$ICON_DEST/Contents.json"
  for SIZE in 40 58 60 80 87 120 152 167 180 512 1024; do
    if [ -f "$ICON_SRC/icon-${SIZE}x${SIZE}.png" ]; then
      cp "$ICON_SRC/icon-${SIZE}x${SIZE}.png" "$ICON_DEST/icon-${SIZE}x${SIZE}.png"
    fi
  done
  echo "  Icons copied."
fi

PLIST="$PROJECT_DIR/ios/App/App/Info.plist"
if [ -f "$PLIST" ] && command -v /usr/libexec/PlistBuddy &> /dev/null; then
  echo "Step 5: Verifying Info.plist permissions..."
  if ! grep -q "NSCameraUsageDescription" "$PLIST"; then
    /usr/libexec/PlistBuddy -c "Add :NSCameraUsageDescription string 'Used to capture photos of physical evidence and documents for case analysis.'" "$PLIST"
    echo "  Added NSCameraUsageDescription"
  fi
  if ! grep -q "NSPhotoLibraryUsageDescription" "$PLIST"; then
    /usr/libexec/PlistBuddy -c "Add :NSPhotoLibraryUsageDescription string 'Used to select existing photos of evidence and documents from the device for upload and analysis.'" "$PLIST"
    echo "  Added NSPhotoLibraryUsageDescription"
  fi
  if ! grep -q "NSPhotoLibraryAddUsageDescription" "$PLIST"; then
    /usr/libexec/PlistBuddy -c "Add :NSPhotoLibraryAddUsageDescription string 'Used to save exported case documents and generated reports to the photo library.'" "$PLIST"
    echo "  Added NSPhotoLibraryAddUsageDescription"
  fi
fi

SPLASH_SRC="$PROJECT_DIR/resources/ios/splash"
SPLASH_DEST="$PROJECT_DIR/ios/App/App/Assets.xcassets/Splash.imageset"
if [ -d "$PROJECT_DIR/ios/App/App/Assets.xcassets" ] && [ -d "$SPLASH_SRC" ]; then
  echo "Step 6: Setting up splash screen..."
  mkdir -p "$SPLASH_DEST"
  cp "$SPLASH_SRC/splash-2732x2732.png" "$SPLASH_DEST/" 2>/dev/null || true
  if [ ! -f "$SPLASH_DEST/Contents.json" ]; then
    cat > "$SPLASH_DEST/Contents.json" << 'SPLASHJSON'
{
  "images": [
    {
      "filename": "splash-2732x2732.png",
      "idiom": "universal",
      "scale": "1x"
    },
    { "idiom": "universal", "scale": "2x" },
    { "idiom": "universal", "scale": "3x" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
SPLASHJSON
  fi
  echo "  Splash screen configured."
fi

echo ""
echo "=== iOS Build Complete ==="
echo "Verification:"
[ -d "ios/App" ] && echo "  [OK] ios/App directory exists" || echo "  [FAIL] ios/App directory missing"
[ -f "$PLIST" ] && echo "  [OK] Info.plist exists" || echo "  [WARN] Info.plist not found"
[ -f "$ICON_DEST/icon-1024x1024.png" ] 2>/dev/null && echo "  [OK] App Store icon (1024x1024) present" || echo "  [WARN] App Store icon not copied"
echo ""
echo "Next: npx cap open ios  (to open in Xcode)"
