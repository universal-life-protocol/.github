import type { VGEvent } from "../core/event";

export interface Projection {
  space: string;
  apply(evt: VGEvent): void;
  render(target: HTMLElement): void;
  reset(): void;
}
