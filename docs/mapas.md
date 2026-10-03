# Mapa y seguimiento

Abre `index.html` con doble clic. La cartografía y Leaflet 1.9.4 son archivos locales: el mapa funciona sin instalar paquetes, sin conexión y sin servidor. La aplicación no llama a servicios de tiles ni a una API de rutas.

## Cómo manipularlo

1. Arrastra el fondo para mover el mapa. Usa rueda, doble clic, botones +/− o pellizco para ampliar. Con foco en el mapa, las flechas permiten desplazamiento.
2. **Ver todo** encuadra los puntos y el recorrido. **Ampliar** ocupa la ventana; **Cerrar** o Escape vuelve al panel.
3. **Seguir** centra al repartidor durante el avance. Arrastrar el mapa desactiva esa opción. Los cambios de estado conservan el centro y zoom; un nuevo tramo recibe su encuadre inicial.
4. En Cliente, abre Ubicación. Haz clic o arrastra el pin de destino. Elegir un punto conserva la vista actual. Guardar verifica cobertura y proximidad a una calle utilizable; el pedido comprueba conexión desde el restaurante.
5. En Repartidor, acepta la oferta e inicia el tramo al restaurante. Pausa/reanuda y selecciona **1×, 10× o 30×**. Tras llegar y recoger, inicia el tramo al cliente. Se habilita confirmar entrega al completar el recorrido.
6. La línea azul indica calles; las conexiones discontinuas marrones indican accesos aproximados al punto exacto. El panel muestra calle actual, lista de calles, distancia, progreso y ETA. La escala métrica del mapa cambia con el zoom.

## Datos y licencias

Los restaurantes, repartidores y clientes son datos ficticios de demostración. La geometría vial, los nombres de calles, parques y agua proceden de **[OpenStreetMap](https://www.openstreetmap.org/copyright)**, © OpenStreetMap contributors, bajo **[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)**. La atribución se muestra en todos los mapas. Los datos derivados se distribuyen en esta carpeta con la misma licencia ODbL; el código de aplicación y la licencia BSD de Leaflet son componentes distintos.

- `assets/data/cochabamba-osm.json`: extracto vial derivado; fecha base OSM **2026-10-02T23:39:02Z**; 11 302 fragmentos cartográficos.
- `assets/data/cochabamba-landmarks-osm.json`: 343 elementos de parques/agua; fecha base OSM **2026-10-02T23:53:06Z**.
- `js/maps/street-data.js` y `landmark-data.js`: los mismos datos empaquetados como scripts clásicos para cargar con `file://`, sin leer JSON mediante fetch.
- `assets/vendor/leaflet/`: versión 1.9.4, licencia BSD en `LICENSE`. Fuente: [Leaflet](https://leafletjs.com/reference.html).
- Fuente de descarga: API pública [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), no imágenes de tiles. La aplicación nunca consulta esa API durante su uso.

Cobertura: sur −17.413, norte −17.355, oeste −66.194, este −66.129. El borde discontinuo delimita el extracto vial. No incluye toda Cochabamba ni se actualiza automáticamente.

## Cálculo del recorrido

`StreetNetwork` construye un grafo por vehículo usando IDs de nodos OSM. La conexión entre calles depende de nodos compartidos; cruzar visualmente una calle o un puente no crea una intersección inventada. Se excluyen fragmentos aislados de la red principal, vías privadas/prohibidas y tipos incompatibles con el vehículo.

Se respetan etiquetas `oneway=yes/1/true`, `oneway=-1`, rotondas y la excepción `oneway:bicycle=no`. La moto excluye ciclovías, pasos peatonales y escaleras; bicicleta excluye restricciones explícitas y solo utiliza caminos peatonales con acceso ciclista registrado. No se incluyen prohibiciones de giro de relaciones OSM ni datos completos de restricciones condicionales.

Cada extremo se proyecta al segmento utilizable más cercano; se admiten accesos de hasta 350 m, representados por separado. Se crean nodos virtuales en ese segmento para evitar ir obligatoriamente a la intersección más cercana. Dijkstra calcula la menor distancia entre extremos dentro del grafo dirigido. Si no existe conexión, devuelve un error; no se dibujan rectas ficticias como calles.

Dispatch ordena candidatos por distancia vial al restaurante y comprueba que su vehículo pueda conectar el restaurante con el destino. Los planes recientes se cachean; la cartografía no se duplica en localStorage. Cada tracking conserva su polilínea y plan para pausar y continuar.

Tracking interpola distancia acumulada sobre esa polilínea. Velocidad de referencia: moto 24 km/h, bicicleta 12 km/h. El selector acelera el tiempo reproducido; ETA = distancia restante / velocidad de referencia. No es ETA de tráfico. El marcador es una posición simulada, no GPS de un dispositivo externo. No avanza durante el tiempo con la aplicación cerrada.

## Actualización de datos (desarrollo)

`scripts/build_map_data.py` puede reconstruir los scripts desde respuestas Overpass guardadas mediante `--from-file` y `--landmarks`. También tiene una descarga vial opcional. Es una herramienta de preparación, no una dependencia del sistema. Conserva nodos, geometría y etiquetas relevantes; elimina caminos peatonales sin acceso ciclista y recorta fragmentos al área incluida. Verifica un mínimo de datos antes de sobrescribirlos.

La librería se incluye localmente porque los archivos `file://` carecen del contexto HTTP habitual de tiles públicos. La [política de tiles OSM](https://operations.osmfoundation.org/policies/tiles/) requiere identificar correctamente las solicitudes y prohíbe la descarga masiva para uso offline. Esta solución distribuye datos vectoriales ODbL obtenidos por Overpass y no descarga tiles.

## Validación y límites

`routing.spec.js` comprueba los 24 trayectos iniciales, geometría sobre vías reales, sentidos, endpoints, interpolación, cobertura y perfiles. `tracking.spec.js` comprueba ritmos, permisos, pausa, migración y rechazo sin cambio parcial de estado. `maps.spec.js` instrumenta la API Leaflet y DOM para comprobar pan/zoom habilitados, selección, seguimiento, conservación del encuadre y respaldo SVG.

Estas pruebas no constituyen una verificación visual en navegador. Consulta `tests/VALIDACION.md`. No se debe utilizar el extracto como navegación profesional: faltan tráfico, cierres, restricciones completas, actualizaciones continuas y posicionamiento externo.
