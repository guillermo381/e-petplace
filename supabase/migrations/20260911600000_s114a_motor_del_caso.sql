-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · A3 · EL MOTOR DEL CASO — el objeto, el hilo y su máquina de estados
--
-- Contrato: `LETRA_POSTVENTA` §§1-6 (firmada) + el pedido de C
-- (`S114-C-PEDIDO-A-A-EL-MOTOR-DEL-CASO.md`, wrapper por wrapper).
-- Desbloquea C3-C8, los asientos que E no puede medir y las dos edges de D.
--
-- VEDA 76(g): NO RIGE — DDL aditiva + seeds de catálogo; cero backfill.
-- REVERSA: `docs/relevamientos/S114-A-REVERSA-20260911600000-motor-del-caso.sql`
--          (escrita ANTES, y **manda PARAR si ya hay casos**: un caso es la
--           constancia del reclamo de una familia, no estado de una app).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── LA VENTANA, UNA SOLA VEZ ───────────────────────────────────────────────
-- C pidió computarla en la app y dijo por qué: «si el corte vive en dos lados,
-- un día divergen». Tiene razón en el riesgo y la conclusión es la contraria:
-- **el motor TIENE que exigirla** —un guard que vive sólo en la pantalla no es
-- un guard, y éste decide si una familia puede reclamar plata—. La divergencia
-- se cierra publicando el número en vez de escribirlo dos veces: C lo LEE de acá.
CREATE OR REPLACE FUNCTION public.caso_ventana_dias()
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public','pg_temp'
AS $fn$ SELECT 7 $fn$;   -- §5 · F7

COMMENT ON FUNCTION public.caso_ventana_dias() IS
  'S114 · §5 F7 · Los días para abrir un caso desde el cierre. Existe para que '
  'el motor y la app usen EL MISMO número: la app lo lee, no lo escribe.';
REVOKE ALL ON FUNCTION public.caso_ventana_dias() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.caso_ventana_dias() TO authenticated;

-- ── LOS ESTADOS, COMO DATO ─────────────────────────────────────────────────
CREATE TABLE public.cat_estados_caso (
  etapa       text PRIMARY KEY,
  orden       integer NOT NULL,
  es_final    boolean NOT NULL DEFAULT false,
  -- Un final ALTERNO no es una etapa de la escalera: §3.1 dice que reemplaza
  -- la línea de abajo con una etiqueta. La escalera de C dibuja `en_escalera`.
  en_escalera boolean NOT NULL DEFAULT true
);

INSERT INTO public.cat_estados_caso (etapa, orden, es_final, en_escalera) VALUES
  ('recibido',              1, false, true),
  ('con_prestador',         2, false, true),
  ('con_casa',              3, false, true),
  ('resuelto',              4, true,  true),
  ('cerrado',               5, true,  true),
  ('resuelto_entre_partes', 6, true,  false),
  ('retirado',              7, true,  false),
  ('sin_lugar',             8, true,  false);

-- ── LAS TRANSICIONES, COMO DATO ────────────────────────────────────────────
CREATE TABLE public.cat_transiciones_caso (
  desde         text NOT NULL REFERENCES public.cat_estados_caso(etapa),
  hasta         text NOT NULL REFERENCES public.cat_estados_caso(etapa),
  actor         text NOT NULL,
  exige_motivo  boolean NOT NULL DEFAULT false,
  activo        boolean NOT NULL DEFAULT true,
  PRIMARY KEY (desde, hasta, actor),
  -- 🔴 `sistema` DECLARADO VÁLIDO ACÁ **Y ACEPTADO POR LA PUERTA** (§5).
  -- La lección del callejón de S105: `cat_transiciones_pedido` declaraba
  -- `sistema` como actor válido y `_mover_estado_pedido` no lo aceptaba —
  -- un callejón que se descubrió con plata devuelta de por medio. Acá el
  -- CHECK y el guard de `_caso_mover` nombran la MISMA lista.
  CONSTRAINT chk_transicion_actor CHECK (actor IN ('familia','prestador','casa','sistema'))
);

