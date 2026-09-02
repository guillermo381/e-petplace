-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de la migración de LOS CINCO AVISOS DEL VERTICAL (S112-D · N3)
--
-- ⚠️ ESCRITA ANTES QUE LA MIGRACIÓN, como manda la casa. Se lee ENTERA antes
--    de correrla: hay cosas que NO deshace y están nombradas abajo.
--
-- Autor: pista D (S112) · para: pista A (e-petplace-78)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- LO QUE ESTA REVERSA **NO** DESHACE — y por qué:
--
-- ① 🔴 **LOS AVISOS YA EMITIDOS NO VUELVEN.** Toda fila de
--    `notificacion_intencion` que estos emisores hayan creado se queda donde
--    está. Es correcto y es deliberado: *una intención es el registro de que
--    un hecho ocurrió y de qué decidieron los gates sobre él.* Borrarlas
--    reescribiría la historia de por qué algo salió o no salió — y si alguna
--    ya se entregó, además borraría el respaldo de un aviso que una persona
--    real recibió en su teléfono. **La reversa apaga la fuente, no el pasado.**
--
-- ② **LAS CUATRO FILAS DEL CATÁLOGO SE BORRAN SÓLO SI NADIE LAS USÓ.** El
--    `DELETE` de abajo está condicionado a que no exista ninguna intención con
--    ese tipo. *Un catálogo del que cuelga una fila viva no se borra: la
--    intención quedaría hablando de un tipo que no existe, y el próximo que
--    lea esa fila no va a poder saber qué era.* Si quedan usadas, el DELETE no
--    las toca y **no falla**: se declara en el aviso final.
--
-- ③ **LOS DOS TIPOS QUE YA EXISTÍAN NO SE TOCAN NUNCA**
--    (`adopcion_solicitud_nueva`, `adopcion_solicitud_respondida`). No los creó
--    esta migración; **borrarlos sería borrar algo ajeno**.
--
-- ④ **REVERTIR ESTO DEJA MUDO AL VERTICAL, NO ROTO.** Los llamadores de A
--    (`crear_solicitud_adopcion`, etc.) invocan estos emisores con `PERFORM`.
--    Si la reversa corre **sin** que se hayan retirado esas llamadas, las
--    funciones de A van a fallar con `42883 undefined_function` **en la puerta
--    de la familia**, no acá. ⇒ 🔴 **ORDEN OBLIGATORIO: primero se retiran las
--    llamadas, después corre esta reversa.** El bloque de control del final lo
--    verifica y **aborta** si encuentra un llamador vivo.
--
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── ⓪ CONTROL DE ORDEN: ningún llamador vivo puede quedar apuntando al vacío.
DO $$
DECLARE v_llamadores text[];
BEGIN
  SELECT array_agg(p.proname ORDER BY p.proname) INTO v_llamadores
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname NOT LIKE '\_avisar\_adopcion\_%'
     AND p.prosrc LIKE '%_avisar_adopcion_%';
  IF v_llamadores IS NOT NULL THEN
    RAISE EXCEPTION 'reversa_abortada_hay_llamadores'
      USING DETAIL = 'Retirá primero las llamadas: ' || array_to_string(v_llamadores, ', '),
            HINT   = 'Revertir esto con llamadores vivos rompe la puerta de la familia, no esta migración.';
  END IF;
END $$;

-- ── ① LOS EMISORES
DROP FUNCTION IF EXISTS public._avisar_adopcion_solicitud_nueva(uuid);
DROP FUNCTION IF EXISTS public._avisar_adopcion_solicitud_respondida(uuid);
DROP FUNCTION IF EXISTS public._avisar_adopcion_cierre(uuid);
DROP FUNCTION IF EXISTS public._avisar_adopcion_acta_lista(uuid);
DROP FUNCTION IF EXISTS public._avisar_adopcion_vida_nueva(uuid);

-- ── ② LA VOZ, LA RUTA Y EL RESOLVEDOR
DROP FUNCTION IF EXISTS public._voz_adopcion(text, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public._adopcion_ruta(text, uuid, uuid);
DROP FUNCTION IF EXISTS public._adopcion_partes(uuid);

-- ── ③ EL CATÁLOGO — sólo lo que nadie usó (ver ② de la cabecera)
DO $$
DECLARE v_borrados int; v_quedan text[];
BEGIN
  WITH nuestros(codigo) AS (VALUES
      ('adopcion_solicitud_aceptada'), ('adopcion_solicitud_declinada'),
      ('adopcion_acta_lista'),         ('adopcion_vida_nueva')),
  borrables AS (
    SELECT n.codigo FROM nuestros n
     WHERE NOT EXISTS (SELECT 1 FROM public.notificacion_intencion i WHERE i.tipo = n.codigo))
  DELETE FROM public.cat_notificacion_tipos t
   USING borrables b WHERE t.codigo = b.codigo;
  GET DIAGNOSTICS v_borrados = ROW_COUNT;

  SELECT array_agg(t.codigo ORDER BY t.codigo) INTO v_quedan
    FROM public.cat_notificacion_tipos t
   WHERE t.codigo IN ('adopcion_solicitud_aceptada','adopcion_solicitud_declinada',
                      'adopcion_acta_lista','adopcion_vida_nueva');

  RAISE NOTICE 'reversa avisos: % tipos borrados. Quedan por tener intenciones vivas: %',
    v_borrados, COALESCE(array_to_string(v_quedan, ', '), '(ninguno)');
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- DESPUÉS DE REVERTIR, el estado esperado:
--   · los 5 emisores, la voz, la ruta y el resolvedor: NO existen.
--   · `adopcion_solicitud_nueva` y `adopcion_solicitud_respondida`: siguen en
--     el catálogo, mudos y sin productor — **exactamente como estaban antes**.
--   · las intenciones emitidas: intactas.
-- ═══════════════════════════════════════════════════════════════════════════
