-- REVERSA de 20260912060000: caso_resolver, caso_elegir_destino y
-- _trg_caso_mensaje_avisa vuelven a su versión previa (recuperables por git:
-- 20260912040000 / 20260911640000 / 20260911860000). Y el tipo nuevo:
DELETE FROM cat_notificacion_tipos WHERE codigo = 'caso_devolucion_por_elegir';
-- (los productores de aviso desaparecen con el CREATE OR REPLACE previo)
