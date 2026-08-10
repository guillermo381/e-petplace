-- ══════════════════════════════════════════════════════════════════════════
-- S92-BIS · D-731 (enmienda) — UNA INTENCIÓN CONTRA UN BUCKET QUE NO EXISTE
-- DEJA DE SER EXPRESABLE
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** Una FK sobre una tabla que nació hace minutos y tiene 0 filas.
--
-- ── LO QUE ENCONTRÓ EL ENSAYO DE FALLO, Y ES LA RAZÓN DE ESTA MIGRACIÓN ───
-- El verde del camino feliz dio 10/10. El ensayo de FALLO —encolar una
-- intención imposible y exigir que el sistema la contara— salió **4/7**: el
-- barredor la marcó `borrado`. *La cura tenía adentro el defecto que vino a
-- curar: reportó éxito sobre algo que jamás pudo hacer.*
--
-- La causa, medida contra la API real, no deducida:
--     DELETE /storage/v1/object/<bucket-inexistente>  →  **200 []**
--     POST   /storage/v1/object/list/<bucket-inexist> →  **200 []**
-- Las dos operaciones responden con forma de éxito. **Un bucket que no existe
-- y una carpeta vacía son indistinguibles desde afuera**, así que ninguna
-- lectura más cuidadosa de la respuesta podía salvar el caso: el dato no está
-- en la respuesta.
--
-- ⇒ la cura no es leer mejor: es que el estado malo **no se pueda escribir**.
-- Con esta FK, encolar contra un bucket inexistente falla en el INSERT, en el
-- momento y con el nombre del problema — en vez de convertirse en un «borrado»
-- silencioso quince minutos después.
--
-- *La rama de fallo que sí puede ocurrir en producción (la API caída, la
-- credencial revocada, el objeto que se niega a irse) sigue cubierta por
-- `marcarIntento`: cuenta, guarda la causa literal y deja la fila visible.*
--
-- Reversa: `DROP CONSTRAINT storage_borrado_pendiente_bucket_fkey`.
-- Revertirla vuelve a permitir encolar contra buckets que no existen, y con
-- eso vuelve el falso «borrado».
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.storage_borrado_pendiente
  ADD CONSTRAINT storage_borrado_pendiente_bucket_fkey
  FOREIGN KEY (bucket) REFERENCES storage.buckets(id)
  ON DELETE RESTRICT;

DO $cinturon$
DECLARE
  v_fk    integer;
  v_error text;
BEGIN
  SELECT count(*) INTO v_fk FROM pg_constraint
   WHERE conrelid = 'public.storage_borrado_pendiente'::regclass
     AND conname  = 'storage_borrado_pendiente_bucket_fkey';
  IF v_fk <> 1 THEN
    RAISE EXCEPTION 'CINTURÓN (a): la FK de bucket no quedó instalada';
  END IF;

  -- EL DISCRIMINADOR: que la FK exista no prueba que RECHACE. Se intenta
  -- escribir el estado malo y se exige que reviente.
  BEGIN
    INSERT INTO public.storage_borrado_pendiente (bucket, objeto, origen)
    VALUES ('bucket-que-no-existe-d731', 'x/y.pdf', 'cinturon');
    RAISE EXCEPTION 'CINTURÓN (b): se pudo encolar contra un bucket inexistente — la FK no rige';
  EXCEPTION WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RAISE NOTICE 'CINTURÓN (b) OK — el INSERT imposible rebotó: %', left(v_error, 80);
  END;

  RAISE NOTICE 'CINTURÓN VERDE — la intención contra un bucket inexistente ya no es expresable';
END
$cinturon$;

COMMIT;
