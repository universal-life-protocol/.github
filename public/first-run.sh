#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SYSTEMD_DIR="$ROOT_DIR/systemd"
USER_SYSTEMD="$HOME/.config/systemd/user"

mkdir -p "$USER_SYSTEMD"

cp "$SYSTEMD_DIR"/*.service "$USER_SYSTEMD"/
cp "$SYSTEMD_DIR"/*.timer "$USER_SYSTEMD"/

systemctl --user daemon-reexec
systemctl --user enable --now virtual-revelation-ws.service
systemctl --user enable --now virtual-revelation-render.timer
systemctl --user enable --now virtual-revelation-svg-export.timer
systemctl --user enable --now virtual-revelation-world-pack.timer

echo "First-run complete. Services enabled (VNC excluded)."
