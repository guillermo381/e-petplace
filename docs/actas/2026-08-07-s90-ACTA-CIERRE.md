# S90 · ACTA DE CIERRE — LOS PAPELES Y EL TREN DE PUSH (7-ago-2026)

> **Todo lo de abajo está LEÍDO DEL OBJETO al cerrar** (comandos declarados
> fila por fila), jamás de memoria. Los volcados de pista:
> `docs/relevamientos/2026-08-07-s90-a-CIERRE.md` (A) ·
> `…-s90-c-CIERRE.md` (C). B y D no depositaron volcado propio: su trabajo
> vive en sus commits mergeados (verificados por contenido).

## LOS DOS GATES DEL FOUNDER — PASADOS

**① EL PRIMER PUSH REAL EN LAS DOS APPS.** Los dos teléfonos vibraron por
camino real (palabra del founder, brief S91: *«gate del founder cumplido por
camino real: los dos teléfonos vibraron»*):
- **Cliente**: la prueba dirigida de C (`paquete_vence`, bono vivo de Thor,
  voz de `_voz_notificacion`) — despachada por el founder, `entregadas: 1`.
- **Prestador**: la dirigida de A (`cita_solicitada`, cita viva de Thor,
  mismo patrón) — despachada POR EL TICK (job 8), `estado = entregada`
  22:08 UTC, `gate_que_corto: null`. El token del prestador se registró
  SOLO al aplicar el OTA `019fddbf` — el canal nunca estuvo roto: era un
  update sin aplicar.
- **La ley de secuencia SE CUMPLIÓ EN ORDEN** (lector → pieza → gate → el
  UPDATE del flip como último acto). Es el primer canal que la casa abre
  entero — queda como precedente en `MODELO_NOTIFICACIONES` §0ter.
- La fila del estreno `prueba-push-s90c-1` **SE QUEDA** (firma founder,
  pedida cuatro veces: no se borra ni se vuelve a proponer).

**② EL GATE IMPRESO DE LOS CINCO PAPELES — APROBADO, con dos correcciones
YA ejecutadas.** Firmado y no se toca: marca de agua al 6% · filete magenta
· folio en mono · banda de emisor · procedencia fila por fila · título del
certificado a 22pt. Las correcciones: **el aire bajo el filete**
(`AIRE_BAJO_FILETE = 10` en `_shared/papel.ts`, un solo lugar) y **la foto
del carnet escaneado ANEXA al final** (página propia por archivo, rótulo
verbatim «Documento aportado por la familia — no verificado por
e-PetPlace»; medido antes: `evento_vacuna_aplicada.archivo_url` 32/32,
5 archivos, bucket `mascotas`). E2E: carnet de Thor a 2 páginas, 202 KB.

## LO CONSTRUIDO (por pista, mergeado y verificado por contenido)

- **A**: `cat_documentos_mascota` (muere la enumeración a mano: CHECK→FK,
  mapa del wrapper→`funcion` del server) · LA RECETA (las 4 decisiones
  firmadas; fallback del negocio QUE SE DICE impreso) · LA FICHA DE
  IDENTIDAD (ausencias honestas, microchip con alcance en encabezado) · la
  plantilla `_shared/papel.ts` (D-681) con marca de agua vectorial del path
  oficial (D-677) · EL FOLIO fase 1 (`F-YYYY-NNNNNN`, nace con el papel,
  sin QR hasta la landing) · LA FRONTERA ÚNICA de matrícula
  (`_corte_matricula()` = 15-ago, sin reloj: exigido ⟺ nació desde el
  corte; los 16 existentes exentos PARA CITAS para siempre; cinturón
  anti-fecha-propia) · la cura del gate roto de `asignar_cita_a_persona`
  (v_cita fantasma, rojo producido antes) · la lista de papeles derivada
  del CATÁLOGO VIVO en el cliente · el lector+wrapper del picker de receta.
- **B** (2 tandas): la captura de MATRÍCULA en la Hoja del miembro (D-676)
  · la invitación de avisos del prestador (D-680) · el glifo 'receta'
  (cápsula — construido, SIN firma) · la cascada del volcador · las dos
  guardas del cliente (ratificación de mesa sobre b90d8c14).
- **C**: el transporte `despachar-push` (FCM v1) · D-682 tarjeta+chevron ·
  la galería especies-razas (111 objetos, origen-IA firmado, D-288
  enmendada) · la prueba dirigida del cliente · su volcado.
