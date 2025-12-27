import type { Projection } from "./projection.interface";
import type { VGEvent } from "../core/event";

export class ForumProjection implements Projection {
  space = "forum";

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
