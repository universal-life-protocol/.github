import { buildTimeline } from "/sdk/recording/timeline.js";

export function runContractBrowser(contract, events) {
  const timeline = buildTimeline(events);
  const state = contract.init();
  for (const { evt, t } of timeline) {
    contract.onEvent(state, evt, t);
  }
  return contract.finalize ? contract.finalize(state) : null;
}
