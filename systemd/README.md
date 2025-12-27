# Systemd Templates (Production Suite)

These user-level unit files target `/home/main/tetragrammatron` and use `TETRA_ROOT` for portability.

## Enable

```bash
mkdir -p ~/.config/systemd/user
cp /home/main/tetragrammatron/systemd/*.service ~/.config/systemd/user/
cp /home/main/tetragrammatron/systemd/*.timer ~/.config/systemd/user/

systemctl --user daemon-reexec
systemctl --user enable --now virtual-revelation-ws.service
systemctl --user enable --now virtual-revelation-render.timer
systemctl --user enable --now virtual-revelation-svg-export.timer
systemctl --user enable --now virtual-revelation-world-pack.timer
```

## Notes

- VNC is deprecated and intentionally absent here.
- Override the root with `TETRA_ROOT=/path/to/tetragrammatron` if needed.
