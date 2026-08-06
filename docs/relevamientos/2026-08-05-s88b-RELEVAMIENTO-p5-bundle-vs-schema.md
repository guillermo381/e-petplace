# S88-B · RELEVAMIENTO P5 — ¿es medible «ningún bundle publicado consulta un objeto que una migración movió»?

> **VEREDICTO: SÍ, ES MEDIBLE DESDE ACÁ — probado contra el caso vivo.**
> Con un refinamiento de forma que es el hallazgo central: **se mide
> contra el SCHEMA VIVO, no contra las migraciones posteriores.**
>
> **HALLAZGOS, NUNCA VEREDICTOS de construcción:** P5 **NO queda
> registrada** con este depósito — el instrumento merece la misma
> disciplina que los otros cuatro (fixtures por brazo, direcciones A/B,
> rojo producido antes) y eso es un encargo propio, no un párrafo al
> pasar. Esto contesta la pregunta de la mesa: *si es medible con lo que
> hay*. Lo es.

---

## 1 · EL CASO VIVO, reproducido paso a paso (el discriminador)

La pantalla de preferencias del cliente rota en producción:

1. **La migración que movió el objeto:**
   `20260805000000_lote1_contrato_preferencias.sql` — la tabla vieja pasó
   a `user_notificacion_prefs_legacy` y la NUEVA `user_notificacion_prefs`
   tiene `(user_id, categoria, canal, habilitada, evidencia)`. **La
   columna `tipo` ya no existe.**
2. **El ancla del bundle servido S86:** `9e83b6d` (group `38e99a4e` del
   canal preview del cliente — era la cabeza hasta que A/C publicaron la
   cura «preferencias sobre el contrato nuevo»).
3. **El árbol del ancla, greppeado:**
   `git grep 'user_notificacion_prefs' 9e83b6d -- packages/api` →
   `preferencias.ts:32`: `.from('user_notificacion_prefs').select('tipo, habilitada')`
   — y el upsert con `{tipo}` + `onConflict: 'user_id,tipo'`.
4. **El schema VIVO:** `information_schema.columns` para esa tabla →
   `tipo` **☠️ NO EXISTE** · `habilitada` existe · `user_id` existe.

**⇒ ROJO exacto, con el trío que un guard tiene que nombrar: (bundle
`9e83b6d` · tabla `user_notificacion_prefs` · columna `tipo`).** El
método habría cazado la rotura el día que la migración corrió — no el
día que un dedo abrió Preferencias.

## 2 · EL REFINAMIENTO DE FORMA — por qué schema vivo y no «migraciones posteriores»

La sugerencia de mesa era `ancla vs migraciones posteriores`. Es medible
pero **más débil que medir contra el schema vivo**, y este caso lo
prueba: la migración **no renombró a secas — RECREÓ** (vieja → `_legacy`,
nueva con el MISMO nombre y otro contrato). Un análisis de DDL a nivel
objeto diría «`user_notificacion_prefs` sigue existiendo» y pasaría
verde; **la rotura es de COLUMNA**. El schema vivo la ve sin parsear una
sola línea de DDL:

> **bundle ancla (qué consulta) × schema vivo (qué existe) = la rotura,
> a nivel columna, cubriendo rename, drop y recreación por igual.**

Y hay un **brazo barato de yapa**: los `.rpc('nombre')` del árbol del
ancla contra `pg_proc` — una RPC jubilada por una migración es la misma
clase de rotura y se verifica con un `EXISTS`.

## 3 · QUÉ NECESITA, medido

| pieza | ¿está? |
|---|---|
| el ancla del bundle servido | **SÍ** — `eas update:view <group> --json` da `gitCommitHash`. ⚠️ `update:list` NO lo da (método §2, deber ③) — **este probe leyó el ancla del TEXTO del `--message`**, que es exactamente la etiqueta auto-escrita contra la que §2-⑤ advierte; sirvió para el probe, **jamás para el guard** |
| el árbol del ancla | **SÍ** — `git cat-file`/`git grep <sha>` (regla 84 ②: por contenido) |
| qué consulta el bundle | **SÍ, y barato POR LA PUERTA ÚNICA**: las apps jamás llaman `supabase.from()` directo ⇒ **solo hay que extraer literales de `packages/api`** (`.from('t')` · `.select('…')` · `.eq('c')` · `onConflict`) — la disciplina de la casa achica el corpus a un solo paquete |
| el schema vivo | **SÍ** — `information_schema` por el canal de la casa (`lib-db.mjs`) |
| dónde corre | **paso ⓪ / cierre, al lado de `verify-ota`** — necesita red (eas + DB): jamás en el hook. Es la mitad que a `verify-ota` le falta por diseño: aquél prueba que el update SE SIRVE; esto prueba que **lo servido no consulta fantasmas** |
| en el registro del censo | necesita un **ensanche declarado**: `medir` hoy recibe `{dbQuery, leer}` — le falta `exec` (git y eas). Chico, y con su fixture |

## 4 · LÍMITES DECLARADOS (dirección A: decir de menos, dicho antes)

- **Literales solamente**: una tabla/columna construida dinámicamente es
  invisible al grep. Censo de hoy: los wrappers usan literales — pero el
  guard tiene que declarar este alcance en su salida.
- **Embeds** (`select('rel(col1, col2)')`) se parsean a medias — v1
  puede cubrir el primer nivel y DECLARAR el resto fuera.
- **Falsos positivos posibles** (dirección B): un string que coincide
  con un nombre de columna en otro contexto. Mitigación: el par se
  cuenta solo si el MISMO archivo menciona la tabla — y las EXENTAS por
  sitio existen para el residuo.
- **Qué bundles**: v1 = la cabeza servida por runtime con binario
  (los mismos que `verify-ota` ya enumera). Los aparatos con bundle
  viejo SIN aplicar (D-650) quedan fuera del alcance — se declara.

## 5 · LO QUE ESTE RELEVAMIENTO NO HIZO, declarado

No construyó el extractor ni registró P5 — la adjudicación es de la
mesa. No midió el lado prestador (mismo método, mismo costo). No
enumeró cuántos pares (tabla, columna) tiene hoy `packages/api` (el
costo real del extractor se mide ahí; a ojo por la puerta única: un
solo paquete, decenas de wrappers, cero queries en apps).
