/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · SE PUEDE RETIRAR UNA FRANJA — y cambiar de patrón es UN acto
   ═══════════════════════════════════════════════════════════════════════════

   ── 🔴 EL HALLAZGO DE C, VERIFICADO ──────────────────────────────────────
   `guarderia_franjas.activo` **existe** y `definir_franja_guarderia` **no lo
   expone** — su UPSERT lo fuerza a `true`. ⇒ **no había camino para retirar una
   franja.**

   > Cambiar de horario dejaba **dos ventanas contradictorias vivas**, y la
   > lista de la familia **lee las dos**. *El prestador creía haber cambiado su
   > horario y en realidad había agregado uno.*

   🔴 **Y bloquea la firma que la mesa está por dar:** sin esto **el prestador no
   puede declarar que abre sábados** —tendría que dejar la franja L-V vieja
   conviviendo— y ése es justo el caso que decide los días del plan mensual.

   ── DOS PUERTAS, Y LA SEGUNDA ES LA QUE C PIDIÓ ─────────────────────────
   ① **`retirar_franja_guarderia(id)`** — el retiro simple. **Soft: `activo =
     false`, jamás DELETE.** *Una franja borrada se lleva la historia de por qué
     un día pasado tenía esa ventana; retirada, el pasado sigue siendo legible.*

   ② **`reemplazar_franjas_guarderia(prestador, tipo, franjas[])`** — **el acto
     ATÓMICO**: retira TODAS las de ese tipo y define las nuevas **en la misma
     transacción**.

   > 🔴 **Por qué el reemplazo existe además del retiro:** hacerlo con dos
   > llamadas deja una ventana —de milisegundos o de minutos, si la segunda
   > falla— **en la que el lugar no tiene horario o tiene dos**. *Y en el medio
   > puede entrar una reserva.* **Un cambio de patrón es una sola decisión del
   > prestador; que sea un solo acto no es comodidad, es correctitud.**

   ⚠️ **El retiro NO frena dejar el tipo sin ventanas** —el prestador puede estar
   reconfigurando— **pero lo DICE** en su retorno (`sin_ventanas_de_ese_tipo`).
   *Frenarlo lo trabaría a mitad de un cambio; callarlo lo dejaría publicado sin
   horario sin enterarse.* La pantalla decide qué hacer con ese dato.

   **76(g): NO RIGE.** **Reversa:** `S107-A-REVERSA-retiro-franjas.sql`.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.retirar_franja_guarderia(p_franja_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v_prest uuid; v_tipo text; v_quedan int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT f.prestador_id, f.tipo INTO v_prest, v_tipo
    FROM guarderia_franjas f WHERE f.id = p_franja_id;
  IF v_prest IS NULL THEN RAISE EXCEPTION 'franja_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT user_gestiona_prestador(v_prest) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;

  UPDATE guarderia_franjas SET activo = false WHERE id = p_franja_id;

  SELECT count(*) INTO v_quedan FROM guarderia_franjas
   WHERE prestador_id = v_prest AND tipo = v_tipo AND activo;

  RETURN jsonb_build_object('ok', true, 'franja_id', p_franja_id, 'tipo', v_tipo,
    /* Se DICE, no se frena: el prestador puede estar a mitad de un cambio, y
       trabarlo ahí sería peor que avisarle. */
    'sin_ventanas_de_ese_tipo', v_quedan = 0);
END $fn$;

CREATE OR REPLACE FUNCTION public.reemplazar_franjas_guarderia(
  p_prestador_id uuid, p_tipo text, p_franjas jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v_it jsonb; v_n int := 0; v_r jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE='42501';
  END IF;
  IF p_tipo NOT IN ('recogida','devolucion') THEN
    RAISE EXCEPTION 'tipo_de_franja_invalido' USING ERRCODE='22023';
  END IF;
  IF p_franjas IS NULL OR jsonb_typeof(p_franjas) <> 'array' THEN
    RAISE EXCEPTION 'franjas_invalidas' USING ERRCODE='22023';
  END IF;

  /* 🔴 RETIRAR PRIMERO, DENTRO DE LA MISMA TRANSACCIÓN. Así el guard de cruce
     de `definir_franja_guarderia` **no ve las viejas** —que es lo correcto: se
     están yendo— y **no existe ningún instante con las dos vivas.** */
  UPDATE guarderia_franjas SET activo = false
   WHERE prestador_id = p_prestador_id AND tipo = p_tipo AND activo;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_franjas) LOOP
    /* Pasa por la PUERTA existente: sus validaciones —orden de la ventana,
       cruce entre tipos, días válidos— **no se reimplementan acá.** */
    v_r := public.definir_franja_guarderia(
      p_prestador_id, p_tipo,
      (v_it->>'desde')::time, (v_it->>'hasta')::time,
      ARRAY(SELECT jsonb_array_elements_text(v_it->'dias_semana'))::int[],
      COALESCE(v_it->>'zona_horaria', 'America/Guayaquil'));
    v_n := v_n + 1;
  END LOOP;

  IF v_n = 0 THEN
    /* Un array vacío es un retiro total DECLARADO — no un error. El prestador
       puede querer dejar de ofrecer ese tramo. Se dice en el retorno. */
    RETURN jsonb_build_object('ok', true, 'tipo', p_tipo, 'definidas', 0,
      'sin_ventanas_de_ese_tipo', true);
  END IF;

  RETURN jsonb_build_object('ok', true, 'tipo', p_tipo, 'definidas', v_n,
    'sin_ventanas_de_ese_tipo', false);
END $fn$;

REVOKE EXECUTE ON FUNCTION public.retirar_franja_guarderia(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reemplazar_franjas_guarderia(uuid,text,jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.retirar_franja_guarderia(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.reemplazar_franjas_guarderia(uuid,text,jsonb) TO authenticated;

-- ══ CINTURÓN — el discriminador es EL CASO DE C: cambiar a sábados ═══════
DO $cint$
DECLARE
  v_rol text := current_user; v_prest uuid; v_dueno uuid; v_r jsonb;
  v_vivas int; v_sab int;
BEGIN
  SELECT ps.prestador_id, pr.user_id INTO v_prest, v_dueno
    FROM prestador_servicios ps JOIN prestadores pr ON pr.id = ps.prestador_id
   WHERE ps.tipo_servicio='guarderia_dia' LIMIT 1;

  BEGIN   -- subtransacción que se deshace sola (L-406)
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_dueno, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    /* EL CASO EXACTO: el lugar pasa de L-V a L-S. Con el defecto viejo quedaban
       las DOS y la familia leía un horario contradictorio. */
    v_r := public.reemplazar_franjas_guarderia(v_prest, 'recogida',
      '[{"desde":"07:00","hasta":"09:00","dias_semana":[1,2,3,4,5,6]}]'::jsonb);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);

    SELECT count(*) INTO v_vivas FROM guarderia_franjas
     WHERE prestador_id=v_prest AND tipo='recogida' AND activo;
    SELECT count(*) INTO v_sab FROM guarderia_franjas
     WHERE prestador_id=v_prest AND tipo='recogida' AND activo AND 6 = ANY(dias_semana);

    /* 🔴 UNA sola ventana viva: sin el retiro habrían quedado DOS. */
    IF v_vivas <> 1 THEN
      RAISE EXCEPTION 'CINTURON: quedaron % ventanas de recogida vivas, esperaba 1 — el retiro no retiro', v_vivas;
    END IF;
    IF v_sab <> 1 THEN
      RAISE EXCEPTION 'CINTURON: la ventana viva no cubre el sabado — el prestador no pudo declararlo';
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · L-V pasa a L-S en UN acto: 1 ventana viva y cubre sabado (sin el retiro quedaban DOS contradictorias)';
END
$cint$;

COMMIT;
