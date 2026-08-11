-- ═══════════════════════════════════════════════════════════════════════════
-- S95-C · MIGRACIÓN 7 — EL PUENTE AL BIO-EXPEDIENTE
--
-- **Sin esto, una tienda cualquiera alcanzaba.** (`MODELO_DESPENSA` §7.)
--
-- `BIO_EXPEDIENTE` E2bis: la compra como fuente de evento. El tipo
-- `producto_asignacion` YA EXISTE y está activo — esta migración NO funda un
-- tipo nuevo: le da su tabla de detalle, su procedencia obligatoria y sus
-- límites. Su `tabla_tipada` está en NULL desde el 11-may-2026 y cero eventos
-- se depositaron nunca.
--
-- Reversa (escrita ANTES): docs/relevamientos/2026-08-11-s95-m7-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** Esta migración toca `eventos_mascota`, que tiene 295
-- filas VIVAS del expediente de mascotas reales. El cinturón cuenta los
-- eventos y su reparto de procedencia ANTES y exige que sean IDÉNTICOS
-- después. Un evento nuevo durante la ventana hace que no cierre y aborta.
-- **No hay backfill: las 199 filas sin procedencia se quedan como están,
-- porque inventarles una fuente sería fabricar dato.**
--
-- ── LOS TRES GUARDS, LOS TRES EN EL ESQUEMA ───────────────────────────────
-- ① **Procedencia obligatoria para este tipo.** No se puede hacer NOT NULL
--    global —hay 199 filas viejas en NULL— así que va un CHECK condicional.
--    No rompe nada vivo y hace inexpresable el evento de compra sin fuente.
-- ② **Siempre `declarado_por_familia`.** Una compra la aporta la familia,
--    jamás un profesional: un alimento comprado no tiene el peso de una
--    prescripción veterinaria, y ninguna pantalla los puede confundir.
-- ③ **La frontera vive en `cat_familias_producto.entra_al_expediente`** (M2),
--    no en un documento. Acá se le pone el guard que la hace exigible.
--
-- ── D-753: LA COSTURA DEL MODO DE CAPTURA ─────────────────────────────────
-- `procedencia` responde QUIÉN aporta. Falta CÓMO se capturó: tecleado,
-- dictado o extraído por IA. **Hoy es una columna; con miles de eventos vivos
-- es una migración con backfill.** Nace NULLABLE — los 295 eventos vivos no lo
-- declaran, y fingir que sí sería inventar dato.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 🔴 CINTURÓN 0 · FOTO DEL EXPEDIENTE (la veda vive acá).
CREATE TEMP TABLE _s95_m7_antes AS
SELECT COALESCE(procedencia,'(null)') proc, count(*) n
FROM eventos_mascota GROUP BY 1;

DO $$
DECLARE v_tot int;
BEGIN
  SELECT sum(n) INTO v_tot FROM _s95_m7_antes;
  IF v_tot <> 295 THEN
    RAISE EXCEPTION 'ABORTA: el expediente tenía 295 eventos en la medición y hoy tiene %.', v_tot;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE A · LA TABLA TIPADA DE DETALLE
