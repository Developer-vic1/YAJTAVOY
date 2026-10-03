"""Transportar fuentes a un evaluador JS aislado para pruebas de desarrollo."""
from pathlib import Path
import json
import sys
root=Path(__file__).resolve().parents[1]
if len(sys.argv)>1 and sys.argv[1].isdigit():
    text=(root/(sys.argv[2] if len(sys.argv)>2 else 'js/maps/street-data.js')).read_text(encoding='utf-8')
    index=int(sys.argv[1]); print(json.dumps(text[index*50000:(index+1)*50000],ensure_ascii=True))
else:
    files=list((root/'js').rglob('*.js'))+list((root/'tests').glob('*.js'))
    group=sys.argv[1] if len(sys.argv)>1 else 'js/core/'
    print(json.dumps({str(p.relative_to(root)).replace('\\','/'):p.read_text(encoding='utf-8-sig') for p in files if p.name not in ('street-data.js','landmark-data.js') and str(p.relative_to(root)).replace('\\','/').startswith(group)},ensure_ascii=True))
