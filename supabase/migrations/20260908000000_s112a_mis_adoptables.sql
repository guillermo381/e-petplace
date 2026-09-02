/* ═══════════════════════════════════════════════════════════════════════════
   S112-A2d · EL REFUGIO VE SUS PROPIOS ANIMALES
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Una funcion nueva.

   Lo midio C montando la tab Mascotas: **ningun lector devuelve los adoptables
   de un refugio.** `obtener_adoptables` es la VIDRIERA y filtra `publicada` —
   correcto, y por eso mismo no sirve: **un borrador no sale ahi, ni debe.**

   ⇒ §0 paso 3 nombra a **Kira, en borrador, con su razon**, y Kira es
   justamente la que ningun lector actual puede devolver. No es un caso de
   borde: **es el rojo de A3**, el que prueba que la regla de los seis meses
   funciona. Sin este lector, el paso 3 no se camina y el paso 16 —«el
   interruptor dice por que»— no tiene donde dibujarse.

   ── `motivo_no_publica` VIAJA COMO CODIGO, jamas como frase.
      `TarjetaMascotaRefugio` tiene el interruptor como union discriminada:
      **un interruptor bloqueado y mudo no compila.** Asi que si esto devolviera
      `puede_publicar: false` sin motivo, la tarjeta seria indibujable — el tipo
      lo impide. Y va como codigo y no como texto por la misma razon que la
      edad: *una frase en español dentro de una RPC es una pantalla en un solo
      idioma* (`D-539`).

   ── EL MEMORIAL SE DERIVA ACA TAMBIEN. `estado_vida = 'fallecida'` gana sobre
      el estado de la publicacion: un animal que murio no esta «publicado»,
      aunque su fila lo diga. Una sola fuente, dos lectores.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_mis_adoptables()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_uid uuid := auth.uid(); v_r jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'orden', x->>'nombre'), '[]'::jsonb)
    INTO v_r
    FROM (
      SELECT jsonb_build_object(
        'publicacion_id', p.id,
        'mascota_id',     m.id,
        'nombre',         m.nombre,
        'especie',        m.especie,
        'foto_url',       m.foto_url,
        'ingresado_en',   p.ingresado_en,
        'espera_dias',    (CURRENT_DATE - p.ingresado_en)::int,
        /* El memorial gana sobre el estado de la publicacion. */
        'estado', CASE WHEN m.estado_vida = 'fallecida' THEN 'memorial'
                       ELSE p.estado END,
        'puede_publicar',
          m.estado_vida <> 'fallecida'
          AND (public.evaluar_esterilizacion_adoptable(p.id)->>'puede')::boolean,
        /* 🔴 CODIGO, no frase. `null` SOLO cuando de verdad puede publicar:
           si no puede, la pantalla tiene garantizado un motivo. */
        'motivo_no_publica',
          CASE WHEN m.estado_vida = 'fallecida' THEN 'animal_en_memorial'
               WHEN (public.evaluar_esterilizacion_adoptable(p.id)->>'puede')::boolean THEN NULL
               ELSE public.evaluar_esterilizacion_adoptable(p.id)->>'motivo' END,
        'fotos', (SELECT count(*) FROM adopcion_foto f WHERE f.publicacion_id = p.id),
        /* Para el contador del Home: cuantas solicitudes vivas tiene. */
        'solicitudes_vivas', (SELECT count(*) FROM adopcion_solicitud s
                               WHERE s.publicacion_id = p.id
                                 AND s.estado IN ('recibida','en_conversacion')),
        /* El orden de la lista lo decide el motor: lo que pide accion arriba. */
        'orden', CASE WHEN m.estado_vida = 'fallecida' THEN '4'
                      WHEN p.estado = 'borrador'  THEN '0'
                      WHEN p.estado = 'publicada' THEN '1'
                      WHEN p.estado = 'pausada'   THEN '2'
                      ELSE '3' END
      ) AS x
      FROM adopcion_publicacion p
      JOIN mascotas m ON m.id = p.mascota_id
     WHERE public._user_gestiona_cuenta_refugio(p.cuenta_comercial_id)
    ) t;

  RETURN v_r;
END $fn$;

REVOKE ALL ON FUNCTION public.obtener_mis_adoptables() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_mis_adoptables() TO authenticated;

DO $cint$
DECLARE v_r jsonb;
BEGIN
  -- ① 🔴 `anon` no lo alcanza.
  IF has_function_privilege('anon','public.obtener_mis_adoptables()','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: anon ve los borradores de los refugios';
  END IF;
  -- ② Sin sesion rebota, no devuelve vacio. *Un vacio se leeria como «este
  --    refugio no tiene animales», que es una afirmacion distinta.*
  BEGIN
    PERFORM set_config('request.jwt.claims', NULL, true);
    PERFORM public.obtener_mis_adoptables();
    RAISE EXCEPTION 'CINTURON ROJO ②: sin sesion devolvio en vez de rebotar';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
  RAISE NOTICE 'CINTURON A2d: 2 brazos verdes (2 rojos producidos)';
END $cint$;

COMMIT;
