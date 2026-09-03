-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · EL CHAT DE ADOPCIÓN ENTRA A REALTIME — con su rojo medido primero
--
-- Firma del founder, **condicionada**: *«si el realtime de la casa no respeta
-- RLS en esa tabla, no la sumes y declaralo»*. Se midió antes de decidir, y
-- **no leyendo el catálogo**: *que la tabla esté configurada igual que las 14
-- que ya tienen realtime no dice qué RECIBE cada suscriptor.*
--
-- ═══ EL ARNÉS, y su forma es lo que lo hace válido ═══
-- Tres suscripciones simultáneas al MISMO canal y evento, con
-- `realtime.setAuth(jwt)` en cada una —**sin eso la RLS no se evalúa y el
-- arnés mediría otra cosa**—, y un INSERT real por la puerta del refugio:
--
--     familia   recibió 1     ✅
--     refugio   recibió 1     ✅
--     TERCERO   recibió 0     🔴 correctamente excluido
--
-- 🔴 **El cero del tercero vale porque los otros dos recibieron en la misma
-- corrida.** Un cero solo no prueba nada: probaría igual que el socket no
-- anduvo. *Lo único distinto entre los tres era quién eran.*
--
-- Cruzado por REST con los mismos JWT: familia 1 fila · tercero 0 filas.
-- **Realtime y RLS coinciden.**
--
-- ⚠️ Y la línea base, tomada ANTES de sumar la tabla: los tres suscribieron
-- (`SUBSCRIBED`) y **los tres recibieron 0** — o sea que el arnés distingue
-- «no está en la publicación» de «no te corresponde».
--
-- ⇒ el sondeo de 5 s de §2.4 **deja de ser necesario**; su rama queda como
-- respaldo si alguna vez esta tabla sale de la publicación.
--
-- 76(g) — NO RIGE: cambio de publicación, sin backfill y sin anclas.
-- ═══════════════════════════════════════════════════════════════════════════

DO $m$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                  WHERE pubname='supabase_realtime' AND tablename='adopcion_mensaje') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.adopcion_mensaje;
  END IF;
END $m$;

-- ═══ CINTURÓN ═══
DO $c$
DECLARE v_pub int; v_rls boolean; v_pol int;
BEGIN
  SELECT count(*) INTO v_pub FROM pg_publication_tables
   WHERE pubname='supabase_realtime' AND tablename='adopcion_mensaje';
  IF v_pub <> 1 THEN RAISE EXCEPTION 'CINTURON: la tabla no quedo en la publicacion'; END IF;

  /* 🔴 LA CONDICIÓN QUE HACE SEGURO EL REALTIME: **sin RLS activa, sumarla
     habría publicado cada mensaje a todo suscriptor.** Se verifica acá y no
     se supone: *el arnés midió el comportamiento de HOY; este brazo frena el
     día que alguien apague la RLS sin acordarse de esta tabla.* */
  SELECT c.relrowsecurity INTO v_rls FROM pg_class c WHERE c.oid='public.adopcion_mensaje'::regclass;
  IF NOT v_rls THEN
    RAISE EXCEPTION 'CINTURON: adopcion_mensaje esta en realtime SIN RLS — cada mensaje seria publico';
  END IF;

  SELECT count(*) INTO v_pol FROM pg_policy WHERE polrelid='public.adopcion_mensaje'::regclass;
  IF v_pol = 0 THEN
    RAISE EXCEPTION 'CINTURON: RLS activa y CERO policies — nadie leeria nada (L-216 al reves)';
  END IF;

  RAISE NOTICE 'CINTURON VERDE: en realtime, con RLS y % policy(s)', v_pol;
END $c$;
