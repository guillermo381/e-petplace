-- ═══════════════════════════════════════════════════════════════════════════
-- LOS CINCO AVISOS DEL VERTICAL DE ADOPCIÓN (S112-D · decisión N3)
--
-- Autor: pista D (S112) · para: pista A (e-petplace-78) — SIN NÚMERO.
-- Reversa: `S112-D-para-A-REVERSA-avisos-adopcion.sql`, ESCRITA ANTES.
-- Arnés:   `S112-D-para-A-ARNES-avisos-adopcion.sql`.
-- 76(g): **NO RIGE** — cero backfill, cero anclas. Sólo catálogo y funciones.
--
-- ╔═════════════════════════════════════════════════════════════════════════╗
-- ║ ① LA DECISIÓN QUE GOBIERNA TODO: `p_mascota_id` ES UNA PALANCA DE      ║
-- ║    GATES, JAMÁS UNA NECESIDAD DE NAVEGACIÓN.                           ║
-- ╚═════════════════════════════════════════════════════════════════════════╝
--
-- Medido en el cuerpo de `registrar_intencion_notificacion` (2-sep): **los dos
-- gates que importan viven bajo el MISMO `IF p_mascota_id IS NOT NULL`**:
--
--   · GATE 1 (memorial) — sólo corre CON mascota.
--   · GATE 3 (rol y acceso) — sólo corre CON mascota, y exige que el
--     destinatario sea familia / codueño / familiar autorizado / prestador con
--     `mascota_acceso_prestador` vigente.
--
-- Y medido en `_user_es_familia_de_mascota`: resuelve por **`familia_miembro`**,
-- no por `mascotas.user_id`. ⇒ **Ni el refugio ni el postulante son «familia»
-- del adoptable antes de la entrega.** Pasar la mascota los descarta a los dos
-- con `descartada_sin_acceso` — *y el descarte no es un error: es una fila
-- `descartada` que se lee como si el motor hubiera funcionado.*
--
-- ⇒ **La palanca no se puede usar para las dos cosas a la vez.** Decisión, aviso
--    por aviso, DECLARADA:
--
--   | aviso                          | mascota | quién protege del memorial |
--   |--------------------------------|---------|----------------------------|
--   | adopcion_solicitud_nueva       |   NO    | ESTA migración (emisor)    |
--   | adopcion_solicitud_respondida  |   NO    | ESTA migración (emisor)    |
--   | adopcion_solicitud_aceptada    |   NO    | ESTA migración (emisor)    |
--   | adopcion_solicitud_declinada   |   NO    | ESTA migración (emisor)    |
--   | adopcion_acta_lista (×2)       |   NO    | ESTA migración (emisor)    |
--   | adopcion_vida_nueva            | **SÍ**  | **GATE 1 del motor**       |
--
-- 🔴 **`adopcion_vida_nueva` ES EL ÚNICO QUE PUEDE LLEVAR LA MASCOTA, Y SÓLO
--    DESPUÉS DEL TRASPASO.** En ese instante la familia YA es familia ⇒ el
--    GATE 3 pasa por derecho y el GATE 1 protege de verdad. **Si se lo llama
--    ANTES de que `traspasar_mascota_a_familia` haya escrito la familia, el
--    aviso se descarta en silencio.** Por eso el emisor **verifica el vínculo
--    y ABORTA con `vida_nueva_sin_traspaso`** en vez de emitir a ciegas: *un
--    aviso que se descarta por orden de llamada es indistinguible de uno que
--    nunca se pidió.*
--
-- ② **A LOS OTROS CINCO EL MEMORIAL LOS APAGA ACÁ, NO EN EL MOTOR.** Sin
--    mascota el GATE 1 **no puede correr**. El predicado es literal el del
--    motor (`estado_vida IS NOT DISTINCT FROM 'activa'`). *No es duplicación
--    por comodidad: es que la ley tiene que vivir donde SÍ corre.*
--
-- ③ **LA VOZ VA CON LA MASCOTA AUNQUE LA INTENCIÓN VAYA SIN ELLA.** Es la misma
--    forma firmada con A para el barrido: `_voz_adopcion(...)` recibe el nombre
--    del animal para poder nombrarlo; `registrar_intencion_notificacion` recibe
--    `NULL`. **Unificarlas trae de vuelta `descartada_sin_acceso`.**
--
-- ④ **LOS EMISORES NO TOCAN EL CUERPO DE NINGUNA FUNCIÓN DE A.** Se llaman con
--    una línea. Ver la tabla de sitios de llamada al final del archivo.
--
-- ⑤ **NADIE PASA EL DESTINATARIO DESDE AFUERA.** Todo emisor recibe SÓLO el id
--    de la solicitud y **deriva** a quién avisar. *Así «que le llegue a un
--    tercero» no es un caso que haya que impedir: es inexpresable.*
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ═══ ① EL CATÁLOGO ═════════════════════════════════════════════════════════
-- Dos de los seis códigos YA EXISTEN (`adopcion_solicitud_nueva`,
-- `adopcion_solicitud_respondida`): los encontré en el catálogo, **mudos y sin
-- productor**. Por la regla del loop («si ya existe, gana la base») NO se
-- tocan: ni su categoría ni su audiencia.
--
-- ⚠️ DIVERGENCIA DECLARADA, NO CURADA: los dos existentes son `relacional`,
--    mientras la casa clasifica los desenlaces de cita como `operacion`
--    (`cita_confirmada`, `cita_rechazada`) y el pedido de trabajo al prestador
--    también (`cita_solicitada`). Medido que hoy **no cambia nada**: las dos
--    categorías arrancan `default_habilitada = true` y con techo 20/24 h. ⇒ es
--    LATENTE. Se declara para que A decida, no se decide acá.
INSERT INTO public.cat_notificacion_tipos
  (codigo, categoria, descripcion, en_sombra, activo, audiencia, canal_forzado, ignora_techo)
