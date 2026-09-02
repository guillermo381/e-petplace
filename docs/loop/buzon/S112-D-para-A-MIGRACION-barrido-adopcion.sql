/* ═══════════════════════════════════════════════════════════════════════════
   S112-D · EL BARRIDO DIARIO DE ADOPCIÓN — una corrida, dos brazos.
   ═══════════════════════════════════════════════════════════════════════════

   🔴 **SIN NÚMERO A PROPÓSITO.** No tomo números de migración: dos veces en un
   día chocaron dos pistas y `db push` dijo `up to date` **sin aplicar una
   línea** (S108). **El número lo pone A al aplicar**, y corre `verify:censo`.

   **NO LA APLIQUÉ.** Toda la evidencia salió de correr este mismo archivo
   dentro de una transacción que termina en `ROLLBACK`
   (`S112-D-para-A-ARNES-barrido-adopcion.sql`) ⇒ **lo que se probó es ESTE
   texto, no una copia suya.**

   **Reversa:** `S112-D-para-A-REVERSA-barrido-adopcion.sql`, **escrita ANTES**.
   Declara lo único que importa: **la anonimización NO se deshace**, y su
   `SET NOT NULL` **puede fallar a propósito** si alguna fila ya se purgó.

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   Una columna nueva vacía, dos `DROP NOT NULL`, un CHECK, un trigger y cuatro
   funciones. **CERO BACKFILL.** Medido al escribir: `adopcion_solicitud` y
   `adopcion_mensaje` en **0 filas**, así que el CHECK nace sin nada que violar.

   ═══════════════════════════════════════════════════════════════════════════
   🔴 LOS TRES HALLAZGOS QUE LE DAN ESTA FORMA — medidos, no supuestos
   ═══════════════════════════════════════════════════════════════════════════

   **① `p_mascota_id` VA EN NULL, Y ES LA LÍNEA MÁS IMPORTANTE DEL ARCHIVO.**
   `registrar_intencion_notificacion` tiene un **GATE 3 · ROL Y ACCESO**: si le
   pasás una mascota, exige que el destinatario sea familia, familiar autorizado
   o prestador con acceso. **El postulante de una adopción no es ninguna de las
   tres** — el animal es del refugio. ⇒ pasarle la mascota devuelve
   **`descartada_sin_acceso`** y *la familia nunca recibe el aviso.*

   > ### El gate que protege a todos los demás verticales es exactamente el que rompe a éste, y **no falla: descarta en silencio.**

   **Su consecuencia obligada, y por eso el memorial se excluye ACÁ:** el
   **GATE 1 (memorial)** de esa misma función **sólo corre si hay mascota**.
   Con `NULL` no corre ⇒ **la exclusión del memorial es responsabilidad de esta
   consulta**, y va en el `WHERE`. *No es redundancia con el motor de avisos: es
   la mitad que el motor deja de hacer cuando le sacás la mascota.*

   ⚠️ **El nombre del animal SÍ viaja** — por `p_datos`, resuelto acá. No es un
   rodeo del gate: el gate protege el **acceso al expediente**, y el nombre del
   animal **ya está en la vidriera pública** que esta persona miró para postular.

   **② «UNA SOLA VEZ»: SE CABLEA `aviso_silencio_emitido_en`, SE RETIRA EL DEL
   MÓDULO.** Había dos mecanismos y ninguno corría. El del módulo TS
   (`avisosDe` → clave `adopcion_sin_respuesta:<id>`) **no está en este camino**:
   el barrido es SQL y nunca lo llama. ⇒ **se cablea la columna**, que además es
   lo único que impide que la consulta devuelva la misma fila **todos los días
   para siempre**.
   🔑 Y debajo queda el **piso de la casa**: `notificacion_intencion` tiene
   `UNIQUE (clave_dedup)` y `ON CONFLICT DO NOTHING`. **Son las dos capas de
   `L-424`: el índice, que no se puede saltear, y la marca, que explica.**
   *(Lo que hay que retirar del módulo va en el reporte, no acá: `packages/api`
   y `packages/mensajeria` no se tocan desde una migración.)*

   **③ EL BORRADO A 90 DÍAS BORRA LA IDENTIDAD, NO EL HILO.** Firma del founder.
   El hilo **queda entero y anónimo** — es material de una disputa, y la reversa
   del motor de S111 ya declaraba que dropearlo lo destruye.
   ⚠️ **`declinada` y «desistida» son LA MISMA FILA:** medido, `adopcion_solicitud`
   **no tiene `cerrada_por`**, así que la base no distingue quién cerró. **No es
   un problema para esta regla** —las dos reciben el mismo trato— *pero nadie
   puede escribir después un informe de «cuántas desistió la familia».*
   ⚠️ **«El formulario» NO TIENE TABLA**: medido, cero tablas `%formulario%`.
   Hoy no hay nada que borrar ahí. **Cuando exista, su purga entra en este mismo
   brazo** — y este comentario es el que va a decírselo a quien la construya.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① EL ESTADO ANÓNIMO, HECHO INEXPRESABLE AL REVÉS ═════════════════════
ALTER TABLE public.adopcion_solicitud ADD COLUMN anonimizada_en timestamptz;
ALTER TABLE public.adopcion_solicitud ALTER COLUMN solicitante_user_id DROP NOT NULL;
ALTER TABLE public.adopcion_mensaje   ALTER COLUMN autor_user_id       DROP NOT NULL;

/* 🔑 El CHECK cierra las DOS direcciones, y la segunda es la que importa:
   «anonimizada pero con la identidad todavía puesta» —una purga que corrió a
   medias— **no se puede escribir**. *Un estado malo que el esquema no admite no
   necesita que nadie se acuerde de revisarlo.* */
