"""Verificación de estructura sin instalación ni ejecución de navegador."""
from pathlib import Path
from html.parser import HTMLParser
import re
import json

ROOT = Path(__file__).resolve().parents[1]
checks = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append({"name": name, "status": "PASS"})

class EntryParser(HTMLParser):
    references = []
    modules = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag in ("script", "img", "link"):
            target = data.get("src") or data.get("href")
            if target and not target.startswith(("https:", "http:", "#", "data:")):
                self.references.append(target)
        if tag == "script" and data.get("type") == "module":
            self.modules.append(data)

html = (ROOT / "index.html").read_text(encoding="utf-8-sig")
parser = EntryParser()
parser.feed(html)
check("Todas las referencias locales del punto de entrada existen", all((ROOT / p).is_file() for p in parser.references))
check("Scripts clásicos; sin ES Modules obligatorios", not parser.modules)
files = [p for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.parts]
check("Sin archivos ni carpetas NPM", not any(p.name in {"package.json", "package-lock.json", "node_modules"} or "node_modules" in p.parts for p in files))
scripts = list((ROOT / "js").rglob("*.js"))
source = "\n".join(p.read_text(encoding="utf-8-sig") for p in scripts)
check("Sin fetch obligatorio de archivos locales, imports ni localhost", not re.search(r"\bfetch\s*\(|\bimport\s|localhost|127\.0\.0\.1", source))
check("Sin alert ni funciones marcadas TODO", not re.search(r"\balert\s*\(|\bTODO\b", source))
check("Sin emojis en código, HTML y CSS de aplicación", not any(0x1F000 <= ord(c) <= 0x1FAFF or 0x2600 <= ord(c) <= 0x27BF for p in files if p.suffix in {".html", ".css", ".js", ".svg"} for c in p.read_text(encoding="utf-8-sig")))
check("Paleta requerida y tratamiento de reduced-motion", "#C48B82" in (ROOT / "css/variables.css").read_text() and "prefers-reduced-motion" in (ROOT / "css/animations.css").read_text())
check("Viewport responsive y navegación móvil", 'name="viewport"' in html and "mobile-nav" in (ROOT / "css/layout.css").read_text())
check("Ilustraciones locales completas", all((ROOT / "assets/images" / (n + ".svg")).exists() for n in ["brand", "delivery", "boliviana", "burger", "pizza", "cafe", "salad"]))
app = (ROOT / "js/app.js").read_text(encoding="utf-8-sig")
used_actions = set(re.findall(r"(?:\bB|L\.ui\.button)\('([^']+)'", source)) | set(re.findall(r'data-action="([a-z-]+)"', source + html))
handled_actions = set(re.findall(r"action\s*===\s*'([^']+)'", app))
check("Todas las acciones de botones tienen controlador", used_actions <= handled_actions)
check("README de proceso y documentos requeridos", all((ROOT / p).is_file() for p in ["README.md", "docs/arquitectura.md", "docs/middleware.md", "docs/eventos.md", "docs/flujo-pedido.md"]))
print(json.dumps({"passed": len(checks), "checks": checks}, ensure_ascii=False, indent=2))
