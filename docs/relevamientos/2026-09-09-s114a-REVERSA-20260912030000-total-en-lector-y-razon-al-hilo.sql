-- REVERSA de 20260912030000: leer_caso y caso_resolver vuelven a su versión de
-- 20260912010000/020000 (recuperables por git); se quita _caso_ya_devuelto y la
-- razón deja de entrar al hilo / de ser obligatoria en parcial.
DROP FUNCTION IF EXISTS public._caso_ya_devuelto(text, uuid, uuid);
