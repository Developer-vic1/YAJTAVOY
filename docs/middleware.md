# Gateway y broker

ApiGateway resuelve rutas, identifica el servicio, controla la cuota de 60 requests por minuto y por actor/recurso, valida permiso y propiedad, registra `requestId`, método, endpoint, servicio, status, latencia, actor y hora. Errores conocidos conservan 403, 404, 409, 422, 429 o 503; errores inesperados quedan como 500. Los registros son locales.

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
