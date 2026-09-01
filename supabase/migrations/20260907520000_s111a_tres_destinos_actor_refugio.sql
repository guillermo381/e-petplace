/* ═══════════════════════════════════════════════════════════════════════════
   S111-A · LOS DOS CHECK DE §7 Y §1, EL ACTOR REFUGIO DE §8, Y LA PUERTA 2
   DE §4 — cuatro cosas que la letra firma y el motor declaraba imposibles.
   ═══════════════════════════════════════════════════════════════════════════

   ── ① §7 · LA DONACIÓN CON DESTINO — dos lugares, no uno ─────────────────
   §7 define la donación con **un campo de destino de TRES valores**: ① una
   mascota en adopción · ② un refugio · ③ abierta.
   El motor la declaraba imposible **en DOS lugares que decían lo mismo**:
   `chk_destino_excluyente` en la tabla **y** el guard `destino_contradictorio`
   en el cuerpo de `crear_pedido_despensa`.
   > ### Una regla duplicada por copia se cura dos veces o no se cura — y curar sólo el CHECK habría dejado la capacidad viva y su puerta cerrada.

   🔴 **Y la parte que el CHECK no puede decir va en el guard, porque necesita
   OTRA tabla:** una donación a una mascota exige que el animal esté
   **publicado en adopción**. *El donante NO es su familia — ése es el punto, y
   por eso el guard viejo, que exigía familia para toda mascota, tampoco
   servía.* Con esto, donar a un animal en adopción es lo único que un tercero
   puede hacer sobre una mascota ajena, y sólo mientras está publicada.

   ⚠️ **El cuerpo de `crear_pedido_despensa` se parchó SOBRE SU DEFINICIÓN VIVA**
   (`pg_get_functiondef`), no se retranscribió: **el resto queda byte-idéntico**
   a lo que corría. *Retranscribir 179 líneas para cambiar 7 es cómo se pierde
   una línea sin que nadie lo note.* Medido: 7 líneas fuera, las 7 del guard.

   ── ② §1 · EL PADRINAZGO RECURRENTE ─────────────────────────────────────
   `suscripciones_servicio_tipo_valido` estaba cerrado a `guarderia_mensual` y
   `paseo_mensual`. §1 define el padrinazgo como *«Compra RECURRENTE»* y **§11
   excluye el padrinazgo EN DINERO, no la recurrencia** — *la exclusión que
   existe no es la que tapaba este costo.* Entra `padrinazgo_mensual`.
   🔴 **Y va con `D-988` pegado:** todo escritor NUEVO del estado de una
   suscripción **escribe SIEMPRE su motivo**. §6 exige TRES motivos distintos
   (adoptado · fallece · el refugio se va) y hoy cuatro de seis escritores no
   dejan ninguno: *sin motivo, la causa que hay que tratar con voz de duelo
   queda indistinguible de la que se celebra.*

   ── ③ §8 · EL ACTOR REFUGIO — se declara, y NO se le inventan transiciones ─
   `cat_transiciones_pedido.actor` no tenía `refugio`, y §8 dice *«la coordina
   el refugio»*. **Es una variante PREVIA del callejón de S105**: allá el
   catálogo declaraba un actor que la puerta no aceptaba; acá ni siquiera
   estaba declarado.
   ⇒ **Entra al CHECK: el actor pasa a ser EXPRESABLE.**
   🔴 **NO se agrega ninguna fila de transición**, y es deliberado: *cuáles
   movimientos puede hacer un refugio sobre un pedido es una decisión de
   producto que ninguna letra tomó.* Inventarlas acá sería exactamente el
   trasplante de criterio de `D-976`. Va al estacionamiento.
   *Un actor declarado sin transiciones no habilita nada: habilita que alguien
   pueda escribirlas sin una migración de esquema.*

   ── ④ §4 · LA PUERTA 2 — la vidriera se ve SIN CUENTA ────────────────────
   §4, literal: *«**Sin cuenta:** desde el login hay una puerta a ver mascotas
   en adopción. **Al postular**, se pide crear cuenta.»*
   `obtener_adoptables` nació exigiendo sesión ⇒ **la puerta 2 era
   inconstruible**, y es el camino de quien llega de una foto en Instagram —
   *exactamente a quien §4 trata de no perder.* Lo midió C contra la migración.
   ⇒ Se abre a `anon`, **con su audiencia ESCRITA acá y no heredada de un
   default** (la ley de S92): lo que un anónimo lee es **nombre, especie, raza,
   sexo, fecha de nacimiento, foto y el nombre del publicador** de animales que
   **el refugio publicó para ser vistos**. *El publicador es procedencia, no un
   dato personal del adoptante; y del adoptante no viaja nada, porque todavía
   no hay adoptante.*
   ⚠️ **Es la ÚNICA función de esta sesión con `anon`, y por decisión.**

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   Enmienda de CHECKs + reemplazo de una función + un GRANT. **CERO BACKFILL.**
   **Reversa:** `docs/relevamientos/S111-A-REVERSA-tres-destinos.sql`, escrita
   ANTES; declara que **volver el CHECK viejo FALLA si ya hay filas nuevas**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① §7 · LA TABLA ADMITE LOS TRES DESTINOS ═════════════════════════════
ALTER TABLE public.pedido_item_destinos
  ADD COLUMN IF NOT EXISTS refugio_cuenta_comercial_id uuid
    REFERENCES public.cuentas_comerciales(id) ON DELETE RESTRICT;

ALTER TABLE public.pedido_item_destinos DROP CONSTRAINT IF EXISTS chk_destino_excluyente;
ALTER TABLE public.pedido_item_destinos
  ADD CONSTRAINT chk_destino_donacion CHECK (
    /* Compra normal: puede ir a una mascota propia; jamás a un refugio. */
    (NOT es_donacion AND refugio_cuenta_comercial_id IS NULL)
    /* Donación: UNA mascota, UN refugio, o abierta (los dos nulos).
       Lo que sigue siendo inexpresable es tener los DOS a la vez. */
 OR (es_donacion AND NOT (mascota_id IS NOT NULL AND refugio_cuenta_comercial_id IS NOT NULL)));

