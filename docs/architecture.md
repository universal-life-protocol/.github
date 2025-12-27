# Architecture Overview

Virtual Revelation compiles a single append-only event log into multiple projections.

## Core flow

```
Events → Timeline → Projection Contracts → Artifacts / Views
```

## Surfaces

- Canvas: spatial exploration
- Wiki: append-only knowledge surface
- Forum: threaded discussion
- Scene: GLTF-capable projection surface

## Contracts

Contracts are deterministic projections that consume events and emit artifacts. Derived contracts consume artifacts instead of events.

## Transport

Transport is replaceable and never defines truth. WebRTC → MQTT → WebSocket → Dial → QR → Link.
