# Security Notes

## Invariants

- Events are append-only.
- Projections are deterministic.
- Transport is not truth.

## Operational boundaries

- Services run as user-level units.
- No privileged operations are required for rendering.
- VNC is deprecated and not part of the production suite.

## Public exposure

- Use HTTPS for browser features (WebRTC, clipboard, workers).
- Keep broker and wiki read-only for public demos if needed.
- Ensure firewall rules only expose intended ports.
