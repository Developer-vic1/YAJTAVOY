# LLAJTAVOY

**Delivery conectado para Cochabamba.**

Abre **index.html con doble clic**. La aplicación arranca automáticamente, presenta su dashboard y permite recorrer Cliente, Restaurante, Repartidor, Operaciones, Middleware y Arquitectura desde un selector permanente. No requiere instalación, terminal, compilación ni servidor.

## Para qué sirve

Permite recorrer y entender el proceso de delivery de extremo a extremo: elegir comida, crear un pedido, aprobar o rechazar el pago, gestionar la cocina, asignar un repartidor, moverlo sobre una ruta y confirmar la entrega. También permite observar las solicitudes, los eventos, sus consumidores, reintentos y fallos.

Los restaurantes y repartidores iniciales son ficticios. Los sectores están contextualizados a Cochabamba. Los indicadores comienzan en cero y se calculan con los pedidos, pagos y eventos creados en esta aplicación.

## Actores y acceso

| Actor | Para qué sirve | Límite aplicado |
| --- | --- | --- |
| Cliente | Consultar catálogo, pedir, pagar, consultar comprobantes y seguir la entrega | Pedidos y notificaciones de `c1`, dirección local del cliente |
| Restaurante | Administrar el menú y aceptar, rechazar o preparar pedidos | Establecimiento seleccionado y sus pedidos |
| Repartidor | Declarar disponibilidad, recibir y aceptar ofertas, recorrer rutas | Repartidor seleccionado, ofertas y entregas asignadas |
| Administrador | Gestionar altas, incidentes, operación, escenarios y auditoría | Operaciones, Middleware y Arquitectura; acciones administrativas registradas |
| Proveedor de pagos | Procesar transacciones y comunicar sus estados | Componente local identificado ante PaymentService |

El selector cambia el contexto del actor para observar todo el proceso sin login. El gateway valida las acciones y recursos de ese contexto. **Esto no es autenticación ni aislamiento de seguridad de servidor**: el propietario del navegador puede inspeccionar y alterar los scripts y localStorage. El proveedor local no realiza un intercambio autenticado con un servicio externo; esa integración queda fuera del sistema local.

## Proceso completo: del antojo a la entrega

1. **Cliente → Restaurantes:** abre un menú y agrega productos. El carrito admite un establecimiento por pedido. Si cambias, solicita confirmación antes de reemplazarlo.
2. **Carrito:** revisa cantidades y total. Escribe nombre, dirección y notas. Selecciona la ubicación mediante un punto del mapa, una zona o coordenadas. Puedes intentar la geolocalización del navegador.
3. **Pago:** elige Efectivo, QR o Tarjeta. No se piden datos de tarjeta y no se cobra dinero real.
4. **Confirmar pedido:** la vista llama a `ApiGateway.request('POST', '/api/orders', ...)`. El gateway valida actor, ruta y cuota. OrderService valida catálogo, disponibilidad, cantidades, dirección y precios, que recalcula desde el catálogo.
5. **PaymentService:** registra `payment.processing` y luego `payment.approved` o `payment.rejected`. Un pago rechazado conserva el carrito y deja el pedido con su estado de rechazo.
6. **OrderService:** con el pago aprobado publica `order.created`. Todos los eventos de ese pedido usan el mismo `correlationId`.
7. **Restaurante:** selecciona el establecimiento donde compraste. El consumidor de `q.restaurant.orders` recibe el evento y el pedido aparece. Pulsa Aceptar → Iniciar preparación → Pedido listo. Cada paso valida la transición y publica su evento.
8. **DispatchService:** consume `order.ready`, cambia a búsqueda y ordena los repartidores disponibles por distancia al restaurante. Envía una oferta al más cercano.
9. **Repartidor:** selecciona el nombre marcado con Nueva oferta. Acepta. Si rechaza, se ofrece al siguiente disponible; si no quedan candidatos, el pedido permanece en búsqueda hasta que haya uno elegible.
10. **Ruta al restaurante:** inicia el recorrido. El punto se mueve sobre segmentos continuos. Cuando llega, se habilita Pedido recogido.
11. **Ruta al cliente:** pulsa Iniciar ruta al cliente. Cambia a En camino. Al alcanzar el 86% publica `delivery.arriving`.
12. **Cliente / Operaciones:** cambia de vista para observar posición, progreso, distancia y ETA. La animación continúa mientras cambias de vista.
13. **Confirmar entrega:** al llegar al destino, se habilita la entrega. El pedido queda DELIVERED; el repartidor vuelve a AVAILABLE y acumula entrega y ganancia. Todos los paneles consultan el mismo estado.
14. **Historial:** revisa el detalle y descarga el comprobante local. El centro de notificaciones permite alternar leída/no leída.