-- Molde de las otras 40 (`evento_vacuna_aplicada`, etc.): cuelga del hito por
-- `evento_id` con FK RESTRICT.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.evento_producto_asignacion (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id             uuid NOT NULL UNIQUE REFERENCES public.eventos_mascota(id) ON DELETE RESTRICT,
  mascota_id            uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE RESTRICT,
  producto_id           uuid REFERENCES public.productos(id) ON DELETE RESTRICT,
  variante_id           uuid REFERENCES public.producto_variantes(id) ON DELETE RESTRICT,
  pedido_item_id        uuid REFERENCES public.pedido_items(id) ON DELETE RESTRICT,
  -- Snapshot: el nombre de lo comprado tiene que sobrevivir a que el producto
  -- cambie de nombre o se retire del catálogo.
  nombre_producto       text NOT NULL,
  familia_codigo        text REFERENCES public.cat_familias_producto(codigo),
  presentacion          text,
  cantidad              numeric(10,3) NOT NULL CHECK (cantidad > 0),
  peso_kg               numeric(8,3),
  fecha_compra          date NOT NULL,
  -- 🔴 LO QUE HACE QUE ESTO SEA PRODUCTO Y NO CATÁLOGO (§7.3):
  duracion_estimada_dias integer CHECK (duracion_estimada_dias IS NULL OR duracion_estimada_dias > 0),
  periodicidad_dias      integer CHECK (periodicidad_dias IS NULL OR periodicidad_dias > 0),
  country_code          text NOT NULL DEFAULT 'EC',
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prod_asig_mascota ON public.evento_producto_asignacion (mascota_id, fecha_compra DESC);
CREATE INDEX idx_prod_asig_pedido  ON public.evento_producto_asignacion (pedido_item_id);

COMMENT ON COLUMN public.evento_producto_asignacion.duracion_estimada_dias IS
  'MODELO_DESPENSA §7.3: «avisar cuándo se está acabando el alimento, '
  'calculado por porción y fecha de compra». ESTO es el producto, no el '
  'catálogo. Con la vara de MODELO_LOYALTY §6: se celebra, jamás se reprocha — '
  'un recordatorio de antipulgas es cuidado; un contador regresivo para '
  'comprar es un dark pattern.';

COMMENT ON TABLE public.evento_producto_asignacion IS
  'La compra que ENTRA al expediente. Solo alimento, suplementos, '
  'antiparasitarios y dietas de prescripción: entra lo que cambia el cuerpo o '
  'el riesgo sanitario de la mascota. Una cama es compra; un antipulgas es '
  'cuidado. Un expediente que registra todo lo comprado deja de ser clínico y '
  'se vuelve un historial de consumo — que es lo que P5 y MODELO_LOYALTY §7 '
  'impiden.';

-- El tipo de evento gana su casa. Estaba en NULL desde el 11-may-2026.
UPDATE public.cat_tipos_evento
   SET tabla_tipada = 'evento_producto_asignacion',
       updated_at = now()
 WHERE codigo = 'producto_asignacion';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE B · D-753 — EL EVENTO DECLARA CÓMO SE CAPTURÓ
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.eventos_mascota
  ADD COLUMN modo_captura text
  CHECK (modo_captura IS NULL OR modo_captura IN
         ('tecleado','dictado','extraido_por_ia','automatico'));

COMMENT ON COLUMN public.eventos_mascota.modo_captura IS
  'D-753 · costura de S95. `procedencia` responde QUIÉN aporta; esto responde '
  'CÓMO se capturó. Un evento asistido por IA no tiene el mismo peso probatorio '
  'que uno tecleado, y un expediente append-only que viaja con la mascota no '
  'los puede confundir. NULLABLE a propósito: los 295 eventos vivos no lo '
  'declaran y fingir que sí sería inventar dato. '
  'CASO VIVO QUE TODAVÍA NO LO ESTAMPA: el dictado clínico del flujo '
  'veterinario, desde S70.';

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE C · LOS GUARDS DE E2bis
-- ───────────────────────────────────────────────────────────────────────────

-- ① y ② en un solo CHECK: la compra declara su fuente, y esa fuente es la
--    familia. NOT VALID porque las 199 filas viejas sin procedencia no son de
--    este tipo pero el validador recorrería la tabla entera igual; se declara.
ALTER TABLE public.eventos_mascota
  ADD CONSTRAINT chk_producto_asignacion_procedencia
  CHECK (tipo <> 'producto_asignacion' OR procedencia = 'declarado_por_familia')
  NOT VALID;

COMMENT ON CONSTRAINT chk_producto_asignacion_procedencia ON public.eventos_mascota IS
  'BIO_EXPEDIENTE E2bis condición 2: una compra la aporta la FAMILIA, jamás un '
  'profesional. Un alimento comprado no tiene el peso de una prescripción '
  'veterinaria. NOT VALID porque hay 199 eventos viejos sin procedencia que NO '
  'son de este tipo — y no se les inventa una fuente.';

-- ③ La frontera: solo entra lo que la familia de producto declara que entra.
CREATE OR REPLACE FUNCTION public._trg_producto_asignacion_frontera()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_entra boolean;
BEGIN
  IF NEW.familia_codigo IS NULL THEN
    RAISE EXCEPTION 'producto_asignacion sin familia: no se puede saber si entra al expediente'
      USING ERRCODE = '22023';
  END IF;
  SELECT entra_al_expediente INTO v_entra
    FROM cat_familias_producto WHERE codigo = NEW.familia_codigo;
  IF NOT COALESCE(v_entra, false) THEN
    RAISE EXCEPTION 'la familia "%" NO entra al expediente (BIO_EXPEDIENTE E2bis): entra lo que cambia el cuerpo o el riesgo sanitario de la mascota', NEW.familia_codigo
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_producto_asignacion_frontera
  BEFORE INSERT OR UPDATE ON public.evento_producto_asignacion
  FOR EACH ROW EXECUTE FUNCTION public._trg_producto_asignacion_frontera();

-- ───────────────────────────────────────────────────────────────────────────
-- BLOQUE D · RLS Y GRANTS — el molde estricto del expediente
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.evento_producto_asignacion ENABLE ROW LEVEL SECURITY;

-- 🔴 EL PREDICADO ES EL DE LA CASA, COMPUESTO DE HELPERS CON NOMBRE, y NO
--    menciona vendedor, pedido ni oferta. Es lo que el invariante 4 vigila:
--    el rol seller no hereda NINGÚN acceso al expediente.
CREATE POLICY prod_asig_select ON public.evento_producto_asignacion FOR SELECT TO authenticated
  USING (user_tiene_acceso_a_mascota(mascota_id));
CREATE POLICY prod_asig_insert ON public.evento_producto_asignacion FOR INSERT TO authenticated
  WITH CHECK (user_tiene_acceso_a_mascota(mascota_id));

REVOKE ALL ON public.evento_producto_asignacion FROM anon, authenticated, PUBLIC;
-- Append-only como todo el expediente: SELECT e INSERT. Una compra devuelta no
-- borra el evento — deposita otro que lo corrige (E2bis condición 1).
GRANT SELECT, INSERT ON public.evento_producto_asignacion TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- CINTURONES
-- ───────────────────────────────────────────────────────────────────────────

-- 🔴 ① LA VEDA SE CIERRA: el expediente vivo, intacto.
DO $$
DECLARE v_dif int;
BEGIN
  SELECT count(*) INTO v_dif FROM (
    SELECT COALESCE(procedencia,'(null)') proc, count(*) n FROM eventos_mascota GROUP BY 1
    EXCEPT
    SELECT proc, n FROM _s95_m7_antes
  ) q;
  IF v_dif > 0 THEN
    RAISE EXCEPTION 'ABORTA: el expediente cambió durante la ventana (% diferencias). Esta migración no toca datos vivos.', v_dif;
  END IF;
END $$;

-- 🔴 ② LA FRONTERA REBOTA DE VERDAD, con datos reales de una mascota real.
--    No se verifica que el trigger exista: se le da una cama y se exige que la
--    rechace, y un alimento y se exige que lo acepte.
DO $$
DECLARE
  v_mascota uuid; v_ev uuid; v_user uuid; v_pais text; v_ok boolean := false;
BEGIN
  -- 🔴 TODO MEDIDO, NADA SUPUESTO (regla 22). Este SELECT se escribió mal
  --    TRES VECES seguidas por adivinar vocabulario, y las tres las cazó el
  --    cinturón al abortar: la tabla es `familia` en SINGULAR, no `familias`;
  --    el rol es `adulto_titular`, no `titular`; y el estado de vida es
  --    `activa`, no `vivo`. *Un fixture que adivina nombres no prueba nada:
  --    aborta antes de llegar a la pregunta que vino a hacer.*
  SELECT m.id, m.country_code, fm.user_id
    INTO v_mascota, v_pais, v_user
  FROM mascotas m
  JOIN familia_miembro fm ON fm.familia_id = m.familia_id
                         AND fm.rol = 'adulto_titular' AND fm.hasta IS NULL
  WHERE m.estado_vida = 'activa' LIMIT 1;
  IF v_mascota IS NULL THEN
    RAISE EXCEPTION 'ABORTA: no hay mascota viva para discriminar. El cinturón no puede probar nada.';
  END IF;

  -- El hito, con la procedencia que E2bis exige.
  INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                               procedencia, modo_captura, country_code, creado_por_user_id)
    VALUES (v_mascota, 'producto_asignacion', 'alimentacion', now(), '{"cinturon":"s95_m7"}'::jsonb,
            'declarado_por_familia', 'tecleado', v_pais, v_user)
    RETURNING id INTO v_ev;

  -- Un ALIMENTO entra.
  INSERT INTO evento_producto_asignacion
    (evento_id, mascota_id, nombre_producto, familia_codigo, cantidad, fecha_compra, country_code)
    VALUES (v_ev, v_mascota, '__cint_alimento', 'alimento', 1, current_date, v_pais);

  -- 🔴 Una CAMA no entra. Si entra, la frontera de E2bis es prosa.
  BEGIN
    INSERT INTO evento_producto_asignacion
      (evento_id, mascota_id, nombre_producto, familia_codigo, cantidad, fecha_compra, country_code)
      VALUES (gen_random_uuid(), v_mascota, '__cint_cama', 'cama', 1, current_date, v_pais);
  EXCEPTION WHEN others THEN
    v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: una CAMA entró al expediente. La frontera de E2bis no está siendo exigida.';
  END IF;

  -- 🔴 Y un evento de compra con procedencia de PROFESIONAL rebota.
  v_ok := false;
  BEGIN
    INSERT INTO eventos_mascota (mascota_id, tipo, eje_jtbd, fecha_evento, datos,
                                 procedencia, country_code, creado_por_user_id)
      VALUES (v_mascota, 'producto_asignacion', 'alimentacion', now(), '{}'::jsonb,
              'declarado_por_prestador', v_pais, v_user);
  EXCEPTION WHEN check_violation THEN v_ok := true;
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'ABORTA: una compra se registró como declarada por un PROFESIONAL. E2bis dice que la aporta la familia.';
  END IF;

  DELETE FROM evento_producto_asignacion WHERE evento_id = v_ev;
  DELETE FROM eventos_mascota WHERE datos->>'cinturon' = 's95_m7';
