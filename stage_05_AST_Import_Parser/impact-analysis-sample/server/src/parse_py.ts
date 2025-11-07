import { execFileSync } from "child_process";
import path from "path";
import {ModuleIR} from "./types/ir";

export function parsePyFile(file: string): ModuleIR {
	const script = path.join(__dirname, "../../scripts/py_imports.py");
	const start = Date.now();
	const out = execFileSync("python", [script, file], {encoding: "utf8"});
	const parsed = JSON.parse(out);
	parsed.meta.parseMs = Date.now() - start;
	parsed.meta.cacheHit = false;
	return parsed;
}