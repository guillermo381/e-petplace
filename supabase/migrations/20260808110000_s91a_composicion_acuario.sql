-- ════════════════════════════════════════════════════════════════════════════
-- S91-A · LA COMPOSICIÓN DEL ACUARIO — EL CENSO POR ESPECIE
-- Enmienda FIRMADA del founder a D-685, y es una enmienda que SIMPLIFICA:
--
--   «el acuario declara su composición como CENSO POR ESPECIE — cuántos peces
--    de cada especie/variedad hay ("5 neones, 3 corydoras"). NO nacen peces
--    individuales: ni identidad ligera, ni nombre, ni fila propia. Todo lo
--    contratable/comprable/clínico sigue siendo DEL SISTEMA, jamás de un pez.»
--
-- ── POR QUÉ ESTO ES MÁS BARATO Y MÁS VERDADERO QUE LA «IDENTIDAD LIGERA» ────
-- La letra anterior de D-685 hablaba de los peces como MIEMBROS con identidad
-- ligera, y ya tenía dos trampas nombradas que nadie sabía cómo resolver: una
-- «identidad ligera» que no fuera fila de `mascotas` no tenía forma, y **un pez
-- que muere no podía usar `estado_vida`** porque ese campo es del acuario. El
-- censo por especie hace desaparecer las dos preguntas en vez de contestarlas:
-- si un neón muere, el censo baja de 5 a 4 y no hay ningún registro de vida que
-- cerrar. *La enmienda no recorta el alcance: elimina un problema.*
--
-- ── LA FORMA: APPEND-ONLY, «estilo evento» ─────────────────────────────────
-- Cada fila es UNA DECLARACIÓN del dueño con su fecha; el censo VIGENTE se
-- deriva de la última por especie (`DISTINCT ON`). Es la historia más barata
-- que existe —una tabla, cero triggers de espejo, cero snapshot que sincronizar—
-- y responde la pregunta que un servicio de acuarios va a hacer: *cuándo cambió
-- la población*, no solo cuánta hay hoy. `cantidad = 0` es cómo una especie SALE
-- del censo sin borrar que alguna vez estuvo.
--
-- ── VEDA 76(g): NO RIGE ────────────────────────────────────────────────────
-- DDL puro + una función nueva y un lector nuevo. **Cero backfill, cero
-- reescritura de datos vivos, cero cambio de firma de función existente** ⇒
-- ningún bundle vivo puede quedar atrás (D-662): esto es todo aditivo y nadie
-- lo consulta todavía. No se abre ventana de veda.
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- `docs/relevamientos/2026-08-08-s91a-REVERSA-composicion-acuario.sql`, escrita
-- ANTES de aplicar, **con su nota de datos**: un DROP se lleva la historia de la
-- composición y no hay de dónde reconstruirla.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── ① LA TABLA ──────────────────────────────────────────────────────────────
CREATE TABLE public.acuario_composicion (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id     uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,

  -- LA ESPECIE, por una de dos vías y NUNCA por las dos (XOR).
  --
  -- ⚠️ ADAPTACIÓN DECLARADA a la letra firmada: la letra dice «especie/raza del
  -- catálogo vivo», y el catálogo tiene HOY 10 razas de pez. Un acuario con una
  -- especie que no está en las 10 no podría declarar nada, y el dueño elegiría
  -- una equivocada para poder seguir — que es peor que un texto libre. Así que
  -- `raza_slug` es la vía del catálogo (con su cara, que es el punto de la
  -- letra) y `nombre_libre` es la salida honesta. **Es la misma ley S59 que ya
  -- rige la raza de la mascota: el catálogo SUGIERE, el dueño CONFIRMA.**
  raza_slug      text NULL,
  nombre_libre   text NULL,

  -- ⚠️ ESTA COLUMNA EXISTE POR UNA RAZÓN MEDIDA, no por simetría: la PK de
  -- `cat_razas` es COMPUESTA `(especie, slug)` y **`slug` solo NO es único** —
  -- un `FOREIGN KEY (raza_slug) REFERENCES cat_razas(slug)` no se puede crear.
  -- (Y no es un tecnicismo: 'mestizo' puede existir para perro y para gato.)
  -- Fijarla en 'pez' con CHECK es lo que hace que el FK compuesto sea posible
  -- Y que un acuario no pueda censar razas de perro.
  especie_catalogo text NOT NULL DEFAULT 'pez',

  cantidad       integer NOT NULL,
  declarado_en   timestamptz NOT NULL DEFAULT now(),
  declarado_por  uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT acuario_composicion_especie_catalogo_solo_pez CHECK (especie_catalogo = 'pez'),
  CONSTRAINT acuario_composicion_raza_fk
    FOREIGN KEY (especie_catalogo, raza_slug) REFERENCES public.cat_razas(especie, slug),

  CONSTRAINT acuario_composicion_especie_xor CHECK (
    (raza_slug IS NOT NULL AND nombre_libre IS NULL) OR
    (raza_slug IS NULL     AND nombre_libre IS NOT NULL)
  ),
  -- El cinturón que la letra pide con nombre: cantidades ≥ 0.
  CONSTRAINT acuario_composicion_cantidad_no_negativa CHECK (cantidad >= 0),
  CONSTRAINT acuario_composicion_libre_no_vacio CHECK (
    nombre_libre IS NULL OR btrim(nombre_libre) <> ''
  )
);

