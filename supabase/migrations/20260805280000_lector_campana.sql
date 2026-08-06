-- S88-A · EL LECTOR DE LA CAMPANA (lámina firmada, 5-ago)
--
-- 76(g) — VEDA: **NO RIGE.** Una columna nullable nueva (sin backfill) + dos
--   funciones. Cero filas se reescriben.
--
-- ─────────────────────────────────────────────────────────────────────────
-- LA SEMÁNTICA, que es la decisión de esta migración y no un detalle:
--
--   **PARA `in_app` NO HAY EDGE FUNCTION QUE ENTREGUE — LA CAMPANA *ES* LA
--   ENTREGA.** Medido: el despachador marca `estado='encolada'` +
--   `resuelto_como.despacho='para_transporte'` y ahí se detiene; quien entrega
--   por correo es `despachar-correo`, que para in_app no existe (ni debe).
--
--   ⇒ La campana muestra lo que el motor DECIDIÓ mandar por in_app
--     (`despacho='para_transporte'`), y la única transición que agrega es
--     `→ leida`, por acto explícito de la persona.
--
--   **El lector NO marca entregado al listar.** Sería un efecto lateral en una
--   lectura, y peor: daría por «entregado» lo que la persona nunca miró — la
--   pantalla puede tener 40 avisos y ver tres.
--
-- Y LA SOMBRA CALLA SOLA: las intenciones de un tipo en sombra quedan en
--   `encolada` con `despacho='sombra_habria_salido'` — **el filtro por
--   `despacho='para_transporte'` las excluye sin nombrarlas.** Un tipo que
--   sale de sombra empieza a aparecer sin tocar este lector.
--
-- ⚠️ Y EL MEMORIAL NO SE VUELVE A DECIDIR ACÁ: lo descartado nunca llegó a
--   `para_transporte` — `registrar_intencion_notificacion` lo cortó en su
--   gate 1 con `estado='descartada'`. **La campana lo HEREDA.** Que la
--   pantalla no tenga que acordarse es exactamente el punto de la lámina.
--
-- ⚠️ EL DESTINO: el motor entrega REFERENTES (`mascota_id`, `evento_id`,
--   `tipo`), jamás una ruta. **La misma notificación lleva a pantallas
--   DISTINTAS en el prestador y en el cliente** — una ruta en la DB sería voz
--   de producto adentro del motor (D-539) y se rompería sola. `tiene_destino`
--   se DERIVA de si hay referente: la lámina pide que el que no tiene se
--   declare sin él, jamás que se finja.
-- ─────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE public.notificacion_intencion
  ADD COLUMN IF NOT EXISTS leida_en timestamptz;

COMMENT ON COLUMN public.notificacion_intencion.leida_en IS
  'S88: el momento en que la persona lo leyó en la campana. NULL = no leído. '
  'El estado `leida` y esta columna se escriben juntos, por marcar_aviso_leido.';


-- ① EL LECTOR
CREATE OR REPLACE FUNCTION public.obtener_mis_avisos(p_limite integer DEFAULT 50)
RETURNS TABLE(
  id            uuid,
  titulo        text,
  mensaje       text,
  tipo          text,
  categoria     text,
  mascota_id    uuid,
  evento_id     uuid,
  tiene_destino boolean,
  creado_en     timestamptz,
  leida         boolean,
  leida_en      timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    -- LA VOZ VIAJA COMO DATO: la escribió quien registró la intención, y es
    -- LA MISMA que sale por correo. La pantalla no traduce tipos — no
    -- necesita saber que existen (lámina §2).
    i.datos->>'titulo'  AS titulo,
    i.datos->>'mensaje' AS mensaje,
    i.tipo,
    i.categoria,
    i.mascota_id,
    i.evento_id,
    (i.mascota_id IS NOT NULL OR i.evento_id IS NOT NULL) AS tiene_destino,
    i.created_at,
    (i.estado = 'leida') AS leida,
    i.leida_en
  FROM notificacion_intencion i
  WHERE i.destinatario_user_id = auth.uid()          -- ① la persona, y solo ella
    AND i.resuelto_como->>'canal_elegido' = 'in_app' -- ② el canal de la campana
    AND i.resuelto_como->>'despacho' = 'para_transporte'
    -- ③ ↑ excluye lo DESCARTADO (memorial incluido), lo RETENIDO por el kill
    --   switch, lo que está EN SOMBRA y lo que todavía no se evaluó — sin
    --   nombrar ninguno: los cuatro carecen de este marcador.
  ORDER BY i.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limite, 50), 200));