ALTER TABLE public.adopcion_solicitud ADD CONSTRAINT chk_identidad_xor_anonima CHECK (
      (solicitante_user_id IS NOT NULL AND anonimizada_en IS NULL)
   OR (solicitante_user_id IS NULL     AND anonimizada_en IS NOT NULL));

/* 🔴 `autor_user_id` quedó nullable SÓLO para poder anonimizar después. Un
   mensaje **nace** con autor, siempre: sin esto, `DROP NOT NULL` abriría la
   puerta a un hilo sin autores desde el minuto uno. */
CREATE OR REPLACE FUNCTION public._adopcion_mensaje_nace_con_autor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.autor_user_id IS NULL THEN
    RAISE EXCEPTION 'mensaje_sin_autor' USING ERRCODE='22023',
      HINT='El NULL de autor_user_id es SÓLO para anonimizar una solicitud purgada.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_adopcion_mensaje_nace_con_autor
  BEFORE INSERT ON public.adopcion_mensaje
  FOR EACH ROW EXECUTE FUNCTION public._adopcion_mensaje_nace_con_autor();

-- ══ ② LA VOZ — firma del founder ═════════════════════════════════════════
/* 🔴 **NO se toca `_voz_notificacion`.** Son 30.107 caracteres de `CASE`
   compartido; reescribirlo entero desde un worktree que no puede aplicar ni
   medir el resultado es **cómo se pisa el trabajo de otra pista**. Esta función
   es el asiento de la voz hasta que A la pliegue allá — el bloque exacto va en
   la evidencia. Su `ELSE` devuelve `{}` («sin voz firmada: NO INVENTA»), así
   que hoy este tipo saldría **mudo** si dependiera de él. */
