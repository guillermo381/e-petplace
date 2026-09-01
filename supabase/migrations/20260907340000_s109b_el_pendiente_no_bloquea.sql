/* ═══════════════════════════════════════════════════════════════════════════
   S109-B · UN INTENTO FALLIDO NO TRABA, Y TODO SE CONTRATA POR MASCOTA

   Dos defectos que desde el teléfono se ven igual y tienen curas distintas:

   🔴 ① BLOQUEO POR RESIDUO. `contratar_programa` escribe la fila **antes** de que
   la compuerta pueda rebotar —vive en `pagos-cobro`, al pagar— ⇒ el rebote no
   deshace lo escrito. El guard mira sólo `estado='activo'` y un programa sin
   pagar YA es `activo`. Y **nada lo vence**: `pago_expira_en` se llena y no lo
   lee nadie; `vencer_programas_adiestramiento` exige `vigencia_hasta` a 3 días
   **y una cita confirmada**, así que no barre holds abandonados.
   ⇒ *No son 15 minutos: es para siempre, con una fila que la familia no ve y no
   puede borrar.* Medidas 3 así.

   🔴 ② BLOQUEO POR ALCANCE. `uq_susc_viva_por_lugar` era
   `(familia_id, prestador_id)` **sin mascota** ⇒ una mensualidad de UNA mascota
   bloqueaba a TODAS las demás del hogar en ese prestador. **Reproducido por el
   founder en el teléfono.**

   ═══ LA FORMA, Y LA MEDICIÓN CORRIGIÓ EL PLAN DOS VECES ═══
   **(a)** Estaba firmado «cambiar el estado de nacimiento, como el bono».
   Medido: **el bono NO hace eso.** Nace `estado='activo'` + `estado_pago='pendiente'`
   —se ve, se puede pagar— y no otorga porque **todos sus consumidores exigen
   `estado='activo' AND estado_pago='pagado'`**. *Mover el estado de nacimiento
   habría sacado al programa pendiente de `obtener_mis_programas`, que es por donde
   la familia lo ve y lo paga: la cura habría escondido la deuda en vez de
   destrabarla.* ⇒ **lo que cambia no es dónde nace: es quién lo cuenta.**

   **(b)** La primera versión de esta migración curaba ① y dejaba el índice en
   `(familia, prestador)`. **No habría curado ②** — un mandato PAGADO de otra
   mascota seguía bloqueando. Se corrigió antes de aplicar: *dos migraciones sobre
   el mismo índice dejan la primera como un estado que existió y nadie firmó.*

   FIRMA DEL FOUNDER: **todo se contrata POR MASCOTA, en todos los servicios y
   todas las modalidades.** Con su excepción, que no la contradice:
   **lo que es por mascota es el USO, no el SALDO** — un paquete de días se compra
   para la casa; cada día se agenda para una mascota. (Medido: 3 mascotas
   distintas ya consumieron días del mismo bono.)

   Veda 76(g): NO RIGE — cero backfill (0 filas NULL medidas antes de aplicar).
   ═══════════════════════════════════════════════════════════════════════════ */

-- ── ① EL GUARD DEL PROGRAMA: un pendiente no bloquea ──────────────────────
DO $mig$
DECLARE v_src text; v_nuevo text;
  v_viejo CONSTANT text := 'WHERE pc.programa_id = p_programa_id AND pc.mascota_id = p_mascota_id
      AND pc.estado = ''activo''';
  v_nueva CONSTANT text := 'WHERE pc.programa_id = p_programa_id AND pc.mascota_id = p_mascota_id
      AND pc.estado = ''activo''
      /* 🔴 Y PAGADO — la forma del bono. Sin esta línea, un intento que la
         compuerta rebota deja una fila `activo`+`pendiente` que bloquea el
         siguiente intento PARA SIEMPRE. El pendiente sigue existiendo y
         viéndose: lo que deja de hacer es contar. */
      AND pc.estado_pago = ''pagado''';
