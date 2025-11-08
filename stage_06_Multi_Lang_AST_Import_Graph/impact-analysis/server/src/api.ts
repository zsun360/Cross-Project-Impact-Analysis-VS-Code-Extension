import { Connection } from 'vscode-languageserver';
import { Methods, RunParams, RunResult } from './protocol';
import { analyzeProject } from './analyzer';

export function registerApi(connection: Connection) {
  console.log('[server] api.ts registerApi(): registering RunAnalysis');
  connection.onRequest<RunResult, RunParams>(
    Methods.RunAnalysis,
    async (params) => {
      console.log('[server] api.ts registerApi(): RunAnalysis called with', params);
      const { root, maxFiles } = params;
      const { modules, stats } = await analyzeProject(root, maxFiles);

      console.log('[server] api.ts registerApi(): RunAnalysis done',
        modules.map((m) => ({
          file: m.file,
          lang: m.lang,
          imports: (m.imports || []).map((im) => JSON.stringify({
            source: im.source,
            resolved: im.resolved,
          })),
        }))
      );

      return { modules, stats };
    }
  );
}