CREATE INDEX acuario_composicion_vigente_idx
  ON public.acuario_composicion (mascota_id, raza_slug, nombre_libre, declarado_en DESC);

COMMENT ON TABLE public.acuario_composicion IS
  'S91: EL CENSO POR ESPECIE del acuario (enmienda firmada a D-685). APPEND-ONLY: cada fila es una declaración del dueño y el censo vigente se DERIVA de la última por especie. LA LEY QUE GOBIERNA: los peces NO son entidades — no hay identidad, ni nombre, ni fila por pez, y NADA contratable/comprable/clínico cuelga de acá. Todo eso es del SISTEMA (la fila de `mascotas` con sujeto=acuario). Si esta tabla alguna vez aparece referenciada por una FK, el acuario volvió a ser contratable pez por pez y la letra se rompió — el cinturón de esta migración lo verifica.';

COMMENT ON COLUMN public.acuario_composicion.cantidad IS
  'Cantidad VIGENTE declarada para esa especie. 0 es legal y significativo: es cómo una especie SALE del censo sin borrar que estuvo (un neón que muere baja el número; no hay registro de vida que cerrar — ahí murió la trampa del estado_vida de D-685).';

-- Sin GRANT a propósito: la PUERTA ÚNICA son las dos funciones de abajo.
-- PostgREST no puede leer ni escribir esta tabla, así que el gate de familia y
-- la derivación del censo no se pueden esquivar desde el cliente.
REVOKE ALL ON TABLE public.acuario_composicion FROM PUBLIC, anon, authenticated;
ALTER TABLE public.acuario_composicion ENABLE ROW LEVEL SECURITY;

-- ── ② EL CINTURÓN DE SUJETO: un perro jamás tiene composición ───────────────
-- Va en TRIGGER y no en CHECK porque el dato vive en otra tabla.
CREATE FUNCTION public._acuario_composicion_solo_acuario()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_suj text;
BEGIN
  SELECT sujeto INTO v_suj FROM mascotas WHERE id = NEW.mascota_id;
  IF v_suj IS DISTINCT FROM 'acuario' THEN
    RAISE EXCEPTION 'composicion_solo_acuario';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_acuario_composicion_solo_acuario
  BEFORE INSERT OR UPDATE ON public.acuario_composicion
  FOR EACH ROW EXECUTE FUNCTION public._acuario_composicion_solo_acuario();

REVOKE ALL ON FUNCTION public._acuario_composicion_solo_acuario() FROM PUBLIC, anon;

