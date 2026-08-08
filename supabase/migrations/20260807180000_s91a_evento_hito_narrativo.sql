-- ============================================================================
-- S91-A · EVENTO_HITO_NARRATIVO — el hito del alta gana tabla (lámina firmada)
-- ============================================================================
-- La lámina LAMINA_ALTA_MASCOTA_S91 (firmada 7-ago-2026) ordena la tabla
-- para el hito «Una vida nueva empieza». MEDIDO antes de construir: el TIPO
-- `hito_narrativo` YA EXISTE en cat_tipos_evento (eje identidad,
-- tabla_tipada NULL — uno de los fantasmas que S67/D-415 puso en NULL
-- honesto). Esta migración NO crea un tipo: crea la tabla tipada que le
-- faltaba y conecta el catálogo.
--
-- La CLAVE del hito va a catálogo (cat_hitos_narrativos), no a CHECK:
-- regla 21 + el precedente S90 (cat_documentos_mascota mató tres
-- enumeraciones a mano — un CHECK acá sería nacer con la deuda que S90
-- acaba de pagar). Dos claves de MOTOR se siembran:
--   · vida_nueva_empieza — el alta de un individuo.
--   · mundo_nuevo_empieza — el alta de un ACUARIO (cláusula del pez;
--     tenor de referencia de mesa: «Un mundo nuevo empieza»).
-- ⚠️ LA CLAVE NO ES LA VOZ. La voz es de la pantalla (i18n) y la FIRMA el
-- founder en el gate de pantalla del alta (firma de mesa 7-ago, punto 4).
--
-- ⚠️ EL MOTOR NACE **SIN EMISOR**, A PROPÓSITO (declarado, no olvido):
-- el timeline del cliente trae TODOS los tipos y LineaDeVida cae a nodo
-- genérico por eje para un tipo sin voz (medido: timeline.ts trae todo salvo
-- cita_servicio; LineaDeVida DICCIONARIO ?? POR_EJE ?? GENERICO). Emitir hoy
-- pintaría «momento sin nombre» en los bundles vivos — el anti-patrón C8 de
-- S72. La emisión entra CON el alta rediseñada de S91, cuando la voz esté
-- firmada y en el diccionario. Trampa D-585 declarada: un fixture que
-- inserte hitos a mano daría verde sobre una puerta que no existe — el gate
-- real es el alta emitiendo por camino real.
--
-- Escritura: SOLO por RPCs DEFINER (no hay policy de INSERT — puerta única
-- de verdad). Lectura: la misma puerta que todo el expediente
-- (user_tiene_acceso_a_mascota).
--
-- Veda 76(g): NO RIGE — aditiva pura (2 tablas nuevas + UPDATE de 1 fila de
-- catálogo que ningún lector vivo consulta con tabla_tipada NULL vs valor).
-- D-662 (bundles vivos): ningún bundle consulta estas tablas (nacen acá);
-- el UPDATE de cat_tipos_evento.tabla_tipada no viaja a ningún wrapper.
-- Reversa escrita ANTES:
--   docs/relevamientos/2026-08-07-s91a-REVERSA-evento-hito-narrativo.sql
-- ============================================================================

BEGIN;

-- ── El catálogo de claves ───────────────────────────────────────────────────
CREATE TABLE public.cat_hitos_narrativos (
  clave        text PRIMARY KEY,
  descripcion  text NOT NULL,
  activo       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cat_hitos_narrativos IS
  'S91: claves de MOTOR de los hitos narrativos (evento_hito_narrativo.clave). La clave no es la voz: la voz vive en i18n de la pantalla y la firma el founder por gate. Catálogo y no CHECK por regla 21 + precedente S90 (CHECK→FK).';

ALTER TABLE public.cat_hitos_narrativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_hitos_narrativos_select_publica ON public.cat_hitos_narrativos
  FOR SELECT USING (true);

INSERT INTO public.cat_hitos_narrativos (clave, descripcion) VALUES
  ('vida_nueva_empieza',
   'El alta de una mascota individual. La voz de pantalla se firma en el gate del alta S91.'),
  ('mundo_nuevo_empieza',
   'El alta de un ACUARIO (cláusula del pez: el sujeto es el sistema). Tenor de referencia de mesa: «Un mundo nuevo empieza» — referencia, no letra; la voz se firma en el gate.');

-- ── La tabla tipada ─────────────────────────────────────────────────────────
CREATE TABLE public.evento_hito_narrativo (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id    uuid NOT NULL UNIQUE REFERENCES public.eventos_mascota(id) ON DELETE CASCADE,
  mascota_id   uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  clave        text NOT NULL REFERENCES public.cat_hitos_narrativos(clave) ON DELETE RESTRICT,
  contexto     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.evento_hito_narrativo IS
  'S91: detalle tipado del tipo hito_narrativo (el hito del alta «Una vida nueva empieza» y los que vengan). NACE SIN EMISOR a propósito — la emisión entra con el alta rediseñada y su voz firmada (anti-C8). Escribe solo el motor (DEFINER): no hay policy de INSERT.';

ALTER TABLE public.evento_hito_narrativo ENABLE ROW LEVEL SECURITY;

CREATE POLICY hito_narrativo_select ON public.evento_hito_narrativo
  FOR SELECT USING (user_tiene_acceso_a_mascota(mascota_id));

CREATE POLICY hito_narrativo_delete_admin ON public.evento_hito_narrativo
  FOR DELETE USING (is_admin());

-- ── Conectar el catálogo de tipos (el fantasma gana cuerpo) ─────────────────
UPDATE public.cat_tipos_evento
   SET tabla_tipada = 'evento_hito_narrativo', updated_at = now()
 WHERE codigo = 'hito_narrativo' AND tabla_tipada IS NULL;

-- ── Cinturones ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_problemas int;
  v_tipada    text;
BEGIN
  SELECT tabla_tipada INTO v_tipada
    FROM cat_tipos_evento WHERE codigo = 'hito_narrativo';
  IF v_tipada IS DISTINCT FROM 'evento_hito_narrativo' THEN
    RAISE EXCEPTION 'cinturon_hito: cat_tipos_evento.hito_narrativo.tabla_tipada = % (esperaba evento_hito_narrativo)', coalesce(v_tipada, 'NULL');
  END IF;

  -- El checker de S67 corre en toda migración que toque el catálogo (ley).
  SELECT count(*) INTO v_problemas FROM verificar_coherencia_tablas_tipadas();
  IF v_problemas <> 0 THEN
    RAISE EXCEPTION 'cinturon_hito: verificar_coherencia_tablas_tipadas() devolvio % problemas', v_problemas;
  END IF;

  -- Nace vacía y sin puerta: cero filas.
  IF (SELECT count(*) FROM evento_hito_narrativo) <> 0 THEN
    RAISE EXCEPTION 'cinturon_hito: la tabla debia nacer vacia';
  END IF;

  -- Sin policy de INSERT (escritura = solo DEFINER; si alguien la agrega
  -- después, que sea con letra).
  IF EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.evento_hito_narrativo'::regclass AND polcmd = 'a'
  ) THEN
    RAISE EXCEPTION 'cinturon_hito: aparecio una policy de INSERT que esta migracion no escribio';
  END IF;
END $$;

COMMIT;
