-- ═══════════════════════════════════════════════════════════════════════════
-- S107 · A — LA ESPECIE ES SIEMPRE DOS CAPAS (firma de mesa · `D-959`)
--
-- > **① El TIPO define el universo elegible** (`tipos_servicio.especies_elegibles`,
-- >   que ya existe). **② El PRESTADOR elige LAS SUYAS dentro de ese universo.**
-- >   Su elección **se recorta siempre contra el universo del tipo — nunca lo
-- >   excede.**
--
-- ── EL DEFECTO QUE ESTO CURA (`D-959`, medido el 28-ago) ───────────────────
-- `prestador_servicios.especies_compatibles` es **NOT NULL con DEFAULT `[]`**,
-- y todos los lectores la leen como `(IS NULL OR ? especie)`. **Con NOT NULL la
-- rama `IS NULL` es inalcanzable** ⇒ una oferta que nadie tocó queda en `[]` y
-- **no matchea ninguna especie: es invisible en su propia vitrina.**
--
-- **Medido: 11 ofertas activas y reservables en ese estado**, de CINCO oficios
-- vivos (paseo · grooming · adiestramiento · consulta_general · vacunación ·
-- emergencia). *El modo de falla es la AUSENCIA: no hay error, no hay log —
-- hay una vitrina con menos prestadores, que se lee igual que una honesta.*
--
-- ── LA CURA, Y POR QUÉ NO ES ADIVINAR POR SU DUEÑO ────────────────────────
-- A cada oferta con `[]` se le escribe **TODAS las especies del universo de su
-- tipo**. 🔴 **Eso es exactamente lo que los lectores leían ANTES del defecto**
-- (`IS NULL` = «no acota» = el techo del tipo) ⇒ **restituye la lectura
-- vigente**, no inventa una preferencia. *Si escribiéramos un subconjunto,
-- ahí sí estaríamos decidiendo por el prestador.*
--
-- **Los universos, medidos y no supuestos:** `paseo` y `adiestramiento` →
-- `{perro}` · `grooming` → `{perro, gato}` · `consulta_general`, `vacunacion`
-- y `emergencia` → las 11 · **`otro` tiene universo NULL** (3 ofertas) ⇒ para
-- ése el universo es `cat_especies` entero, que es lo que NULL significaba.
--
-- ── ③ EL REQUISITO DE LANZAMIENTO, que NO se construye acá ────────────────
-- ⚠️ **Antes de salir a producción, cada prestador DEBE declarar qué especies
-- atiende.** La pantalla donde lo declara es de C y **no entra en esta
-- sesión**. Queda como hueco declarado con ficha (`D-964`) para que nadie lo
-- descubra en el lanzamiento. *Esta migración le devuelve la visibilidad a las
-- once; no reemplaza que su dueño elija.*
--
-- Reversa: docs/relevamientos/S107-A-REVERSA-20260829040000-especies-dos-capas.sql
--          🔴 NO devuelve las ofertas a `[]` — hacerlo reintroduciría el defecto.
-- 76(g): 🔴 RIGE — backfill sobre datos VIVOS de cinco oficios. El cinturón
--        mide antes y después, y su discriminador corre sobre datos reales.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ ① EL BACKFILL — las vacías se llenan ══════════════════════════════════
UPDATE public.prestador_servicios ps
   SET especies_compatibles = COALESCE(
         (SELECT ts.especies_elegibles FROM tipos_servicio ts WHERE ts.codigo = ps.tipo_servicio),
         (SELECT jsonb_agg(c.codigo ORDER BY c.codigo) FROM cat_especies c)
       )
 WHERE ps.especies_compatibles = '[]'::jsonb;

