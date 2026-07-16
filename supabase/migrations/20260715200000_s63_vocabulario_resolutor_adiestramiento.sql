-- ═════════════════════════════════════════════════════════════════════
-- S63-A — CIERRE DE BLOQUE 2 DEL ADIESTRAMIENTO: vocabulario de
-- objetivos + resolutor QUIÉN/QUÉ (MODELO_ADIESTRAMIENTO v1.1 §5/§6/§11).
--
-- PIEZA 1 — El vocabulario (calco de cat_servicios_grooming, relevado
-- contra DB viva: codigo/nombre/descripcion/orden_display/activo/
-- pais_codigo/es_seed_preliminar/nombre_familia+_en de D-387):
--   · cat_objetivos_adiestramiento — los objetivos/comandos REGISTRABLES.
--     Comprable ≠ registrable rige (regla madre del grooming): el
--     objetivo JAMÁS se vende — es vocabulario del Durante.
--   · cat_curriculum_adiestramiento — la relación objetivo ↔ nivel ↔
--     sesión SUGERIDA (alimenta los chips del Durante, la progresión
--     narrativa §6 y el dato de los alcanzados; la superficie es B3).
--   · Semillas es_seed_preliminar=true EN LA FILA (patrón del catálogo
--     grooming): el adiestrador real (§10.3) valida el vocabulario
--     antes de ABRIR, no antes de construir. El currículum se siembra
--     solo para la escalera troncal (básico/medio/experto) — el
--     contenido de las ESPECIALIDADES lo declara el adiestrador sobre
--     el vocabulario (§1/§5), no la plataforma.
--
-- PIEZA 2 — El resolutor (gemela DELGADA de _grooming_ofertas_cobrables
-- + obtener_groomers_disponibles, S60/S61): SIN matriz de talla, SIN
-- extra de pelaje, SIN recargo — el precio del oficio varía por
-- sesión-suelta vs. programa, no por tamaño. La MODALIDAD resuelve con
-- el default único del chasis (el trazado 3-modalidades vs. atiende_*
-- es decisión diferida a S64 Bloque 0 — este resolutor no la bloquea).
-- El QUIÉN de un PROGRAMA se resuelve por la disponibilidad de la
-- PRIMERA sesión: las N−1 restantes las valida contratar_programa
-- atómico (si una no cabe, nada nace — migración 20260715180000).
-- ═════════════════════════════════════════════════════════════════════