Cada tramo dura aproximadamente 24 segundos de reproducción activa para poder observar el proceso en una presentación. La ETA se estima con la distancia restante y una velocidad de referencia de 18 km/h; no representa un cálculo de tráfico en vivo. Al pausar o recargar, se conserva el último punto guardado. Un navegador en segundo plano puede ralentizar la animación.

## Cómo entender las seis vistas

- **Inicio:** situación general, acceso a todas las vistas, mapa y actividad reciente.
- **Cliente:** catálogo, búsqueda por nombre/categoría/zona, categorías, menú, cantidades, carrito, dirección, métodos de pago, tracking, historial, comprobante y notificaciones.
- **Restaurante:** selector de establecimiento, pedidos nuevos y en preparación, entregas en curso, historial, estadísticas, alta de productos, cambio de precio, agotados y apertura/cierre.
- **Repartidor:** selector de repartidor, disponibilidad, oferta, rechazo o aceptación, dos tramos de ruta, pausa, recogida, entrega y reporte de fallo.
- **Operaciones:** pedidos por hora, estados y eventos; indicadores derivados; mapa y tabla; altas de restaurantes/repartidores, incidentes, respaldo y restablecimiento.
- **Middleware:** requests con actor y Request ID, rate limit, topología, colas, ACK/NACK/retry/DLQ, JSON y filtro por evento o correlation ID.
- **Arquitectura:** componentes seleccionables con responsabilidades, operaciones y eventos. Incluye la tabla de actores y los límites del sistema local.

## Arquitectura y funcionamiento interno

```text
Vistas de actores
       |
       v
ApiGateway -- validación de contexto, rutas, rate limit y logs
       |
       v
Servicios por responsabilidad -- DatabaseService -- localStorage
       |
       v
EventBroker / delivery.events
       |
       +-- q.restaurant.orders --> RestaurantService
       +-- q.dispatch.orders   --> DispatchService
       +-- q.driver.offers     --> DriverService
       +-- q.notifications     --> NotificationService
       +-- q.analytics         --> AnalyticsService
       +-- q.audit             --> AuditService
       +-- q.payments          --> PaymentService
```

**Kong y RabbitMQ están representados mediante componentes JavaScript que reproducen su rol arquitectónico.** No hay servidores reales Kong/RabbitMQ ni procesos de microservicios distribuidos. Los servicios están separados por responsabilidades dentro del navegador; esto permite estudiar los patrones API Gateway y Event-Driven Architecture sin infraestructura externa.

El EventBus interno sincroniza las vistas. DatabaseService centraliza la fuente de verdad y la persistencia. El broker conserva cada evento, crea una entrega por cola vinculada y llama a su consumidor. El ACK corresponde a una entrega a un consumidor, por lo que un solo evento puede generar varios ACK.

## Escenarios de fallo y recuperación

En Operaciones o Middleware usa Control de escenarios:

| Control | Efecto real | Cómo comprobarlo |
| --- | --- | --- |
| Rechazar próximo pago | Rechaza el siguiente pedido | PAYMENT_REJECTED, evento payment.rejected, sin venta aprobada |
| Fallar próxima notificación | El consumidor registra FAILED y NACK; reintenta y envía | notification.failed, luego notification.sent sin mensaje duplicado |
| Repartidor rechaza oferta | Rechaza automáticamente la siguiente oferta | driver.offer.rejected y oferta al siguiente disponible |
| Forzar NACK | Primer intento de auditoría falla | NACK → RETRY → ACK |
| Forzar Retry | Fallan los dos primeros intentos de auditoría | Dos NACK y dos Retry; tercer intento ACK |
| Enviar a DLQ | Fallan tres intentos de auditoría | Error, tres intentos y mensaje en DLQ |
| Reprocesar | Recupera una entrega de DLQ sin volver a publicar el evento | Mensaje pasa a READY y luego ACK |
| Generar ráfaga | Realiza 65 requests administrativos | Los que superan 60/min reciben 429 |
| Servicio no disponible | Desactiva el servicio elegido en el gateway/consumidor | Requests 503 o reintentos y DLQ del consumidor afectado |
| Restaurar servicio | Quita el fallo configurado | Nuevos requests vuelven a funcionar; DLQ se reprocesa manualmente |

La cuota de requests es independiente por actor/recurso y usa una ventana móvil de 60 segundos. Si una ráfaga limita al administrador, espera un minuto antes de realizar otra acción administrativa. Los requests bloqueados también se registran.

