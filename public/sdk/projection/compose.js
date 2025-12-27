const { buildTimeline } = require("../recording/timeline");

function runContract(contract, events) {
  const timeline = buildTimeline(events);
  const state = contract.init();
  timeline.forEach(({ evt, t }) => {
    contract.onEvent(state, evt, t);
  });
  return contract.finalize ? contract.finalize(state) : null;
}

function runComposed(base, derived, events) {
  const timeline = buildTimeline(events);
  const baseState = base.init();
  timeline.forEach(({ evt, t }) => {
    base.onEvent(baseState, evt, t);
  });
  const baseArtifact = base.finalize ? base.finalize(baseState) : null;
  const derivedState = derived.init();
  derived.onArtifact(derivedState, {
    state: baseState,
    artifact: baseArtifact,
  });
  return derived.finalize ? derived.finalize(derivedState) : null;
}

module.exports = { runContract, runComposed };
