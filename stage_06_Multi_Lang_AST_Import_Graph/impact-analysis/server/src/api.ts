import { Connection } from 'vscode-languageserver';
import { Methods, RunStage05Params, RunStage05Result } from './protocol';
import { analyzeProject } from './analyzer';

export function registerApi(connection: Connection) {
  connection.onRequest<RunStage05Result, RunStage05Params>(
    Methods.RunStage05Analysis,
    async (params) => {
      const { root, maxFiles } = params;
      const { modules, stats } = await analyzeProject(root, maxFiles);
      return { modules, stats };
    }
  );
}