-- ═══ ①bis · Y LAS QUE EXCEDEN EL UNIVERSO SE RECORTAN — DECLARÁNDOLO ══════
/* 🔴 ESTO NO ESTABA PREVISTO Y LO ENCONTRÓ EL CINTURÓN, que es de lo que
   sirve: había una oferta VIVA ofreciendo una especie fuera del universo de su
   tipo. Medido: `consulta_general` de **Satori Latam** con `"hamster"` — un
   código que **no existe en `cat_especies`** (el canónico es `roedor`). *No es
   una preferencia del prestador: es un valor que ningún catálogo reconoce, y
   por eso ningún lector lo iba a matchear nunca.*
   La firma ① manda recortar contra el universo — y **«se DECLARA, jamás se
   borra en silencio»**: por eso el recorte sale por NOTICE con nombre y valor. */
DO $recorte$
DECLARE r record; v_n int := 0;
BEGIN
  FOR r IN
    SELECT ps.id, ps.tipo_servicio, p.nombre_comercial, ps.especies_compatibles AS antes,
           COALESCE((SELECT jsonb_agg(e.value ORDER BY e.value)
                       FROM jsonb_array_elements_text(ps.especies_compatibles) e
                      WHERE ts.especies_elegibles ? e.value), '[]'::jsonb) AS despues
      FROM prestador_servicios ps
      JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
      JOIN prestadores p     ON p.id = ps.prestador_id
     WHERE ts.especies_elegibles IS NOT NULL
       AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(ps.especies_compatibles) e
                    WHERE NOT (ts.especies_elegibles ? e.value))
  LOOP
    /* Si el recorte dejara la oferta sin ninguna especie, NO se guarda muda: se
       aborta y la mesa decide. *Una oferta que no puede atender a nadie no es
       una oferta recortada — es una que hay que mirar.* */
    IF r.despues = '[]'::jsonb THEN
      RAISE EXCEPTION 'ABORTA: la oferta % (%, %) quedaria SIN NINGUNA especie al recortarla. Decision de mesa.', r.id, r.tipo_servicio, r.nombre_comercial;
    END IF;
    UPDATE prestador_servicios SET especies_compatibles = r.despues WHERE id = r.id;
    v_n := v_n + 1;
    RAISE NOTICE '✂️ RECORTADA · % (%) · % → %', r.nombre_comercial, r.tipo_servicio, r.antes, r.despues;
  END LOOP;
  RAISE NOTICE '── recortes declarados: %', v_n;
END $recorte$;

-- ═══ ② EL RECORTE, EXPRESADO DONDE FRENA ═══════════════════════════════════
/* 🔴 La regla «la elección del prestador nunca excede el universo del tipo» no
   puede vivir en un comentario: *un comentario frena a un lector; sólo un
   mecanismo frena a una mano apurada.* Se recorta en la escritura. */
CREATE FUNCTION public._trg_ps_recorta_especies()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_universo jsonb; v_recortado jsonb;
BEGIN
  SELECT ts.especies_elegibles INTO v_universo
    FROM tipos_servicio ts WHERE ts.codigo = NEW.tipo_servicio;

  -- universo NULL = «todas»: no hay nada que recortar.
  IF v_universo IS NULL THEN RETURN NEW; END IF;
  IF NEW.especies_compatibles IS NULL OR NEW.especies_compatibles = '[]'::jsonb THEN
    /* «No acota» pasa a significar «el universo del tipo», que es lo que los
       lectores siempre leyeron. Así el default de la columna deja de producir
       ofertas invisibles. */
    NEW.especies_compatibles := v_universo;
    RETURN NEW;
  END IF;

  SELECT COALESCE(jsonb_agg(e.value ORDER BY e.value), '[]'::jsonb) INTO v_recortado
    FROM jsonb_array_elements_text(NEW.especies_compatibles) e
   WHERE v_universo ? e.value;

  /* 🔴 Si el recorte deja la lista VACÍA, no se guarda una oferta muda: se
     rebota. *Una oferta que no puede atender a ninguna especie de su propio
     tipo no es una preferencia — es un error de quien la escribió.* */
  IF v_recortado = '[]'::jsonb THEN
    RAISE EXCEPTION 'especies_fuera_del_universo' USING ERRCODE = '22023';
  END IF;

  NEW.especies_compatibles := v_recortado;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_ps_recorta_especies
  BEFORE INSERT OR UPDATE OF especies_compatibles, tipo_servicio
  ON public.prestador_servicios
  FOR EACH ROW EXECUTE FUNCTION public._trg_ps_recorta_especies();

