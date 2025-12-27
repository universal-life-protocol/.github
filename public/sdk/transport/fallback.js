// Deprecated: browser-only fallback. Prefer sdk/transport/index.ts in new code.
const DEFAULT_CONFIG = {
  wsUrl: null,
  mqttUrl: null,
  rtcChannel: "vg-auto",
  rtcManual: true,
  mqttTopic: "virtual-revelation/events",
  rtcIceServers: [],
  autoTimeoutMs: 1500,
  mqttScript: "/assets/mqtt.min.js",
};

export function createTransport(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const handlers = new Set();
  let kind = "none";
  let sendFn = () => false;
  let closeFn = () => {};
  let manual = null;

  function emit(evt) {
    handlers.forEach((h) => h(evt));
  }

  function on(handler) {
    handlers.add(handler);
    return () => handlers.delete(handler);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("script load failed"));
      document.head.appendChild(script);
    });
  }

  async function tryWebSocket() {
    const url = cfg.wsUrl || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      const timer = setTimeout(() => {
        socket.close();
        reject(new Error("ws timeout"));
      }, cfg.autoTimeoutMs);
      socket.onopen = () => {
        clearTimeout(timer);
        kind = "ws";
        sendFn = (evt) => {
          socket.send(JSON.stringify(evt));
          return true;
        };
        socket.onmessage = (msg) => {
          try {
            emit(JSON.parse(msg.data));
          } catch {
            // ignore
          }
        };
        closeFn = () => socket.close();
        resolve();
      };
      socket.onerror = () => {
        clearTimeout(timer);
        reject(new Error("ws error"));
      };
    });
  }

  async function tryMqtt() {
    if (!window.mqtt) throw new Error("mqtt lib missing");
    const url = cfg.mqttUrl || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/mqtt`;
    return new Promise((resolve, reject) => {
      const client = window.mqtt.connect(url);
      const timer = setTimeout(() => {
        client.end(true);
        reject(new Error("mqtt timeout"));
      }, cfg.autoTimeoutMs);
      client.on("connect", () => {
        clearTimeout(timer);
        kind = "mqtt";
        client.subscribe(cfg.mqttTopic);
        client.on("message", (_topic, payload) => {
          try {
            emit(JSON.parse(payload.toString()));
          } catch {
            // ignore
          }
        });
        sendFn = (evt) => {
          client.publish(cfg.mqttTopic, JSON.stringify(evt));
          return true;
        };
        closeFn = () => client.end(true);
        resolve();
      });
      client.on("error", () => {
        clearTimeout(timer);
        reject(new Error("mqtt error"));
      });
    });
  }

  function createPeerConnection() {
    return new RTCPeerConnection({ iceServers: cfg.rtcIceServers });
  }

  async function tryWebRtcAuto() {
    if (!window.RTCPeerConnection || !window.BroadcastChannel) {
      throw new Error("webrtc unsupported");
    }
    const channel = new BroadcastChannel(cfg.rtcChannel);
    const pc = createPeerConnection();
    const dc = pc.createDataChannel("events");
    let resolved = false;

    function cleanup() {
      channel.close();
      if (pc) pc.close();
    }

    const ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!resolved) {
          cleanup();
          reject(new Error("webrtc timeout"));
        }
      }, cfg.autoTimeoutMs);

      dc.onopen = () => {
        clearTimeout(timer);
        resolved = true;
        kind = "webrtc";
        sendFn = (evt) => {
          dc.send(JSON.stringify(evt));
          return true;
        };
        dc.onmessage = (msg) => {
          try {
            emit(JSON.parse(msg.data));
          } catch {
            // ignore
          }
        };
        closeFn = () => cleanup();
        resolve();
      };
    });

    channel.onmessage = async (event) => {
      const msg = event.data || {};
      if (msg.type === "offer") {
        await pc.setRemoteDescription(msg.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.postMessage({ type: "answer", answer });
      } else if (msg.type === "answer") {
        await pc.setRemoteDescription(msg.answer);
      } else if (msg.type === "ice") {
        try {
          await pc.addIceCandidate(msg.candidate);
        } catch {
          // ignore
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
        channel.postMessage({ type: "ice", candidate });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    channel.postMessage({ type: "offer", offer });

    return ready;
  }

  function setupManualWebRtc() {
    if (!window.RTCPeerConnection) return null;
    const pc = createPeerConnection();
    let dc;
    const manualState = {
      offer: "",
      answer: "",
      status: "idle",
      createOffer: async () => {
        dc = pc.createDataChannel("events");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        manualState.offer = JSON.stringify(offer);
        manualState.status = "offer-created";
        return manualState.offer;
      },
      acceptOffer: async (offerText) => {
        await pc.setRemoteDescription(JSON.parse(offerText));
        dc = pc.createDataChannel("events");
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        manualState.answer = JSON.stringify(answer);
        manualState.status = "answer-created";
        return manualState.answer;
      },
      acceptAnswer: async (answerText) => {
        await pc.setRemoteDescription(JSON.parse(answerText));
        manualState.status = "connected";
      },
      onOpen: (handler) => {
        if (!dc) return;
        dc.onopen = handler;
      },
      onMessage: (handler) => {
        if (!dc) return;
        dc.onmessage = handler;
      },
    };
    return manualState;
  }

  async function connect() {
    try {
      await tryWebRtcAuto();
      return;
    } catch {
      // next
    }
    try {
      try {
        await tryMqtt();
        return;
      } catch (err) {
        if (location.protocol !== "file:" && cfg.mqttScript) {
          await loadScript(cfg.mqttScript);
          await tryMqtt();
          return;
        }
        throw err;
      }
      return;
    } catch {
      // next
    }
    try {
      await tryWebSocket();
      return;
    } catch {
      // next
    }
    manual = setupManualWebRtc();
    kind = manual ? "webrtc-dial" : "link";
  }

  return {
    connect,
    on,
    send: (evt) => sendFn(evt),
    close: () => closeFn(),
    get kind() {
      return kind;
    },
    get manual() {
      return manual;
    },
  };
}
