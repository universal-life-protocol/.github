import type { VGEvent } from "./event";

export const EVENT_REQUIRED_FIELDS: Array<keyof VGEvent> = [
  "id",
  "ts",
  "actor",
  "type",
  "space",
  "payload",
];
