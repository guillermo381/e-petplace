-- S78-A6 — EL MOTOR DE RECEPCION (§7 y §4 de LETRA_RECEPCION_S76)
--
-- ⚠️  **ESTO NO ES UNA MIGRACION APLICADA. ES EL CONTRATO ESCRITO.**
-- Vive en docs/relevamientos/ **a proposito**: dentro de
-- supabase/migrations/ un `db push` lo aplicaria solo, y esta tanda
-- cerro antes de aplicarlo (la ventana se dio al push del founder).
-- Para aplicarlo: moverlo a supabase/migrations/ con su timestamp,
-- correr el fixture con su discriminador, y recien ahi `db push`.
-- Su deuda es **D-551**, y su reversa ya esta escrita:
-- docs/relevamientos/2026-07-26-s78a-REVERSA-motor-de-recepcion.sql
--
-- PAREADO CON EL M1 DE B (`ef171eb`), y esto es lo que hay que leer
-- junto: B decidio §13.3 —el dia con 2+ profesionales se compone por
-- SECCIONES POR PERSONA— y de ahi le nacio **la seccion "Del negocio"
-- para la cita con `empleado_id IS NULL`**. Ese estado es LEGAL desde
-- S77 §11(a): `dar_de_baja_empleado` estampa `SET empleado_id = NULL`
-- (verificado literal). Hoy son **0 filas** (81/81 citas con persona),
-- asi que es un estado legal sin datos todavia — y sin esa seccion, la
-- primera cita despegada por una baja seria **invisible**.
-- `obtener_jornada_recepcion` ya lo alimenta: devuelve la fila con
-- `empleado_id` y `empleado_nombre` en NULL, que es exactamente lo que
-- esa seccion consume. **No hace falta un lector aparte.**
-- ==================================================================
-- El M1 de la agenda de recepcion esta firmado desde S76 y su contrato
-- estaba DEFINIDO POR AUSENCIA: ningun campo tenia lector. Esta
-- migracion construye los tres que faltaban.
--
-- 76(g) — DECLARACION OBLIGATORIA: **NO RIGE**. Hay DDL (ADD COLUMN
-- nullable, sin DEFAULT — instantanea, sin reescritura de tabla) pero
-- **cero backfill y cero calculo de anclas sobre datos vivos**: la
-- columna nace NULL en las 81 filas y ninguna funcion nueva escribe
-- sobre datos existentes. No se abre veda de escritura.
--
-- L-140: las tres funciones nuevas cierran con REVOKE de PUBLIC/anon y
-- GRANT a authenticated. Verificacion de `proacl` en el cinturon.
--
-- REVERSA: docs/relevamientos/2026-07-26-s78a-REVERSA-motor-de-recepcion.sql
-- (con su nota: el DROP COLUMN pierde los llegada_en estampados, y esa
-- perdida es irreversible).
-- ==================================================================


-- ── 1. "LLEGO" ES UN TIMESTAMP, JAMAS UN ESTADO (§7) ────────────────
--
-- La letra lo fija y da sus dos patas. La primera es la que manda:
-- meter un estado 'llegada' en el CHECK obliga a censar TODO lector que
-- filtre por estado, y la casa tiene una ley que lo vuelve peligroso
-- ("la agenda solo contiene verdad firme"): si la cita cambiara de
-- estado al llegar, **la mascota podria desaparecer del HOY del
-- veterinario en el instante exacto en que entra por la puerta**.
-- Un timestamp aditivo no toca un solo lector — el argumento fuerte no
-- es que sobreviva al censo, es que LO VUELVE INNECESARIO.
-- La segunda: la forma del dato copia la forma del permiso. Un cambio
-- de estado tiene forma de decision; una estampa de tiempo, de hecho.
--
-- CERO estado nuevo en el CHECK de citas: se verifica en el cinturon.

ALTER TABLE public.evento_cita_servicio
  ADD COLUMN IF NOT EXISTS llegada_en timestamptz;