CREATE OR REPLACE FUNCTION public._voz_adopcion_sin_respuesta(
  p_user_id uuid, p_mascota_nombre text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_idioma text; v_n text := nullif(btrim(coalesce(p_mascota_nombre,'')), '');
BEGIN
  SELECT up.idioma INTO v_idioma FROM user_preferencias up WHERE up.user_id = p_user_id;
  IF v_idioma IS NULL OR v_idioma NOT IN ('es','en') THEN v_idioma := 'es'; END IF;

  /* ═══ LO QUE ESTA VOZ NO PUEDE DECIR, y no es estilo ═══════════════════
     🔴 **«todavía no respondió», JAMÁS «incumplió».** Son dos relojes con dos
     dueños: **los 5 días son de la familia** —su derecho a saber— y el máximo
     contractual **es otro número y es del contrato con el refugio**. A los 5
     días el refugio **no incumplió nada**: sigue dentro de su plazo.
     *Una app que dice «incumplió» emite un veredicto contractual que ningún
     contrato respalda, contra la única parte que no está para contestarlo.*
     ⇒ **la verdad la decimos nosotros; el veredicto no es nuestro.**
     Tampoco promete respuesta, ni ofrece camino que no existe (no hay reclamo
     ni cancelación automática). El cinturón de abajo lo vigila. */
  RETURN CASE WHEN v_idioma = 'en' THEN jsonb_build_object(
    'titulo',  'The shelter hasn''t answered your application yet',
    'mensaje', coalesce('It has been 5 days since you applied for ' || v_n || '. ',
                        'It has been 5 days since you applied. ')
               || 'Your application is still open.')
  ELSE jsonb_build_object(
    'titulo',  'El refugio todavía no respondió tu solicitud',
    'mensaje', coalesce('Pasaron 5 días desde que postulaste por ' || v_n || '. ',
                        'Pasaron 5 días desde que postulaste. ')
               || 'Tu solicitud sigue abierta.') END;
END $$;

-- ══ ③ BRAZO (a) · EL RELOJ DE 5 DÍAS ═════════════════════════════════════
CREATE OR REPLACE FUNCTION public.avisar_adopcion_sin_respuesta()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_r record; v_n int := 0; v_saltadas int := 0;
BEGIN
  FOR v_r IN
    /* 🔑 Se REUSA `obtener_solicitudes_en_silencio()`, que ya trae sus dos
       controles del cinturón de S111 (la automática no apaga el reloj; una
       respuesta real sí). *Reescribir su `WHERE` acá sería una segunda ley que
       puede diverger de la que ya está probada.* */
    SELECT x.solicitud_id, x.solicitante_user_id, m.nombre AS mascota_nombre
      FROM public.obtener_solicitudes_en_silencio() x
      JOIN public.adopcion_publicacion p ON p.id = x.publicacion_id
      JOIN public.mascotas m             ON m.id = p.mascota_id
     /* 🔴 EXCLUSIÓN DE MEMORIAL — acá y no en el motor de avisos, porque con
        `p_mascota_id => NULL` el GATE 1 no corre (ver ① de la cabecera).
        Mismo predicado que usa `registrar_intencion_notificacion`, literal. */
     WHERE m.estado_vida IS NOT DISTINCT FROM 'activa'
  LOOP
    PERFORM public.registrar_intencion_notificacion(
      p_tipo                 => 'adopcion_sin_respuesta',
      p_destinatario_user_id => v_r.solicitante_user_id,
      p_mascota_id           => NULL,   -- 🔴 GATE 3: ver ① de la cabecera
      p_evento_id            => NULL,
      p_datos                => public._voz_adopcion_sin_respuesta(
                                  v_r.solicitante_user_id, v_r.mascota_nombre)
                                || jsonb_build_object('solicitud_id', v_r.solicitud_id),
      /* El piso: `UNIQUE (clave_dedup)` + `ON CONFLICT DO NOTHING`. */
      p_clave_dedup          => 'adopcion_sin_respuesta:' || v_r.solicitud_id::text);

    /* 🔴 SELLAR Y AVISAR SON UN SOLO ACTO. Sin este UPDATE la consulta devuelve
       la misma fila **todos los días para siempre** — hoy sin síntoma porque el
       reloj nunca corrió. El arnés lo prueba quitándolo. */
    UPDATE public.adopcion_solicitud
       SET aviso_silencio_emitido_en = now()
     WHERE id = v_r.solicitud_id;
    v_n := v_n + 1;
  END LOOP;

  /* Cuántas quedaron afuera POR MEMORIAL: un contador que puede subir es la
     única forma de saber que la exclusión está viva y no de adorno. */
  SELECT count(*) INTO v_saltadas
    FROM public.obtener_solicitudes_en_silencio() x
    JOIN public.adopcion_publicacion p ON p.id = x.publicacion_id
    JOIN public.mascotas m             ON m.id = p.mascota_id
   WHERE m.estado_vida IS DISTINCT FROM 'activa';

  RETURN jsonb_build_object('ok', true, 'avisadas', v_n, 'saltadas_memorial', v_saltadas);
END $$;

-- ══ ④ BRAZO (b) · LOS 90 DÍAS ════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.purgar_postulaciones_vencidas()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
DECLARE v_r record; v_n int := 0; v_msgs int := 0; v_k int;
BEGIN
  FOR v_r IN
    SELECT s.id, s.solicitante_user_id
      FROM public.adopcion_solicitud s
     /* 🔴 `declinada` Y NADA MÁS. **La concretada (`aceptada`) NUNCA se toca**:
        es el respaldo de una adopción que ocurrió. Y las vivas (`recibida`,
        `en_conversacion`) tampoco: no hay plazo que haya empezado a correr. */
     WHERE s.estado = 'declinada'
       AND s.cerrada_en IS NOT NULL
       AND s.cerrada_en <= now() - interval '90 days'
       /* 🔑 LA IDEMPOTENCIA. La segunda corrida no la ve. */
       AND s.anonimizada_en IS NULL
  LOOP
    /* 🔴 EL ORDEN NO ES ESTILO: primero los mensajes, después la solicitud.
       Al revés, `solicitante_user_id` ya sería NULL y **no habría con qué
       saber cuáles mensajes eran suyos** — los del refugio se anonimizarían
       también, o ninguno. */
    UPDATE public.adopcion_mensaje
       SET autor_user_id = NULL
     WHERE solicitud_id = v_r.id
       AND autor_user_id = v_r.solicitante_user_id;
    GET DIAGNOSTICS v_k = ROW_COUNT;
    v_msgs := v_msgs + v_k;

    /* El hilo NO se borra: queda entero y anónimo. Append-only intacto —
       ninguna fila de `adopcion_mensaje` desaparece acá. */
    UPDATE public.adopcion_solicitud
       SET solicitante_user_id = NULL, anonimizada_en = now()
     WHERE id = v_r.id;
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'anonimizadas', v_n, 'mensajes_anonimizados', v_msgs);
END $$;

