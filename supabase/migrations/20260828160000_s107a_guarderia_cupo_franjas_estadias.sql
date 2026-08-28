-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — GUARDERÍA: EL TIPO, EL CUPO POR LUGAR, LAS FRANJAS Y LA ESTADÍA
--
-- Fuente de letra: `PLAN_S107_GUARDERIA` §4.1-§4.4 (+ §0bis, enmiendas de
-- mesa) · `BRIEF_S107_GUARDERIA` §1 y §2 · `LETRA_GUARDERIA` §1-§2 (frenada en
-- §3/§6 — nada de acá las toca) · censo `docs/loop/S107-A-CENSO.md` ·
-- contrato `docs/contratos/s107-contrato-cupo-franja-estadia.md`.
--
-- 🔴 ESTO ES UNA TRADUCCIÓN DEL MOLDE VIVO DE LA DESPENSA
-- (`20260812140000_s96_b3_cupo_ventana_fecha.sql`), NO UN DISEÑO NUEVO.
-- Quien lo lea con esa migración al lado va a reconocer cada pieza:
-- `recursos_reparto` → `guarderia_espacios` · `recurso_reparto_excepciones` →
-- `guarderia_espacio_excepciones` · `cupo_reparto_del_dia` →
-- `cupo_guarderia_del_dia`. **La excepción GANA al patrón, y un cancelado
-- devuelve su lugar** — las dos reglas salen del molde, no de acá.
--
-- ── QUÉ CONSTRUYE ──────────────────────────────────────────────────────────
-- ① El catálogo dice la verdad: `especies_elegibles` deja de ser NULL en los
--    cinco tipos de hospedaje, y hotel se apaga por FALTA DE LETRA.
-- ② `guarderia_espacios` + `guarderia_espacio_excepciones` — la capacidad es
--    DEL LUGAR y es PARÁMETRO. Ningún número va en el código.
-- ③ `cupo_guarderia_del_dia` — capacidad · consumido · disponible ·
--    **sobrevendido**, contando por FECHA LOCAL, jamás por timestamp UTC.
-- ④ `guarderia_franjas` — dos ventanas por día (recogida / devolución), que
--    NO son turnos: no se rebanan en slots de 30 minutos.
-- ⑤ `guarderia_estadias` — la máquina de estados del oficio, 1:1 con la cita,
--    APARTE para no contaminar la cita compartida por cinco oficios.
-- ⑥ `evento_atencion.familia` acepta 'guarderia' (el durante es el chasis
--    compartido; el oficio es nuevo, y ÉSA es la razón de tocar el CHECK).
-- ⑦ Lápida en la tabla legacy `public.estadias`.
--
-- ── 🔴 LO QUE ESTA MIGRACIÓN **NO** HACE, declarado para que no se busque ──
-- **`guarderia_estadias` NACE SIN PUERTA DE ESCRITURA.** No hay RPC que cree
-- una estadía todavía: eso es la tanda del cobro (§4.5 del plan), y llega con
-- el hold de cupo y el enchufe al motor de pagos. *Se declara porque «motor
-- sin puerta» se pagó seis veces en S106 — acá la puerta falta A PROPÓSITO y
-- con fecha, que es distinto de faltar sin que nadie lo note.*
-- Tampoco entra: el gate sanitario (§4.6), el paquete con su sujeto de pago,
-- ni una sola línea de texto legal (perímetro §0 del plan).
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260828160000-guarderia-cupo-franjas-estadias.sql
--          ESCRITA ANTES DE APLICAR. Declara sus tres límites — entre ellos
--          que NO devuelve `especies_elegibles` a NULL, porque ese NULL era
--          fail-open y revertirlo reabriría el oficio a cualquier especie.
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón escribe filas reales (un espacio, una cita
-- y una estadía) para probar el cupo con un discriminador de verdad, y las
-- deshace en SUBTRANSACCIÓN QUE SE DESHACE SOLA (L-406: un arnés que ejecuta
-- el circuito para probarlo hace lo que vino a vigilar). La DDL queda afuera
-- de esa subtransacción. Residuo verificado en 0 al cierre.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① EL CATÁLOGO DICE LA VERDAD
--    Censo ⓪: los cinco tipos de hospedaje están `activo` y `reservable` con
--    `especies_elegibles = NULL`, y `_mascota_elegible_servicio` lee NULL como
--    «todas» ⇒ hoy un pez es elegible para guardería. **Esto no es un `if`
--    nuevo: es la columna que la letra siempre mandó llenar.**
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE public.tipos_servicio
   SET especies_elegibles = '["perro","gato"]'::jsonb
 WHERE codigo IN ('guarderia_dia','guarderia_mensual','hotel','hotel_dia','hotel_noche');

