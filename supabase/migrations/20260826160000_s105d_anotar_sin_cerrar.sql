-- ═══════════════════════════════════════════════════════════════════════════
-- S105-D · `D-925` — ANOTAR SIN CERRAR
--
-- 76(g) — VEDA: **NO RIGE.** DDL aditiva (una columna con default) + una
-- función nueva. Sin backfill, sin anclas, sin reescritura de nada vivo.
--
-- REVERSA: escrita ANTES, en
--   docs/relevamientos/S105-D-REVERSA-20260826160000-anotar-sin-cerrar.sql
--   🔴 Declara que revertir **borra la evidencia ya juntada** y fija el orden
--      (primero la edge, después esto).
--
-- ── EL DEFECTO, MEDIDO ─────────────────────────────────────────────────────
--
-- El SDK de Nuvei devuelve `status:"success"` **sin `card.token`**. La página
-- llama con `desenlace:'guardada'` y sin token; `pagos-alta-tarjeta` corta en
-- `token_ausente` **antes de la RPC** ⇒ **no queda una sola traza**:
--
--   · en las altas → el alta queda `pendiente` … **igual que si la persona
--     hubiera cerrado la pestaña.** Hay rastro y no distingue nada.
--   · en los eventos → cero.
--   · en los logs → la línea del corte no loguea. El dashboard registra un
--     `400` sin decir de qué alta ni qué mandó el SDK.
--
-- Medido la noche del 25-ago: **tres altas seguidas fallaron (19:46 · 20:10 ·
-- 20:46) y la cuarta entró con la misma tarjeta en 23 segundos.**
-- ⇒ **Es intermitente.** Y mientras no haya rastro **no se puede saber si es
-- del SDK, de la red o nuestro** — que es exactamente por lo que esto existe.
--
-- ── 🔴 POR QUÉ NO SE USA EL CAMINO QUE YA EXISTÍA ──────────────────────────
--
-- `resolver_alta_tarjeta` acepta `'rechazada'` y nadie la llama (`L-318`,
-- motor sin puerta). **Enchufar eso habría sido el error**, y el hallazgo es
-- de C: `'rechazada'` hace `estado='rechazada', cerrada_en=now()`, y el handle
-- es **de un solo uso** (`IF v_a.estado <> 'pendiente' … duplicado`).
--
-- > ### Reportar por ahí mata el handle, y con él la única acción que la voz le
-- > acaba de ofrecer a la persona: **probar con otra tarjeta.**
-- > *Un rastro que rompe la salida que la voz promete es peor que la falta de
-- > rastro.*
--
-- ⇒ Hace falta un camino que **ANOTE SIN CERRAR**. Esta función no toca
--   `estado` ni `cerrada_en` **nunca**, y el cinturón lo prueba de la única
--   forma que vale: anota y después **resuelve el alta con el mismo handle**.
--
-- ── 🔴 EL ENMASCARADO SE HACE ACÁ TAMBIÉN, Y NO ES DESCONFIANZA ────────────
--
-- C ya enmascara del lado de la página. **Igual se re-enmascara en la base.**
-- *Un enmascarado que depende de que el llamador lo haya hecho bien no es un
-- enmascarado: es una promesa.* Y lo que está del otro lado de esa promesa es
-- un PAN — el día que alguien mande el crudo «para diagnosticar mejor», esta
-- línea es lo único que se interpone entre e-PetPlace y ser PCI.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── LA COLUMNA: append-only, arreglo, nace vacía ──────────────────────────
ALTER TABLE public.altas_tarjeta
  ADD COLUMN IF NOT EXISTS incidentes jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.altas_tarjeta
  DROP CONSTRAINT IF EXISTS chk_altas_incidentes_es_arreglo;
ALTER TABLE public.altas_tarjeta
  ADD CONSTRAINT chk_altas_incidentes_es_arreglo
  CHECK (jsonb_typeof(incidentes) = 'array');

COMMENT ON COLUMN public.altas_tarjeta.incidentes IS
  'S105-D/D-925: bitacora append-only de lo que fallo SIN cerrar el alta. '
  'Enmascarada en la base: ninguna corrida de 4+ digitos sobrevive.';

