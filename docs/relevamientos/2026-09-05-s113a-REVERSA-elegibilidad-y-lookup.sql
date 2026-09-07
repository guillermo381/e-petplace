-- REVERSA de 20260909240000_s113a_elegibilidad_guarderia_y_lookup.sql (S113-A)
-- Escrita ANTES de aplicar.
--
-- 🔴 QUÉ NO DESHACE, y es lo que importa:
-- ① Revertir **REABRE el agujero**: la guardería vuelve a decir que una mascota
--    fallecida puede reservar. *No es un cambio de forma: es la puerta que se
--    vuelve a poder cruzar.*
-- ② Si alguna reserva se hizo mientras el guard estaba puesto, revertir no la
--    toca. El guard frena hacia adelante, jamás hacia atrás.
begin;
-- ① la elegibilidad sale de la puerta de guardería
create or replace function public._guarderia_puede_reservar(p_mascota_id uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public','pg_temp'
as $f$
DECLARE v_san jsonb; v_doc jsonb; v_familia uuid; v_duro boolean;
BEGIN
  SELECT COALESCE((SELECT valor::boolean FROM app_config
                    WHERE clave = 'guarderia_gate_sanitario_duro'), false) INTO v_duro;
  v_san := public.evaluar_requisitos_guarderia(p_mascota_id);
  IF v_duro AND v_san->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'requisitos_sanitarios',
                              'faltantes', v_san->'faltantes');
  END IF;
  SELECT m.familia_id INTO v_familia FROM mascotas m WHERE m.id = p_mascota_id;
  v_doc := public.evaluar_documentos_guarderia(v_familia);
  IF v_doc->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false,
                              'motivo', CASE v_doc->>'estado'
                                          WHEN 'faltan' THEN 'documentos_sin_aceptar'
                                          ELSE v_doc->>'estado' END,
                              'faltantes', v_doc->'faltantes', 'sanitario', v_san);
  END IF;
  RETURN jsonb_build_object('puede', true, 'sanitario', v_san, 'gate_sanitario_duro', v_duro);
END $f$;

-- ③ el lookup vuelve a ser sensible a mayúsculas y acentos
drop index if exists idx_cat_razas_nombre_norm;
alter table public.cat_razas drop column if exists nombre_norm;
commit;
