# Arquitectura de LLAJTAVOY

La aplicación carga scripts clásicos en orden bajo `window.LlajtaVoy`. Una sola fuente de verdad pertenece a DatabaseService; las vistas no mantienen pedidos independientes. El gateway expone métodos y endpoints conceptuales y llama a servicios locales. No hay peticiones HTTP a un backend.

Presentación → API Gateway → Servicios → Broker → Consumidores. Los servicios pueden llamar internamente a otros servicios, como OrderService a PaymentService, y coordinan la recepción de pedidos y el despacho mediante eventos. EventBus se ocupa exclusivamente de avisar al shell y actualizar la interfaz.

Kong y RabbitMQ representan roles arquitectónicos; no están instalados ni conectados. El selector ofrece Cliente, Restaurante, Repartidor y tres herramientas de Administrador. El Proveedor de pagos es un actor interno local. El gateway verifica contexto y propiedad, pero sus controles de JavaScript no ofrecen seguridad de servidor.

Cada pedido mantiene historial, `correlationId`, precios confirmados, pago y tramos de tracking. Los mensajes de cada consumidor tienen identidad propia, intentos, error e historial. Los consumidores idempotentes usan el Event ID; el registro de pedidos y el cambio de estados protegen transiciones repetidas.

La alternativa sin conexión cubre mapas SVG, iconos SVG, modales nativos y gráficos HTML. No se usa carga de archivos locales mediante fetch ni importación ES Modules.

El gestor de mapas detecta el protocolo de la página. En file:// utiliza siempre el mapa SVG local y conserva selección de punto y tracking, evitando solicitar tiles de OpenStreetMap que requieren un Referer web válido. Los tiles solo se utilizan en HTTP/HTTPS y tienen respaldo ante errores. Referencia: [política de tiles de OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/).

Referencia de la librería opcional: [Leaflet API](https://leafletjs.com/reference.html).
