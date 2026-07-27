# S79-A · Tanda 3 — VERIFICACIÓN Y MEDICIONES PRE-APLICACIÓN (27 Jul 2026)

**El CONTRATO de la letra NO se aplicó. Cero columnas nuevas** (verificable
contra `information_schema` — igual que al cierre de la Tanda 2). Proyecto
vigente confirmado por medición: **`zyltipqscdsdsxnjclhp`** (§T3.5).
Regla dura cumplida: ningún valor de secret impreso, ni completo ni parcial.

---

## T3.1 — La sonda de Places: el guard se apagó; ahora rebota GOOGLE

| Caso | Tanda 2 | AHORA |
|---|---|---|
| Sin JWT | 401 | **401** ✓ |
| Con JWT, `buscar` "Av. de los Shyris, Quito" | 503 `sin_configuracion` | **502 `google_rechazo` — mensaje EXACTO: `{"codigo":"google_rechazo","mensaje":"Places respondió 403."}`** |
| Con JWT, `resolver` | 503 | *(mismo camino — el 403 es de Google, no nuestro)* |
| Con JWT, body malformado | 503 | **400 `entrada_invalida` ("Falta el token de sesión.")** ✓ |

**Criterio (b): CUMPLIDO** — el 400 alcanzable prueba que el secret existe
en el proyecto correcto y el guard de configuración se apagó.
**Criterio (a): NO cumplido** — no hay predicciones: **Google rechaza la
key con 403**. Como anticipó el mandato, ya no es el secret — es la key.
Las tres causas posibles, en orden de probabilidad para el founder (todas
viven en SU consola, no medibles desde acá):

1. **La key tiene restricción de aplicación Android** (package + SHA-1 —
   el perfil exacto de la key D-289). Una key así REBOTA toda llamada
   server-side: la Edge Function llama desde Deno sin headers de app
   Android. La key del secret debe ser una key SEPARADA, sin restricción
   de aplicación (o restringida por API), con **Places API (New)** como
   única API permitida.
2. **Places API (New) no habilitada** en el proyecto de Google de esa key
   (la API "Places API" vieja NO alcanza — los endpoints
   `places.googleapis.com/v1` son de la New).
3. Billing del proyecto de Google.

El detalle fino del 403 quedó en los logs de la función (el body de
Google se loggea server-side; visible en el dashboard de Supabase →
Functions → lugares → logs).

> **ADDENDUM (misma fecha, re-sonda pedida por la mesa): EL 403 MURIÓ —
> PLACES ESTÁ VIVO DE PUNTA A PUNTA.** El founder tocó la consola y la
> re-sonda dio los CUATRO casos en verde:
> · sin JWT → **401** ✓
> · `buscar` "Av. de los Shyris, Quito" → **200 con 3 predicciones
>   REALES** (place_ids de Google, texto principal/secundario separados)
> · `resolver` la predicción con la MISMA sesión (el cierre con Details
>   del contrato) → **200**: `{"direccion":"170135 Quito, Ecuador",
>   "ciudad":"Quito","lat":-0.17277…,"lon":-78.48045…}` — la ciudad
>   salió de `locality` y las coordenadas son REALES (coherentes con las
>   de Satori/Carlos medidas en T1: −0.17/−78.48, pleno Quito)
> · body malformado → **400 `entrada_invalida`** ✓
> **Criterios (a) y (b): CUMPLIDOS.** Consecuencia inmediata: la captura
> del hogar (A4, cliente) queda operativa E2E sin ningún deploy — y la
> superficie de la sede de B nace contra un contrato que ya devuelve
> datos vivos. D-557 (la key expuesta) NO cambia: la rotación sigue
> pendiente de confirmación del founder.

## T3.2 — Medición (a): el alta de prestador NO captura geo — porque EL ALTA NO EXISTE en el monorepo

Literal, punta a punta:

- **`crear_prestador_inicial`: CERO callers en el monorepo** (grep
  completo de `packages/api` + `apps`, excluido `database.types`). Cero.
