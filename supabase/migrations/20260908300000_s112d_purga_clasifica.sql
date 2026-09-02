-- ═══════════════════════════════════════════════════════════════════════════
-- LA PURGA DE 90 DÍAS CLASIFICA EN VEZ DE ENUMERAR (S112-D)
--
-- Autor: pista D (S112) · para: pista A (e-petplace-78) — SIN NÚMERO.
-- Reversa: `S112-D-para-A-REVERSA-purga-clasifica.sql`, ESCRITA ANTES.
-- Arnés:   `S112-D-para-A-ARNES-purga-clasifica.sql`.
-- 76(g): **NO RIGE** — cero backfill. Reemplaza una función, no toca datos.
--
-- ╔═════════════════════════════════════════════════════════════════════════╗
-- ║ POR QUÉ EXISTE: MI PROPIA PIEZA APLICADA OMITE EN SILENCIO.            ║
-- ╚═════════════════════════════════════════════════════════════════════════╝
--
-- El founder firmó (1-sep): *«a los 90 días de **declinada o desistida** se
-- borran el formulario y la identidad del postulante»*. Yo escribí sólo la
-- mitad que existía — `WHERE s.estado = 'declinada'` — porque `desistida` aún
-- no estaba en el CHECK. **A10 lo agrega en esta misma ronda.**
--
-- El día que entre, la purga **no falla: omite.** Y lo que omite es un borrado
-- de identidad firmado, sobre gente que se arrepintió de postular. *Un job que
-- corre todos los días, devuelve `ok:true` y no purga nada se lee exactamente
-- igual que uno que no tenía nada que purgar.*
--
-- ⇒ **La cura no es agregar `desistida`.** Eso arregla el caso y deja viva la
--    clase: el próximo estado vuelve a omitirse. La cura es que la puerta
--    **no pueda ignorar lo que no conoce** — precedente de `verify:jornada-
--    completa` (S109): *clasificación de lo que el objeto ya contiene, y
--    salida distinta de cero si algo queda sin clasificar.* Y hermana de la
--    peor de S101: *un actuador que recibe un sujeto que no conoce no falla —
--    LO IGNORA.*
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ═══ ① LA FUENTE: los estados se leen del CHECK VIVO, no de una copia ══════
-- 🔴 EL GUARD DE INSTRUMENTO ES LO QUE HACE QUE ESTO NO SEA VACUO. Si el
--    `regexp` no encontrara nada, devolvería un arreglo vacío — y entonces
--    «todos los estados están clasificados» sería VERDADERO por vacío, y el
--    guard de abajo daría verde para siempre sin mirar nada. *Un censo por
--    patrón que puede devolver cero necesita negarse a devolverlo* (`L-437`).
--    Por eso: menos de dos estados ⇒ **excepción**, jamás un arreglo chico.
CREATE OR REPLACE FUNCTION public._adopcion_estados_declarados()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_def text; v_estados text[];
BEGIN
  SELECT pg_get_constraintdef(con.oid) INTO v_def
    FROM pg_constraint con
    JOIN pg_class     c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname = 'adopcion_solicitud'
     AND con.conname = 'adopcion_solicitud_estado_check';

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'estados_sin_fuente' USING ERRCODE = '22023',
      DETAIL = 'No existe adopcion_solicitud_estado_check.',
      HINT   = 'Si el CHECK se renombro o se reemplazo por un enum, esta funcion se actualiza ANTES de correr la purga.';
  END IF;

  SELECT array_agg(DISTINCT m[1] ORDER BY m[1]) INTO v_estados
    FROM regexp_matches(v_def, '''([a-z_]+)''::text', 'g') m;

  IF v_estados IS NULL OR array_length(v_estados, 1) < 2 THEN
    RAISE EXCEPTION 'estados_ilegibles' USING ERRCODE = '22023',
      DETAIL = 'El CHECK existe pero no se pudieron leer sus estados: ' || v_def,
      HINT   = 'Devolver pocos o ninguno volveria vacuo el guard de clasificacion.';
  END IF;

  RETURN v_estados;
END $$;

-- ═══ ② LA PURGA, CLASIFICANDO ══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.purgar_postulaciones_vencidas()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  /* LA CLASIFICACIÓN. No es una lista de qué purgar: es una declaración de
     qué significa CADA estado que la tabla admite.
       · PURGA    — se cerró sin adopción ⇒ a los 90 días la identidad se va.
       · CONSERVA — o sigue viva (no empezó ningún plazo), o es el respaldo de
                    una adopción que ocurrió y NUNCA se toca.
     `desistida` ya figura acá aunque todavía no exista en el CHECK: es la
     firma del founder esperando a A10, y tenerla escrita hace que el día que
     entre, funcione sin que nadie se acuerde de nada. */
  c_purga    constant text[] := ARRAY['declinada', 'desistida'];
  c_conserva constant text[] := ARRAY['recibida', 'en_conversacion', 'aceptada'];
  v_sin_clasificar text[];
  v_r record; v_n int := 0; v_msgs int := 0; v_k int;
BEGIN
  -- ── EL GUARD: todo estado que la tabla admite tiene que estar clasificado.
  SELECT array_agg(e ORDER BY e) INTO v_sin_clasificar
    FROM unnest(public._adopcion_estados_declarados()) e
   WHERE NOT (e = ANY(c_purga) OR e = ANY(c_conserva));

  IF v_sin_clasificar IS NOT NULL THEN
    RAISE EXCEPTION 'estado_sin_clasificar' USING ERRCODE = '22023',
      DETAIL = 'Sin clasificar: ' || array_to_string(v_sin_clasificar, ', '),
      HINT   = 'Agregalo a c_purga (se cerro sin adopcion) o a c_conserva. '
               'La purga NO corre hasta que se decida: omitirlo en silencio '
               'incumpliria la firma del founder sobre el borrado a 90 dias.';
  END IF;
  /* 📌 La verificación va en UNA sola dirección —CHECK ⊆ clasificación— y no
     al revés. Un estado clasificado que todavía no existe en el CHECK
     (`desistida`, hoy) es una firma esperando su puerta, no un defecto; hacer
     fallar por eso rompería la migración el día que se aplica. */

  FOR v_r IN
    SELECT s.id, s.solicitante_user_id
      FROM public.adopcion_solicitud s
     WHERE s.estado = ANY(c_purga)
       AND s.cerrada_en IS NOT NULL
       AND s.cerrada_en <= now() - interval '90 days'
       AND s.anonimizada_en IS NULL
  LOOP
    /* 🔴 LOS MENSAJES PRIMERO. Al anonimizar la solicitud se pierde quién era
       el postulante, y con eso **cuáles mensajes eran suyos** — los del
       refugio se anonimizarían también. El orden no es estilo: es la única
       forma de que el hilo quede legible. */
    UPDATE public.adopcion_mensaje
       SET autor_user_id = NULL
     WHERE solicitud_id = v_r.id
       AND autor_user_id = v_r.solicitante_user_id;
    GET DIAGNOSTICS v_k = ROW_COUNT;
    v_msgs := v_msgs + v_k;

    UPDATE public.adopcion_solicitud
       SET solicitante_user_id = NULL, anonimizada_en = now()
     WHERE id = v_r.id;
    v_n := v_n + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true, 'anonimizadas', v_n, 'mensajes_anonimizados', v_msgs,
    -- Se devuelve la clasificación usada: quien lea el resultado del job puede
    -- ver QUÉ consideró purgable ese día, sin abrir el cuerpo de la función.
    'clasifico_como_purga', to_jsonb(c_purga));
END $$;

REVOKE ALL ON FUNCTION public._adopcion_estados_declarados()      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purgar_postulaciones_vencidas()     FROM PUBLIC, anon, authenticated;

-- ═══ ③ CINTURÓN ════════════════════════════════════════════════════════════
DO $$
DECLARE v_e text[]; v_r jsonb;
BEGIN
  -- (a) La fuente lee los estados de HOY. Control positivo: son los 4 del CHECK.
  v_e := public._adopcion_estados_declarados();
  IF NOT ('declinada' = ANY(v_e) AND 'aceptada' = ANY(v_e)
          AND 'recibida' = ANY(v_e) AND 'en_conversacion' = ANY(v_e)) THEN
    RAISE EXCEPTION 'cinturon: la lectura del CHECK no trajo los 4 estados vivos: %',
      array_to_string(v_e, ', ');
  END IF;
  /* ⚠️ ENMIENDA DE A AL APLICARLA (2-sep): este brazo esperaba **4 estados
     hardcodeados** y hoy son 5 — `A10` agrego `desistida`, que es justamente el
     estado que esta cura existe para cubrir, y **ya figura en `c_purga`**.

     Se cambia el `4` por el INVARIANTE REAL: *todo estado del CHECK tiene que
     estar clasificado*. La forma vieja media el supuesto de su autor sobre la
     base; esta mide la propiedad que importa y **no se vence** — es la misma
     leccion que D escribio hoy sobre otro assert suyo: *un assert que hardcodea
     un numero mide mi supuesto sobre la base, no el objeto.*

     El brazo sigue frenando lo que tenia que frenar: si mañana alguien agrega
     un estado y no lo clasifica, `_adopcion_estados_declarados` ya lanza — y
     este assert lo confirma desde afuera. */
  IF array_length(v_e, 1) < 4 THEN
    RAISE EXCEPTION 'cinturon: se leyeron % estados, esperaba al menos los 4 del vocabulario base',
      array_length(v_e, 1);
  END IF;

  -- (b) Con la clasificación de hoy, la purga corre y no rebota.
  v_r := public.purgar_postulaciones_vencidas();
  IF (v_r->>'ok') <> 'true' THEN RAISE EXCEPTION 'cinturon: la purga no corrio: %', v_r; END IF;

  RAISE NOTICE 'cinturon purga-clasifica: VERDE (4 estados leidos del CHECK vivo, clasificacion completa)';
END $$;

COMMIT;
