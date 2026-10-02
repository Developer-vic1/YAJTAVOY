(function (L) {
  'use strict';
  const DB = L.core.DatabaseService, B = L.core.EventBroker, R = L.maps.Routes, active = new Map();
  L.services.TrackingService = {
    start(id,leg) { const o = DB.getOrder(id), d = L.services.DriverService.get(o.driverId); if (!['restaurant','customer'].includes(leg)) L.fail('Tramo inválido',422);
      if (leg === 'restaurant' && o.status !== 'DRIVER_ASSIGNED') L.fail('El pedido debe tener repartidor asignado');
      if (leg === 'customer' && !['PICKED_UP','ON_ROUTE','ARRIVING'].includes(o.status)) L.fail('Primero recoge el pedido');
      if (o.tracking?.leg === leg && o.tracking.arrived) L.fail('Ya llegaste al destino');
      if (active.has(id)) L.fail('La ruta ya está en marcha');
      if (leg === 'customer' && o.status === 'PICKED_UP') L.services.OrderService.status(id,'ON_ROUTE');
      const restaurant = L.services.CatalogService.restaurant(o.restaurantId); const destination = leg === 'restaurant' ? [restaurant.lat,restaurant.lng] : [o.lat,o.lng];
      DB.change(() => { d.status = leg === 'restaurant' ? 'PICKING_UP' : 'DELIVERING'; if (!o.tracking || o.tracking.leg !== leg) { const points = R.create([d.lat,d.lng],destination), totalKm = R.length(points); o.tracking = { leg, points, totalKm, remainingKm: totalKm, progress: 0, eta: Math.ceil(totalKm/0.3), position: [d.lat,d.lng], arrived: false, running: true, updatedAt: L.now() }; } o.tracking.running = true; },'order:updated'); this.animate(o); return o;
    },
    animate(o) { const t = o.tracking, id = o.id; let last = performance.now(), lastSave = 0; const speed = 1/24000;
      const frame = now => { const entry = active.get(id); if (!entry) return; const delta = Math.min(2000,now-last); last = now; t.progress = Math.min(1,t.progress+delta*speed); t.position = R.at(t.points,t.progress); t.remainingKm = t.totalKm*(1-t.progress); t.eta = t.arrived ? 0 : Math.ceil(t.remainingKm/0.3); L.EventBus.emit('tracking:frame',{ orderId: id, tracking: t });
        if (now-lastSave >= 750 || t.progress === 1) { lastSave = now; const d = L.services.DriverService.get(o.driverId); DB.change(() => { d.lat = t.position[0]; d.lng = t.position[1]; t.updatedAt = L.now(); },'tracking:updated'); B.publish('tracking.position.updated',{ orderId: id, lat: t.position[0], lng: t.position[1], progress: t.progress, remainingKm: t.remainingKm, eta: t.eta, leg: t.leg },'TrackingService',o.correlationId); }
        if (t.leg === 'customer' && t.progress >= .86 && o.status === 'ON_ROUTE') L.services.OrderService.status(id,'ARRIVING');
        if (t.progress === 1) { active.delete(id); DB.change(() => { t.arrived = true; t.running = false; t.eta = 0; },'order:updated'); L.EventBus.emit('tracking:arrived',id); return; } entry.frame = requestAnimationFrame(frame);
      }; active.set(id,{ frame: requestAnimationFrame(frame) });
    },
    pause(id) { this.stop(id); const o = DB.getOrder(id); if (o.tracking) DB.change(() => { o.tracking.running = false; },'order:updated'); },
    stop(id) { const item = active.get(id); if (item) cancelAnimationFrame(item.frame); active.delete(id); }, stopAll() { for (const id of active.keys()) this.stop(id); },
    resume() { for (const o of DB.getOrders()) if (o.tracking?.running && !o.tracking.arrived && !L.core.StateMachine.terminal.includes(o.status)) this.animate(o); },
    isRunning: id => active.has(id)
  };
})(window.LlajtaVoy);
