-- ════════════════════════════════════════════════════════════════════════════
-- S91-A · CURA DE REGRESIÓN — el REVOKE de hoy rompió OCHO policies
--
-- ── EL INCIDENTE, con su literal ───────────────────────────────────────────
-- Reportado por C con camino real: sesión de `demo-prestador@epetplace.dev`
-- (titular de Paseos Andres) → `obtenerMiCuentaComercial()` devuelve
--     {"code":"42501","message":"permission denied for table prestadores"}
-- y un `select('id, owner_profile_id')` SIN filtro da lo mismo ⇒ **no es el
-- query, es la policy.** ROJO REPRODUCIDO por A antes de tocar nada.
--
-- ── LA CAUSA, y es de la migración `20260808080000` DE HOY ─────────────────
-- Al cerrar la fuga de `prestadores` revoqué el SELECT de tabla y concedí por
-- COLUMNA, dejando nueve afuera. **Ocho de esas nueve estaban bien elegidas.
-- La novena, `cuenta_comercial_id`, NO** — y el error está escrito en mi propio
-- comentario, que la agrupó con «VEREDICTOS INTERNOS» junto a `motivo_rechazo`,
-- `aprobado_por` y `aprobado_en`. **No es un veredicto: es un FK estructural.**
-- *Se coló por vecindad en una lista, que es exactamente cómo se cuelan las
-- decisiones que nadie tomó.*
--
-- Ocho policies hacen `EXISTS (SELECT 1 FROM prestadores p WHERE
-- p.cuenta_comercial_id = …)`. Postgres evalúa el EXISTS **aunque el otro brazo
-- (`owner_profile_id = auth.uid()`) sea verdadero**, y muere en el permiso de
-- TABLA antes de que la RLS decida. Falla para TODOS los titulares.
--
-- ── EL BARRIDO: C encontró una, el censo encontró OCHO ─────────────────────
--   cuentas_comerciales.owner_select_own_cuentas          [r]
--   cuentas_comerciales.owner_update_own_cuentas_data     [w]
--   caso_clinico.caso_clinico_insert_vet                  [a]  ← el VET no abre caso
--   caso_clinico_consultor.consultor_select_…_propia      [r]
--   certificado_salud.certificado_select_acceso           [r]
--   cobro_presencial_registrado.cobro_presencial_…_cuenta [r]
--   mascota_acceso_prestador.map_select_due               [r]
--   prestadores.prestadores_insert_cuenta_propia          [a]
-- *El síntoma que llegó era «no puedo abrir Tu negocio». El alcance real
-- incluía el motor clínico. Una sola de las ocho se había manifestado.*
--
-- ── POR QUÉ ESTA CURA Y NO LA DEL HELPER (que también es correcta) ─────────
-- C propuso mover el EXISTS a un helper SECURITY DEFINER — es el patrón de la
-- casa y para DOS policies sería la cura elegante. **Para OCHO, el día del gate
-- de cierre, es cirugía sobre ocho puertas —una de ellas clínica— sin gate que
-- las mire.** El re-grant cura las ocho con una línea y **no reabre nada
-- sensible**: `cuenta_comercial_id` es un uuid OPACO cuya tabla destino
-- (`cuentas_comerciales`) sigue siendo owner-only. *Lo que se aprende es un id
-- que no se puede dereferenciar.* Las OCHO columnas que sí eran privacidad
-- —lat/lon exacta, dirección, email de contacto, metadata y los tres
-- veredictos— **siguen cerradas, y el cinturón de abajo lo verifica.**
-- El helper queda propuesto para S92 si la mesa quiere la columna cerrada.
--
-- ── VEDA 76(g): NO RIGE ────────────────────────────────────────────────────
-- Un GRANT. Cero DDL de datos, cero backfill, cero cambio de firma. Y no
-- necesita publish: **es servidor puro** — los bundles vivos empiezan a
-- funcionar solos, sin que nadie actualice nada (lo contrario de D-662).
--
-- ── REVERSA ────────────────────────────────────────────────────────────────
-- `docs/relevamientos/2026-08-08-s91a-REVERSA-regrant-cuenta-comercial-id.sql`,
-- con su nota: **revertir vuelve a romper las ocho.** No es neutra.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

GRANT SELECT (cuenta_comercial_id) ON public.prestadores TO authenticated;

COMMENT ON COLUMN public.prestadores.cuenta_comercial_id IS
  'FK a la cuenta comercial. LEGIBLE por authenticated A PROPÓSITO (S91, cura de regresión): ocho policies hacen EXISTS sobre esta columna y Postgres las evalúa aunque el otro brazo sea verdadero — sin el grant, ningún titular abre su negocio y el vet no abre un caso clínico. Es un uuid OPACO: su tabla destino sigue siendo owner-only, así que lo que se expone es un id que no se puede dereferenciar. NO agrupar esta columna con los veredictos internos (motivo_rechazo/aprobado_por/aprobado_en): esos SÍ están cerrados.';

-- ── CINTURONES ─────────────────────────────────────────────────────────────
DO $$
DECLARE c text; n integer := 0;
BEGIN
  -- (a) las OCHO sensibles siguen cerradas — la cura no abrió de más
  FOREACH c IN ARRAY ARRAY['lat','lon','direccion','email_contacto','metadata',
                           'motivo_rechazo','aprobado_por','aprobado_en'] LOOP
    IF has_column_privilege('authenticated','public.prestadores',c,'SELECT') THEN
      n := n + 1;
      RAISE WARNING 'CINTURON: % quedó LEGIBLE', c;
    END IF;
  END LOOP;
  IF n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: % columna(s) sensible(s) se reabrieron — la cura pasó de largo', n;
  END IF;

  -- (b) el SELECT de TABLA sigue revocado (la fuga original sigue cerrada)
  IF has_table_privilege('authenticated','public.prestadores','SELECT') THEN
    RAISE EXCEPTION 'CINTURON: volvió el SELECT de TABLA — la fuga de S91 se reabrió entera';
  END IF;

  -- (c) la columna curada, legible
  IF NOT has_column_privilege('authenticated','public.prestadores','cuenta_comercial_id','SELECT') THEN
    RAISE EXCEPTION 'CINTURON: el grant no quedó';
  END IF;
END $$;

COMMIT;