BEGIN
  SELECT pg_get_functiondef(oid) INTO v_src FROM pg_proc WHERE proname='contratar_programa';
  IF position(v_viejo in v_src) = 0 THEN
    RAISE EXCEPTION 'el guard de duplicado cambió: se aborta en vez de adivinar';
  END IF;
  v_nuevo := replace(v_src, v_viejo, v_nueva);
  IF position('pc.estado_pago = ''pagado''' in v_nuevo) = 0 THEN
    RAISE EXCEPTION 'el reemplazo no entró';
  END IF;
  EXECUTE v_nuevo;
END $mig$;

-- ── ② POR MASCOTA: el NOT NULL y el índice ────────────────────────────────
/* Se mide ANTES de exigir. *Un `SET NOT NULL` sobre una tabla con filas NULL no
   es una cura: es una migración que aborta a mitad.* */
DO $chk$
DECLARE v_a int; v_b int;
BEGIN
  SELECT count(*) INTO v_a FROM guarderia_suscripciones WHERE mascota_id IS NULL;
  SELECT count(*) INTO v_b FROM evento_cita_servicio    WHERE mascota_id IS NULL;
  IF v_a <> 0 OR v_b <> 0 THEN
    RAISE EXCEPTION 'hay filas sin mascota (mensualidad=%, cita=%): esto exigiría backfill y la firma dice cero', v_a, v_b;
  END IF;
END $chk$;

ALTER TABLE guarderia_suscripciones ALTER COLUMN mascota_id SET NOT NULL;
ALTER TABLE evento_cita_servicio    ALTER COLUMN mascota_id SET NOT NULL;

/* ⚠️ El BONO queda nullable A PROPÓSITO: es SALDO DEL HOGAR (firma 6 de S108,
   ratificada hoy). 24 de sus 25 filas no tienen mascota y **3 mascotas distintas
   ya consumieron días del mismo bono** — exigirle mascota rompería lo que está
   construido y probado. Lo mismo `pedidos`, que no la tiene: *la regla alcanza a
   lo CONTRATABLE, no a todo lo comprable.* */

DROP INDEX IF EXISTS uq_susc_viva_por_lugar;
CREATE UNIQUE INDEX uq_susc_viva_por_lugar ON guarderia_suscripciones
  (familia_id, prestador_id, mascota_id)
  /* `periodo_desde IS NOT NULL` es la marca de «cobrada» de este sujeto —no hay
     `estado_pago` acá, medido—: lo escribe el actuador al aplicar el pago
     («pagar es arrancar»). Con esto, un mandato firmado y no cobrado tampoco
     bloquea. */
  WHERE (estado = 'activa' AND periodo_desde IS NOT NULL);

-- ── ③ EL CAMINO DEL NULL, INEXPRESABLE ────────────────────────────────────
DO $mig$
DECLARE v_src text; v_nuevo text;
  /* El bloque se REEMPLAZA POR SU TEXTO EXACTO, no por regex. El primer intento
     usó `.*?END IF;` y **cortó en el `END IF` ANIDADO**, dejando el de afuera
     colgando: la función no compiló y la migración entera revirtió.
     *Un `.*?` sobre un bloque anidado no delimita el bloque: delimita el primer
     cierre que encuentra.* */
  v_viejo CONSTANT text := '  IF v_masc IS NULL THEN
    SELECT m.id INTO v_masc FROM mascotas m
     WHERE m.familia_id = v_s.familia_id AND m.estado_vida=''activa''
       AND public._mascota_elegible_servicio(m.id,''guarderia_dia'') LIMIT 1;
    IF v_masc IS NULL THEN RAISE EXCEPTION ''mascota_no_determinada'' USING ERRCODE=''22023''; END IF;
  END IF;';
  v_nueva CONSTANT text := '  /* ☠️ EL FALLBACK QUE ELEGÍA UNA MASCOTA DEL HOGAR, RETIRADO.
     Con `guarderia_suscripciones.mascota_id NOT NULL` el caso es INEXPRESABLE,
     así que este `IF` ya no protegía: escondía. *Elegir una mascota cuando no
     hay no es «por mascota» ni «por familia» — es un tercer comportamiento que
     nadie firmó*, y el mes se cobraba generando los días de una mascota que la
     familia no eligió. `mascota_no_determinada` muere con él. */';
