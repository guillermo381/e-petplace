/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de 20260909040000_s113a_recuerdo_en_el_hito.sql
   Escrita ANTES de aplicar. S113-A · lote 0 · adenda (b).

   ⚠️ QUÉ **NO** DESHACE:
   · Los recuerdos que una familia haya escrito se QUEDAN. La línea que los
     borra está al pie, comentada, y NO corre sola.
   · `texto` y `foto_url` de `evento_hito_narrativo` se DROPean ⇒ **se pierde
     el contenido de todo recuerdo vivo**. El objeto de la foto sigue en el
     bucket; lo que se pierde es el puntero Y el texto.
   · `_marcar_modo_captura_evento` vuelve a DOS argumentos: los eventos ya
     marcados con procedencia **conservan su marca**.

   ── ANTES DE CORRER, MEDIR ─────────────────────────────────────────────────
     SELECT count(*) FROM evento_hito_narrativo WHERE clave='recuerdo_familia';
     -- si da > 0, esta reversa DESTRUYE su texto y su foto. Decidirlo aparte.
   ═══════════════════════════════════════════════════════════════════════ */

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_recuerdo_familia(uuid, text, date, text);

DROP POLICY IF EXISTS hito_narrativo_insert_recuerdo ON public.evento_hito_narrativo;

ALTER TABLE public.evento_hito_narrativo DROP CONSTRAINT IF EXISTS hito_foto_es_path;
ALTER TABLE public.evento_hito_narrativo DROP COLUMN IF EXISTS texto;
ALTER TABLE public.evento_hito_narrativo DROP COLUMN IF EXISTS foto_url;

-- El marcador vuelve a su firma de dos argumentos.
DROP FUNCTION IF EXISTS public._marcar_modo_captura_evento(uuid[], text, text);
CREATE OR REPLACE FUNCTION public._marcar_modo_captura_evento(
  p_evento_ids uuid[], p_modo text
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE v_n int;
BEGIN
  IF p_modo IS NULL THEN RETURN 0; END IF;
  IF p_modo NOT IN ('tecleado','dictado','extraido_por_ia','automatico') THEN
    RAISE EXCEPTION 'modo_captura_invalido' USING ERRCODE = '22023';
  END IF;
  IF p_evento_ids IS NULL OR array_length(p_evento_ids, 1) IS NULL THEN RETURN 0; END IF;
  UPDATE eventos_mascota e SET modo_captura = p_modo
   WHERE e.id = ANY(p_evento_ids) AND e.modo_captura IS NULL
     AND public.user_tiene_acceso_a_mascota(e.mascota_id);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$fn$;
REVOKE ALL ON FUNCTION public._marcar_modo_captura_evento(uuid[], text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._marcar_modo_captura_evento(uuid[], text) FROM anon;
GRANT EXECUTE ON FUNCTION public._marcar_modo_captura_evento(uuid[], text) TO authenticated;

COMMIT;

/* ⚠️ La reversa NO restaura `registrar_recuerdo_familia` sobre
   `evento_nota_dueno`: esa versión murió en 20260909040000 y su cuerpo vive
   en la migración 20260909000000. Si se quisiera volver a ella, se re-aplica
   aquélla. `evento_nota_dueno.foto_url` y su categoría `recuerdo` siguen
   ahí, DORMIDAS — esta reversa no las toca. */

/* ── acto APARTE, deliberado, que esta reversa NO ejecuta ─────────────────
DELETE FROM evento_hito_narrativo WHERE clave='recuerdo_familia';
   ───────────────────────────────────────────────────────────────────── */
