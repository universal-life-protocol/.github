# Tetragrammatron Production Suite

This is the public-facing, onboarding-ready bundle for Virtual Revelation and the Tetragrammatron stack.

## Layout

```
/home/main/tetragrammatron/
  core/         -> symlinks to system components
  public/       -> public web root
  docs/         -> onboarding + operations
  systemd/      -> portable user-unit templates
  tools/        -> helper scripts
```

## Public entry points

- `/` → landing page
- `/broker/` → projection broker
- `/canvas/` → shared canvas
- `/wiki/` → append-only knowledge
- `/forum/` → threads
- `/scene/` → 3D projection surface
- `/graph/` → graph index
- `/world/` → generated artifacts

## Core components (symlinked)

- `core/tetragrammatron-os`
- `core/genesis-protocol`
- `core/atom`
- `core/virtual-revelation`
- `core/extensions`

## First-time setup

1. Read `/home/main/tetragrammatron/docs/onboarding.md`.
2. Enable user services from `/home/main/tetragrammatron/systemd/`.
3. Point nginx/Caddy to `/home/main/tetragrammatron/public`.

## Portable install (curl)

```bash
curl -fsSL https://tetragrammatron-os.com/install.sh | bash
```

## Notes

- This suite keeps the existing dev/test environment intact.
- VNC is deprecated and not part of production.
- All projections compile from append-only events.
