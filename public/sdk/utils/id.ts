export function makeEventId(prefix = "evt") {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(16).slice(2, 8);
  return `${prefix}-${now}-${rand}`;
}
