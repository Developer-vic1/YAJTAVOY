# LLAJTAVOY

**Delivery conectado para Cochabamba.**

Abre **index.html con doble clic**. La aplicación arranca automáticamente, presenta su dashboard y permite recorrer Cliente, Restaurante, Repartidor, Operaciones, Middleware, Arquitectura y Pagos desde un selector permanente. No requiere instalación, terminal, compilación ni servidor.

## Para qué sirve

Permite recorrer y entender el proceso de delivery de extremo a extremo: elegir comida, crear un pedido, aprobar o rechazar el pago, gestionar la cocina, asignar un repartidor, moverlo sobre una ruta calculada por calles reales y confirmar la entrega. También permite observar las solicitudes, los eventos, sus consumidores, reintentos y fallos.

Los restaurantes y repartidores iniciales son ficticios. Los sectores están contextualizados a Cochabamba. Los indicadores comienzan en cero y se calculan con los pedidos, pagos y eventos creados en esta aplicación.

## Actores y acceso

| Actor | Para qué sirve | Límite aplicado |
| --- | --- | --- |
| Cliente | Consultar catálogo, pedir, pagar, consultar comprobantes y seguir la entrega | Pedidos y notificaciones de `c1`, dirección local del cliente |
| Restaurante | Administrar el menú y aceptar, rechazar o preparar pedidos | Establecimiento seleccionado y sus pedidos |
| Repartidor | Declarar disponibilidad, recibir y aceptar ofertas, recorrer rutas | Repartidor seleccionado, ofertas y entregas asignadas |
| Administrador | Gestionar altas, incidentes, operación, escenarios y auditoría | Operaciones, Middleware y Arquitectura; acciones administrativas registradas |
| Proveedor de pagos | Procesar transacciones y comunicar sus estados | Vista Pagos; transacciones del proveedor local, sin direcciones ni nombres de clientes |

El selector cambia el contexto del actor para observar todo el proceso sin login. El gateway valida las acciones y recursos de ese contexto. **Esto no es autenticación ni aislamiento de seguridad de servidor**: el propietario del navegador puede inspeccionar y alterar los scripts y localStorage. El proveedor local no realiza un intercambio autenticado con un servicio externo; esa integración queda fuera del sistema local.

## Proceso completo: del antojo a la entrega

1. **Cliente → Restaurantes:** abre un menú y agrega productos. El carrito admite un establecimiento por pedido. Si cambias, solicita confirmación antes de reemplazarlo.
2. **Carrito:** revisa cantidades y total. Escribe nombre, dirección y notas. Selecciona la ubicación mediante un punto del mapa, una zona o coordenadas. Puedes intentar la geolocalización del navegador.
3. **Pago:** elige Efectivo, QR o Tarjeta. No se piden datos de tarjeta y no se cobra dinero real.
4. **Confirmar pedido:** la vista llama a `ApiGateway.request('POST', '/api/orders', ...)`. El gateway valida actor, ruta y cuota. OrderService valida catálogo, disponibilidad, cantidades, dirección y precios, que recalcula desde el catálogo.
5. **PaymentService:** registra `payment.processing` y luego `payment.approved` o `payment.rejected`. Un pago rechazado conserva el carrito y deja el pedido con su estado de rechazo.
6. **OrderService:** con el pago aprobado publica `order.created`. Todos los eventos de ese pedido usan el mismo `correlationId`.
7. **Restaurante:** selecciona el establecimiento donde compraste. El consumidor de `q.restaurant.orders` recibe el evento y el pedido aparece. Pulsa Aceptar → Iniciar preparación → Pedido listo. Cada paso valida la transición y publica su evento.
8. **DispatchService:** consume `order.ready`, cambia a búsqueda y ordena los repartidores elegibles por distancia vial al restaurante, comprobando también conexión al destino. Envía una oferta al más cercano.
9. **Repartidor:** selecciona el nombre marcado con Nueva oferta. Acepta. Si rechaza, se ofrece al siguiente disponible; si no quedan candidatos, el pedido permanece en búsqueda hasta que haya uno elegible.
10. **Ruta al restaurante:** inicia el recorrido. El punto se mueve sobre la geometría de calles descargada de OpenStreetMap. Cuando llega, se habilita Pedido recogido.
11. **Ruta al cliente:** pulsa Iniciar ruta al cliente. Cambia a En camino. Al alcanzar el 86% publica `delivery.arriving`.
12. **Cliente / Operaciones:** cambia de vista para observar posición, progreso, distancia y ETA. La animación continúa mientras cambias de vista.
13. **Confirmar entrega:** al llegar al destino, se habilita la entrega. El pedido queda DELIVERED; el repartidor vuelve a AVAILABLE y acumula entrega y ganancia. Todos los paneles consultan el mismo estado.
14. **Historial:** revisa el detalle y descarga el comprobante local. El centro de notificaciones permite alternar leída/no leída.