-- ── 1. cat_objetivos_adiestramiento ───────────────────────────────────
CREATE TABLE public.cat_objetivos_adiestramiento (
  codigo             text PRIMARY KEY,
  nombre             text NOT NULL,
  descripcion        text,
  orden_display      integer NOT NULL DEFAULT 0,
  activo             boolean NOT NULL DEFAULT true,
  pais_codigo        text,
  es_seed_preliminar boolean NOT NULL DEFAULT true,
  nombre_familia     text NOT NULL,
  nombre_familia_en  text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cat_objetivos_adiestramiento IS
  'Vocabulario REGISTRABLE del adiestramiento (MODELO_ADIESTRAMIENTO §5): objetivos/comandos del Durante. Comprable ≠ registrable: JAMÁS se venden sueltos. es_seed_preliminar=true hasta la validación con adiestrador real (§10.3). Voz de familia bilingüe patrón D-387.';

CREATE TRIGGER trg_cat_objetivos_adiestramiento_updated_at
  BEFORE UPDATE ON public.cat_objetivos_adiestramiento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS calco del catálogo grooming: lectura authenticated, cero
-- escritura por policy (el catálogo se administra por migración/admin).
ALTER TABLE public.cat_objetivos_adiestramiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_objetivos_adiestramiento_select_authenticated
  ON public.cat_objetivos_adiestramiento FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.cat_objetivos_adiestramiento TO authenticated;
GRANT ALL ON public.cat_objetivos_adiestramiento TO service_role;

-- ── 2. cat_curriculum_adiestramiento (objetivo ↔ nivel ↔ sesión k) ────
CREATE TABLE public.cat_curriculum_adiestramiento (
  nivel              text NOT NULL,
  objetivo_codigo    text NOT NULL REFERENCES public.cat_objetivos_adiestramiento(codigo) ON DELETE CASCADE,
  sesion_sugerida    integer NOT NULL,
  activo             boolean NOT NULL DEFAULT true,
  es_seed_preliminar boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (nivel, objetivo_codigo),
  -- mismo catálogo de niveles que prestador_programas (20260715180000)
  CONSTRAINT chk_curriculum_nivel CHECK (nivel IN ('basico','medio','experto','especialidad')),
  CONSTRAINT chk_curriculum_sesion CHECK (sesion_sugerida >= 1)
);

COMMENT ON TABLE public.cat_curriculum_adiestramiento IS
  'Currículum SUGERIDO de la plataforma: en qué sesión k de cada nivel se alcanza cada objetivo (rangos §12.4 — sugerencia, jamás imposición: el adiestrador declara su programa). Alimenta los chips del Durante y la progresión narrativa §6. Sembrado solo para la escalera troncal; las especialidades declaran su contenido (§5).';

CREATE TRIGGER trg_cat_curriculum_adiestramiento_updated_at
  BEFORE UPDATE ON public.cat_curriculum_adiestramiento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cat_curriculum_adiestramiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_curriculum_adiestramiento_select_authenticated
  ON public.cat_curriculum_adiestramiento FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.cat_curriculum_adiestramiento TO authenticated;
GRANT ALL ON public.cat_curriculum_adiestramiento TO service_role;

-- ── 3. SEMILLAS (es_seed_preliminar=true en la fila — §10.3 valida
--       antes de abrir). Voz de oficio + voz de familia es/en. ─────────
INSERT INTO public.cat_objetivos_adiestramiento
  (codigo, nombre, orden_display, nombre_familia, nombre_familia_en) VALUES
  -- la escalera troncal — BÁSICO
  ('atencion_contacto_visual', 'Atención / contacto visual', 10, 'Te mira cuando le hablas', 'Looks at you when you speak'),
  ('sentado',                  'Sentado',                    20, 'Se sienta cuando se lo pides', 'Sits when asked'),
  ('echado',                   'Echado',                     30, 'Se echa cuando se lo pides', 'Lies down when asked'),
  ('llamado',                  'Acudir al llamado',          40, 'Viene cuando lo llamas', 'Comes when called'),
  ('correa_floja',             'Caminar con correa floja',   50, 'Pasea sin tirar de la correa', 'Walks without pulling'),
  ('quieto',                   'Quieto',                     60, 'Se queda quieto donde le pides', 'Stays where you ask'),
  ('deja',                     'Dejar / soltar',             70, 'Suelta lo que tiene al pedírselo', 'Drops it when asked'),
  ('no_saltar',                'No saltar sobre personas',   80, 'Saluda sin saltar encima', 'Greets without jumping up'),
  -- MEDIO
  ('quieto_distracciones',     'Quieto con distracciones',  110, 'Se queda quieto aunque pase de todo', 'Stays even with distractions'),
  ('llamado_distracciones',    'Llamado con distracciones', 120, 'Viene aunque haya distracciones', 'Comes even with distractions'),
  ('junto',                    'Caminar junto (heel)',      130, 'Camina pegado a tu paso', 'Walks right by your side'),
  ('lugar',                    'Ir a su lugar',             140, 'Va a su lugar cuando se lo pides', 'Goes to their spot when asked'),
  ('esperar_puertas',          'Esperar en puertas',        150, 'Espera antes de cruzar la puerta', 'Waits before crossing doorways'),
  ('control_impulsos',         'Control de impulsos',       160, 'Espera con calma su turno', 'Waits calmly for their turn'),
  -- EXPERTO
  ('obediencia_distancia',     'Obediencia a distancia',    210, 'Responde aunque estés lejos', 'Responds even from a distance'),
  ('quieto_prolongado',        'Quieto prolongado',         220, 'Se queda quieto largo rato', 'Holds a long stay'),
  ('llamado_entorno_abierto',  'Llamado en entorno abierto',230, 'Viene incluso en espacios abiertos', 'Comes even in open spaces'),
  ('secuencias',               'Secuencias encadenadas',    240, 'Encadena varias órdenes seguidas', 'Chains several commands in a row'),
  ('quieto_fuera_de_vista',    'Quieto fuera de vista',     250, 'Se queda quieto aunque no te vea', 'Stays even when you''re out of sight'),
  -- ESPECIALIDADES (vocabulario disponible; su currículum lo declara
  -- el adiestrador — §1/§5)
  ('ansiedad_separacion',      'Manejo de ansiedad por separación', 310, 'Se queda tranquilo cuando no estás', 'Stays calm when you''re away'),
  ('reactividad_perros',       'Reducción de reactividad a otros perros', 320, 'Se cruza con otros perros con calma', 'Passes other dogs calmly'),
  ('truco_pata',               'Truco: dar la pata',        330, 'Da la pata', 'Gives paw'),
  ('truco_rodar',              'Truco: rodar',              340, 'Rueda cuando se lo pides', 'Rolls over when asked')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.cat_curriculum_adiestramiento (nivel, objetivo_codigo, sesion_sugerida) VALUES
  -- BÁSICO (rango sugerido 6-8 sesiones, §12.4)
  ('basico', 'atencion_contacto_visual', 1),
  ('basico', 'sentado',                  2),
  ('basico', 'echado',                   3),
  ('basico', 'llamado',                  4),
  ('basico', 'correa_floja',             5),
  ('basico', 'quieto',                   6),
  ('basico', 'deja',                     7),
  ('basico', 'no_saltar',                8),
  -- MEDIO (8-10): refuerza el tronco y suma contexto
  ('medio', 'quieto_distracciones',      2),
  ('medio', 'llamado_distracciones',     3),
  ('medio', 'junto',                     4),
  ('medio', 'lugar',                     5),
  ('medio', 'esperar_puertas',           6),
  ('medio', 'control_impulsos',          7),
  -- EXPERTO (10-12)
  ('experto', 'obediencia_distancia',    2),
  ('experto', 'quieto_prolongado',       4),
  ('experto', 'llamado_entorno_abierto', 6),
  ('experto', 'secuencias',              8),
  ('experto', 'quieto_fuera_de_vista',  10)
ON CONFLICT (nivel, objetivo_codigo) DO NOTHING;

-- ── 4. PIEZA 2 — helper: las ofertas COBRABLES del oficio ─────────────
-- Gemela delgada de _grooming_ofertas_cobrables: mismos filtros de
-- verdad (prestador activo · cuenta activa 7.13 "no se oferta quien no
-- puede cobrar" · tipo del oficio activo · oferta activa · acote de
-- especies del prestador) SIN la rama de talla/pelaje/recargo. Devuelve
-- LOS DOS comprables (§1): la sesión suelta Y cada programa activo del
-- catálogo del adiestrador.
CREATE OR REPLACE FUNCTION public._adiestramiento_ofertas_cobrables(p_mascota_id uuid)
RETURNS TABLE(
  prestador_id uuid,
  prestador_servicio_id uuid,
  prestador_nombre text,
  tipo_servicio text,
  comprable text,             -- 'sesion' | 'programa'
  programa_id uuid,           -- NULL para la sesión suelta
  nombre text,
  nivel text,                 -- NULL para la sesión suelta
  n_sesiones integer,         -- NULL para la sesión suelta
  vigencia_dias integer,      -- NULL para la sesión suelta
  precio numeric,
  duracion_minutos integer,
  direccion text,
  ciudad text
)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  -- la SESIÓN SUELTA (precio único del adiestrador, §4 — sin matriz)
  SELECT
    pr.id, ps.id, pr.nombre_comercial, ps.tipo_servicio,
    'sesion', NULL::uuid,
    COALESCE(ps.nombre_custom, ts.nombre),
    NULL::text, NULL::integer, NULL::integer,
    ps.precio, ps.duracion_minutos,
    pr.direccion, pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_servicios ps
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  -- Regla founder S54 / 7.13: no se oferta quien no puede cobrar.
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria = 'adiestramiento' AND ts.activo
  WHERE m.id = p_mascota_id
    AND ps.activo
    AND ps.precio IS NOT NULL AND ps.precio >= 0
    AND ps.duracion_minutos IS NOT NULL AND ps.duracion_minutos > 0
    -- el adiestrador ACOTA (patrón §5 grooming): NULL = rige el techo del tipo
    AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)

  UNION ALL

  -- el PROGRAMA (precio propio, jamás N×sesión — §4)
  SELECT
    pr.id, ps.id, pr.nombre_comercial, ps.tipo_servicio,
    'programa', pp.id,
    pp.nombre,
    pp.nivel, pp.n_sesiones, pp.vigencia_dias,
    pp.precio_programa, pp.duracion_minutos_sesion,
    pr.direccion, pr.ciudad
  FROM mascotas m
  CROSS JOIN prestador_programas pp
  JOIN prestador_servicios ps ON ps.id = pp.prestador_servicio_id AND ps.activo
  JOIN prestadores pr         ON pr.id = ps.prestador_id AND pr.estado = 'activo'
  JOIN cuentas_comerciales cc ON cc.id = pr.cuenta_comercial_id AND cc.estado = 'activa'
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
                             AND ts.categoria = 'adiestramiento' AND ts.activo
  WHERE m.id = p_mascota_id
    AND pp.activo
    AND (ps.especies_compatibles IS NULL OR ps.especies_compatibles ? m.especie)
