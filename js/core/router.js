(function (L) {
  L.core.Router = { current:'home', navigate(view,history = true) { if (!L.views[view]) view = 'home'; this.current = view; if (history) window.location.hash = view; L.app.render(); window.scrollTo({ top:0,behavior:'instant' }); }, init() { const view = location.hash.slice(1); this.current = L.views[view]?view:'home'; window.addEventListener('hashchange',() => { const next = location.hash.slice(1); if (next!==this.current) this.navigate(next,false); }); } };
})(window.LlajtaVoy);
