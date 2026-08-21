---
name: epetplace-db
description: >-
  Reglas duras de base de datos de e-PetPlace. Cargar SIEMPRE antes de cualquier
  tarea que toque la DB: escribir o ejecutar SQL, crear/editar migraciones, crear
  o modificar RPCs/funciones/triggers/policies RLS, escribir wrappers TS sobre
  RPCs, relevar schema, borrar datos, o diagnosticar errores de PostgREST.
  Trigger en: "migración", "SQL", "RPC", "función", "trigger", "policy", "RLS",
  "SECURITY DEFINER", "wrapper", "supabase", "schema", "tabla", "DROP", "DELETE",
  "information_schema", "pg_get_functiondef".
---

# epetplace-db — Reglas duras de DB (destiladas del CONTRATO_TRABAJO v1.7 + L-NNN del repo prestadores)

Proyecto Supabase: `zyltipqscdsdsxnjclhp` (linkeado en `supabase/`). Postgres 17.

## Quién opera la DB (regla 73)

Las migraciones las **escribe y ejecuta Claude Code** con el schema completo a la vista — jamás imaginar nombres de columnas ni shapes de funciones desde memoria o docs (L-084: la documentación conceptual NO es fuente de verdad de schema; verificar contra `information_schema`). El founder conserva el **gate de aprobación**: para migraciones que tocan datos o modelo, proponer → reportar literal → esperar OK. Toda migración queda versionada en `supabase/migrations/` con el DDL real.

## Antes de escribir SQL

1. **Relevar nombres reales** de columnas con `information_schema.columns` (regla 22, L-057). Incluir `is_generated` y `generation_expression` (L-080).
2. **Relevar CHECKs** de la columna antes de todo INSERT: `pg_get_constraintdef` (L-109). Si aparece 1 constraint en un error, traer TODOS los de la tabla (L-060).
3. **Catálogo antes de hardcodear** (regla 21): si existe tabla `cat_X`, usarla; si el dato es estable y multi-uso, evaluar crear catálogo. Nunca fallback hardcodeado silencioso (regla 36).
4. **Confirmar el body de funciones existentes** con `pg_get_functiondef(oid)` aunque el nombre sugiera el comportamiento (regla 40).

## Privilegios por COLUMNA en `prestadores` (S79 — rige desde que el CONTRATO de LETRA_PERFIL_S79 se aplique)

**`prestadores` tiene privilegios por columna: el SELECT de `authenticated` es por LISTA de columnas, no de tabla** (primer uso del mecanismo en la casa — LETRA_PERFIL_S79 §3bis; nació para que `proposito` y `direccion_envio` no viajen por PostgREST pese a que `prestadores_public` concede la fila entera de los activos). Consecuencias exigibles:

1. **TODA columna nueva de `prestadores` nace SIN grant y es INVISIBLE para `authenticated`** — PostgREST rebota `permission denied` al pedirla — hasta que la migración que la crea la agregue explícitamente con `GRANT SELECT (columna) ON public.prestadores TO authenticated`, o decida A PROPÓSITO no dársela (el caso `proposito`/`direccion_envio`). La decisión se escribe en la migración, jamás se hereda en silencio (misma filosofía que L-140 para funciones).
2. **El síntoma "la columna nueva no lee" en `prestadores` = falta el grant de columna, no un bug de RLS.** Diagnóstico: `SELECT has_column_privilege('authenticated', 'public.prestadores', '<col>', 'SELECT')`.
3. `select('*')` sobre `prestadores` desde un wrapper REBOTA entero (el `*` expande a columnas sin grant) — se seleccionan columnas NOMBRADAS, que ya era la práctica medida (S79-T3.3: cero `select('*')` vivo).
4. UPDATE/INSERT siguen a nivel tabla (la RLS own-row + el trigger D-389 gobiernan filas y columnas protegidas); solo el SELECT es por lista.

## SECURITY DEFINER y tests