INSERT INTO public.cat_transiciones_caso (desde, hasta, actor, exige_motivo) VALUES
  -- clase 1: el motor resuelve solo, sin pasar por el prestador (§5)
  ('recibido','resuelto','sistema', false),
  -- clase 2: 24 h al prestador
  ('recibido','con_prestador','sistema', false),
  ('con_prestador','resuelto_entre_partes','prestador', false),
  ('con_prestador','con_casa','prestador', false),      -- «pedir a e-PetPlace»
  ('con_prestador','con_casa','familia',   false),      -- la familia también puede
  ('con_prestador','con_casa','sistema',   false),      -- venció el plazo
  ('con_prestador','retirado','familia',   false),
  -- clase 3 y escalada: la casa
  ('recibido','con_casa','sistema', false),
  ('recibido','retirado','familia', false),
  ('con_casa','resuelto','casa',    false),
  ('con_casa','sin_lugar','casa',   true),              -- §6 de la dirección: con su motivo
  ('con_casa','retirado','familia', false),
  -- el cierre
  ('resuelto','cerrado','sistema', false),
  ('resuelto','cerrado','familia', false),
  ('resuelto_entre_partes','cerrado','sistema', false),
  ('sin_lugar','cerrado','sistema', false),
  ('retirado','cerrado','sistema', false);

ALTER TABLE public.cat_estados_caso      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_transiciones_caso ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_estados_caso_lee      ON public.cat_estados_caso      FOR SELECT TO authenticated USING (true);
CREATE POLICY cat_transiciones_caso_lee ON public.cat_transiciones_caso FOR SELECT TO authenticated USING (activo);
REVOKE ALL ON public.cat_estados_caso, public.cat_transiciones_caso FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.cat_estados_caso, public.cat_transiciones_caso TO authenticated;

-- ── EL CASO ────────────────────────────────────────────────────────────────
CREATE TABLE public.casos_postventa (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- EL OBJETO, polimórfico. §1: «el caso nace del OBJETO y muere con él».
  objeto_tipo   text NOT NULL,
  objeto_id     uuid NOT NULL,

  -- EL MOTIVO Y SU CLASE. §4: «la clase viaja en la fila», y por eso se copia
  -- del catálogo al abrir en vez de leerse después: si mañana el founder
  -- reclasifica un motivo, los casos ya abiertos conservan la clase con la que
  -- se les prometió un plazo. *Un plazo que cambia solo es un plazo incumplido.*
  motivo_codigo text NOT NULL,
  clase         integer NOT NULL,

  -- LOS TRES ASIENTOS (§9 · F5)
  familia_user_id uuid NOT NULL REFERENCES auth.users(id),
  prestador_id    uuid REFERENCES public.prestadores(id),
  cuenta_comercial_id uuid REFERENCES public.cuentas_comerciales(id),

  etapa         text NOT NULL DEFAULT 'recibido' REFERENCES public.cat_estados_caso(etapa),

  -- EL PLAZO. §5: 24 h al prestador en clase 2. NULL en clase 1 y 3 —«sin
  -- plazo, es ahora»— y ese NULL es información, no un hueco.
  plazo_prestador_hasta timestamptz,

  -- LO QUE CONTÓ LA FAMILIA, y de dónde salió (§11)
  relato            text,
  resumen_confirmado text,
  procedencia       text NOT NULL DEFAULT 'familia',
  modo              text,
  confirmado_por    uuid REFERENCES auth.users(id),
  foto_url          text,

  -- 🔴 EL CAMINO DE LA PLATA, REGISTRADO (§6). No se deduce después: se
  -- escribe cuando se recorre. `camino` dice POR CUÁL de los dos salió y
  -- `evento_reembolso_id` ata el asiento contable cuando hubo devengo.
  resolucion_alcance   text,        -- total | parcial | sin_devolucion
  monto_devuelto       numeric(10,2),
  camino               text,        -- aplicar_reembolso | declarado_sobre_pago
  evento_reembolso_id  uuid REFERENCES public.eventos_economicos(id),
  destino              text,        -- banco | saldo
  destino_estado       text,        -- aplicado | en_camino_manual
  estado_final         text,
  decidido_por         uuid REFERENCES auth.users(id),
  resuelto_en          timestamptz,
  cerrado_en           timestamptz,

  creado_en     timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_caso_objeto      CHECK (objeto_tipo IN ('cita','estadia','pedido')),
  CONSTRAINT chk_caso_clase       CHECK (clase IN (1,2,3)),
  CONSTRAINT chk_caso_procedencia CHECK (procedencia IN ('familia','ia_intake')),
  CONSTRAINT chk_caso_modo        CHECK (modo IS NULL OR modo IN ('texto','voz')),
  CONSTRAINT chk_caso_alcance     CHECK (resolucion_alcance IS NULL OR resolucion_alcance IN ('total','parcial','sin_devolucion')),
  CONSTRAINT chk_caso_camino      CHECK (camino IS NULL OR camino IN ('aplicar_reembolso','declarado_sobre_pago')),
  CONSTRAINT chk_caso_destino     CHECK (destino IS NULL OR destino IN ('banco','saldo')),
  CONSTRAINT chk_caso_destino_est CHECK (destino_estado IS NULL OR destino_estado IN ('aplicado','en_camino_manual')),

  -- §11: una salida de IA sin `confirmado_por` es una salida que nadie miró.
  -- Se vuelve INEXPRESABLE en vez de vigilarse con un gate.
  CONSTRAINT chk_caso_ia_confirmada
    CHECK (procedencia <> 'ia_intake' OR confirmado_por IS NOT NULL),

  -- 🔴 Un caso que devolvió plata TIENE que decir por cuál de los dos caminos
  -- salió (§6). Sin esto, «el caso registra por cuál salió» sería una promesa
  -- de la letra que nada sostiene.
  CONSTRAINT chk_caso_camino_si_hubo_plata
    CHECK (monto_devuelto IS NULL OR monto_devuelto = 0 OR camino IS NOT NULL),

  -- La resolución la toma alguien, y queda escrito quién (§6 de la dirección).
  CONSTRAINT chk_caso_decidido
    CHECK (resuelto_en IS NULL OR decidido_por IS NOT NULL OR clase = 1)
);

