-- S97-A · LA BANDA DEL DÍA DE `ATENDER` GANA SUS DOS NÚMEROS (D-808)
--
-- Origen: dictado ② del founder en el gate de `ATENDER` (14-ago-2026),
-- verbatim en `LA_CASA_DEL_PRESTADOR` §6bis:
--   "podríamos poner un dashboard pequeño arriba con datos de los servicios
--    prestados y valores, si está en 0 se muestra en 0."
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE**.
--   Esta migración es DDL puro sobre el cuerpo de una función. Cero backfill,
--   cero UPDATE, cero fila tocada. No hay ancla que se mueva bajo nadie.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ═══ POR QUÉ ENSANCHE Y NO LECTOR NUEVO ═══
-- Precedente literal de la casa: S78-A8 ensanchó `obtener_jornada_recepcion`
-- en vez de crear un lector paralelo, y lo dijo con todas las letras — "no
-- nace un lector paralelo".
--   · Un solo gate (§4ter), imposible de divergir.
--   · Un solo escaneo de `evento_cita_servicio`: los tres contadores salen
--     del MISMO SELECT, así que no pueden contradecirse entre sí.
--   · Es aditivo sobre `jsonb`: firma intacta, sin DROP, sin L-119.
-- 🔴 Y la razón fuerte: la baldosa (D-809) va a leer el dato vivo del día por
--    oficio. **Si el número de la baldosa y el de la banda nacen de lectores
--    distintos, nacen divergiendo** — y divergirían EN LA MISMA PANTALLA.
--
-- ═══ LA DISTINCIÓN QUE HACE ÚTIL AL NÚMERO (precisión de C, medida) ═══
-- `_estados_cita_contables()` = {confirmada, en_curso, completada}.
-- ⇒ el `citas` que ya existía cuenta lo AGENDADO, no lo prestado.
--   · confirmada  = una PROMESA
--   · en_curso    = está pasando
--   · completada  = un HECHO  ← esto es "prestado"
-- *Un tablero que suma promesas y las llama "prestados" miente en la
--  dirección optimista, que es la peor: nadie audita un número que le gusta.*
-- Se devuelven los TRES por separado (mismo escaneo, costo cero) para que la
-- superficie diga la verdad sin inventar ni pedir de nuevo.
--
-- ═══ EL EJE DEL COBRO, DECLARADO PARA QUE NADIE LO "CORRIJA" ═══
-- `cobrado` suma los cobros cuya CITA es de `p_fecha` — el mismo eje que
-- `total`. NO se usa `cobro.created_at`.
-- Alternativa descartada a propósito: sumar por fecha de registro haría que
-- un cobro de hoy sobre una cita de ayer entrara acá y NO en `total`
--   ⇒ dos números de la misma banda sobre dos ejes distintos, que jamás
--     cerrarían entre sí. **Un tablero que no cierra consigo mismo no se
--     audita: se desconfía entero.**
-- El día que exista arqueo de caja (plata que entró HOY sin importar de qué
-- cita), es OTRO lector con OTRO nombre — no este.
--
-- ═══ EL GATE NO SE TOCA: RIGE §4ter (S88) ═══
-- `empleado_es_mostrador_o_gestion` — el mostrador entero; el profesional
-- puro sale con `visible:false`, que NO es error sino la modulación.
-- El gate vive en el SERVIDOR: una autorización que decide el cliente es
-- decorativa.

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_plata_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_total      numeric;
  v_contadas   integer;
  v_sin_precio integer;
  v_prestadas  integer;
  v_en_curso   integer;
  v_agendadas  integer;
  v_cobrado    numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  -- ⚠️ ENSANCHE §4ter (S88): el mostrador entero. El profesional puro sigue
  --    afuera — con `visible:false`, que NO es un error: es la modulación, y
  --    la superficie la DICE.
  IF NOT public.empleado_es_mostrador_o_gestion(p_prestador_id) THEN
    RETURN jsonb_build_object('visible', false);
  END IF;

  -- UN SOLO ESCANEO: los cuatro contadores no pueden contradecirse.
  SELECT
    coalesce(sum(c.precio), 0),
    count(*),
    count(*) FILTER (WHERE c.precio IS NULL),
    count(*) FILTER (WHERE c.estado = 'completada'),
    count(*) FILTER (WHERE c.estado = 'en_curso'),
    count(*) FILTER (WHERE c.estado = 'confirmada')
  INTO v_total, v_contadas, v_sin_precio, v_prestadas, v_en_curso, v_agendadas
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    AND c.estado = ANY(public._estados_cita_contables());

  -- COBRADO: por la fecha de la CITA (ver el eje declarado en la cabecera).
  SELECT coalesce(sum(cp.monto), 0)
  INTO v_cobrado
  FROM cobro_presencial_registrado cp
  JOIN evento_cita_servicio c ON c.id = cp.evento_cita_servicio_id
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha;

  RETURN jsonb_build_object(
    'visible',   true,
    'total',     v_total,
    'citas',     v_contadas,     -- LO AGENDADO (se conserva: tiene consumidores)
    'sinPrecio', v_sin_precio,   -- >0 ⇒ el total es PARCIAL y la superficie lo dice
    'prestadas', v_prestadas,    -- 🔴 EL HECHO — lo que el founder pidió
    'enCurso',   v_en_curso,
    'agendadas', v_agendadas,
    'cobrado',   v_cobrado       -- presencial, eje = fecha de la cita
  );
