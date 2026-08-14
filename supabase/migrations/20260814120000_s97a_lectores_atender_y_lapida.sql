-- ═══════════════════════════════════════════════════════════════════════════
-- S97-A · LOS DOS LECTORES DE `ATENDER` + LA LÁPIDA DE LA PUERTA QUE SOBRA
-- (14-ago-2026)
--
-- LETRA: `LA_CASA_DEL_PRESTADOR` §2.1bis (cómo se compone ATENDER) y §2.3
-- (la regla condicional de recepción, firma del founder 13-ago):
--   «Sin ningún servicio con atención en local activa, el rol RECEPCIÓN no se
--    ofrece en el equipo. La puerta no ofrece lo que no existe.»
--
-- 🔴 NO NACE NINGUNA COLUMNA. `prestador_servicios.atiende_local` YA EXISTE
--    (S61, nació para el domicilio del grooming) y es la fuente única: el
--    wizard la prende, la configuración la administra, estos lectores la leen.
--    Lo que faltaba eran los LECTORES, no el dato.
--
-- ⚠️ SU PERMISIVIDAD, DECLARADA Y NO MAQUILLADA (D-792): `atiende_local` es
--    NOT NULL DEFAULT true y vale true en 32/33 filas vivas, 9 paseos
--    incluidos — el default barrió los cuatro oficios cuando la columna nació
--    para uno. ⇒ el guard **discrimina el borde que importa** (negocio sin
--    servicios ⇒ sin recepción, que es la firma) y **es permisivo en el
--    centro** hasta que alguien toque el toggle. No se hace backfill: qué
--    significa «local» para un paseo es decisión de producto, no de migración.
--
-- 76(g): NO RIGE — dos lectores STABLE y un REVOKE. Sin backfill, sin anclas.
-- REVERSA escrita ANTES, y AVISA que revertir REABRE la trampa de D-794.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ① ¿Este negocio atiende gente en su local? ────────────────────────────
CREATE OR REPLACE FUNCTION public.negocio_atiende_en_local(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM prestador_servicios ps
     WHERE ps.prestador_id = p_prestador_id
       AND ps.activo
       AND ps.atiende_local
  );
$function$;

COMMENT ON FUNCTION public.negocio_atiende_en_local(uuid) IS
  'Compone la mitad de SERVICIOS de la tab ATENDER y gatea la oferta del rol '
  'recepción (LA_CASA_DEL_PRESTADOR §2.1bis y §2.3). Devuelve boolean: sin '
  'sesión y sin filas devuelve false — jamás NULL, para que un consumidor '
  'descuidado no lea "no sé" como "sí".';

