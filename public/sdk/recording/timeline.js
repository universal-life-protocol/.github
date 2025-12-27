function normalizeTs(ts) {
  if (ts > 1e12) return ts / 1000;
  return ts;
}

function buildTimeline(events, options = {}) {
  const stepMs = options.stepMs ?? 50;
  let baseTs;
  for (const evt of events) {
    if (typeof evt.ts === "number") {
      baseTs = normalizeTs(evt.ts);
      break;
    }
  }
  return events.map((evt, index) => {
    if (baseTs !== undefined && typeof evt.ts === "number") {
      const ts = normalizeTs(evt.ts);
      return { evt, t: Math.max(0, ts - baseTs) };
    }
    return { evt, t: (index * stepMs) / 1000 };
  });
}

module.exports = { buildTimeline };