-- ── ③ LA PUERTA: declarar / ajustar ─────────────────────────────────────────
CREATE FUNCTION public.declarar_composicion_acuario(
  p_mascota_id  uuid,
  p_cantidad    integer,
  p_raza_slug   text DEFAULT NULL,
  p_nombre_libre text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid    uuid := auth.uid();
  v_slug   text := nullif(btrim(coalesce(p_raza_slug, '')), '');
  v_libre  text := nullif(btrim(coalesce(p_nombre_libre, '')), '');
  v_suj    text;
  v_previa integer;
  v_id     uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_autenticado';
  END IF;

  -- Gate de FAMILIA, no de acceso amplio: el censo es identidad del acuario, y
  -- un prestador con acceso clínico lo LEE (ver el lector) pero no lo escribe.
  -- Misma frontera que `actualizar_raza_mascota` y las dos RPCs del alta.
  SELECT m.sujeto INTO v_suj
    FROM mascotas m
    JOIN familia_miembro fm ON fm.familia_id = m.familia_id
   WHERE m.id = p_mascota_id
     AND fm.user_id = v_uid
     AND fm.hasta IS NULL
     AND fm.rol IN ('adulto_titular', 'adulto_autorizado')
   LIMIT 1;

  IF v_suj IS NULL THEN
    RAISE EXCEPTION 'sin_acceso';
  END IF;
  IF v_suj <> 'acuario' THEN
    RAISE EXCEPTION 'composicion_solo_acuario';
  END IF;

  IF p_cantidad IS NULL OR p_cantidad < 0 THEN
    RAISE EXCEPTION 'cantidad_invalida';
  END IF;

  IF v_slug IS NULL AND v_libre IS NULL THEN
    RAISE EXCEPTION 'especie_no_declarada';
  END IF;
  IF v_slug IS NOT NULL AND v_libre IS NOT NULL THEN
    RAISE EXCEPTION 'especie_ambigua';
  END IF;

  IF v_slug IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM cat_razas
     WHERE especie = 'pez' AND slug = v_slug AND activo
  ) THEN
    RAISE EXCEPTION 'especie_desconocida';
  END IF;

  -- IDEMPOTENCIA HONESTA: declarar dos veces lo mismo no ensucia la historia
  -- con una fila que no cuenta nada. Un censo que registra «sigue habiendo 5»
  -- cada vez que alguien abre la pantalla vuelve su propia historia ilegible.
  SELECT cantidad INTO v_previa
    FROM acuario_composicion
   WHERE mascota_id = p_mascota_id
     AND raza_slug IS NOT DISTINCT FROM v_slug
     AND nombre_libre IS NOT DISTINCT FROM v_libre
   ORDER BY declarado_en DESC, id DESC
   LIMIT 1;

  IF v_previa IS NOT NULL AND v_previa = p_cantidad THEN
    RETURN jsonb_build_object('ok', true, 'sin_cambio', true, 'cantidad', p_cantidad);
  END IF;

  INSERT INTO acuario_composicion (mascota_id, raza_slug, nombre_libre, cantidad, declarado_por)
  VALUES (p_mascota_id, v_slug, v_libre, p_cantidad, v_uid)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'sin_cambio', false,
    'id', v_id,
    'cantidad', p_cantidad,
    'cantidad_previa', v_previa,
    'total_habitantes', (
      SELECT coalesce(sum(c.cantidad), 0)
        FROM (
          SELECT DISTINCT ON (raza_slug, nombre_libre) cantidad
            FROM acuario_composicion
           WHERE mascota_id = p_mascota_id
           ORDER BY raza_slug, nombre_libre, declarado_en DESC, id DESC
        ) c
    )
  );
END;
$function$;

COMMENT ON FUNCTION public.declarar_composicion_acuario(uuid, integer, text, text) IS
  'S91: LA PUERTA ÚNICA del censo del acuario (enmienda firmada a D-685). Append-only: cada llamada con una cantidad NUEVA agrega una declaración con su fecha; repetir la misma cantidad devuelve sin_cambio y NO escribe — un censo que registra «sigue habiendo 5» cada vez que se abre la pantalla vuelve su propia historia ilegible. Gate de FAMILIA (el prestador lee, no escribe la identidad). Rebota tipado: no_autenticado · sin_acceso · composicion_solo_acuario · cantidad_invalida · especie_no_declarada · especie_ambigua · especie_desconocida.';