-- ══ ⑤ UNA CORRIDA, DOS BRAZOS ════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.barrer_adopcion_diario()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $$
BEGIN
  RETURN jsonb_build_object(
    'ok', true,
    'reloj', public.avisar_adopcion_sin_respuesta(),
    'purga', public.purgar_postulaciones_vencidas());
END $$;

-- ══ ⑥ L-140 ══════════════════════════════════════════════════════════════
/* Ninguna es superficie: son de OPERACIÓN. Fuera de `authenticated` también. */
REVOKE EXECUTE ON FUNCTION public.barrer_adopcion_diario()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.avisar_adopcion_sin_respuesta() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purgar_postulaciones_vencidas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._voz_adopcion_sin_respuesta(uuid, text) FROM PUBLIC, anon, authenticated;

-- ══ ⑦ EL RELOJ DE LA CASA ════════════════════════════════════════════════
/* 09:00 Guayaquil (UTC-5). No pisa a `avisar-renovacion-guarderia` (0 13) ni a
   `renovar-mensualidades-guarderia` (0 8): un barrido que arranca mientras otro
   escribe es cómo se leen estados a medio mover. */
SELECT cron.schedule('barrer-adopcion-diario', '0 14 * * *',
                     $cron$SELECT public.barrer_adopcion_diario();$cron$);

-- ══ ⑧ CINTURÓN — el rojo primero ═════════════════════════════════════════
DO $cint$
DECLARE v_voz jsonb; v_n int;
BEGIN
  -- la voz dice lo firmado…
  v_voz := public._voz_adopcion_sin_respuesta(NULL, 'Thor');
  IF v_voz->>'titulo' <> 'El refugio todavía no respondió tu solicitud' THEN
    RAISE EXCEPTION 'CINTURON: la voz no es la firmada (%)', v_voz->>'titulo';
  END IF;
  -- …y NO dice lo prohibido, en los dos idiomas y en título y cuerpo
  IF (v_voz::text ILIKE '%incumpl%' OR v_voz::text ILIKE '%mora%'
   OR v_voz::text ILIKE '%reclam%' OR v_voz::text ILIKE '%denunci%'
   OR v_voz::text ILIKE '%cancel%' OR v_voz::text ILIKE '%vencid%') THEN
    RAISE EXCEPTION 'CINTURON: la voz emite un veredicto contractual (%)', v_voz;
  END IF;
  -- sin nombre NO inventa sujeto
  v_voz := public._voz_adopcion_sin_respuesta(NULL, NULL);
  IF v_voz->>'mensaje' ILIKE '%por .%' THEN
    RAISE EXCEPTION 'CINTURON: sin nombre la voz dejo un hueco (%)', v_voz->>'mensaje';
  END IF;
  -- el cron quedó puesto
  SELECT count(*) INTO v_n FROM cron.job WHERE jobname = 'barrer-adopcion-diario';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: el cron no quedo agendado (n=%)', v_n; END IF;
  -- L-140
  SELECT count(*) INTO v_n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN
     ('barrer_adopcion_diario','avisar_adopcion_sin_respuesta',
      'purgar_postulaciones_vencidas','_voz_adopcion_sin_respuesta')
     AND array_to_string(p.proacl,' ') ILIKE '%anon=%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON L-140: anon con EXECUTE (n=%)', v_n; END IF;

  RAISE NOTICE 'CINTURON VERDE · la voz es la firmada y no emite veredicto · sin nombre no inventa · cron agendado · anon fuera';
END
$cint$;

COMMIT;