END;
$$;

COMMENT ON FUNCTION public.obtener_mis_avisos(integer) IS
  'S88/lámina de la campana: los avisos que el motor decidió mandar por in_app '
  'a quien llama, más nuevo arriba. El destino son REFERENTES, jamás una ruta '
  '(la misma notificación va a pantallas distintas en cada app). No marca '
  'entregado al listar: mostrar 40 no es que la persona miró 40.';


-- ② EL VERBO — POR AVISO. Jamás un «marcar todo».
CREATE OR REPLACE FUNCTION public.marcar_aviso_leido(p_aviso_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_filas int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  /* ⚠️ NO EXISTE `marcar_todos_leidos`, Y ES LETRA FIRMADA, no una omisión:
     *borrar sin leer es perder*. Un botón que vacía la campana de un saque
     convierte «no lo leí» en «no existió» — y el aviso que se pierde así es
     justamente el que la persona no alcanzó a mirar. **Si algún día se pide,
     es enmienda de lámina.** */

  UPDATE notificacion_intencion i
     SET estado     = 'leida',
         leida_en   = coalesce(i.leida_en, now()),  -- el PRIMER leído manda
         updated_at = now()
   WHERE i.id = p_aviso_id
     AND i.destinatario_user_id = auth.uid()
     AND i.resuelto_como->>'canal_elegido' = 'in_app'
     AND i.resuelto_como->>'despacho' = 'para_transporte';
  GET DIAGNOSTICS v_filas = ROW_COUNT;

  /* Se cuenta ROW_COUNT, jamás la ausencia de excepción: un UPDATE que no
     matchea NO FALLA — afecta cero (ley de esta sesión). Cero acá significa
     «no es tuyo, no existe, o no es un aviso de campana», y las tres se
     contestan igual porque distinguirlas le diría a un extraño si el id
     existe. */
  IF v_filas = 0 THEN
    RAISE EXCEPTION 'aviso_no_encontrado' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'aviso_id', p_aviso_id);
END;
$$;

COMMENT ON FUNCTION public.marcar_aviso_leido(uuid) IS
  'S88: marca UN aviso leído. No existe «marcar todos» — letra firmada: '
  'borrar sin leer es perder. El primer leído manda (coalesce sobre leida_en).';


-- L-140
REVOKE EXECUTE ON FUNCTION public.obtener_mis_avisos(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_aviso_leido(uuid)    FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_mis_avisos(integer) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.marcar_aviso_leido(uuid)    TO authenticated;

-- ── CINTURÓN ──────────────────────────────────────────────────────────────
DO $belt$
DECLARE v_anon int;
BEGIN
  IF to_regprocedure('public.obtener_mis_avisos(integer)') IS NULL
     OR to_regprocedure('public.marcar_aviso_leido(uuid)') IS NULL THEN
    RAISE EXCEPTION 'CINTURON: falta alguna de las dos funciones';
  END IF;

  -- ⚠️ EL CINTURÓN QUE IMPORTA: que NO exista un «marcar todos». La letra dice
  --    que no debe haberlo; el guard lo verifica sobre el OBJETO.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname ILIKE '%marcar_todos%') THEN
    RAISE EXCEPTION 'CINTURON: apareció un marcar-todos; la letra lo prohíbe';
  END IF;

  SELECT count(*) INTO v_anon FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN ('obtener_mis_avisos','marcar_aviso_leido')
     AND array_to_string(COALESCE(p.proacl,'{}'), ',') LIKE '%anon=%';
  IF v_anon <> 0 THEN RAISE EXCEPTION 'CINTURON (L-140): % con anon', v_anon; END IF;

  RAISE NOTICE 'CINTURON VERDE: lector y verbo creados · sin marcar-todos · 0 anon.';
END
$belt$;

COMMIT;
