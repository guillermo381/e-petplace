-- ═══════════════════════════════════════════════════════════════════════════
-- S114-A · ⑤ · EL TERCER BLOQUEO DE WHATSAPP: nadie puede nombrar una plantilla
--
-- MEDIDO CONTRA EL OBJETO ANTES DE CONSTRUIR:
--   · `notificacion_intencion`: **410 filas** · **0** con `plantilla` en `datos`
--     · **0** con `plantilla` en `resuelto_como`
--   · **cero columnas** llamadas `plantilla` en el subsistema de avisos
--     (la única del esquema es `adopcion_documentos.es_plantilla`, otra cosa)
--   · **cero funciones** que escriban una (las dos que la nombran son de
--     documentos de adopción)
--   ⇒ CONTROL POSITIVO del instrumento: las MISMAS 410 filas **sí** tienen
--     `canal_elegido` en `resuelto_como`. El cero de arriba es una medición,
--     no un `?` mal escrito.
--
-- 🔴 POR QUÉ ES BLOQUEANTE Y POR QUÉ VA **ANTES** DEL FLIP:
--   Meta no acepta un mensaje de plantilla sin `template.name`. La edge lo
--   arma con una variable `plantilla` que **hoy nadie llena**. Y como el canal
--   está APAGADO (`transporte_vivo=false` en `cat_notificacion_canales`), el
--   hueco **no produce un solo síntoma**: el despachador corre entero, reporta
--   `habria_entregado` y no manda nada.
--   *Se descubriría el día del flip, con mensajes fallando de a lotes y con
--   costo por intento — que es el peor momento y el más caro.*
--
-- LOS DOS BLOQUEOS ANTERIORES, para que los tres se lean juntos:
--   ① el token — ✅ RESUELTO (196 chars, EAA, los dos permisos, 7-sep)
--   ② las 8 plantillas en MARKETING — ✅ RESUELTO (las 8 en UTILITY y aprobadas)
--   ③ `code_verification_status: EXPIRED` en el número — 🔴 ABIERTO, del founder
--   ④ **éste**: nadie puede nombrar una plantilla — lo cura esta migración
--
-- VEDA 76(g): NO RIGE — dos columnas nullable + una función; cero backfill.
-- REVERSA: `docs/relevamientos/S114-A-REVERSA-20260911030000-plantilla-whatsapp.sql`
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.cat_notificacion_tipos
  ADD COLUMN IF NOT EXISTS plantilla_whatsapp text,
  ADD COLUMN IF NOT EXISTS plantilla_idioma   text NOT NULL DEFAULT 'es';

COMMENT ON COLUMN public.cat_notificacion_tipos.plantilla_whatsapp IS
  'S114 · El `template.name` que Meta exige. NULL = este tipo NO puede salir por '
  'WhatsApp todavía, y el resolvedor lo DICE en vez de mandar sin nombre. '
  '🔴 El mapeo es decisión de la MESA, no de una pista: una plantilla equivocada '
  'es un mensaje que le dice otra cosa a una familia, y desde el 1-oct-2026 se '
  'cobra por intento.';

COMMENT ON COLUMN public.cat_notificacion_tipos.plantilla_idioma IS
  'Código de idioma de Meta (`language.code`). Las 8 plantillas aprobadas al '
  '7-sep-2026 son `es`. Por eso el default es `es` y no una cadena vacía: un '
  'idioma vacío hace fallar el envío igual que un nombre vacío.';

-- ── EL ÚNICO MAPEO QUE NO ES UNA INFERENCIA ────────────────────────────────
-- De las 8 plantillas aprobadas, medido nombre contra nombre:
--   · `pedido_confirmado`            → COINCIDE EXACTO con el tipo homónimo ✅
--   · `plan_renovacion_fallida_u`    → sólo coincide si se ignora el sufijo `_u`
--   · `plan_renovado_v`, `cita_confirmada_v` → ídem con `_v`
--   · `entrega_proxima`, `pedido_no_se_pudo_entregar`,
--     `cita_recordatorio_hoy_v`, `cita_recordatorio_manana_v` → sin candidato
--
-- 🔴 NO SE SIEMBRAN LOS OTROS SIETE. Hay **dos sufijos distintos** (`_u` y `_v`)
--    cuyo significado no está escrito en ningún lado; tratarlos como ruido es
--    una suposición sobre una convención de otro. *Adivinar acá no falla en el
--    momento: falla el día del flip, mandándole a una familia el texto de otro
--    aviso.* Los siete quedan para la mesa, con esta tabla como su lugar.
UPDATE public.cat_notificacion_tipos
   SET plantilla_whatsapp = 'pedido_confirmado', plantilla_idioma = 'es'
 WHERE codigo = 'pedido_confirmado';

