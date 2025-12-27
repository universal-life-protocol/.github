import type { Projection } from "./projection.interface";
import type { VGEvent } from "../core/event";

export class WikiProjection implements Projection {
  space = "wiki";

  apply(_evt: VGEvent): void {
    // stub
  }

  render(_target: HTMLElement): void {
    // stub
  }

  reset(): void {
    // stub
  }
}