COMMENT ON COLUMN public.pedido_item_destinos.refugio_cuenta_comercial_id IS
  'S111-A · §7 destino ② de la donación. NULL con mascota NULL = destino «abierta», que es el «sin destino elegible» que MODELO_DESPENSA ya tenía — no otra pieza.';
CREATE OR REPLACE FUNCTION public.crear_pedido_despensa(p_cuenta_comercial_id uuid, p_items jsonb, p_entrega jsonb, p_clave_idempotencia text, p_bodega_id uuid DEFAULT NULL::uuid, p_metodo_entrega text DEFAULT 'despacho'::text, p_fecha_programada date DEFAULT NULL::date, p_servicio_envio text DEFAULT 'estandar'::text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid      uuid := COALESCE(p_user_id, auth.uid());
  v_existente uuid;
  v_ped      uuid;
  v_it       jsonb;
  v_of       record;
  v_tasa     numeric;
  v_sub      numeric := 0;
  v_imp      numeric := 0;
  v_pf       numeric := 0;
  v_pv       numeric := 0;
  v_cot      jsonb;
  v_prom     jsonb;
  v_envio    numeric := 0;
  v_item_id  uuid;
  v_masc     uuid;
  v_don      boolean;
  v_ref      uuid;      -- S111-A: destino REFUGIO de la donación (§7)
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;
  /* S103 · EL USUARIO ES PARAMETRO, NO AMBIENTE — pero solo para quien NO es
     una persona. `auth.uid()` sirve cuando hay alguien del otro lado; no tiene
     respuesta cuando el que actua es el motor (el cobro recurrente). Molde del
     guard: el mismo de `confirmar_pago_compra`.
     🔴 Un cliente NO puede pedir a nombre de otro. */
  IF p_user_id IS NOT NULL AND auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_podes_pedir_a_nombre_de_otro' USING ERRCODE = '42501';
  END IF;
  IF p_clave_idempotencia IS NULL OR length(trim(p_clave_idempotencia)) = 0 THEN
    RAISE EXCEPTION 'clave_idempotencia_requerida' USING ERRCODE = '22023';
  END IF;
  IF p_metodo_entrega NOT IN ('despacho','retiro') THEN
    RAISE EXCEPTION 'metodo_entrega_invalido: %', p_metodo_entrega USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_existente FROM pedidos WHERE clave_idempotencia = p_clave_idempotencia;
  IF v_existente IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'pedido_id', v_existente, 'ya_existia', true);
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'pedido_sin_items' USING ERRCODE = '22023';
  END IF;

  -- La promesa se resuelve ANTES de escribir nada: un pedido que no se puede
  -- prometer no nace (servicio apagado · fecha sin cupo · vendedor sin
  -- turnos/recursos — cada rebote con su código).
  IF p_metodo_entrega = 'despacho' THEN
    v_prom := calcular_promesa_despensa(p_cuenta_comercial_id, now(),
                                        p_fecha_programada, p_servicio_envio);
    IF NOT COALESCE((v_prom->>'ok')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_prom->>'error','promesa_fallida')
        USING ERRCODE = '22023', DETAIL = COALESCE(v_prom->>'detalle','');
    END IF;
  END IF;

  -- El destino se valida antes de escribir (M2, sin cambios).
  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_masc := NULLIF(v_it->>'mascota_id','')::uuid;
    v_don  := COALESCE((v_it->>'donacion')::boolean, false);
    v_ref  := NULLIF(v_it->>'refugio_cuenta_comercial_id','')::uuid;

    /* ══ S111-A · LOS TRES DESTINOS DE §7, y por qué el guard viejo no servía ══
       `LETRA_ADOPCION` §7 define la donación con **un campo de destino de tres
       valores**: ① una mascota en adopción · ② un refugio · ③ abierta.
       El guard anterior decía *«un ítem no puede ser donación Y de una
       mascota»* ⇒ **volvía inexpresable el PRIMER valor de la letra.**
       *Y su CHECK gemelo en la tabla decía lo mismo: una regla duplicada por
       copia se cura dos veces o no se cura.* */
    IF v_don AND v_masc IS NOT NULL AND v_ref IS NOT NULL THEN
      RAISE EXCEPTION 'destino_contradictorio: una donación va a UNA mascota, a UN refugio, o abierta'
        USING ERRCODE = '22023';
    END IF;
    IF v_ref IS NOT NULL AND NOT v_don THEN
      RAISE EXCEPTION 'refugio_sin_donacion: sólo una donación puede tener un refugio como destino'
        USING ERRCODE = '22023';
    END IF;

    IF v_masc IS NOT NULL THEN
      IF v_don THEN
        /* 🔴 DONACIÓN A UNA MASCOTA: el donante NO es su familia — ése es el
           punto. Lo que se exige es que el animal esté **publicado en
           adopción**, que es la única forma de que un tercero pueda donarle
           algo sin que nadie le abra su expediente. */
        IF NOT EXISTS (SELECT 1 FROM mascotas m
                        WHERE m.id = v_masc AND m.estado_adopcion = 'publicada') THEN
          RAISE EXCEPTION 'mascota_no_esta_en_adopcion: sólo se puede donar a un animal publicado en adopción'
            USING ERRCODE = '22023';
        END IF;
      ELSIF NOT _user_es_familia_de_mascota(v_masc, v_uid) AND NOT is_admin() THEN
        RAISE EXCEPTION 'mascota_sin_acceso: no podés atar una compra a una mascota que no es tuya'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF v_ref IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM cuenta_roles r
          WHERE r.cuenta_comercial_id = v_ref AND r.tipo_actor = 'refugio' AND r.estado = 'activo') THEN
      RAISE EXCEPTION 'refugio_no_disponible: esa cuenta no está habilitada como refugio'
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  INSERT INTO pedidos (user_id, cuenta_comercial_id, subtotal, impuesto_total,
                       costo_envio, descuento_monto, total, clave_idempotencia,
                       numero_orden, metodo_entrega, envio_servicio,
                       entrega_nombre_receptor, entrega_telefono,
                       entrega_direccion, entrega_ciudad, entrega_sector,
                       entrega_referencias, entrega_instrucciones,
                       entrega_lat, entrega_lon,
                       promesa_entrega_desde, promesa_entrega_hasta,
                       entrega_fecha_objetivo, entrega_programada)
  VALUES (v_uid, p_cuenta_comercial_id, 0, 0, 0, 0, 0, p_clave_idempotencia,
          'P-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
          p_metodo_entrega, p_servicio_envio,
          p_entrega->>'nombre_receptor', p_entrega->>'telefono',
          CASE WHEN p_metodo_entrega = 'retiro'
               THEN COALESCE(p_entrega->>'direccion', 'Retiro en tienda')
               ELSE p_entrega->>'direccion' END,
          p_entrega->>'ciudad', p_entrega->>'sector',
          p_entrega->>'referencias', p_entrega->>'instrucciones',
          NULLIF(p_entrega->>'lat','')::double precision,
          NULLIF(p_entrega->>'lon','')::double precision,
          NULLIF(v_prom->>'desde','')::timestamptz,
          NULLIF(v_prom->>'hasta','')::timestamptz,
          NULLIF(v_prom->>'fecha','')::date,
          CASE WHEN p_fecha_programada IS NOT NULL
               THEN NULLIF(v_prom->>'desde','')::timestamptz END)
  RETURNING id INTO v_ped;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT o.*, v.impuesto_codigo, v.peso_kg, v.largo_cm, v.ancho_cm, v.alto_cm,
           v.producto_id, p.nombre AS nombre_producto, s.id AS sku
      INTO v_of
    FROM ofertas o
    JOIN producto_variantes v ON v.id = o.variante_id
    JOIN productos p ON p.id = v.producto_id
    JOIN vendedor_skus s ON s.id = o.sku_id
    WHERE o.id = (v_it->>'oferta_id')::uuid AND o.estado = 'publicada';

    IF v_of.id IS NULL THEN
      RAISE EXCEPTION 'oferta_no_publicada: %', v_it->>'oferta_id' USING ERRCODE = '22023';
    END IF;

    SELECT pct INTO v_tasa FROM cat_tasas_impuesto WHERE codigo = v_of.impuesto_codigo;

    INSERT INTO pedido_items (pedido_id, producto_id, variante_id, oferta_id,
                              cuenta_comercial_id, nombre_producto, precio_unitario,
                              cantidad, subtotal, impuesto_codigo, impuesto_pct,
                              impuesto_monto)
    VALUES (v_ped, v_of.producto_id, v_of.variante_id, v_of.id,
            p_cuenta_comercial_id, v_of.nombre_producto, v_of.precio,
            (v_it->>'cantidad')::int,
            round(v_of.precio * (v_it->>'cantidad')::int, 2),
            v_of.impuesto_codigo, v_tasa,
            round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2))
    RETURNING id INTO v_item_id;

    v_masc := NULLIF(v_it->>'mascota_id','')::uuid;
    v_don  := COALESCE((v_it->>'donacion')::boolean, false);
    v_ref := NULLIF(v_it->>'refugio_cuenta_comercial_id','')::uuid;
    IF v_masc IS NOT NULL OR v_don THEN
      INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion,
                                        refugio_cuenta_comercial_id, atado_en, atado_por)
        VALUES (v_item_id, v_masc, v_don, v_ref, now(), v_uid);
    END IF;

    v_sub := v_sub + round(v_of.precio * (v_it->>'cantidad')::int, 2);
    v_imp := v_imp + round(v_of.precio * (v_it->>'cantidad')::int * v_tasa / 100, 2);
    v_pf  := v_pf  + COALESCE(v_of.peso_kg,0) * (v_it->>'cantidad')::int;
    v_pv  := v_pv  + COALESCE(v_of.largo_cm * v_of.ancho_cm * v_of.alto_cm / 6000.0, 0)
                     * (v_it->>'cantidad')::int;
  END LOOP;

  IF p_metodo_entrega = 'despacho' THEN
    v_cot := cotizar_envio_despensa(p_cuenta_comercial_id, v_sub, v_pf, v_pv,
                                    'EC', p_entrega->>'ciudad');
    IF NOT COALESCE((v_cot->>'ok')::boolean, false) THEN
      RAISE EXCEPTION '%', COALESCE(v_cot->>'error','cotizacion_fallida')
        USING ERRCODE = '22023', DETAIL = COALESCE(v_cot->>'detalle','');
    END IF;
    v_envio := (v_cot->>'costo')::numeric;
  ELSE
    v_cot := jsonb_build_object('ok', true, 'costo', 0, 'metodo', 'retiro');
  END IF;

  UPDATE pedidos SET
    subtotal = v_sub, impuesto_total = v_imp, costo_envio = v_envio,
    total = v_sub + v_imp + v_envio,
    envio_regla_id = NULLIF(v_cot->>'regla_id','')::uuid,
    envio_tipo_regla = v_cot->>'tipo_regla',
    envio_peso_fisico_kg = v_pf,
    envio_peso_volumetrico_kg = v_pv,
    envio_peso_facturable_kg = GREATEST(v_pf, v_pv),
    envio_cotizacion = v_cot || COALESCE(jsonb_build_object('promesa', v_prom), '{}'::jsonb),
    updated_at = now()
  WHERE id = v_ped;

  INSERT INTO pedido_estados (pedido_id, estado_codigo, movido_por, movido_por_rol)
    VALUES (v_ped, 'creado', v_uid, CASE WHEN p_user_id IS NOT NULL THEN 'sistema' ELSE 'cliente' END);

  RETURN jsonb_build_object('ok', true, 'pedido_id', v_ped, 'subtotal', v_sub,
                            'impuesto', v_imp, 'envio', v_envio,
                            'total', v_sub + v_imp + v_envio,
                            'metodo_entrega', p_metodo_entrega,
                            'promesa', v_prom,
                            'cotizacion_envio', v_cot);