COMMENT ON COLUMN public.evento_cita_servicio.llegada_en IS
  'S78 §7 LETRA_RECEPCION_S76 — cuando la mascota entro por la puerta. '
  'NULL = todavia no llego. Es un HECHO, no un estado: no vive en el '
  'CHECK de estado y ningun lector de agenda lo filtra. '
  'llegada_en IS NULL al cierre del dia es el candidato natural a no_show.';


-- ── 2. registrar_llegada — la tercera de la familia VENTANILLA ──────
--
-- No se escribe por RLS: el predicado de las tres policies de agenda
-- restringe al `empleado_id` PROPIO (§4, byte-identico en las tres), asi
-- que recepcion NO puede hacer UPDATE sobre citas ajenas. Necesita su
-- RPC DEFINER gateada por MEMBRESIA — tercer miembro de la familia
-- ventanilla (§2: la ventanilla gatea por membresia, lo clinico por
-- chip), NO una puerta nueva. El gate se COPIA literal del vecino
-- (`obtener_contacto_reserva_cita`), no se inventa.
--
-- IDEMPOTENTE, y por que: "llego" es un hecho con hora. Re-estamparlo
-- moveria la hora de entrada de una mascota que ya entro — es decir,
-- mentiria. Si ya hay llegada, se devuelve la que hay.
--
-- NO SE CONSTRUYE EL DESHACER, declarado: un mis-tap deja una llegada
-- que hoy no tiene camino de correccion. Es la misma familia de D-544
-- (corregir es AGREGAR, con autor y fecha) y se resuelve con ella, no
-- con un UPDATE silencioso que borre el hecho.

