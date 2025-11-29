#!/usr/bin/env zsh
set -euo pipefail

cd "$(dirname $0)/.."

# Ensure dependencies
flutter pub get

# Run screenshots tool
# This will start emulators, run tests, and place images under staging directory
screenshots -v