END $function$

;

-- ══ ② §1 · EL PADRINAZGO ENTRA AL VOCABULARIO DE SUSCRIPCIONES ═══════════
ALTER TABLE public.suscripciones_servicio DROP CONSTRAINT IF EXISTS suscripciones_servicio_tipo_valido;
ALTER TABLE public.suscripciones_servicio
  ADD CONSTRAINT suscripciones_servicio_tipo_valido
  CHECK (tipo_servicio = ANY (ARRAY['guarderia_mensual','paseo_mensual','padrinazgo_mensual']));

-- ══ ③ §8 · EL ACTOR REFUGIO SE VUELVE EXPRESABLE (sin transiciones) ══════
ALTER TABLE public.cat_transiciones_pedido DROP CONSTRAINT IF EXISTS cat_transiciones_pedido_actor_check;
ALTER TABLE public.cat_transiciones_pedido
  ADD CONSTRAINT cat_transiciones_pedido_actor_check
  CHECK (actor = ANY (ARRAY['cliente','vendedor','sistema','admin','repartidor','refugio']));

-- ══ ④ §4 · LA PUERTA 2: la vidriera SIN CUENTA ═══════════════════════════
CREATE OR REPLACE FUNCTION public.obtener_adoptables(
  p_especie text DEFAULT NULL, p_country_code text DEFAULT NULL, p_limite int DEFAULT 50)
