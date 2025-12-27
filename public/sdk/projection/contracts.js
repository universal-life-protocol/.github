const { renderSvg } = require("./svg");
const { svgToGltf } = require("./svg-gltf");
const { simulatePhysics } = require("./physics");
const { OfflineAudioSink } = require("../recording/sinks/audio");

function createSvgContract() {
  return {
    name: "svg",
    init: () => ({ events: [] }),
    onEvent: (state, evt) => {
      state.events.push(evt);
    },
    finalize: (state) => renderSvg(state.events, { animate: false }),
  };
}

function createGltfContract() {
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

function createPhysicsContract() {
  return {
    name: "physics",
    init: () => ({ events: [] }),
    onEvent: (state, evt) => {
      state.events.push(evt);
    },
    finalize: (state) => simulatePhysics(state.events),
  };
}

function createAudioContract(sampleRate = 44100, stepMs = 50, maxDurationSec = 120) {
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

function createPhysicsSvgContract() {
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

function createSvgGltfContract() {
  return {
    name: "svg-gltf",
    init: () => ({ gltf: null }),
    onArtifact: (state, { artifact }) => {
      state.gltf = svgToGltf(artifact);
    },
    finalize: (state) => state.gltf,
  };
}

function createPhysicsAudioContract(sampleRate = 44100) {
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

function getContract(name, options = {}) {
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

module.exports = {
  createSvgContract,
  createGltfContract,
  createPhysicsContract,
  createAudioContract,
  createPhysicsSvgContract,
  createSvgGltfContract,
  createPhysicsAudioContract,
  getContract,
};
