import { createTransport } from "../../sdk/transport/fallback.js";
import { validateEvent } from "../../sdk/core/validate.js";

export function createSession(config = {}) {
  const transport = createTransport(config.transport || {});
  const handlers = new Set();

  transport.on((evt) => handlers.forEach((h) => h(evt)));

  return {
    connect: () => transport.connect(),
    on: (handler) => handlers.add(handler),
    send: (evt) => {
      if (!validateEvent(evt)) {
        throw new Error("invalid event");
      }
      return transport.send(evt);
    },
    get transportKind() {
      return transport.kind;
    },
    get transport() {
      return transport;
    },
  };
}