END $$;

-- 🔴 ③ EL INVARIANTE QUE ESTA MIGRACIÓN PODRÍA HABER ROTO: la compra NO
--    alimenta el loyalty. Se verifica DESPUÉS de crear el puente, que es el
--    único momento en que la pregunta tiene sentido.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc p ON p.oid = t.tgfoid
   WHERE NOT t.tgisinternal
     AND c.relname IN ('evento_producto_asignacion','pedidos','pedido_items','pedido_estados')
     AND pg_get_functiondef(p.oid) ~* '(transacciones_puntos|otorgar_puntos|puntos_usuario)';
  IF v_n > 0 THEN
    RAISE EXCEPTION 'ABORTA: % trigger(es) conectan la compra con el motor de puntos. MODELO_LOYALTY §5 lo prohíbe sin excepción.', v_n;
  END IF;
END $$;

-- ④ El tipo sigue siendo UNO y ahora tiene casa · append-only · anon.
DO $$
DECLARE v_n int; v_tabla text; v_mal text;
BEGIN
  SELECT count(*) INTO v_n FROM cat_tipos_evento WHERE codigo ~* 'producto';
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: hay % tipos de evento de producto.', v_n; END IF;
  SELECT tabla_tipada INTO v_tabla FROM cat_tipos_evento WHERE codigo = 'producto_asignacion';
  IF v_tabla IS DISTINCT FROM 'evento_producto_asignacion' THEN
    RAISE EXCEPTION 'ABORTA: el tipo sigue sin casa (tabla_tipada = %).', COALESCE(v_tabla,'NULL');
  END IF;

  SELECT string_agg(r||' puede '||p, ', ') INTO v_mal
  FROM unnest(ARRAY['anon','authenticated']) r, unnest(ARRAY['UPDATE','DELETE','TRUNCATE']) p
  WHERE has_table_privilege(r, 'public.evento_producto_asignacion', p);
  IF v_mal IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTA: el detalle de la compra no es append-only (%).', v_mal;
  END IF;
  IF has_table_privilege('anon','public.evento_producto_asignacion','SELECT') THEN
    RAISE EXCEPTION 'ABORTA: anon puede leer el expediente.';
  END IF;
END $$;

-- ⑤ Residuo 0.
DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM evento_producto_asignacion;
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % detalles de fixture.', v_n; END IF;
  SELECT count(*) INTO v_n FROM eventos_mascota WHERE datos->>'cinturon' = 's95_m7';
  IF v_n > 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % hitos de fixture.', v_n; END IF;
END $$;

DROP TABLE _s95_m7_antes;

COMMIT;
