/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · DE DÓNDE SALIÓ LA RESERVA — dato propio, no deducción
   ═══════════════════════════════════════════════════════════════════════════
   Pedido de C. La letra pide que la fila del hub aparezca marcada **«Con tu
   paquete»**, y `EstadiaDeMiMascota` no traía con qué saberlo.

   🔴 **Y C hizo lo correcto al NO deducirlo de `precio === null`.** Su
   argumento, que va acá porque vale más que el caso: *deducir el origen de un
   silencio es el antipatrón que esta casa persigue — el día que un día suelto
   también venga sin precio, la marca empieza a mentir y nadie lo nota.*

   ⚠️ **No faltaba dato: faltaba PROYECCIÓN.** `evento_cita_servicio.bono_id` ya
   existía y ya se llenaba. Es el mismo caso que los dos tramos, tres líneas más
   arriba en esta misma función — **la tercera vez en S107 que lo que faltaba no
   era una entidad sino una columna que nadie proyectó.**

   Se expone `bono_id` y **no un booleano**: el id dice *cuál* paquete, que la
   superficie puede querer después. El `dePaquete` se deriva **en el wrapper, en
   un solo lugar**, para que ninguna pantalla lo derive por su cuenta.

   ⚖️ VEDA 76(g): **NO RIGE** — reemplazo de cuerpo, sin backfill.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831140000-origen-estadia.sql`

   ⚠️ `RETURNS TABLE` cambia ⇒ **DROP explícito antes** (L-119: un
   `CREATE OR REPLACE` con firma distinta no reemplaza, deja una sobrecarga
   zombi y el llamador se queda con la vieja).
   ═══════════════════════════════════════════════════════════════════════════ */
DROP FUNCTION IF EXISTS public.obtener_mis_estadias_guarderia(uuid);

CREATE OR REPLACE FUNCTION public.obtener_mis_estadias_guarderia(p_mascota_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(cita_id uuid, estadia_id uuid, mascota_id uuid, mascota_nombre text, prestador_id uuid, prestador_nombre text, fecha date, precio numeric, estado_cita text, estado_reserva text, estado_estadia text, a_bordo_en timestamp with time zone, llegada_en timestamp with time zone, entregada_en timestamp with time zone, acta_recogida_id uuid, acta_devolucion_id uuid, tramo_recogida_id uuid, tramo_devolucion_id uuid, bono_id uuid, es_proxima boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_mascota_id IS NOT NULL AND NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT c.id, e.id, c.mascota_id, m.nombre,
         c.prestador_id, pr.nombre_comercial,
         c.fecha, c.precio,
         c.estado, c.estado_reserva, e.estado,
         e.a_bordo_en, e.llegada_en, e.entregada_en,
         ar.id, ad.id,
         /* ✏️ LOS DOS TRAMOS — no faltaba entidad, faltaba proyección. Con
            estos dos campos el mapa del punto vivo se enciende solo. */
         e.tramo_recogida_id, e.tramo_devolucion_id,
         /* ✏️ EL ORIGEN DE LA RESERVA, COMO DATO PROPIO. La letra pide que la
            fila diga «Con tu paquete», y **eso NO se deduce de `precio IS NULL`**:
            deducir el origen de un silencio es el antipatrón que esta casa
            persigue —el día que un día suelto también venga sin precio, la
            marca empieza a mentir y nadie lo nota—. La columna ya existía en la
            cita; **no faltaba dato, faltaba proyección** (mismo caso que los dos
            tramos, tres líneas más arriba). */
         c.bono_id,
         (c.fecha >= public.hoy_local()
          AND c.estado IN ('pendiente','confirmada','en_curso')) AS es_proxima
    FROM evento_cita_servicio c
    JOIN mascotas m      ON m.id = c.mascota_id
    JOIN prestadores pr  ON pr.id = c.prestador_id
    LEFT JOIN guarderia_estadias e ON e.cita_id = c.id
    LEFT JOIN guarderia_actas ar ON ar.estadia_id = e.id AND ar.direccion = 'recogida'
    LEFT JOIN guarderia_actas ad ON ad.estadia_id = e.id AND ad.direccion = 'devolucion'
   WHERE c.tipo_servicio = 'guarderia_dia'
     AND (p_mascota_id IS NULL OR c.mascota_id = p_mascota_id)
     AND user_tiene_acceso_a_mascota(c.mascota_id)
     AND (c.estado_reserva = 'pagada'
          OR (c.estado_reserva = 'pendiente_pago' AND c.expira_en > now()))
   ORDER BY c.fecha DESC, c.id;
END $function$
;

REVOKE EXECUTE ON FUNCTION public.obtener_mis_estadias_guarderia(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mis_estadias_guarderia(uuid) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR
   ───────────────────────────────────────────────────────────────────────────
   «Devuelve `bono_id`» no mide nada: una columna que siempre viene NULL también
   «devuelve `bono_id`». Los dos brazos que discriminan son **una estadía de
   paquete y una de día suelto en la misma corrida**:
     ① la de paquete trae `bono_id` NO NULO **y es el bono que se compró**
     ② la de día suelto lo trae **NULL**
   Sin el brazo ②, una proyección que devolviera el mismo id para todo daría
   verde. Escribe en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406).
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user; v_user uuid; v_fam uuid; v_masc uuid; v_prest uuid; v_tam int;
  v_r jsonb; v_bono uuid; v_d1 date; v_d2 date;
  v_de_paq uuid; v_de_suelto uuid; v_out text := ''; v_ok int := 0; v_c0 int; v_c1 int;
BEGIN
  SELECT count(*) INTO v_c0 FROM evento_cita_servicio WHERE tipo_servicio='guarderia_dia';
  SELECT c.user_id, c.mascota_id INTO v_user, v_masc FROM evento_cita_servicio c
    JOIN mascotas m ON m.id=c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm WHERE fm.user_id=v_user AND fm.hasta IS NULL LIMIT 1;
  SELECT ps.prestador_id INTO v_prest FROM prestador_servicios ps
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo LIMIT 1;
  SELECT gp.tamano INTO v_tam FROM guarderia_paquetes gp
   WHERE gp.prestador_id=v_prest AND gp.activo ORDER BY gp.tamano DESC LIMIT 1;

  BEGIN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub',v_user,'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    PERFORM public.aceptar_documentos_guarderia(v_fam, NULL);

    /* Los DOS primeros días que el lugar opera. ⚠️ La v1 de estas líneas los
       dejó iguales y **el guard de `20260831060000` —un día por mascota— rebotó
       el arnés**: el instrumento de ayer cazó el error de hoy. Se deja escrito
       porque es la mejor prueba de que ese guard sirve. */
    /* ⚠️ DÍAS QUE EL LUGAR OPERA **Y QUE ESA MASCOTA NO TENGA YA**. Las dos
       primeras versiones de estas líneas no filtraban por lo segundo y **el
       guard de `20260831060000` —un día por mascota— rebotó el arnés dos
       veces**: hay citas de guardería VIVAS en la base (el founder recorrió el
       camino). *El instrumento de ayer cazó el error del arnés de hoy, sobre
       datos reales — se deja escrito porque es la mejor prueba de que ese guard
       sirve.* */
    SELECT min(d)::date INTO v_d1 FROM generate_series(public.hoy_local()+1, public.hoy_local()+30,'1 day') d
     WHERE public._guarderia_dia_operativo(v_prest, d::date)
       AND NOT EXISTS (SELECT 1 FROM evento_cita_servicio c
                        WHERE c.mascota_id=v_masc AND c.fecha=d::date
                          AND c.tipo_servicio='guarderia_dia'
                          AND c.estado NOT IN ('cancelada','rechazada','no_realizable'));
    SELECT min(d)::date INTO v_d2 FROM generate_series(public.hoy_local()+1, public.hoy_local()+30,'1 day') d
     WHERE public._guarderia_dia_operativo(v_prest, d::date) AND d::date > v_d1
       AND NOT EXISTS (SELECT 1 FROM evento_cita_servicio c
                        WHERE c.mascota_id=v_masc AND c.fecha=d::date
                          AND c.tipo_servicio='guarderia_dia'
                          AND c.estado NOT IN ('cancelada','rechazada','no_realizable'));
    IF v_d1 IS NULL OR v_d2 IS NULL THEN
      RAISE EXCEPTION 'CINTURON: no hay dos dias libres para esa mascota en 30 dias — el arnes no midio nada';
    END IF;

    v_r := public.comprar_paquete_guarderia(v_prest, v_tam);
    v_bono := (v_r->>'bono_id')::uuid;
    PERFORM public.reservar_dia_de_paquete_guarderia(v_bono, v_d1, v_masc);
    PERFORM public.reservar_dia_guarderia(v_prest, v_masc, v_d2);

    SELECT e.bono_id INTO v_de_paq    FROM public.obtener_mis_estadias_guarderia(v_masc) e WHERE e.fecha = v_d1;
    SELECT e.bono_id INTO v_de_suelto FROM public.obtener_mis_estadias_guarderia(v_masc) e WHERE e.fecha = v_d2;

    v_out := v_out || format(E'\n  de PAQUETE (%s) -> bono_id %s', v_d1, COALESCE(v_de_paq::text,'NULL'));
    v_out := v_out || format(E'\n  dia SUELTO  (%s) -> bono_id %s', v_d2, COALESCE(v_de_suelto::text,'NULL'));
    IF v_de_paq = v_bono THEN v_ok := v_ok + 1; END IF;
    IF v_de_suelto IS NULL THEN v_ok := v_ok + 1; END IF;

    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'CINTURON_DESHACER';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_DESHACER' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_c1 FROM evento_cita_servicio WHERE tipo_servicio='guarderia_dia';
  RAISE NOTICE E'\n═══ CINTURON · el origen de la estadia ═══%\n\n  %/2 · residuo citas %→%', v_out, v_ok, v_c0, v_c1;
  IF v_ok <> 2 THEN RAISE EXCEPTION 'CINTURON ROJO: %/2. %', v_ok, v_out; END IF;
  IF v_c1 <> v_c0 THEN RAISE EXCEPTION 'CINTURON ROJO: residuo'; END IF;
END $cinturon$;
