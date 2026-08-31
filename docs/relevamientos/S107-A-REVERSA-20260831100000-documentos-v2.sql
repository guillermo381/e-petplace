/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260831100000_s107a_documentos_v2.sql` — escrita ANTES.
   ═══════════════════════════════════════════════════════════════════════════
   🔴 QUÉ **NO** DESHACE, y acá importa más que nunca:

   1. **Revertir NO le devuelve a la familia el estado que tenía.** Si alguien
      aceptó la v2, esas aceptaciones quedan (no se borran: son prueba de un
      acto real, P23). Volver a activar la v1 le pediría aceptar **el texto
      viejo** encima del nuevo que ya aceptó — *dos actos sobre dos textos
      distintos, y ninguno de los dos claramente vigente.*

   2. **No devuelve el tope a «el monto que fijé».** La familia que aceptó la
      v2 autorizó **USD 150**. Revertir el texto no cambia lo que autorizó.

   ⚠️ Por eso esta reversa se usa **sólo si la v2 se sembró por error y NADIE
   la aceptó todavía** — se verifica antes de correrla:
      SELECT count(*) FROM guarderia_aceptaciones WHERE documento_version = 2;
   Si eso no es 0, la salida NO es revertir: es publicar una v3.
   ═══════════════════════════════════════════════════════════════════════════ */
BEGIN;
DELETE FROM guarderia_documentos WHERE version = 2;
UPDATE guarderia_documentos SET activo = true WHERE version = 1;
COMMIT;