Los reintentos del broker tienen espera creciente de 400 y 800 ms. Son **tres intentos totales**, no tres reintentos adicionales. La notificación, auditoría y analytics son idempotentes por Event ID. Los consumidores reanudan los mensajes pendientes al recargar.

Cancelar un pedido, rechazarlo desde el restaurante o reportar entrega fallida revierte el pago aprobado local y libera los repartidores vinculados. Solo se habilitan las transiciones permitidas por la máquina de estados.

## Persistencia, mapas y respaldo

- La clave principal es `llajtavoy.state.v1`. Recargar conserva el catálogo, carrito, pedidos, pagos, posiciones, eventos, entregas del broker y notificaciones.
- Los navegadores deciden cómo almacenar datos en `file://`. Usa el mismo navegador y la misma ruta de archivo; otros perfiles, modo privado o mover la carpeta pueden mostrar otra sesión.
- Si localStorage está bloqueado o lleno, el sistema continúa en memoria y muestra un aviso. Exporta desde Operaciones antes de cerrar. Un registro corrupto se conserva en una clave `.recovery` cuando el almacenamiento lo permite.
- Al abrir por doble clic (`file://`), todos los mapas usan el esquema local integrado de Cochabamba: sectores, restaurantes, repartidores, destino y recorrido. No se solicitan tiles externos. OpenStreetMap puede responder con imágenes de acceso bloqueado a una página local; esas imágenes no son errores de carga detectables por Leaflet.
- Si se sirve opcionalmente desde HTTP/HTTPS, el mapa conectado usa Leaflet y tiles de OpenStreetMap. Si no hay librería, tiles o conexión, aparece el esquema local. En ese contexto puedes elegir Usar mapa local desde Operaciones. Un servidor nunca es necesario para ejecutar el sistema.
- Los recorridos son polilíneas esquemáticas propias, no rutas calculadas por una API vial. No representan giros, restricciones o tráfico reales.
- Turf es opcional para calcular el punto interpolado; existe una interpolación propia. Chart.js es opcional; existe un gráfico HTML/CSS. Los iconos Material Symbols tienen un respaldo SVG local y los modales son nativos.
- Los scripts locales son clásicos y no utilizan `fetch` de JSON ni ES Modules. Los datos iniciales están en `js/seed-data.js`.
- Exportar respaldo descarga todo el estado como JSON. No existe importación automática de respaldos en la interfaz. Eventos y requests crecen con el uso; la cuota de almacenamiento del navegador es finita.

## Restablecer el proceso

Ve a **Operaciones → Restablecer escenario**. La aplicación pide confirmación. Elimina pedidos, pagos, notificaciones, eventos, colas y métricas, detiene las rutas y reinicia los repartidores. Conserva el catálogo actual, incluyendo cambios de menú y altas de restaurantes. El request de restablecimiento queda como nueva entrada de auditoría del gateway. Exporta antes si necesitas conservar la sesión.

## Archivos principales

| Archivo o carpeta | Función |
| --- | --- |
| `index.html` | Único punto de entrada, shell y orden de scripts |
| `css/` | Paleta, layout, responsive, componentes, animaciones y estilos de vistas |
| `js/core/` | Persistencia, EventBus, gateway, broker, eventos, estados y router |
| `js/services/` | Catálogo, restaurante, pedidos, pagos, despacho, repartidores, tracking, notificaciones, analytics y auditoría |
| `js/views/` | Inicio y las seis experiencias |
| `js/maps/` | Cochabamba, rutas, esquema de respaldo y Leaflet |
| `js/ui/` | Iconos, modales, descargas, avisos, timeline y gráficos |
| `assets/images/` | Identidad e ilustraciones SVG locales |
| `docs/` | Arquitectura, middleware, catálogo de eventos y flujo |
| `tests/` | Verificaciones funcionales del núcleo y reporte de validación |

## Límites técnicos reales

No hay delivery, cobros, infraestructura de mensajería, autenticación ni GPS de repartidores externos conectados. La ubicación del cliente puede venir de geolocalización con su permiso; el recorrido del repartidor avanza sobre puntos locales. Para operación multiusuario real son necesarios backend, autenticación, autorización de servidor, proveedor de pagos y dispositivos de repartidores, además de infraestructura de mensajería.

La aplicación necesita JavaScript y un navegador moderno con `<dialog>` y `requestAnimationFrame`. La geolocalización puede estar bloqueada al abrir archivos locales; siempre puedes elegir el punto manualmente. Los recursos externos solo aportan mapa, fuente, iconos y gráficos: el funcionamiento central es local.

Consulta **tests/VALIDACION.md** para distinguir lo comprobado automáticamente de la verificación visual pendiente. El navegador integrado de Codex bloqueó `file://` y no se eludió esa política.
