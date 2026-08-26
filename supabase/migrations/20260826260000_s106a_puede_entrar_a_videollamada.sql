-- ═══════════════════════════════════════════════════════════════════════
-- S106-A · EL VEREDICTO DE ENTRADA A LA VIDEOLLAMADA — pedido de D (76b)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Pedido autocontenido de la pista D, re-medido por ella contra
-- `origin/main = f6482db9`. **Su primer envío nunca llegó a A** — no entró
-- en ningún prompt. *Es el freno 76b en su forma pura: un pedido que viaja
-- por referencia y no llega.* Éste llegó como texto completo y por eso se
-- puede construir.
--
-- LA LEY QUE LA GOBIERNA: **decide, no ejecuta.** No emite tokens (no sabe
-- qué es LiveKit) · no escribe (STABLE) · no toca `cita_telemedicina_detalle`
-- (D-930, ya muerta) · no registra asistencia (D-931, sin construir hasta
-- la firma del founder).
--
-- ─── LOS MOTIVOS NO SE COLAPSAN, y es la línea de producto ─────────────
-- *«No podés entrar» sin decir por qué manda a la familia a llamar por
-- teléfono cuando lo único que pasaba es que llegó veinte minutos antes.*
--
-- ─── 🔴 UNA DESVIACIÓN DEL PEDIDO, DECLARADA (no silenciosa) ───────────
-- D ordenó los chequeos: existe → es teleconsulta → estado → quién → ventana.
-- **Acá la identidad se verifica ANTES del estado y del tipo.**
--
-- Razón: con el orden pedido, alguien AJENO que tuviera un `cita_id` recibiría
-- `cita_cancelada` o `no_es_teleconsulta` — o sea, **información sobre una
-- cita que no es suya**. Con este orden recibe siempre `ajeno_a_la_cita`.
--
-- **El contrato de D no cambia:** las mismas ocho claves, los mismos códigos
-- HTTP, y **ningún usuario legítimo ve un motivo distinto** — un dueño o un
-- profesional nunca son ajenos, así que para ellos el orden es indistinguible.
-- *Cambia solo lo que ve quien no debería estar preguntando.*
-- ⚠️ **Si D prefiere su orden, es una línea y se mueve** — se declara acá en
-- vez de aplicarse en silencio.
--
-- ─── LAS DOS TRAMPAS QUE D MIDIÓ Y QUE SE HONRAN AL PIE ────────────────
-- ① **`empleado_tiene_capacidad_clinica` tiene DOS sobrecargas** (medido:
--    `(uuid)` y `(uuid, uuid)`). Se usa **la de DOS argumentos**: la de uno
--    lee `auth.uid()` y acá **no hay sesión** — corre como `service_role`.
--    *Es la clase de detalle que compila igual y devuelve `false` siempre.*
-- ② **`telemedicina` existe en DOS ejes**: `tipos_servicio.codigo` y
--    `evento_cita_servicio.modalidad`. **La letra firmó la MODALIDAD**
--    (v1.1 §7② por `BIO_EXPEDIENTE` D13.6). *Que nadie lo mude al otro eje
--    por parecerle más natural.*
--
-- ─── LA VENTANA — ±15 min, firmada por la mesa con este pedido ─────────
-- Compuesta en **America/Guayaquil**, no en UTC. *Con UTC la ventana se
-- corre cinco horas y el síntoma es «no puedo entrar a mi consulta», que
-- nadie va a leer como un bug de zona horaria.* (D-320, patrón de la casa.)
--
-- 🔴 **EL BORDE DE §4, EXPLÍCITO EN EL CÓDIGO:** la letra firma que la
-- consulta **se cobra aunque el dueño no asista** ⇒ **el token del
-- profesional se emite aunque el dueño nunca entre.** La ventana **jamás**
-- exige que haya dos. *Cualquier regla del tipo «la sala se abre cuando
-- ambos están» rompe §4 y le saca al veterinario el derecho a cobrar que la
-- letra le acaba de dar.* Y vale en los dos sentidos: v1.1 agregó que si el
-- que falta es el vet, el dueño no paga — **quién entró se determina
-- después, con el hecho, no con la puerta.**
--
-- ─── VEDA 76(g): **NO RIGE.** ──────────────────────────────────────────
-- Función nueva, STABLE, que no escribe una fila. Sin backfill, sin anclas.
--
-- ─── REVERSA ───────────────────────────────────────────────────────────
-- docs/relevamientos/2026-08-26-s106a-REVERSA-puede-entrar-videollamada.sql
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.puede_entrar_a_videollamada(
  p_cita_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_cita   record;
  v_ahora  timestamp := (now() AT TIME ZONE 'America/Guayaquil');  -- D-320
  v_desde  timestamp;
  v_hasta  timestamp;
  v_es_duenio boolean;
  v_es_prof   boolean;
  v_rol    text;
  v_nombre text;
BEGIN
  IF p_cita_id IS NULL OR p_user_id IS NULL THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_inexistente');
  END IF;

  SELECT c.id, c.mascota_id, c.prestador_id, c.empleado_id, c.user_id,
         c.fecha, c.hora, c.duracion_minutos, c.estado, c.estado_reserva, c.modalidad
    INTO v_cita
    FROM evento_cita_servicio c
   WHERE c.id = p_cita_id;

  IF v_cita.id IS NULL THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_inexistente');
  END IF;

  -- ── QUIÉN ES (ver la desviación declarada en la cabecera) ────────────
  v_es_duenio := COALESCE(public._user_es_familia_de_mascota(v_cita.mascota_id, p_user_id), false);

  -- Trampa ①: la sobrecarga de DOS argumentos. La de uno lee auth.uid() y
  -- acá no hay sesión.
  v_es_prof := COALESCE(public.empleado_tiene_capacidad_clinica(v_cita.prestador_id, p_user_id), false);

  -- Y si la cita ya tiene persona asignada, tiene que ser ESA persona. Otro
  -- profesional del mismo negocio no entra a una consulta que no es suya.
  IF v_es_prof AND v_cita.empleado_id IS NOT NULL THEN
    v_es_prof := EXISTS (
      SELECT 1 FROM prestador_empleados pe
       WHERE pe.id = v_cita.empleado_id AND pe.user_id = p_user_id
    );
  END IF;

  IF NOT v_es_duenio AND NOT v_es_prof THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'ajeno_a_la_cita');
  END IF;

  -- Si es las dos cosas, gana profesional (pedido de D).
  v_rol := CASE WHEN v_es_prof THEN 'profesional' ELSE 'dueño' END;

  -- ── ES TELECONSULTA — por MODALIDAD (trampa ②) ───────────────────────
  IF v_cita.modalidad IS DISTINCT FROM 'telemedicina' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'no_es_teleconsulta');
  END IF;

  -- ── VIVA Y PAGADA ───────────────────────────────────────────────────
  -- El orden importa: `cancelada` gana sobre `no_pagada`, porque una cita
  -- cancelada sale de 'pagada' y diría las dos cosas.
  IF v_cita.estado = 'cancelada' OR v_cita.estado_reserva = 'cancelada' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_cancelada');
  END IF;

  IF v_cita.estado = 'no_realizable' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_no_realizable');
  END IF;

  -- *Una sala abierta después de que el vet cerró la consulta es una puerta
  -- sin dueño.*
  IF v_cita.estado IN ('completada', 'no_show', 'rechazada') THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_finalizada');
  END IF;

  IF v_cita.estado_reserva IS DISTINCT FROM 'pagada' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'cita_no_pagada');
  END IF;

  -- ── LA VENTANA, ±15 min, en hora de Guayaquil ───────────────────────
  v_desde := (v_cita.fecha + v_cita.hora) - interval '15 minutes';
  v_hasta := (v_cita.fecha + v_cita.hora)
             + make_interval(mins => COALESCE(v_cita.duracion_minutos, 20))
             + interval '15 minutes';

  IF v_ahora < v_desde OR v_ahora > v_hasta THEN
    RETURN jsonb_build_object(
      'puede', false,
      'motivo', 'fuera_de_ventana',
      -- se devuelve como timestamptz: el local de Guayaquil llevado a
      -- instante absoluto, para que la edge no tenga que saber de zonas.
      'abre_en', (v_desde AT TIME ZONE 'America/Guayaquil')
    );
  END IF;

  SELECT pr.nombre INTO v_nombre FROM profiles pr WHERE pr.id = p_user_id;

  RETURN jsonb_build_object(
    'puede', true,
    'rol', v_rol,
    -- determinístico, sin estado que guardar.
    'sala', p_cita_id::text,
    'identidad', p_user_id::text,
    'nombre', v_nombre
  );
