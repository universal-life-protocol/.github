import type { VGEvent } from "../core/event";

export type TimelineOptions = {
  stepMs?: number;
};

export type TimedEvent = {
  evt: VGEvent;
  t: number;
};

function normalizeTs(ts: number): number {
  if (ts > 1e12) return ts / 1000;
  return ts;
}

export function buildTimeline(events: VGEvent[], options: TimelineOptions = {}): TimedEvent[] {
  const stepMs = options.stepMs ?? 50;
  let baseTs: number | undefined;
  for (const evt of events) {
    if (typeof (evt as any).ts === "number") {
      baseTs = normalizeTs((evt as any).ts);
      break;
    }
  }
  return events.map((evt, index) => {
    if (baseTs !== undefined && typeof (evt as any).ts === "number") {
      const ts = normalizeTs((evt as any).ts);
      return { evt, t: Math.max(0, ts - baseTs) };
    }
    return { evt, t: (index * stepMs) / 1000 };
  });
}
