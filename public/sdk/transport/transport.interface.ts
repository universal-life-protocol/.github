import type { VGEvent } from "../core/event";

export type TransportStatus = "connecting" | "open" | "failed";

export interface Transport {
  name: string;
  status(): TransportStatus;
  send(evt: VGEvent): void;
  on(handler: (evt: VGEvent) => void): void;
  close(): void;
}
