import {Project, SyntaxKind} from 'ts-morph';
import {ModuleIR, ImportEntry, ExportEntry} from './types/ir';
import fs from "fs";

export async function parseTSFile(file: string): Promise<ModuleIR> {
	const start = Date.now();
	const project = new Project({skipAddingFilesFromTsConfig: true});
	const source = project.addSourceFileAtPath(file);

	const imports: ImportEntry[] = source.getImportDeclarations().map(im => ({
		source: im.getModuleSpecifierValue(),
		specifiers: im.getNamedImports().map(n => n.getName()) || ["default"]
	}));

	const exports: ExportEntry[] = [];
	source.forEachChild(node => {
		if (node.isKind(SyntaxKind.FunctionDeclaration)) {
			const name = node.getName() || "default";
			exports.push({name, type: "function"});
		}
		if (node.isKind(SyntaxKind.ClassDeclaration)) {
			const name = node.getName() || "default";
			exports.push({name, type: "class"});
		}
	});

	// named / default re-exports
	source.getExportDeclarations().forEach(ex => {
		const spec = ex.getModuleSpecifierValue();
		exports.push({name: spec || "*", type: spec ? "reexport":"var"});
	});

	const loc = source.getEndLineNumber();
	return {
		file,
		lang: file.endsWith(".ts") ? "ts" : "js",
		imports,
		exports,
		meta: {parseMs: Date.now() - start, loc, cacheHit: false}
	};
}