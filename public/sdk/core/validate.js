export function validateEvent(evt) {
  if (!evt) return false;
  return (
    typeof evt.id === "string" && evt.id.length > 0 &&
    typeof evt.ts === "number" &&
    typeof evt.actor === "string" && evt.actor.length > 0 &&
    typeof evt.type === "string" && evt.type.length > 0 &&
    typeof evt.space === "string" && evt.space.length > 0 &&
    evt.payload !== undefined
  );
}
