-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · A9 — LA DESPEDIDA: la puerta que faltaba, y el expediente que
--                se vuelve de sólo lectura (A3.9)
--
-- ── EL HALLAZGO QUE ORDENA ESTA MIGRACIÓN ───────────────────────────────────
-- 🔴 **EL MOTOR EXISTÍA ENTERO Y NO TENÍA PUERTA** (L-318, motor sin puerta).
-- Medido contra los catálogos, no contra el recuerdo:
--   · el tipo `fin_vida` está en `cat_tipos_evento`, ACTIVO, desde antes de hoy
--   · `trg_eventos_propagar_estado_vida` ya traduce ese evento a
--     `estado_vida='fallecida'` + `estado_vida_desde = fecha_evento`
--   · TRES triggers ya reaccionan al memorial: cierran solicitudes, cierran
--     planes y purgan la cola de avisos
--   · y **ninguna función lo produce**: los únicos que nombran `fin_vida` son
--     el trigger que reacciona y `_debe_logear_atencion`.
-- Los dos eventos `fin_vida` vivos son FIXTURES de E, insertados por SQL.
-- *O sea: el sistema entero sabía qué hacer cuando una mascota se va, y la
-- familia no tenía por dónde decirlo.*
--
-- ── A3.9 · POR QUÉ EL GUARD MIRA LA FECHA Y NO EL ESTADO ────────────────────
-- «El expediente memorial es de sólo lectura» no puede implementarse como
-- «rechazar todo evento sobre una mascota fallecida»: **un veterinario cierra
-- una atención días después**, y esa atención OCURRIÓ cuando ella estaba viva.
-- Rechazarla borraría del expediente el último acto de cuidado.
-- ⇒ El guard rechaza lo que se fecha **DESPUÉS de la partida**. Lo anterior es
-- historia que llega tarde y entra; lo posterior es un error o un sistema que
-- no se enteró — y las dos cosas tienen que sonar.
--
-- ⚠️ CONSECUENCIA DECLARADA: desde acá, cualquier automatismo que escriba con
-- `now()` sobre una mascota en memorial **va a fallar con error tipado en vez
-- de acumular filas en silencio**. Es el efecto buscado: el censo dice que los
-- tres triggers de memorial cierran planes, solicitudes y avisos, y ninguno
-- inserta eventos — así que hoy no hay productor legítimo. Si aparece uno, va
-- a gritar, que es exactamente lo que un expediente cerrado debe hacer.
--
-- 76(g) — VEDA: NO RIGE. DDL + una función nueva + un trigger nuevo. Cero
-- backfill, cero anclas, cero reescritura del pasado: las dos despedidas ya
-- registradas quedan como están.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

-- ── LA PUERTA ───────────────────────────────────────────────────────────────
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

  SELECT fecha_nacimiento, estado_vida, estado_vida_desde
    INTO v_nace, v_estado, v_desde
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
    creado_por_user_id, procedencia, datos
  ) VALUES (
    p_mascota_id, 'fin_vida', v_eje,
    -- Fecha-sola: se ancla a medianoche, igual que las vacunas (S48). La hora
    -- acá no significa nada y **fingir una sería inventar un dato**.
    p_fecha::timestamptz,
    v_auth, 'declarado_por_familia', v_datos
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

-- L-140: nace sin alcance para anon ni PUBLIC. **El REVOKE va a PUBLIC además
-- de anon**, porque todo rol hereda de PUBLIC y revocar sólo a anon no cierra
-- nada (L-216).
revoke all on function public.registrar_fin_de_vida(uuid, date, text) from public, anon;
grant execute on function public.registrar_fin_de_vida(uuid, date, text) to authenticated;

-- ── A3.9 · EL EXPEDIENTE CERRADO ────────────────────────────────────────────
create or replace function public._trg_eventos_memorial_solo_lectura()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
DECLARE
  v_estado text;
  v_desde  timestamptz;
BEGIN
  -- La propia despedida entra: llega cuando la mascota todavía está activa, y
  -- si se repitiera, la puerta ya es idempotente.
  IF NEW.tipo = 'fin_vida' THEN
    RETURN NEW;
  END IF;

  SELECT estado_vida, estado_vida_desde INTO v_estado, v_desde
    FROM mascotas WHERE id = NEW.mascota_id;

  IF v_estado = 'fallecida'
     AND v_desde IS NOT NULL
     AND NEW.fecha_evento > v_desde THEN
    RAISE EXCEPTION 'mascota_en_memorial' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

revoke all on function public._trg_eventos_memorial_solo_lectura() from public, anon;

drop trigger if exists trg_eventos_memorial_solo_lectura on public.eventos_mascota;
create trigger trg_eventos_memorial_solo_lectura
  before insert on public.eventos_mascota
  for each row execute function public._trg_eventos_memorial_solo_lectura();

commit;