VALUES
  ('adopcion_solicitud_aceptada',  'operacion',
   'El refugio aceptó la solicitud de adopción. Va a la familia.',        false, true, 'cliente', NULL, false),
  ('adopcion_solicitud_declinada', 'operacion',
   'El refugio no siguió con la solicitud. Va a la familia.',             false, true, 'cliente', NULL, false),
  ('adopcion_acta_lista',          'operacion',
   'El acta de adopción está lista para firmar. Va a las DOS partes.',    false, true, 'ambas',   NULL, false),
  ('adopcion_vida_nueva',          'relacional',
   'El traspaso se completó: una vida nueva empieza. Va a la familia.',   false, true, 'cliente', NULL, false)
ON CONFLICT (codigo) DO NOTHING;

-- ═══ ② EL RESOLVEDOR — un solo lugar donde se decide QUIÉN es cada parte ════
CREATE OR REPLACE FUNCTION public._adopcion_partes(p_solicitud_id uuid)
RETURNS TABLE (
  solicitud_id        uuid,
  estado              text,
  solicitante_user_id uuid,
  refugio_user_id     uuid,
  refugio_nombre      text,
  mascota_id          uuid,
  mascota_nombre      text,
  mascota_activa      boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.id,
         s.estado,
         s.solicitante_user_id,          -- NULL si la purga ya la anonimizó
         cc.owner_profile_id,
         cc.nombre_comercial,
         m.id,
         m.nombre,
         (m.estado_vida IS NOT DISTINCT FROM 'activa')
    FROM public.adopcion_solicitud s
    JOIN public.adopcion_publicacion p  ON p.id  = s.publicacion_id
    JOIN public.mascotas m              ON m.id  = p.mascota_id
    JOIN public.cuentas_comerciales cc  ON cc.id = p.cuenta_comercial_id
   WHERE s.id = p_solicitud_id;
$$;

-- ═══ ③ LA RUTA — el destino del toque, en UN solo lugar ════════════════════
-- La `ruta` viaja en `datos.ruta` y el despachador la copia al sobre de FCM
-- (`despachar-push/index.ts:256`). **Contrato de la app, medido en
-- `toque-de-push.ts`: interna, arranca con `/`, nunca `//` ni `http`.** Una
-- ruta que no cumpla eso la app la descarta y **no navega** — y lo dice.
--
-- 🔴 HOY NINGÚN PRODUCTOR DE LA CASA EMITE `ruta`: medido, **0 intenciones con
--    la clave** sobre 352. El canal existe de punta a punta y nunca se usó;
--    estos cinco avisos son sus PRIMEROS productores.
--
-- Lado FAMILIA: las tres rutas **existen medidas** en `apps/cliente/src/app`.
-- Lado REFUGIO: **PROPUESTA** — el portal no tiene todavía rutas de adopción
--   (C revirtió el portal). Vive acá y en ningún otro lado justamente para que
--   cambiarla el día que C monte sea **una línea y no cinco**.
--
-- 📌 EL ACTA NO TIENE RUTA PROPIA A PROPÓSITO: apunta al HILO. No es un atajo
--    por no tener pantalla — es la letra del founder: *«cuando el refugio
--    acepta, el hilo mismo me lleva al final: los avisos del animal y el
--    acta.»*
CREATE OR REPLACE FUNCTION public._adopcion_ruta(
  p_tipo text,
  p_lado text,
  p_solicitud_id uuid,
  p_mascota_id uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_tipo = 'adopcion_vida_nueva' THEN '/hogar/mascota/' || p_mascota_id::text
    WHEN p_lado = 'familia'             THEN '/adoptar/solicitud/' || p_solicitud_id::text
    WHEN p_lado = 'refugio'             THEN '/adopcion/solicitud/' || p_solicitud_id::text
    ELSE NULL
  END;
$$;


-- ═══ ④ LA VOZ ══════════════════════════════════════════════════════════════
-- Bilingüe por `user_preferencias.idioma`, con `es` como piso. Devuelve
-- `{titulo, mensaje}` — **los DOS campos exactos que leen los despachadores**
-- (`despachar-push` y `despachar-correo` leen `datos.titulo` / `datos.mensaje`;
-- medido, no supuesto).
--
-- 🔴 LO QUE ESTAS VOCES NO DICEN, y no es estilo:
--   · **No prometen lo que no controlamos.** Ninguna dice cuándo va a responder
--     el refugio, ni que la adopción va a salir.
--   · **La declinada no culpa a nadie ni consuela de más.** Dice el hecho y
--     ofrece lo único cierto: que la conversación queda para leer. *Ofrecerle
--     otro animal a alguien en el minuto en que le dijeron que no convierte un
--     duelo chico en una vidriera.*
--   · **Tuteo, no voseo** (L-148: la voz de producto no hereda el acento de la
--     mesa).
CREATE OR REPLACE FUNCTION public._voz_adopcion(
  p_tipo text, p_user_id uuid, p_mascota_nombre text, p_extra jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_idioma  text;
  v_n       text := nullif(btrim(coalesce(p_mascota_nombre, '')), '');
  v_ref     text := nullif(btrim(coalesce(p_extra->>'refugio', '')), '');
BEGIN
  SELECT up.idioma INTO v_idioma FROM public.user_preferencias up WHERE up.user_id = p_user_id;
  IF v_idioma IS NULL OR v_idioma NOT IN ('es','en') THEN v_idioma := 'es'; END IF;

  IF v_idioma = 'en' THEN
    RETURN CASE p_tipo
      WHEN 'adopcion_solicitud_nueva' THEN jsonb_build_object(
        'titulo',  'You received an adoption application',
        'mensaje', coalesce('Someone wants to adopt ' || v_n || '. ', 'Someone wants to adopt. ')
                   || 'You can read their application and reply.')
      WHEN 'adopcion_solicitud_respondida' THEN jsonb_build_object(
        'titulo',  'The shelter replied to your application',
        'mensaje', coalesce(v_ref || ' wrote to you', 'The shelter wrote to you')
                   || coalesce(' about ' || v_n, '') || '.')
      WHEN 'adopcion_solicitud_aceptada' THEN jsonb_build_object(
        'titulo',  coalesce('Your application for ' || v_n || ' was accepted',
                            'Your application was accepted'),
        'mensaje', 'The next step is reading and signing the adoption agreement.')
      WHEN 'adopcion_solicitud_declinada' THEN jsonb_build_object(
        'titulo',  coalesce('The shelter did not continue with your application for ' || v_n,
                            'The shelter did not continue with your application'),
        'mensaje', 'You can still read the conversation whenever you want.')
      WHEN 'adopcion_acta_lista' THEN jsonb_build_object(
        'titulo',  coalesce(v_n || '''s adoption agreement is ready', 'The adoption agreement is ready'),
        'mensaje', 'You can read it and sign it whenever you want.')
      WHEN 'adopcion_vida_nueva' THEN jsonb_build_object(
        'titulo',  'A new life begins',
        'mensaje', coalesce(v_n || ' is now part of your family. ', 'A new pet is part of your family. ')
                   || 'Their whole history comes along.')
      /* 🔴 SIN `ELSE` INVENTADO: un tipo que esta voz no conoce devuelve `{}` y
         el aviso sale SIN texto — visible, no silencioso. La casa ya eligió
         esta forma en `_voz_notificacion` («no inventa»). */
      ELSE '{}'::jsonb END;
  END IF;

  RETURN CASE p_tipo
    WHEN 'adopcion_solicitud_nueva' THEN jsonb_build_object(
      'titulo',  'Recibiste una solicitud de adopción',
      'mensaje', coalesce('Alguien quiere adoptar a ' || v_n || '. ', 'Alguien quiere adoptar. ')
                 || 'Puedes leer su postulación y responder.')
    WHEN 'adopcion_solicitud_respondida' THEN jsonb_build_object(
      'titulo',  'El refugio respondió tu solicitud',
      'mensaje', coalesce(v_ref || ' te escribió', 'El refugio te escribió')
                 || coalesce(' sobre ' || v_n, '') || '.')
    WHEN 'adopcion_solicitud_aceptada' THEN jsonb_build_object(
      'titulo',  coalesce('Tu solicitud por ' || v_n || ' fue aceptada', 'Tu solicitud fue aceptada'),
      'mensaje', 'El siguiente paso es leer y firmar el acta de adopción.')
    WHEN 'adopcion_solicitud_declinada' THEN jsonb_build_object(
      'titulo',  coalesce('El refugio no siguió con tu solicitud por ' || v_n,
                          'El refugio no siguió con tu solicitud'),
      'mensaje', 'Puedes leer la conversación cuando quieras.')
    WHEN 'adopcion_acta_lista' THEN jsonb_build_object(
      'titulo',  coalesce('El acta de adopción de ' || v_n || ' está lista',
                          'El acta de adopción está lista'),
      'mensaje', 'Puedes leerla y firmarla cuando quieras.')
    WHEN 'adopcion_vida_nueva' THEN jsonb_build_object(
      'titulo',  'Una vida nueva empieza',
      'mensaje', coalesce(v_n || ' ya es parte de tu familia. ', 'Ya es parte de tu familia. ')
                 || 'Su historial viene con ella.')
    ELSE '{}'::jsonb END;
END $$;

-- ═══ ⑤ LOS EMISORES ════════════════════════════════════════════════════════
-- Cinco funciones, una por aviso. Cada una:
--   · recibe SÓLO `p_solicitud_id` y **deriva** el destinatario (ver ⑤ arriba);
--   · devuelve `jsonb` con lo que hizo y **por qué no** cuando no hizo nada —
--     *un emisor que devuelve void es indistinguible de uno que no corrió*;
--   · **jamás lanza por no tener a quién avisar**: eso no es un error del
--     negocio y no puede tumbar la transacción de A. Lanza sólo cuando la
--     llamaron en un momento en que su aviso NO PUEDE ser cierto.

-- ── ①/5 · SOLICITUD RECIBIDA → al refugio ──────────────────────────────────
CREATE OR REPLACE FUNCTION public._avisar_adopcion_solicitud_nueva(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_p record; v_id uuid;
BEGIN
  SELECT * INTO v_p FROM public._adopcion_partes(p_solicitud_id);
  IF v_p IS NULL              THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'solicitud_inexistente'); END IF;
  IF v_p.refugio_user_id IS NULL THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'refugio_sin_persona'); END IF;
  -- 🔴 MEMORIAL: acá, porque sin mascota el GATE 1 no corre (ver ② arriba).
  IF NOT v_p.mascota_activa   THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'memorial'); END IF;

  SELECT public.registrar_intencion_notificacion(
    p_tipo                 => 'adopcion_solicitud_nueva',
    p_destinatario_user_id => v_p.refugio_user_id,
    p_mascota_id           => NULL,          -- 🔴 GATE 3 (ver ① arriba)
    p_evento_id            => NULL,
    p_datos                => public._voz_adopcion('adopcion_solicitud_nueva',
                                v_p.refugio_user_id, v_p.mascota_nombre)
                              || jsonb_build_object(
                                   'solicitud_id', p_solicitud_id,
                                   'ruta', public._adopcion_ruta('adopcion_solicitud_nueva',
                                             'refugio', p_solicitud_id, v_p.mascota_id)),
    p_clave_dedup          => 'adopcion_sol_nueva:' || p_solicitud_id::text)
  INTO v_id;
  RETURN jsonb_build_object('emitido', v_id IS NOT NULL, 'intencion_id', v_id,
                            'motivo', CASE WHEN v_id IS NULL THEN 'ya_existia_dedup' END);
END $$;

-- ── ②/5 · EL REFUGIO RESPONDIÓ → a la familia ──────────────────────────────
-- 📌 UNA SOLA VEZ POR SOLICITUD, no una por mensaje: es la decisión N3
--    («nada de push por cada mensaje»). La clave de dedup **es** esa ley.
CREATE OR REPLACE FUNCTION public._avisar_adopcion_solicitud_respondida(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_p record; v_id uuid;
BEGIN
  SELECT * INTO v_p FROM public._adopcion_partes(p_solicitud_id);
  IF v_p IS NULL                     THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'solicitud_inexistente'); END IF;
  -- La purga de 90 días deja `solicitante_user_id` en NULL: no hay a quién avisar,
  -- y eso NO es una falla — es la privacidad funcionando.
  IF v_p.solicitante_user_id IS NULL THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'solicitud_anonimizada'); END IF;
  IF NOT v_p.mascota_activa          THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'memorial'); END IF;

  SELECT public.registrar_intencion_notificacion(
    p_tipo                 => 'adopcion_solicitud_respondida',
    p_destinatario_user_id => v_p.solicitante_user_id,
    p_mascota_id           => NULL,
    p_evento_id            => NULL,
    p_datos                => public._voz_adopcion('adopcion_solicitud_respondida',
                                v_p.solicitante_user_id, v_p.mascota_nombre,
                                jsonb_build_object('refugio', v_p.refugio_nombre))
                              || jsonb_build_object(
                                   'solicitud_id', p_solicitud_id,
                                   'ruta', public._adopcion_ruta('adopcion_solicitud_respondida',
                                             'familia', p_solicitud_id, v_p.mascota_id)),
    p_clave_dedup          => 'adopcion_sol_resp:' || p_solicitud_id::text)
  INTO v_id;
  RETURN jsonb_build_object('emitido', v_id IS NOT NULL, 'intencion_id', v_id,
                            'motivo', CASE WHEN v_id IS NULL THEN 'ya_existia_dedup' END);
END $$;

-- ── ③/5 · ACEPTADA o DECLINADA → a la familia ──────────────────────────────
-- Un solo emisor, DOS tipos: lee el estado de la solicitud y no lo recibe.
-- *Recibirlo como parámetro dejaría que alguien avisara «aceptada» sobre una
-- solicitud declinada — el aviso y el hecho tienen que salir de la misma fila.*
CREATE OR REPLACE FUNCTION public._avisar_adopcion_cierre(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_p record; v_id uuid; v_tipo text;
BEGIN
  SELECT * INTO v_p FROM public._adopcion_partes(p_solicitud_id);
  IF v_p IS NULL                     THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'solicitud_inexistente'); END IF;
  IF v_p.solicitante_user_id IS NULL THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'solicitud_anonimizada'); END IF;

  v_tipo := CASE v_p.estado
              WHEN 'aceptada'  THEN 'adopcion_solicitud_aceptada'
              WHEN 'declinada' THEN 'adopcion_solicitud_declinada' END;
  /* 🔴 LANZA, no calla: que la llamen con la solicitud todavía abierta
     significa que el sitio de llamada está mal, y un `RETURN` silencioso lo
     dejaría escondido hasta que alguien se preguntara por qué no llegó nada. */
  IF v_tipo IS NULL THEN
    RAISE EXCEPTION 'cierre_sin_desenlace' USING ERRCODE = '22023',
      DETAIL = 'estado = ' || coalesce(v_p.estado, '(null)'),
      HINT   = 'Este emisor se llama DESPUÉS de dejar la solicitud en aceptada o declinada.';
  END IF;

  -- 📌 El memorial NO apaga el desenlace de una solicitud que ya se cerró: la
  --    familia tiene derecho a saber qué pasó con su postulación aunque el
  --    animal haya muerto. *Callar acá dejaría a alguien esperando para
  --    siempre una respuesta que ya existe.* Es la única excepción, y va
  --    declarada.
  SELECT public.registrar_intencion_notificacion(
    p_tipo                 => v_tipo,
    p_destinatario_user_id => v_p.solicitante_user_id,
    p_mascota_id           => NULL,
    p_evento_id            => NULL,
    p_datos                => public._voz_adopcion(v_tipo, v_p.solicitante_user_id,
                                v_p.mascota_nombre, jsonb_build_object('refugio', v_p.refugio_nombre))
                              || jsonb_build_object(
                                   'solicitud_id', p_solicitud_id, 'estado', v_p.estado,
                                   'ruta', public._adopcion_ruta(v_tipo, 'familia',
                                             p_solicitud_id, v_p.mascota_id)),
    p_clave_dedup          => 'adopcion_sol_cierre:' || p_solicitud_id::text)
  INTO v_id;
  RETURN jsonb_build_object('emitido', v_id IS NOT NULL, 'tipo', v_tipo, 'intencion_id', v_id,
                            'motivo', CASE WHEN v_id IS NULL THEN 'ya_existia_dedup' END);
END $$;

-- ── ④/5 · ACTA LISTA → a LAS DOS PARTES ────────────────────────────────────
-- 🔴 DOS INTENCIONES, DOS CLAVES. La clave lleva el `user_id` adentro: con una
--    sola clave para ambos, el `ON CONFLICT DO NOTHING` dejaría entrar la
--    primera y **descartaría la segunda en silencio** — una de las dos partes
--    nunca se enteraría de que tiene que firmar, y la fila diría «ya existía».
CREATE OR REPLACE FUNCTION public._avisar_adopcion_acta_lista(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_p record; v_fam uuid; v_ref uuid;
BEGIN
  SELECT * INTO v_p FROM public._adopcion_partes(p_solicitud_id);
  IF v_p IS NULL            THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'solicitud_inexistente'); END IF;
  IF NOT v_p.mascota_activa THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'memorial'); END IF;

  IF v_p.solicitante_user_id IS NOT NULL THEN
    SELECT public.registrar_intencion_notificacion(
      'adopcion_acta_lista', v_p.solicitante_user_id, NULL, NULL,
      public._voz_adopcion('adopcion_acta_lista', v_p.solicitante_user_id, v_p.mascota_nombre)
        || jsonb_build_object('solicitud_id', p_solicitud_id, 'lado', 'familia',
             'ruta', public._adopcion_ruta('adopcion_acta_lista','familia', p_solicitud_id, v_p.mascota_id)),
      'adopcion_acta:' || p_solicitud_id::text || ':' || v_p.solicitante_user_id::text)
    INTO v_fam;
  END IF;

  IF v_p.refugio_user_id IS NOT NULL THEN
    SELECT public.registrar_intencion_notificacion(
      'adopcion_acta_lista', v_p.refugio_user_id, NULL, NULL,
      public._voz_adopcion('adopcion_acta_lista', v_p.refugio_user_id, v_p.mascota_nombre)
        || jsonb_build_object('solicitud_id', p_solicitud_id, 'lado', 'refugio',
             'ruta', public._adopcion_ruta('adopcion_acta_lista','refugio', p_solicitud_id, v_p.mascota_id)),
      'adopcion_acta:' || p_solicitud_id::text || ':' || v_p.refugio_user_id::text)
    INTO v_ref;
  END IF;

  RETURN jsonb_build_object('familia', v_fam, 'refugio', v_ref,
                            'emitidos', (v_fam IS NOT NULL)::int + (v_ref IS NOT NULL)::int);
END $$;

-- ── ⑤/5 · «UNA VIDA NUEVA EMPIEZA» → a la familia, CON la mascota ──────────
-- 🔴 EL ÚNICO QUE LLEVA `p_mascota_id`, y sólo puede llamarse DESPUÉS del
--    traspaso. Ver ① de la cabecera: antes del traspaso el GATE 3 lo descarta
--    en silencio, así que el emisor **verifica el vínculo y aborta**.
CREATE OR REPLACE FUNCTION public._avisar_adopcion_vida_nueva(p_solicitud_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_p record; v_id uuid;
BEGIN
  SELECT * INTO v_p FROM public._adopcion_partes(p_solicitud_id);
  IF v_p IS NULL                     THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'solicitud_inexistente'); END IF;
  IF v_p.solicitante_user_id IS NULL THEN RETURN jsonb_build_object('emitido', false, 'motivo', 'solicitud_anonimizada'); END IF;

  IF NOT public._user_es_familia_de_mascota(v_p.mascota_id, v_p.solicitante_user_id) THEN
    RAISE EXCEPTION 'vida_nueva_sin_traspaso' USING ERRCODE = '22023',
      DETAIL = 'El adoptante todavía no es familia de la mascota.',
      HINT   = 'Este emisor va DESPUÉS de traspasar_mascota_a_familia, en la misma transacción.';
  END IF;

  /* Acá SÍ va la mascota: el GATE 3 pasa por derecho y el GATE 1 protege de
     verdad. **El memorial no se chequea acá a propósito** — que lo apague el
     motor es lo que hace que el arnés pueda probar que el GATE 1 funciona. */
  SELECT public.registrar_intencion_notificacion(
    p_tipo                 => 'adopcion_vida_nueva',
    p_destinatario_user_id => v_p.solicitante_user_id,
    p_mascota_id           => v_p.mascota_id,
    p_evento_id            => NULL,
    p_datos                => public._voz_adopcion('adopcion_vida_nueva',
                                v_p.solicitante_user_id, v_p.mascota_nombre,
                                jsonb_build_object('refugio', v_p.refugio_nombre))
                              || jsonb_build_object(
                                   'solicitud_id', p_solicitud_id,
                                   'mascota_id', v_p.mascota_id,
                                   'procedencia', v_p.refugio_nombre,
                                   'ruta', public._adopcion_ruta('adopcion_vida_nueva',
                                             'familia', p_solicitud_id, v_p.mascota_id)),
    p_clave_dedup          => 'adopcion_vida_nueva:' || p_solicitud_id::text)
  INTO v_id;
  RETURN jsonb_build_object('emitido', v_id IS NOT NULL, 'intencion_id', v_id,
                            'motivo', CASE WHEN v_id IS NULL THEN 'ya_existia_dedup' END);
END $$;

-- ═══ ⑥ L-140 · NINGUNA FUNCIÓN NUEVA NACE ALCANZABLE DESDE AFUERA ══════════
-- Los DEFINER de esta migración escriben avisos: si `anon` o `authenticated`
-- pudieran llamarlos, cualquiera con la clave del bundle podría **fabricar
-- avisos a nombre de un refugio**. Se llaman desde adentro de las funciones de
-- A (que son DEFINER y corren como su dueño), así que revocarlos no les quita
-- nada a los sitios de llamada legítimos.
REVOKE ALL ON FUNCTION public._adopcion_partes(uuid)                       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._adopcion_ruta(text, text, uuid, uuid)       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._voz_adopcion(text, uuid, text, jsonb)       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._avisar_adopcion_solicitud_nueva(uuid)       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._avisar_adopcion_solicitud_respondida(uuid)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._avisar_adopcion_cierre(uuid)                FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._avisar_adopcion_acta_lista(uuid)            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._avisar_adopcion_vida_nueva(uuid)            FROM PUBLIC, anon, authenticated;

-- ═══ ⑦ CINTURÓN — corre DENTRO de la migración y la aborta ═════════════════
DO $$
DECLARE
  v_faltan_cat  text[];
  v_faltan_fn   text[];
  v_abierta     text[];
  v_voz_conoce  int;
  v_voz_inventa jsonb;
BEGIN
  -- (a) Los SEIS códigos del vertical, en el catálogo y activos.
  SELECT array_agg(c ORDER BY c) INTO v_faltan_cat
    FROM unnest(ARRAY['adopcion_solicitud_nueva','adopcion_solicitud_respondida',
                      'adopcion_solicitud_aceptada','adopcion_solicitud_declinada',
                      'adopcion_acta_lista','adopcion_vida_nueva']) c
   WHERE NOT EXISTS (SELECT 1 FROM public.cat_notificacion_tipos t WHERE t.codigo = c AND t.activo);
  IF v_faltan_cat IS NOT NULL THEN
    RAISE EXCEPTION 'cinturon: faltan tipos en el catalogo: %', array_to_string(v_faltan_cat, ', ');
  END IF;

  -- (b) Los CINCO emisores existen.
  SELECT array_agg(f ORDER BY f) INTO v_faltan_fn
    FROM unnest(ARRAY['_avisar_adopcion_solicitud_nueva','_avisar_adopcion_solicitud_respondida',
                      '_avisar_adopcion_cierre','_avisar_adopcion_acta_lista',
                      '_avisar_adopcion_vida_nueva']) f
   WHERE to_regprocedure('public.' || f || '(uuid)') IS NULL;
  IF v_faltan_fn IS NOT NULL THEN
    RAISE EXCEPTION 'cinturon: faltan emisores: %', array_to_string(v_faltan_fn, ', ');
  END IF;

  -- (c) L-140 de verdad: ninguna quedó alcanzable por anon.
  SELECT array_agg(f ORDER BY f) INTO v_abierta
    FROM unnest(ARRAY['_adopcion_partes(uuid)','_voz_adopcion(text,uuid,text,jsonb)',
                      '_avisar_adopcion_solicitud_nueva(uuid)','_avisar_adopcion_solicitud_respondida(uuid)',
                      '_avisar_adopcion_cierre(uuid)','_avisar_adopcion_acta_lista(uuid)',
                      '_avisar_adopcion_vida_nueva(uuid)']) f
   WHERE has_function_privilege('anon', 'public.' || f, 'EXECUTE');
  IF v_abierta IS NOT NULL THEN
    RAISE EXCEPTION 'cinturon L-140: anon alcanza %', array_to_string(v_abierta, ', ');
  END IF;

  -- (d) 🔴 LA VOZ DISCRIMINA — control positivo Y negativo, porque un `{}`
  --     puede ser «no conozco el tipo» o «la función está rota». Sin el par,
  --     un cinturón que sólo mira los seis conocidos daría verde con una voz
  --     que devuelve texto para CUALQUIER cosa.
  SELECT count(*) INTO v_voz_conoce
    FROM unnest(ARRAY['adopcion_solicitud_nueva','adopcion_solicitud_respondida',
                      'adopcion_solicitud_aceptada','adopcion_solicitud_declinada',
                      'adopcion_acta_lista','adopcion_vida_nueva']) c
   WHERE public._voz_adopcion(c, NULL, 'Luna') ? 'titulo';
  IF v_voz_conoce <> 6 THEN
    RAISE EXCEPTION 'cinturon: la voz conoce % de 6 codigos', v_voz_conoce;
  END IF;

  v_voz_inventa := public._voz_adopcion('tipo_que_no_existe_nunca', NULL, 'Luna');
  IF v_voz_inventa <> '{}'::jsonb THEN
    RAISE EXCEPTION 'cinturon: la voz INVENTA texto para un tipo desconocido: %', v_voz_inventa;
  END IF;

  RAISE NOTICE 'cinturon avisos-adopcion: VERDE (6 tipos, 5 emisores, L-140 en 0, voz 6/6 y no inventa)';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📌 DÓNDE VA CADA LLAMADA — para A. Una línea por sitio; ningún cuerpo de
--    función de A cambia de forma.
--
--   | emisor                                  | va en                                  | cuándo |
--   |-----------------------------------------|----------------------------------------|--------|
--   | _avisar_adopcion_solicitud_nueva        | crear_solicitud_adopcion (A7)          | al final, con la solicitud ya insertada |
--   | _avisar_adopcion_solicitud_respondida   | responder_solicitud_adopcion           | sólo cuando el autor es el REFUGIO; la dedup lo vuelve una vez |
--   | _avisar_adopcion_cierre                 | cerrar_solicitud_adopcion              | DESPUÉS del UPDATE del estado (lee la fila, no el parámetro) |
--   | _avisar_adopcion_acta_lista             | el mismo acto que deja el acta lista (A9) | una vez; emite DOS intenciones |
--   | _avisar_adopcion_vida_nueva             | firmar_acta_adopcion (A9), segunda firma | DESPUÉS de traspasar_mascota_a_familia, misma transacción |
--
--   Forma: `PERFORM public._avisar_adopcion_solicitud_nueva(v_solicitud_id);`
--
-- ⚠️ DOS AVISOS DEL VERTICAL **NO** TIENEN SITIO DE LLAMADA TODAVÍA, y es
--    porque su función no existe: `adopcion_acta_lista` y `adopcion_vida_nueva`
--    esperan a A9. **Quedan construidos y sin puerta, declarado.** El arnés los
--    ejerce igual, llamándolos a mano.
-- ═══════════════════════════════════════════════════════════════════════════
