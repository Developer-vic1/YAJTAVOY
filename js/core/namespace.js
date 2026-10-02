(function () {
  'use strict';
  const L = window.LlajtaVoy = { core: {}, services: {}, views: {}, maps: {}, ui: {} };
  L.id = prefix => prefix + (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
  L.now = () => new Date().toISOString();
  L.copy = value => JSON.parse(JSON.stringify(value));
  L.money = value => 'Bs ' + Number(value || 0).toLocaleString('es-BO', { maximumFractionDigits: 2 });
  L.time = value => new Date(value).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  L.escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const listeners = new Map();
  L.EventBus = { on(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); return () => this.off(name, fn); }, off(name, fn) { listeners.get(name)?.delete(fn); }, emit(name, data) { for (const fn of listeners.get(name) || []) { try { fn(data); } catch (error) { console.error('EventBus', name, error); } } } };
  L.fail = (message, status = 409) => { const e = new Error(message); e.status = status; throw e; };
})();