- **`wizard_crear_cuenta_y_rol` (body leído entero, `pg_get_functiondef`):
  SÍ acepta y propaga TODO el paquete geo** — `p_direccion, p_sector,
  p_lat, p_lon, p_radio_cobertura_km` viajan a `crear_prestador_inicial`
  tal cual. Pero **también tiene CERO callers en el monorepo**. Ambas son
  la vía del portal legado — que NO está desplegado (enmienda D-471 S79).
- **La pantalla viva del monorepo** (`cuenta-comercial/nueva.tsx`) llama
  `crearCuentaComercialInicial` → RPC `crear_cuenta_comercial_inicial`:
  crea SOLO la cuenta fiscal. **Ninguna superficie viva crea la fila de
  `prestadores`.**
- **El alta real hoy es MANUAL**: la landing `solicitar-acceso.tsx` abre
  WhatsApp al equipo (D-399, decisión S54: alta solo admin/manual en F1).
- Y el cierre del círculo (medido en T1-A7 y ratificado): la pantalla de
  perfil NO edita `direccion`/`ciudad` (whitelist de
  `actualizarPerfilPrestador`: descripcion/contacto/logo) y R1 ni siquiera
  trae lat/lon/radio.

**Conclusión de la medición (sin cura, como manda la tanda):** al aplicar
el contrato, TODO prestador nuevo nace `radio NULL + lat/lon NULL` por
CUALQUIER vía (la manual incluida — un INSERT a mano hereda la ausencia
de default), y **no existe superficie que capture NI corrija** esos
campos. Por la firma (§2.2), los 15 fundadores nacerían **invisibles por
geografía y sin camino de arreglo**. La medición CONFIRMA la condición
del mandato: **el contrato espera la firma Y la superficie de captura del
prestador** (territorio B: la sede sobre el contrato `lugares.ts`, que
está publicado y estable desde la Tanda 2).

## T3.3 — Medición (b): `prestadores_public` SÍ expone fila entera

`pg_policies` literal sobre `prestadores` (6 policies; las SELECT-capaces):

| Policy | cmd | roles | qual |
|---|---|---|---|
| **`prestadores_public`** | SELECT | authenticated | `estado='activo' OR user_id=auth.uid() OR is_admin()` |
| `prestador_own_profile` | ALL | authenticated | `user_id=auth.uid() OR is_admin()` |
| `prestadores_admin` | ALL | authenticated | `is_admin()` |
| (+3 INSERT: self ×2, cuenta_propia) | | | |

**Respuesta: SÍ — `prestadores_public` concede SELECT de FILA ENTERA a
todo `authenticated`** sobre los prestadores activos. `anon` tiene grant
de TABLA (`anon=arwdDxtm`, el default de Supabase) pero CERO policies lo
nombran ⇒ RLS default-deny: anon lee 0 filas (verificado por el modelo;
la vista era su única vía y A0 la cerró). El `Pick` de 17 columnas de R1
es TypeScript — no frontera: con las columnas nuevas, `proposito` y
`direccion_envio` serían legibles por cualquier logueado vía PostgREST.

**Privilegios por columna en la casa: CERO** — `pg_attribute.attacl` está
vacío en todo `public` (tablas y vistas). El mecanismo no se usa; el
paquete gated sería su primer uso.

**Compatibilidad del REVOKE por columna, MEDIDA:** cero `select('*')`
sobre `prestadores` en los wrappers vivos — los 8 lectores seleccionan
columnas nombradas (`COLUMNAS_MI_PRESTADOR`, `id, nombre_comercial`,
`modo_horarios`, `expone_personas`, etc.).

