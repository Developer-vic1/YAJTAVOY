# Gateway y broker

Documento para desarrolladores. Estos componentes operan internamente; la aplicación pública no muestra la vista Middleware, colas, JSON de eventos ni controles de fallos. Las verificaciones se ejecutan con `node tests/run.cjs`; consulta [desarrollo.md](desarrollo.md).

ApiGateway resuelve rutas, identifica el servicio, controla la cuota de 60 requests por minuto y por actor e identidad, valida permiso y propiedad, registra `requestId`, método, endpoint, servicio, status, latencia, actor y hora. Errores conocidos conservan 403, 404, 409, 422, 429 o 503; errores inesperados quedan como 500. Los registros son locales.

La ráfaga usa GET `/api/admin/probe` en el grupo `demo-burst`; POST `/api/admin/burst` informa las 60 respuestas permitidas y 5 bloqueadas. Las altas no comparten esa cuota. La restauración de servicios y DLQ usan `recovery`; reset conserva el permiso administrativo y la auditoría pero queda fuera del bloqueo por cuota. Los registros incluyen grupo, clave, límite, uso y tiempo de reintento. Primero se valida el rol, después se aplica la cuota correspondiente.

GET/POST `/api/messages` y PATCH `/api/messages/:id/read` pertenecen a CommunicationService. Su bandeja se guarda separada de los mensajes del broker, con emisor, destinatario, pedido, texto, hora y lectura. El proveedor de pagos no tiene acceso; los contactos de entregas comprueban asignación activa.

EventBroker publica en `delivery.events`. Enlaces exactos, `prefix.*` y `#` deciden las colas receptoras. Cada mensaje pasa READY → PROCESSING → ACK o NACK → RETRY. Tras tres intentos fallidos pasa a DLQ. Las esperas crecen de 400 a 800 ms. Reprocesar conserva el evento y su correlación y reinicia los intentos de su entrega a una cola.

| Cola | Enlace | Consumidor |
| --- | --- | --- |
| q.restaurant.orders | order.created | RestaurantService |
| q.dispatch.orders | order.ready | DispatchService |
| q.driver.offers | driver.offer.created | DriverService |
| q.notifications | Avances del pedido, rechazos, asignación y entregas | NotificationService |
| q.analytics | # | AnalyticsService |
| q.audit | # | AuditService |
| q.payments | payment.* | PaymentService |

Los botones NACK, Retry y DLQ publican `system.probe` y afectan a su entrega de auditoría, permitiendo examinar los fallos sin duplicar acciones de cocina o pagos. Los fallos de pago, oferta y notificación sí afectan al próximo proceso comercial correspondiente. La desactivación de consumidores puede causar DLQ; restaurarlos no borra la DLQ, que debe reprocesarse.

Published cuenta eventos. ACK/NACK/Retry cuentan resultados de entregas a consumidores; un evento puede generar varias entregas. DLQ cuenta mensajes pendientes. Eventos/min cuenta publicaciones de los últimos 60 segundos.
