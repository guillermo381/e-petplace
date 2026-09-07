-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · 1.3 — la salud del pasaporte lee las claves REALES, y filtra vigencia
--
-- 🔴 DOS DEFECTOS MÍOS, y el segundo casi me hace curar lo que funcionaba.
--
-- ① **La clave de medicación es `medicamento`, NO `nombre`.** Medida la forma
-- real de `mascota_perfil_vigente.medicacion_actual`:
--   {"medicamento":"Enzimax","dosis":"1 tableta","frecuencia":"cada 12 horas",…}
-- Con `m->>'nombre'` el pasaporte devolvía **null para toda medicación**, en la
-- página donde un veterinario de guardia necesita saber qué está tomando el
-- animal que le acaban de traer. *Un `->>'clave_inexistente'` no falla: devuelve
-- null, que es indistinguible de «no toma nada».*
--
-- ⚠️ ② **El arnés dio verde con las alergias vacías y casi «curo» el lector.**
-- La causa no era el lector: **había TRES Thor y medí el que no tiene datos.**
-- El de verdad —`d2e31d70`, el Bulldog inglés— tiene su alergia a pollo y sus
-- cinco medicaciones, y la clave `alergeno` que yo usaba era la correcta.
-- *Un control positivo corrido sobre el sujeto equivocado no falla: miente — y
-- manda a arreglar lo que anda.*
--
-- ── LA VIGENCIA, que faltaba entera ─────────────────────────────────────────
-- 🔴 Se filtra lo RESUELTO y lo VENCIDO, y no es prolijidad: *decirle a quien
-- encontró al animal que es alérgico a algo que ya no le hace nada lo manda a
-- buscar comida que sí puede comer; decirle que toma un remedio que terminó
-- hace un mes lo manda a un veterinario con un dato falso.* Una alergia
-- sospechada SÍ entra —en seguridad, la duda se dice—; una resuelta no.
--
-- 76(g) — VEDA: NO RIGE. CREATE OR REPLACE de una función.
-- ═══════════════════════════════════════════════════════════════════════════
begin;
create or replace function public.leer_pasaporte(p_token text)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
DECLARE
  v_p record; v_m record; v_c record; v_n int; v_minuto timestamptz;
  v_alergias jsonb; v_medicacion jsonb; v_edad text;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[A-Za-z0-9_-]{22}$' THEN RETURN NULL; END IF;

  SELECT * INTO v_p FROM pasaporte WHERE token = p_token AND revocado_en IS NULL;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_minuto := date_trunc('minute', now());
  INSERT INTO pasaporte_acceso (pasaporte_id, minuto) VALUES (v_p.id, v_minuto)
  ON CONFLICT (pasaporte_id, minuto) DO UPDATE SET n = pasaporte_acceso.n + 1
  RETURNING n INTO v_n;
  IF v_n > 30 THEN RETURN jsonb_build_object('limite', true); END IF;

  SELECT * INTO v_m FROM mascotas WHERE id = v_p.mascota_id;
  SELECT * INTO v_c FROM pasaporte_config WHERE mascota_id = v_p.mascota_id;

  UPDATE pasaporte SET vistas = vistas + 1, ultima_vista_en = now() WHERE id = v_p.id;

  v_edad := CASE
    WHEN v_m.fecha_nacimiento IS NULL THEN NULL
    WHEN age(v_m.fecha_nacimiento) < interval '1 year'
      THEN extract(month from age(v_m.fecha_nacimiento))::int::text || ' meses'
    ELSE extract(year from age(v_m.fecha_nacimiento))::int::text || ' años'
  END;

  IF coalesce(v_c.mostrar_salud, true) THEN
    /* Alergias: la clave es `alergeno` (medida). Se excluye lo RESUELTO; una
       sospecha entra, porque en seguridad la duda se dice. La severidad viaja
       para que la página pueda decir «grave» sin inventarlo. */
    SELECT jsonb_agg(jsonb_build_object(
             'alergeno', a->>'alergeno', 'severidad', a->>'severidad'))
      INTO v_alergias
      FROM mascota_perfil_vigente p, jsonb_array_elements(coalesce(p.alergias,'[]'::jsonb)) a
     WHERE p.mascota_id = v_p.mascota_id
       AND coalesce(a->>'estado','confirmada') NOT IN ('resuelta','descartada');

    /* Medicación: la clave es `medicamento`. Vigente = sin fecha de fin, o con
       una que todavía no pasó. */
    SELECT jsonb_agg(jsonb_build_object(
             'medicamento', m->>'medicamento', 'dosis', m->>'dosis',
             'frecuencia', m->>'frecuencia'))
      INTO v_medicacion
      FROM mascota_perfil_vigente p, jsonb_array_elements(coalesce(p.medicacion_actual,'[]'::jsonb)) m
     WHERE p.mascota_id = v_p.mascota_id
       AND (m->>'fecha_fin_estimada' IS NULL
            OR (m->>'fecha_fin_estimada')::date >= current_date);
  END IF;

  RETURN jsonb_build_object(
    'nombre', v_m.nombre, 'especie', v_m.especie, 'raza', v_m.raza,
    'sexo', v_m.sexo, 'edad', v_edad,
    'foto_path', v_m.foto_url,
    'perdida', (v_m.estado_vida = 'perdida'),
    'chip', CASE WHEN coalesce(v_c.mostrar_chip, true)
                 THEN (SELECT microchip_activo FROM mascota_perfil_vigente
                        WHERE mascota_id = v_p.mascota_id) END,
    'contacto', CASE WHEN coalesce(v_c.mostrar_contacto, true) THEN jsonb_build_object(
        'nombre', v_c.contacto_nombre, 'telefono', v_c.contacto_telefono,
        'mensaje', v_c.contacto_mensaje) END,
    'alergias', v_alergias,
    'medicacion', v_medicacion
  );
END $function$;
revoke all on function public.leer_pasaporte(text) from public;
grant execute on function public.leer_pasaporte(text) to anon, authenticated;
commit;