**PROPUESTO (NO aplicado) — entró al paquete gated como pieza 5 del
CONTRATO:** `REVOKE SELECT ON prestadores FROM authenticated` + `GRANT
SELECT (…las 36 columnas menos proposito y direccion_envio…)`. Lectores
legítimos que quedan: el TITULAR lee su `proposito` vía
`registrar_primer_ingreso()` (DEFINER — la bienvenida lo recibe en la
misma respuesta, cero lector extra) y lo escribe por whitelist;
`direccion_envio` la lee solo founder/admin (service_role o DEFINER
`is_admin()` si una superficie lo pide). Verificación agregada al DO
block del contrato (`has_column_privilege` en ambos sentidos). Detalle y
alternativa declarada (tabla aparte) en LETRA §3bis.

## T3.4 — Las dos enmiendas: LETRA v1.1 + CONTRATO + REVERSA (cero DDL)

1. **§4 — `sin_prestador` DEJÓ de ser excepción.** El empleado sin fila
   propia (todo `prestador_empleados` — Aurora tiene dos activos) recibe
   `{ok:true, es_primer_ingreso:false, primer_ingreso_en:null}`; la única
   excepción es `auth_required`. Declarado en §4: la RPC no exige que el
   caller resuelva titularidad antes — el acoplamiento A↔B se eliminó.
   Corregidos LOS TRES: letra §4 · CONTRATO (body nuevo, + `proposito` en
   la respuesta del titular) · REVERSA (verificada: su reversa es el DROP
   entero — se anotó que v1.1 no la cambia, con su porqué).
2. **§7 reescrita — la expiración perezosa entra AL GATE.** El hueco:
   `_trg_ps_verificacion_profesional` lee `estado` crudo ⇒ un título
   vencido seguiría activando ofertas médicas. La v1.1: el trigger deriva
   vigencia (`estado='aprobado' AND (fecha_vencimiento IS NULL OR >=
   current_date)`), los lectores de UI derivan lo mismo, `'vencido'`
   queda como asiento manual de admin, y la limitación de las ofertas
   YA-activas quedó DECLARADA con sus tres salidas (barrido/cron ·
   condición en las lectoras de oferta · revisión admin) a decisión del
   founder. Sigue siendo PROPUESTA, cero código.

## T3.5 — La deuda de la key + el incidente de los dos proyectos

- **D-557 DEPOSITADA** (familia D-289/D-293): una key de Google pasó por
  el canal de la mesa; estado **pendiente de confirmación del founder**
  (rotada / por rotar). Con su lección de método: **las credenciales van
  del navegador a la terminal directo, jamás al chat — la mesa nunca
  necesita el valor de un secret** (necesita nombre, proyecto y
  existencia; las sondas se hacen sin imprimirlo, como en esta tanda).
- **El incidente de los dos proyectos, confirmado y por escrito:** los
  secrets estuvieron yendo a `fdgocvplonivuejcmtbq`; las funciones y la
  DB viven en **`zyltipqscdsdsxnjclhp`**. Medido: `supabase/.temp/
  project-ref` = `zyltipqscdsdsxnjclhp` · la URL de `.env.local` de
  ambas apps apunta a `zyltipqscdsdsxnjclhp` · la sonda T3.1 corrió
  contra esa URL y encontró el secret (criterio b) ⇒ el secret quedó en
  el proyecto correcto. **Las 3 migraciones de S79
  (`20260727150000` · `160000` · `170000`) corrieron con `--linked`
  contra `zyltipqscdsdsxnjclhp`** — el proyecto del canon. Qué es
  `fdgocvplonivuejcmtbq` y si quedó algo adentro: pregunta abierta al
  founder (no medible desde este repo; anotada en D-557).

---

## EL FRENO (donde manda el mandato)

El CONTRATO v1.1 espera **DOS** cosas, ahora las dos por escrito:
1. **La firma del founder** sobre LETRA_PERFIL_S79 v1.1.
2. **La superficie de captura del prestador** (T3.2: sin ella, los
   fundadores nacen invisibles sin arreglo — territorio B, sobre el
   contrato `lugares.ts` ya publicado).

Y para que la sonda (a) pase: la key del secret debe ser server-side con
Places API (New) habilitada — las tres causas del 403 están arriba, todas
en la consola del founder.
