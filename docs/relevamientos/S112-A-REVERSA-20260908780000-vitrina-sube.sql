-- REVERSA de 20260908780000 · el refugio deja de poder subir su portada y su
-- logo: muere el brazo de la policy y `p_portada_url`.
-- ⚠️ Los objetos ya subidos QUEDAN en el bucket y las filas de
-- `prestador_fotos` también: revertir no borra la vitrina, la vuelve
-- inmodificable desde la app.
DROP POLICY IF EXISTS adopcion_fotos_vitrina_sube ON storage.objects;
DROP POLICY IF EXISTS adopcion_fotos_vitrina_borra ON storage.objects;
DROP FUNCTION IF EXISTS public.poblar_vitrina_refugio(text,text,text,text,text);
-- (la firma de 4 argumentos se recupera de pg_get_functiondef del commit anterior)