CREATE OR REPLACE FUNCTION public.registrar_llegada(p_cita_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_prestador uuid;
  v_hay       boolean;
  v_llegada   timestamptz;
  v_estado    text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT true, c.prestador_id, c.llegada_en, c.estado
    INTO v_hay, v_prestador, v_llegada, v_estado
  FROM evento_cita_servicio c
  WHERE c.id = p_cita_id;

  IF v_hay IS NOT TRUE THEN
    RAISE EXCEPTION 'cita_no_encontrada' USING ERRCODE = '22023';
  END IF;
  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  -- Gate de MEMBRESIA (§2/§3): el mismo predicado del vecino ventanilla.
  IF NOT public.empleado_tiene_rol(v_prestador, ARRAY['dueño', 'profesional', 'recepcion']) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  -- La puerta no ofrece lo que va a rechazar (Ley 23), pero el server
  -- sigue siendo la autoridad: una cita cancelada o rechazada no recibe
  -- a nadie.
  IF v_estado IN ('cancelada', 'rechazada') THEN
    RAISE EXCEPTION 'cita_no_activa' USING ERRCODE = '22023';
  END IF;

  IF v_llegada IS NOT NULL THEN
    RETURN v_llegada;   -- idempotente: el hecho ya ocurrio, no se re-escribe
  END IF;

  UPDATE evento_cita_servicio
     SET llegada_en = now()
   WHERE id = p_cita_id
  RETURNING llegada_en INTO v_llegada;

  RETURN v_llegada;
END;
$function$;


-- ── 3. LA JORNADA DEL DIA CON SU PERSONA — LOS DOS PERMISOS (§4) ────
--
-- La letra §4 declara que son DOS PERMISOS DISTINTOS, y el literal lo
-- sostiene:
--   (a) VER las citas del dia del negocio — las tres policies de agenda
--       (`cita_select_prestador` y hermanas) restringen a un empleado a
--       las citas donde EL es el `empleado_id`; la unica rama "agenda
--       entera" es la de titularidad.
--   (b) RESOLVER ese `empleado_id` a un NOMBRE — un no-titular solo lee
--       su PROPIA fila de `prestador_empleados` (`empleados_self`), asi
--       que aunque la cita portara el id, no podria ponerle nombre.
-- Por eso una sola funcion DEFINER que conceda las dos cosas juntas, y
-- por eso se declara aca: no es un lector "mas ancho", son dos permisos.
--
-- EL ALCANCE SE MODULA POR ROL, y esto es lo delicado. §4 consecuencia 1:
-- "el profesional ve solo lo suyo" YA ESTA CUMPLIDO DE MOTOR — "no hay
-- nada que cerrar en ese eje; hay que CUIDAR DE NO ROMPERLO". Un DEFINER
-- que devolviera el dia entero a cualquier miembro lo romperia en el
-- acto. Asi que reproduce la tabla de verbos de §4:
--   · titular            -> todo el negocio
--   · recepcion (0 chips)-> todo el negocio
--   · profesional (chips)-> SOLO lo suyo
-- La definicion de recepcion es la de la letra, no una inventada:
-- `recepcion <=> NOT EXISTS chip` (§1, "recepcion esta definida por
-- AUSENCIA").
--
-- EL ADMINISTRADOR NO ENTRA, y se declara: la tabla de verbos le da
-- "ver la jornada del negocio", pero su MOTOR NO EXISTE (D-513/D-517: el
-- toggle no se ofrece hasta que exista). Cuando exista, cae en la rama
-- "todo el negocio" con una linea. Inventarle un predicado hoy seria
-- construir sobre algo que nadie firmo.

CREATE OR REPLACE FUNCTION public.obtener_jornada_recepcion(
  p_prestador_id uuid,
  p_fecha        date
)
RETURNS TABLE(
  cita_id          uuid,
  hora             time without time zone,
  duracion_minutos integer,
  estado           text,
  tipo_servicio    text,
  mascota_id       uuid,
  mascota_nombre   text,
  empleado_id      uuid,
  empleado_nombre  text,
  llegada_en       timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid        uuid := auth.uid();
  v_mi_fila    uuid;
  v_es_titular boolean;
  v_tiene_chip boolean;
  v_ve_todo    boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  IF NOT public.empleado_tiene_rol(p_prestador_id, ARRAY['dueño', 'profesional', 'recepcion']) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  SELECT pe.id INTO v_mi_fila
  FROM prestador_empleados pe
  WHERE pe.prestador_id = p_prestador_id AND pe.user_id = v_uid AND pe.activo;

  SELECT EXISTS (
    SELECT 1 FROM prestadores pr WHERE pr.id = p_prestador_id AND pr.user_id = v_uid
  ) INTO v_es_titular;

  SELECT EXISTS (
    SELECT 1 FROM prestador_empleado_servicios pes WHERE pes.empleado_id = v_mi_fila
  ) INTO v_tiene_chip;

  -- titular o recepcion (definida por AUSENCIA de chip) ven el negocio;
  -- el profesional ve lo suyo — §4 consecuencia 1, intacta.
  v_ve_todo := v_es_titular OR NOT COALESCE(v_tiene_chip, false);

  RETURN QUERY
  SELECT
    c.id,
    c.hora,
    c.duracion_minutos,
    c.estado,
    c.tipo_servicio,
    c.mascota_id,
    m.nombre,
    c.empleado_id,
    p.nombre,           -- (b): el id resuelto a NOMBRE
    c.llegada_en
  FROM evento_cita_servicio c
  LEFT JOIN mascotas m            ON m.id = c.mascota_id
  LEFT JOIN prestador_empleados e ON e.id = c.empleado_id
  LEFT JOIN profiles p            ON p.id = e.user_id
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    -- la agenda solo contiene verdad firme (§13): el hold invisible
    AND c.estado IN ('confirmada', 'en_curso', 'completada', 'no_show')
    AND (v_ve_todo OR c.empleado_id = v_mi_fila)
  ORDER BY c.hora ASC, c.id ASC;
END;
$function$;


-- ── 4. EL ESTADO DE LA SOLICITUD (§7bis) CON SU RELOJ DE 10' ────────
--
-- Hoy la solicitud SE DISPARA Y NADIE VE SU ESTADO ENVEJECER: los tres
-- consumidores vivos de `solicitud_autorizacion_mostrador` son
-- `crear_solicitud_autorizacion`, `responder_solicitud_autorizacion` y
-- `obtener_solicitudes_pendientes_dueno` — **los tres del lado del
-- DUENO o de la escritura. Cero lector del lado del MOSTRADOR.**
-- La recepcionista pide autorizacion y se queda mirando una pantalla que
-- no sabe si el dueno respondio, si falta poco, o si ya vencio.
--
-- EXPIRACION PEREZOSA (§7bis punto 5: "sin cron, la expiracion se evalua
-- en LECTURA"): esta funcion NO escribe — deriva el estado. Una
-- solicitud 'pendiente' con `expira_en <= now()` se REPORTA 'expirada'
-- y la fila queda como esta. Es el mismo patron del hold de 15' y del
-- presupuesto vencido; escribir el vencimiento en lectura convertiria un
-- lector en escritor y pediria su propia veda.

CREATE OR REPLACE FUNCTION public.obtener_solicitudes_mostrador(
  p_cuenta_comercial_id uuid
)
RETURNS TABLE(
  solicitud_id     uuid,
  tipo             text,
  estado           text,
  mascota_id       uuid,
  mascota_nombre   text,
  expira_en        timestamptz,
  segundos_restantes integer,
  respondida_en    timestamptz,
  created_at       timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_prestador uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;

  SELECT pr.id INTO v_prestador
  FROM prestadores pr
  WHERE pr.cuenta_comercial_id = p_cuenta_comercial_id
  LIMIT 1;

  IF v_prestador IS NULL THEN
    RAISE EXCEPTION 'cuenta_no_encontrada' USING ERRCODE = '22023';
  END IF;

  IF NOT public.empleado_tiene_rol(v_prestador, ARRAY['dueño', 'profesional', 'recepcion']) THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.tipo,
    -- estado DERIVADO: la expiracion es perezosa, la fila no se toca
    CASE WHEN s.estado = 'pendiente' AND s.expira_en <= now()
         THEN 'expirada'
         ELSE s.estado
    END,
    s.mascota_id,
    COALESCE(m.nombre, s.payload_alta->>'nombre'),
    s.expira_en,
    -- el reloj, para que la superficie no lo recalcule con la hora del
    -- telefono (que puede estar corrida): lo dice el server. Nunca < 0.
    GREATEST(0, EXTRACT(EPOCH FROM (s.expira_en - now()))::int),
    s.respondida_en,
    s.created_at
  FROM solicitud_autorizacion_mostrador s
  LEFT JOIN mascotas m ON m.id = s.mascota_id
  WHERE s.cuenta_comercial_id = p_cuenta_comercial_id
    AND s.created_at > (now() - interval '24 hours')
  ORDER BY s.created_at DESC;
END;
$function$;


-- ── L-140: proacl explicito en las tres ─────────────────────────────
REVOKE EXECUTE ON FUNCTION public.registrar_llegada(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.registrar_llegada(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.obtener_jornada_recepcion(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_jornada_recepcion(uuid, date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.obtener_solicitudes_mostrador(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_solicitudes_mostrador(uuid) TO authenticated;


-- ── LA BANDA DE CUIDADO ESPECIAL: LUGAR DECLARADO, NO CONSTRUIDO ────
--
-- La agenda de recepcion tiene que poder mostrar la banda de cuidado
-- especial de la mascota que llega (LETRA_CUIDADO_ESPECIAL_S74 §7: la
-- observacion se CUENTA sin camino; la escalada se TRATA con camino).
--
-- NO SE CONSTRUYE ACA, y el porque es que su fuente no existe todavia:
-- D-469 (la construccion del cuidado especial) y D-500 siguen abiertas —
-- hay letra firmada y CERO codigo. Un lector que devolviera la banda hoy
-- tendria que inventar de donde sale, que es exactamente lo que L-139
-- persigue.
--
-- EL LUGAR QUEDA RESERVADO: `obtener_jornada_recepcion` es donde entra,
-- como columna(s) adicionales del mismo RETURNS TABLE — la recepcion ya
-- tiene el permiso (§4 de LETRA_RECEPCION: recepcion ve "la alerta de
-- seguridad del eje 6", decision founder: la recibe en el mostrador y el
-- riesgo es suyo). Cuando D-469 tenga motor, esta funcion se ensancha;
-- no nace un lector paralelo.
