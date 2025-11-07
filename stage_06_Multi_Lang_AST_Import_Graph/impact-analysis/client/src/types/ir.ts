// ModuleIR v0 — Stage 05 authoritative shape
export interface ModuleIR {
  file: string;                                   // 绝对路径
  lang: 'ts' | 'js' | 'py';
  imports: ImportEntry[];                         // 仅 Stage05 用到 source/specifiers
  exports: ExportEntry[];                         // 预留：后续 Stage06/07 会用
  meta: { parseMs: number; loc: number; cacheHit: boolean };
}

export interface ImportEntry {
  source: string;            // 原始 import 源（如 "./utils"、"../pkg/index"）
  specifiers: string[];      // ['A','B'] 或 ['default'] 或 ['*']（py）
}

export interface ExportEntry {
  name: string;              // 导出名（default 也写 'default'）
  type: 'function' | 'class' | 'var' | 'default' | 'reexport';
}
