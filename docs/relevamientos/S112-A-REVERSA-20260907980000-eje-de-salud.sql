-- REVERSA de 20260907980000_s112a_eje_de_salud.sql — ESCRITA ANTES DE APLICAR.
-- QUE NO DESHACE: el semaforo sanitario de la ficha se queda SIN un eje comun y
-- vuelve a recibir tres campos con tres formas distintas de decir «no se sabe».
-- No pierde datos: `salud` es DERIVADA, las tres columnas fuente no se tocan.
BEGIN;
CREATE OR REPLACE VIEW public.v_adoptables_publicos AS
SELECT p.id AS publicacion_id, p.mascota_id, p.creada_en, p.ingresado_en,
  (CURRENT_DATE - p.ingresado_en)::int AS espera_dias,
  p.zona, p.ciudad_id, p.urgente, p.senas, p.historia, p.origen_rescate,
  p.fecha_cesion, p.estado_vacunal, p.desparasitado, p.bono_monto, p.bono_destino,
  p.pareja_id, p.country_code, p.convive_perros, p.convive_gatos, p.convive_ninos,
  m.nombre, m.especie, m.raza, m.sexo, m.fecha_nacimiento, m.fecha_nacimiento_precision,
  m.foto_url, m.talla, m.esterilizado,
  m.microchip IS NOT NULL AS tiene_microchip, m.remetfu IS NOT NULL AS tiene_remetfu,
  cc.id AS publicador_id, cc.nombre_comercial AS publicador_nombre,
  pr.foto_url AS publicador_foto, ciu.nombre AS ciudad_nombre
FROM public.adopcion_publicacion p
JOIN public.mascotas m ON m.id = p.mascota_id
JOIN public.cuentas_comerciales cc ON cc.id = p.cuenta_comercial_id
LEFT JOIN public.prestadores pr ON pr.cuenta_comercial_id = cc.id
LEFT JOIN public.cat_ciudades ciu ON ciu.id = p.ciudad_id
WHERE p.estado = 'publicada' AND m.estado_vida <> 'fallecida';
REVOKE SELECT ON public.v_adoptables_publicos FROM anon;
COMMIT;
