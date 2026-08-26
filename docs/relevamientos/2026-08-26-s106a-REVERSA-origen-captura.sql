-- REVERSA de `20260826360000_s106a_origen_captura_adjunto.sql`.
--
-- ⚠️ QUÉ NO DESHACE: revertir BORRA la marca de origen de los adjuntos que ya
--    la tengan. Se mide antes:
--    `SELECT origen_captura, count(*) FROM evento_archivo_adjunto GROUP BY 1;`
--    Si algún cuadro de teleconsulta ya está marcado, **revertir lo vuelve
--    indistinguible de una foto cargada a mano** — que es exactamente lo que
--    esta columna existe para evitar.
BEGIN;
ALTER TABLE public.evento_archivo_adjunto DROP CONSTRAINT IF EXISTS evento_archivo_adjunto_origen_captura_check;
ALTER TABLE public.evento_archivo_adjunto DROP COLUMN IF EXISTS origen_captura;
COMMIT;
