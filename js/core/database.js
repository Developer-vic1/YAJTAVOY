(function (L) {
  'use strict';
  const KEY = 'llajtavoy.state.v1'; let state; let persistent = true;
  const db = L.core.DatabaseService = {
    key: KEY,
    init() { let raw; try { raw = localStorage.getItem(KEY); const saved = raw ? JSON.parse(raw) : L.seed(); if (saved.version !== 1 || !['restaurants','products','drivers','orders','payments','notifications','events','messages','requests'].every(key => Array.isArray(saved[key])) || !saved.customer) throw new Error('Formato de datos inválido'); state = Object.assign(L.seed(),saved); } catch (e) { if (raw) { try { localStorage.setItem(KEY+'.recovery',raw); } catch (_) {} } state = L.seed(); persistent = false; this.warning = 'El almacenamiento no está disponible o sus datos son inválidos. Esta sesión conserva los cambios en memoria; exporta un respaldo desde Operaciones.'; } this.flush(); return state; },
    get state() { return state; }, get persistent() { return persistent; },
    flush() { try { localStorage.setItem(KEY, JSON.stringify(state)); persistent = true; } catch (e) { persistent = false; this.warning = 'No fue posible guardar en el navegador. Exporta un respaldo desde Operaciones antes de cerrar.'; } },
    change(fn, topic = 'data:changed') { const result = fn(state); this.flush(); L.EventBus.emit(topic, result); if (topic !== 'data:changed') L.EventBus.emit('data:changed', result); return result; },
    getRestaurants() { return state.restaurants; }, getProducts(id) { return state.products.filter(p => !id || p.restaurantId === id); }, getOrders() { return state.orders; }, getOrder(id) { const o = state.orders.find(o => o.id === id); if (!o) L.fail('Pedido no encontrado', 404); return o; },
    saveOrder(order) { return this.change(s => { s.orders.push(order); return order; }, 'order:updated'); },
    updateOrder(id, patch) { return this.change(() => Object.assign(this.getOrder(id), patch), 'order:updated'); },
    getDrivers() { return state.drivers; }, getEvents() { return state.events; }, saveEvent(event) { return this.change(s => { s.events.push(event); return event; }); }, getNotifications() { return state.notifications; },
    reset() { L.services.TrackingService?.stopAll(); L.core.EventBroker?.stop(); const catalog = { restaurants: state.restaurants, products: state.products }; state = Object.assign(L.seed(), catalog); this.flush(); L.EventBus.emit('system:reset'); L.EventBus.emit('data:changed'); },
    consumeFlag(key) { const value = state.flags[key]; if (value) this.change(s => { delete s.flags[key]; }); return value; }
  };
})(window.LlajtaVoy);
