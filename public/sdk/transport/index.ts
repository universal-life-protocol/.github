import type { VGEvent } from "../core/event";
import type { Transport, TransportStatus } from "./transport.interface";

export type TransportName = "webrtc" | "mqtt" | "ws" | "dial" | "qr" | "link";

export interface ConnectableTransport extends Transport {
  connect?: () => Promise<void> | void;
}

export interface TransportManager {
  active: TransportName | "none";
  status: TransportStatus;
  connect(): Promise<void>;
  send(evt: VGEvent): void;
  on(handler: (evt: VGEvent) => void): void;
  close(): void;
}

export function createFallbackManager(transports: ConnectableTransport[]): TransportManager {
  const handlers = new Set<(evt: VGEvent) => void>();
  let active: TransportName | "none" = "none";
  let status: TransportStatus = "connecting";

  transports.forEach((transport) => transport.on((evt) => handlers.forEach((h) => h(evt))));

  async function connect() {
    for (const transport of transports) {
      try {
        if (transport.connect) await transport.connect();
        if (transport.status() !== "failed") {
          active = transport.name as TransportName;
          status = "open";
          return;
        }
      } catch {
        continue;
      }
    }
    status = "failed";
    active = "none";
  }

  function send(evt: VGEvent) {
    const activeTransport = transports.find((t) => t.name === active);
    if (activeTransport) activeTransport.send(evt);
  }

  function on(handler: (evt: VGEvent) => void) {
    handlers.add(handler);
  }

  function close() {
    transports.forEach((t) => t.close());
  }

  return {
    active,
    status,
    connect,
    send,
    on,
    close,
  };
}