$function$;

-- ── 5. PIEZA 2 — el QUIÉN/QUÉ público con disponibilidad ─────────────
-- Gemela delgada de obtener_groomers_disponibles: mismos guards tipados
-- (auth · acceso a mascota · especie por _mascota_elegible_servicio —
-- techo ["perro"] vivo desde 20260715180000 · pasado = vacío sin error,
-- cinturón del QUIÉN del paseo) SIN talla_no_declarada ni modalidad
-- (default único del chasis; el trazado 3-modalidades es S64-B0). La
-- disponibilidad usa _inicios_disponibles_prestador — LA verdad única
-- de grilla — con la duración PROPIA de cada comprable; para el
-- programa es la de su PRIMERA sesión (las N−1 las valida
-- contratar_programa, atómico).
CREATE OR REPLACE FUNCTION public.obtener_adiestradores_disponibles(
  p_fecha date,
  p_hora time without time zone,
  p_mascota_id uuid
)
RETURNS TABLE(
  prestador_id uuid,
  prestador_servicio_id uuid,
  prestador_nombre text,
  tipo_servicio text,
  comprable text,
  programa_id uuid,
  nombre text,
  nivel text,
  n_sesiones integer,
  vigencia_dias integer,
  precio numeric,
  duracion_minutos integer,
  direccion text,
  ciudad text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_fecha IS NULL OR p_hora IS NULL OR p_mascota_id IS NULL THEN
    RAISE EXCEPTION 'ventana_invalida' USING ERRCODE = '22023';
  END IF;
  IF NOT user_tiene_acceso_a_mascota(p_mascota_id) THEN
    RAISE EXCEPTION 'no_access_to_mascota' USING ERRCODE = '42501';
  END IF;
  -- §1bis/§2: el techo de especie rebota tipado ANTES de resolver
  -- ('adiestramiento' es el único código del oficio hoy; el filtro por
  -- fila de abajo cubre códigos futuros).
  IF NOT _mascota_elegible_servicio(p_mascota_id, 'adiestramiento') THEN
    RAISE EXCEPTION 'mascota_no_elegible' USING ERRCODE = '22023';
  END IF;
  -- Ventana en el pasado: resultado VACÍO sin error (cinturón, espejo
  -- del QUIÉN del paseo/grooming — la UI ya filtra las horas de hoy).
  IF (p_fecha + p_hora) <= (now() AT TIME ZONE 'America/Guayaquil') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.prestador_id, o.prestador_servicio_id, o.prestador_nombre,
    o.tipo_servicio, o.comprable, o.programa_id, o.nombre,
    o.nivel, o.n_sesiones, o.vigencia_dias,
    o.precio, o.duracion_minutos, o.direccion, o.ciudad
  FROM _adiestramiento_ofertas_cobrables(p_mascota_id) o
  WHERE _mascota_elegible_servicio(p_mascota_id, o.tipo_servicio)
    AND p_hora IN (
      SELECT i.hora
      FROM _inicios_disponibles_prestador(
        o.prestador_id, o.prestador_servicio_id, p_fecha, o.duracion_minutos
      ) i
    )
  ORDER BY o.comprable, o.precio, o.nombre;
END;
$function$;

-- ── 6. L-140: ley en dos partes por CADA función nueva ────────────────
REVOKE ALL ON FUNCTION public._adiestramiento_ofertas_cobrables(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._adiestramiento_ofertas_cobrables(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.obtener_adiestradores_disponibles(date, time without time zone, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obtener_adiestradores_disponibles(date, time without time zone, uuid) TO authenticated, service_role;
