/* ═══════════════════════════════════════════════════════════════════════════
   S112-A · D-485 EL CENSO — la misma asimetría, repetida en cinco tablas más
   ───────────────────────────────────────────────────────────────────────────
   🔴 76(g) — NO RIGE. Cinco `CREATE POLICY` aditivas. Cero backfill.

   ── EL CENSO: 81 TABLAS CUELGAN DE `mascota_id`. ────────────────────────
   33 gatean su SELECT por `user_tiene_acceso_a_mascota(_como)` — YA leen
   familia desde `20260908080000`. 15 gatean por `user_acceso_clinico_a_
   mascota` — YA la lee, misma migración. **48 de 81, cubiertas sin tocar
   nada hoy.** 26 usan un predicado propio; 7 no tienen policy de SELECT.

   De esas 26, **CINCO comparten la MISMA clase de bug que `mascotas` tenía**:
   un predicado `user_id = auth.uid()` (o su equivalente por codueño) que
   sólo mira al dueño DIRECTO y nunca pregunta si quien lee es de la MISMA
   familia — exactamente D-485, en otro lugar. Las otras 21 son de otra
   naturaleza (contenido público con `es_visible`, notificaciones dirigidas a
   UNA persona, tablas que DEFINEN la relación de familia/codueño y por eso
   se leen distinto) y **no entran acá** — ensancharlas trataría una clase
   distinta como si fuera la misma.

   Las 7 sin policy de SELECT no se tocan: sin RLS de lectura, `authenticated`
   no tiene grant efectivo salvo que algo más lo abra, y no hay evidencia de
   que ninguna deba tenerla — quedan fuera del alcance de ESTA cirugía.

   ── LOS CINCO, CON SU RAZÓN ──────────────────────────────────────────────
   `estadias` · `programas_contratados` · `suscripciones_servicio` — el
   registro de un servicio contratado PARA la mascota de la familia; hoy sólo
   quien apretó "comprar" lo ve. Un familiar que no compró no puede ver la
   estadía de su propio perro.

   `mascota_acceso_prestador` — quién tiene permiso de ver el expediente de
   MI mascota; hoy sólo el `mascotas.user_id` directo lo consulta. Una
   familia no podía auditar quién tiene acceso al animal que comparte.

   `accion_destructiva_pendiente` — el vocabulario del CHECK dice lo que es:
   `dar_baja` · `remover_codueño` · `transferir` · `cambiar_privacidad_
   critica` · `remover_familiar_autorizado` · `cambiar_modo_publico`. NO es
   eutanasia — es la máquina de consenso entre codueños. Hoy SÓLO codueño ve
   que hay una de estas pendiente (que es OTRO modelo, `mascota_codueño`, no
   `familia_miembro`). Se agrega la rama de familia **de SÓLO LECTURA**: que
   la familia entera pueda VER que hay una acción pendiente sobre su mascota
   es lo que evita que se decida algo así a espaldas de alguien que vive con
   el animal. **La aprobación/consenso sigue siendo de codueños** — esta
   migración no toca ESE camino, sólo abre que se pueda leer.

   ── LA FUENTE ÚNICA: `_user_es_de_la_familia_de`, la que D-485 ya escribió
   en `20260908080000`. Las cinco policies llaman a la MISMA función — no se
   repite el predicado de `familia_miembro` una sexta vez. */

/* ═══ ① LOS TRES `_pet_parent_own`, LA MISMA FORMA ════════════════════════ */
CREATE POLICY estadias_pet_parent_familia ON public.estadias FOR SELECT TO authenticated
  USING (public._user_es_de_la_familia_de(auth.uid(), mascota_id));

CREATE POLICY pc_pet_parent_familia ON public.programas_contratados FOR SELECT TO authenticated
  USING (public._user_es_de_la_familia_de(auth.uid(), mascota_id));

CREATE POLICY suscr_servicio_pet_parent_familia ON public.suscripciones_servicio FOR SELECT TO authenticated
  USING (public._user_es_de_la_familia_de(auth.uid(), mascota_id));

