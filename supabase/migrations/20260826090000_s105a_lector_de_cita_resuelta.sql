-- ══════════════════════════════════════════════════════════════════════════
-- S105-A · EL LECTOR QUE RESUELVE UNA CITA **CUALQUIERA SEA SU ESTADO**
--
-- EL HUECO, y su forma es interesante: **ningún lector resuelve una cita por
-- id sin filtrar por estado.** Medido: los diez que reciben `p_cita_id` son de
-- ACCIÓN (confirmar, iniciar, completar, cancelar) o de un oficio puntual.
-- ⇒ una pantalla que abre una cita cancelada **no puede distinguir «no existe»
-- de «existe y está cancelada»**, y la única voz posible es la conjetura
-- *«puede haberse movido o cancelado»*. *Una app que conjetura sobre su propio
-- dato es una app que no fue a mirarlo.*
--
-- 🔴 POR QUÉ NO SE CURÓ DONDE PARECÍA — el freno que produjo esta pieza:
-- la propuesta original era dejar pasar `cancelada` en
-- `obtener_jornada_recepcion`. **Medido, ahí no había un olvido: había la ley
-- §13, escrita literal en el cuerpo de esa función** (*«la agenda solo contiene
-- verdad firme»*). Meter citas muertas en la lista de trabajo del día es lo
-- que esa ley existe para impedir — *una agenda donde conviven lo que hay que
-- atender y lo que ya no existe deja de ser una agenda y pasa a ser un log.*
--
-- **Y al medirlo con ese criterio se cayeron los CUATRO sitios de esa clase**
-- (`citasMascota` · `serviciosHogar` · `hogar.ts` · la jornada): los cuatro
-- prometen **lo que VIENE**, y ahí excluir es correcto.
--
-- ⇒ **LA REGLA QUE QUEDA, más angosta que la que se iba a aplicar:** *una cita
-- cancelada aparece SÓLO donde la superficie promete contar lo que **PASÓ**.
-- Donde promete lo que **VIENE**, excluirla es correcto — y en una agenda de
-- trabajo es obligatorio.* **Ninguno de los 16 sitios censados cambia.**
-- **§13 NO se enmienda: no había contradicción, había un censo mal clasificado.**
--
-- ESTA FUNCIÓN ES LA OTRA MITAD: la persona fue a preguntar **al detalle**, no
-- a la agenda. Acá sí se le contesta, con el estado real y su porqué.
--
-- 76(g) — VEDA: **NO RIGE.** Función nueva de SÓLO LECTURA. Cero escritura.
-- REVERSA escrita ANTES: `docs/relevamientos/S105-A-REVERSA-20260826090000.sql`
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.obtener_cita_resuelta(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_c evento_cita_servicio;
  v_uid uuid := auth.uid();
  v_puede boolean;
  v_motivo text;
  v_causa text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion');
  END IF;

  SELECT * INTO v_c FROM evento_cita_servicio WHERE id = p_cita_id;
  IF NOT FOUND THEN
    /* 🔴 «NO EXISTE» ES UNA RESPUESTA LEGÍTIMA Y DISTINTA DE «CANCELADA».
       *Confundir las dos es exactamente el defecto que esta función viene a
       curar: la pantalla tiene que poder decir cuál de las dos pasó.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe');
  END IF;

  /* EL GATE — las dos audiencias legítimas y ninguna más.
     🔴 Se reusan los helpers de la casa en vez de escribir el predicado:
     *un permiso re-implementado diverge del original el día que uno de los dos
     se corrija.* */
  SELECT public.user_tiene_acceso_a_mascota(v_c.mascota_id)          -- la familia
      OR public.es_mi_prestador(v_c.prestador_id)                    -- quien atiende
      OR public.is_admin()
    INTO v_puede;

  IF NOT COALESCE(v_puede, false) THEN
    /* Mismo código que «no existe» a propósito: *decirle «existe pero no es
       tuya» a quien no tiene acceso le confirma que esa cita existe.* */
    RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe');
  END IF;

  /* ¿POR QUÉ SE CANCELÓ? — hoy hay DOS causas vivas que escriben el mismo
     estado, y la pantalla no puede distinguirlas sin esto.
     ⚠️ SALE DE `metadata`, **NO de la columna `motivo`**: esa columna es el
     motivo de CONSULTA que escribió la familia al reservar (*«cojea de la pata
     trasera»*). Leerla acá pondría el síntoma del perro donde va la razón de
     la cancelación. */
  v_motivo := v_c.metadata->>'motivo';
  v_causa := CASE
    WHEN v_c.estado <> 'cancelada' THEN NULL
    WHEN v_c.metadata ? 'cancelada_por_reverso_en' THEN 'pago_reversado'
    WHEN v_motivo = 'cierre_periodo_plan'          THEN 'cierre_de_plan'
    WHEN v_motivo IS NOT NULL                      THEN 'otra'
    /* 🔴 `desconocida` NO ES UN HUECO QUE HAYA QUE TAPAR: hay citas canceladas
       ANTES de que nadie guardara el porqué. *Devolver «otra» ahí sería
       afirmar que hubo una razón registrada.* La pantalla dice lo que sabe. */
    ELSE 'desconocida'
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'cita_id', v_c.id,
    'estado', v_c.estado,
    'estado_reserva', v_c.estado_reserva,
    'fecha', v_c.fecha,
    'hora', v_c.hora,
    'tipo_servicio', v_c.tipo_servicio,
    'prestador_id', v_c.prestador_id,
    'mascota_id', v_c.mascota_id,
    'cancelada', (v_c.estado = 'cancelada'),
    'causa_cancelacion', v_causa,
    'motivo_crudo', v_motivo,
    'cancelada_en', v_c.metadata->>'cancelada_por_reverso_en'
  );
