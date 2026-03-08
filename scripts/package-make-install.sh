#!/usr/bin/env bash

set -euo pipefail

APP_NAME="${APP_NAME:-VoiceFlow}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="/Applications"
INSTALL_PATH="${INSTALL_DIR}/${APP_NAME}.app"

MOUNT_POINT=""

cleanup() {
  if [[ -n "${MOUNT_POINT}" && -d "${MOUNT_POINT}" ]]; then
    hdiutil detach "${MOUNT_POINT}" -quiet || true
  fi
}
trap cleanup EXIT

run_with_sudo_if_needed() {
  if [[ -w "${INSTALL_DIR}" ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

echo "==> Building packaged app"
cd "${ROOT_DIR}"
npm run package

echo "==> Creating distributables (including DMG)"
npm run make

echo "==> Locating latest DMG"
declare -a dmgs=()
while IFS= read -r -d '' file; do
  dmgs+=("$file")
done < <(find "${ROOT_DIR}/out/make" -type f -name "*.dmg" -print0)

if [[ ${#dmgs[@]} -eq 0 ]]; then
  echo "No DMG found under out/make"
  exit 1
fi

LATEST_DMG="$(ls -t "${dmgs[@]}" | head -n 1)"
echo "Using DMG: ${LATEST_DMG}"

echo "==> Mounting DMG"
ATTACH_OUTPUT="$(hdiutil attach "${LATEST_DMG}" -nobrowse -noautoopen)"
MOUNT_POINT="$(echo "${ATTACH_OUTPUT}" | awk '/\/Volumes\// { for (i = 1; i <= NF; i++) if ($i ~ /^\/Volumes\//) { print $i; exit } }')"

if [[ -z "${MOUNT_POINT}" || ! -d "${MOUNT_POINT}" ]]; then
  echo "Failed to determine DMG mount point"
  exit 1
fi

APP_BUNDLE="$(find "${MOUNT_POINT}" -maxdepth 2 -type d -name "${APP_NAME}.app" -print -quit)"
if [[ -z "${APP_BUNDLE}" ]]; then
  echo "Could not find ${APP_NAME}.app inside mounted DMG"
  exit 1
fi

echo "==> Quitting running app instance (if any)"
osascript -e "tell application \"${APP_NAME}\" to quit" >/dev/null 2>&1 || true
sleep 1
pkill -x "${APP_NAME}" >/dev/null 2>&1 || true

echo "==> Installing ${APP_NAME}.app to ${INSTALL_DIR}"
run_with_sudo_if_needed rm -rf "${INSTALL_PATH}"
run_with_sudo_if_needed ditto "${APP_BUNDLE}" "${INSTALL_PATH}"

echo "==> Installed: ${INSTALL_PATH}"
echo "Done."
