# S81-B1 — Que se vea el mapa, y que el recorrido no mienta (tanda B-S81-1)

**Fecha:** 28/29-jul-2026 · **Sesión B** · typechecks ui/prestador/cliente VERDES.
Compañero de este reporte: `2026-07-29-s81-R3-manifest.md` (el relevamiento que
esta tanda consume — APK instalado medido byte a byte).

---

## 1. La build con la key — CUMPLIDO POR MEDICIÓN, sin rebuild

**La premisa del ítem venía de antes del flip B19.** R3 §3bis lo midió directo:
el APK instalado en R5CY201ZDVL es **byte-idéntico** a `build-s80-b19.apk`
(md5 `2a369b19c6e125253cf728da9f9513e4` en ambos), con
`com.google.android.geo.API_KEY` **presente y no vacía** en el manifest
(aapt2, meta-data line=100), versionName 1.0.3. El roto (`build-1785163333370`,
md5 `5a30…`) está FUERA del dispositivo. Y §3d midió **cero cambios de
superficie nativa** entre el build y HEAD — rebuildear hoy produciría el mismo
artefacto. **No se quemó una corrida de build para producir lo que ya está
instalado y verificado.** El guard queda VIVO (`mapa-nativo.ts`, flag `true`).

### El checklist D-574 — PRIMERA CORRIDA, sobre build-s80-b19

Censo de env de build (grep `process.env.` en app.config + src de prestador +
packages consumidos): **4 variables**. Qué exigía y qué encontró, medido en el
APK instalado:

| Variable | Rol | Veredicto en el artefacto |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | meta-data del manifest (app.config.ts:22) | **ENCONTRADA** — geo.API_KEY presente, 39 chars `AIza…` (literal no depositado, D-557) |
| `EXPO_PUBLIC_SUPABASE_URL` | horneada en el bundle JS | **ENCONTRADA** — `zyltipqscdsdsxnjclhp` presente en `index.android.bundle` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | horneada en el bundle JS | **ENCONTRADA** — JWT `eyJhbGciOiJIUzI1NiI…` presente (la anon key es pública por diseño) |
| `EXPO_PUBLIC_GPS_FAKE` | toggle dev, gated por `__DEV__` | NO es secret de build — ausencia correcta |

**4/4 encontradas. La build se declara distribuible por el checklist.**
Recordatorio medido en R3 §3c: el APK roto y el sano comparten versionName Y
versionCode — la versión no puede hacer de testigo; el manifest sí.

## 2. La voz del guard — reescrita, segunda mitad INTACTA

Primera corrección (R3 §4): la voz depositada nunca dijo "Android" — decía
*"no está disponible en esta versión de la app"*, que suena a función que no
llegó (el diagnóstico del founder aplica igual). Lo depositado ahora
(`es.ts` / `en.ts`, key `cita.mapaApagadoVivo` / `mapaApagadoCerrado`):

> **es:** "Esta instalación de la app salió sin la clave del mapa — se corrige
> con una versión nueva. *El recorrido se sigue grabando igual.*" / "…*El
> recorrido quedó grabado.*"
> **en:** "This install of the app came without the map key — a new version
> fixes it. *The route is still being recorded.*" / "…*The route was recorded.*"

Las segundas mitades: byte-idénticas a las de S80. **GATE PENDIENTE (lote
S81)** — marcado en los diccionarios. Nota: con el flag en `true`, la voz hoy
no se muestra; reaparece solo si una build futura sale sin el secret.

## 3. El filtro del dibujo (D-578 ①②) — construido y MEDIDO

`packages/ui/src/components/MapaRecorrido.filtro.ts` (compartido componente ↔
script de medición — un solo juez):

- **(a)** orden por `t` antes de trazar (sort estable; sin `t` no se inventa orden);
- **(b)** descarte SOLO si LAS DOS aristas del punto (llegada y salida) superan
  **15 m/s**; primer/último punto tienen una arista → jamás caen; sin `t` =
  no computable = no excede;
- **(c)** `fitToCoordinates` (y el seguimiento en vivo) consumen el set
  filtrado — `MapaRecorrido.tsx` deriva TODO de `filtrarTrackDibujo(puntos)`;
- **(d)** el crudo NO se toca: el filtro corre al dibujar; props y DB intactas.

### La medición — TODOS los tracks reales de la DB (12 con puntos)

| track (8) | estado | total → quedan | desc. | % | arista máx (m) |
|---|---|---|---|---|---|
| f7576bec | registrado | 10 → 10 | 0 | 0% | 42 |
| 0d9d733d | registrado | 6 → 6 | 0 | 0% | 269 |
| 6 tracks de 1 punto | registrado | 1 → 1 | 0 | 0% | — |
| f90472c9 | registrado | 10 → 10 | 0 | 0% | 478 |
| 4e12c7c8 | registrado | 417 → 414 | 3 | 0,7% | 255 |
| 5bc99485 | registrado | 405 → 404 | 1 | 0,2% | 735 |
| 22793295 | *(null)* | 501 → 479 | 22 | 4,4% | **1.137** |

