import fs from "fs";
import path from "path";
import { validateEvent } from "../core/validate";
import type { VGEvent } from "../core/event";
import type { Transport, TransportStatus } from "../transport/transport.interface";
import { createFallbackManager } from "../transport/index";

class JsonlTransport implements Transport {
  name = "link" as const;
  private handlers = new Set<(evt: VGEvent) => void>();
  private state: TransportStatus = "open";

  status(): TransportStatus {
    return this.state;
  }

  send(evt: VGEvent): void {
    this.handlers.forEach((h) => h(evt));
  }

  on(handler: (evt: VGEvent) => void): void {
    this.handlers.add(handler);
  }

  close(): void {
    this.state = "failed";
  }
}

const dataPath = path.join(__dirname, "..", "..", "data", "events.jsonl");
const transport = new JsonlTransport();
const manager = createFallbackManager([transport]);

let count = 0;
manager.on((evt) => {
  if (validateEvent(evt)) count += 1;
});

const lines = fs.existsSync(dataPath)
  ? fs.readFileSync(dataPath, "utf8").split(/\r?\n/).filter(Boolean)
  : [];

lines.forEach((line) => {
  try {
    const evt = JSON.parse(line) as VGEvent;
    manager.send(evt);
  } catch {
    // ignore
  }
});

process.stdout.write(`headless demo: valid events=${count}\n`);
