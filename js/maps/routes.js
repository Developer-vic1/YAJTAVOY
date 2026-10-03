(function (L) {
  'use strict';
  const plans=new Map();
  const distance = (a,b) => { const rad = Math.PI/180, dlat = (b[0]-a[0])*rad, dlng = (b[1]-a[1])*rad; const h = Math.sin(dlat/2)**2 + Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dlng/2)**2; return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)); };
  L.maps.Routes = {
    distance,
    bearing(a,b) { const r=Math.PI/180,p=a[0]*r,q=b[0]*r,d=(b[1]-a[1])*r; return (Math.atan2(Math.sin(d)*Math.cos(q),Math.cos(p)*Math.sin(q)-Math.sin(p)*Math.cos(q)*Math.cos(d))/r+360)%360; },
    completed(points,progress) { if (!points?.length) return []; let left=this.length(points)*Math.min(1,Math.max(0,progress)); const out=[points[0]]; for(let i=1;i<points.length;i++) { const km=distance(points[i-1],points[i]); if(left<km) {out.push(this.at([points[i-1],points[i]],km?left/km:0));return out;} out.push(points[i]);left-=km; } return out; },
    plan(a,b,profile='motorcycle') { const key=[profile,...a,...b].join(','); if (!plans.has(key)) { if (plans.size>=100) plans.delete(plans.keys().next().value); plans.set(key,L.maps.StreetNetwork.plan(a,b,profile)); } return plans.get(key); },
    create(a,b,profile) { return this.plan(a,b,profile).points; },
    length(points) { return points.slice(1).reduce((n,p,i) => n + distance(points[i],p),0); },
    at(points, progress) { const total = this.length(points); if (!total) return points[points.length-1]; let target = total * Math.min(1,Math.max(0,progress)); if (window.turf) { try { const line = turf.lineString(points.map(p => [p[1],p[0]])); const coords = turf.along(line,target,{ units: 'kilometers' }).geometry.coordinates; return [coords[1],coords[0]]; } catch (_) {} } for (let i=1;i<points.length;i++) { const d = distance(points[i-1],points[i]); if (target <= d) { const f = d ? target/d : 1; return [points[i-1][0]+(points[i][0]-points[i-1][0])*f,points[i-1][1]+(points[i][1]-points[i-1][1])*f]; } target -= d; } return points[points.length-1]; }
  };
})(window.LlajtaVoy);
