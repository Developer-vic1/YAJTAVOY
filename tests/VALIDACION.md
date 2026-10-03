# Validación — mapa vial local, 2 de octubre de 2026

## Resultado actual

**81 verificaciones JavaScript aprobadas**, registradas en `resultados-mapas.json`; además, **11 comprobaciones de estructura** mediante `python tests/static_check.py`. No se instalaron paquetes ni se ejecutó un servidor. Python se utiliza únicamente como herramienta de desarrollo: no es necesario para abrir `index.html`.

| Grupo | Casos | Qué se comprobó |
| --- | ---: | --- |
| Núcleo (`core.spec.js`) | 32 | Flujo completo de pedido, pago, cocina, oferta/rechazo/asignación, recogida, llegada y entrega; permisos, estados, precios, correlación, persistencia, ACK/NACK/retry/DLQ, idempotencia, 503, cuota 60/min y reset |
| Seguimiento (`tracking.spec.js`) | 7 | Ruta vial, velocidad explícita, ritmos válidos/inválidos, acceso del repartidor asignado, pausa/reanudación, migración del recorrido antiguo y rechazo de destino sin cambio parcial de estado |
| Red vial (`routing.spec.js`) | 13 | 24 conexiones iniciales, geometría OSM real, sentidos/rotondas, accesos acotados, interpolación, extremos, distancia cero, cobertura, circuito de un sentido, vía privada y ciclovía |
| Gestor de mapas (`maps.spec.js`) | 16 | Leaflet en file:// sin tiles, opciones de interacción, nueve marcadores, capas agrupadas, encuadre, clic/arrastre del destino, seguimiento, ampliación, gestos activos y respaldo SVG |
| Navegación (`navigation.spec.js`) | 5 | Coordinación de hash/actor/render, foco y modal |
| Generación de HTML | 8 | Las siete vistas iniciales y el panel de tracking con ritmo y calles |

Los 45 scripts de aplicación/pruebas y el archivo vendorizado de Leaflet se analizaron sin errores de sintaxis. La librería corresponde a 1.9.4. Los casos funcionales usan almacenamiento aislado, reloj/frames instrumentados y datos de prueba independientes; no cambian el localStorage del usuario.

La revisión estática comprueba referencias locales, scripts clásicos, ausencia de NPM, ausencia de fetch/import/localhost obligatorios, acciones con controlador, SVG locales, paleta, reduced-motion, responsive y documentación. También pasó `git diff --check`.

## Evidencia de geometría

`example-route.json` registra una ruta calculada de Centro a Recoleta de **2.34 km y 143 puntos**. La matriz de 18 trayectos repartidor→restaurante y 6 restaurante→cliente está en el reporte JSON. Para cada segmento de calle se comprobó que pertenece a la geometría de una vía OSM descargada y que cumple su sentido registrado.

`route-preview.png` muestra esa misma cartografía y recorrido. Se generó con `scripts/render_route_preview.py` y se inspeccionó como figura de geometría. **No es una captura del navegador ni prueba de los controles reales.**

## Correcciones verificadas

El mapa anterior podía mostrar imágenes de acceso bloqueado en file://. Su primer respaldo era un dibujo de calles arbitrarias, fijo y con una ruta ortogonal de cuatro puntos. Esa implementación fue reemplazada por cartografía OSM local, un grafo vial y Leaflet local; el respaldo también utiliza geometría real y permite pan/zoom.

Seleccionar el destino ahora mueve el pin sin reconstruir el mapa. El avance del tracking mueve el repartidor sin desplazar la vista, salvo al activar Seguir. Arrastrar desactiva ese seguimiento. Las actualizaciones conservan centro, zoom y ampliación; durante un gesto activo el shell aplaza el render. Los recorridos guardados del esquema antiguo se recalculan desde la última posición al recargar.

El registro anterior de 43 casos en `resultados.json` se conserva como evidencia histórica. El archivo actual de pruebas de mapas comprueba 16 casos de la implementación vectorial; reemplaza las nueve pruebas del esquema estático.

## Verificación visual pendiente

El navegador de herramientas rechazó acceder a la página `file://`: permite solamente HTTP/HTTPS. No se abrió un servidor ni se eludió esa restricción. Las pruebas del gestor utilizan una API Leaflet y DOM instrumentados; **no equivalen a ejecutar DOM, CSS, canvas o controles en un navegador real**.

Pendiente: interacción visual del archivo abierto con doble clic, arrastre/rueda/pellizco reales, selección de destino, ampliación y foco, apariencia en escritorio/tablet/móvil, consola, geolocalización y almacenamiento del navegador bajo file://. La validación automática y la figura de geometría no se presentan como pruebas visuales de la página actualizada.

## Cómo comprobarlo en la aplicación

1. Recarga `index.html` con Ctrl+R. En Inicio, arrastra el mapa, usa rueda/+ y pulsa Ampliar y Ver todo. Deben aparecer calles, parques y río, sin imágenes de acceso bloqueado.
2. En Cliente, abre Ubicación: selecciona un punto y arrastra el pin. Deben actualizarse coordenadas conservando la vista. Un punto fuera de cobertura debe mostrar error al guardar.
3. Crea un pedido, prepáralo en Restaurante y acepta la oferta en Repartidor. Inicia el tramo al restaurante y activa Seguir; arrastrar el mapa debe desactivarlo.
4. Prueba 1×, 10× y 30× y pausa/reanuda. La distancia debe decrecer sobre la ruta azul y los accesos deben verse discontinuos.
5. Recoge al llegar, inicia ruta al cliente y revisa el mismo pedido en Cliente. Recarga durante el recorrido: debe continuar desde el punto guardado. Confirma la entrega al llegar.

La simulación no representa GPS externo, tráfico ni restricciones viales completas. Las fuentes y límites están documentados en `docs/mapas.md`.
