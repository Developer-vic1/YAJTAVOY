"""Figura de geometría para revisión; no es una captura de navegador."""
from pathlib import Path
import json
import math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'assets/data/cochabamba-osm.json').read_text(encoding='utf-8'))
parks=json.loads((ROOT/'assets/data/cochabamba-landmarks-osm.json').read_text(encoding='utf-8'))
route=json.loads((ROOT/'tests/example-route.json').read_text(encoding='utf-8'))
fig,ax=plt.subplots(figsize=(9,7),dpi=140);fig.patch.set_facecolor('#FFFCF8');ax.set_facecolor('#F1F0E9')
for f in parks['features']:
    x=[p[1] for p in f['points']];y=[p[0] for p in f['points']]
    water=f['tags'].get('natural')=='water' or 'waterway' in f['tags']
    if f['points'][0]==f['points'][-1]:ax.fill(x,y,color='#C4DFE7' if water else '#DCE7CF',zorder=1)
    elif water:ax.plot(x,y,color='#95BBCB',linewidth=3,zorder=1)
for major in [False,True]:
    roads=[[[p[1],p[0]] for p in f['points']] for f in data['features'] if (f['tags'].get('highway') in ('primary','secondary','tertiary','trunk'))==major]
    ax.add_collection(LineCollection(roads,colors='#D0B69A' if major else '#D5D2CA',linewidths=2 if major else .8,zorder=2))
ax.plot([p[1] for p in route['points']],[p[0] for p in route['points']],color='white',linewidth=7,zorder=3)
for seg in route['segments']:
    ax.plot([p[1] for p in seg['points']],[p[0] for p in seg['points']],color='#916052' if seg['type']=='access' else '#326779',linewidth=3,linestyle='--' if seg['type']=='access' else '-',zorder=4)
for point,label,color in [(route['points'][0],'Restaurante','#C48B82'),(route['points'][-1],'Destino','#65785D')]:
    ax.scatter(point[1],point[0],s=130,color=color,edgecolor='white',linewidth=2,zorder=6);ax.annotate(label,(point[1],point[0]),xytext=(12,4),textcoords='offset points',fontsize=10,color='#392F2B',zorder=7)
xs=[p[1] for p in route['points']];ys=[p[0] for p in route['points']];xmin,xmax=min(xs)-.004,max(xs)+.006;ymin,ymax=min(ys)-.003,max(ys)+.003
names=set();cells=set()
for f in data['features']:
    name=f['tags'].get('name');p=f['points'][len(f['points'])//2]
    if not name or name in names or f['tags'].get('highway') not in ('primary','secondary','tertiary') or not (xmin<p[1]<xmax and ymin<p[0]<ymax):continue
    cell=(int((p[1]-xmin)/.003),int((p[0]-ymin)/.002))
    if cell in cells:continue
    names.add(name);cells.add(cell);ax.text(p[1],p[0],name,fontsize=6.5,color='#514F45',ha='center',zorder=5,bbox={'facecolor':'#FFFCF8','alpha':.65,'edgecolor':'none','pad':1})
ax.set_xlim(xmin,xmax);ax.set_ylim(ymin,ymax);ax.set_aspect(1/math.cos(math.radians(-17.38)));ax.set_xticks([]);ax.set_yticks([])
ax.set_title('Cochabamba · Recorrido por calles reales · %.2f km'%route['totalKm'],fontsize=14,color='#392F2B',pad=15)
fig.text(.5,.035,'Vista de geometría, no captura de navegador · © OpenStreetMap contributors · ODbL 1.0',ha='center',fontsize=8,color='#75665B')
fig.savefig(ROOT/'tests/route-preview.png',bbox_inches='tight');plt.close(fig)
