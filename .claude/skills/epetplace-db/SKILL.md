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
- `now()` es constante dentro de una transacción — no se pueden medir duraciones en un test de bloque único (L-122a). CTEs con efectos secundarios no garantizan orden: tests con efectos van en bloque `DO` imperativo con resultados a tabla (L-073/L-122b). El SQL Editor muestra solo el output del último statement (L-081).
- Éxito de ejecución ≠ corrección de datos: las verificaciones post-test SON el test (L-063).

## DROPs, deletes y renombres

- **Antes de borrar datos**: relevar TODAS las tablas con FK al registro vía `pg_constraint` — RESTRICT bloquea, CASCADE borra sin avisar. Patrón: COUNT por referenciante → `BEGIN ... DELETE ... verificación ... COMMIT/ROLLBACK` (regla 41, L-040/L-047). Ojo con árboles self-referenciales tipo `eventos_mascota.evento_padre_id` (L-118).
- **Antes de DROPear o renombrar una función**: relevar TODOS sus callers contra la DB, no contra memoria: `SELECT proname FROM pg_proc WHERE prosrc LIKE '%<nombre>%'` — y arreglar todos en el mismo bloque (L-120/L-129).
- `CREATE OR REPLACE FUNCTION` con firma distinta NO reemplaza: crea sobrecarga y deja la vieja zombi. Al cambiar parámetros, `DROP FUNCTION` explícito de la firma vieja (L-119).

## Wrappers TS (packages/api)

- **Discriminated unions obligatorias**: `ResultadoWrapper<T> = { ok: true; data } | { ok: false; codigo; mensaje }`. Sin string matching de mensajes (regla 35), sin `as` forzados (regla 34), sin `@ts-expect-error` (regla 33).
- Si la RPC levanta errores con sufijo `RAISE EXCEPTION '<codigo>: <detalle>'`, normalizar por `startsWith`, no por igualdad (L-115).
- Guards de shape contra el retorno REAL verificado con `pg_get_functiondef` — nunca calcado de otra familia; los readers devuelven siempre las mismas claves, con `null` sin dato (L-124).
- Build TS verde ≠ contrato real: runtime test E2E no-opcional para wrappers de RPC (L-114, regla 47).
- Tras cambiar RPCs, regenerar tipos: `pnpm --filter @epetplace/api gen:types` (CLI autenticado por keychain — secretos JAMÁS por chat, L-130).

## Diagnóstico

- 404 de PostgREST sobre RPC que existe = schema cache viejo (`NOTIFY pgrst, 'reload schema'`) o proyecto equivocado — verificar el ref ANTES de cada RUN, una sola pestaña/conexión (L-123/L-127). No confiar en el copy genérico del wrapper.
- Contratos entre repos que comparten la DB: cambio de schema exige identificar dependientes, notificar y actualizar el doc maestro correspondiente en el mismo bloque (regla 69).
