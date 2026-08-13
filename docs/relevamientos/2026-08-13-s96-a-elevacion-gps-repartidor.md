# ELEVACIÓN A LA MESA — EL GPS DEL REPARTIDOR (§9.5, firma founder 12-ago: SE MANTIENE EN v1 Y SE CONSTRUYE)

> Qué es: lo que la firma ordenó elevar ANTES de construir — qué se hereda
> entero, qué hay que cablear, el destino del consumo de la familia, y si
> exige build. **Nada de esto se construyó todavía: espera la firma sobre
> esta elevación.**

## 1 · Lo que se hereda ENTERO (medido, no supuesto)

- **La captura de fondo COMPLETA del paseo**: `apps/prestador/src/lib/track-gps-fondo.ts`
  (TaskManager + `startLocationUpdatesAsync` + servicio con notificación
  honesta + buffer con flush) y su hook `use-track-gps.ts`. Es exactamente
  «un repartidor moviéndose hacia una casa = un paseador moviéndose con un
  perro» — la letra tenía razón: no es construcción nueva.
- **El binario 1.0.5 YA LO TRAE**: el plugin `expo-location` con
  `isAndroidBackgroundLocationEnabled: true` vive en `app.json` del
  prestador desde el tren D-292 y la 1.0.5 lo hereda (medido en el
  app.json vigente). ⇒ **🔴 RESPUESTA A LA PREGUNTA DEL FOUNDER: NO exige
  build nueva. La secuencia del gate NO cambia** — la construcción viaja
  por OTA.
- El filtro de track de `packages/domain` (S81: la pieza única, segmentos,
  CHECK de rango) — el dibujo y el cálculo ya tienen una sola verdad.

## 2 · Lo que hay que CABLEAR (y de quién es)

**Motor (pista A) — una migración chica:**
- `envios.track_gps jsonb` (espejo del paseo: array de puntos `{lat, lon, t}`)
  + `registrar_track_envio(p_envio_id, p_puntos jsonb)` — DEFINER, gate
  `_es_repartidor_del_pedido` (el asignado y nadie más), APPEND con tope,
  válido SOLO entre `hacia_destino` y el estado terminal (fuera de ventana
  rebota hablado). CHECK de rango heredado (la invertida rebota — S81).
- Wrapper `registrarTrackEnvio` en `despensa-repartidor.ts` (misma casa que
  las tres acciones).

**Pantalla (pista C) — un cableo, no una pantalla nueva:**
- En el detalle del repartidor, la captura ARRANCA al marcar «voy hacia
  acá» y PARA al entregar o fallar — el mismo ciclo del Durante del paseo,
  con la misma lib. La notificación honesta del servicio ya existe.

## 3 · El consumo de la familia — QUEDA DECLARADO, y no es decisión nueva

La letra ya lo dijo (S96-DOCS, la muerte escrita de D-770): **«el mapa en
vivo para la familia sigue en v2»**. Esta tanda captura y PERSISTE el
track del envío; ninguna superficie de la familia lo dibuja en v1. El día
del mapa v2, el dato ya va a estar — la misma secuencia lector→pieza que
la casa usa siempre.

## 4 · Costo y riesgo

Una migración + un wrapper + un cableo de pantalla ≈ una tanda corta A+C.
Riesgo declarado: el permiso de ubicación «siempre» del repartidor es el
MISMO que el paseador ya otorga — la voz honesta existe; C la reusa, no la
reescribe.

— pista A, 13-ago-2026. **Espera firma; la construcción no arrancó.**
