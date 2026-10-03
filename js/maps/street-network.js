(function (L) {
  'use strict';
  const cache = new Map(), rad = Math.PI / 180;
  const distance = (a,b) => { const h = Math.sin((b[0]-a[0])*rad/2)**2 + Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((b[1]-a[1])*rad/2)**2; return 12742*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h))); };
  const denied = value => ['no','private'].includes(value);
  function allowed(tags,profile) {
    if (!['trunk','primary','secondary','tertiary','unclassified','residential','living_street','service','trunk_link','primary_link','secondary_link','tertiary_link','cycleway','pedestrian','footway','path'].includes(tags.highway)) return false;
    if (denied(tags.access)) return false;
    if (profile === 'bicycle') return !denied(tags.bicycle) && (!['steps','motorway','trunk','trunk_link'].includes(tags.highway) || tags.bicycle === 'yes') && (!['pedestrian','footway','path'].includes(tags.highway) || ['yes','designated','permissive'].includes(tags.bicycle));
    return !denied(tags.motorcycle) && !(denied(tags.motor_vehicle) && tags.motorcycle !== 'yes') && !['cycleway','pedestrian','footway','path','steps'].includes(tags.highway);
  }
  function graph(profile) {
    if (cache.has(profile)) return cache.get(profile);
    const nodes = new Map(), segments = [], adjacent = new Map();
    const append = (from,edge) => { if (!adjacent.has(from)) adjacent.set(from,[]); adjacent.get(from).push(edge); };
    for (const way of L.maps.StreetData.features) {
      const t = way.tags; if (!t.highway || !allowed(t,profile)) continue;
      const direction = profile === 'bicycle' && t['oneway:bicycle'] === 'no' ? 0 : t.oneway === '-1' ? -1 : ['yes','1','true'].includes(t.oneway) || (t.junction === 'roundabout' && t.oneway !== 'no') ? 1 : 0;
      for (let i=1;i<way.points.length;i++) {
        const u=way.nodes[i-1],v=way.nodes[i],a=way.points[i-1],b=way.points[i],km=distance(a,b); if (!u || !v || km < .000001) continue;
        nodes.set(u,a); nodes.set(v,b); const s={u,v,a,b,km,id:way.id,name:t.name || 'Calle sin nombre',forward:direction !== -1,backward:direction !== 1}; segments.push(s);
        if (s.forward) append(u,{to:v,km,way:s,fromPoint:a,toPoint:b}); if (s.backward) append(v,{to:u,km,way:s,fromPoint:b,toPoint:a});
      }
    }
    // Excluir fragmentos aislados de patios y calles desconectadas del extracto.
    const links=new Map(); for (const s of segments) { if (!links.has(s.u)) links.set(s.u,[]); if (!links.has(s.v)) links.set(s.v,[]); links.get(s.u).push(s.v); links.get(s.v).push(s.u); }
    const seen=new Set(); let largest=new Set(); for (const id of nodes.keys()) { if (seen.has(id)) continue; const component=new Set([id]),todo=[id]; seen.add(id); while (todo.length) { for (const next of links.get(todo.pop()) || []) if (!seen.has(next)) { seen.add(next); component.add(next); todo.push(next); } } if (component.size > largest.size) largest=component; }
    const result={nodes,adjacent,segments:segments.filter(s => largest.has(s.u)),profile}; cache.set(profile,result); return result;
  }
  function snap(point,g) {
    let best; const cos=Math.cos(point[0]*rad);
    for (const s of g.segments) { const x=(s.b[1]-s.a[1])*cos,y=s.b[0]-s.a[0],px=(point[1]-s.a[1])*cos,py=point[0]-s.a[0]; const f=Math.max(0,Math.min(1,(px*x+py*y)/(x*x+y*y))); const p=[s.a[0]+y*f,s.a[1]+(s.b[1]-s.a[1])*f],km=distance(point,p); if (!best || km<best.km) best={point:p,f,km,segment:s}; }
    if (!best || best.km > .35) L.fail('El punto está a más de 350 m de una calle disponible. Elige otro punto dentro de la cobertura.',422);
    return best;
  }
  class Heap {
    constructor() { this.items=[]; }
    push(value) { const a=this.items; a.push(value); let i=a.length-1; while (i) { const p=(i-1)>>1; if (a[p][0]<=value[0]) break; a[i]=a[p]; i=p; } a[i]=value; }
    pop() { const a=this.items,first=a[0],last=a.pop(); if (a.length) { let i=0; while (i*2+1<a.length) { let c=i*2+1; if (c+1<a.length && a[c+1][0]<a[c][0]) c++; if (a[c][0]>=last[0]) break; a[i]=a[c]; i=c; } a[i]=last; } return first; }
  }
  L.maps.StreetNetwork = {
    distance, profile: vehicle => /bicicleta/i.test(vehicle || '') ? 'bicycle' : 'motorcycle',
    contains(p) { const b=L.maps.StreetData.bounds; return Array.isArray(p) && p.length===2 && p.every(Number.isFinite) && p[0]>=b.south && p[0]<=b.north && p[1]>=b.west && p[1]<=b.east; },
    validate(p,profile='motorcycle') { if (!this.contains(p)) L.fail('Punto fuera de la cobertura vial local de Cochabamba. Elige un punto dentro del mapa.',422); return snap(p,graph(profile)); },
    plan(a,b,profile='motorcycle') {
      if (distance(a,b)<.000001) { this.validate(a,profile); return {points:[a,b],segments:[],steps:[],totalKm:0,accessKm:0,source:'osm-local-v1',profile,osmTimestamp:L.maps.StreetData.osmTimestamp}; }
      const g=graph(profile),start=this.validate(a,profile),end=this.validate(b,profile),extra=new Map(),S='start',T='end';
      const add=(from,to,p,q,way) => { if (!extra.has(from)) extra.set(from,[]); extra.get(from).push({to,km:distance(p,q),way,fromPoint:p,toPoint:q}); };
      const s=start.segment,e=end.segment;
      if (s.forward) add(S,s.v,start.point,s.b,s); if (s.backward) add(S,s.u,start.point,s.a,s);
      if (start.f<.000001) add(S,s.u,start.point,s.a,s); if (start.f>.999999) add(S,s.v,start.point,s.b,s);
      if (e.forward) add(e.u,T,e.a,end.point,e); if (e.backward) add(e.v,T,e.b,end.point,e);
      if (end.f<.000001) add(e.u,T,e.a,end.point,e); if (end.f>.999999) add(e.v,T,e.b,end.point,e);
      if (s===e && ((s.forward && end.f>=start.f) || (s.backward && end.f<=start.f))) add(S,T,start.point,end.point,s);
      const costs=new Map([[S,0]]),parents=new Map(),heap=new Heap(); heap.push([0,S]);
      while (heap.items.length) { const [cost,id]=heap.pop(); if (cost!==costs.get(id)) continue; if (id===T) break; for (const edge of [...(g.adjacent.get(id) || []),...(extra.get(id) || [])]) { const next=cost+edge.km; if (next < (costs.get(edge.to) ?? Infinity)) { costs.set(edge.to,next); parents.set(edge.to,{id,edge}); heap.push([next,edge.to]); } } }
      if (!parents.has(T)) L.fail('No hay una ruta vial conectada para este vehículo. Selecciona otra dirección o repartidor.',422);
      const edges=[]; let id=T; while (id!==S) { const p=parents.get(id); edges.unshift(p.edge); id=p.id; }
      const segments=[]; if (start.km>.001) segments.push({type:'access',name:'Acceso al punto de origen',points:[a,start.point],km:start.km});
      for (const edge of edges) if (edge.km>.000001) segments.push({type:'street',wayId:edge.way.id,name:edge.way.name,points:[edge.fromPoint,edge.toPoint],km:edge.km});
      if (end.km>.001) segments.push({type:'access',name:'Acceso al destino',points:[end.point,b],km:end.km});
      const points=[a]; for (const p of [start.point,...edges.map(e => e.toPoint),b]) if (distance(points[points.length-1],p)>.000001) points.push(p); if (points.length===1) points.push(b);
      const steps=[]; let accumulated=0; for (const seg of segments) { const prev=steps[steps.length-1]; if (prev && prev.name===seg.name && prev.type===seg.type) prev.km+=seg.km; else steps.push({name:seg.name,type:seg.type,km:seg.km,startKm:accumulated}); accumulated+=seg.km; }
      return {points,segments,steps,totalKm:points.slice(1).reduce((n,p,i) => n+distance(points[i],p),0),accessKm:start.km+end.km,source:'osm-local-v1',profile,osmTimestamp:L.maps.StreetData.osmTimestamp};
    },
    stats(profile='motorcycle') { const g=graph(profile); return {nodes:g.nodes.size,segments:g.segments.length}; }
  };
})(window.LlajtaVoy);
