#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=== ObjectionReady Android Build ==="

# Require PRODUCTION_URL for release builds
if [ -z "${PRODUCTION_URL:-}" ]; then
  echo "ERROR: PRODUCTION_URL must be set for Android release builds."
  echo "  Example: PRODUCTION_URL=https://objectionready.com ./scripts/build-android.sh"
  exit 1
fi
export CAPACITOR_PROD=true
echo "  Production URL: $PRODUCTION_URL"

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 22 ] 2>/dev/null; then
  echo "WARNING: Capacitor CLI v8 requires Node.js >= 22 (found v$(node -v))."
  echo "         'cap add' and 'cap sync' may fail. Please upgrade Node.js."
fi

sed_inplace() {
  if sed --version 2>/dev/null | grep -q GNU; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

echo "Step 1: Building web assets..."
npm run build

echo "Step 2: Ensuring Android platform exists..."
if [ ! -d "android" ]; then
  echo "  Android platform not found, adding..."
  npx cap add android
fi

echo "Step 3: Syncing web assets to Android project (production)..."
CAPACITOR_PROD=true PRODUCTION_URL="$PRODUCTION_URL" npx cap sync android

ICON_SRC="$PROJECT_DIR/resources/android/icon"
RES_DIR="$PROJECT_DIR/android/app/src/main/res"

if [ -d "$RES_DIR" ] && [ -d "$ICON_SRC" ]; then
  echo "Step 4: Copying app icons to mipmap directories..."
  for DENSITY in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    SRC_DIR="$ICON_SRC/mipmap-$DENSITY"
    DEST_DIR="$RES_DIR/mipmap-$DENSITY"
    if [ -d "$SRC_DIR" ] && [ -d "$DEST_DIR" ]; then
      cp "$SRC_DIR/ic_launcher.png" "$DEST_DIR/ic_launcher.png" 2>/dev/null || true
      cp "$SRC_DIR/ic_launcher_round.png" "$DEST_DIR/ic_launcher_round.png" 2>/dev/null || true
      echo "  Copied $DENSITY icons"
    elif [ -d "$SRC_DIR" ]; then
      mkdir -p "$DEST_DIR"
      cp "$SRC_DIR/"*.png "$DEST_DIR/" 2>/dev/null || true
      echo "  Created and copied $DENSITY icons"
    fi
  done

  for DENSITY in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    SRC_FG="$ICON_SRC/mipmap-$DENSITY/ic_launcher_foreground.png"
    if [ -f "$SRC_FG" ]; then
      DEST_DIR="$RES_DIR/mipmap-$DENSITY"
      mkdir -p "$DEST_DIR"
      cp "$SRC_FG" "$DEST_DIR/ic_launcher_foreground.png"
    fi
  done
  echo "  Adaptive icon foregrounds copied"
fi

SPLASH_SRC="$PROJECT_DIR/resources/android/splash"
if [ -d "$RES_DIR" ] && [ -d "$SPLASH_SRC" ]; then
  echo "Step 5: Copying splash screen drawables..."
  DRAWABLE="$RES_DIR/drawable"
  mkdir -p "$DRAWABLE"
  if [ -f "$SPLASH_SRC/splash.png" ]; then
    cp "$SPLASH_SRC/splash.png" "$DRAWABLE/splash.png"
    echo "  Splash drawable copied"
  fi

  DRAWABLE_LAND="$RES_DIR/drawable-land-hdpi"
  mkdir -p "$DRAWABLE_LAND"
  if [ -f "$SPLASH_SRC/splash-hdpi.png" ]; then
    cp "$SPLASH_SRC/splash-hdpi.png" "$DRAWABLE_LAND/splash.png"
  fi

  for DENSITY_SUFFIX in hdpi xhdpi xxhdpi; do
    DRAWABLE_PORT="$RES_DIR/drawable-port-$DENSITY_SUFFIX"
    mkdir -p "$DRAWABLE_PORT"
    if [ -f "$SPLASH_SRC/splash-$DENSITY_SUFFIX.png" ]; then
      cp "$SPLASH_SRC/splash-$DENSITY_SUFFIX.png" "$DRAWABLE_PORT/splash.png"
      echo "  Splash $DENSITY_SUFFIX copied"
    fi
  done
fi

MANIFEST="$PROJECT_DIR/android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  echo "Step 6: Verifying AndroidManifest.xml permissions..."

  PERMISSIONS=(
    "android.permission.INTERNET"
    "android.permission.CAMERA"
    "android.permission.READ_EXTERNAL_STORAGE"
    "android.permission.WRITE_EXTERNAL_STORAGE"
    "com.android.vending.BILLING"
  )

  for PERM in "${PERMISSIONS[@]}"; do
    if grep -q "$PERM" "$MANIFEST"; then
      echo "  [OK] $PERM already declared"
    else
      sed_inplace "/<application/i\\    <uses-permission android:name=\"$PERM\" />" "$MANIFEST"
      echo "  [ADDED] $PERM"
    fi
  done
else
  echo "  WARNING: AndroidManifest.xml not found at $MANIFEST"
fi

echo ""
echo "=== Android Build Complete ==="
echo "Verification:"
[ -d "android/app" ] && echo "  [OK] android/app directory exists" || echo "  [FAIL] android/app directory missing"
[ -f "$MANIFEST" ] && echo "  [OK] AndroidManifest.xml exists" || echo "  [WARN] AndroidManifest.xml not found"
[ -f "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png" ] 2>/dev/null && echo "  [OK] xxxhdpi launcher icon present" || echo "  [WARN] xxxhdpi icon not copied"
[ -f "$RES_DIR/drawable/splash.png" ] 2>/dev/null && echo "  [OK] Splash drawable present" || echo "  [WARN] Splash drawable not copied"
if [ -f "$MANIFEST" ]; then
  MISSING=0
  for PERM in "INTERNET" "CAMERA" "READ_EXTERNAL_STORAGE" "WRITE_EXTERNAL_STORAGE" "BILLING"; do
    if ! grep -q "$PERM" "$MANIFEST"; then
      echo "  [WARN] Missing permission: $PERM"
      MISSING=1
    fi
  done
  [ $MISSING -eq 0 ] && echo "  [OK] All required permissions declared"
fi
[ -f "$ICON_SRC/playstore-icon.png" ] && echo "  [OK] Play Store icon (512x512) available at resources/android/icon/playstore-icon.png" || echo "  [WARN] Play Store icon not found"
echo ""
echo "Next steps:"
echo "  1. Open in Android Studio:  npx cap open android"
echo "  2. Configure signing (keystore) in Android Studio"
echo "  3. Register 'objectionready_annual' subscription in Google Play Console"
echo "  4. Build signed AAB:  Build > Generate Signed Bundle"
echo "  5. Upload AAB to Google Play Console for testing/release"
echo ""