-- ═══ CINTURÓN — sobre datos VIVOS, con su línea base ═══════════════════════
DO $c$
DECLARE
  v_rol text := current_user;
  v_vacias int; v_fuera int; v_err text;
  v_ps uuid; v_tipo text; v_antes jsonb;
BEGIN
  -- ① Cero ofertas quedan en `[]` — la cura alcanzó a todas.
  SELECT count(*) INTO v_vacias FROM prestador_servicios WHERE especies_compatibles = '[]'::jsonb;
  IF v_vacias <> 0 THEN
    RAISE EXCEPTION 'ROJO: quedan % oferta(s) en [] despues del backfill.', v_vacias;
  END IF;

  /* ② 🔴 EL DISCRIMINADOR QUE IMPORTA: NINGUNA oferta quedó ofreciendo una
     especie FUERA del universo de su tipo. Sin este assert, el backfill podría
     haber ensanchado en vez de restituir — y eso pondría a un caballo en la
     vitrina de un paseo de perros. */
  SELECT count(*) INTO v_fuera
    FROM prestador_servicios ps
    JOIN tipos_servicio ts ON ts.codigo = ps.tipo_servicio
   WHERE ts.especies_elegibles IS NOT NULL
     AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(ps.especies_compatibles) e
                  WHERE NOT (ts.especies_elegibles ? e.value));
  IF v_fuera <> 0 THEN
    RAISE EXCEPTION 'ROJO: % oferta(s) ofrecen una especie fuera del universo de su tipo.', v_fuera;
  END IF;

  -- ③ Una oferta curada VUELVE a matchear su especie (el defecto era ése).
  SELECT ps.id, ps.tipo_servicio INTO v_ps, v_tipo
    FROM prestador_servicios ps
   WHERE ps.tipo_servicio = 'paseo' AND ps.activo AND ps.reservable LIMIT 1;
  IF v_ps IS NOT NULL THEN
    IF NOT ((SELECT especies_compatibles FROM prestador_servicios WHERE id = v_ps) ? 'perro') THEN
      RAISE EXCEPTION 'ROJO: una oferta de paseo curada no matchea a un perro.';
    END IF;
  END IF;

  -- ④ El trigger RECORTA: pedir un caballo en un paseo de perros no entra.
  IF v_ps IS NOT NULL THEN
    SELECT especies_compatibles INTO v_antes FROM prestador_servicios WHERE id = v_ps;
    BEGIN
      UPDATE prestador_servicios
         SET especies_compatibles = '["perro","equino"]'::jsonb
       WHERE id = v_ps;
      IF (SELECT especies_compatibles FROM prestador_servicios WHERE id = v_ps) ? 'equino' THEN
        RAISE EXCEPTION 'ROJO: el trigger dejo pasar una especie fuera del universo.';
      END IF;
      -- y el que sí pertenece sobrevive al recorte
      IF NOT ((SELECT especies_compatibles FROM prestador_servicios WHERE id = v_ps) ? 'perro') THEN
        RAISE EXCEPTION 'ROJO: el recorte se llevo puesta una especie legitima.';
      END IF;
      UPDATE prestador_servicios SET especies_compatibles = v_antes WHERE id = v_ps;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
      UPDATE prestador_servicios SET especies_compatibles = v_antes WHERE id = v_ps;
      IF v_err LIKE 'ROJO:%' THEN RAISE; END IF;
    END;
  END IF;

  RAISE NOTICE '✅ CINTURON ESPECIES: 0 ofertas en [] · 0 fuera de su universo · la curada matchea · el trigger recorta sin llevarse lo legitimo';
END $c$;

COMMIT;
