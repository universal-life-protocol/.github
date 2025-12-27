function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

class OfflineAudioSink {
  constructor() {
    this.sampleRate = 44100;
    this.buffer = new Float32Array(0);
    this.tones = [];
  }

  init() {
    this.buffer = new Float32Array(0);
    this.tones = [];
  }

  onEvent(evt, t) {
    switch (evt.type) {
      case "node.add":
        this.tones.push({ start: t, freq: 440, duration: 0.12, amp: 0.6 });
        break;
      case "node.select":
        this.tones.push({ start: t, freq: 880, duration: 0.08, amp: 0.7 });
        break;
      case "edge.add":
        this.tones.push({ start: t, freq: 330, duration: 0.2, amp: 0.4 });
        this.tones.push({ start: t, freq: 440, duration: 0.2, amp: 0.4 });
        this.tones.push({ start: t, freq: 550, duration: 0.2, amp: 0.4 });
        break;
      case "edge.remove":
        this.addNoise(t, 0.12, 0.25, evt.id || "edge.remove");
        break;
      case "cursor.move":
        this.addNoise(t, 0.02, 0.05, evt.id || "cursor.move");
        break;
      case "scene.transform":
        this.tones.push({ start: t, freq: 260, duration: 0.25, amp: 0.35 });
        this.tones.push({ start: t + 0.12, freq: 310, duration: 0.25, amp: 0.35 });
        break;
      default:
        break;
    }
  }

  render(duration) {
    const total = Math.max(0, Math.ceil(duration * this.sampleRate));
    if (this.buffer.length < total) {
      this.buffer = new Float32Array(total);
    }
    this.tones.forEach((tone) => {
      this.pluck(tone.start, tone.freq, tone.duration, tone.amp);
    });
    return this.buffer;
  }

  pluck(startSec, freq, duration, amp) {
    const start = Math.max(0, Math.floor(startSec * this.sampleRate));
    const length = Math.floor(duration * this.sampleRate);
    const end = Math.min(this.buffer.length, start + length);
    for (let i = start; i < end; i += 1) {
      const t = (i - start) / this.sampleRate;
      const env = Math.exp(-6 * t / duration);
      this.buffer[i] += Math.sin(2 * Math.PI * freq * t) * amp * env;
    }
  }

  addNoise(startSec, duration, amp, seedText) {
    const start = Math.max(0, Math.floor(startSec * this.sampleRate));
    const length = Math.floor(duration * this.sampleRate);
    const end = Math.min(this.buffer.length, start + length);
    let seed = hashString(seedText);
    for (let i = start; i < end; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const noise = ((seed / 0xffffffff) * 2 - 1) * amp;
      this.buffer[i] += noise;
    }
  }
}

module.exports = { OfflineAudioSink };
