-- ═════════════════════════════════════════════════════════════════════
-- D-300 (S46) — Voz del dueño en cat_novedades_paseo, vía catálogo
-- (regla 21: jamás parches por pantalla). Aprobada founder+arquitecto.
--
-- 1) nombre_familia: la voz que ve la familia en el detalle del paseo.
--    El `nombre` existente es la voz de picker del prestador y queda
--    INTACTO. NULL prohibido: toda fila queda con nombre_familia.
-- 2) Enmienda de sesión: reactivo_otros_perros mezclaba DOS conductas
--    distintas (miedo/evitación vs tensión/abalanzarse) — se separan.
--    Nace nervioso_otros_perros (miedo); reactivo queda para la
--    tensión. Info conductual para adiestradores: no se aplasta.
--
-- Relevamiento previo (S46-B0-P2, literal): 12 filas; orden_display
-- con huecos de 10 (comportamiento 10-60 · fisiologico 70-110 ·
-- general 120). La fila nueva usa el hueco 35 (inmediatamente antes
-- de reactivo_otros_perros=40) — no hay que correr a nadie. Espejo de
-- reactivo_otros_perros: grupo comportamiento, activo=true,
-- pais_codigo=null, es_seed_preliminar=true (sin razón en contra).
-- Idempotente: IF NOT EXISTS + ON CONFLICT DO NOTHING + el CASE
-- incluye la fila nueva para que un re-run no le pise la voz.
-- ═════════════════════════════════════════════════════════════════════
begin;

alter table cat_novedades_paseo add column if not exists nombre_familia text;

update cat_novedades_paseo set nombre_familia = case codigo
  when 'bano_anormal'          then 'Hizo sus necesidades distinto a lo habitual'
  when 'bano_normal'           then 'Hizo sus necesidades con normalidad'
  when 'comio_del_piso'        then 'Comió o intentó comer algo del piso'
  when 'interactuo_bien'       then 'Se llevó bien con otros perros'
  when 'otro'                  then 'Otra novedad'
  when 'reactivo_otros_perros' then 'Se tensó con otros perros y quiso lanzarse'
  when 'se_asusto'             then 'Se asustó con algo en el camino'
  when 'nervioso_otros_perros' then 'Se puso nervioso con otros perros'
  -- cojeo, no_quiso_caminar, paseo_tranquilo, tiro_mucho, vomito:
  -- aprobados iguales a la voz del prestador.
  else nombre
end;

insert into cat_novedades_paseo
  (codigo, nombre, nombre_familia, descripcion, grupo, orden_display,
   activo, pais_codigo, es_seed_preliminar)
values (
  'nervioso_otros_perros',
  'Nervioso o miedoso con otros perros',
  'Se puso nervioso con otros perros',
  'Miedo o evitación: se encoge, esquiva o quiere alejarse de otros perros. Si se tensa o intenta lanzarse, corresponde "Reactivo con otros perros".',
  'comportamiento',
  35,
  true, null, true
)
on conflict (codigo) do nothing;

alter table cat_novedades_paseo alter column nombre_familia set not null;

commit;
