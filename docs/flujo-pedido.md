# Estados y decisiones del pedido

```text
CREATED → PAYMENT_PENDING → PAYMENT_APPROVED → SENT_TO_RESTAURANT
                                                   ↓
ACCEPTED → PREPARING → READY_FOR_PICKUP → DRIVER_SEARCHING
                                               ↓
DRIVER_ASSIGNED → PICKED_UP → ON_ROUTE → ARRIVING → DELIVERED
```

Alternativas: PAYMENT_REJECTED, RESTAURANT_REJECTED, CANCELLED, DELIVERY_FAILED. Los estados terminales no permiten regresar a preparación ni entrega. Cancelar se admite antes de asignar repartidor. Tras la asignación puede reportarse una entrega fallida, que libera al repartidor y revierte el pago local.

El restaurante recibe el pedido por `order.created`. El despacho consume `order.ready` y elige un candidato por distancia. Rechazar la oferta incorpora al repartidor a la lista de rechazados del pedido y ofrece al siguiente; sin candidatos el estado permanece DRIVER_SEARCHING.

No se recoge sin haber llegado al restaurante. No se entrega sin haber llegado al cliente. La ruta de recogida y la de entrega son tramos distintos, con puntos, porcentaje, distancia restante y ETA. El punto se anima por frame y se guarda/publica cada 750 ms, evitando escrituras en cada frame.

Cliente, Restaurante, Repartidor y Operaciones consultan el mismo pedido. EventBus anuncia `order:updated`, `driver:updated` y `tracking:updated`; `tracking:frame` actualiza solo marcadores y métricas, sin reconstruir mapas en cada frame.
