#!/bin/bash
# Compila el APK firmado: tools/apk.sh [salida.apk]
set -e
cd "$(dirname "$0")/.."
OUT=${1:-/workspace/pp_gb/out/Pasapalabra3D-1.2-gb.apk}
KS=/cursor/stores/store-b6a3ca2b-7c3b-4225-8f28-1a7e8cfa3201/keystores
npx esbuild src/main.js --bundle --format=iife --minify --outfile=js/app.js
W=android/app/src/main/assets/www; rm -rf "$W"; mkdir -p "$W"
cp -r data icon-192.png icon-512.png index.html js manifest.webmanifest menu.css style.css sw.js version.json voz t5 "$W"/
mkdir -p android/keystore && cp "$KS/ikeriano-2026.jks" "$KS/keystore.properties" android/keystore/
(cd android && ./gradlew --no-daemon -q assembleRelease)
mkdir -p "$(dirname "$OUT")"; cp android/app/build/outputs/apk/release/app-release.apk "$OUT"
BT=$(ls -d ~/android-sdk/build-tools/* | sort -V | tail -1)
"$BT/apksigner" verify --print-certs "$OUT" | grep -E "SHA-256|DN"
"$BT/aapt2" dump badging "$OUT" | head -1
sha256sum "$OUT"
