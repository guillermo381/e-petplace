-- ============================================================================
-- S87-A · LOTE 1 · PIEZA ③ — LA CURA DEL CONTRATO DE PREFERENCIAS
--
-- Cierra los TRES choques que el censo de S87 midió (MODELO_NOTIFICACIONES §6,
-- ENMIENDA S87):
--   ① la unidad (persona, categoría, canal) era INEXPRESABLE — PK (user_id,tipo)
--   ② `promocion` NACÍA ENCENDIDA — "fila ausente = habilitada" sin distinguir
--      categoría, contra §3/§6/§12.3
--   ③ `vacuna_vencida` SE PODÍA APAGAR — contra §3 y contra la letra firmada
--
-- LOS DOS DEFECTOS SON SIMÉTRICOS Y SON EL MISMO: uno enciende lo que debe
-- nacer apagado, el otro apaga lo que no se puede apagar. Los dos sobrevivían
-- porque el contrato NO SABÍA QUÉ ES UNA CATEGORÍA. Por eso esta pieza va
-- después de ① y no antes.
--
-- LA LETRA FIRMADA POR EL FOUNDER (S87) que esta migración vuelve mecánica:
--   «Elige por dónde le llegan, no si le llegan.»
--
-- VEDA 76(g): RIGE. Hay MOVIMIENTO DE DATOS (5 filas vivas se transforman).
--   Ventana declarada: esta migración. La tabla vieja se conserva como
--   `user_notificacion_prefs_legacy` — no se borra nada.
--
-- REVERSA escrita ANTES, y NO ES LIMPIA (revertir REINSTALA los dos defectos):
--   docs/relevamientos/2026-08-04-s87a-REVERSA-contrato-preferencias.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ① EL CATÁLOGO DE CANALES (regla 21: catálogo antes de hardcodear)
--
-- Los cuatro salen del CHECK vivo de `notificaciones.canal`, no de la cabeza.
-- `es_piso` marca al canal que NO se puede apagar en una categoría no apagable:
-- es la mitad mecánica de la letra firmada — ver el trigger de ④.
-- ---------------------------------------------------------------------------
CREATE TABLE public.cat_notificacion_canales (
  codigo   text PRIMARY KEY,
  descripcion text NOT NULL,
  -- el canal que sostiene «no si le llegan»: siempre queda uno.
  es_piso  boolean NOT NULL DEFAULT false,
  -- ¿exige opt-in con evidencia (§6)? WhatsApp sí, por requisito de Meta.
  exige_evidencia boolean NOT NULL DEFAULT false,
  orden    integer NOT NULL
);

INSERT INTO public.cat_notificacion_canales (codigo, descripcion, es_piso, exige_evidencia, orden) VALUES
  ('in_app',  'Adentro de la app. Es el piso: siempre queda este.', true,  false, 1),
  ('push',    'Notificación al teléfono.',                          false, false, 2),
  ('email',   'Correo. El canal de CONSTANCIA (§7).',               false, false, 3),
  ('whatsapp','WhatsApp. Exige opt-in con evidencia (§6, Meta).',   false, true,  4);

-- ---------------------------------------------------------------------------
-- ② LA TABLA NUEVA — la unidad de §6, por fin expresable
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_notificacion_prefs RENAME TO user_notificacion_prefs_legacy;

COMMENT ON TABLE public.user_notificacion_prefs_legacy IS
  'Contrato B4 viejo (PK user_id+tipo, sin canal). CONGELADO por S87: se '
  'conserva como evidencia de la migración. NO se escribe. Su defecto medido: '
  '"fila ausente = habilitada" sin distinguir categoría.';

CREATE TABLE public.user_notificacion_prefs (
  user_id    uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria  text    NOT NULL REFERENCES public.cat_notificacion_categorias(codigo),
  canal      text    NOT NULL REFERENCES public.cat_notificacion_canales(codigo),
  habilitada boolean NOT NULL,
  -- §6: WhatsApp exige guardar QUÉ TEXTO se le mostró, cuándo y por qué método.
  -- Sin evidencia el canal no se puede usar sin riesgo de bloqueo del número.
  evidencia  jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, categoria, canal)
);