- Patrón canónico de RPC: `SECURITY DEFINER` + `SET search_path TO 'public', 'pg_temp'` + gate de auth + helper de acceso + `REVOKE EXECUTE FROM PUBLIC, anon` + `GRANT EXECUTE TO authenticated`.
- **Toda función nueva nace con EXECUTE para `anon` — los default privileges de Supabase lo otorgan en el CREATE, y `REVOKE FROM PUBLIC` NO lo quita** (es un grant explícito en `proacl`, L-140). Ley en dos partes, sin excepción: (1) toda migración que cree una función cierra con `REVOKE EXECUTE ON FUNCTION <firma> FROM PUBLIC, anon;` + el GRANT mínimo que la función necesita; (2) la verificación post-migración incluye `SELECT proacl FROM pg_proc` de CADA función nueva — si aparece `anon=X` sin decisión explícita, la migración está incompleta. Una función legítimamente pública pre-login lleva su `GRANT EXECUTE TO anon` escrito y justificado en la migración, jamás heredado en silencio.
- El SQL Editor / conexión postgres es superuser sin JWT: `auth.uid()` es NULL y **bypassea RLS**. Test válido exige, en el MISMO RUN y con transacción explícita (L-052/L-061):
  ```sql
  BEGIN;
  SET LOCAL request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}';
  SET LOCAL ROLE authenticated;
  -- statements a testear
  COMMIT;
  ```
- **⚠️ `RESET ROLE` bajo `supabase db push` NO vuelve al rol de la migración: vuelve al rol de LOGIN del tool** (S99-A, medido dos veces el mismo día: primero «permission denied for table» en una aserción post-RESET, después «permission denied for schema supabase_migrations» — el propio REGISTRO de la migración falló). Es la clase *«el instrumento respondió sobre otra cosa»* (L-235) en el motor: el RESET funcionó, pero restauró a OTRO rol. **El patrón para toda migración que cambie de rol:** capturar `v_rol_mig text := current_user;` al abrir el DO block y restaurar con `EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);` — jamás `RESET ROLE`. (Por `db query` el mismo SQL puede pasar limpio: los dos caminos tienen roles de login distintos — un fixture verde por una vía no prueba la otra.)
- `now()` es constante dentro de una transacción — no se pueden medir duraciones en un test de bloque único (L-122a). CTEs con efectos secundarios no garantizan orden: tests con efectos van en bloque `DO` imperativo con resultados a tabla (L-073/L-122b). El SQL Editor muestra solo el output del último statement (L-081).
- Éxito de ejecución ≠ corrección de datos: las verificaciones post-test SON el test (L-063).

## DROPs, deletes y renombres

- **Antes de borrar datos**: relevar TODAS las tablas con FK al registro vía `pg_constraint` — RESTRICT bloquea, CASCADE borra sin avisar. Patrón: COUNT por referenciante → `BEGIN ... DELETE ... verificación ... COMMIT/ROLLBACK` (regla 41, L-040/L-047). Ojo con árboles self-referenciales tipo `eventos_mascota.evento_padre_id` (L-118).
- **Antes de DROPear o renombrar una función**: relevar TODOS sus callers contra la DB, no contra memoria: `SELECT proname FROM pg_proc WHERE prosrc LIKE '%<nombre>%'` — y arreglar todos en el mismo bloque (L-120/L-129).
- `CREATE OR REPLACE FUNCTION` con firma distinta NO reemplaza: crea sobrecarga y deja la vieja zombi. Al cambiar parámetros, `DROP FUNCTION` explícito de la firma vieja (L-119).
- **⚠️ TODA MIGRACIÓN QUE RENOMBRE O MUEVA COLUMNAS DECLARA QUÉ BUNDLES VIVOS LA CONSULTAN** (D-662, S88) — igual que declara su veda 76(g) y su reversa. **El repo y el teléfono son DOS versiones de la verdad y una migración mueve solo una**: typecheck, `gen:types` y fixtures pueden estar TODOS verdes porque el repo ya tiene el wrapper nuevo, mientras el bundle publicado consulta la columna que acaba de morir. *El caso: `20260805000000` mató `user_notificacion_prefs.tipo`; el bundle S86 la pedía → 400 permanente en la pantalla de preferencias del cliente — y arrastró la sync de idioma, que viajaba en el mismo `Promise.all` sin haber sido tocada.* **Corolario: si algún bundle vivo la consulta, la migración y su publish son UN SOLO ACTO** — o espera al publish, o se aplica compatible-hacia-atrás y la columna vieja muere en una segunda pasada, después. Misma forma que el acoplamiento del cron de S80: *encender el reloj y aplicar la enmienda son el mismo acto*.

