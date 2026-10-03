# LLAJTAVOY

**Delivery para Cochabamba, con un espacio para cada función.**

Abre **index.html con doble clic**. No necesitas instalación, terminal, npm ni servidor. En el navegador integrado que ya tienes abierto, pulsa **Ctrl+R** para cargar los cambios.

## Para qué sirve

Permite demostrar todo el proceso de delivery: elegir comida, confirmar y pagar un pedido, prepararlo, asignar un repartidor, seguir su recorrido por calles de Cochabamba y confirmar la entrega. Los pedidos, pagos, mensajes, avisos y posiciones se comparten entre los espacios dentro del mismo navegador.

El seguimiento del repartidor avanza automáticamente durante cada recorrido iniciado. Los pagos, perfiles y mensajes son de demostración: no hay cobro real ni comunicación con teléfonos externos.

## Elegir un rol y cambiar de ventana

1. En **Inicio**, pulsa **Quiero pedir**, o entra al apartado **Roles**.
2. Elige Cliente, Restaurante, Repartidor, Administración o Gestión de pagos.
3. Se abre una ventana de acceso. Para Restaurante selecciona el establecimiento; para Repartidor selecciona su nombre. Pulsa **Entrar**. No se pide contraseña ni se abre un login.
4. El menú cambia y muestra las tareas de ese espacio. El perfil elegido aparece en la barra lateral; en móvil, usa **Menú** para ver las opciones adicionales.
5. **Cambiar espacio** permite cambiar el perfil dentro del mismo rol. **Roles** permite escoger otra función. **Volver a mi espacio** recupera el acceso seleccionado.

Cambiar de rol conserva pedidos, carrito y mensajes. Recargar conserva también el último espacio y su perfil. Los enlaces antiguos a Arquitectura o Middleware abren Roles. Esas herramientas y los escenarios de fallo quedan en la documentación para desarrolladores, fuera de la interfaz pública.

## Qué hace cada espacio

| Espacio | Sus opciones | Datos que consulta |
| --- | --- | --- |
| Cliente | Restaurantes, Mi carrito, Seguir pedido, Mis pedidos, Avisos y Mensajes | Sus pedidos, dirección, avisos y comprobantes |
| Restaurante | Pedidos, Menú, Historial, Estadísticas y Mensajes | Su establecimiento y sus pedidos; no los de otras cocinas |
| Repartidor | Mis entregas, disponibilidad, ofertas, recorridos y Mensajes | Sus ofertas y entregas asignadas |
| Administración | Resumen, Pedidos, Restaurantes, Repartidores, Incidentes, Pagos y Mensajes | Operación completa, altas, disponibilidad, incidentes y actividad del servicio |
| Gestión de pagos | Transacciones y comprobantes | Estados e importes del proveedor local, sin direcciones ni nombres de clientes |

## Proceso completo: del antojo a la entrega

1. **Roles → Cliente → Entrar:** explora restaurantes, abre un menú y agrega productos. El carrito admite un restaurante por pedido; cambiarlo pide confirmación.
2. **Mi carrito:** ajusta cantidades y escribe nombre, dirección y notas. Pulsa **Elegir en el mapa**, selecciona una zona o un punto y guarda. También puedes intentar la ubicación del navegador.
3. Elige **Efectivo, QR o Tarjeta** y confirma. No se piden datos bancarios. Un rechazo conserva el carrito; un pago aprobado envía el pedido a la cocina.
4. **Roles → Restaurante:** entra al establecimiento donde compraste. En Pedidos, pulsa **Aceptar → Iniciar preparación → Pedido listo**. También puede rechazar un pedido cuando ese estado lo permite.
5. El sistema busca un repartidor disponible y le ofrece la entrega. Si rechaza, prueba con el siguiente. Sin candidatos, espera a que haya uno disponible.
6. **Roles → Repartidor:** selecciona el nombre marcado con **Nueva oferta** y acepta. Pulsa **Iniciar ruta al restaurante**. El mapa sigue el movimiento automáticamente.
7. Al llegar a la cocina, pulsa **Pedido recogido** y después **Iniciar ruta al cliente**. El pedido cambia a En camino y después Llegando.
8. **Roles → Cliente → Seguir pedido**, o **Administración → Pedidos → Seguir entrega**: observa la misma posición, ruta, estado, distancia y llegada estimada. Cambiar de espacio no detiene el recorrido.
9. Vuelve al repartidor asignado y confirma la entrega al llegar al destino. El pedido queda Entregado y el repartidor vuelve a estar libre.
10. Cliente puede consultar el historial, descargar su comprobante y marcar avisos como leídos.

No se permite recoger antes de llegar al restaurante ni entregar antes de llegar al destino. El restaurante administra sus precios, productos agotados y apertura desde su espacio. El repartidor puede pausar el recorrido o reportar una entrega fallida. Las cancelaciones permitidas y entregas fallidas revierten el pago local y liberan al repartidor.

## Mapa, rutas y seguimiento

Los mapas usan Leaflet y cartografía local de OpenStreetMap incluida en la carpeta. Funcionan por doble clic y sin conexión; no solicitan imágenes de mapas a un servicio externo.