-- 🔴 HOTEL SE APAGA POR FALTA DE LETRA, y es reversible con una palabra.
-- `LETRA_GUARDERIA` §5 y `BRIEF_S107` §1: «la noche NO es guardería: es hotel,
-- otro servicio con su propia letra». Hoy esos tres códigos están reservables
-- **sin ninguna letra detrás y sin modelo de cupo** — y el catálogo es la
-- única cosa que le promete a un prestador que puede ofrecerlos.
-- Medido antes de apagar: 0 ofertas y 0 citas de los cinco ⇒ **daño cero**.
UPDATE public.tipos_servicio
   SET reservable = false
 WHERE codigo IN ('hotel','hotel_dia','hotel_noche');

-- `guarderia_mensual` se apaga por OTRA razón, y conviene no confundirlas:
-- la mensualidad es UNA FORMA DE COMPRAR `guarderia_dia`, no otro servicio.
-- Dos tipos reservables serían **dos pozos de cupo para el mismo lugar**.
UPDATE public.tipos_servicio
   SET reservable = false
 WHERE codigo = 'guarderia_mensual';

COMMENT ON TABLE public.estadias IS
  '☠️ LÁPIDA (S107-A, 28-ago-2026). Tabla del legado, semántica de NOCHES '
  '(cantidad_noches, precio_por_noche, tipo_servicio DEFAULT ''hotel''). '
  'Medida al ponerle esta lápida: 0 filas, 0 consumidores en el monorepo. '
  '🔴 LA GUARDERÍA NO VIVE ACÁ: vive en guarderia_estadias, 1:1 con su cita. '
  'Y hotel/pernoctación está FUERA de v1 por LETRA_GUARDERIA §5, sin letra '
  'propia todavía. No escribir acá sin esa letra.';

-- ═══════════════════════════════════════════════════════════════════════════
-- ② EL CUPO ES DEL LUGAR — traducción de `recursos_reparto`
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.guarderia_espacios (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id      uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  nombre            text NOT NULL CHECK (length(btrim(nombre)) > 0),
  -- 🔴 LA CAPACIDAD ES PARÁMETRO. Jamás un número en el código.
  capacidad_por_dia integer NOT NULL CHECK (capacidad_por_dia > 0),
  -- Convención de la casa (regla 32): 0=Domingo … 6=Sábado.
  dias_operacion    integer[] NOT NULL DEFAULT '{1,2,3,4,5}'
                    CHECK (dias_operacion <@ ARRAY[0,1,2,3,4,5,6]),
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_guarderia_espacio_nombre UNIQUE (prestador_id, nombre)
);
CREATE TRIGGER trg_guarderia_espacios_updated BEFORE UPDATE ON public.guarderia_espacios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
ALTER TABLE public.guarderia_espacios ENABLE ROW LEVEL SECURITY;
-- Lectura pública espejo de `ps_public`: la familia necesita saber si el lugar
-- tiene cupo, y eso exige ver la capacidad del prestador activo.
CREATE POLICY guarderia_espacios_public ON public.guarderia_espacios FOR SELECT TO authenticated
  USING ((activo = true AND public.prestador_activo(prestador_id)) OR public.is_admin());
CREATE POLICY guarderia_espacios_own ON public.guarderia_espacios FOR SELECT TO authenticated
  USING (public.user_gestiona_prestador(prestador_id));
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_espacios FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_espacios FROM anon;

