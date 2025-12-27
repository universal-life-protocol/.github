# Virtual Revelation SDK (v0.1.0)

Formerly: Virtual-Graph SDK.

## What this is

Virtual Revelation is a deterministic projection SDK. It compiles an append-only
event log into pure artifacts (SVG, GLTF, physics JSON, audio WAV). Outputs are
replayable, headless, and environment-agnostic.

## Core idea

Events are truth. Projections are views.

## Projection contract

```ts
interface ProjectionContract<TState, TArtifact> {
  name: string;
  init(): TState;
  onEvent(state: TState, evt: VGEvent, t: number): void;
  finalize?(state: TState): TArtifact;
}
```

## Running a contract

```ts
const contract = createSvgContract();
const artifact = runContract(contract, events);
```

The same code runs in Node, the browser, or a worker.

## Composition

Projections can be chained via derived contracts:

```
events → physics → svg → gltf
```

Derived contracts consume artifacts, not events.

## World pack

`world-pack.json` declares deterministic outputs:

```json
{
  "input": "data/events.jsonl",
  "outputs": [
    { "contract": "svg", "out": "world.svg" },
    { "contract": "gltf", "out": "world.gltf" }
  ]
}
```

Run with `node tools/run-world-pack.js`.

## What this is not

- Not a game engine
- Not a UI framework
- Not reactive state

It is a projection compiler.