- Arrastra para explorar, usa rueda, pellizco, teclado o botones para ampliar y pulsa **Seguir repartidor** para volver a centrarlo. Explorar libera la cámara; cada nuevo tramo inicia con seguimiento automático.
- Azul indica ruta pendiente, verde el recorrido realizado y línea discontinua un acceso o trayecto previsto. El panel muestra la última posición, pausa/llegada, distancia y estimación de llegada.
- **Administración → Resumen → Territorio y flota** muestra repartidores libres, ocupados, ofertas, rutas y destinos. Pasa el cursor o toca los puntos para ver información, contactar o seguir una entrega.
- **Ampliar** ajusta el mapa a la ventana; **Territorio** encuadra la cobertura y **Panel** muestra u oculta la información de flota. Sin pedidos, el panel explica cómo activar el proceso.
- El ritmo inicial es **10×**. El repartidor puede elegir **1×, 10× o 30×**. Esto acelera la demostración; la estimación usa 24 km/h en moto y 12 km/h en bicicleta, sin tráfico en vivo.

Las rutas siguen calles del extracto vial y sus sentidos básicos por vehículo. La cobertura incluye Centro, Recoleta, Cala Cala y Queru Queru; se rechazan destinos fuera de ella o sin conexión. Los accesos cortos a una dirección son aproximados, de hasta 350 m por extremo. No es navegación comercial. Fuentes, licencia y restricciones: [mapas.md](docs/mapas.md).

## Mensajes y avisos

Cliente, cocina y repartidor tienen su propia bandeja. Durante una entrega activa pueden contactar a los participantes de ese pedido y a Administración. Administración puede contactar al equipo incluso cuando está libre, desde el mapa o sus listados.

Pulsa **Mensaje al repartidor**, **Mensaje a la cocina**, **Mensaje al cliente** o **Contactar operaciones**; escribe hasta 500 caracteres y envía. En Roles, cambia al destinatario y su perfil para leer y responder. Otro repartidor o restaurante no ve esos mensajes. Las entregas cerradas ya no permiten nuevos mensajes directos entre sus participantes; el contacto con Administración sigue disponible.

Los mensajes se guardan en este navegador, sin envío externo. El proveedor de pagos consulta actualizaciones de transacciones y no accede a las bandejas personales.

## Administración y respaldo

- **Resumen:** indicadores reales de esta sesión, estado de los pedidos, actividad y mapa de flota.
- **Pedidos:** detalle y seguimiento de las entregas.
- **Restaurantes:** agregar establecimientos, consultar dirección, abrir/cerrar temporalmente y contactar.
- **Repartidores:** agregar perfiles, revisar asignaciones, habilitar/pausar disponibilidad cuando no tienen entrega y contactar.
- **Incidentes:** registrar un aviso general o vinculado a un pedido y revisar actividad. En Respaldo de la operación puedes descargar los datos o reiniciar la demostración.
- **Pagos:** consultar aprobados, rechazados, reembolsados y comprobantes.

**Reiniciar demostración** pide confirmación. Elimina pedidos, pagos, mensajes, avisos e historial operativo, detiene recorridos y deja a los repartidores libres. Conserva el catálogo y sus cambios. Regresa a Roles; exporta primero si necesitas guardar la sesión. No hay importación automática de respaldos.

## Guardado y cierre

Recargar conserva catálogo, carrito, pedidos, pagos, mensajes, avisos, posiciones y espacio seleccionado. Usa el mismo navegador, perfil y ruta del archivo: otro navegador, modo privado o mover la carpeta puede mostrar otra sesión. Si no es posible guardar, aparece un aviso y la sesión continúa en memoria; descarga un respaldo antes de cerrar.

Para cerrar, cierra la pestaña o ventana. No hay proceso ni servidor que detener. Los recorridos no avanzan con la aplicación cerrada; al volver, se retoma el último punto guardado de un recorrido que estaba activo.

## Si algo no funciona

| Situación | Qué hacer |
| --- | --- |
| Sigues viendo el menú anterior | Recarga con Ctrl+R y entra a Roles |
| Una ruta de otro rol abre Roles | Elige el espacio correspondiente y pulsa Entrar |
| El restaurante no recibe el pedido | Selecciona el establecimiento de la compra y verifica pago aprobado |
| No llega una oferta al repartidor | Selecciona el nombre con Nueva oferta o habilita un repartidor libre |
| La ruta no avanza | Entra al repartidor asignado e inicia/reanuda el tramo |
| Ubicación fuera de cobertura | Escoge un punto de las zonas incluidas en el mapa |
| Ubicación automática bloqueada | Elige manualmente el punto de entrega |
| Mensaje no aparece | Cambia al rol y perfil destinatario dentro del mismo navegador |
| Límite de solicitudes | Espera los segundos indicados; elegir un rol no consume solicitudes |
| Fallos guardados de una demostración anterior | Descarga respaldo desde Administración → Incidentes y reinicia la demostración |

## Alcance y documentación técnica

Este sistema es una demostración local funcional. Cambiar roles sin contraseña permite recorrer el proceso, pero no constituye autenticación ni protección de servidor. Para uso real con varios dispositivos hacen falta backend, permisos de servidor, pagos y GPS externos. Los perfiles iniciales son ficticios y los indicadores se calculan con los pedidos creados aquí.

El detalle para programadores queda en [desarrollo.md](docs/desarrollo.md), [arquitectura.md](docs/arquitectura.md), [middleware.md](docs/middleware.md), [eventos.md](docs/eventos.md) y [flujo-pedido.md](docs/flujo-pedido.md). El acceso público se organiza en `js/core/access.js`, `js/core/router.js`, `js/views/roles.view.js` y `js/app.js`.

Consulta [VALIDACION.md](tests/VALIDACION.md) para las pruebas ejecutadas y la revisión visual pendiente. El navegador de herramientas bloquea file://; las pruebas automáticas usan estado y APIs instrumentadas.
