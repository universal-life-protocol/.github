export interface DerivedContract<TInputState, TInputArtifact, TOutputState, TOutputArtifact> {
  name: string;
  init(): TOutputState;
  onArtifact(state: TOutputState, input: { state: TInputState; artifact: TInputArtifact }): void;
  finalize?(state: TOutputState): TOutputArtifact;
}
