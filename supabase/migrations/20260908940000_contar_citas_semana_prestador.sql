-- ════════════════════════════════════════════════════════════════════════════
-- S113-A · contar_citas_semana_prestador — LA PUERTA QUE C DEJÓ DECLARADA
--
-- Pedido literal de S113-C (`apps/prestador/src/app/(tabs)/index.tsx`, bloque
-- «🔴 PUERTA PENDIENTE — PEDIDO A LA PISTA A»): el conteo de la semana del
-- prestador lo cuenta el SERVIDOR, o no viene. Hasta hoy la pantalla lo sacaba
-- de `citasRango.length` sobre una ventana de hoy−3..hoy+6 — un número
-- plausible sobre la ventana equivocada.
--
-- ── LO QUE SE MIDIÓ ANTES DE ESCRIBIR (nada acá está deducido) ──────────────
-- ① LOS CUATRO LECTORES DEL DÍA y su lista de estados, LITERAL e idéntica en
--    los cuatro (packages/api/src/wrappers/):
--      paseo.ts:410              .in('estado', ['confirmada','en_curso','completada','no_show'])
--      grooming-atencion.ts:189  .in('estado', ['confirmada','en_curso','completada','no_show'])
--      veterinaria-atencion.ts:86 .in('estado', ['confirmada','en_curso','completada','no_show'])
--      adiestramiento-atencion.ts:150 .in('estado', ['confirmada','en_curso','completada','no_show'])
--    Esta función usa ESA lista, no una equivalente.
--
-- ② EL DISCRIMINADOR POR OFICIO, también literal de esos cuatro:
--      paseo          .eq('tipo.categoria','paseo')
--      grooming       .eq('tipo.categoria','grooming')
--      adiestramiento .eq('tipo.categoria','adiestramiento')
--      veterinaria    .eq('tipo.es_medico', true)     ← ¡NO categoría!
--    🔴 Y ES DECISIVO, medido en `tipos_servicio`: `es_medico=true` abarca
--    TRES categorías — `veterinario`, `telemedicina` y `emergencia`. Contar el
--    oficio médico por `categoria='veterinario'` perdería telemedicina y
--    emergencia EN SILENCIO (el hallazgo que S78 ya dejó escrito: el día
--    clínico se compone por es_medico, jamás por categoría).
--    Los cuatro oficios son DISJUNTOS (las tres categorías no-médicas tienen
--    es_medico=false), así que la unión no puede contar dos veces.
--    ⚠️ `hospedaje` (guardería/hotel) queda AFUERA a propósito: son estadías,
--    otra tabla y otro lector (`obtener_estadias_por_rango`). El pedido de C
--    dice «los CUATRO oficios».
--
-- ③ LA VENTANA la arma el LLAMADOR con `hoyEnZona(zona)` + `sumarDias(...,6)`
--    de `apps/prestador/src/lib/dia-local.ts` (S112-C). Por eso esta función
--    recibe `p_desde`/`p_hasta` y **NO llama a `hoy_local()`**:
--    🔴 medido — `hoy_local()` es `(now() AT TIME ZONE 'America/Guayaquil')::date`,
--    una CONSTANTE, no la zona del prestador. Es D-1007. El comentario del call
--    site de C dice que `hoy_local()` usa `prestadores.zona_horaria`, y eso es
--    FALSO: la corrijo en el call site en este mismo commit.
--
-- ── SECURITY INVOKER, y es una decisión ────────────────────────────────────
-- El gate es la RLS de `evento_cita_servicio` (medida: RLS = ON), la MISMA que
-- ya usan los cuatro lectores por PostgREST. Un DEFINER sería una puerta nueva
-- que saltea esa RLS y necesitaría su propio gate, para devolver un número
-- derivado de filas que quien llama ya puede leer. Se reusa el gate probado.
-- ⚠️ LÍMITE DECLARADO: el arnés de abajo corre como `postgres`, que saltea RLS
-- (L-167) — prueba la ARITMÉTICA del conteo, no el gate. El gate no es nuevo.
--
-- 76(g) — NO RIGE: cero backfill, cero anclas, no escribe una sola fila.
-- REVERSA escrita ANTES: docs/loop/S113-A-REVERSA-20260908940000.sql
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.contar_citas_semana_prestador(
  p_prestador_id uuid,
  p_desde        date,
  p_hasta        date
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $fn$
  SELECT count(*)::int
  FROM evento_cita_servicio c
  JOIN tipos_servicio t ON t.codigo = c.tipo_servicio
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha >= p_desde
    AND c.fecha <= p_hasta
    AND c.estado IN ('confirmada', 'en_curso', 'completada', 'no_show')
    AND (t.categoria IN ('paseo', 'grooming', 'adiestramiento') OR t.es_medico);
$fn$;

COMMENT ON FUNCTION public.contar_citas_semana_prestador(uuid, date, date) IS
  'S113-A · Conteo de citas FIRMES del prestador en una ventana de fechas, para '
  'el techo del HOY (pedido de S113-C). Estados y discriminador por oficio '
  'copiados LITERAL de los cuatro lectores del día. La ventana la arma el '
  'llamador con hoyEnZona() — esta función jamás llama a hoy_local() (D-1007).';

-- L-140 — la sonda: ninguna función nace alcanzable por anon/PUBLIC.
DO $l140$
DECLARE v_anon boolean;
BEGIN
  SELECT has_function_privilege('anon', 'public.contar_citas_semana_prestador(uuid,date,date)', 'EXECUTE')
    INTO v_anon;
  IF v_anon THEN
    RAISE EXCEPTION 'L-140: la funcion nacio alcanzable por anon';
  END IF;
  RAISE NOTICE 'L-140 OK · anon EXECUTE = false';
END $l140$;

-- ════════════════════════════════════════════════════════════════════════════
-- CINTURÓN — el arnés escribe de verdad y SE DESHACE SOLO (L-406).
-- La DDL de arriba queda AFUERA del savepoint; sólo el fixture se revierte.
-- ════════════════════════════════════════════════════════════════════════════
DO $arnes$
DECLARE
  -- ids REALES (medidos): con FK no se pueden inventar.
  k_prest   uuid := 'de680000-0000-4000-8000-0000000000e5'; -- 152 citas, 0 firmes en la ventana
  k_vacio   uuid := '8026077e-f96f-4127-9597-8f4b2646a1b2'; -- 0 citas en toda la tabla
  k_masc    uuid := 'b59a2a4e-ca8a-449c-aa8f-5ef720fb55fe';
  k_d0      date := '2026-09-03';
  k_d6      date := '2026-09-09';
  n_base    int; n_tres int; n_ruido int; n_cero int; n_sigue int;
  n_solo_cat int; n_con_med int;
BEGIN
  -- ① BASELINE: el prestador arranca en 0 firmes en la ventana.
  n_base := contar_citas_semana_prestador(k_prest, k_d0, k_d6);
  IF n_base <> 0 THEN
    RAISE EXCEPTION 'baseline movido: esperaba 0, dio %', n_base;
  END IF;

  -- ② CONTROL POSITIVO: TRES firmes en la ventana, de TRES oficios distintos
  --    — y una es `telemedicina`, que es la que produce el rojo del predicado.
  INSERT INTO evento_cita_servicio (mascota_id, prestador_id, tipo_servicio, fecha, hora, estado)
  VALUES (k_masc, k_prest, 'paseo',        k_d0 + 1, '09:00', 'confirmada'),
         (k_masc, k_prest, 'grooming',     k_d0 + 2, '10:00', 'completada'),
         (k_masc, k_prest, 'telemedicina', k_d0 + 3, '11:00', 'confirmada');

  n_tres := contar_citas_semana_prestador(k_prest, k_d0, k_d6);
  IF n_tres <> 3 THEN
    RAISE EXCEPTION 'control positivo: esperaba 3, dio %', n_tres;
  END IF;

  -- ②bis EL ROJO DEL PREDICADO (L-459: la primera prueba de un guard es su
  --      ROJO). Sin `es_medico`, la telemedicina desaparece del conteo.
  SELECT count(*) FILTER (WHERE t.categoria IN ('paseo','grooming','adiestramiento')),
         count(*) FILTER (WHERE t.categoria IN ('paseo','grooming','adiestramiento') OR t.es_medico)
    INTO n_solo_cat, n_con_med
  FROM evento_cita_servicio c JOIN tipos_servicio t ON t.codigo = c.tipo_servicio
  WHERE c.prestador_id = k_prest AND c.fecha BETWEEN k_d0 AND k_d6
    AND c.estado IN ('confirmada','en_curso','completada','no_show');
  IF n_solo_cat >= n_con_med THEN
    RAISE EXCEPTION 'el arnes NO puede producir su rojo: categoria-sola=% con-es_medico=% (deberian diferir)',
      n_solo_cat, n_con_med;
  END IF;
  RAISE NOTICE 'ROJO DEL PREDICADO OK · categoria-sola=% · con es_medico=% (la telemedicina se perderia)',
    n_solo_cat, n_con_med;

  -- ③ CONTROL NEGATIVO: una CANCELADA dentro de la ventana + una FIRME de la
  --    semana siguiente. Ninguna de las dos debe mover el número.
  INSERT INTO evento_cita_servicio (mascota_id, prestador_id, tipo_servicio, fecha, hora, estado)
  VALUES (k_masc, k_prest, 'paseo', k_d0 + 4, '12:00', 'cancelada'),
         (k_masc, k_prest, 'paseo', k_d6 + 1, '09:00', 'confirmada');

  n_ruido := contar_citas_semana_prestador(k_prest, k_d0, k_d6);
  IF n_ruido <> 3 THEN
    RAISE EXCEPTION 'control negativo: la cancelada o la de la semana que viene MOVIERON el numero: %', n_ruido;
  END IF;

  -- ④ EL CERO ES DEL DATO, no de la consulta: el prestador sin citas da 0
  --    MIENTRAS la misma función sigue dando 3 para el otro.
  n_cero  := contar_citas_semana_prestador(k_vacio, k_d0, k_d6);
  n_sigue := contar_citas_semana_prestador(k_prest, k_d0, k_d6);
  IF n_cero <> 0 THEN
    RAISE EXCEPTION 'esperaba 0 para el prestador sin citas, dio %', n_cero;
  END IF;
  IF n_sigue <> 3 THEN
    RAISE EXCEPTION 'el cero no es del dato: la misma consulta dejo de devolver 3 (dio %)', n_sigue;
  END IF;

  RAISE NOTICE 'CINTURON VERDE · positivo=% · con ruido=% · vacio=% (y el otro sigue en %)',
    n_tres, n_ruido, n_cero, n_sigue;

  -- ⑤ El fixture se deshace solo.
  RAISE EXCEPTION 'ROLLBACK_ARNES_OK';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'ROLLBACK_ARNES_OK' THEN
    RAISE NOTICE 'fixture revertido — residuo 0 por construccion';
  ELSE
    RAISE;
  END IF;
END $arnes$;