-- 🔴 UN SOLO CASO ABIERTO POR OBJETO. Es lo que hace posible el rebote
-- `caso_ya_abierto` que C pide con el id adentro (L-424: un guard que sólo
-- sabe negarse manda a reintentar algo que va a fallar siempre).
CREATE UNIQUE INDEX uq_caso_abierto_por_objeto
  ON public.casos_postventa (objeto_tipo, objeto_id)
  WHERE etapa NOT IN ('cerrado','retirado','sin_lugar','resuelto_entre_partes');

CREATE INDEX ix_casos_familia    ON public.casos_postventa (familia_user_id, creado_en DESC);
CREATE INDEX ix_casos_prestador  ON public.casos_postventa (prestador_id, creado_en DESC);
CREATE INDEX ix_casos_etapa      ON public.casos_postventa (etapa) WHERE etapa NOT IN ('cerrado');

COMMENT ON TABLE public.casos_postventa IS
  'S114 · El caso de postventa. Nace del OBJETO (§1) y su clase viaja en la fila '
  'del motivo, copiada al abrir para que reclasificar un motivo no le cambie el '
  'plazo a un caso ya prometido. El camino de la plata se REGISTRA (§6): con '
  'devengo va por aplicar_reembolso, sin devengo se declara sobre el pago, y la '
  'columna `camino` dice cuál — jamás se deduce por clase.';

-- ── EL HILO, TRES ASIENTOS ─────────────────────────────────────────────────
CREATE TABLE public.caso_mensajes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id    uuid NOT NULL REFERENCES public.casos_postventa(id) ON DELETE CASCADE,
  -- §3.3: tres asientos. `casa` es un asiento, no un usuario — puede escribir
  -- el sistema o una persona de la casa, y la superficie lo dibuja igual.
  autor      text NOT NULL,
  autor_user_id uuid REFERENCES auth.users(id),
  -- `hecho` son las etiquetas centradas del trámite (§3.3). Se distinguen del
  -- mensaje EN LA FILA y no por el texto: un hecho que hay que reconocer por
  -- su redacción es un hecho que se rompe al traducirlo.
  tipo       text NOT NULL DEFAULT 'mensaje',
  cuerpo     text NOT NULL,
  creado_en  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_msj_autor CHECK (autor IN ('familia','prestador','casa')),
  CONSTRAINT chk_msj_tipo  CHECK (tipo  IN ('mensaje','hecho')),
  CONSTRAINT chk_msj_cuerpo CHECK (btrim(cuerpo) <> '')
);

