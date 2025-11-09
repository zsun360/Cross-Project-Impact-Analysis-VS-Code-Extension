# -*- coding: utf-8 -*-
import ast, json, sys, time
path = sys.argv[1]
start = time.time()
with open(path, "r", encoding="utf8") as f:
	code = f.read()

imports = []
exports = []  # exports added

class ImportVisitor(ast.NodeVisitor):
	def visit_Import(self, node):
		for name in node.names:
			imports.append({"source": name.name, "specifiers": ["*"]})

	def visit_ImportFrom(self, node):
		src = node.module or ""
		specs = [n.name for n in node.names]
		imports.append({"source": src, "specifiers": specs})

class SymbolVisitor(ast.NodeVisitor):
    """
    收集顶层函数 / 类 / 变量定义，生成 exports:
    { name, type: 'function' | 'class' | 'var', loc: { line, column } }
    """
    def __init__(self):
        self.level = -1

    def generic_visit(self, node):
        self.level += 1
        super().generic_visit(node)
        self.level -= 1

    def visit_FunctionDef(self, node):
        if self.level == 0:
            exports.append({
                "name": node.name,
                "type": "function",
                "loc": {"line": node.lineno, "column": node.col_offset},
            })
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        if self.level == 0:
            exports.append({
                "name": node.name,
                "type": "function",
                "loc": {"line": node.lineno, "column": node.col_offset},
            })
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        if self.level == 0:
            exports.append({
                "name": node.name,
                "type": "class",
                "loc": {"line": node.lineno, "column": node.col_offset},
            })
        self.generic_visit(node)

    def visit_Assign(self, node):
        # 顶层简单赋值: x = 1
        if self.level == 0:
            for target in node.targets:
                if isinstance(target, ast.Name):
                    exports.append({
                        "name": target.id,
                        "type": "var",
                        "loc": {"line": target.lineno, "column": target.col_offset},
                    })
        self.generic_visit(node)
        
try:
    tree = ast.parse(code, path)
    ImportVisitor().visit(tree)
    SymbolVisitor().visit(tree)
except Exception as e:
    sys.stderr.write(str(e))

out = {
    "file": path,
    "lang": "py",
    "imports": imports,
    "exports": exports, 
    "meta": {"parseMs": int((time.time() - start)*1000)},
}

print(json.dumps(out))
