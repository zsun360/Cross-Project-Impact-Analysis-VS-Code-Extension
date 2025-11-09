import { Project, SyntaxKind, Node } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import { ModuleIR, ImportEntry, ExportEntry } from './types/ir';

export async function parseTSFile(file: string): Promise<ModuleIR> {
  const start = Date.now();
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const source = project.addSourceFileAtPath(file);

  /*
  const resolveImport = (spec: string): string | undefined => {
    if (!spec) { return undefined; }

    // 只处理相对路径，其它（node_modules 等）不在图中建边
    if (!spec.startsWith('./') && !spec.startsWith('../')) {
      return undefined;
    }

    const base = path.resolve(path.dirname(file), spec);
    const candidates = [
      base,
      base + '.ts',
      base + '.tsx',
      base + '.js',
      base + '.jsx',
      path.join(base, 'index.ts'),
      path.join(base, 'index.tsx'),
      path.join(base, 'index.js'),
      path.join(base, 'index.jsx'),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c;
      }
    }
    return undefined;
  };
  */
  // 只负责把相对导入解析成「真实文件绝对路径」
  // spec: './helper', './pkg', '../x' 等
  // fromFile: 当前文件绝对路径
  function resolveImport(spec: string, fromFile: string): string | undefined {
    if (!spec) { return undefined; }

    // 只解析相对路径；npm 包等不进图
    if (!spec.startsWith('./') && !spec.startsWith('../')) {
      return undefined;
    }

    const base = path.resolve(path.dirname(fromFile), spec);

    const isFile = (p: string): boolean =>
      fs.existsSync(p) && fs.statSync(p).isFile();

    // ① 如果写的是带后缀的文件名，比如 './helper.ts'
    if (isFile(base)) {
      return base;
    }

    // ② 尝试常见扩展名
    const exts = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of exts) {
      const p = base + ext;
      if (isFile(p)) {
        return p;
      }
    }

    // ③ 如果 base 是目录，则尝试目录下的 index.*
    if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
      for (const ext of exts) {
        const p = path.join(base, 'index' + ext);
        if (isFile(p)) {
          return p;
        }
      }
    }

    // 找不到就算了，不影响其它语言
    return undefined;
  }

  const imports: ImportEntry[] = [];

  // ① 处理 ES Module imports
  source.getImportDeclarations().forEach((im) => {
    const spec = im.getModuleSpecifierValue();

    const named = im.getNamedImports().map((n) => n.getName());
    const hasDefault = !!im.getDefaultImport();

    const specifiers =
      named.length > 0
        ? named
        : hasDefault
          ? ['default']
          : [];

    const resolved = resolveImport(spec, file);

    imports.push({
      source: spec,
      specifiers,
      resolved,
    });
  });

  // ② 处理 require(...) 调用
  source
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .forEach((call) => {
      const expr = call.getExpression();
      if (expr.getText() !== 'require') { return; }

      const args = call.getArguments();
      if (args.length !== 1) { return; }

      const arg = args[0];
      if (!Node.isStringLiteral(arg)) { return; }

      const spec = arg.getLiteralText();
      const resolved = resolveImport(spec, file);

      imports.push({
        source: spec,
        specifiers: [], // 对图来说不区分 default/named
        resolved,
      });
    });

  // TODO: 如有需要可在这里做一下去重（可选，不去重也只是一条边重复）
  // 例如按 `${source}|${resolved}` 建个 Set 过滤


  const exports: ExportEntry[] = [];
  source.forEachChild((node) => {
    if (node.isKind(SyntaxKind.FunctionDeclaration)) {
      const name = node.getName() || 'default';
      exports.push({ name, type: 'function' });
    } else if (node.isKind(SyntaxKind.ClassDeclaration)) {
      const name = node.getName() || 'default';
      exports.push({ name, type: 'class' });
    } else if (node.isKind(SyntaxKind.VariableStatement)) {
      node.getDeclarationList().getDeclarations().forEach((decl) => {
        const name = decl.getName();
        exports.push({ name, type: 'var' });
      });
    }
  });

  // named / default re-exports（简单保留）
  source.getExportDeclarations().forEach((ex) => {
    const spec = ex.getModuleSpecifierValue();
    exports.push({
      name: spec || '*',
      type: spec ? 'reexport' : 'var',
    });
  });

  const loc = source.getEndLineNumber();

  console.log('from *parse_ts.ts* [server][ts] imports', {
    file,
    imports: imports.map(im => ({
      source: im.source,
      resolved: im.resolved,
      specifiers: JSON.stringify(im.specifiers)
    })),
  });

  return {
    file, // 已是绝对路径（analyzer 里传进来的）
    lang: file.endsWith('.ts') || file.endsWith('.tsx') ? 'ts' : 'js',
    imports,
    exports,
    meta: { parseMs: Date.now() - start, loc, cacheHit: false },
  };
}
