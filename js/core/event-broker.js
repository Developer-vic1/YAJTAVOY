(function (L) {
  'use strict';
  const DB = L.core.DatabaseService, bindings = new Map(), timers = new Map(); let generation = 0;
  const matches = (pattern, key) => pattern === '#' || pattern === key || (pattern.endsWith('.*') && key.startsWith(pattern.slice(0,-1)));
  const broker = L.core.EventBroker = {
    exchange: 'delivery.events', MAX_RETRIES: 3,
    subscribe(queue, patterns, consumer, handler) { bindings.set(queue, { queue, patterns, consumer, handler }); },
    publish(routingKey, payload, producer, correlationId) {
      if (!L.core.EventTypes.includes(routingKey)) L.fail('Evento no registrado: ' + routingKey);
      const event = { eventId: L.id('evt-'), exchange: this.exchange, routingKey, payload: L.copy(payload), producer, correlationId: correlationId || L.id('corr-'), timestamp: L.now() };
      DB.change(s => { s.events.push(event); for (const b of bindings.values()) if (b.patterns.some(p => matches(p,routingKey))) s.messages.push({ id: L.id('msg-'), eventId: event.eventId, queue: b.queue, consumer: b.consumer, status: 'READY', attempts: 0, history: [], timestamp: L.now(), error: null }); });
      L.EventBus.emit('broker:published', event); this.pump(); return event;
    },
    pump() { for (const m of DB.state.messages.filter(m => m.status === 'READY')) this.schedule(m, 30); },
    schedule(message, delay) { if (timers.has(message.id)) return; const gen = generation; const timer = setTimeout(() => { timers.delete(message.id); if (gen === generation) this.consume(message, gen); }, delay); timers.set(message.id, timer); },
    async consume(m, gen) {
      if (gen !== generation || !['READY','RETRY'].includes(m.status)) return;
      const b = bindings.get(m.queue); if (!b) return;
      const event = L.core.EventStore.get(m.eventId); if (!event) return;
      DB.change(() => { m.status = 'PROCESSING'; m.attempts++; m.history.push({ status: 'PROCESSING', at: L.now() }); });
      try {
        if (m.queue === 'q.audit' && !m.fault) { const fault = DB.consumeFlag('brokerFault'); if (fault) m.fault = fault; }
        if (m.fault === 'DLQ' || (m.fault === 'NACK' && m.attempts === 1) || (m.fault === 'RETRY' && m.attempts <= 2)) throw new Error('Fallo de consumidor controlado');
        if (DB.state.unavailable.includes(b.consumer)) throw new Error(b.consumer + ' no disponible');
        await b.handler(event);
        if (gen !== generation) return;
        DB.change(() => { m.status = 'ACK'; m.error = null; m.history.push({ status: 'ACK', at: L.now() }); });
      } catch (error) {
        if (gen !== generation) return;
        DB.change(() => { m.error = error.message; m.history.push({ status: 'NACK', at: L.now(), error: error.message }); m.status = m.attempts >= this.MAX_RETRIES ? 'DLQ' : 'RETRY'; m.history.push({ status: m.status, at: L.now() }); m.updatedAt = L.now(); });
        if (m.status === 'RETRY') this.schedule(m, m.attempts * 400);
      }
    },
    reprocess(id) { const m = DB.state.messages.find(m => m.id === id); if (!m || m.status !== 'DLQ') L.fail('El mensaje no está en DLQ'); DB.change(() => { m.status = 'READY'; m.attempts = 0; m.fault = null; m.error = null; m.history.push({ status: 'REPROCESSED', at: L.now() }); }); this.pump(); },
    resume() { DB.change(s => { for (const m of s.messages) if (['PROCESSING','RETRY'].includes(m.status)) m.status = 'READY'; }); this.pump(); },
    stop() { generation++; for (const t of timers.values()) clearTimeout(t); timers.clear(); },
    queues() { return [...bindings.values()].map(b => ({ ...b, messages: DB.state.messages.filter(m => m.queue === b.queue) })); },
    stats() { const ms = DB.state.messages; const count = status => ms.reduce((n,m) => n + m.history.filter(h => h.status === status).length,0); return { published: DB.state.events.length, consumed: count('ACK'), ack: count('ACK'), nack: count('NACK'), retry: count('RETRY'), dlq: ms.filter(m => m.status === 'DLQ').length, perMinute: DB.state.events.filter(e => Date.now() - Date.parse(e.timestamp) < 60000).length }; }
  };
})(window.LlajtaVoy);
