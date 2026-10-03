(function (L) {
  'use strict';
  L.verifyRouting=function(networkSource) {
    const results=[],check=(name,value) => { if (!value) throw Error(name); results.push({name,status:'PASS'}); },N=L.maps.StreetNetwork,R=L.maps.Routes,s=L.seed(),plans=[];
    for (const d of s.drivers) for (const r of s.restaurants) plans.push(R.plan([d.lat,d.lng],[r.lat,r.lng],N.profile(d.vehicle)));
    for (const r of s.restaurants) plans.push(R.plan([r.lat,r.lng],[s.customer.lat,s.customer.lng]));
    check('24 trayectos del catálogo tienen conexión vial',plans.length===24 && plans.every(p => p.totalKm>0 && p.segments.some(s => s.type==='street')));
    check('Las rutas identifican origen OSM, vehículo y calles',plans.every(p => p.source==='osm-local-v1' && p.steps.length>1 && p.osmTimestamp));
    const roads=new Map(); for (const f of L.maps.StreetData.features.filter(f => f.tags.highway)) { if (!roads.has(f.id)) roads.set(f.id,[]); roads.get(f.id).push(f); }
    const same=(a,b) => R.distance(a,b)<.000002;
    const lies=(p,a,b) => Math.abs(R.distance(a,p)+R.distance(p,b)-R.distance(a,b))<.00001;
    let valid=true,directions=true;
    for (const p of plans) for (const edge of p.segments.filter(s => s.type==='street')) {
      let found=false,permitted=false;
      for (const way of roads.get(edge.wayId) || []) for (let i=1;i<way.points.length;i++) { const a=way.points[i-1],b=way.points[i]; if (!lies(edge.points[0],a,b) || !lies(edge.points[1],a,b)) continue; found=true; const forward=R.distance(a,edge.points[0])<=R.distance(a,edge.points[1])+1e-9,t=way.tags,bike=p.profile==='bicycle' && t['oneway:bicycle']==='no'; const oneway=t.oneway==='-1'?-1:['yes','1','true'].includes(t.oneway) || (t.junction==='roundabout' && t.oneway!=='no')?1:0; if (bike || !oneway || (oneway===1 && forward) || (oneway===-1 && !forward)) permitted=true; }
      valid&&=found; directions&&=permitted;
    }
    check('Cada segmento vial se encuentra sobre una geometría OSM descargada',valid);
    check('Los 24 recorridos respetan sentidos y rotondas registrados',directions);
    check('Los accesos se distinguen y no exceden 350 m por extremo',plans.every(p => p.segments.filter(s => s.type==='access').every(s => s.km<=.35)));
    const p=plans[18],a=[s.restaurants[0].lat,s.restaurants[0].lng],b=[s.customer.lat,s.customer.lng];
    check('El recorrido Centro a Recoleta incluye más de 100 vértices reales',p.points.length>100 && p.totalKm>R.distance(a,b));
    check('Interpolación llega exactamente a ambos extremos',same(R.at(p.points,0),a) && same(R.at(p.points,1),b));
    const middle=R.at(p.points,.5); check('El avance intermedio permanece sobre la polilínea',p.points.slice(1).some((b,i) => lies(middle,p.points[i],b)));
    let outside=false;try{R.plan(a,[-18,-67]);}catch(e){outside=e.status===422;}check('Puntos fuera de cobertura se rechazan sin crear un trazo ficticio',outside);
    const zero=R.plan(a,a);check('Origen y destino iguales producen distancia cero sin NaN',zero.totalKm<.00001 && R.at(zero.points,1).every(Number.isFinite));
    // Red controlada independiente: vía de un solo sentido y vuelta por tres calles.
    const window={LlajtaVoy:{maps:{},fail:(m,status) => {const e=Error(m);e.status=status;throw e;}}};
    const A=[-17.38,-66.16],B=[-17.38,-66.159],C=[-17.381,-66.159],D=[-17.381,-66.16];
    window.LlajtaVoy.maps.StreetData={bounds:{south:-17.39,north:-17.37,west:-66.17,east:-66.15},osmTimestamp:'fixture',features:[
      {id:1,nodes:[1,2],points:[A,B],tags:{highway:'residential',oneway:'yes',name:'Solo ida'}},
      {id:2,nodes:[2,3,4,1],points:[B,C,D,A],tags:{highway:'residential',name:'Vuelta'}},
      {id:3,nodes:[2,1],points:[B,A],tags:{highway:'service',access:'private',name:'Privado'}},
      {id:4,nodes:[2,1],points:[B,A],tags:{highway:'cycleway',name:'Ciclovía'}}]};
    eval(networkSource);const F=window.LlajtaVoy.maps.StreetNetwork;
    const forward=F.plan(A,B),reverse=F.plan(B,A),bike=F.plan(B,A,'bicycle');
    check('Un solo sentido obliga al regreso por calles conectadas',reverse.totalKm>forward.totalKm*2 && reverse.segments.every(s => s.wayId!==1));
    check('La ruta en moto excluye vía privada y ciclovía',reverse.segments.every(s => ![3,4].includes(s.wayId)));
    check('El perfil bicicleta puede utilizar la ciclovía',bike.totalKm<reverse.totalKm && bike.segments.some(s => s.wayId===4));
    return results;
  };
})(window.LlajtaVoy);
