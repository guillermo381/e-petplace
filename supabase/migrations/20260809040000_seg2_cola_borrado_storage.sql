-- ══════════════════════════════════════════════════════════════════════════
-- S92-BIS · D-731 — BORRAR UNA FILA DEJA DE ABANDONAR EL DOCUMENTO
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** Tabla nueva, vista nueva, función y trigger nuevos. Cero
-- backfill, cero fila viva tocada, cero ancla. El trigger gobierna borrados
-- FUTUROS; lo ya huérfano no lo alcanza (y no debe: esos 56 los decide el
-- founder uno por uno, ver D-732).
--
-- ── EL DEFECTO, MEDIDO ────────────────────────────────────────────────────
-- Tres hechos que juntos son el agujero:
--   ① la FK `prestador_documentos_prestador_id_fkey` es **ON DELETE CASCADE**;
--   ② la policy `prestador_documentos_own` deja al prestador **borrar su
--      propia fila**;
--   ③ **ninguna función del proyecto toca Storage al borrar** (censo por
--      `pg_get_functiondef ILIKE '%storage%'`: cero).
-- ⇒ toda baja de documento —o de prestador, que las cascadea— deja la cédula,
--   el RUC o el título **en el bucket, para siempre**.
--
-- ── POR QUÉ ES 🔴 Y NO HIGIENE ────────────────────────────────────────────
-- *Un dato personal que el sistema cree haber borrado —porque su fila no
-- está— y que en realidad conserva es lo peor de los dos mundos: no se puede
-- usar y no lo protege ninguna política de retención, porque para el producto
-- ya no existe.* El día que alguien pida que se borren sus datos, el borrado
-- va a reportar éxito y el archivo va a seguir ahí.
--
-- ── LO QUE ESTE DEFECTO **NO** ES (corrección de diagnóstico) ─────────────
-- Los 56 huérfanos que S92-BIS encontró **NO los produjo este camino**. Su
-- productor está escrito literal en el repo congelado
-- (`e-petplace-prestadores/src/lib/documentos.ts:61`):
--     «Upload puro (SIN INSERT a prestador_documentos). Útil para el wizard
--      donde prestador_id aún no existe.»
-- El wizard sube el archivo ANTES de que la fila pueda existir; si se abandona
-- o se reintenta, el objeto queda. Medido: 22 huérfanos de una sola persona en
-- **4 tipos**, con hasta **12 versiones del mismo tipo** — doce intentos, no un
-- documento perdido. Ese productor es **D-733** y su cura es un barredor, no un
-- trigger: la base no puede enterarse de una subida que nunca se registró.
-- *Se declara acá porque un comentario que atribuye el daño al mecanismo
-- equivocado manda la próxima sesión a curar el lugar que no era.*
--
-- ── LA FORMA DE LA CURA, Y SU LÍMITE DURO ────────────────────────────────
-- **Postgres no puede borrar el blob.** No es una preferencia de diseño: un
-- `DELETE` sobre `storage.objects` lo rebota el trigger `storage.protect_delete`
-- (`42501: Direct deletion from storage tables is not allowed`), y aun sin él,
-- borrar la fila dejaría el blob vivo — el huérfano al revés. El borrado real
-- exige la Storage API, o sea una credencial que la DB no debe tener.
-- ⇒ el trigger **encola la intención**; un barredor con credencial la ejecuta,
--   por el mismo camino que los tres despachadores curados hoy (cron + secreto
--   compartido). La cola es la memoria de esa intención, y por eso un fallo
--   **no se pierde**: la fila queda con su causa y su cuenta de intentos.
--
-- La cola nace **genérica** (`bucket` + `objeto`) a propósito: D-733 y
-- cualquier otro productor futuro alimentan la misma tabla y el mismo
-- barredor. Lo que se generaliza es la cola, no la política de qué se borra.
--
-- Reversa: `docs/relevamientos/2026-08-09-seg2-REVERSA-cola-borrado-storage.sql`
-- ⚠️ **Su nota ① dice, con todas las letras, que revertir REABRE el agujero.**
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ══ ① LA COLA ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.storage_borrado_pendiente (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket            text        NOT NULL,
  objeto            text        NOT NULL,
  -- De dónde vino la intención. Sirve para auditar sin adivinar y para que un
  -- productor nuevo (D-733) se distinga del trigger sin columna nueva.
  origen            text        NOT NULL,
  estado            text        NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','borrado','fallido')),
  intentos          integer     NOT NULL DEFAULT 0,
  ultimo_error      text,
  ultimo_intento_en timestamptz,
  resuelto_en       timestamptz,
  encolado_en       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.storage_borrado_pendiente IS
  'D-731 · Intenciones de borrado en Storage que Postgres no puede ejecutar por sí mismo. '
  'La escribe un trigger; la ejecuta el barredor `barrer-storage` con credencial. '
  'NADIE más la lee: contiene paths de documentos de identidad.';

-- Que la misma intención no se encole dos veces mientras sigue pendiente. Se
-- deja fuera de lo ya resuelto a propósito: un path puede volver a subirse y
-- volver a borrarse, y esa segunda intención es legítima.
CREATE UNIQUE INDEX IF NOT EXISTS uq_storage_borrado_pendiente_vivo
  ON public.storage_borrado_pendiente (bucket, objeto)
  WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_storage_borrado_pendiente_cola
  ON public.storage_borrado_pendiente (estado, encolado_en)
  WHERE estado = 'pendiente';

-- ══ ② QUIÉN LA VE: NADIE ══════════════════════════════════════════════════
-- RLS encendida y CERO policies. **No es un olvido: es la política.** Esta
-- tabla lista, en texto plano, dónde vive cada documento de identidad que se
-- quiso borrar. `service_role` (el barredor) salta RLS por definición; el
-- trigger escribe por ser DEFINER. Todo lo demás rebota.
ALTER TABLE public.storage_borrado_pendiente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_borrado_pendiente FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.storage_borrado_pendiente FROM PUBLIC;
REVOKE ALL ON public.storage_borrado_pendiente FROM anon;
REVOKE ALL ON public.storage_borrado_pendiente FROM authenticated;

-- ══ ③ LA VISTA DE LO ATASCADO ═════════════════════════════════════════════
-- «Si el borrado falla, NO se pierde: reintenta y queda visible» (founder).
-- Esta vista es el «queda visible» en su forma consultable. Hereda el cierre
-- de la tabla: sin grants, no la lee nadie salvo quien salta RLS.
CREATE OR REPLACE VIEW public.v_storage_borrado_atascado AS
  SELECT bucket, origen, estado, intentos, ultimo_error, ultimo_intento_en, encolado_en
  FROM public.storage_borrado_pendiente
  WHERE estado = 'fallido' OR (estado = 'pendiente' AND intentos > 0);

COMMENT ON VIEW public.v_storage_borrado_atascado IS
  'D-731 · Lo que el barredor no logró borrar. **No expone `objeto`**: para saber '
  'que algo está atascado no hace falta saber a qué documento pertenece.';

REVOKE ALL ON public.v_storage_borrado_atascado FROM PUBLIC;
REVOKE ALL ON public.v_storage_borrado_atascado FROM anon;
REVOKE ALL ON public.v_storage_borrado_atascado FROM authenticated;

-- ══ ④ EL TRIGGER, EN EL PUNTO DONDE NACE EL DEFECTO ══════════════════════
CREATE OR REPLACE FUNCTION public._encolar_borrado_de_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- `archivo_url` guarda un PATH, no una URL (lo garantiza el CHECK
  -- `archivo_url !~* '^https?://'`), y ese path ES `storage.objects.name`.
  -- Medido, no supuesto: 9/9 filas con la forma `<uuid>/<tipo>-<epoch>.<ext>`.
  IF OLD.archivo_url IS NULL OR btrim(OLD.archivo_url) = '' THEN
    RETURN OLD;
  END IF;

  INSERT INTO public.storage_borrado_pendiente (bucket, objeto, origen)
  VALUES ('prestador-documentos', OLD.archivo_url, 'prestador_documentos')
  ON CONFLICT (bucket, objeto) WHERE estado = 'pendiente' DO NOTHING;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public._encolar_borrado_de_storage() FROM PUBLIC;
REVOKE ALL ON FUNCTION public._encolar_borrado_de_storage() FROM anon;

CREATE TRIGGER trg_prestador_documentos_encola_borrado
  AFTER DELETE ON public.prestador_documentos
  FOR EACH ROW
  EXECUTE FUNCTION public._encolar_borrado_de_storage();

-- ══ ⑤ CINTURÓN ════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_trigger      integer;
  v_policies     integer;
  v_rls          boolean;
  v_grants       integer;
  v_encoladas    integer;
  v_doc_id       uuid;
  v_prestador_id uuid;
BEGIN
  -- (a) el trigger existe y es AFTER DELETE sobre la tabla correcta
  SELECT count(*) INTO v_trigger
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  WHERE c.relname = 'prestador_documentos'
    AND t.tgname = 'trg_prestador_documentos_encola_borrado'
    AND NOT t.tgisinternal;
  IF v_trigger <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN (a): el trigger de encolado no quedó instalado (n=%)', v_trigger;
  END IF;

  -- (b) la cola está cerrada: RLS encendida y CERO policies
  SELECT relrowsecurity INTO v_rls FROM pg_class WHERE oid = 'public.storage_borrado_pendiente'::regclass;
  SELECT count(*) INTO v_policies FROM pg_policies
   WHERE schemaname='public' AND tablename='storage_borrado_pendiente';
  IF NOT v_rls OR v_policies > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (b): la cola quedó alcanzable (rls=% · policies=%)', v_rls, v_policies;
  END IF;

  -- (c) y NADIE tiene grant sobre ella ni sobre la vista.
  --     Se mide por `has_table_privilege`, jamás por LIKE sobre `relacl`
  --     (L-216: un REVOKE que deja PUBLIC intacto no cierra nada, y el
  --     privilegio se hereda — la pregunta buena es «¿puede?», no «¿figura?»).
  SELECT count(*) INTO v_grants FROM (
    SELECT unnest(ARRAY['anon','authenticated']) AS rol,
           unnest(ARRAY['public.storage_borrado_pendiente','public.v_storage_borrado_atascado']) AS obj
  ) x WHERE has_table_privilege(x.rol, x.obj, 'SELECT')
        OR has_table_privilege(x.rol, x.obj, 'INSERT')
        OR has_table_privilege(x.rol, x.obj, 'DELETE');
  IF v_grants > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (c): % combinación(es) rol×objeto todavía pueden tocar la cola', v_grants;
  END IF;

  -- (d) EL DISCRIMINADOR: que el trigger EXISTA no prueba que ENCOLE.
  --     Se borra una fila de verdad, dentro de esta transacción, y se exige
  --     que la intención aparezca. Sin este brazo, un trigger con el cuerpo
  --     equivocado pasaría los tres anteriores en verde.
  SELECT id INTO v_prestador_id FROM prestadores LIMIT 1;
  IF v_prestador_id IS NULL THEN
    RAISE EXCEPTION 'CINTURÓN (d): no hay prestador con el cual producir el discriminador';
  END IF;

  INSERT INTO prestador_documentos (prestador_id, tipo, nombre, archivo_url)
  VALUES (v_prestador_id, 'otro', 'cinturón d-731', 'cinturon-d731/objeto-que-no-existe.pdf')
  RETURNING id INTO v_doc_id;

  DELETE FROM prestador_documentos WHERE id = v_doc_id;

  SELECT count(*) INTO v_encoladas FROM storage_borrado_pendiente
   WHERE objeto = 'cinturon-d731/objeto-que-no-existe.pdf' AND estado = 'pendiente';
  IF v_encoladas <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN (d): borrar la fila NO encoló el objeto (n=%) — el agujero sigue abierto', v_encoladas;
  END IF;

  -- El discriminador no deja residuo: su intención se retira acá mismo.
  DELETE FROM storage_borrado_pendiente WHERE objeto = 'cinturon-d731/objeto-que-no-existe.pdf';

  RAISE NOTICE 'CINTURÓN VERDE — trigger instalado · cola cerrada (rls, 0 policies, 0 grants) · y BORRAR UNA FILA ENCOLA SU OBJETO';
END
$cinturon$;

COMMIT;
