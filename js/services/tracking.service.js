(function (L) {
  'use strict';
  const DB = L.core.DatabaseService, B = L.core.EventBroker, R = L.maps.Routes, active = new Map();
  L.services.TrackingService = {
    parameters:Object.freeze({source:'simulation',followDriver:true,followIntervalMs:250,followZoom:16,positionIntervalMs:750,staleAfterMs:10000}),
    signal(t,status) {if(L.core.StateMachine.terminal.includes(status))return status==='DELIVERED'?'Entrega completada':'Pedido cerrado · Sin seguimiento activo'; if(!t) return 'Sin recorrido iniciado'; if(t.arrived) return 'Llegada registrada'; if(!t.running) return 'Recorrido pausado'; return Date.now()-Date.parse(t.updatedAt)>this.parameters.staleAfterMs?'Sin actualización reciente':'Seguimiento automático activo'; },
    start(id,leg) { const o = DB.getOrder(id), d = L.services.DriverService.get(o.driverId); if (!['restaurant','customer'].includes(leg)) L.fail('Tramo inválido',422);
      if (leg === 'restaurant' && o.status !== 'DRIVER_ASSIGNED') L.fail('El pedido debe tener repartidor asignado');
      if (leg === 'customer' && !['PICKED_UP','ON_ROUTE','ARRIVING'].includes(o.status)) L.fail('Primero recoge el pedido');
      if (o.tracking?.leg === leg && o.tracking.arrived) L.fail('Ya llegaste al destino');
      if (active.has(id)) L.fail('La ruta ya está en marcha');
      const restaurant = L.services.CatalogService.restaurant(o.restaurantId); const destination = leg === 'restaurant' ? [restaurant.lat,restaurant.lng] : [o.lat,o.lng];
      const routePlan = !o.tracking || o.tracking.leg !== leg || !o.tracking.routePlan ? R.plan([d.lat,d.lng],destination,L.maps.StreetNetwork.profile(d.vehicle)) : null;
      if (leg === 'customer' && o.status === 'PICKED_UP') L.services.OrderService.status(id,'ON_ROUTE');
      DB.change(() => { d.status = leg === 'restaurant' ? 'PICKING_UP' : 'DELIVERING'; if (routePlan) { const speedKmh=routePlan.profile==='bicycle'?12:24,totalKm=routePlan.totalKm; o.tracking = { sessionId:L.id('trip-'),source:'simulation',sequence:0,heading:0,leg,routePlan,points:routePlan.points,totalKm,remainingKm:totalKm,progress:0,eta:Math.ceil(totalKm/speedKmh*60),speedKmh,speedScale:10,position:[d.lat,d.lng],arrived:false,running:true,updatedAt:L.now() }; } o.tracking.running = true; o.tracking.updatedAt=L.now(); delete o.tracking.routeError; },'order:updated'); this.animate(o); return o;
    },
    animate(o) { this.stop(o.id); const t = o.tracking, id = o.id; let last = performance.now(), lastSave = 0;
      const frame = now => { const entry = active.get(id); if (!entry) return; const delta = Math.max(0,Math.min(2000,now-last)); last = now; const previous=t.position,travelledKm=delta/3600000*t.speedKmh*t.speedScale; t.progress = t.totalKm?Math.min(1,t.progress+travelledKm/t.totalKm):1; t.position = R.at(t.points,t.progress); if(R.distance(previous,t.position)>0.000001)t.heading=R.bearing(previous,t.position); t.remainingKm = t.totalKm*(1-t.progress); t.eta = Math.ceil(t.remainingKm/t.speedKmh*60);
        if (now-lastSave >= this.parameters.positionIntervalMs || t.progress === 1) { lastSave = now; const d = L.services.DriverService.get(o.driverId); DB.change(() => { d.lat = t.position[0]; d.lng = t.position[1]; t.updatedAt = L.now(); t.sequence=(t.sequence || 0)+1; t.source='simulation'; },'tracking:updated'); B.publish('tracking.position.updated',{ orderId: id, lat: t.position[0], lng: t.position[1], progress: t.progress, remainingKm: t.remainingKm, eta: t.eta, leg: t.leg,source:'simulation',sequence:t.sequence,heading:t.heading,updatedAt:t.updatedAt },'TrackingService',o.correlationId); }
        L.EventBus.emit('tracking:frame',{ orderId:id,tracking:t });
        if (t.leg === 'customer' && t.progress >= .86 && o.status === 'ON_ROUTE') L.services.OrderService.status(id,'ARRIVING');
        if (t.progress === 1) { active.delete(id); DB.change(() => { t.arrived = true; t.running = false; t.eta = 0; },'order:updated'); L.EventBus.emit('tracking:arrived',id); return; } entry.frame = requestAnimationFrame(frame);
      }; active.set(id,{ frame: requestAnimationFrame(frame) });
    },
    pause(id) { this.stop(id); const o = DB.getOrder(id); if (o.tracking) DB.change(() => { o.tracking.running = false; },'order:updated'); },
    setSpeed(id,scale) { const t=DB.getOrder(id).tracking; if (!t || ![1,10,30].includes(Number(scale))) L.fail('Selecciona un ritmo de 1, 10 o 30 veces',422); DB.change(() => { t.speedScale=Number(scale); },'order:updated'); return t; },
    currentStep(t) { const km=t.totalKm*t.progress; return t.routePlan?.steps.find(s => km<s.startKm+s.km) || null; },
    stop(id) { const item = active.get(id); if (item) cancelAnimationFrame(item.frame); active.delete(id); }, stopAll() { for (const id of active.keys()) this.stop(id); },
    resume() { for (const o of DB.getOrders()) { const t=o.tracking; if (!t || L.core.StateMachine.terminal.includes(o.status)) continue; if (!t.routePlan) { try { const r=L.services.CatalogService.restaurant(o.restaurantId),d=L.services.DriverService.get(o.driverId),destination=t.leg==='restaurant'?[r.lat,r.lng]:[o.lat,o.lng]; const plan=R.plan(t.arrived?(t.points?.[0] || [d.lat,d.lng]):t.position,destination,L.maps.StreetNetwork.profile(d.vehicle)); DB.change(() => { Object.assign(t,{routePlan:plan,points:plan.points,totalKm:plan.totalKm,remainingKm:t.arrived?0:plan.totalKm,progress:t.arrived?1:0,speedKmh:plan.profile==='bicycle'?12:24,speedScale:10}); t.eta=t.arrived?0:Math.ceil(t.remainingKm/t.speedKmh*60); }); } catch (error) { DB.change(() => { t.running=false; t.routeError=error.message; }); } } if (t.running && !t.arrived && t.routePlan) this.animate(o); } },
    isRunning: id => active.has(id)
  };
})(window.LlajtaVoy);
