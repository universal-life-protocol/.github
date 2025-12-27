import type { VGEvent } from "../core/event";

export class IndexedDbStore {
  append(_evt: VGEvent): void {
    // stub
  }

  async all(): Promise<VGEvent[]> {
    return [];
  }
}