-- ── ② ¿Se puede ofrecer el rol RECEPCIÓN en el equipo de este negocio? ────
CREATE OR REPLACE FUNCTION public.puede_ofrecer_rol_recepcion(p_prestador_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
  -- Hoy es exactamente el mismo predicado, y AUN ASÍ vive aparte: son dos
  -- PREGUNTAS distintas que hoy comparten respuesta. El día que la letra
  -- agregue una condición al rol (un piso de equipo, un estado de cuenta),
  -- se enmienda acá sin tocar la composición de ATENDER — y al revés.
  -- Fusionarlas ahorraría cuatro líneas y costaría la separación.
  SELECT public.negocio_atiende_en_local(p_prestador_id);
$function$;

COMMENT ON FUNCTION public.puede_ofrecer_rol_recepcion(uuid) IS
  'La regla condicional de recepción (firma founder 13-ago): sin servicio con '
  'atención en local activa, el rol NO se ofrece. Ley 23 — la puerta no ofrece '
  'lo que no existe. El caso que la vuelve necesaria es el vendedor puro: cero '
  'servicios ⇒ false. Y el rol que se otorga por error no se descubre nunca, '
  'porque nadie audita por qué alguien NO usó un permiso.';

REVOKE EXECUTE ON FUNCTION public.negocio_atiende_en_local(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.negocio_atiende_en_local(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.puede_ofrecer_rol_recepcion(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.puede_ofrecer_rol_recepcion(uuid) TO authenticated;

-- ── ③ LA LÁPIDA DE `crear_mascota_walkin` (D-794) ────────────────────────
-- REVOKE + lápida, JAMÁS DROP (patrón D-705): otro repo del legado comparte
-- esta base (D-471), y una función que desaparece rompe distinto que una que
-- rebota. Medido antes de tocar: CERO llamadores en todo el repo (solo
-- aparece en `database.types.ts`, que es generado) y CERO familias
-- `virtual_prestador` vivas — nunca corrió.
REVOKE EXECUTE ON FUNCTION public.crear_mascota_walkin(uuid,text,text,text,text,text,date,text,text) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.crear_mascota_walkin(uuid,text,text,text,text,text,date,text,text) IS
  '☠️ JUBILADA S97-A (D-794) — REVOCADA de authenticated, no dropeada (D-705). '
  'Creaba una mascota SIN correo ni teléfono: una mascota que NADIE puede '
  'reclamar jamás, porque no hay llave por la cual encontrarla. La firma del '
  'founder del 13-ago la vuelve ilegal — la mascota del mostrador se asocia a '
  'un contacto, o no se crea. SU REEMPLAZO, vivo y cableado: '
  '`crear_alta_asistida_pendiente` (cliente sin cuenta → familia '
  'pendiente_completar + cliente_pendiente_registro; el trigger '
  '`trg_completar_pendiente_registro` en `profiles` se la entrega al activar) '
  'y `crear_alta_asistida_existente` + `crear_solicitud_autorizacion` '
  '(cliente con cuenta → handshake).';

-- ── CINTURÓN CON DISCRIMINADOR ───────────────────────────────────────────
DO $$
DECLARE v_pres uuid; v_vendedor uuid; v_r boolean; v_n int;
BEGIN
  SET LOCAL ROLE postgres;

  -- L-140 en las dos nuevas
  IF has_function_privilege('anon','public.negocio_atiende_en_local(uuid)','EXECUTE')
     OR has_function_privilege('anon','public.puede_ofrecer_rol_recepcion(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: anon alcanza un lector nuevo (L-140)';
  END IF;

  -- ① EL DISCRIMINADOR: un prestador CON servicios da true...
  SELECT ps.prestador_id INTO v_pres FROM prestador_servicios ps
   WHERE ps.activo AND ps.atiende_local LIMIT 1;
  IF v_pres IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay prestador con servicio en local — el caso positivo no existe';
  END IF;
  IF NOT negocio_atiende_en_local(v_pres) THEN
    RAISE EXCEPTION 'CINTURON: un prestador CON servicio en local dio false';
  END IF;

  -- ② ...y el VENDEDOR PURO (cuenta sin prestador) da false. Es el caso que
  --    la firma existe para cubrir, y el fixture ABORTA si no está vivo.
  SELECT cc.id INTO v_vendedor FROM cuentas_comerciales cc
   WHERE NOT EXISTS (SELECT 1 FROM prestadores p WHERE p.cuenta_comercial_id = cc.id)
     AND EXISTS (SELECT 1 FROM cuenta_roles cr WHERE cr.cuenta_comercial_id=cc.id
                  AND cr.tipo_actor='seller_productos' AND cr.estado='activo')
   LIMIT 1;
  IF v_vendedor IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay vendedor puro vivo — el caso que la firma cubre no se puede discriminar';
  END IF;
  -- Un vendedor puro no tiene prestador_id: el lector se llama con NULL y con
  -- un uuid inexistente, y las dos veces tiene que decir false (jamás NULL).
  IF negocio_atiende_en_local(NULL) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'CINTURON: con NULL el lector no dijo false';
  END IF;
  IF negocio_atiende_en_local(gen_random_uuid()) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'CINTURON: con un prestador inexistente el lector no dijo false';
  END IF;

  -- ③ el gate de recepción sigue al lector en los dos sentidos
  IF NOT puede_ofrecer_rol_recepcion(v_pres) THEN RAISE EXCEPTION 'CINTURON: recepcion negada a un negocio con local'; END IF;
  IF puede_ofrecer_rol_recepcion(NULL) IS DISTINCT FROM false THEN RAISE EXCEPTION 'CINTURON: recepcion ofrecida sin negocio'; END IF;

  -- ④ LA LÁPIDA: authenticated ya NO alcanza la puerta jubilada
  IF has_function_privilege('authenticated','public.crear_mascota_walkin(uuid,text,text,text,text,text,date,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: crear_mascota_walkin sigue alcanzable por authenticated (D-794)';
  END IF;
  -- ...y su reemplazo SÍ (jubilar no puede cerrar el camino bueno)
  IF NOT has_function_privilege('authenticated','public.crear_alta_asistida_pendiente(text,text,text,uuid,text,text,text,text,text,date,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: el reemplazo NO es alcanzable — se cerro el camino bueno';
  END IF;

  RAISE NOTICE 'CINTURON lectores: prestador con local=true · NULL/inexistente=false · vendedor puro sin prestador · recepcion sigue al lector · walkin JUBILADA y su reemplazo VIVO';
END $$;

COMMIT;
