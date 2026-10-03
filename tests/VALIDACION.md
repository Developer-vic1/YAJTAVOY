# Validación — accesos y vistas por función, 3 de octubre de 2026

## Resultado actual

**207 verificaciones JavaScript aprobadas**, registradas en [resultados-accesos.json](resultados-accesos.json), más **15 comprobaciones de estructura** mediante `python tests/static_check.py`. Se analizaron 55 fuentes JavaScript, incluida Leaflet local, sin errores de sintaxis. El evaluador Node también terminó correctamente y pasó `git diff --check`.

| Grupo | Casos | Alcance |
| --- | ---: | --- |
| Núcleo | 32 | Pedido completo, pago, cocina, ofertas, recogida, llegada, entrega, permisos, persistencia, correlación, ACK/NACK/retry/DLQ, idempotencia, 503 y cuota |
| Tracking | 7 | Red vial, ritmo, repartidor asignado, pausa/reanudación, migración y destino inválido sin cambios parciales |
| Red vial | 13 | 24 conexiones iniciales, geometría OSM, sentidos, accesos, interpolación, cobertura y perfiles |
| Gestor de mapas | 24 | Interacciones instrumentadas, encuadre, seguimiento, cámara acotada, rastro, SVG, rutas/flota, contactos y ampliación |
| Acceso y navegación | 33 | Cinco ventanas sin credenciales, menús por función, enlaces antiguos, contexto propio, perfiles válidos/persistidos, conservación de pedidos/carrito/mensajes, foco, modal, hashchange y proveedor |
| Roles y recuperación | 46 | Cuotas aisladas, recuperación de 429, alcance de pedidos/pagos, reembolso, telemetría, estados cerrados y validaciones de campos/altas/servicios |
| Comunicación | 14 | Contactos, respuestas, permisos de entrega activa, bandeja privada, lectura, persistencia, cierre y reset |
| Generación de HTML | 38 | Siete vistas públicas, fases de entrega, pestañas sin datos ajenos, seis apartados administrativos y retirada de lenguaje técnico |

## Cómo repetir las pruebas

En PowerShell, desde la raíz del repositorio:

```powershell
node tests/run.cjs
python tests/static_check.py
git diff --check
```

Node/Python solo se necesitan para verificar el código; la aplicación sigue abriendo con doble clic. El evaluador carga los scripts clásicos públicos en el orden de index.html, usando almacenamiento y reloj aislados. Para mapas y navegación usa DOM y API Leaflet instrumentados. No abre un navegador ni cambia los datos de la sesión del usuario. El informe se guarda en resultados-accesos.json.

## Cambios comprobados

- Inicio y Roles son públicos; sus menús no exponen bandejas ni funciones administrativas. Cada espacio tiene tareas y contexto propios.
- Las ventanas de Restaurante y Repartidor eligen perfiles existentes. Cambiar de rol conserva el proceso; un enlace a otro rol regresa al selector. El último perfil se recupera del estado guardado.
- Arquitectura y Middleware no se cargan desde index.html. Sus enlaces antiguos redirigen a Roles. Los escenarios de desarrollo quedan documentados fuera de la interfaz pública.
- Administración presenta Resumen, Pedidos, Restaurantes, Repartidores, Incidentes y Pagos. Se conservan altas, apertura, disponibilidad, contactos, respaldo y reinicio con confirmación.
- Pagos emplea el contexto del proveedor o administrador según el espacio. Los detalles usan etiquetas y referencias operativas; el cliente ya no ve correlationId ni JSON interno.
- Elegir un rol no genera solicitudes al gateway. Se conserva la corrección anterior de cuotas: ráfaga aislada y recuperación administrativa disponible.
- Se mantienen flota, rutas, destinos, trazas, movimientos automáticos y mensajes por entrega activa.

## Revisión visual pendiente

El navegador de herramientas rechazó file://. No se abrió un servidor ni se eludió esa política. **Estas pruebas no certifican la presentación visual en un navegador real**: quedan por comprobar CSS, diálogo/foco nativos, canvas, arrastre, rueda/pellizco, popups, ampliación, tamaños de pantalla y almacenamiento del archivo abierto con doble clic.

## Recorrido manual

1. Recarga con Ctrl+R. Desde el enlace antiguo Arquitectura debe aparecer Roles. Confirma que no hay Middleware, Arquitectura ni controles de fallos en el menú.
2. Cliente → Entrar: compra y verifica carrito, punto de entrega, pago, seguimiento y comprobante.
3. Roles → Restaurante: elige esa cocina; acepta, prepara y marca listo. Menú/Historial/Estadísticas deben consultar solo ese establecimiento.
4. Cambiar espacio: elige otra cocina; no debe mostrar el pedido de la anterior.
5. Roles → Repartidor: elige Nueva oferta, acepta e inicia el tramo a la cocina. Prueba pausa, ritmos, seguimiento automático y exploración del mapa.
6. Recoge al llegar e inicia el tramo al cliente. Cambia a Cliente y Administración: ambos deben observar la misma posición. Confirma entrega al llegar.
7. Administración: visita sus seis apartados, agrega perfiles, cambia apertura/disponibilidad libre y registra un incidente. Amplía el mapa y contacta al equipo.
8. Mensajes: cambia al rol y perfil destinatario, lee y responde; otro perfil no debe ver la conversación.
9. Gestión de pagos: consulta transacciones y comprobantes sin datos personales de clientes ni funciones de cocina/reparto.
10. En móvil, abre Menú y verifica Roles/Cambiar espacio. Recarga y comprueba que se conserva el espacio elegido.
11. Administración → Incidentes: descarga un respaldo y prueba Reiniciar demostración con confirmación. Debe regresar a Roles y conservar el catálogo.

Los informes anteriores resultados.json (43), resultados-mapas.json (81) y resultados-roles.json (170) son evidencia histórica. La figura route-preview.png representa cartografía y no es una captura del navegador. Fuentes y límites viales en [mapas.md](../docs/mapas.md). El seguimiento, pago y comunicación siguen siendo una demostración local.
