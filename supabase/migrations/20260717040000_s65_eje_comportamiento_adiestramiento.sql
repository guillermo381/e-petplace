-- S65 — decisión de mesa FIRMADA por el founder: el evento de la sesión
-- de adiestramiento (atencion_adiestramiento_registrada) pasa del eje
-- cuidado_externo al eje COMPORTAMIENTO, siguiendo BIO_EXPEDIENTE Eje 6
-- al pie de la letra ("sesiones de entrenamiento" es contenido explícito
-- de ese eje).
--
-- Relevamiento (L-144) que dimensiona la cura:
-- · El eje vive en DOS lados: cat_tipos_evento.eje_jtbd (catálogo, un
--   valor por tipo) + eventos_mascota.eje_jtbd (denormalizado por fila).
-- · iniciar_atencion_adiestramiento LEE el eje del catálogo en cada
--   INSERT (regla 21) → el UPDATE del catálogo cura todo el futuro sin
--   tocar la función.
-- · Backfill: exactamente 1 fila viva (la sesión de Zeus del gate S65).
-- · 'comportamiento' ya es valor vigente del catálogo (Eje 6 existe).
-- · Ningún filtro/query/función depende hoy del eje (diagnóstico S65).
--
-- DE PASO (hallazgo del relevamiento, declarado): la fila del catálogo
-- traía tabla_tipada='eventos_mascota_grooming' — copy-paste del seed
-- (la tabla real es eventos_mascota_adiestramiento). Cero consumidores
-- de tabla_tipada en funciones ni en apps (verificado contra pg_proc y
-- código): corrección documental segura en la misma fila.

-- 1 · El catálogo (cura pasado el INSERT: el futuro nace en comportamiento)
UPDATE cat_tipos_evento
SET eje_jtbd     = 'comportamiento',
    tabla_tipada = 'eventos_mascota_adiestramiento',
    updated_at   = now()
WHERE codigo = 'atencion_adiestramiento_registrada';

-- 2 · Backfill del denormalizado (1 fila esperada)
UPDATE eventos_mascota
SET eje_jtbd = 'comportamiento'
WHERE tipo = 'atencion_adiestramiento_registrada'
  AND eje_jtbd = 'cuidado_externo';

-- 3 · Verificación imperativa: la migración aborta si algo quedó a medias
DO $$
DECLARE
  v_eje text;
  v_tabla text;
  v_pendientes int;
BEGIN
  SELECT eje_jtbd, tabla_tipada INTO v_eje, v_tabla
  FROM cat_tipos_evento WHERE codigo = 'atencion_adiestramiento_registrada';
  IF v_eje IS DISTINCT FROM 'comportamiento' OR v_tabla IS DISTINCT FROM 'eventos_mascota_adiestramiento' THEN
    RAISE EXCEPTION 'migracion_s65_eje: catalogo inconsistente (eje=%, tabla=%)', v_eje, v_tabla;
  END IF;
  SELECT count(*) INTO v_pendientes
  FROM eventos_mascota
  WHERE tipo = 'atencion_adiestramiento_registrada' AND eje_jtbd IS DISTINCT FROM 'comportamiento';
  IF v_pendientes > 0 THEN
    RAISE EXCEPTION 'migracion_s65_eje: % eventos sin backfillear', v_pendientes;
  END IF;
END $$;