-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.anotar_incidente_alta(
  p_alta_id uuid,
  p_motivo  text,
  p_forma   text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_a      public.altas_tarjeta%ROWTYPE;
  v_motivo text;
  v_forma  text;
  v_n      int;
BEGIN
  SELECT * INTO v_a FROM public.altas_tarjeta WHERE id = p_alta_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'alta_no_existe');
  END IF;

  /* 🔴 EL ENMASCARADO, EN LA BASE. Cualquier corrida de 4 o más dígitos se
     reemplaza — un PAN, un CVC largo, un número de cuenta. Se pierde precisión
     de diagnóstico y **se gana la garantía**, que es el intercambio correcto:
     *el peor caso de enmascarar de más es una medición más pobre; el de
     enmascarar de menos es un PAN en nuestra base.* */
  v_motivo := left(regexp_replace(coalesce(btrim(p_motivo), 'sin_motivo'),
                                  '\d{4,}', '#', 'g'), 60);
  v_forma  := left(regexp_replace(coalesce(btrim(p_forma), ''),
                                  '\d{4,}', '#', 'g'), 500);

  v_n := jsonb_array_length(v_a.incidentes);

  /* Techo declarado, jamás silencioso (§no-silent-caps): pasado el tope se
     contesta que se ignoró, con el número. *Un tope callado se lee como
     «se anotó» y deja a alguien esperando un dato que no existe.* */
  IF v_n >= 10 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'tope_de_incidentes',
                              'anotados', v_n, 'tope', 10);
  END IF;

  /* 🔴 EL CORAZÓN: se escribe UNA columna y **ninguna más**. Ni `estado`, ni
     `cerrada_en`, ni `motivo`, ni `tarjeta_id`. El handle sigue vivo y la
     persona puede reintentar — que es lo que la voz le prometió. */
  UPDATE public.altas_tarjeta
     SET incidentes = incidentes || jsonb_build_object(
           'en',     now(),
           'motivo', v_motivo,
           'forma',  NULLIF(v_forma, ''),
           /* Se guarda en qué estado estaba: una anotación sobre un alta ya
              `guardada` cuenta algo distinto que una sobre una `pendiente`. */
           'estado_al_anotar', v_a.estado)
   WHERE id = p_alta_id;

  RETURN jsonb_build_object('ok', true, 'anotados', v_n + 1,
                            'estado', v_a.estado, 'cerro', false);
END $function$;

COMMENT ON FUNCTION public.anotar_incidente_alta(uuid, text, text) IS
  'S105-D/D-925: deja rastro de un alta que fallo SIN consumir el handle. '
  'NO toca estado ni cerrada_en: la persona puede reintentar. Enmascara 4+ digitos.';

