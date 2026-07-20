-- S72-A · 2c — REVOKE anon/PUBLIC de tres DEFINER clínicas (L-140).
--
-- Restrictiva PURA: solo quita privilegio, no crea ni modifica lógica.
-- 76(g) NO rige (no toca datos ni modelo). Una ley que espera no es ley:
-- este REVOKE no espera a la jubilación de Tanda 3.
--
-- Relevamiento S72-A0: las tres nacieron (constelación S70, `150000`) con
-- `anon=X` en proacl — el REVOKE FROM PUBLIC no quita el grant explícito a
-- anon que los default privileges insertan (L-140). Censo de callers hecho
-- ANTES (regla: un REVOKE ciego rompe lo que no se miró):
--   _user_clinica_consultor_del_caso / _user_clinica_tratante_del_caso —
--     los invocan POLICIES RLS (caso_clinico_select/update_clinica_*,
--     consultor_*) y DEFINERs (sedimentar_nota_clinica, asociar_a_caso).
--     Todos corren como `authenticated`, que se CONSERVA. anon nunca
--     dispara esas policies (caso_clinico no es tabla pre-login).
--   completar_historia_clinica — huérfana del legado (§14.1 la manda
--     JUBILAR; el DROP es Tanda 3). CERO callers reales en DB y en TS
--     (el hit en database.types.ts es tipo generado, no un caller).
--
-- Firmas exactas del catálogo (pg_get_function_identity_arguments):
--   _user_clinica_consultor_del_caso(p_caso_id uuid, p_user_id uuid)
--   _user_clinica_tratante_del_caso(p_caso_id uuid, p_user_id uuid)
--   completar_historia_clinica(input_data jsonb)

REVOKE EXECUTE ON FUNCTION public._user_clinica_consultor_del_caso(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._user_clinica_tratante_del_caso(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.completar_historia_clinica(jsonb) FROM PUBLIC, anon;

-- Sonda L-140: anon NO ejecuta ninguna de las tres; authenticated SÍ las
-- dos que las policies necesitan. Falla la migración si el estado no es el
-- esperado (la verificación ES el test — L-063).
DO $$
DECLARE
  v_anon_consultor  boolean := has_function_privilege('anon', 'public._user_clinica_consultor_del_caso(uuid,uuid)', 'EXECUTE');
  v_anon_tratante   boolean := has_function_privilege('anon', 'public._user_clinica_tratante_del_caso(uuid,uuid)', 'EXECUTE');
  v_anon_hc         boolean := has_function_privilege('anon', 'public.completar_historia_clinica(jsonb)', 'EXECUTE');
  v_auth_consultor  boolean := has_function_privilege('authenticated', 'public._user_clinica_consultor_del_caso(uuid,uuid)', 'EXECUTE');
  v_auth_tratante   boolean := has_function_privilege('authenticated', 'public._user_clinica_tratante_del_caso(uuid,uuid)', 'EXECUTE');
BEGIN
  IF v_anon_consultor OR v_anon_tratante OR v_anon_hc THEN
    RAISE EXCEPTION 'L-140 incumplida: anon aún ejecuta (consultor=% tratante=% hc=%)',
      v_anon_consultor, v_anon_tratante, v_anon_hc;
  END IF;
  IF NOT v_auth_consultor OR NOT v_auth_tratante THEN
    RAISE EXCEPTION 'REGRESIÓN: authenticated perdió EXECUTE de los helpers que las policies RLS necesitan (consultor=% tratante=%)',
      v_auth_consultor, v_auth_tratante;
  END IF;
  RAISE NOTICE 'S72-A 2c OK: anon fuera de las 3; authenticated intacto en los 2 helpers de policy.';
END $$;
