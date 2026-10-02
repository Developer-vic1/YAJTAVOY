(function (L) {
  L.core.EventStore = { all: () => L.core.DatabaseService.getEvents(), byCorrelation: id => L.core.DatabaseService.getEvents().filter(e => e.correlationId === id), get: id => L.core.DatabaseService.getEvents().find(e => e.eventId === id) };
})(window.LlajtaVoy);
