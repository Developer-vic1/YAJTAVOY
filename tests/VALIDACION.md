# Validación — 2 de octubre de 2026

## Resultado comprobado

**43 verificaciones JavaScript aprobadas**, registradas en `resultados.json`. Se ejecutaron en V8 con almacenamiento aislado en memoria y una implementación de reloj/frames acelerada para recorrer las rutas. No se instalaron paquetes ni se utilizó un servidor.

Se comprobó el flujo gateway → pago → pedido → consumidor restaurante → aceptación → preparación → despacho → rechazo de primera oferta → asignación → ruta a restaurante → recogida → ruta a cliente → llegada → entrega. También se verificaron límites entre actores, precios desde catálogo, transiciones inválidas, correlación de eventos, serialización y recuperación de estado, avisos idempotentes, devolución local, pago rechazado, notificación fallida con recuperación, ACK/NACK/retry/DLQ y reproceso, servicio 503 y restauración, rate limit 60/min, menú agotado y reset conservando catálogo.

Las siete vistas generan HTML sin errores en sus estados iniciales; también se ejercitó la generación del menú, carrito y checkout. Los 37 archivos JavaScript analizados tienen sintaxis válida. Estas verificaciones **no equivalen a ejecutar DOM, CSS o controles en un navegador**.

La revisión estática adicional comprueba referencias locales, scripts clásicos, ausencia de dependencias de instalación, ausencia de fetch/import/localhost obligatorios, controlador para cada acción visible, SVG locales, paleta, reglas responsive y documentación. Se ejecuta con `python tests/static_check.py` únicamente como herramienta de desarrollo; Python no es requisito para abrir el sistema.

## Limitación de verificación

El navegador integrado de Codex rechazó la navegación directa a `file://`: su política permite solamente `http:` y `https:`. No se abrió un servidor ni se intentó eludir esa política.

**Pendientes de comprobar en un navegador externo:** doble clic real sobre index.html, interacción visual completa entre vistas, mapas/tiles y Material Symbols con CDN, consola del navegador, geolocalización y almacenamiento real bajo file://, layout de escritorio/tablet/móvil a 320 px. El CSS y los respaldos están implementados, pero no se afirma una validación visual que no se realizó.

Los casos funcionales usan datos aislados. La carpeta no contiene pedidos de prueba persistidos para el usuario: inicia con su catálogo y repartidores, y sin pedidos operativos inventados.
