-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — `registrar_fin_de_vida` estampa `country_code`. BLOQUEABA C11.
--
-- 🔴 EL DEFECTO ERA MÍO Y SE ME ESCAPÓ DE LA PEOR MANERA POSIBLE: mi propio
-- arnés chocó contra este mismo `23502` hace unas horas — **le agregué la
-- columna AL ARNÉS y seguí**, sin preguntarme si la puerta tenía el mismo hueco.
-- *Curé el síntoma del instrumento y no censé la clase*, que es exactamente el
-- error que esta casa tiene escrito con nombre. El arnés pasó a 9/9 sobre una
-- función que rebotaba en toda llamada real.
--
-- ⚠️ Y por eso el rojo del arnés no lo cazó: **el fixture insertaba el evento a
-- mano** para probar el guard de A3.9, y sólo el brazo idempotente llamaba a la
-- puerta — que devuelve antes de insertar. *Un arnés que rodea la puerta para
-- probar lo que hay detrás de ella nunca prueba la puerta.*
--
-- ── EL CENSO QUE ESTA VEZ SÍ SE HIZO ────────────────────────────────────────
-- 18 migraciones recientes insertan en `eventos_mascota`; **la mía era la única
-- en cero**. Las otras estampan `country_code` desde `mascotas`, que es el
-- patrón desde S54.
--
-- 🟡 SOSPECHA MEDIDA Y NO VERIFICADA, para quien toque S112: dos migraciones de
-- adopción (`20260908120000`, `20260908240000`) insertan en `eventos_mascota`
-- con nombres de columna que **este esquema no tiene** — `tipo_evento`,
-- `titulo`, `descripcion`, `creado_por`, `metadata`, donde las reales son
-- `tipo`, `datos`, `creado_por_user_id`. **No lo verifiqué contra la base**
-- (puede ser un camino muerto o una función ya reemplazada) y por eso va como
-- sospecha con su evidencia, no como hallazgo.
--
-- 76(g) — VEDA: NO RIGE. CREATE OR REPLACE de una función.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

create or replace function public.registrar_fin_de_vida(
  p_mascota_id uuid,
  p_fecha      date,
  p_palabras   text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
DECLARE
  v_auth      uuid := auth.uid();
  v_nace      date;
  v_estado    text;
  v_desde     timestamptz;
  v_country   text;
  v_eje       text;
  v_evento_id uuid;
  v_datos     jsonb;
BEGIN
  IF v_auth IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  -- La misma puerta que usa `declarar_talla_pelaje`: **adulto de la familia**.
  -- Registrar una partida es una decisión, no una nota.
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;

  /* 🔴 `country_code` VIAJA EN EL MISMO SELECT — es el patrón de la casa desde
     S54 (`SELECT m.country_code FROM mascotas m WHERE m.id = …`) y la columna es
     NOT NULL en `eventos_mascota`. Sin esto la puerta rebotaba con 23502 en
     TODA llamada. */
  SELECT fecha_nacimiento, estado_vida, estado_vida_desde, country_code
    INTO v_nace, v_estado, v_desde, v_country
  FROM mascotas WHERE id = p_mascota_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mascota_inexistente' USING ERRCODE = '22023';
  END IF;

  -- ⭐ IDEMPOTENTE, Y NO POR PROLIJIDAD TÉCNICA: si la familia vuelve a entrar
  -- —porque el toque no se sintió, porque otro adulto ya lo hizo—, **contestar
  -- con un error sería devolverle el golpe**. Se devuelve lo que ya está.
  IF v_estado = 'fallecida' THEN
    SELECT id INTO v_evento_id FROM eventos_mascota
     WHERE mascota_id = p_mascota_id AND tipo = 'fin_vida' AND NOT soft_delete
     ORDER BY fecha_evento DESC LIMIT 1;
    RETURN jsonb_build_object(
      'ok', true, 'ya_estaba', true,
      'mascota_id', p_mascota_id, 'evento_id', v_evento_id,
      'fecha', v_desde::date, 'estado_vida', v_estado
    );
  END IF;

  IF p_fecha IS NULL OR p_fecha > current_date THEN
    RAISE EXCEPTION 'fecha_futura' USING ERRCODE = '22023';
  END IF;
  IF v_nace IS NOT NULL AND p_fecha < v_nace THEN
    RAISE EXCEPTION 'fecha_antes_de_nacer' USING ERRCODE = '22023';
  END IF;

  -- El eje se DERIVA del catálogo, no se repite acá: si el día de mañana el
  -- catálogo lo mueve, esta puerta lo sigue sola.
  SELECT eje_jtbd INTO v_eje FROM cat_tipos_evento WHERE codigo = 'fin_vida';

  -- Las palabras de la familia son OPCIONALES y se guardan tal cual. No se
  -- resumen, no se corrigen, no se completan.
  v_datos := CASE
    WHEN p_palabras IS NULL OR btrim(p_palabras) = '' THEN '{}'::jsonb
    ELSE jsonb_build_object('palabras', btrim(p_palabras))
  END;

  INSERT INTO eventos_mascota (
    mascota_id, tipo, eje_jtbd, fecha_evento,
    creado_por_user_id, procedencia, datos, country_code
  ) VALUES (
    p_mascota_id, 'fin_vida', v_eje,
    -- Fecha-sola: se ancla a medianoche, igual que las vacunas (S48). La hora
    -- acá no significa nada y **fingir una sería inventar un dato**.
    p_fecha::timestamptz,
    v_auth, 'declarado_por_familia', v_datos, v_country
  ) RETURNING id INTO v_evento_id;

  -- El estado lo escribe `trg_eventos_propagar_estado_vida`, no esta función.
  -- **Una sola mano mueve `estado_vida`**, y es la que ya estaba.
  SELECT estado_vida, estado_vida_desde INTO v_estado, v_desde
    FROM mascotas WHERE id = p_mascota_id;

  RETURN jsonb_build_object(
    'ok', true, 'ya_estaba', false,
    'mascota_id', p_mascota_id, 'evento_id', v_evento_id,
    'fecha', v_desde::date, 'estado_vida', v_estado
  );
END;
$function$;

commit;
