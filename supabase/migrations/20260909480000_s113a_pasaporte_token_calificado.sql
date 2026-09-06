-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A · 1.3 — `gen_random_bytes` va CALIFICADO
--
-- 🔴 Lo cazó el arnés en su primera corrida: `42883 function
-- gen_random_bytes(integer) does not exist`. Medido: vive en
-- **`extensions.gen_random_bytes`** (pgcrypto), y esta función tiene
-- `search_path` fijo a `public, pg_temp` — que es lo correcto y no se afloja.
--
-- *Un `search_path` fijo es una defensa, no un estorbo: aflojarlo para que una
-- extensión se encuentre sola es exactamente cómo se abre la puerta que ese
-- pin existe para cerrar.* Se califica la llamada.
--
-- ⚠️ Y NO se cambia el algoritmo: `gen_random_uuid()` estaría en `pg_catalog` y
-- resolvería sin calificar, pero **son 36 caracteres en una chapita contra 22**,
-- y el largo de la URL es justamente lo que se decidió.
--
-- 76(g) — VEDA: NO RIGE. CREATE OR REPLACE de una función.
-- ═══════════════════════════════════════════════════════════════════════════
begin;
create or replace function public.emitir_pasaporte(p_mascota_id uuid)
returns jsonb
language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
DECLARE v_uid uuid := auth.uid(); v_token text; v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_es_familiar_adulto_de_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  UPDATE pasaporte SET revocado_en = now()
   WHERE mascota_id = p_mascota_id AND revocado_en IS NULL;

  -- 128 bits → base64url de 22 caracteres. `extensions.` porque el search_path
  -- de esta función está fijo, y así se queda.
  v_token := rtrim(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/', '-_'), '=');

  INSERT INTO pasaporte (mascota_id, token, emitido_por)
  VALUES (p_mascota_id, v_token, v_uid) RETURNING id INTO v_id;

  INSERT INTO pasaporte_config (mascota_id) VALUES (p_mascota_id)
  ON CONFLICT (mascota_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'token', v_token);
END $function$;
revoke all on function public.emitir_pasaporte(uuid) from public, anon;
grant execute on function public.emitir_pasaporte(uuid) to authenticated;
commit;
