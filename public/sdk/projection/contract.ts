import type { VGEvent } from "../core/event";

export interface ProjectionContract<TState, TArtifact = unknown> {
  name: string;
  init(): TState;
  onEvent(state: TState, evt: VGEvent, t: number): void;
  finalize?(state: TState): TArtifact;
}