-- Cursor COMPUESTO (creado_en, id): C lo pidió citando el defecto exacto que
-- S99 midió en la línea de vida — con `creado_en` sola, dos mensajes del mismo
-- instante hacen que la página siguiente se saltee filas. 55 de 62.
CREATE INDEX ix_caso_mensajes_cursor ON public.caso_mensajes (caso_id, creado_en, id);

COMMENT ON TABLE public.caso_mensajes IS
  'S114 · §3.3 · El hilo del caso, TRES asientos (familia · prestador · casa). '
  '`tipo=hecho` son las etiquetas centradas del trámite, distinguidas en la FILA '
  'y no por su redacción. Índice de cursor COMPUESTO (creado_en, id): con la '
  'fecha sola, dos mensajes del mismo instante saltean filas al paginar (S99).';

-- ── RLS · LOS TRES ASIENTOS (§9 · F5) ──────────────────────────────────────
ALTER TABLE public.casos_postventa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caso_mensajes   ENABLE ROW LEVEL SECURITY;

-- La familia ve los suyos · el prestador los de SUS objetos · la casa todos.
CREATE POLICY caso_select_tres_asientos ON public.casos_postventa
  FOR SELECT TO authenticated USING (
    familia_user_id = auth.uid()
    OR (prestador_id IS NOT NULL AND public.es_mi_prestador(prestador_id))
    OR public.is_admin()
  );

CREATE POLICY caso_mensajes_select ON public.caso_mensajes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.casos_postventa c
             WHERE c.id = caso_mensajes.caso_id
               AND (c.familia_user_id = auth.uid()
                    OR (c.prestador_id IS NOT NULL AND public.es_mi_prestador(c.prestador_id))
                    OR public.is_admin()))
  );

-- 🔴 F5 · LA ESCRITURA ES SÓLO POR FUNCIÓN, y es permiso y no prosa.
-- «El admin no puede escapar aunque quiera»: sin INSERT/UPDATE/DELETE para
-- `authenticated`, la puerta única deja de ser una convención.
REVOKE ALL ON public.casos_postventa, public.caso_mensajes FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.casos_postventa, public.caso_mensajes TO authenticated;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE v int; v_actores text;
BEGIN
  SELECT count(*) INTO v FROM cat_estados_caso;
  IF v <> 8 THEN RAISE EXCEPTION 'CINTURÓN: % estados, esperaba 8', v; END IF;
  SELECT count(*) INTO v FROM cat_transiciones_caso;
  IF v < 17 THEN RAISE EXCEPTION 'CINTURÓN: % transiciones, esperaba >= 17', v; END IF;

  -- 🔴 `sistema` declarado válido Y CON TRANSICIONES REALES. Un actor que el
  -- CHECK admite y que no aparece en una sola fila es la mitad del callejón.
  SELECT string_agg(DISTINCT actor, ',' ORDER BY actor) INTO v_actores FROM cat_transiciones_caso;
  IF position('sistema' in v_actores) = 0 THEN
    RAISE EXCEPTION 'CINTURÓN: `sistema` no tiene ninguna transición — es el callejón de S105';
  END IF;

  -- La escritura tiene que estar cerrada para authenticated (F5)
  IF has_table_privilege('authenticated','public.casos_postventa','INSERT')
     OR has_table_privilege('authenticated','public.caso_mensajes','INSERT') THEN
    RAISE EXCEPTION 'CINTURÓN: authenticated puede escribir — F5 no cerró';
  END IF;
  -- Y la lectura ABIERTA: si se cierra de más, las tres pantallas quedan ciegas
  IF NOT has_table_privilege('authenticated','public.casos_postventa','SELECT') THEN
    RAISE EXCEPTION 'CINTURÓN: authenticated no puede leer los casos';
  END IF;

  IF public.caso_ventana_dias() <> 7 THEN
    RAISE EXCEPTION 'CINTURÓN: la ventana no es 7 días';
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · 8 estados · % transiciones · actores: % · escritura cerrada · lectura abierta · ventana 7d',
    (SELECT count(*) FROM cat_transiciones_caso), v_actores;
END $cinturon$;