REVOKE ALL ON FUNCTION public.declarar_composicion_acuario(uuid, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarar_composicion_acuario(uuid, integer, text, text) TO authenticated;

-- ── ④ EL LECTOR DEL PERFIL ──────────────────────────────────────────────────
CREATE FUNCTION public.obtener_composicion_acuario(p_mascota_id uuid)
 RETURNS TABLE (
   raza_slug    text,
   nombre       text,
   ruta_imagen  text,
   es_del_catalogo boolean,
   cantidad     integer,
   declarado_en timestamptz
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_autenticado';
  END IF;

  -- Acceso AMPLIO a propósito, y es la asimetría del motor: escribir el censo
  -- es de la familia, LEERLO lo puede hacer quien atiende al acuario — cuántos
  -- peces y de qué especie es exactamente el dato clínico del sistema.
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'sin_acceso';
  END IF;

  RETURN QUERY
  WITH vigente AS (
    SELECT DISTINCT ON (ac.raza_slug, ac.nombre_libre)
           ac.raza_slug, ac.nombre_libre, ac.cantidad, ac.declarado_en
      FROM acuario_composicion ac
     WHERE ac.mascota_id = p_mascota_id
     ORDER BY ac.raza_slug, ac.nombre_libre, ac.declarado_en DESC, ac.id DESC
  )
  SELECT v.raza_slug,
         coalesce(cr.nombre, v.nombre_libre)  AS nombre,
         cr.ruta_imagen,
         (v.raza_slug IS NOT NULL)            AS es_del_catalogo,
         v.cantidad,
         v.declarado_en
    FROM vigente v
    LEFT JOIN cat_razas cr ON cr.especie = 'pez' AND cr.slug = v.raza_slug
   -- El censo muestra lo que HAY. Lo que llegó a 0 vive en la historia, no en
   -- la vitrina del perfil: «0 neones» no es un habitante, es una ausencia.
   WHERE v.cantidad > 0
   ORDER BY v.cantidad DESC, 2;
END;
$function$;

COMMENT ON FUNCTION public.obtener_composicion_acuario(uuid) IS
  'S91: el censo VIGENTE del acuario para el perfil (enmienda firmada a D-685). Deriva la última declaración por especie y OMITE las que llegaron a 0 — lo que ya no está vive en la historia, no en la vitrina. Trae la cara de `cat_razas` cuando la especie es del catálogo y `es_del_catalogo=false` cuando el dueño la escribió libre, para que la superficie sepa si puede dibujar imagen. Acceso AMPLIO (user_tiene_acceso_a_mascota): escribir el censo es de la familia, leerlo lo puede hacer quien atiende al acuario.';

REVOKE ALL ON FUNCTION public.obtener_composicion_acuario(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_composicion_acuario(uuid) TO authenticated;

-- ── ⑤ CINTURONES DE LA MIGRACIÓN (in-txn: si algo falla, nada queda) ────────
DO $$
DECLARE n integer;
BEGIN
  -- (a) LA LEY MADRE: nadie referencia el censo. Si mañana una cita, un
  --     presupuesto o una atención le pone una FK, el acuario volvió a ser
  --     contratable pez por pez — que es exactamente lo que la letra prohíbe.
  SELECT count(*) INTO n
    FROM pg_constraint
   WHERE contype = 'f' AND confrelid = 'public.acuario_composicion'::regclass;
  IF n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: % FK(s) apuntan al censo — el acuario volvió a ser contratable pez por pez', n;
  END IF;

  -- (b) los dos cinturones que la letra nombró
  SELECT count(*) INTO n FROM pg_constraint
   WHERE conrelid='public.acuario_composicion'::regclass
     AND conname='acuario_composicion_cantidad_no_negativa';
  IF n <> 1 THEN RAISE EXCEPTION 'CINTURON: falta el CHECK de cantidad >= 0'; END IF;

  SELECT count(*) INTO n FROM pg_trigger
   WHERE tgrelid='public.acuario_composicion'::regclass
     AND tgname='trg_acuario_composicion_solo_acuario' AND NOT tgisinternal;
  IF n <> 1 THEN RAISE EXCEPTION 'CINTURON: falta el trigger de sujeto=acuario'; END IF;

  -- (c) L-140 sobre la definición VIVA (no sobre lo que esta migración cree
  --     haber escrito): cero anon en las tres funciones nuevas.
  SELECT count(*) INTO n
    FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
   WHERE ns.nspname='public'
     AND p.proname IN ('declarar_composicion_acuario','obtener_composicion_acuario','_acuario_composicion_solo_acuario')
     AND array_to_string(p.proacl, ',') LIKE '%anon=%';
  IF n <> 0 THEN RAISE EXCEPTION 'CINTURON L-140: % función(es) nuevas con anon en proacl', n; END IF;

  -- (d) la tabla no es legible por PostgREST: la puerta es la RPC
  IF has_table_privilege('authenticated', 'public.acuario_composicion', 'SELECT') THEN
    RAISE EXCEPTION 'CINTURON: authenticated puede SELECT la tabla — la puerta única se esquiva';
  END IF;
END $$;

COMMIT;
