# Guía para desarrolladores

La interfaz pública se concentra en los cinco roles y sus tareas. Esta documentación conserva el diseño interno y los escenarios de diagnóstico. Las vistas técnicas antiguas siguen en el repositorio como referencia, pero index.html no las carga y el router redirige sus enlaces a Roles.

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

Estos mecanismos pertenecen al código y a las pruebas de desarrollo. No hay un panel de fallos ni vistas Middleware/Arquitectura en la aplicación pública. El evaluador `node tests/run.cjs` los comprueba mediante el gateway y las banderas de prueba:

| Mecanismo | Efecto real | Cómo comprobarlo |
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


## Ejecutar verificaciones

En PowerShell, desde la carpeta raíz del repositorio:

```powershell
node tests/run.cjs
python tests/static_check.py
git diff --check
```

Node y Python solo son herramientas para estas comprobaciones; no hacen falta para abrir index.html. El evaluador usa estado aislado y APIs instrumentadas; no abre un navegador ni modifica su localStorage. El resultado completo se guarda en tests/resultados-accesos.json. El alcance y la revisión visual pendiente están en tests/VALIDACION.md.

## Accesos por espacio

Access mantiene activeSpace con rol e identidad, valida establecimientos/repartidores existentes y restaura esa elección. Router permite Inicio y Roles para todos; cualquier otra ruta exige el espacio correspondiente. Un cambio de hash no selecciona otro actor. Las ventanas de acceso cambian el contexto, conservando pedidos, carrito y mensajes. No representan autenticación ni protección de servidor. Los permisos de cada operación siguen siendo validados por el gateway.

Administración reutiliza la vista de pagos con contexto admin; el proveedor utiliza payment-provider y solo recibe sus propios metadatos. Los errores públicos y etiquetas de estados se traducen en components.js. Los IDs de pedido/transacción siguen siendo referencias operativas; correlationId, endpoints, JSON de eventos, colas y nombres de servicios no se muestran.
