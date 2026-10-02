# Catálogo de eventos

Cada evento contiene `eventId`, `exchange`, `routingKey`, `producer`, `correlationId`, `timestamp` y `payload`. El prefijo del ID indica su función: req-, evt-, corr-, pay-. `crypto.randomUUID` tiene un respaldo UUID cuando no está disponible.

| Eventos | Productor | Contenido principal |
| --- | --- | --- |
| payment.processing, payment.approved, payment.rejected | PaymentService | Pago, pedido, monto, método y estado |
| order.created | OrderService | orderId |
| order.accepted, order.rejected, order.preparing, order.ready, order.cancelled | OrderService | orderId, status |
| driver.search.started, driver.offer.created | DispatchService | orderId, driverId cuando hay candidato |
| driver.offer.accepted, driver.offer.rejected, driver.assigned | DriverService | orderId, driverId |
| delivery.picked_up, delivery.on_route, delivery.arriving, delivery.delivered, delivery.failed | OrderService | orderId, status |
| tracking.position.updated | TrackingService | orderId, lat, lng, progress, remainingKm, eta, leg |
| notification.created, notification.sent, notification.failed | NotificationService | notificationId, orderId |
| system.probe | Administrador | Acción de auditoría o incidente |

Todos los eventos de un pedido comparten su correlation ID, incluidos los eventos del pago, del tracking y de notificación. Los incidentes generales reciben una correlación propia. Las vistas de Middleware permiten filtrar por correlación y examinar el JSON del evento y las entregas asociadas.
