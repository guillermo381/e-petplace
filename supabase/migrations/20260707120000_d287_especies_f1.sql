-- ═════════════════════════════════════════════════════════════════════
-- D-287 (S45) — Catálogo de especies alineado a las 6 familias F1.
-- Decisión founder S45: el registro sale con EXACTAMENTE 6 familias:
-- perro, gato, conejo, ave, pez, roedor.
--   · Cobaya se subsume en roedor (solo nuevos registros).
--   · Hurón queda fuera de F1 (no encaja en ninguna familia).
--   · Reptil sigue fuera (no se toca: ya estaba activo=false).
-- Pre-check S45-B2: 0 mascotas con especie huron/cobaya → no hay datos
-- que migrar. P4: si existieran, conservan especie y expediente.
-- motivo_estado de las 4 activadas NO se toca (describe nivel de
-- soporte, que no cambia). Idempotente: cada UPDATE guarda su WHERE
-- sobre el estado actual; los INSERT usan ON CONFLICT DO NOTHING.
-- ═════════════════════════════════════════════════════════════════════
begin;

-- 1) ACTIVAR las 4 familias nuevas de F1
update cat_especies
   set activo = true, updated_at = now()
 where codigo in ('conejo','ave','pez','roedor')
   and activo = false;

-- 2) DESACTIVAR hurón y cobaya — un UPDATE por especie, cada fila
--    cuenta su historia
update cat_especies
   set activo = false,
       acepta_nuevos_registros = false,
       motivo_estado = 'Fuera del alcance F1: no encaja en ninguna de las 6 familias (decisión founder S45). Reactivable con disparo. Mascotas existentes conservan especie y expediente (P4).',
       updated_at = now()
 where codigo = 'huron'
   and (activo = true or acepta_nuevos_registros = true);

update cat_especies
   set activo = false,
       acepta_nuevos_registros = false,
       motivo_estado = 'Fuera del alcance F1 (decisión founder S45): los nuevos registros van como roedor. Mascotas existentes conservan especie y expediente (P4); su perfil de especie se mantiene.',
       updated_at = now()
 where codigo = 'cobaya'
   and (activo = true or acepta_nuevos_registros = true);

-- 3) PERFILES para roedor y pez (no existían en cat_especies_perfil;
--    sin ellos el trigger de visibilidad cae al fallback conservador).
--    Mismo shape que conejo/ave: solo especie_codigo + notas_operativas,
--    el resto queda en los defaults de la tabla ({} / [] / discoverable).
--    El perfil de cobaya QUEDA: sus mascotas existentes lo usan.
insert into cat_especies_perfil (especie_codigo, notas_operativas)
values
  ('roedor', 'Perfil Nivel C — soporte básico. Identidad y eventos limitados. Umbrales momento vital pendientes (D-111). Familia F1 que subsume cobaya para nuevos registros (D-287). Vet exótico como actor principal.'),
  ('pez',    'Perfil Nivel C — soporte básico. Identidad y eventos limitados. Umbrales momento vital pendientes (D-111). Sin manipulación directa: JTBDs acotados a alimentación y mantenimiento de hábitat.')
on conflict (especie_codigo) do nothing;

commit;