## Wrappers TS (packages/api)

- **Discriminated unions obligatorias**: `ResultadoWrapper<T> = { ok: true; data } | { ok: false; codigo; mensaje }`. Sin string matching de mensajes (regla 35), sin `as` forzados (regla 34), sin `@ts-expect-error` (regla 33).
- Si la RPC levanta errores con sufijo `RAISE EXCEPTION '<codigo>: <detalle>'`, normalizar por `startsWith`, no por igualdad (L-115).
- Guards de shape contra el retorno REAL verificado con `pg_get_functiondef` — nunca calcado de otra familia; los readers devuelven siempre las mismas claves, con `null` sin dato (L-124).
- Build TS verde ≠ contrato real: runtime test E2E no-opcional para wrappers de RPC (L-114, regla 47).
- Tras cambiar RPCs, regenerar tipos: `pnpm --filter @epetplace/api gen:types` (CLI autenticado por keychain — secretos JAMÁS por chat, L-130).

## Motor de pagos y actuadores externos (S101, 21-ago-2026)

Cuatro reglas medidas en producción de staging, cada una con el defecto que las
parió. **Valen para todo motor que reciba un evento de un tercero.**

### 1 · Rechazar, no ignorar — y menos aún ignorar un SUJETO

Un actuador que recibe un evento cuyo **sujeto no conoce** no falla: **lo
IGNORA**. No hay error, no hay log, no hay síntoma — hay silencio con cara de
normalidad.

⇒ **Agregar un sujeto al motor obliga a censar TODOS los consumidores del
evento, no solo la puerta de entrada.** La puerta es lo fácil (una condición y
un `if`); lo que falta suele estar **tres piezas más adelante**, en quien lee el
evento al final.

### 2 · `401` ≠ `503` — la ausencia y la ilegibilidad son distintas

«No hay sesión» es del cliente (**401**). «No pude verificar la sesión» es
nuestro (**503**).

> *Mezclarlos le dice «logueate» a alguien que ya está logueado, y manda a
> soporte a buscar un problema de credenciales que no existe.*

### 3 · El identificador que viaja al tercero es NUESTRO, y se elige por sujeto

`dev_reference` (o su equivalente) **no se hereda del camino viejo**. Si el
motor gana un sujeto nuevo y la referencia sigue armándose con el id del sujeto
anterior, **sale vacía** — *un cobro que sale sin referencia es plata que se
mueve sin traza.*

Lo mismo vale para los **nombres de campo** de una notificación: un campo
llamado `compra_id` que lleva el id de una cita es el mismo defecto, en el
nombre.

### 4 · Persistir ANTES de analizar

Un webhook se **guarda crudo primero** y se analiza después.

**El caso que lo enseñó:** el analizador lanzó por un import faltante → 500 →
el proveedor dejó de reintentar **para siempre**, y del evento no quedó nada.
*Si el crudo se hubiera guardado antes, el bug habría sido una fila para
reprocesar en vez de un evento perdido.*

**Corolario (L-316):** guardar el crudo no alcanza — **todo rechazo destila su
motivo a una columna legible**, jamás NULL (con `http_<status>` como último
recurso). *Un payload `jsonb` no se puede listar, contar ni agrupar, y nadie lo
abre cuando hay una explicación plausible a mano.*

### Y dos que salieron del mismo día, sobre cómo se escriben los guards

- **Cuando el ORDEN importa, se escribe como CINTURÓN y no como nota.** Una
  precondición que vive en un comentario se cumple mientras alguien la lea; una
  que vive en un `DO $$ … RAISE EXCEPTION` **aborta con el agujero todavía
  cerrado**.
- **Un vocabulario cerrado (`CHECK`) no se amplía de paso.** Si el valor que
  necesitás no está, es una decisión de letra — no un valor más que se agrega
  para que la migración pase.

## Diagnóstico

- 404 de PostgREST sobre RPC que existe = schema cache viejo (`NOTIFY pgrst, 'reload schema'`) o proyecto equivocado — verificar el ref ANTES de cada RUN, una sola pestaña/conexión (L-123/L-127). No confiar en el copy genérico del wrapper.
- Contratos entre repos que comparten la DB: cambio de schema exige identificar dependientes, notificar y actualizar el doc maestro correspondiente en el mismo bloque (regla 69).