/* ═══ ② QUIÉN TIENE ACCESO A MI MASCOTA ═══════════════════════════════════ */
CREATE POLICY map_select_familia ON public.mascota_acceso_prestador FOR SELECT TO authenticated
  USING (public._user_es_de_la_familia_de(auth.uid(), mascota_id));

/* ═══ ③ LA ACCIÓN DESTRUCTIVA — SÓLO LECTURA, NO CONSENTIMIENTO ══════════ */
CREATE POLICY accion_destructiva_select_familia ON public.accion_destructiva_pendiente FOR SELECT TO authenticated
  USING (public._user_es_de_la_familia_de(auth.uid(), mascota_id));

/* ═══ EL CINTURÓN — LA TABLA REAL BAJO RLS, NO EL HELPER SUELTO ══════════
   `SET LOCAL ROLE authenticated` + `request.jwt.claims` es lo mismo que hace
   PostgREST bajo el capó (cambia de rol y fija el claim que las policies
   leen) — la diferencia con llamar al helper directo es que ACÁ se hace
   `SELECT * FROM <tabla>`, así que si una policy tuviera un typo en el
   nombre de columna o el `TO authenticated` faltara, esto lo cacha y
   llamar al helper no.

   TRES asientos, no dos: **titular** (compró, `user_id` directo) ·
   **familiar** (mismo hogar, no compró — el caso que esta migración abre) ·
   **tercero** (otra familia entera, mismos datos sembrados). Sin el tercero,
   "el familiar ve 1" no prueba nada — probaría igual con RLS apagada. */
DO $cinturon$
DECLARE
  v_titular uuid; v_fam uuid; v_familiar uuid; v_tercero uuid;
  v_prestador uuid; v_cuenta uuid; v_m uuid; v_n int;
