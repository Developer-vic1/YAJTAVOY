(function (L) {
  const DB = L.core.DatabaseService;
  L.services.CatalogService = { restaurants: () => DB.getRestaurants(), restaurant(id) { const r = DB.getRestaurants().find(r => r.id === id); if (!r) L.fail('Restaurante no encontrado',404); return r; }, menu(id) { this.restaurant(id); return DB.getProducts(id); }, update(id,data) { const p = DB.state.products.find(p => p.id === id); if (!p) L.fail('Producto no encontrado',404); if (data.price != null && (!Number.isFinite(Number(data.price)) || Number(data.price) <= 0)) L.fail('El precio debe ser mayor que cero',422); return DB.change(() => { if (data.price != null) p.price = Number(data.price); if (data.available != null) p.available = !!data.available; return p; }); } };
})(window.LlajtaVoy);
