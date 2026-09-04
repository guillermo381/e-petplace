/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de 20260909000000_s113a_puertas_de_la_familia.sql
   Escrita ANTES de aplicar. S113-A · lote 0 · bloques 3 y 4.

   ⚠️ QUÉ **NO** DESHACE:
   · Las filas que la familia haya escrito por estas dos puertas se QUEDAN.
     Borrar el recuerdo o el antiparasitario de alguien porque revertimos
     código sería destruir su expediente. La línea que las borra está al pie,
     comentada, y NO corre sola.
   · `foto_url` de `evento_nota_dueno` se DROPea, y con ella **se pierde el
     puntero a la foto** de todo recuerdo que la tenga. El objeto sigue vivo
     en el bucket `mascotas` — el que se pierde es el puntero. **Si hay
     recuerdos con foto, esta reversa DESTRUYE dato**; la verificación de
     abajo lo dice antes de correr.
   · No toca `_marcar_modo_captura_evento` (es de 20260908960000).
   · No toca los triggers ni `_crear_evento_padre_auto`.

   ── ANTES DE CORRER, MEDIR ─────────────────────────────────────────────────
     SELECT count(*) FROM evento_nota_dueno WHERE foto_url IS NOT NULL;
     -- si da > 0, esta reversa pierde esos punteros. Decidirlo a propósito.
   ═══════════════════════════════════════════════════════════════════════ */

BEGIN;

DROP FUNCTION IF EXISTS public.registrar_desparasitacion_familia(uuid, text, text, date, date, text);
DROP FUNCTION IF EXISTS public.registrar_recuerdo_familia(uuid, text, date, text);

-- El vocabulario de `categoria` vuelve a sus 7 valores.
-- ⚠️ Si quedan filas con categoria='recuerdo', el CHECK viejo NO se puede
--    volver a poner: hay que decidir qué se hace con ellas ANTES.
ALTER TABLE public.evento_nota_dueno DROP CONSTRAINT IF EXISTS evento_nota_dueno_categoria_check;
ALTER TABLE public.evento_nota_dueno ADD CONSTRAINT evento_nota_dueno_categoria_check
  CHECK (categoria = ANY (ARRAY['observacion_general','sintoma','comportamiento',
                                'alimentacion','medicacion_aplicada_casa','recordatorio','otra']));

ALTER TABLE public.evento_nota_dueno DROP CONSTRAINT IF EXISTS evento_nota_dueno_foto_es_path;
ALTER TABLE public.evento_nota_dueno DROP COLUMN IF EXISTS foto_url;

COMMIT;

/* VERIFICACIÓN posterior:
     SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public'
        AND p.proname IN ('registrar_recuerdo_familia','registrar_desparasitacion_familia');
     -- esperado: 0
     SELECT column_name FROM information_schema.columns
      WHERE table_name='evento_nota_dueno' AND column_name='foto_url';
     -- esperado: 0 filas                                                     */

/* ── acto APARTE, deliberado, que esta reversa NO ejecuta ─────────────────
DELETE FROM evento_nota_dueno WHERE categoria='recuerdo';
DELETE FROM evento_desparasitacion_aplicada;
   ───────────────────────────────────────────────────────────────────── */
