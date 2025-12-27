import type { VGEvent } from "./event";
import { EVENT_REQUIRED_FIELDS } from "./schema";

export function validateEvent(evt: Partial<VGEvent>): evt is VGEvent {
  return EVENT_REQUIRED_FIELDS.every((field) => {
    const value = evt[field];
    return value !== undefined && value !== null && value !== "";
  });
}
