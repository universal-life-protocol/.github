#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://tetragrammatron-os.com/releases"
ARCHIVE="tetragrammatron.tar.gz"
SHA_FILE="tetragrammatron.tar.gz.sha256"
INSTALL_DIR="${TETRA_INSTALL_DIR:-$HOME/tetragrammatron}"

mkdir -p "$INSTALL_DIR"

workdir=$(mktemp -d)
cleanup() { rm -rf "$workdir"; }
trap cleanup EXIT

curl -fsSL "$BASE_URL/$ARCHIVE" -o "$workdir/$ARCHIVE"
curl -fsSL "$BASE_URL/$SHA_FILE" -o "$workdir/$SHA_FILE"

( cd "$workdir" && sha256sum -c "$SHA_FILE" )

rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"

tar -xzf "$workdir/$ARCHIVE" -C "$workdir"
mv "$workdir/tetragrammatron" "$INSTALL_DIR"

printf '\nInstalled to %s\n' "$INSTALL_DIR"
printf 'Running first-run to enable services...\n'
if [ -x "$INSTALL_DIR/first-run.sh" ]; then
  "$INSTALL_DIR/first-run.sh" || true
else
  printf 'First-run script missing. Enable services manually from %s/systemd\n' "$INSTALL_DIR"
fi
