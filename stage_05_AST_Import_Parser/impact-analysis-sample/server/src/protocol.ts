// JSON-RPC method name constants to prevent errors from manually typing strings.
import type { ModuleIR } from './types/ir';

export const Methods = {
  RunStage05Analysis: 'impact/runStage05Analysis',
} as const;

export interface RunStage05Params {
  root: string;
  maxFiles: number;
}

export interface RunStage05Result {
  modules: ModuleIR[];
  stats: { total: number; parsed: number; cached: number; timeMs: number };
}
