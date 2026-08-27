-- ============================================================================
-- S106-A t3 · LA CURA DEL DIAGNÓSTICO ESTABA A MEDIAS — y lo encontró ejercerla
--
-- 🔴 `20260827030000` acotó el guard de `sedimentar_nota_clinica` a su letra
-- (diagnóstico obligatorio **salvo derivación**) — y **la COLUMNA seguía
-- `NOT NULL`.** Ejercido con el JWT del vet:
--
--   ① sin desenlace  → `nota_sin_diagnostico`            ✓
--   ② derivación     → 🔴 `null value in column "diagnostico_principal"`
--   ③ con fórmula    → `derivacion_no_emite_receta`      ✓
--
-- > *Curar la puerta y no seguir el camino hasta donde el dato se escribe deja
-- > la mitad de una cura mirando a la otra.* Es `D-921` otra vez, y esta vez la
-- > cometí yo. **No lo vio ningún gate: lo vio correr la función.**
--
-- ── LA CURA NO ES AFLOJAR: ES DECIR EL INVARIANTE ──────────────────────────
-- Un `DROP NOT NULL` a secas dejaría entrar **cualquier** consulta sin
-- diagnóstico por cualquier puerta — incluidas las que no son derivación.
-- *El guard de la función protege el camino que la función controla; una
-- escritura futura por otro lado no lo vería.*
--
-- ⇒ El `NOT NULL` se reemplaza por un **CHECK que expresa la regla completa**:
--
--     diagnostico_principal IS NOT NULL  OR  desenlace = 'derivacion'
--
-- **Una consulta sin diagnóstico que no sea derivación queda INEXPRESABLE**, no
-- «prohibida por prosa». *El modelo pasa a saber la regla, en vez de confiar en
-- que la única puerta la recuerde.*
--
-- ── VEDA 76(g): NO RIGE. Restricción de tabla, cero backfill.
--    Medido antes: **0 de 6 filas** sin diagnóstico ⇒ el CHECK entra sin
--    violar nada y **NO hace falta `NOT VALID`**.
-- ── REVERSA: docs/relevamientos/2026-08-27-s106a-REVERSA-diagnostico-invariante.sql
-- ============================================================================

ALTER TABLE public.evento_historia_clinica_registrada
  ALTER COLUMN diagnostico_principal DROP NOT NULL;

ALTER TABLE public.evento_historia_clinica_registrada
  ADD CONSTRAINT chk_hc_diagnostico_o_derivacion
  CHECK (diagnostico_principal IS NOT NULL OR desenlace = 'derivacion');

-- ── CINTURÓN: los TRES brazos, ejercidos por el camino real y deshechos ────
DO $cinturon$
DECLARE
  v_rol text := current_user;
  v_cita uuid; v_mas uuid; v_cc uuid; v_emp uuid; v_vet uuid;
  r1 text := '(no rebotó)'; r2 text := '(no pasó)'; r3 text := '(no rebotó)';
BEGIN
  SELECT c.id, c.mascota_id, pr.cuenta_comercial_id, pe.id, pr.user_id
    INTO v_cita, v_mas, v_cc, v_emp, v_vet
  FROM evento_cita_servicio c
  JOIN prestadores pr ON pr.id = c.prestador_id
  JOIN prestador_empleados pe ON pe.prestador_id = pr.id AND pe.rol='dueño' AND pe.activo
  WHERE c.modalidad='telemedicina'
    AND NOT EXISTS (SELECT 1 FROM evento_historia_clinica_registrada h WHERE h.cita_id=c.id)
  ORDER BY c.created_at DESC LIMIT 1;
  IF v_cita IS NULL THEN
    RAISE EXCEPTION 'cinturon: no hay teleconsulta sin historia con la que ejercer';
  END IF;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_vet, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    BEGIN
      PERFORM public.sedimentar_nota_clinica(v_cita, v_cc, v_emp, v_mas,
        '{"motivo":"tos"}'::jsonb, NULL, 'EC');
    EXCEPTION WHEN OTHERS THEN r1 := SQLERRM; END;

    /* 🔴 EL ORDEN NO ES ESTÉTICO: los brazos que REBOTAN van primero y el que
       ESCRIBE al final. Con el orden natural (②→③), la sedimentación de ②
       hacía que ③ rebotara con `hc_ya_existe` **en vez de con su propio
       código** — y el cinturón habría dado rojo por la razón equivocada, que
       está tan roto como un verde por la razón equivocada. Lo cazó él mismo en
       su primera corrida. */
    BEGIN
      PERFORM public.sedimentar_nota_clinica(v_cita, v_cc, v_emp, v_mas,
        '{"motivo":"tos","desenlace":"derivacion","formula":[{"nombre":"X"}]}'::jsonb, NULL, 'EC');
    EXCEPTION WHEN OTHERS THEN r3 := SQLERRM; END;

    BEGIN
      PERFORM public.sedimentar_nota_clinica(v_cita, v_cc, v_emp, v_mas,
        '{"motivo":"tos","desenlace":"derivacion"}'::jsonb, NULL, 'EC');
      r2 := 'PASÓ';
    EXCEPTION WHEN OTHERS THEN r2 := SQLERRM; END;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    IF r1 NOT LIKE '%nota_sin_diagnostico%' THEN
      RAISE EXCEPTION 'cinturon ①: sin desenlace debía rebotar y dio: %', r1;
    END IF;
    IF r2 <> 'PASÓ' THEN
      RAISE EXCEPTION 'cinturon ②: la DERIVACIÓN sigue sin poder sedimentar: %', r2;
    END IF;
    IF r3 NOT LIKE '%derivacion_no_emite_receta%' THEN
      RAISE EXCEPTION 'cinturon ③: una derivación sin diagnóstico pudo emitir receta: %', r3;
    END IF;

    RAISE EXCEPTION 'cinturon_ok_deshacer';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'cinturon_ok_deshacer' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'cinturon diagnostico: OK · sin desenlace rebota · la derivación sedimenta · sin diagnóstico no hay receta';
END;
$cinturon$;