CREATE TABLE public.guarderia_espacio_excepciones (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id uuid NOT NULL REFERENCES public.guarderia_espacios(id) ON DELETE CASCADE,
  fecha      date NOT NULL,
  -- true = abre aunque el patrón diga que no; false = cierra aunque diga que sí.
  -- La excepción GANA al patrón en las dos direcciones (molde de la despensa).
  disponible boolean NOT NULL,
  motivo     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_guarderia_excepcion_dia UNIQUE (espacio_id, fecha)
);
ALTER TABLE public.guarderia_espacio_excepciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_excepciones_select ON public.guarderia_espacio_excepciones
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.guarderia_espacios e
                  WHERE e.id = espacio_id
                    AND ((e.activo AND public.prestador_activo(e.prestador_id))
                         OR public.user_gestiona_prestador(e.prestador_id)))
         OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_espacio_excepciones FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_espacio_excepciones FROM anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ LAS FRANJAS — dos ventanas por día, que NO son turnos
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.guarderia_franjas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  tipo         text NOT NULL CHECK (tipo IN ('recogida','devolucion')),
  desde        time NOT NULL,
  hasta        time NOT NULL,
  dias_semana  integer[] NOT NULL DEFAULT '{1,2,3,4,5}'
               CHECK (dias_semana <@ ARRAY[0,1,2,3,4,5,6]),
  -- El molde de la despensa ya traía la zona horaria como DATO; no se cablea.
  zona_horaria text NOT NULL DEFAULT 'America/Guayaquil',
  activo       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_guarderia_franja_rango CHECK (hasta > desde),
  CONSTRAINT uq_guarderia_franja UNIQUE (prestador_id, tipo, dias_semana)
);
ALTER TABLE public.guarderia_franjas ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_franjas_public ON public.guarderia_franjas FOR SELECT TO authenticated
  USING ((activo = true AND public.prestador_activo(prestador_id)) OR public.is_admin());
CREATE POLICY guarderia_franjas_own ON public.guarderia_franjas FOR SELECT TO authenticated
  USING (public.user_gestiona_prestador(prestador_id));
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_franjas FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_franjas FROM anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- ④ LA ESTADÍA — 1:1 con la cita, y su máquina de estados APARTE
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE public.guarderia_estadias (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id      uuid NOT NULL UNIQUE
               REFERENCES public.evento_cita_servicio(id) ON DELETE CASCADE,
  espacio_id   uuid REFERENCES public.guarderia_espacios(id) ON DELETE SET NULL,
  estado       text NOT NULL DEFAULT 'reservada'
               CHECK (estado IN ('reservada','recogida_en_curso','en_guarderia',
                                 'retorno_en_curso','entregada','cancelada','no_recogida')),
  a_bordo_en   timestamptz,
  llegada_en   timestamptz,
  entregada_en timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_guarderia_estadias_espacio ON public.guarderia_estadias (espacio_id);
CREATE TRIGGER trg_guarderia_estadias_updated BEFORE UPDATE ON public.guarderia_estadias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
ALTER TABLE public.guarderia_estadias ENABLE ROW LEVEL SECURITY;
CREATE POLICY guarderia_estadias_select ON public.guarderia_estadias FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.evento_cita_servicio c
                  WHERE c.id = cita_id
                    AND (public.user_gestiona_prestador(c.prestador_id)
                         OR c.user_id = auth.uid()
                         OR public.user_tiene_acceso_a_mascota(c.mascota_id)))
         OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.guarderia_estadias FROM anon, authenticated;
REVOKE SELECT ON public.guarderia_estadias FROM anon;

COMMENT ON TABLE public.guarderia_estadias IS
  'S107 · Una estadía = UN animal, UN día. 1:1 con su evento_cita_servicio. '
  '🔴 NACE SIN PUERTA DE ESCRITURA a propósito: la RPC que la crea llega con '
  'el hold de cupo y el cobro (plan §4.5). Las transiciones las hace un evento '
  'server autenticado — la UI jamás declara un estado.';

-- El durante es el chasis compartido; guardería es un oficio nuevo, y ÉSA es
-- la razón de tocar un vocabulario cerrado. No se amplía «de paso».
ALTER TABLE public.evento_atencion DROP CONSTRAINT evento_atencion_familia_check;
ALTER TABLE public.evento_atencion ADD CONSTRAINT evento_atencion_familia_check
  CHECK (familia = ANY (ARRAY['grooming'::text,'paseo'::text,'adiestramiento'::text,'guarderia'::text]));


