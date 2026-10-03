(function (L) {
  'use strict';
  L.seed = () => ({ version: 1, sequence: 1000, createdAt: L.now(),
    restaurants: [
      { id: 'r1', name: 'La Mesa de la Llajta', category: 'Comida boliviana', zone: 'Centro', address: 'Avenida Heroínas, Centro', lat: -17.3936, lng: -66.1567, rating: 4.8, minutes: 25, delivery: 8, open: true, art: 'boliviana', tagline: 'Tradición servida con cariño', promo: 'Sabor de casa' },
      { id: 'r2', name: 'Brasa & Pan', category: 'Hamburguesas', zone: 'Queru Queru', address: 'Avenida América, Queru Queru', lat: -17.3714, lng: -66.1579, rating: 4.7, minutes: 20, delivery: 10, open: true, art: 'burger', tagline: 'A la brasa, a tu manera', promo: 'Combo desde Bs 32' },
      { id: 'r3', name: 'Forno del Valle', category: 'Pizza', zone: 'Cala Cala', address: 'Avenida América, Cala Cala', lat: -17.3705, lng: -66.172, rating: 4.9, minutes: 30, delivery: 12, open: true, art: 'pizza', tagline: 'Masa lenta, buenos momentos', promo: 'Para compartir' },
      { id: 'r4', name: 'Café Jacarandá', category: 'Café', zone: 'Recoleta', address: 'Avenida Santa Cruz, Recoleta', lat: -17.3773, lng: -66.1526, rating: 4.8, minutes: 15, delivery: 8, open: true, art: 'cafe', tagline: 'Una pausa en tu día', promo: 'Café + brownie Bs 25' },
      { id: 'r5', name: 'Verde de Valle', category: 'Saludable', zone: 'Queru Queru', address: 'Queru Queru, cerca de Avenida América', lat: -17.3688, lng: -66.1505, rating: 4.6, minutes: 20, delivery: 10, open: true, art: 'salad', tagline: 'Fresco, ligero y de temporada', promo: 'Hecho al momento' },
      { id: 'r6', name: 'Pollo del Patio', category: 'Pollo', zone: 'Centro', address: 'Centro, entorno de Plaza 14 de Septiembre', lat: -17.3949, lng: -66.1592, rating: 4.7, minutes: 25, delivery: 8, open: true, art: 'boliviana', tagline: 'El almuerzo está resuelto', promo: 'Mesa familiar' }
    ],
    products: [
      ['p1','r1','Silpancho de la casa','Carne crocante, arroz, papa, huevo y ensalada fresca.',32,'Platos'], ['p2','r1','Pique para compartir','Carne, salchicha, papas, locoto y tomate. Para dos.',55,'Platos'], ['p3','r1','Mocochinchi','Refresco tradicional de durazno, 500 ml.',8,'Bebidas'],
      ['p4','r2','Burger del valle','Carne a la brasa, queso, tomate y salsa de la casa.',25,'Hamburguesas'], ['p5','r2','Combo Brasa','Burger del valle, papas y refresco.',32,'Combos'], ['p6','r2','Papas rústicas','Papas doradas con hierbas y salsa.',18,'Acompañamientos'],
      ['p7','r3','Pizza margarita','Tomate, mozzarella y albahaca. Ocho porciones.',45,'Pizzas'], ['p8','r3','Pizza del horno','Jamón, champiñón, queso y aceitunas. Ocho porciones.',55,'Pizzas'], ['p9','r3','Cena del Valle','Pizza del horno y dos bebidas.',70,'Combos'],
      ['p10','r4','Café + brownie','Café filtrado y brownie de chocolate.',25,'Combos'], ['p11','r4','Latte de altura','Espresso y leche cremosa, 350 ml.',18,'Bebidas'], ['p12','r4','Tarta de frutos rojos','Porción de tarta con fruta de temporada.',25,'Postres'],
      ['p13','r5','Bowl andino','Quinua, verduras asadas, palta y aderezo de limón.',32,'Bowls'], ['p14','r5','Ensalada del valle','Hojas frescas, pollo, semillas y vinagreta.',32,'Ensaladas'], ['p15','r5','Jugo de temporada','Fruta fresca sin azúcar añadida, 500 ml.',18,'Bebidas'],
      ['p16','r6','Cuarto de pollo','Pollo al horno, papas, arroz y ensalada.',25,'Platos'], ['p17','r6','Pollo familiar','Pollo entero con papas y ensalada.',70,'Combos'], ['p18','r6','Refresco de la casa','Limonada fresca de un litro.',18,'Bebidas']
    ].map(p => ({ id: p[0], restaurantId: p[1], name: p[2], description: p[3], price: p[4], category: p[5], available: true })),
    drivers: [
      { id: 'd1', name: 'Mateo Rojas', vehicle: 'Moto · CB 2841', rating: 4.9, deliveries: 0, lat: -17.3895, lng: -66.1585, status: 'AVAILABLE', orderId: null },
      { id: 'd2', name: 'Valeria Céspedes', vehicle: 'Moto · CB 3916', rating: 4.8, deliveries: 0, lat: -17.3759, lng: -66.159, status: 'AVAILABLE', orderId: null },
      { id: 'd3', name: 'Diego Arce', vehicle: 'Bicicleta · Valle 07', rating: 4.9, deliveries: 0, lat: -17.3775, lng: -66.168, status: 'AVAILABLE', orderId: null }
    ],
    zones: [ { name: 'Centro', lat: -17.3935, lng: -66.157 }, { name: 'Queru Queru', lat: -17.371, lng: -66.153 }, { name: 'Cala Cala', lat: -17.373, lng: -66.171 }, { name: 'Recoleta', lat: -17.378, lng: -66.151 } ],
    customer: { name: 'Andrea', address: 'Avenida Santa Cruz, Recoleta', lat: -17.378, lng: -66.151, accuracy: null },
    communications: [], orders: [], payments: [], notifications: [], events: [], messages: [], requests: [], metrics: [], audit: [], offerInbox: [], paymentReceipts: [], cart: [], flags: {}, unavailable: [], rateWindows: {}, mapMode: 'auto'
  });
})(window.LlajtaVoy);