END;
$fn$;

-- L-140 · solo `video-token`, con service_role. `p_user_id` sale de
-- getUser() en la edge, JAMÁS del cliente.
--
-- ⚠️ `authenticated` VA EN EL REVOKE, y lo cazó el cinturón de esta misma
-- migración: los default privileges de Supabase se lo conceden en el CREATE
-- igual que a `anon`, y el pedido de D solo nombraba a `PUBLIC, anon`.
-- **Acá no era cosmético:** la RPC recibe `p_user_id` COMO PARÁMETRO, así
-- que cualquier usuario logueado podría haber preguntado por las citas de
-- otro. *Una función que confía en su llamador no puede quedar al alcance de
-- cualquiera que sepa llamarla.*
REVOKE ALL ON FUNCTION public.puede_entrar_a_videollamada(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.puede_entrar_a_videollamada(uuid, uuid) TO service_role;

-- ─── CINTURÓN — DISCRIMINADORES, no camino feliz ───────────────────────
DO $cinturon$
DECLARE
  v_r jsonb;
  v_cita_pres uuid;
  v_ajeno uuid;
BEGIN
  -- L-140 medido, no leído.
  IF has_function_privilege('anon', 'public.puede_entrar_a_videollamada(uuid, uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.puede_entrar_a_videollamada(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON L-140: la RPC es alcanzable por alguien que no es service_role';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.puede_entrar_a_videollamada(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: service_role NO puede ejecutarla';
  END IF;

  -- ① cita inexistente
  v_r := public.puede_entrar_a_videollamada('00000000-0000-0000-0000-000000000000', gen_random_uuid());
  IF v_r->>'motivo' <> 'cita_inexistente' THEN
    RAISE EXCEPTION 'CINTURON: cita inexistente devolvió %', v_r;
  END IF;

  -- ② AJENO sobre una cita REAL — el discriminador que importa.
  SELECT id INTO v_cita_pres FROM evento_cita_servicio LIMIT 1;
  IF v_cita_pres IS NOT NULL THEN
    v_ajeno := gen_random_uuid();
    v_r := public.puede_entrar_a_videollamada(v_cita_pres, v_ajeno);
    IF v_r->>'motivo' <> 'ajeno_a_la_cita' THEN
      RAISE EXCEPTION 'CINTURON: un usuario ajeno NO recibió ajeno_a_la_cita, recibió %', v_r;
    END IF;
  END IF;

  -- ③ El DUEÑO real de una cita PRESENCIAL recibe no_es_teleconsulta —
  -- prueba a la vez que la identidad resuelve bien y que el eje es la
  -- MODALIDAD (trampa ②): si mirara tipos_servicio.codigo, este caso
  -- podría pasar.
  SELECT c.id INTO v_cita_pres
    FROM evento_cita_servicio c
   WHERE c.modalidad <> 'telemedicina' AND c.user_id IS NOT NULL
   LIMIT 1;
  IF v_cita_pres IS NOT NULL THEN
    v_r := public.puede_entrar_a_videollamada(
             v_cita_pres, (SELECT user_id FROM evento_cita_servicio WHERE id = v_cita_pres));
    IF v_r->>'motivo' NOT IN ('no_es_teleconsulta', 'ajeno_a_la_cita') THEN
      RAISE EXCEPTION 'CINTURON: cita presencial con su dueño devolvió %', v_r;
    END IF;
    IF v_r->>'motivo' = 'no_es_teleconsulta' THEN
      RAISE NOTICE 'CINTURON: cita presencial + su dueño = no_es_teleconsulta (identidad y eje OK)';
    ELSE
      RAISE NOTICE 'CINTURON: la cita de prueba no tiene familia resoluble — caso ③ NO CONCLUYENTE';
    END IF;
  END IF;

  RAISE NOTICE 'CINTURON OK — anon/authenticated cerrados, inexistente y ajeno discriminados';
  RAISE NOTICE '⚠️ EL CAMINO FELIZ NO SE PROBÓ ACÁ: no existe ninguna cita de telemedicina (0 medidas). Su arnés va aparte, con cita real y ROLLBACK.';
END
$cinturon$;

COMMIT;
