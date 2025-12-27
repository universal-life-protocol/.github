import type { Transport, TransportStatus } from "./transport.interface";
import type { VGEvent } from "../core/event";

export class QrTransport implements Transport {
  name = "qr";
  private state: TransportStatus = "connecting";
  private handlers = new Set<(evt: VGEvent) => void>();

  status(): TransportStatus {
    return this.state;
  }

  send(_evt: VGEvent): void {
    // stub
  }

  on(handler: (evt: VGEvent) => void): void {
    this.handlers.add(handler);
  }

  close(): void {
    this.state = "failed";
  }
}
