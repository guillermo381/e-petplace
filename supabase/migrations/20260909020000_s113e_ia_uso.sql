-- ═══════════════════════════════════════════════════════════════════════════
-- S113-E · `public.ia_uso` — LA TABLA DE USO DE INFERENCIA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 ESTE ARCHIVO NO TIENE NÚMERO A PROPÓSITO. Lo asigna A con
--    `pnpm proximo:migracion` y lo mueve a
--    `supabase/migrations/<numero>_ia_uso.sql`.
--    Razón declarada: E no aplica migraciones, y un archivo sin timestamp de
--    14 dígitos dentro de `supabase/migrations/` es comportamiento NO MEDIDO
--    para `db push` (`verify:migraciones` sólo emite un warning y sigue). No
--    lo dejo ahí para no envenenar el push de otra pista.
--
-- ── POR QUÉ EXISTE (D-1008, medido por A en `S113-RELEVAMIENTO.md` §3.5) ───
-- **Cero telemetría de IA.** Las cuatro edge functions que llaman a Anthropic
-- (`extract-vacuna`, `extract-documento`, `estructurar-nota-clinica`,
-- `escribir-presencia`) son sin estado: `0` inserts cada una, `0` hits de
-- `usage` / `input_tokens` / `output_tokens`. **No hay forma de saber cuántas
-- llamadas hubo, cuántos tokens costaron ni cuánta plata se fue.**
--
-- *Una pieza de IA sin registro de uso no es cara ni barata: es inauditable.*
--
-- ── VEDA 76(g) ─────────────────────────────────────────────────────────────
-- **NO RIGE.** DDL puramente aditiva: crea una tabla nueva, sus índices, sus
-- policies y una vista sobre ella. Cero backfill, cero ancla, cero UPDATE
-- sobre datos vivos, cero objeto preexistente tocado.
--
-- ── BUNDLES VIVOS QUE LA CONSULTAN (D-662) ────────────────────────────────
-- **NINGUNO.** La tabla nace sin lector en las apps: el único escritor previsto
-- es la librería de D corriendo dentro de las edge functions con
-- `service_role`, y el único lector previsto es el admin. No hay acoplamiento
-- migración↔publish.
--
-- ── PRIVACIDAD, que es la razón de la forma de la tabla ───────────────────
-- **No hay `mascota_id`, ni `user_id`, ni `familia_id`, ni una sola columna de
-- texto libre.** Ni el prompt, ni la respuesta, ni un fragmento. La tabla mide
-- CUÁNTO costó una pieza, jamás SOBRE QUIÉN corrió.
-- *Una tabla de costo que guarda a quién midió deja de ser telemetría y pasa a
-- ser un expediente paralelo, con otra RLS y otra ley.*
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE public.ia_uso (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Qué pieza de producto llamó (p.ej. 'carnet', 'raza', 'nota_clinica').
  pieza                   text        NOT NULL,
  -- Modelo exacto, tal cual se mandó en el request.
  modelo                  text        NOT NULL,
  -- Edge function que originó la llamada.
  edge                    text        NOT NULL,

  resultado               text        NOT NULL
    CHECK (resultado IN ('ok','timeout','error_proveedor','error_parseo','rechazo')),

  tokens_entrada          int,
  tokens_salida           int,
  tokens_cache_lectura    int,
  tokens_cache_escritura  int,

  latencia_ms             int,
  costo_estimado_usd      numeric(10,6),

  created_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ia_uso IS
  'S113-E · Uso y costo de inferencia por llamada. SIN datos personales: no '
  'lleva mascota_id, user_id ni texto. Escribe service_role desde las edge; '
  'lee el admin por is_admin(), la misma vía que audit_log.';

COMMENT ON COLUMN public.ia_uso.costo_estimado_usd IS
  'ESTIMADO, no facturado: se calcula con la tabla de precios del repo '
  '(packages/ia/precios.ts). Diverge de la factura si el precio cambió y la '
  'tabla no se actualizó — por eso la tabla de precios lleva fecha de '
  'verificación.';

-- ── ÍNDICES: los dos que sirven a la consulta de costo por pieza y por día ──
CREATE INDEX ia_uso_created_at_idx ON public.ia_uso (created_at DESC);
CREATE INDEX ia_uso_pieza_modelo_idx ON public.ia_uso (pieza, modelo, created_at DESC);

-- ═══ RLS ═══════════════════════════════════════════════════════════════════
-- Contrato: **nadie lee ni escribe salvo `service_role`**; el admin LEE por la
-- misma vía que lee las otras tablas de operación.
--
-- MEDIDO (3-sep-2026) para saber cuál es «la misma vía», no supuesto:
--   audit_log              SELECT · TO authenticated · USING (is_admin())
--   wearable_telemetry     SELECT · TO authenticated · USING (... OR is_admin())
--   prestador_atencion_log SELECT · TO authenticated · USING (is_admin() OR ...)
-- ⇒ el patrón de la casa es una policy de SELECT `TO authenticated` con
--   `is_admin()`. `ia_uso` usa ESE, sin la pata de dueño (no hay dueño: no hay
--   sujeto).
--
-- 🔴 Y una diferencia deliberada con `audit_log`: aquella concede `SELECT` de
--    tabla a `anon` (grant heredado; su policy lo salva). Acá `anon` no recibe
--    NADA — ni grant. *Un grant que sólo una policy contiene es una puerta con
--    un solo cerrojo.*
ALTER TABLE public.ia_uso ENABLE ROW LEVEL SECURITY;

-- El admin lee. Nadie más, por ninguna vía de PostgREST.
CREATE POLICY ia_uso_admin_select ON public.ia_uso
  FOR SELECT TO authenticated
  USING (is_admin());

-- NO se crea policy de INSERT/UPDATE/DELETE a propósito: `service_role` es
-- BYPASSRLS y escribe sin policy. Cualquier otro rol no tiene por dónde.

REVOKE ALL ON public.ia_uso FROM PUBLIC, anon;
GRANT SELECT ON public.ia_uso TO authenticated;   -- filtrado por la policy
GRANT ALL    ON public.ia_uso TO service_role;

-- ═══ LA VISTA DE COSTO — lo que el founder lee sin escribir SQL ════════════
-- `security_invoker = on` es OBLIGATORIO: sin él la vista corre con los
-- permisos de su dueño y **bypassea la RLS de la tabla** (la clase que S92
-- encontró viva en cuatro vistas del motor, con ACL total hasta para anon).
CREATE VIEW public.v_ia_costo_por_pieza_dia
WITH (security_invoker = on) AS
SELECT
  (created_at AT TIME ZONE 'America/Guayaquil')::date AS dia,
  pieza,
  modelo,
  count(*)                                            AS llamadas,
  count(*) FILTER (WHERE resultado <> 'ok')           AS fallidas,
  sum(tokens_entrada)                                 AS tokens_entrada,
  sum(tokens_salida)                                  AS tokens_salida,
  sum(tokens_cache_lectura)                           AS tokens_cache_lectura,
  sum(tokens_cache_escritura)                         AS tokens_cache_escritura,
  round(sum(costo_estimado_usd), 4)                   AS costo_usd,
  round(avg(costo_estimado_usd), 6)                   AS costo_promedio_por_llamada,
  round(avg(latencia_ms))                             AS latencia_promedio_ms,
  max(latencia_ms)                                    AS latencia_peor_ms
FROM public.ia_uso
GROUP BY 1, 2, 3;

COMMENT ON VIEW public.v_ia_costo_por_pieza_dia IS
  'S113-E · Costo de IA por pieza, modelo y día (día en America/Guayaquil, la '
  'misma zona que hoy_local()). Hereda la RLS de ia_uso por security_invoker.';

REVOKE ALL ON public.v_ia_costo_por_pieza_dia FROM PUBLIC, anon;
GRANT SELECT ON public.v_ia_costo_por_pieza_dia TO authenticated, service_role;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — corre DESPUÉS del COMMIT y aborta si algo quedó a medias.
-- Mide el OBJETO, no el hecho de que los statements no lanzaron.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cols int; v_rls bool; v_pol int; v_anon bool; v_inv text;
BEGIN
  IF to_regclass('public.ia_uso') IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: la tabla no existe';
  END IF;

  -- ① El contrato de columnas de D, completo y con los tipos exactos.
  SELECT count(*) INTO v_cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='ia_uso' AND (
       (column_name='pieza'                  AND data_type='text'    AND is_nullable='NO')
    OR (column_name='modelo'                 AND data_type='text'    AND is_nullable='NO')
    OR (column_name='edge'                   AND data_type='text'    AND is_nullable='NO')
    OR (column_name='resultado'              AND data_type='text'    AND is_nullable='NO')
    OR (column_name='tokens_entrada'         AND data_type='integer')
    OR (column_name='tokens_salida'          AND data_type='integer')
    OR (column_name='tokens_cache_lectura'   AND data_type='integer')
    OR (column_name='tokens_cache_escritura' AND data_type='integer')
    OR (column_name='latencia_ms'            AND data_type='integer')
    OR (column_name='costo_estimado_usd'     AND data_type='numeric')
    OR (column_name='created_at'             AND data_type='timestamp with time zone' AND is_nullable='NO')
  );
  IF v_cols <> 11 THEN
    RAISE EXCEPTION 'CINTURÓN: el contrato de columnas no cierra (% de 11)', v_cols;
  END IF;

  -- ② 🔴 NINGUNA columna de sujeto. Esto es la ley de privacidad hecha guard:
  --    si alguien agrega mascota_id «para depurar», la migración aborta.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ia_uso'
      AND column_name IN ('mascota_id','user_id','familia_id','prestador_id',
                          'prompt','respuesta','texto','contenido')
  ) THEN
    RAISE EXCEPTION 'CINTURÓN: ia_uso tiene una columna de sujeto o de texto — prohibido por contrato';
  END IF;

  -- ③ RLS encendida y exactamente UNA policy, de SELECT.
  SELECT relrowsecurity INTO v_rls FROM pg_class WHERE oid='public.ia_uso'::regclass;
  IF NOT v_rls THEN RAISE EXCEPTION 'CINTURÓN: RLS apagada'; END IF;

  SELECT count(*) INTO v_pol FROM pg_policies
  WHERE schemaname='public' AND tablename='ia_uso';
  IF v_pol <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN: se esperaba 1 policy (SELECT admin), hay %', v_pol;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ia_uso'
      AND cmd='SELECT' AND qual='is_admin()'
  ) THEN
    RAISE EXCEPTION 'CINTURÓN: la policy no es SELECT con is_admin()';
  END IF;

  -- ④ anon sin un solo privilegio, ni en la tabla ni en la vista.
  SELECT bool_or(has_table_privilege('anon','public.ia_uso', p))
    INTO v_anon
  FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) p;
  IF v_anon THEN
    RAISE EXCEPTION 'CINTURÓN: anon tiene privilegios sobre ia_uso';
  END IF;
  IF has_table_privilege('anon','public.v_ia_costo_por_pieza_dia','SELECT') THEN
    RAISE EXCEPTION 'CINTURÓN: anon puede leer la vista';
  END IF;

  -- ⑤ La vista es security_invoker. Sin esto bypassearía la RLS de arriba.
  SELECT (reloptions::text) INTO v_inv
  FROM pg_class WHERE oid='public.v_ia_costo_por_pieza_dia'::regclass;
  IF v_inv IS NULL OR v_inv NOT ILIKE '%security_invoker=on%' THEN
    RAISE EXCEPTION 'CINTURÓN: la vista NO es security_invoker (reloptions=%)', coalesce(v_inv,'NULL');
  END IF;

  RAISE NOTICE 'cinturón ia_uso: OK — 11 columnas, sin sujeto, RLS con 1 policy admin, anon en cero, vista invoker';
END $$;
