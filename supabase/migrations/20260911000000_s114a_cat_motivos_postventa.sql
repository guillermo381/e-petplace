-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · TANDA 0 · `cat_motivos_postventa` — el catálogo de §4 de LETRA_POSTVENTA
--
-- CATÁLOGO PURO: no toca un solo objeto vivo. Ni citas, ni estadías, ni
-- pedidos, ni pagos. Nace vacío de consumidores y por eso puede entrar antes
-- que todo lo demás.
--
-- LA LEY QUE ESTA TABLA HACE EXIGIBLE (§4, verbatim):
--   «La clase jamás la elige una pantalla ni un modelo: viaja en la fila.»
-- Por eso `clase` es NOT NULL con CHECK, y por eso el motivo es la fuente —
-- no un parámetro que la superficie manda.
--
-- VEDA 76(g): NO RIGE. DDL aditiva + seed de catálogo; cero backfill, cero
-- anclas, cero filas de otra tabla tocadas.
-- REVERSA: `docs/relevamientos/S114-A-REVERSA-20260911000000-cat-motivos-postventa.sql`
--          (escrita ANTES de aplicar).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.cat_motivos_postventa (
  codigo      text    NOT NULL,
  objeto      text    NOT NULL,
  clase       int     NOT NULL,
  urgente     boolean NOT NULL DEFAULT false,
  voz         text    NOT NULL,
  pide_foto   boolean NOT NULL DEFAULT false,
  activo      boolean NOT NULL DEFAULT true,

  -- 🔴 LA CLAVE ES EL PAR, NO EL CÓDIGO.
  -- `cobro` existe para `cita` y para `pedido` en §4, y son dos motivos
  -- distintos con la misma palabra. Una PK sobre `codigo` solo habría hecho
  -- imposible depositar la letra tal como está firmada — y el que la
  -- depositara habría tenido que elegir cuál de los dos borrar.
  CONSTRAINT cat_motivos_postventa_pkey PRIMARY KEY (codigo, objeto),

  CONSTRAINT chk_motivo_objeto CHECK (objeto IN ('cita','estadia','pedido','todos')),
  CONSTRAINT chk_motivo_clase  CHECK (clase IN (1,2,3)),

  -- La clase 3 y `urgente` son la MISMA cosa dicha dos veces (§5: «clase 3 ·
  -- urgente (la mascota) · disparo: motivo `urgente`»). Se amarran para que
  -- no puedan divergir: un motivo urgente que no sea clase 3 —o al revés—
  -- mandaría a la casa un caso con el reloj de otra clase.
  CONSTRAINT chk_motivo_urgente_es_clase3 CHECK (urgente = (clase = 3)),

  CONSTRAINT chk_motivo_voz_no_vacia CHECK (btrim(voz) <> '')
);

COMMENT ON TABLE public.cat_motivos_postventa IS
  'S114 · §4 de LETRA_POSTVENTA. El motivo TRAE la clase: ninguna pantalla y '
  'ningún modelo la eligen. Clave (codigo, objeto) porque `cobro` existe para '
  'cita y para pedido. ⚠️ §4 dice que estadía «hereda las de cita»: esa herencia '
  'NO está duplicada como filas acá —duplicarlas inventaría motivos que la letra '
  'no lista— y la resuelve el LECTOR de motivos, no el catálogo.';

COMMENT ON COLUMN public.cat_motivos_postventa.clase IS
  '1 = falla del prestador (la resuelve el motor) · 2 = ejecutó y salió distinto '
  '(24 h al prestador) · 3 = urgente, la mascota (la casa, sin plazo).';

COMMENT ON COLUMN public.cat_motivos_postventa.pide_foto IS
  'S114-A · DECISIÓN DE LA PISTA, no de la letra: §4 lista la columna y no dice '
  'qué fila la lleva. Regla aplicada, escrita acá para que sea auditable y '
  'volteable con un UPDATE: pide foto el motivo que afirma un ESTADO FÍSICO que '
  'una foto muestra. Por eso `mascota_extraviada` NO la pide —no se fotografía '
  'una ausencia— y ese caso es el control de que la regla no es «clase 3 = foto».';

-- ── LAS 19 FILAS DE §4, EN SU ORDEN Y CON SU VOZ VERBATIM ──────────────────
-- La voz va en TUTEO NEUTRO, copiada de la tabla firmada sin retocar una coma.