COMMENT ON TABLE public.user_notificacion_prefs IS
  'La unidad de MODELO_NOTIFICACIONES §6: (persona, categoría, canal). '
  'Ausencia de fila = el default de la CATEGORÍA (ver preferencia_efectiva). '
  'El trigger honra la letra firmada: elige por dónde le llegan, no si le llegan.';

-- ---------------------------------------------------------------------------
-- ③ EL DEFAULT DEJA DE SER UNA CONSTANTE Y PASA A SER FUNCIÓN DEL CATÁLOGO
--
-- Acá muere el defecto ②: "ausente = habilitada" se reemplaza por
-- "ausente = lo que la categoría diga". `comercial` nace apagada porque su
-- categoría lo dice, no porque alguien se acuerde de excluirla.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.preferencia_efectiva(
  p_user_id uuid, p_categoria text, p_canal text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
  SELECT COALESCE(
    (SELECT p.habilitada FROM public.user_notificacion_prefs p
      WHERE p.user_id = p_user_id AND p.categoria = p_categoria AND p.canal = p_canal),
    -- sin fila: manda la categoría. WhatsApp SIEMPRE arranca apagado (§6),
    -- sin importar la categoría — el opt-in con evidencia es la única puerta.
    CASE WHEN p_canal = 'whatsapp' THEN false
         ELSE (SELECT c.default_habilitada FROM public.cat_notificacion_categorias c
                WHERE c.codigo = p_categoria) END,
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- ④ EL TRIGGER QUE HONRA LA LETRA FIRMADA
--
-- «Elige por dónde le llegan, no si le llegan»: en una categoría NO apagable,
-- el canal PISO (in_app) no se puede apagar. Los demás canales sí — que es
-- exactamente "elegir por dónde".
--
-- Acá muere el defecto ③, Y muere EN EL MOTOR: la superficie va a dejar de
-- dibujar ese toggle, pero una autorización que decide el cliente es
-- decorativa (la lección de D-654). Los dos lados, o ninguno.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._trg_prefs_honra_categoria()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  v_apagable boolean;
  v_es_piso  boolean;
  v_exige_ev boolean;
BEGIN
  SELECT c.apagable_existencia INTO v_apagable
    FROM public.cat_notificacion_categorias c WHERE c.codigo = NEW.categoria;
  SELECT ch.es_piso, ch.exige_evidencia INTO v_es_piso, v_exige_ev
    FROM public.cat_notificacion_canales ch WHERE ch.codigo = NEW.canal;

  IF v_apagable = false AND v_es_piso = true AND NEW.habilitada = false THEN
    RAISE EXCEPTION 'categoria_no_apagable'
      USING ERRCODE = '23514',
            HINT = 'La categoria ' || NEW.categoria || ' no se puede apagar en su '
                || 'EXISTENCIA: se elige por donde llega, no si llega. Apaga los '
                || 'canales que quieras, menos el piso (in_app).';
  END IF;

  -- §6: WhatsApp encendido SIN evidencia guardada no es un opt-in — es un
  -- riesgo de bloqueo del numero. El motor no lo acepta.
  IF v_exige_ev = true AND NEW.habilitada = true AND NEW.evidencia IS NULL THEN
    RAISE EXCEPTION 'opt_in_sin_evidencia'
      USING ERRCODE = '23514',
            HINT = 'Encender ' || NEW.canal || ' exige guardar el texto exacto que '
                || 'se le mostro, cuando y por que metodo (MODELO_NOTIFICACIONES §6).';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_prefs_honra_categoria
  BEFORE INSERT OR UPDATE ON public.user_notificacion_prefs
  FOR EACH ROW EXECUTE FUNCTION public._trg_prefs_honra_categoria();

-- ---------------------------------------------------------------------------
-- ⑤ LA MIGRACIÓN DE LAS 5 FILAS VIVAS — con su decisión declarada
--
-- Las filas de `operacion` migran (coinciden con el default y son legítimas).
--
-- ⚠️ LA FILA `promocion = true` NO MIGRA COMO CONSENTIMIENTO, y es una decisión,
-- no un olvido: §6 exige que `comercial` sea OPT-IN **con evidencia**. Esa fila
-- no tiene ninguna — no hay registro de qué texto se mostró, cuándo, ni por qué
-- método. **No se puede distinguir un opt-in genuino de un `true` que escribió
-- el default roto**, que es justamente el defecto ② manifestado como dato.
--   ⇒ Migrarla sería importar el defecto con sello de aprobado.
--   ⇒ Queda intacta en `_legacy` como evidencia, y la persona vuelve al default
--     de su categoría (apagado). Si de verdad quería promos, las enciende una
--     vez, y esa vez SÍ deja evidencia.
-- ---------------------------------------------------------------------------
INSERT INTO public.user_notificacion_prefs (user_id, categoria, canal, habilitada)
SELECT DISTINCT l.user_id, t.categoria, ch.codigo, l.habilitada
  FROM public.user_notificacion_prefs_legacy l
  JOIN public.cat_notificacion_tipos t ON t.codigo = l.tipo
  JOIN public.cat_notificacion_categorias c ON c.codigo = t.categoria
  CROSS JOIN public.cat_notificacion_canales ch
 WHERE c.codigo <> 'comercial'          -- ver la nota de arriba
   AND ch.codigo IN ('in_app','push')   -- los canales que hoy existen de verdad
ON CONFLICT (user_id, categoria, canal) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ⑥ LOS CINTURONES — corren adentro y ABORTAN (L-199)
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_n integer; v_mal integer; v_com integer;
BEGIN
  -- (a) ninguna fila migrada puede violar la letra firmada
  SELECT count(*) INTO v_mal
    FROM public.user_notificacion_prefs p
    JOIN public.cat_notificacion_categorias c ON c.codigo = p.categoria
    JOIN public.cat_notificacion_canales ch   ON ch.codigo = p.canal
   WHERE c.apagable_existencia = false AND ch.es_piso AND p.habilitada = false;
  IF v_mal > 0 THEN RAISE EXCEPTION 'migracion_violo_la_letra: % filas', v_mal; END IF;

  -- (b) CERO consentimiento comercial importado sin evidencia
  SELECT count(*) INTO v_com FROM public.user_notificacion_prefs
   WHERE categoria = 'comercial' AND habilitada;
  IF v_com > 0 THEN RAISE EXCEPTION 'comercial_importado_sin_evidencia: %', v_com; END IF;

  -- (c) el default por categoría rige de verdad, medido por la función
  IF public.preferencia_efectiva('00000000-0000-0000-0000-000000000000','comercial','push') THEN
    RAISE EXCEPTION 'comercial_nace_encendida_todavia';
  END IF;
  IF NOT public.preferencia_efectiva('00000000-0000-0000-0000-000000000000','salud_seguridad','in_app') THEN
    RAISE EXCEPTION 'salud_no_nace_encendida';
  END IF;
  IF public.preferencia_efectiva('00000000-0000-0000-0000-000000000000','operacion','whatsapp') THEN
    RAISE EXCEPTION 'whatsapp_nace_encendido';
  END IF;

  SELECT count(*) INTO v_n FROM public.user_notificacion_prefs;
  RAISE NOTICE 'contrato OK · filas migradas=% · legacy intacta=%',
    v_n, (SELECT count(*) FROM public.user_notificacion_prefs_legacy);
END $$;

-- ---------------------------------------------------------------------------
-- ⑦ PRIVILEGIOS — L-140, y con la ley que S87 acaba de aprender:
--     el REVOKE nombra a `authenticated` TAMBIÉN, no solo a `anon`.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_notificacion_prefs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_notificacion_canales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notificacion_prefs_legacy ENABLE ROW LEVEL SECURITY;

CREATE POLICY prefs_own ON public.user_notificacion_prefs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY cat_canales_select ON public.cat_notificacion_canales
  FOR SELECT TO authenticated USING (true);
-- legacy: NADIE la lee por PostgREST. Es evidencia, no superficie.

REVOKE ALL ON public.user_notificacion_prefs        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.cat_notificacion_canales       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.user_notificacion_prefs_legacy FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notificacion_prefs TO authenticated;
GRANT SELECT ON public.cat_notificacion_canales TO authenticated;

REVOKE EXECUTE ON FUNCTION public.preferencia_efectiva(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.preferencia_efectiva(uuid, text, text) TO authenticated;

COMMIT;
