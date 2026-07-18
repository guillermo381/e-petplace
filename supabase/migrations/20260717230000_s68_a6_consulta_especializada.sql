-- ═════════════════════════════════════════════════════════════════════
-- S68-A6 — el tipo que A1 omitió: `consulta_especializada`
-- Origen: nota honesta del reporte S68-B5 — la decisión firmada (2) del
-- founder ("un precio/duración v1 para cita especializada") no tenía
-- comprable que la persista. D-431 sigue intacta (precio/duración POR
-- especialidad — esto es el precio ÚNICO v1 del comprable).
--
-- 76(g) — declaración de veda: migración ADITIVA pura (INSERT de fila
-- de catálogo + re-creación del CHECK de prestador_servicios). Ningún
-- backfill anclado a datos vivos; NINGÚN lector tocado (los V2 filtran
-- por categoria IN + reservable — el tipo entra SOLO, verificado por
-- assert aparte con ROLLBACK). La veda NO rige; sin byte-check porque
-- no hay lector tocado (declarado, letra del pedido A6).
-- Ley S67 al cierre (toca catálogo) + sonda L-140 de los tomadores.
-- ═════════════════════════════════════════════════════════════════════

INSERT INTO public.tipos_servicio
  (codigo, nombre, descripcion, icono, categoria, duracion_default_minutos,
   requiere_historia_clinica, requiere_resultado, es_medico, activo,
   orden_display, country_codes, requiere_validacion_admin,
   especies_elegibles, concurrencia, cupo_techo, reservable, reserva_solo_hoy)
VALUES
  ('consulta_especializada', 'Consulta especializada',
   'Consulta con un veterinario por su especialidad declarada. Precio y duración únicos v1 (por-especialidad = D-431).',
   '🐾', 'veterinario', 45,
   true, false, true, true,
   3, '["EC"]'::jsonb, true,
   '["perro","gato","conejo","ave","roedor","reptil","pez","huron","cobaya","otro","equino"]'::jsonb,
   'exclusiva', NULL, true, false)
ON CONFLICT (codigo) DO NOTHING;

-- El CHECK de prestador_servicios.tipo_servicio gana el código (lista
-- literal relevada de pg_get_constraintdef post-A1, L-109):
ALTER TABLE public.prestador_servicios
  DROP CONSTRAINT prestador_servicios_tipo_servicio_check;
ALTER TABLE public.prestador_servicios
  ADD CONSTRAINT prestador_servicios_tipo_servicio_check
  CHECK (tipo_servicio = ANY (ARRAY[
    'consulta_general'::text, 'vacunacion'::text, 'cirugia'::text,
    'telemedicina'::text, 'emergencia'::text, 'grooming'::text,
    'grooming_completo'::text, 'adiestramiento'::text, 'laboratorio'::text,
    'radiografia'::text, 'ecografia'::text, 'certificado_viaje'::text,
    'certificado_apoyo'::text, 'servicio_exequial'::text,
    'registro_evento'::text, 'vacunacion_internacional'::text,
    'hotel'::text, 'guarderia_mensual'::text, 'guarderia_dia'::text,
    'paseo'::text, 'paseo_paquete'::text, 'paseo_mensual'::text,
    'urgencia_local'::text, 'urgencia_domicilio'::text,
    'consulta_especializada'::text, 'otro'::text
  ]));

-- ─── CIERRE — ley S67 + semilla verificada + sonda L-140 ─────────────

DO $do$
DECLARE r record; v_n int := 0;
BEGIN
  FOR r IN SELECT * FROM verificar_coherencia_tablas_tipadas() LOOP
    v_n := v_n + 1;
    RAISE NOTICE 'S68-A6 D-415 incoherencia: % → % (%)', r.codigo, r.tabla_tipada, r.problema;
  END LOOP;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'S68-A6 abort: verificar_coherencia_tablas_tipadas() encontró % incoherencias', v_n;
  END IF;
  RAISE NOTICE 'S68-A6: coherencia tabla_tipada ↔ schema real: LIMPIA';
END;
$do$;

DO $do$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM tipos_servicio
  WHERE codigo = 'consulta_especializada'
    AND es_medico AND categoria = 'veterinario'
    AND duracion_default_minutos = 45
    AND requiere_historia_clinica AND requiere_validacion_admin
    AND NOT requiere_resultado
    AND concurrencia = 'exclusiva' AND cupo_techo IS NULL
    AND reservable AND NOT reserva_solo_hoy
    AND especies_elegibles IS NOT NULL;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'S68-A6 abort: consulta_especializada mal sembrada';
  END IF;
  RAISE NOTICE 'S68-A6: consulta_especializada sembrada con el contrato completo';
END;
$do$;

-- Sonda L-140 de los TOMADORES del tipo (ningún body tocado — la sonda
-- prueba que siguen sin anon tras la migración):
DO $do$
DECLARE
  r record;
  v_malos text := '';
BEGIN
  FOR r IN
    SELECT p.proname, p.proacl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        '_vet_ofertas_cobrables',
        'obtener_oferta_vet',
        'obtener_inicios_vet_disponibles',
        'obtener_veterinarios_disponibles',
        'crear_bloqueo_agenda'
      )
  LOOP
    RAISE NOTICE 'S68-A6 L-140 proacl %: %', r.proname, r.proacl;
    IF r.proacl::text LIKE '%anon=%' THEN
      v_malos := v_malos || r.proname || ' ';
    END IF;
  END LOOP;
  IF v_malos <> '' THEN
    RAISE EXCEPTION 'S68-A6 abort L-140: anon con EXECUTE en: %', v_malos;
  END IF;
  RAISE NOTICE 'S68-A6 L-140: los tomadores del tipo siguen sin anon';
END;
$do$;

NOTIFY pgrst, 'reload schema';
