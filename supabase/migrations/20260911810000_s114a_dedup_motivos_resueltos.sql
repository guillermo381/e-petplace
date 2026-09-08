-- S114-A · desduplicar v_motivos_resueltos (pedido de D, tomado tal cual)
-- El motivo no_ejecutado/estadia que F1 agregó (20260911730000) colisiona con el
-- no_ejecutado heredado de cita: la vista lo devolvía DOS veces para 'estadia',
-- con dos voces. DISTINCT ON (objeto, codigo) + ORDER BY propio→universal→heredado
-- hace que gane la especialización (la voz propia «No lo cuidaron / no me lo
-- devolvieron»). Control corrido contra la base: estadía 13→12, cita y pedido
-- no se mueven (si alguno cambiara, la cura haría algo más que desduplicar).
-- 76(g): NO RIGE — redefine una vista, sin datos.
-- Reversa: docs/relevamientos/2026-09-07-s114a-REVERSA-motivos-dedup.sql
BEGIN;
CREATE OR REPLACE VIEW public.v_motivos_resueltos AS
SELECT DISTINCT ON (o.objeto, m.codigo)
    o.objeto  AS objeto_resuelto,
    m.codigo,
    m.objeto  AS objeto_origen,
    m.clase, m.urgente, m.voz, m.pide_foto,
    CASE
      WHEN m.objeto = 'todos'::text  THEN 'universal'::text
      WHEN m.objeto = o.objeto       THEN 'propio'::text
      ELSE 'heredado'::text
    END AS procedencia
  FROM (VALUES ('cita'::text), ('estadia'::text), ('pedido'::text)) o(objeto)
  JOIN cat_motivos_postventa m
    ON m.activo
   AND (m.objeto = o.objeto
     OR m.objeto = 'todos'::text
     OR EXISTS (SELECT 1 FROM cat_motivos_herencia h
                 WHERE h.objeto = o.objeto AND h.hereda_de = m.objeto))
 ORDER BY o.objeto, m.codigo,
    CASE WHEN m.objeto = o.objeto THEN 0
         WHEN m.objeto = 'todos'::text THEN 1
         ELSE 2 END;
COMMIT;
