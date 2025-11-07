// Main entry point: scheduling + caching + aggregated metrics
import fg from 'fast-glob';
 
import {parseTSFile} from './parse_ts';
import {parsePyFile} from './parse_py';
import {getCached, setCached} from './cache';
import {ModuleIR} from './types/ir';

export async function analyzeProject(root: string, maxFiles = 200): Promise<{modules: ModuleIR[], stats: { total: number; parsed: number; cached: number; timeMs: number }}> {
	const files = await fg(["**/*.{ts, js, py}"], {cwd: root, ignore: ["node_modules"], absolute: true});
	const limited = files.slice(0, maxFiles);
	const modules: ModuleIR[] = [];
	const stats = { total: files.length, parsed: 0, cached: 0, timeMs: 0};
	const start = Date.now();

	for (const f of limited) {
		const cached = getCached(f);
		if (cached) {
			modules.push(cached);
			stats.cached++;
			continue;
		}
		let ir: ModuleIR;
		if (f.endsWith(".py")) {
			ir = parsePyFile(f);
		} else {
			ir = await parseTSFile(f);
		}
		setCached(f, ir);
		modules.push(ir);
		stats.parsed++;
	}
	stats.timeMs = Date.now() - start;
	return {modules, stats};
}