BEGIN
  SELECT pg_get_functiondef(oid) INTO v_src
    FROM pg_proc WHERE proname='cobrar_periodo_mensualidad_guarderia';
  IF position(v_viejo in v_src) = 0 THEN
    RAISE EXCEPTION 'el fallback no está donde se midió: se aborta en vez de adivinar';
  END IF;
  v_nuevo := replace(v_src, v_viejo, v_nueva);
  IF position('v_masc IS NULL' in v_nuevo) > 0 THEN
    RAISE EXCEPTION 'el fallback sobrevivió al reemplazo';
  END IF;
  EXECUTE v_nuevo;
END $mig$;

-- ── ④ LOS TRES EXPIRADORES, con la forma exacta del bono ──────────────────
CREATE OR REPLACE FUNCTION expirar_programas_sin_pago()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_n integer;
BEGIN
  UPDATE programas_contratados
     SET estado = 'cancelado',
         /* `estado_pago` queda `pendiente` A PROPÓSITO y la ventana no se limpia:
            son la evidencia de POR QUÉ murió y de CUÁNDO. Copiado del bono. */
         pago_metadata = COALESCE(pago_metadata,'{}'::jsonb)
                         || jsonb_build_object('cancelado_por_hold_en', now())
   WHERE estado = 'activo' AND estado_pago = 'pendiente'
     AND pago_expira_en IS NOT NULL AND pago_expira_en < now();
  GET DIAGNOSTICS v_n = ROW_COUNT; RETURN v_n;
END $fn$;

CREATE OR REPLACE FUNCTION expirar_mensualidades_sin_pago()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_n integer;
BEGIN
  /* Un mandato que nunca cobró no tiene período. Misma ventana que el checkout. */
  UPDATE guarderia_suscripciones
     SET estado = 'cancelada', cancelada_en = now()
   WHERE estado = 'activa' AND periodo_desde IS NULL
     AND autorizada_en < now() - interval '15 minutes';
  GET DIAGNOSTICS v_n = ROW_COUNT; RETURN v_n;
END $fn$;

CREATE OR REPLACE FUNCTION expirar_planes_sin_pago()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_n integer;
BEGIN
  /* ⚠️ El plan HOY NO BLOQUEA —nace `pendiente` y su guard mira `activa`—, así
     que esto no destraba a nadie: cierra **media pieza suelta**. */
  UPDATE suscripciones_servicio
     SET estado = 'cancelada', cancelado_en = now()
   WHERE estado = 'pendiente' AND estado_pago = 'pendiente'
     AND pago_expira_en IS NOT NULL AND pago_expira_en < now();
  GET DIAGNOSTICS v_n = ROW_COUNT; RETURN v_n;
END $fn$;

REVOKE ALL ON FUNCTION expirar_programas_sin_pago()     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION expirar_mensualidades_sin_pago() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION expirar_planes_sin_pago()        FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION expirar_programas_sin_pago()     TO service_role;
GRANT EXECUTE ON FUNCTION expirar_mensualidades_sin_pago() TO service_role;
GRANT EXECUTE ON FUNCTION expirar_planes_sin_pago()        TO service_role;

/* Cada minuto, como el del bono — *un expirador diario deja a la familia trabada
   hasta mañana, que es casi tan malo como para siempre.* */
SELECT cron.schedule('expirar-programas-sin-pago',     '* * * * *', 'SELECT public.expirar_programas_sin_pago();');
SELECT cron.schedule('expirar-mensualidades-sin-pago', '* * * * *', 'SELECT public.expirar_mensualidades_sin_pago();');
SELECT cron.schedule('expirar-planes-sin-pago',        '* * * * *', 'SELECT public.expirar_planes_sin_pago();');
