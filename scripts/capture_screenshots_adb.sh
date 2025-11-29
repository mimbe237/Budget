#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname $0)/.." && pwd)"
OUT_DIR="$ROOT_DIR/playstore-assets/screenshots"
mkdir -p "$OUT_DIR"

# Config: emulator AVD names (adjust to your installed AVDs)
AVDS=(
  "Pixel_5_API_34"
  "Nexus_7_API_30"
  "Pixel_C_API_30"
)

function wait_for_device() {
  adb wait-for-device
  # Ensure device is online and boot completed
  adb shell getprop sys.boot_completed | grep -m 1 1
}

function start_emulator() {
  local avd_name="$1"
  echo "Starting emulator: $avd_name"
  ($ANDROID_HOME/emulator/emulator -avd "$avd_name" -netdelay none -netspeed full -no-boot-anim >/dev/null 2>&1 &) || true
  sleep 5
  wait_for_device
}

function stop_emulator() {
  adb emu kill || true
}

function capture() {
  local name="$1"
  local outfile="$OUT_DIR/${name}.png"
  echo "Capturing: $outfile"
  adb exec-out screencap -p > "$outfile"
}

function run_integration_and_capture() {
  echo "Running integration test to navigate UI"
  (cd "$ROOT_DIR" && flutter test integration_test/screenshot_test.dart || true)
  # Capture after test navigation
  capture "01_auth_login"
  capture "02_auth_signup"
  capture "03_dashboard"
  capture "04_transactions_list"
  capture "05_transaction_form"
  capture "06_budget_planner"
  capture "07_goals"
  capture "08_iou"
  capture "09_settings"
}

# Ensure deps
(cd "$ROOT_DIR" && flutter pub get)

for avd in ${AVDS[@]}; do
  start_emulator "$avd"
  run_integration_and_capture
  stop_emulator
  sleep 3
done

echo "Screenshots saved to: $OUT_DIR"
