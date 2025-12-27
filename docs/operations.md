# Operations

## Services (user-level)

These are staged in `/home/main/tetragrammatron/systemd/` and can be copied into `~/.config/systemd/user/`.

- `virtual-revelation-ws.service` (WebSocket relay)
- `virtual-revelation-render.timer` (graph render refresh)
- `virtual-revelation-svg-export.timer` (SVG export)
- `virtual-revelation-world-pack.timer` (artifact pack)

## Enable (operator)

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

## Disable

```bash
systemctl --user disable --now virtual-revelation-render.timer
systemctl --user disable --now virtual-revelation-svg-export.timer
systemctl --user disable --now virtual-revelation-world-pack.timer
systemctl --user disable --now virtual-revelation-ws.service
```

## Logs

```bash
journalctl --user -u virtual-revelation-ws.service
journalctl --user -u virtual-revelation-render.service
```