-- ═══════════════════════════════════════════════════════════════════════════
-- ⑤ LAS PUERTAS DE ESCRITURA DE LA CONFIGURACIÓN
--    Patrón S95-G2, igual que la despensa: sin policy de escritura, la única
--    vía es la función que valida.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.definir_espacio_guarderia(
  p_prestador_id      uuid,
  p_nombre            text,
  p_capacidad_por_dia integer,
  p_dias_operacion    integer[] DEFAULT NULL,
  p_activo            boolean   DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_capacidad_por_dia IS NULL OR p_capacidad_por_dia <= 0 THEN
    RAISE EXCEPTION 'capacidad_invalida' USING ERRCODE = '22023';
  END IF;
  INSERT INTO guarderia_espacios (prestador_id, nombre, capacidad_por_dia, dias_operacion, activo)
    VALUES (p_prestador_id, btrim(p_nombre), p_capacidad_por_dia,
            COALESCE(p_dias_operacion, '{1,2,3,4,5}'), p_activo)
  ON CONFLICT (prestador_id, nombre)
    DO UPDATE SET capacidad_por_dia = EXCLUDED.capacidad_por_dia,
                  dias_operacion    = EXCLUDED.dias_operacion,
                  activo            = EXCLUDED.activo,
                  updated_at        = now()
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'espacio_id', v_id);
END $$;

