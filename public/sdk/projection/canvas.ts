import type { Projection } from "./projection.interface";
import type { VGEvent } from "../core/event";

export class CanvasProjection implements Projection {
  space = "canvas";

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