END $$;

REVOKE ALL ON FUNCTION public.obtener_cita_resuelta(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_cita_resuelta(uuid) TO authenticated, service_role;


-- ══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — sólo lee. Brazos: discrimina los tres desenlaces · el gate cierra
-- · y 🔴 la jornada quedó INTACTA (lo que el freno protegía).
-- ══════════════════════════════════════════════════════════════════════════
DO $cint$
DECLARE
  v_cancelada uuid; v_viva uuid; v_dueno uuid; v_ajeno uuid;
  r_can jsonb; r_viva jsonb; r_ajeno jsonb; r_fantasma jsonb;
  v_jornada_intacta boolean;
BEGIN
  /* ⓪ 🔴 LO QUE EL FRENO PROTEGÍA: la jornada NO dejó entrar `cancelada`.
     *Si esta migración la hubiera tocado, habría curado un síntoma rompiendo
     una ley — y el cinturón es el lugar donde eso se prueba, no se promete.* */
  SELECT prosrc NOT ILIKE '%''cancelada''%'
    INTO v_jornada_intacta FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_jornada_recepcion';
  IF NOT v_jornada_intacta THEN
    RAISE EXCEPTION 'CINTURÓN: la jornada dejó entrar cancelada — §13 rota';
  END IF;

  SELECT id, (SELECT m.user_id FROM mascotas m WHERE m.id = c.mascota_id)
    INTO v_cancelada, v_dueno
    FROM evento_cita_servicio c WHERE c.estado='cancelada' LIMIT 1;
  SELECT id INTO v_viva FROM evento_cita_servicio WHERE estado='confirmada' LIMIT 1;
  SELECT u.id INTO v_ajeno FROM auth.users u WHERE u.id <> v_dueno LIMIT 1;

  IF v_cancelada IS NULL OR v_dueno IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: sin cita cancelada contra la cual medir';
  END IF;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_dueno::text, 'role','authenticated')::text, true);
  PERFORM set_config('role','authenticated', true);

  r_can      := obtener_cita_resuelta(v_cancelada);
  r_viva     := obtener_cita_resuelta(v_viva);
  r_fantasma := obtener_cita_resuelta('00000000-0000-0000-0000-000000000000'::uuid);

  -- ③ EL GATE: alguien sin acceso no debe poder resolverla
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_ajeno::text, 'role','authenticated')::text, true);
  r_ajeno := obtener_cita_resuelta(v_cancelada);

  PERFORM set_config('role','postgres', true);

  IF (r_can->>'cancelada')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURÓN: no reconoce la cancelada — %', r_can;
  END IF;
  IF (r_can->>'causa_cancelacion') IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN: no dice la causa — %', r_can;
  END IF;
  IF (r_viva->>'cancelada')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURÓN: marca cancelada una cita viva — %', r_viva;
  END IF;
  IF (r_fantasma->>'codigo') <> 'cita_no_existe' THEN
    RAISE EXCEPTION 'CINTURÓN: un id inventado no dice cita_no_existe — %', r_fantasma;
  END IF;
  /* 🔴 EL BRAZO QUE IMPORTA: el ajeno recibe **el mismo código que un id
     inventado**. Si dijera algo distinto, la diferencia misma le confirmaría
     que la cita existe. */
  IF (r_ajeno->>'codigo') <> 'cita_no_existe' THEN
    RAISE EXCEPTION 'CINTURÓN: un tercero pudo resolver la cita — %', r_ajeno;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · cancelada=% causa=% · viva=% · fantasma=% · ajeno=% · jornada intacta=%',
    r_can->>'cancelada', r_can->>'causa_cancelacion', r_viva->>'estado',
    r_fantasma->>'codigo', r_ajeno->>'codigo', v_jornada_intacta;
END $cint$;
