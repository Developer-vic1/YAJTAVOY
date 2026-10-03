"""Preparar cartografía y librería locales; no es requisito de ejecución."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from datetime import datetime, timezone
import json
import gzip
import argparse

ROOT = Path(__file__).resolve().parents[1]
BBOX = (-17.413, -66.194, -17.355, -66.129)
QUERY = '[out:json][timeout:25];way[highway](%s);out geom;' % ','.join(map(str,BBOX))

def download(url, body=None):
    request = Request(url, data=body, headers={"User-Agent": "LlajtaVoy-map-build/1.0 (+https://github.com/Developer-vic1/YAJTAVOY)", "Accept-Encoding": "gzip", "Content-Type": "application/x-www-form-urlencoded"})
    with urlopen(request, timeout=60) as response:
        raw = response.read()
        return gzip.decompress(raw) if response.headers.get("Content-Encoding") == "gzip" else raw

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--from-file', type=Path)
    parser.add_argument('--landmarks', type=Path)
    args = parser.parse_args()
    endpoint = "https://overpass-api.de/api/interpreter"
    raw = args.from_file.read_bytes() if args.from_file else download(endpoint + "?" + urlencode({"data": QUERY}))
    data = json.loads(raw)
    elements = [e for e in data["elements"] if e.get("type") == "way" and len(e.get("geometry", [])) > 1]
    roads = [e for e in elements if e.get("tags", {}).get("highway")]
    if len(roads) < 200:
        raise ValueError("La respuesta no contiene una red vial suficiente; no se reemplazan datos")
    features = []
    for e in elements:
        tags = e.get("tags", {})
        if tags.get('highway') in ('footway', 'path', 'steps') and tags.get('bicycle') not in ('yes', 'designated', 'permissive'):
            continue
        keep = {k: tags[k] for k in ("highway", "name", "oneway", "junction", "access", "motor_vehicle", "motorcycle", "bicycle", "oneway:bicycle", "bridge", "tunnel", "landuse", "leisure", "natural", "waterway") if k in tags}
        runs = [[]]
        for i, p in enumerate(e['geometry']):
            if BBOX[0] <= p['lat'] <= BBOX[2] and BBOX[1] <= p['lon'] <= BBOX[3]:
                runs[-1].append(i)
            elif runs[-1]:
                runs.append([])
        for run in runs:
            if len(run) > 1:
                features.append({"id": e['id'], "nodes": [e['nodes'][i] for i in run], "points": [[round(e['geometry'][i]['lat'],7),round(e['geometry'][i]['lon'],7)] for i in run], "tags": keep})
    result = {"version": 1, "bounds": {"south": BBOX[0], "west": BBOX[1], "north": BBOX[2], "east": BBOX[3]}, "source": "OpenStreetMap contributors", "license": "ODbL 1.0", "sourceUrl": "https://www.openstreetmap.org/copyright", "endpoint": endpoint, "downloadedAt": datetime.now(timezone.utc).isoformat(), "osmTimestamp": data.get("osm3s", {}).get("timestamp_osm_base"), "features": features}
    target = ROOT / "assets/data"
    target.mkdir(parents=True, exist_ok=True)
    packed = json.dumps(result, ensure_ascii=False, separators=(",", ":"))
    (target / "cochabamba-osm.json").write_text(packed, encoding="utf-8")
    (ROOT / "js/maps/street-data.js").write_text("/* OpenStreetMap contributors, ODbL 1.0. See docs/mapas.md. */\n(function(L){L.maps.StreetData=" + packed + ";})(window.LlajtaVoy);\n", encoding="utf-8")
    if args.landmarks:
        places=json.loads(args.landmarks.read_text(encoding='utf-8'))
        landmarks=[{'id':e['id'],'points':[[p['lat'],p['lon']] for p in e['geometry']],'tags':{k:v for k,v in e.get('tags',{}).items() if k in ('name','leisure','natural','waterway')}} for e in places['elements'] if e.get('geometry') and len(e['geometry'])>1]
        derived={'source':result['source'],'license':result['license'],'sourceUrl':result['sourceUrl'],'osmTimestamp':places['osm3s']['timestamp_osm_base'],'features':landmarks}
        (target/'cochabamba-landmarks-osm.json').write_text(json.dumps(derived,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        (ROOT/'js/maps/landmark-data.js').write_text('/* OpenStreetMap contributors, ODbL 1.0. */\n(function(L){L.maps.LandmarkData='+json.dumps(derived,ensure_ascii=False,separators=(',',':'))+';L.maps.StreetData.features.push(...L.maps.LandmarkData.features);})(window.LlajtaVoy);\n',encoding='utf-8')
    vendor = ROOT / "assets/vendor/leaflet"
    vendor.mkdir(parents=True, exist_ok=True)
    for name, url in {
        "leaflet.js": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
        "leaflet.css": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        "LICENSE": "https://raw.githubusercontent.com/Leaflet/Leaflet/v1.9.4/LICENSE",
    }.items():
        if (vendor / name).is_file():
            continue
        content = download(url)
        if name == "leaflet.js":
            content = content.replace(b"//# sourceMappingURL=leaflet.js.map", b"")
        (vendor / name).write_bytes(content)
    print(json.dumps({"roads": len(roads), "features": len(features), "bytes": len(packed.encode()), "timestamp": result["osmTimestamp"]}))

if __name__ == "__main__":
    main()