BEGIN
  SELECT fm.user_id INTO v_titular FROM familia_miembro fm
   WHERE fm.rol='adulto_titular' AND fm.hasta IS NULL LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm WHERE fm.user_id=v_titular LIMIT 1;
  SELECT id, cuenta_comercial_id INTO v_prestador, v_cuenta
    FROM prestadores WHERE estado='activo' LIMIT 1;

  /* Dos ajenos DISTINTOS: uno pasa a ser el familiar sembrado, el otro queda
     afuera de la familia entera y hace de tercero. */
  SELECT u.id INTO v_familiar FROM auth.users u WHERE u.id <> v_titular
    AND NOT EXISTS (SELECT 1 FROM familia_miembro f2 WHERE f2.user_id=u.id AND f2.familia_id=v_fam)
   ORDER BY u.id LIMIT 1;
  SELECT u.id INTO v_tercero FROM auth.users u WHERE u.id <> v_titular AND u.id <> v_familiar
    AND NOT EXISTS (SELECT 1 FROM familia_miembro f2 WHERE f2.user_id=u.id AND f2.familia_id=v_fam)
   ORDER BY u.id DESC LIMIT 1;

  IF v_titular IS NULL OR v_fam IS NULL OR v_prestador IS NULL
     OR v_familiar IS NULL OR v_tercero IS NULL OR v_familiar = v_tercero THEN
    RAISE EXCEPTION 'CINTURON: falta titular, familia, prestador o los dos ajenos para medir';
  END IF;

  INSERT INTO familia_miembro (familia_id, user_id, rol) VALUES (v_fam, v_familiar, 'adulto_autorizado');

  INSERT INTO mascotas (nombre, especie, sexo, country_code, familia_id, origen,
                        fecha_nacimiento, fecha_nacimiento_precision, estado_vida, user_id)
  VALUES ('__cinturon_d485b__', 'perro', 'macho', 'EC', v_fam, 'adoptado',
          current_date - 200, 'estimada', 'activa', v_titular)
  RETURNING id INTO v_m;

  INSERT INTO estadias (prestador_id, user_id, mascota_id, fecha_entrada, fecha_salida,
                        cantidad_noches, precio_por_noche, precio_total)
       VALUES (v_prestador, v_titular, v_m, current_date, current_date + 1, 1, 10, 10);

  INSERT INTO suscripciones_servicio (prestador_id, user_id, mascota_id, tipo_servicio,
                        periodo_inicio, periodo_fin, precio_mensual, precio_pagado)
       VALUES (v_prestador, v_titular, v_m, 'guarderia_mensual', current_date, current_date + 30, 10, 10);

  INSERT INTO mascota_acceso_prestador (mascota_id, cuenta_comercial_id, otorgado_por_user_id, metodo_otorgamiento)
       VALUES (v_m, v_cuenta, v_titular, 'qr_scan');

  INSERT INTO accion_destructiva_pendiente (mascota_id, familia_id, tipo_accion,
                        codueños_pendientes_snapshot, propuesto_por_user_id)
       VALUES (v_m, v_fam, 'dar_baja',
              jsonb_build_array(jsonb_build_object('user_id', v_titular)), v_titular);

  /* ═══ ✅ EL FAMILIAR (no titular, no comprador) LEE LAS CINCO ═══════════ */
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_familiar::text, 'role','authenticated')::text, true);

  SELECT count(*) INTO v_n FROM estadias WHERE mascota_id=v_m;
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON estadias: familiar vio %, esperaba 1', v_n; END IF;
  SELECT count(*) INTO v_n FROM suscripciones_servicio WHERE mascota_id=v_m;
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON suscripciones: familiar vio %', v_n; END IF;
  SELECT count(*) INTO v_n FROM mascota_acceso_prestador WHERE mascota_id=v_m;
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON acceso_prestador: familiar vio %', v_n; END IF;
  SELECT count(*) INTO v_n FROM accion_destructiva_pendiente WHERE mascota_id=v_m;
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON accion_destructiva: familiar vio %', v_n; END IF;
  SELECT count(*) INTO v_n FROM mascotas WHERE id=v_m;
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON mascotas: familiar vio %', v_n; END IF;

  /* ═══ 🔴 EL DISCRIMINADOR — TERCERO, MISMOS DATOS, CERO ═══════════════════
     Sin este brazo el verde de arriba no prueba nada: probaría igual con
     RLS apagada del todo. */
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_tercero::text, 'role','authenticated')::text, true);

  SELECT count(*) INTO v_n FROM estadias WHERE mascota_id=v_m;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON estadias: TERCERO vio %', v_n; END IF;
  SELECT count(*) INTO v_n FROM suscripciones_servicio WHERE mascota_id=v_m;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON suscripciones: TERCERO vio %', v_n; END IF;
  SELECT count(*) INTO v_n FROM mascota_acceso_prestador WHERE mascota_id=v_m;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON acceso_prestador: TERCERO vio %', v_n; END IF;
  SELECT count(*) INTO v_n FROM accion_destructiva_pendiente WHERE mascota_id=v_m;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON accion_destructiva: TERCERO vio %', v_n; END IF;
  SELECT count(*) INTO v_n FROM mascotas WHERE id=v_m;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON mascotas: TERCERO vio %', v_n; END IF;

  SET LOCAL ROLE postgres;
  PERFORM set_config('request.jwt.claims', NULL, true);

  RAISE NOTICE 'CINTURON D-485-el-censo: 10/10 (5 tablas × familiar=1 y tercero=0)';

  /* Deshacer la siembra entera. */
  DELETE FROM accion_destructiva_pendiente WHERE mascota_id=v_m;
  DELETE FROM mascota_acceso_prestador WHERE mascota_id=v_m;
  DELETE FROM suscripciones_servicio WHERE mascota_id=v_m;
  DELETE FROM estadias WHERE mascota_id=v_m;
  DELETE FROM mascotas WHERE id=v_m;
  DELETE FROM familia_miembro WHERE familia_id=v_fam AND user_id=v_familiar;

  SELECT count(*) INTO v_n FROM mascotas WHERE nombre='__cinturon_d485b__';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % mascota(s)', v_n; END IF;
END $cinturon$;