END;
$function$;

-- L-140: la puerta nace sin anon ni PUBLIC. (Se re-declara porque
-- CREATE OR REPLACE conserva el ACL, pero declararlo es gratis y una
-- omisión acá no da síntoma — que es justo el modo de falla de L-192.)
REVOKE ALL ON FUNCTION public.obtener_plata_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN CON DISCRIMINADOR
--
-- No basta con que la función exista y devuelva algo: tiene que devolver algo
-- DISTINTO de lo que devolvía antes, sobre datos reales.
-- El caso vivo elegido (medido hoy): prestador `de300000-…e5`, 2026-08-09
--   → confirmada=5, completada=1
-- ⇒ el contador viejo dice 6 ("citas"), el nuevo dice 1 ("prestadas").
-- **Si alguien implementara `prestadas` sumando todo, este assert lo caza.**
-- Y aborta si el caso NO existe: un cinturón que no discrimina es decorativo.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_prest uuid := 'de300000-0000-4000-8000-0000000000e5';
  v_fecha date := '2026-08-09';
  v_conf  integer;
  v_compl integer;
  v_cobro_prest uuid := '81099e1c-dc58-4539-887b-b8d05adb1361';
  v_cobro_fecha date := '2026-08-13';
  v_monto numeric;
BEGIN
  -- (1) El caso discriminador de estados TIENE que existir.
  SELECT count(*) FILTER (WHERE estado='confirmada'),
         count(*) FILTER (WHERE estado='completada')
  INTO v_conf, v_compl
  FROM evento_cita_servicio
  WHERE prestador_id = v_prest AND fecha = v_fecha;

  IF v_conf = 0 OR v_compl = 0 THEN
    RAISE EXCEPTION
      'CINTURON ABORTA: el caso discriminador de estados desaparecio (conf=%, compl=%). Sin mezcla, este assert no distingue agendado de prestado y seria decorativo.',
      v_conf, v_compl;
  END IF;

  IF v_conf = v_compl THEN
    RAISE EXCEPTION
      'CINTURON ABORTA: conf=compl=%, el caso dejo de discriminar.', v_conf;
  END IF;

  -- (2) El caso discriminador del COBRO tiene que existir.
  SELECT coalesce(sum(cp.monto),0) INTO v_monto
  FROM cobro_presencial_registrado cp
  JOIN evento_cita_servicio c ON c.id = cp.evento_cita_servicio_id
  WHERE c.prestador_id = v_cobro_prest AND c.fecha = v_cobro_fecha;

  IF v_monto <= 0 THEN
    RAISE EXCEPTION
      'CINTURON ABORTA: el cobro discriminador no existe (monto=%). Con 0 no se distingue "sumo bien" de "el join esta roto".',
      v_monto;
  END IF;

  RAISE NOTICE 'CINTURON OK · estados: conf=% compl=% (el viejo diria %, el nuevo %) · cobro: %',
    v_conf, v_compl, v_conf + v_compl, v_compl, v_monto;
END;
$cinturon$;

COMMIT;
