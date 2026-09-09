-- REVERSA de 20260911810000: restaura v_motivos_resueltos previa (sin DISTINCT ON)
CREATE OR REPLACE VIEW public.v_motivos_resueltos AS
 SELECT o.objeto AS objeto_resuelto,
    m.codigo,
    m.objeto AS objeto_origen,
    m.clase,
    m.urgente,
    m.voz,
    m.pide_foto,
        CASE
            WHEN m.objeto = 'todos'::text THEN 'universal'::text
            WHEN m.objeto = o.objeto THEN 'propio'::text
            ELSE 'heredado'::text
        END AS procedencia
   FROM ( VALUES ('cita'::text), ('estadia'::text), ('pedido'::text)) o(objeto)
     JOIN cat_motivos_postventa m ON m.activo AND (m.objeto = o.objeto OR m.objeto = 'todos'::text OR (EXISTS ( SELECT 1
           FROM cat_motivos_herencia h
          WHERE h.objeto = o.objeto AND h.hereda_de = m.objeto)));
;