- **D**: EL CERTIFICADO DE SALUD punta a punta (tabla inmutable con emisor
  congelado · matrícula LITERAL sin gracia · memorial estructural · dos
  lectores · su EF y pantalla) — integrado por A al catálogo con
  adaptaciones declaradas (su ⑤ colisionaba en 4 puntos con el estado
  post-orden-1; L-170 en carne: su cinturón se disparó contra su propio
  comentario).

## LOS CONTADORES — re-medidos con su comando

| contador | valor | comando |
|---|---|---|
| migraciones locales | **209** | `ls supabase/migrations/*.sql \| wc -l` |
| remoto | en sync (cada `db push` de hoy aplicó y registró) | `npx supabase migration list --linked` |
| deuda más alta | **D-685** (nace en este cierre: el acuario) | `grep -o 'D-68[0-9]' docs/DEUDAS_CANONICAS.md \| sort -u \| tail -1` |
| catálogo de papeles | 5 filas (certificado `requiere_ref`) | `SELECT codigo, orden FROM cat_documentos_mascota` |
| push_tokens | 2 (cliente + prestador titular) | `SELECT count(*) FROM push_tokens` |
| folios consumidos | secuencia en ~12; emisiones vivas F-000003..6 | `SELECT last_value FROM documento_folio_seq` |
| commits S90 en origin | 16 de A (incl. 3 merges) + 6 mergeados de B/C/D + cierres | `git merge-base --is-ancestor <sha> origin/main` (15/15 verificados en el volcado + `f7e8fc1b` + este) |

## OTAs DEL DÍA (guard `verify-ota` VERDE los tres)

- cliente `558ac817`/`019fddbe…` → **supersedido** por `a8745c47`/
  **`019fde4c-41fe-7af7-989e-2caa39e53fd7`** (runtime 1.0.3 — lista
  derivada del catálogo).
- prestador `67952f31`/**`019fddbf-0062-7e62-aa5d-f47db56012f6`** (runtime
  **1.0.4**; los APK 1.0.3 NO lo reciben — huérfanos declarados).

## LO QUE NO OCURRIÓ, entero

- **El picker de la receta NO tiene superficie** (motor+wrapper listos) —
  prioridad 1 de S91; la fila «Receta» del cliente hoy rebota honesto sin
  salida.
- **Ninguna receta salió con firmante real ni existe certificado real**: 0
  de 16 matrículas cargadas (la captura viaja en `019fddbf`).
- **El agrupador de papeles NO se construyó** (D-683: papel 8; el catálogo
  no tiene columna de categoría — nace con él).
- **El QR de verificación NO existe** (fase 2, espera la landing; solo
  certificado·receta·carnet cuando llegue).
- **El glifo 'receta' sin firma** (préstamo 'caso' vigente) y **falta UN
  glifo** en el cliente (4 filas / 3 dibujos viables, medido).
- **La bitácora universal NO se levantó** (letra firmada; vocabulario 10/10
  `es_seed_preliminar`, 2 conductas caninas, sin columna de especie — se
  firma vocabulario antes; depósito PARCIAL de la letra en
  `docs/relevamientos/2026-08-07-s90-LETRA-bitacora-universal-DEPOSITO-PARCIAL.md`).
- **El acuario NO se modeló** (D-685 nace con su medición: 0 tablas,
  `evento_bitacora_familia.mascota_id` NOT NULL).
- Los **estados S85–S89 del tope del canon** nunca se transpusieron (el
  tope saltaba de S84): S90 entra encima de S84 con el salto DECLARADO —
  sus actas viven en `docs/relevamientos/` y no se reconstruyen de memoria.
- Las verificaciones pendientes de OTROS: C y D deben **verificar y firmar
  las adaptaciones** que A hizo sobre sus literales (lector de receta ·
  sección ⑤ del certificado) — «se verifica y se firma, o se revierte».

## OPERATIVO DE CIERRE

Último hash: **el commit de esta acta** (el anterior: `f7e8fc1b`). Árbol
LIMPIO al escribir. TODO en `origin/main` (verificado con
`merge-base --is-ancestor`, 15/15 + cierres). `_mapeo.json` **RESCATADO**
del scratchpad de C → `supabase/dev/mapeo-razas-especies.json` (105 filas,
14 carpetas con acento/ñ — el dato que un des-slug fabrica mal; incluye 5
reptil no publicadas y 1 colisión declarada). Regla 87: esta pista no tocó
ningún aparato en toda la sesión.