INSERT INTO public.cat_motivos_postventa (codigo, objeto, clase, urgente, voz, pide_foto) VALUES
  -- CITA
  ('no_ejecutado',          'cita',   1, false, 'No vino / no me atendieron',              false),
  ('cancelado_prestador',   'cita',   1, false, 'Lo canceló el prestador',                 false),
  ('no_show_disputado',     'cita',   2, false, 'Me cobraron una ausencia que no fue',     false),
  ('calidad',               'cita',   2, false, 'El servicio no fue como esperaba',        false),
  ('duracion',              'cita',   2, false, 'Duró menos de lo que pagué',              false),
  ('trato',                 'cita',   2, false, 'El trato con mi mascota no estuvo bien',  false),
  ('cobro',                 'cita',   2, false, 'Me cobraron distinto de lo que decía',    false),
  ('mascota_afectada',      'cita',   3, true,  'Mi mascota volvió lastimada o enferma',   true),
  ('mascota_extraviada',    'cita',   3, true,  'Mi mascota se perdió durante el servicio', false),
  -- ESTADÍA (las propias; la herencia de cita la resuelve el lector)
  ('no_recogida_prestador', 'estadia', 1, false, 'No pasaron a buscarlo',                  false),
  ('devolucion_tarde',      'estadia', 2, false, 'Lo devolvieron fuera de hora',           false),
  -- PEDIDO
  ('no_entregado',          'pedido', 1, false, 'No llegó',                                false),
  ('cancelado_vendedor',    'pedido', 1, false, 'Lo canceló el vendedor',                  false),
  ('incompleto',            'pedido', 2, false, 'Faltaron cosas',                          true),
  ('producto_distinto',     'pedido', 2, false, 'Llegó algo distinto',                     true),
  ('producto_danado',       'pedido', 2, false, 'Llegó dañado',                            true),
  ('cobro',                 'pedido', 2, false, 'Me cobraron distinto',                    false),
  ('producto_en_mal_estado','pedido', 3, true,  'Mi mascota comió algo en mal estado',     true),
  -- TODOS · §4: «Sin "Otro". El último invita a contar.»
  ('otra_cosa',             'todos',  2, false, 'Es otra cosa · contame',                  false);

-- ── PERMISOS ───────────────────────────────────────────────────────────────
-- Es catálogo público de lectura: las dos apps lo leen para dibujar la lista.
-- La ESCRITURA no se concede a nadie — ni siquiera a `authenticated` —, que es
-- el candado de F5 aplicado desde el nacimiento y no agregado después.
ALTER TABLE public.cat_motivos_postventa ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_motivos_postventa_lee_autenticado
  ON public.cat_motivos_postventa FOR SELECT TO authenticated USING (activo);

REVOKE ALL ON public.cat_motivos_postventa FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.cat_motivos_postventa TO authenticated;

-- ── CINTURÓN, CONTRA EL OBJETO Y DENTRO DE LA MISMA TRANSACCIÓN ────────────
-- No mide el archivo: mide lo que quedó en el catálogo.
DO $cinturon$
DECLARE
  v_filas int; v_c3 int; v_urg int; v_cobros int; v_escritura boolean;
BEGIN
  SELECT count(*) INTO v_filas FROM public.cat_motivos_postventa;
  IF v_filas <> 19 THEN
    RAISE EXCEPTION 'CINTURÓN: se esperaban 19 motivos de §4, hay %', v_filas;
  END IF;

  -- clase 3 ⟺ urgente, medido y no supuesto
  SELECT count(*) INTO v_c3  FROM public.cat_motivos_postventa WHERE clase = 3;
  SELECT count(*) INTO v_urg FROM public.cat_motivos_postventa WHERE urgente;
  IF v_c3 <> 3 OR v_urg <> 3 THEN
    RAISE EXCEPTION 'CINTURÓN: clase 3 = % y urgentes = %, deben ser 3 y 3', v_c3, v_urg;
  END IF;

  -- el par (codigo, objeto) sostiene los dos `cobro`
  SELECT count(*) INTO v_cobros FROM public.cat_motivos_postventa WHERE codigo = 'cobro';
  IF v_cobros <> 2 THEN
    RAISE EXCEPTION 'CINTURÓN: `cobro` debe existir 2 veces (cita y pedido), hay %', v_cobros;
  END IF;

  -- CONTROL POSITIVO DEL CANDADO: se prueba que la escritura está cerrada
  -- preguntándole al catálogo de permisos, no confiando en el REVOKE de arriba.
  SELECT has_table_privilege('authenticated','public.cat_motivos_postventa','INSERT')
    INTO v_escritura;
  IF v_escritura THEN
    RAISE EXCEPTION 'CINTURÓN: `authenticated` puede INSERT — el candado F5 no cerró';
  END IF;

  -- Y su contra-caso: si el SELECT tampoco estuviera, el catálogo sería
  -- ilegible y las apps no podrían dibujar la lista. Un candado que cierra
  -- de más se ve igual que uno que funciona hasta que alguien abre la app.
  IF NOT has_table_privilege('authenticated','public.cat_motivos_postventa','SELECT') THEN
    RAISE EXCEPTION 'CINTURÓN: `authenticated` no puede leer el catálogo';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · 19 motivos · 3 clase-3 = 3 urgentes · 2 cobros · escritura cerrada · lectura abierta';
END $cinturon$;