La duración depende de la distancia vial. La referencia es 24 km/h en moto y 12 km/h en bicicleta. En Repartidor puedes elegir **1×, 10× o 30×**; el ritmo inicial es 10× para observar el funcionamiento. La ETA usa distancia restante y velocidad de referencia, sin tráfico en vivo. El ritmo acelera la reproducción, no la velocidad utilizada en la ETA. Pausar o recargar conserva el último punto guardado; el tiempo con la aplicación cerrada no avanza el recorrido.

## Vistas según la función de cada actor

- **Inicio:** situación general, acceso a todas las vistas, mapa y actividad reciente.
- **Cliente:** catálogo, búsqueda por nombre/categoría/zona, categorías, menú, cantidades, carrito, dirección, métodos de pago, tracking, historial, comprobante y notificaciones.
- **Restaurante:** selector de establecimiento, pedidos nuevos y en preparación, entregas en curso, historial, estadísticas, alta de productos, cambio de precio, agotados y apertura/cierre; etapas animadas y seguimiento de sus pedidos.
- **Repartidor:** selector de repartidor, disponibilidad, oferta, rechazo o aceptación, dos tramos de ruta, pausa, recogida, entrega y reporte de fallo; mensajes a cocina, cliente de la entrega y operaciones.
- **Operaciones:** pedidos por hora, estados y eventos; indicadores derivados; mapa de flota con rutas activas/previstas, destinos, libres/ocupados, contactos y seguimiento seleccionado; altas de restaurantes/repartidores, incidentes, respaldo y restablecimiento.
- **Middleware:** requests con actor y Request ID, rate limit, topología, colas, ACK/NACK/retry/DLQ, JSON y filtro por evento o correlation ID.
- **Arquitectura:** componentes seleccionables con responsabilidades, operaciones y eventos. Incluye la tabla de actores y los límites del sistema local.

- **Pagos:** aprobación, rechazo, reembolso, referencias y notificaciones del proveedor local. El procesamiento es automático; no hay botones de cocina, despacho ni gestión de clientes.

## Mensajes y avisos locales

Cliente, restaurante y repartidor tienen una bandeja propia. Durante una entrega activa pueden comunicarse con los actores vinculados a ese pedido y con Operaciones. Operaciones puede contactar a las cocinas y repartidores, incluso libres, desde los pins del mapa. El proveedor de pagos recibe eventos de transacción y no accede a estos mensajes personales.

Pulsa **Mensaje al repartidor**, **Mensaje a la cocina**, **Mensaje al cliente** o **Contactar operaciones**, escribe hasta 500 caracteres y envía. Cambia al rol y a la identidad del destinatario: el mensaje aparece en su bandeja, puede marcarlo leído y responder. La lectura se actualiza también para el remitente. Los avisos del encabezado dependen del actor seleccionado. Los mensajes directos de una entrega cerrada no admiten nuevos envíos; el contacto con Operaciones sigue disponible.

