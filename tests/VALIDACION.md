# Validación — roles, flota y seguimiento, 3 de octubre de 2026

## Resultado actual

**170 verificaciones JavaScript aprobadas**, registradas en [resultados-roles.json](resultados-roles.json), más **11 comprobaciones de estructura** mediante `python tests/static_check.py`. Se analizaron sin errores de sintaxis 52 fuentes de aplicación/pruebas y datos, más Leaflet 1.9.4 incluido. También pasó `git diff --check`.

| Grupo | Casos | Alcance |
| --- | ---: | --- |
| Núcleo | 32 | Pedido completo, pago, cocina, ofertas, recogida, llegada, entrega, permisos, persistencia, correlación, ACK/NACK/retry/DLQ, idempotencia, 503 y cuota |
| Tracking | 7 | Red vial, ritmo, repartidor asignado, pausa/reanudación, migración y destino inválido sin cambios parciales |
| Red vial | 13 | 24 conexiones iniciales, geometría OSM, sentidos, accesos, interpolación, cobertura y perfiles |
| Gestor de mapas | 24 | Interacciones instrumentadas, conservación de encuadre, seguimiento por defecto, cámara acotada, rastro, SVG, rutas/flota, popups/contactos y nuevo encuadre territorial al ampliar |
| Navegación | 6 | Router/hash, cambio de actor, foco, modal y proveedor de pagos |
| Roles y recuperación | 46 | Cuotas aisladas, recuperación de sesión 429, alcance de pedidos/pagos, reembolso, telemetría, estados cerrados y validaciones de campos/altas/servicios |
| Comunicación | 14 | Contactos, respuestas, permisos de canal activo, bandeja privada, lectura, persistencia, cierre y reset |
| Generación de HTML | 28 | Ocho vistas iniciales, fases de entrega, movimiento condicionado al estado y pestañas de cliente/restaurante sin datos ajenos |

Las pruebas JavaScript usan almacenamiento aislado, reloj/frames y, para mapas/navegación, DOM y API Leaflet instrumentados. No modifican el localStorage del usuario. Los casos están en `*.spec.js`; el evaluador de desarrollo carga los scripts clásicos en el orden de index.html. Estas comprobaciones no equivalen a una ejecución visual en navegador.

## Correcciones

- La ráfaga anterior consumía la misma cuota administrativa que Reset y causaba el 429 observado. Ahora sus 65 probes quedan aislados: 60 aprobados y 5 bloqueados. La recuperación continúa disponible y los permisos se mantienen.
- El mapa ampliado conservaba el zoom del panel pequeño. Operaciones ahora recalcula el encuadre territorial y ajusta el zoom mínimo al tamaño de la ventana.
- La flota tiene estados, destinos, rutas activas y previstas, rastro, detalles al pasar el cursor, seguimiento seleccionado y contactos locales.
- Cada actor presenta sus funciones y datos; Pagos muestra transacciones y notificaciones sin direcciones. Los avisos del encabezado dependen del rol.
- El tracking sigue por defecto cada nuevo tramo, permite explorar/recentrar y muestra fuente simulada, última posición, rumbo y secuencia. Preparación, movimiento, pausa y llegada tienen indicaciones acordes al estado.
- Los mensajes locales verifican pertenencia a la entrega activa; operar otro actor no da acceso a las bandejas ajenas.

## Evidencia histórica y límites

Se conservan `resultados.json` (43 casos del sistema anterior) y `resultados-mapas.json` (81 de la revisión vial anterior). La geometría permanece en `example-route.json`: 2.34 km y 143 puntos entre Centro y Recoleta. `route-preview.png` es una figura de esa cartografía, no una captura del navegador.

El navegador de herramientas rechazó `file://`; no se abrió un servidor ni se eludió esa política. **La revisión visual real permanece pendiente**: CSS, canvas, arrastre/rueda/pellizco, popups, ampliación, tamaños de pantalla, foco y almacenamiento del archivo abierto con doble clic.

## Recorrido manual por roles

1. Recarga con Ctrl+R. Cliente: crea un pedido y verifica que carrito, ubicación, pago y comprobante correspondan al pedido propio.
2. Restaurante: selecciona esa cocina; acepta, inicia preparación y marca listo. Prueba menú/precio/agotado/apertura y Seguimiento y etapas. Cambiar de establecimiento debe ocultar el seguimiento anterior.
3. Repartidor: selecciona Nueva oferta, acepta e inicia ruta al restaurante. El mapa debe seguirlo; arrastrar libera la cámara y Seguir repartidor vuelve a centrarla. Prueba ritmos y pausa.
4. Recoge al llegar e inicia ruta al cliente. Cliente y Operaciones deben observar la misma posición y estado. Confirma entrega al llegar.
5. Operaciones: amplía el mapa, usa Territorio/Panel, pasa el cursor por pins/rutas y selecciona Seguir entrega. Comprueba libres/ocupados, destinos y trazas. Sin pedidos, el panel debe explicar cómo iniciar, sin inventar rutas.
6. Mensajes: contacta al repartidor desde su pin; cambia a su identidad, lee/responde y verifica la bandeja de operaciones. Otro repartidor no debe ver esos mensajes.
7. Pagos: revisa aprobados/rechazados/reembolsados y referencias. No deben aparecer direcciones ni controles de cocina o reparto.
8. Middleware: Generar ráfaga; deben registrarse 60 permitidas y 5 bloqueadas. Después prueba una alta y Reset. Prueba fallo/restauración, NACK/retry/DLQ y reprocesamiento.
9. Arquitectura: selecciona los componentes y contrasta responsabilidades, actores y contratos con el proceso anterior.

Fuentes, licencia, cobertura y restricciones viales en [docs/mapas.md](../docs/mapas.md). Todo el seguimiento y la comunicación son una demostración local; no representan GPS, tráfico ni mensajes enviados a dispositivos externos.
