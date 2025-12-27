import type { VGEvent } from "../core/event";
import type { ProjectionContract } from "./contract";
import { renderSvg } from "./svg";
import { svgToGltf } from "./svg-gltf";
import { simulatePhysics } from "./physics";
import { OfflineAudioSink } from "../recording/sinks/audio";
import type { PhysicsState } from "./physics";
import type { DerivedContract } from "./derived-contract";

export type ContractName = "svg" | "gltf" | "physics" | "audio";

export function createSvgContract(): ProjectionContract<{ events: VGEvent[] }, string> {
  return {
    name: "svg",
    init: () => ({ events: [] }),
    onEvent: (state, evt) => {
      state.events.push(evt);
    },
    finalize: (state) => renderSvg(state.events, { animate: false }),
  };
}

export function createGltfContract(): ProjectionContract<{ events: VGEvent[] }, unknown> {
  return {
    name: "gltf",
    init: () => ({ events: [] }),
    onEvent: (state, evt) => {
      state.events.push(evt);
    },
    finalize: (state) => {
      const svg = renderSvg(state.events, { animate: false });
      return svgToGltf(svg);
    },
  };
}

export function createPhysicsContract(): ProjectionContract<{ events: VGEvent[] }, unknown> {
  return {
    name: "physics",
    init: () => ({ events: [] }),
    onEvent: (state, evt) => {
      state.events.push(evt);
    },
    finalize: (state) => simulatePhysics(state.events),
  };
}

export function createAudioContract(
  sampleRate = 44100,
  stepMs = 50,
  maxDurationSec = 120
): ProjectionContract<{ sink: OfflineAudioSink; maxTime: number; count: number }, Float32Array> {
  return {
    name: "audio",
    init: () => {
      const sink = new OfflineAudioSink();
      sink.sampleRate = sampleRate;
      sink.init();
      return { sink, maxTime: 0, count: 0 };
    },
    onEvent: (state, evt, t) => {
      const localT = (state.count * stepMs) / 1000;
      state.sink.onEvent(evt, localT);
      if (localT > state.maxTime) state.maxTime = localT;
      state.count += 1;
    },
    finalize: (state) => {
      const duration = Math.min(state.maxTime + 0.6, maxDurationSec);
      return state.sink.render(duration);
    },
  };
}

export function createPhysicsSvgContract(): DerivedContract<PhysicsState, PhysicsState, { svg: string }, string> {
  return {
    name: "physics-svg",
    init: () => ({ svg: "" }),
    onArtifact: (state, { artifact }) => {
      const events = artifact.particles.map((p) => ({
        id: `evt-physics-${p.id}`,
        ts: 0,
        actor: "system",
        type: "node.add",
        space: "canvas",
        payload: { id: p.id, x: p.x, y: p.y },
      }));
      state.svg = renderSvg(events, { animate: false });
    },
    finalize: (state) => state.svg,
  };
}

export function createSvgGltfContract(): DerivedContract<{ events: VGEvent[] }, string, { gltf: unknown }, unknown> {
  return {
    name: "svg-gltf",
    init: () => ({ gltf: null }),
    onArtifact: (state, { artifact }) => {
      state.gltf = svgToGltf(artifact);
    },
    finalize: (state) => state.gltf,
  };
}

export function createPhysicsAudioContract(sampleRate = 44100): DerivedContract<PhysicsState, PhysicsState, { buffer: Float32Array }, Float32Array> {
  return {
    name: "physics-audio",
    init: () => ({ buffer: new Float32Array(0) }),
    onArtifact: (state, { artifact }) => {
      const sink = new OfflineAudioSink();
      sink.sampleRate = sampleRate;
      sink.init();
      const baseTime = 0;
      artifact.particles.forEach((p, index) => {
        sink.onEvent({
          id: `evt-phys-audio-${p.id}`,
          ts: baseTime,
          actor: "system",
          type: "node.add",
          space: "canvas",
          payload: { id: p.id, x: p.x, y: p.y },
        }, index * 0.05);
      });
      state.buffer = sink.render(Math.max(1, artifact.particles.length * 0.05 + 0.6));
    },
    finalize: (state) => state.buffer,
  };
}

export function getContract(
  name: ContractName,
  options: { sampleRate?: number; stepMs?: number; maxDurationSec?: number } = {}
): ProjectionContract<any, any> {
  switch (name) {
    case "svg":
      return createSvgContract();
    case "gltf":
      return createGltfContract();
    case "physics":
      return createPhysicsContract();
    case "audio":
      return createAudioContract(options.sampleRate, options.stepMs, options.maxDurationSec);
    default:
      return createSvgContract();
  }
}
