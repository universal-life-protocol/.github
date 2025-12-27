import type { VGEvent } from "../core/event";
import { buildTimeline } from "../recording/timeline";
import type { ProjectionContract } from "./contract";
import type { DerivedContract } from "./derived-contract";

export function runContract<TState, TArtifact>(
  contract: ProjectionContract<TState, TArtifact>,
  events: VGEvent[]
): TArtifact | null {
  const timeline = buildTimeline(events);
  const state = contract.init();
  timeline.forEach(({ evt, t }) => {
    contract.onEvent(state, evt, t);
  });
  return contract.finalize ? contract.finalize(state) : null;
}

export function runComposed<TInputState, TInputArtifact, TOutputState, TOutputArtifact>(
  base: ProjectionContract<TInputState, TInputArtifact>,
  derived: DerivedContract<TInputState, TInputArtifact, TOutputState, TOutputArtifact>,
  events: VGEvent[]
): TOutputArtifact | null {
  const timeline = buildTimeline(events);
  const baseState = base.init();
  timeline.forEach(({ evt, t }) => {
    base.onEvent(baseState, evt, t);
  });
  const baseArtifact = base.finalize ? base.finalize(baseState) : null;
  const derivedState = derived.init();
  derived.onArtifact(derivedState, {
    state: baseState,
    artifact: baseArtifact as TInputArtifact,
  });
  return derived.finalize ? derived.finalize(derivedState) : null;
}
