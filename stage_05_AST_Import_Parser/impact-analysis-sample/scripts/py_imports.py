# -*- coding: utf-8 -*-
import ast, json, sys, time
path = sys.argv[1]
start = time.time()
with open(path, "r", encoding="utf8") as f:
	code = f.read()

imports = []
class ImportVisitor(ast.NodeVisitor):
	def visit_Import(self, node):
		for name in node.names:
			imports.append({"source": name.name, "specifiers": ["*"]})
	def visit_ImportFrom(self, node):
		src = node.module or ""
		specs = [n.name for n in node.names]
		imports.append({"source": src, "specifiers": specs})

try:
	ImportVisitor().visit(ast.parse(code, path))
except Exception as e:
	sys.stderr.write(str(e))

out = {
	"file": path,
	"lang": "py",
	"imports": imports,
	"exports": [],
	"meta": {"parseMs": int((time.time() - start)* 1000)}
}
print(json.dumps(out))