-- ── EL RESOLVEDOR ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolver_plantilla_whatsapp(p_tipo text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE v record;
BEGIN
  SELECT codigo, plantilla_whatsapp, plantilla_idioma, activo, en_sombra
    INTO v FROM cat_notificacion_tipos WHERE codigo = p_tipo;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'tipo_desconocido', 'tipo', p_tipo);
  END IF;

  -- 🔴 HABLA EN VEZ DE NEGARSE. Un resolvedor que devuelve NULL manda al
  -- llamador a reintentar algo que no va a funcionar nunca; éste dice cuál de
  -- los dos huecos tiene, que son problemas distintos con dueños distintos:
  -- `sin_plantilla` lo cierra la mesa, `tipo_desconocido` es un bug.
  IF v.plantilla_whatsapp IS NULL OR btrim(v.plantilla_whatsapp) = '' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sin_plantilla', 'tipo', p_tipo,
      'nota', 'el mapeo tipo→plantilla es decisión de la mesa (LETRA_POSTVENTA §10)');
  END IF;

  RETURN jsonb_build_object('ok', true, 'tipo', v.codigo,
    'plantilla', v.plantilla_whatsapp, 'idioma', coalesce(v.plantilla_idioma,'es'));
END $fn$;

COMMENT ON FUNCTION public.resolver_plantilla_whatsapp(text) IS
  'S114 · ⑤ · LA puerta para nombrar una plantilla de Meta desde la base. '
  'Fail-closed y HABLADO: distingue `tipo_desconocido` (bug) de `sin_plantilla` '
  '(decisión de la mesa pendiente). Nadie arma el `template.name` por su cuenta.';

REVOKE ALL ON FUNCTION public.resolver_plantilla_whatsapp(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolver_plantilla_whatsapp(text) TO service_role;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE r jsonb; v_map int; v_sin int;
BEGIN
  -- ① el caso con mapeo
  r := public.resolver_plantilla_whatsapp('pedido_confirmado');
  IF (r->>'ok')::boolean IS NOT TRUE OR r->>'plantilla' <> 'pedido_confirmado' THEN
    RAISE EXCEPTION 'CINTURÓN: no resolvió el único mapeo sembrado: %', r;
  END IF;

  -- ② el caso SIN mapeo — y que diga CUÁL hueco tiene
  r := public.resolver_plantilla_whatsapp('caso_resuelto');
  IF (r->>'ok')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'CINTURÓN: un tipo sin plantilla dio ok:true — %', r;
  END IF;

  -- ③ el tipo inexistente NO puede confundirse con el anterior. Sin esto, un
  --    resolvedor que devolviera `sin_plantilla` para todo pasaría ① y ②.
  r := public.resolver_plantilla_whatsapp('no_existe_xyz');
  IF r->>'codigo' <> 'tipo_desconocido' THEN
    RAISE EXCEPTION 'CINTURÓN: no distingue tipo inexistente de tipo sin plantilla — %', r;
  END IF;

  -- ④ L-140
  IF has_function_privilege('anon','public.resolver_plantilla_whatsapp(text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURÓN: anon puede ejecutar el resolvedor';
  END IF;

  SELECT count(*) INTO v_map FROM cat_notificacion_tipos WHERE plantilla_whatsapp IS NOT NULL;
  SELECT count(*) INTO v_sin FROM cat_notificacion_tipos WHERE plantilla_whatsapp IS NULL;
  IF v_map <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN: se sembró más de un mapeo (% ) — los otros 7 son de la mesa', v_map;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE · 1 tipo mapeado · % sin mapear (de la mesa) · distingue sin_plantilla de tipo_desconocido · anon sin EXECUTE', v_sin;
END $cinturon$;
