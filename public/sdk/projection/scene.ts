import type { Projection } from "./projection.interface";
import type { VGEvent } from "../core/event";

export class SceneProjection implements Projection {
  space = "scene";

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
