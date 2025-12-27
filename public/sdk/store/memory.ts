import type { VGEvent } from "../core/event";

export class MemoryStore {
  private events: VGEvent[] = [];

  append(evt: VGEvent): void {
    this.events.push(evt);
  }

  all(): VGEvent[] {
    return [...this.events];
  }
}