CREATE FUNCTION public.declarar_excepcion_espacio_guarderia(
  p_espacio_id uuid,
  p_fecha      date,
  p_disponible boolean,
  p_motivo     text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_prestador uuid;
BEGIN
  SELECT prestador_id INTO v_prestador FROM guarderia_espacios WHERE id = p_espacio_id;
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'espacio_no_existe' USING ERRCODE = '22023';
  END IF;
  IF NOT user_gestiona_prestador(v_prestador) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  INSERT INTO guarderia_espacio_excepciones (espacio_id, fecha, disponible, motivo)
    VALUES (p_espacio_id, p_fecha, p_disponible, p_motivo)
  ON CONFLICT (espacio_id, fecha)
    DO UPDATE SET disponible = EXCLUDED.disponible, motivo = EXCLUDED.motivo;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE FUNCTION public.definir_franja_guarderia(
  p_prestador_id uuid,
  p_tipo         text,
  p_desde        time,
  p_hasta        time,
  p_dias_semana  integer[] DEFAULT NULL,
  p_zona_horaria text      DEFAULT 'America/Guayaquil'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_id uuid; v_dias integer[] := COALESCE(p_dias_semana, '{1,2,3,4,5}'); v_choque int;
BEGIN
  IF NOT user_gestiona_prestador(p_prestador_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'no_gestionas_este_prestador' USING ERRCODE = '42501';
  END IF;
  IF p_tipo NOT IN ('recogida','devolucion') THEN
    RAISE EXCEPTION 'tipo_de_franja_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_hasta <= p_desde THEN
    RAISE EXCEPTION 'franja_invertida' USING ERRCODE = '22023';
  END IF;

  /* 🔴 LA VALIDACIÓN QUE VIVE EN LA PUERTA, NO EN LA PANTALLA: la ventana de
     recogida termina ANTES de que empiece la de devolución, sobre los días que
     comparten. *Un lugar que devuelve antes de terminar de recoger no existe,
     y una pantalla que lo deja escribir produce un día imposible.* */
  SELECT count(*) INTO v_choque
    FROM guarderia_franjas f
   WHERE f.prestador_id = p_prestador_id
     AND f.activo
     AND f.dias_semana && v_dias                -- comparten al menos un día
     AND f.tipo <> p_tipo
     AND ( (p_tipo = 'recogida'   AND p_hasta > f.desde)
        OR (p_tipo = 'devolucion' AND p_desde < f.hasta) );
  IF v_choque > 0 THEN
    RAISE EXCEPTION 'franjas_se_cruzan' USING ERRCODE = '22023';
  END IF;

  INSERT INTO guarderia_franjas (prestador_id, tipo, desde, hasta, dias_semana, zona_horaria)
    VALUES (p_prestador_id, p_tipo, p_desde, p_hasta, v_dias, p_zona_horaria)
  ON CONFLICT (prestador_id, tipo, dias_semana)
    DO UPDATE SET desde = EXCLUDED.desde, hasta = EXCLUDED.hasta,
                  zona_horaria = EXCLUDED.zona_horaria, activo = true
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'franja_id', v_id);
END $$;

CREATE FUNCTION public.obtener_franjas_guarderia(p_prestador_id uuid)
RETURNS TABLE(tipo text, desde time, hasta time, dias_semana integer[], zona_horaria text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp
AS $$
  SELECT f.tipo, f.desde, f.hasta, f.dias_semana, f.zona_horaria
    FROM guarderia_franjas f
   WHERE f.prestador_id = p_prestador_id AND f.activo
   ORDER BY CASE f.tipo WHEN 'recogida' THEN 0 ELSE 1 END, f.desde;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑥ EL CUPO DEL DÍA — traducción literal de `cupo_reparto_del_dia`
-- ═══════════════════════════════════════════════════════════════════════════
CREATE FUNCTION public.cupo_guarderia_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_capacidad int;
  v_consumido int;
  v_dow int := EXTRACT(dow FROM p_fecha)::int;
BEGIN
  /* 🔴 `p_fecha` es FECHA LOCAL DEL LUGAR (public.hoy_local() la resuelve para
     «hoy»). Contar por timestamp UTC parte el día a medianoche y sobrevende el
     borde. */

  -- Confirmado para el día = activo Y (su patrón lo incluye O una excepción lo
  -- trae) Y ninguna excepción lo saca. LA EXCEPCIÓN GANA. (Molde despensa.)
  SELECT COALESCE(SUM(e.capacidad_por_dia), 0) INTO v_capacidad
    FROM guarderia_espacios e
   WHERE e.prestador_id = p_prestador_id AND e.activo
     AND (
       (v_dow = ANY(e.dias_operacion)
         AND NOT EXISTS (SELECT 1 FROM guarderia_espacio_excepciones x
                          WHERE x.espacio_id = e.id AND x.fecha = p_fecha AND NOT x.disponible))
       OR EXISTS (SELECT 1 FROM guarderia_espacio_excepciones x
                   WHERE x.espacio_id = e.id AND x.fecha = p_fecha AND x.disponible)
     );

  -- Lo que ya se prometió contra ese día. Un cancelado devuelve su lugar.
  SELECT count(*) INTO v_consumido
    FROM guarderia_estadias g
    JOIN evento_cita_servicio c ON c.id = g.cita_id
   WHERE c.prestador_id = p_prestador_id
     AND c.fecha = p_fecha
     AND g.estado NOT IN ('cancelada');

  RETURN jsonb_build_object(
    'fecha',        p_fecha,
    'capacidad',    v_capacidad,
    'consumido',    v_consumido,
    'disponible',   GREATEST(v_capacidad - v_consumido, 0),
    /* 🔴 Bajar la capacidad con reservas tomadas RIGE HACIA ADELANTE Y JAMÁS
       CANCELA. El día queda sobrevendido DECLARADO y visible al prestador —
       nunca se resuelve solo. */
    'sobrevendido', (v_consumido > v_capacidad)
  );
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑦ L-140 — toda función nace con EXECUTE para `anon`, y REVOKE FROM PUBLIC
--    NO lo quita. Se cierra explícito y se verifica abajo por `proacl`.
-- ═══════════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.definir_espacio_guarderia(uuid, text, integer, integer[], boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.declarar_excepcion_espacio_guarderia(uuid, date, boolean, text)     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.definir_franja_guarderia(uuid, text, time, time, integer[], text)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.obtener_franjas_guarderia(uuid)                                     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cupo_guarderia_del_dia(uuid, date)                                  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.definir_espacio_guarderia(uuid, text, integer, integer[], boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.declarar_excepcion_espacio_guarderia(uuid, date, boolean, text)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.definir_franja_guarderia(uuid, text, time, time, integer[], text)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_franjas_guarderia(uuid)                                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.cupo_guarderia_del_dia(uuid, date)                                  TO authenticated;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⑧ EL CINTURÓN — con discriminador, y la escritura en SUBTRANSACCIÓN QUE SE
--    DESHACE SOLA (L-406). La DDL de arriba ya está commiteada y queda afuera.
--    🔴 Aborta si el caso que discrimina no existe: un cinturón que no puede
--    distinguir da verde por vacío.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DO $cinturon$
DECLARE
  v_rol_mig    text := current_user;
  v_pez        uuid;
  v_perro      uuid;
  v_prestador  uuid;
  v_titular    uuid;
  v_espacio    uuid;
  v_cita       uuid;
  v_cupo       jsonb;
  v_fecha      date := public.hoy_local() + 30;   -- lejos de cualquier dato vivo
  v_err        text;
  v_ok         int := 0;
  v_residuo    int;
BEGIN
  -- ── A1 · LA ESPECIE, CON SU DISCRIMINADOR ────────────────────────────────
  SELECT id INTO v_pez   FROM mascotas WHERE especie NOT IN ('perro','gato') AND estado_vida='activa' LIMIT 1;
  SELECT id INTO v_perro FROM mascotas WHERE especie = 'perro'               AND estado_vida='activa' LIMIT 1;
  IF v_pez IS NULL OR v_perro IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: falta el caso que discrimina (pez=% perro=%). Sin las dos especies este assert daria verde por vacio.', v_pez, v_perro;
  END IF;
  IF public._mascota_elegible_servicio(v_pez, 'guarderia_dia') THEN
    RAISE EXCEPTION 'A1 ROJO: una especie que no es perro ni gato sigue siendo elegible para guarderia_dia (el NULL fail-open no se cerro).';
  END IF;
  IF NOT public._mascota_elegible_servicio(v_perro, 'guarderia_dia') THEN
    RAISE EXCEPTION 'A1 ROJO: un perro activo NO es elegible para guarderia_dia — se cerro de mas.';
  END IF;
  v_ok := v_ok + 1;
  RAISE NOTICE 'A1 VERDE · la especie discrimina: pez=NO elegible, perro=SI elegible';

  -- ── El sujeto de las pruebas que escriben ────────────────────────────────
  SELECT p.id, p.user_id INTO v_prestador, v_titular
    FROM prestadores p WHERE p.estado = 'activo' AND p.user_id IS NOT NULL LIMIT 1;
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'CINTURON ABORTA: no hay prestador activo con titular para ejercer las puertas.';
  END IF;

  -- ── A2 y A3 · TODO LO QUE ESCRIBE, EN SUBTRANSACCIÓN ─────────────────────
  BEGIN
    -- A2 · EL CUPO, en sus tres estados
    INSERT INTO guarderia_espacios (prestador_id, nombre, capacidad_por_dia, dias_operacion)
      VALUES (v_prestador, '__cinturon_s107__', 2, ARRAY[0,1,2,3,4,5,6])
      RETURNING id INTO v_espacio;

    v_cupo := public.cupo_guarderia_del_dia(v_prestador, v_fecha);
    IF (v_cupo->>'capacidad')::int <> 2 OR (v_cupo->>'disponible')::int <> 2
       OR (v_cupo->>'sobrevendido')::boolean THEN
      RAISE EXCEPTION 'A2.1 ROJO: espacio de 2 sin reservas deberia dar capacidad 2 / disponible 2 / sobrevendido false. Dio %', v_cupo;
    END IF;

    INSERT INTO evento_cita_servicio (user_id, mascota_id, prestador_id, tipo_servicio,
                                      fecha, duracion_minutos, estado, country_code)
      VALUES (v_titular, v_perro, v_prestador, 'guarderia_dia',
              v_fecha, 600, 'pendiente', 'EC')
      RETURNING id INTO v_cita;
    INSERT INTO guarderia_estadias (cita_id, espacio_id) VALUES (v_cita, v_espacio);

    v_cupo := public.cupo_guarderia_del_dia(v_prestador, v_fecha);
    IF (v_cupo->>'consumido')::int <> 1 OR (v_cupo->>'disponible')::int <> 1 THEN
      RAISE EXCEPTION 'A2.2 ROJO: con una estadia deberia dar consumido 1 / disponible 1. Dio %', v_cupo;
    END IF;

    -- La sobreventa: la capacidad se va (el espacio se apaga) y el día YA tenía
    -- una reserva. Jamás cancela: lo DECLARA.
    UPDATE guarderia_espacios SET activo = false WHERE id = v_espacio;
    v_cupo := public.cupo_guarderia_del_dia(v_prestador, v_fecha);
    IF (v_cupo->>'capacidad')::int <> 0 OR (v_cupo->>'disponible')::int <> 0
       OR NOT (v_cupo->>'sobrevendido')::boolean THEN
      RAISE EXCEPTION 'A2.3 ROJO: capacidad por debajo de lo prometido debe dar disponible 0 y sobrevendido TRUE, sin cancelar nada. Dio %', v_cupo;
    END IF;
    UPDATE guarderia_espacios SET activo = true WHERE id = v_espacio;

    /* 🔴 DESDE ACÁ, CON LA SESIÓN DEL TITULAR. Las dos RPCs de abajo gatean por
       `user_gestiona_prestador`, que necesita `auth.uid()`: como superuser de
       migración devuelven false y rebotarían con `no_gestionas_este_prestador`.
       *El primer borrador de este cinturón las llamaba antes del cambio de rol
       y habría dado un rojo que no era del motor sino del arnés.* */
    EXECUTE format('SET LOCAL ROLE %I', 'authenticated');
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', v_titular::text, 'role', 'authenticated')::text, true);

    -- La excepción GANA al patrón: se cierra ese día puntual — POR LA PUERTA REAL.
    PERFORM public.declarar_excepcion_espacio_guarderia(v_espacio, v_fecha, false, 'cinturon');
    v_cupo := public.cupo_guarderia_del_dia(v_prestador, v_fecha);
    IF (v_cupo->>'capacidad')::int <> 0 THEN
      RAISE EXCEPTION 'A2.4 ROJO: una excepcion que cierra el dia debe dejar capacidad 0. Dio %', v_cupo;
    END IF;
    v_ok := v_ok + 1;
    RAISE NOTICE 'A2 VERDE · cupo por dia: 2/2 -> consumido 1 -> sobrevendido -> excepcion cierra';

    -- A3 · LAS FRANJAS, POR EL CAMINO REAL (misma sesión del titular)
    PERFORM public.definir_franja_guarderia(v_prestador, 'recogida', '07:00', '09:00', ARRAY[1,2,3,4,5]);
    BEGIN
      PERFORM public.definir_franja_guarderia(v_prestador, 'devolucion', '08:00', '10:00', ARRAY[1,2,3,4,5]);
      RAISE EXCEPTION 'A3 ROJO: una devolucion que empieza antes de terminar la recogida PASO. La puerta no valida.';
    EXCEPTION WHEN sqlstate '22023' THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err <> 'franjas_se_cruzan' THEN RAISE; END IF;
    END;
    PERFORM public.definir_franja_guarderia(v_prestador, 'devolucion', '16:30', '18:30', ARRAY[1,2,3,4,5]);
    IF (SELECT count(*) FROM guarderia_franjas WHERE prestador_id = v_prestador AND activo) <> 2 THEN
      RAISE EXCEPTION 'A3 ROJO: deberian quedar exactamente 2 franjas vivas.';
    END IF;
    v_ok := v_ok + 1;
    RAISE NOTICE 'A3 VERDE · franjas: la cruzada REBOTA con franjas_se_cruzan, la sana pasa';

    -- ⚠️ RESET ROLE NO: bajo db push vuelve al rol de LOGIN del tool, no al de
    -- la migracion (skill epetplace-db). Se restaura el capturado.
    EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);

    -- Deshacer TODO lo escrito: se sale por excepcion a proposito.
    RAISE EXCEPTION 'CINTURON_OK::%', v_ok;
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol_mig);
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      IF v_err NOT LIKE 'CINTURON_OK::%' THEN
        RAISE;   -- un rojo de verdad sube y aborta la migracion
      END IF;
  END;

  -- ── RESIDUO 0, medido y no supuesto ──────────────────────────────────────
  SELECT (SELECT count(*) FROM guarderia_espacios)
       + (SELECT count(*) FROM guarderia_espacio_excepciones)
       + (SELECT count(*) FROM guarderia_franjas)
       + (SELECT count(*) FROM guarderia_estadias)
    INTO v_residuo;
  IF v_residuo <> 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO: la subtransaccion dejo % filas de residuo.', v_residuo;
  END IF;

  RAISE NOTICE '✅ CINTURON S107-A: 3/3 verdes (especie · cupo · franjas) · residuo 0 · veda 76(g) cerrada';
END $cinturon$;

COMMIT;