RETURNS TABLE(publicacion_id uuid, mascota_id uuid, nombre text, especie text,
              raza text, sexo text, fecha_nacimiento date, foto_url text,
              publicador_nombre text, creada_en timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $function$
BEGIN
  /* 🔴 SIN `auth.uid()`, y es §4 al pie: la vidriera se ve SIN CUENTA.
     Lo que un anónimo lee está acotado por esta proyección y por
     `p.estado='publicada'`: **animales que el refugio publicó para ser vistos**.
     Del adoptante no viaja nada — todavía no hay adoptante. */
  RETURN QUERY
  SELECT p.id, m.id, m.nombre, m.especie, m.raza, m.sexo, m.fecha_nacimiento, m.foto_url,
         c.nombre_comercial, p.creada_en
    FROM adopcion_publicacion p
    JOIN mascotas m ON m.id = p.mascota_id
    JOIN cuentas_comerciales c ON c.id = p.cuenta_comercial_id
    JOIN cat_estados_adopcion e ON e.estado = m.estado_adopcion AND e.visible_en_vidriera
   WHERE p.estado = 'publicada'
     AND (p_especie IS NULL OR m.especie = p_especie)
     AND (p_country_code IS NULL OR p.country_code = p_country_code)
   ORDER BY p.creada_en DESC
   LIMIT LEAST(COALESCE(p_limite, 50), 100);
END $function$;

REVOKE EXECUTE ON FUNCTION public.obtener_adoptables(text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_adoptables(text,text,integer) TO authenticated, anon;

-- ══ ⑤ CINTURÓN — EL ROJO PRIMERO, Y POR SU MOTIVO ═══════════════════════
/* 🔴 ESTE CINTURÓN SE CORRIGIÓ DESPUÉS DE CORRERLO, y el fallo es de manual:
   mis brazos rojos daban VERDE con un `23505` de PK duplicada —
   `pedido_item_destinos` tiene PK en `pedido_item_id`, uno por ítem — en vez de
   con el CHECK que venían a medir.
   > ### Un rojo por la razón equivocada está tan roto como un verde por la razón equivocada.
   Cura: cada ítem se usa UNA vez, y **cada brazo exige su motivo**, no un
   rebote cualquiera. */
DO $cint$
DECLARE
  v_rol text := current_user; v_masc uuid; v_ref uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid; v_i5 uuid;
  v_rojo boolean; v_msg text; v_n int;
BEGIN
  SELECT id INTO v_masc FROM mascotas LIMIT 1;
  SELECT id INTO v_ref  FROM cuentas_comerciales LIMIT 1;
  /* Ítems SIN destino previo: si tuvieran uno, el rebote sería de la PK. */
  SELECT array_agg(id) INTO STRICT v_i1 FROM (SELECT NULL::uuid id) z WHERE false;
  SELECT pi.id INTO v_i1 FROM pedido_items pi
   WHERE NOT EXISTS (SELECT 1 FROM pedido_item_destinos d WHERE d.pedido_item_id=pi.id) LIMIT 1 OFFSET 0;
  SELECT pi.id INTO v_i2 FROM pedido_items pi
   WHERE NOT EXISTS (SELECT 1 FROM pedido_item_destinos d WHERE d.pedido_item_id=pi.id) LIMIT 1 OFFSET 1;
  SELECT pi.id INTO v_i3 FROM pedido_items pi
   WHERE NOT EXISTS (SELECT 1 FROM pedido_item_destinos d WHERE d.pedido_item_id=pi.id) LIMIT 1 OFFSET 2;
  SELECT pi.id INTO v_i4 FROM pedido_items pi
   WHERE NOT EXISTS (SELECT 1 FROM pedido_item_destinos d WHERE d.pedido_item_id=pi.id) LIMIT 1 OFFSET 3;
  SELECT pi.id INTO v_i5 FROM pedido_items pi
   WHERE NOT EXISTS (SELECT 1 FROM pedido_item_destinos d WHERE d.pedido_item_id=pi.id) LIMIT 1 OFFSET 4;
  IF v_i5 IS NULL THEN
    RAISE EXCEPTION 'CINTURON: hacen falta 5 pedido_items sin destino y no los hay — el arnes no puede medir';
  END IF;

  BEGIN
    -- ROJO ① · los DOS destinos a la vez siguen siendo inexpresables
    v_rojo := false;
    BEGIN
      INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion, refugio_cuenta_comercial_id)
           VALUES (v_i1, v_masc, true, v_ref);
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT ILIKE '%chk_destino_donacion%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-1: mascota+refugio a la vez, rebote por el motivo equivocado (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    -- ROJO ② · un refugio en una compra que NO es donación tampoco entra
    v_rojo := false;
    BEGIN
      INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion, refugio_cuenta_comercial_id)
           VALUES (v_i2, NULL, false, v_ref);
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT ILIKE '%chk_destino_donacion%' THEN
      RAISE EXCEPTION 'CINTURON ROJO-2: refugio sin donacion, motivo equivocado (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;

    -- VERDE ① · LOS TRES DESTINOS DE §7 ENTRAN
    INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion, refugio_cuenta_comercial_id)
         VALUES (v_i3, v_masc, true, NULL);      -- ① una mascota en adopción
    INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion, refugio_cuenta_comercial_id)
         VALUES (v_i4, NULL, true, v_ref);       -- ② un refugio
    INSERT INTO pedido_item_destinos (pedido_item_id, mascota_id, es_donacion, refugio_cuenta_comercial_id)
         VALUES (v_i5, NULL, true, NULL);        -- ③ abierta
    SELECT count(*) INTO v_n FROM pedido_item_destinos
     WHERE pedido_item_id IN (v_i3, v_i4, v_i5);
    IF v_n <> 3 THEN RAISE EXCEPTION 'CINTURON VERDE-1: entraron % de 3 destinos', v_n; END IF;

    -- VERDE ② · el actor refugio es EXPRESABLE
    INSERT INTO cat_transiciones_pedido (desde, hasta, actor, exige_motivo, descripcion, activo)
         VALUES ('pago_capturado','pago_capturado','refugio', false, '__ARNES_S111A__', false);

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  -- ③ el padrinazgo entró al CHECK
  SELECT count(*) INTO v_n FROM pg_constraint
   WHERE conname='suscripciones_servicio_tipo_valido'
     AND pg_get_constraintdef(oid) ILIKE '%padrinazgo_mensual%';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: el padrinazgo no entro al CHECK de suscripciones'; END IF;

  -- ④ al refugio NO se le inventaron transiciones (el arnés rolleó las suyas)
  SELECT count(*) INTO v_n FROM cat_transiciones_pedido WHERE actor='refugio';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: alguien le invento % transiciones al refugio — es decision de producto', v_n;
  END IF;

  -- ⑤ L-140 · la vidriera es la ÚNICA con anon, y se verifica que lo sea
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN
     ('publicar_adoptable','despublicar_adoptable','traspasar_mascota_a_familia')
     AND array_to_string(p.proacl,' ') ILIKE '%anon=%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON L-140: una RPC de ESCRITURA quedo con anon (n=%)', v_n; END IF;
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_adoptables'
     AND array_to_string(p.proacl,' ') ILIKE '%anon=%';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURON: la vidriera NO quedo abierta a anon — la puerta 2 de §4 sigue cerrada';
  END IF;

  RAISE NOTICE 'CINTURON VERDE · ROJO-1 y ROJO-2 rebotan POR SU CHECK (no por la PK, que era el rojo falso de la primera version) · VERDE-1 los TRES destinos de §7 entran · el padrinazgo en el CHECK · al refugio NO se le inventaron transiciones · L-140: la vidriera es la UNICA con anon y las tres de escritura NO lo tienen';
END
$cint$;

COMMIT;
