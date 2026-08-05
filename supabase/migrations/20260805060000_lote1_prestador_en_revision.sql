-- S87-A · LOTE 1 — EL TIPO QUE PAGA D-103, 75 SESIONES DESPUÉS.
-- El código lo pedía en un comentario desde S12: "usa tipo 'sistema'
-- temporalmente. D-103 propone agregar 'prestador_en_revision'". Séptimo
-- habitante de la familia del ciclo del prestador, todos `operacion`.
-- La deuda dejó de costar lo que costaba: agregar un tipo pasó de "ampliar un
-- CHECK" a "una fila con su categoría". 76(g): NO RIGE.
INSERT INTO public.cat_notificacion_tipos (codigo, categoria, descripcion)
VALUES ('prestador_en_revision', 'operacion',
        'Al prestador: su cuenta pasó a revisión y se le pidieron cambios.');