REVOKE ALL ON FUNCTION public.anotar_incidente_alta(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.anotar_incidente_alta(uuid, text, text)
  TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN — en SUBTRANSACCIÓN QUE SE DESHACE SOLA (`L-406`): este arnés
-- ESCRIBE, y un arnés que escribe sobre el motor de pagos hace lo que vino a
-- vigilar. La DDL queda afuera del bloque que se revierte.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_user  uuid;
  v_alta  uuid;
  v_r     jsonb;
  v_row   public.altas_tarjeta%ROWTYPE;
BEGIN
  BEGIN  -- ← subtransacción

    SELECT user_id INTO v_user FROM public.altas_tarjeta ORDER BY creada_en DESC LIMIT 1;
    IF v_user IS NULL THEN
      RAISE EXCEPTION 'CINTURON: no hay ningun alta de la cual tomar un user_id real';
    END IF;

    INSERT INTO public.altas_tarjeta (user_id, proveedor, estado, expira_en)
    VALUES (v_user, 'nuvei', 'pendiente', now() + interval '15 minutes')
    RETURNING id INTO v_alta;

    -- ① Anota, y contesta que NO cerró.
    v_r := anotar_incidente_alta(v_alta, 'sdk_ok_sin_token',
             'card={bin=str(6)"4111111111111111" number=str(4)"1111"} status="success"');
    IF (v_r->>'ok')::boolean IS NOT TRUE OR (v_r->>'cerro')::boolean IS NOT FALSE THEN
      RAISE EXCEPTION 'CINTURON ①: la anotacion no salio o dijo que cerro: %', v_r;
    END IF;

    -- ② 🔴 EL ENMASCARADO: el PAN de prueba NO puede sobrevivir en la fila.
    --
    -- ⚠️ SE BARREN **LOS CAMPOS DEL LLAMADOR**, no la fila entera. La primera
    --    versión de este assert miraba `incidentes::text` completo y dio ROJO
    --    con el enmascarado funcionando: lo que encontró fue el `en`, un
    --    timestamp que escribimos nosotros (`2026-08-26T02:12:37.826881`).
    --    *Un rojo por la razón equivocada está tan roto como un verde por la
    --    razón equivocada* — y éste habría mandado a «arreglar» una máscara
    --    que estaba bien.
    SELECT * INTO v_row FROM public.altas_tarjeta WHERE id = v_alta;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_row.incidentes) e
       WHERE coalesce(e->>'motivo','') ~ '\d{4,}'
          OR coalesce(e->>'forma','')  ~ '\d{4,}'
    ) THEN
      RAISE EXCEPTION 'CINTURON ②: sobrevivio una corrida de 4+ digitos en dato del llamador: %',
        left(v_row.incidentes::text, 200);
    END IF;
    IF v_row.incidentes::text NOT LIKE '%sdk_ok_sin_token%' THEN
      RAISE EXCEPTION 'CINTURON ②b: el motivo no quedo escrito: %', v_row.incidentes;
    END IF;

    -- ③ EL ALTA SIGUE ABIERTA. Esto es lo que la separa de `rechazada`.
    IF v_row.estado <> 'pendiente' OR v_row.cerrada_en IS NOT NULL THEN
      RAISE EXCEPTION 'CINTURON ③: la anotacion movio el alta: estado=% cerrada=%',
        v_row.estado, v_row.cerrada_en;
    END IF;

    -- ④ 🔴 EL DISCRIMINADOR, Y ES LA RAZÓN DE SER DE TODA LA MIGRACIÓN:
    --    después de anotar, **el mismo handle todavía sirve para guardar**.
    --    Con `desenlace:'rechazada'` esto daría `duplicado` y la persona se
    --    quedaría sin poder reintentar.
    v_r := resolver_alta_tarjeta(
             p_alta_id   => v_alta,
             p_desenlace => 'guardada',
             p_token     => 'CINTURON-S105D-' || gen_random_uuid()::text,
             p_bin       => '411111', p_ultimos4 => '1111', p_marca => 'vi');
    IF (v_r->>'ok')::boolean IS NOT TRUE OR (v_r->>'duplicado') IS NOT NULL THEN
      RAISE EXCEPTION 'CINTURON ④: el handle NO sobrevivio a la anotacion: %', v_r;
    END IF;

    -- ⑤ Contra-caso: sobre un alta ya cerrada la anotación sigue siendo
    --    posible y **lo dice**, sin resucitar nada.
    v_r := anotar_incidente_alta(v_alta, 'post_cierre');
    SELECT * INTO v_row FROM public.altas_tarjeta WHERE id = v_alta;
    IF (v_r->>'ok')::boolean IS NOT TRUE OR v_row.estado <> 'guardada' THEN
      RAISE EXCEPTION 'CINTURON ⑤: anotar sobre cerrada rompio algo: % / %', v_r, v_row.estado;
    END IF;

    -- ⑥ Un alta inexistente contesta, no explota.
    v_r := anotar_incidente_alta('00000000-0000-0000-0000-000000000000'::uuid, 'x');
    IF v_r->>'codigo' <> 'alta_no_existe' THEN
      RAISE EXCEPTION 'CINTURON ⑥: un alta inexistente no se nombro: %', v_r;
    END IF;

    RAISE NOTICE 'CINTURON ANOTAR-SIN-CERRAR: 6/6 verde. Deshaciendo fixtures.';
    RAISE EXCEPTION 'CINTURON_OK_DESHACER';

  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'CINTURON_OK_DESHACER' THEN
      RAISE;              -- ← un assert real aborta la migración entera
    END IF;
  END;

  -- Residuo 0: el alta y la tarjeta del cinturón se fueron con la subtransacción.
  IF EXISTS (SELECT 1 FROM public.tarjetas_guardadas WHERE token LIKE 'CINTURON-S105D-%') THEN
    RAISE EXCEPTION 'CINTURON: quedo residuo de fixture en tarjetas_guardadas';
  END IF;
  RAISE NOTICE 'CINTURON: residuo 0 verificado.';
END $cinturon$;

COMMIT;