**GLOBAL: 1.355 puntos · 26 descartados · 1,92%.** Un puñado — **el umbral 15
m/s QUEDA, no se recalibra** (regla de la tanda, L-131). Y el veredicto fino:
**los 26 descartados tienen SUS DOS aristas entre 15,8 y 108,9 m/s** (57–392
km/h) — ningún punto de caminata real (~1,5 m/s) fue condenado; los descartes
son exactamente los teletransportes. Los tracks `5bc99485` y `22793295` son
**del 29-jul ~00:05–01:35 UTC (19:05–20:35 EC del 28)** — el paseo real del
founder que parió D-578: la púa de 1,1 km cae entera.

Datos laterales medidos: **desorden por `t` en el crudo = 0 en los 12 tracks**
(el sort es red, no cura activa hoy) · `22793295` tiene 501 puntos y
`gps_estado` **null** (rareza de dato — anotada, no curada: cero migración en
esta tanda) · la key del jsonb es **`t`** (confirmado en dato vivo).

### La cadena del `t` — qué se curó en territorio B

El punto crudo siempre tuvo `t`; el camino vivo lo AMPUTABA dos veces. Curado:
`track-gps-fondo.ts` (la sesión conserva el punto entero — buffer y
`puntosSesion` comparten objeto), `use-track-gps.ts` (tipos a `PuntoGpsPaseo`)
y `durante.tsx` (el `.map` que tiraba `t` del track previo, muerto). El camino
FAKE de dev hereda `t` gratis (pasa por `aceptarPunto`).

## 4. El censo — COMPARTIDO, con un agujero en el lado cliente

**MapaRecorrido NO está duplicado**: vive solo en `packages/ui`
(`MapaRecorrido.tsx` + `.web.tsx` placeholder + `.tipos.ts`), 3 consumidores
(`cliente/paseo/[atencionId]` · `prestador/durante` · `prestador/cierre`). El
filtro va UNA vez y rige en las dos apps. **Declarado: es candidato a 2º
COMPONENTE DE DOMINIO después de FilaCita — NO se decide en esta tanda**
(mandato literal).

**⚠️ PERO el cliente hoy alimenta el mapa SIN `t` — y eso es territorio A
(regla 76: packages/api + cliente).** Medido: `timeline.ts:441` normaliza el
punto leyendo `o.ts`, y la key real del jsonb es `t` (dato vivo de esta
medición) ⇒ el timestamp SE PIERDE en la normalización y el filtro queda MUDO
en el detalle del paseo del cliente (regla (d): sin `t` no se descarta nada).
El prestador queda cubierto entero; el cliente sigue viendo la púa hasta esta
cura de UNA línea.

### PEDIDO A LA SESIÓN A (autocontenido, regla 76/S54)

> En `packages/api/src/wrappers/timeline.ts`:
> 1. `interface PuntoTrack` (línea ~227): agregar `t?: string;` (conservar
>    `ts?: string` si algún lector lo usa; censo rápido: solo lo produce esta
>    normalización).
> 2. En la normalización del track (línea ~441), reemplazar:
>    `track.push({ lat: o.lat, lng: o.lng, ...(typeof o.ts === 'string' ? { ts: o.ts } : null) });`
>    por:
>    `track.push({ lat: o.lat, lng: o.lng, ...(typeof o.t === 'string' ? { t: o.t } : typeof o.ts === 'string' ? { t: o.ts } : null) });`
> 3. Porqué medido: la key real del jsonb de `eventos_mascota_paseo.track_gps`
>    es `t` (registrador vivo `track-gps-fondo.ts` y los 12 tracks de DB lo
>    confirman); `o.ts` no matchea nunca. `MapaRecorrido` (S81-B1) filtra púas
>    por velocidad SOLO si el punto trae `t` — sin esta línea, el filtro es
>    mudo en el cliente. Cero cambio de firma, cero DB.

## Fuera de alcance — honrado

Craft del mapa (sin bordes, pantalla completa): NO tocado — espera boceto M1 +
gate founder. Cero migración (la consulta de medición fue solo lectura). La
rareza `gps_estado=null` de `22793295` queda anotada arriba, sin cura.

## Gates pendientes de esta tanda

1. **El gate en dispositivo: el durante del paseo con mapa vivo** (el mandato
   de la tanda) — el APK instalado ya tiene la key; el filtro y la cadena del
   `t` viajan por OTA. ⚠️ Regla en piedra S78: el OTA para la APK 1.0.3 se
   publica contra runtime **1.0.3**.
2. El gate del lote de strings S81 (la voz nueva del guard, es+en).