Estos mensajes se guardan en el mismo navegador; no llegan a teléfonos ni a una aplicación externa. El gateway registra las acciones y aplica el alcance por actor/pedido. Se conservan al recargar y se eliminan al restablecer.

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
| Generar ráfaga | Realiza 65 probes en una cuota aislada | 60 permitidos y 5 bloqueados (429), sin consumir la cuota de las altas |
| Servicio no disponible | Desactiva el servicio elegido en el gateway/consumidor | Requests 503 o reintentos y DLQ del consumidor afectado |
| Restaurar servicio | Quita el fallo configurado | Nuevos requests vuelven a funcionar; DLQ se reprocesa manualmente |

La cuota regular usa una ventana móvil de 60 segundos por actor e identidad. **La ráfaga tiene su propia cuota**: puede repetirse y conserva los controles administrativos. Restaurar servicios y reprocesar DLQ usan una cuota separada de recuperación; restablecer no queda bloqueado por la cuota, incluso si una sesión antigua ya estaba limitada. El permiso de administrador sigue siendo obligatorio y las acciones se auditan. Una operación regular limitada indica cuántos segundos faltan para reintentar; los requests bloqueados también se registran.

El error observado al confirmar Restablecer era causado por la antigua ráfaga: consumía los 60 requests del mismo administrador que necesitaba restablecer. La separación de cuotas y el acceso de recuperación corrigen esa causa.

Los reintentos del broker tienen espera creciente de 400 y 800 ms. Son **tres intentos totales**, no tres reintentos adicionales. La notificación, auditoría y analytics son idempotentes por Event ID. Los consumidores reanudan los mensajes pendientes al recargar.

Cancelar un pedido, rechazarlo desde el restaurante o reportar entrega fallida revierte el pago aprobado local y libera los repartidores vinculados. Solo se habilitan las transiciones permitidas por la máquina de estados.

## Persistencia, mapas y respaldo

- La clave principal es `llajtavoy.state.v1`. Recargar conserva el catálogo, carrito, pedidos, pagos, posiciones, eventos, entregas del broker, mensajes locales y notificaciones.
- Los navegadores deciden cómo almacenar datos en `file://`. Usa el mismo navegador y la misma ruta de archivo; otros perfiles, modo privado o mover la carpeta pueden mostrar otra sesión.
- Si localStorage está bloqueado o lleno, el sistema continúa en memoria y muestra un aviso. Exporta desde Operaciones antes de cerrar. Un registro corrupto se conserva en una clave `.recovery` cuando el almacenamiento lo permite.
- Todos los mapas usan **Leaflet incluido en la carpeta y cartografía vectorial real de Cochabamba**, tanto por doble clic como sin conexión. No se solicitan imágenes de tiles ni un servicio de mapas al ejecutar la aplicación.
- Puedes arrastrar, ampliar con rueda/pellizco y botones, explorar con teclado, pulsar **Ver todo**, **Ampliar** o **Seguir repartidor**. La cámara sigue al repartidor por defecto en cada nuevo tramo; arrastrar desactiva ese seguimiento para explorar. El centro, zoom y esa elección se conservan al actualizar las vistas. El panel muestra hora de la última posición, pausa/llegada/demora, rumbo y secuencia de actualizaciones; todos son datos simulados. La línea verde conserva el recorrido realizado sobre las curvas de la ruta.
- En **Operaciones → Territorio y flota**, pasa el cursor o toca los pins para ver estados y destinos. Pulsa una ruta o pin para seleccionar **Seguir entrega** o enviar un mensaje. **Ampliar** recalcula el encuadre para el nuevo tamaño; **Territorio** muestra la cobertura cargada y **Panel** oculta/muestra la información de flota. No se inventan rutas cuando no existen pedidos: el panel explica cómo activarlas.
- En **Cliente → Ubicación**, haz clic en un punto o arrastra el pin. Seleccionar no reconstruye el mapa. Las coordenadas deben estar dentro de la cobertura; al crear el pedido se comprueban proximidad a una calle utilizable y conexión desde el restaurante.
- Las rutas se calculan localmente sobre la red vial OSM, con sentidos únicos, rotondas y restricciones básicas por vehículo registradas en el extracto. La línea azul sigue calles; los accesos cortos a la dirección aparecen discontinuos. Cada acceso puede medir como máximo 350 m y no constituye una ruta vial verificada.
- La cobertura incluida comprende Centro, Recoleta, Cala Cala y Queru Queru, entre latitudes -17.413/-17.355 y longitudes -66.194/-66.129. El sistema rechaza destinos fuera de esa cobertura o sin conexión, en vez de inventar una ruta. No es navegación comercial ni contiene tráfico, cierres, todos los giros restringidos o GPS externo en vivo.
- Las rutas antiguas activas se recalculan desde su último punto al recargar; no se borran los pedidos. Si no existe una conexión válida, se detiene ese recorrido y se muestra el motivo.
- Si falla la librería local, existe un respaldo SVG con la misma red vial, arrastre, rueda, botones y teclado. Consulta **[docs/mapas.md](docs/mapas.md)** para fuentes, licencia, algoritmo y límites.
- Turf es opcional para calcular el punto interpolado; existe una interpolación propia. Chart.js es opcional; existe un gráfico HTML/CSS. Los iconos Material Symbols tienen un respaldo SVG local y los modales son nativos.
- Los scripts locales son clásicos y no utilizan `fetch` de JSON ni ES Modules. Los datos iniciales están en `js/seed-data.js`.
- Exportar respaldo descarga todo el estado como JSON. No existe importación automática de respaldos en la interfaz. Eventos y requests crecen con el uso; la cuota de almacenamiento del navegador es finita.

