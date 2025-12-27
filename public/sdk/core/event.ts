export type VGSpace = "canvas" | "wiki" | "forum" | "scene" | string;

export interface VGEvent {
  id: string;
  ts: number;
  actor: string;
  type: string;
  space: VGSpace;
  payload: unknown;
  ephemeral?: boolean;
}