## Restablecer el proceso

Ve a **Operaciones → Restablecer escenario**. La aplicación pide confirmación. Elimina pedidos, pagos, notificaciones, mensajes locales, eventos, colas y métricas, detiene las rutas y reinicia los repartidores. Conserva el catálogo actual, incluyendo cambios de menú y altas de restaurantes. El request de restablecimiento queda como nueva entrada de auditoría del gateway. Exporta antes si necesitas conservar la sesión.

## Archivos principales

| Archivo o carpeta | Función |
| --- | --- |
| `index.html` | Único punto de entrada, shell y orden de scripts |
| `css/` | Paleta, layout, responsive, componentes, animaciones y estilos de vistas |
| `js/core/` | Persistencia, EventBus, gateway, broker, eventos, estados y router |
| `js/services/` | Catálogo, restaurante, pedidos, pagos, despacho, repartidores, tracking, notificaciones, analytics, auditoría y comunicación local |
| `js/views/` | Inicio y siete vistas de actores/herramientas |
| `js/maps/` | Cartografía local OSM, red vial, rutas y gestor interactivo |
| `js/ui/` | Iconos, modales, descargas, avisos, timeline y gráficos |
| `assets/images/` | Identidad e ilustraciones SVG locales |
| `docs/` | Arquitectura, middleware, catálogo de eventos y flujo |
| `tests/` | Verificaciones funcionales del núcleo y reporte de validación |

## Límites técnicos reales

No hay delivery, cobros, infraestructura de mensajería, autenticación ni GPS de repartidores externos conectados. La ubicación del cliente puede venir de geolocalización con su permiso; el recorrido del repartidor avanza sobre puntos locales. Para operación multiusuario real son necesarios backend, autenticación, autorización de servidor, proveedor de pagos y dispositivos de repartidores, además de infraestructura de mensajería.

La aplicación necesita JavaScript y un navegador moderno con `<dialog>` y `requestAnimationFrame`. La geolocalización puede estar bloqueada al abrir archivos locales; siempre puedes elegir el punto manualmente. Los recursos externos opcionales aportan fuente, iconos y gráficos: el funcionamiento central es local.

Consulta **tests/VALIDACION.md** para distinguir lo comprobado automáticamente de la verificación visual pendiente. El navegador integrado de Codex bloqueó `file://` y no se eludió esa política.
