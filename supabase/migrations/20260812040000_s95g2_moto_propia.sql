-- ═══════════════════════════════════════════════════════════════════════════
-- S95-G2 · EL FLETE CON MOTO PROPIA — firma del founder
--
-- **Firmado: el vendedor entrega con moto propia. El courier queda para v2,
-- modelado y apagado.** Esta migración ejecuta esa firma y sus consecuencias.
--
-- ── ① `flota_propia` SE ENCIENDE, y ya estaba esperando ────────────────────
-- No hubo que crear el tipo: existía apagado desde la M9, con este motivo
-- escrito textual — *«v1 no lo usa. Se enciende si el vendedor real reparte
-- con moto propia (D-745).»* La ley de la tanda funcionando: el modelo estaba
-- completo y lo único que faltaba era prender la opción.
--
-- ── ② 🔴 LA COBERTURA PASA A SER UNA FRONTERA, NO UN TARIFARIO ────────────
-- Founder: **todo Quito, valles incluidos. Fuera de eso no se entrega.**
-- Y la parte que importa de producto: **la app tiene que poder decirlo ANTES
-- del pago, no después.** Por eso `cotizar_envio_despensa` gana el destino y
-- rebota `fuera_de_cobertura` — tipado y legible, igual que `sin_regla_envio`.
-- *Un pedido que se cobra y después no se puede entregar no es un error de
-- logística: es una devolución, una disculpa y una familia que no vuelve.*
--
-- ── ③ LOS ESTADOS DEL COURIER SE APAGAN, y esto resuelve un ROJO del juez ──
-- El invariante 25 de S95-G salió rojo con CUATRO estados sin productor:
-- `en_transito`, `en_reparto`, `entrega_fallida`, `devuelto_origen`. Eran los
-- del courier, y con la firma del founder ya se sabe qué hacer con ellos:
--   · `en_transito` y `devuelto_origen` **se apagan** — describen un paquete
--     viajando en la red de un tercero, que en v1 no existe.
--   · `en_reparto` y `entrega_fallida` **se quedan y ganan productor**: con
--     moto propia el que sale a repartir es el vendedor, y que no haya nadie
--     en casa pasa igual (o más).
--
-- ── ④ G2.4 · LA COSTURA DE LA IDENTIDAD DE QUIEN ENTREGA ──────────────────
-- **Se modela ahora, no se construye.** Con courier hay una empresa detrás que
-- responde. **Con moto propia, quien llega a la casa donde vive la familia es
-- alguien del vendedor y nadie más lo respalda.** Columnas nullable, apagadas,
-- sin flujo. *Es la costura más barata hoy y la más cara después.*
--
-- Reversa (escrita ANTES): scripts/s95/2026-08-12-s95g2b-REVERSA.sql
--
-- ── DECLARACIÓN 76(g) ─────────────────────────────────────────────────────
-- 🔴 **LA VEDA RIGE.** El cinturón cotiza contra una regla real y la borra,
-- exigiendo que `reglas_envio` vuelva a su conteo inicial.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① EL TIPO SE ENCIENDE
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE cat_tipos_regla_envio
   SET activo = true, motivo_inactivo = NULL
 WHERE codigo = 'flota_propia';

-- Las 20 filas de `zonas_cobertura` SIGUEN APAGADAS y sin verificar: eran
-- tarifas de Picap y Borzo para el escenario de courier, que ya no es v1
-- (D-754). No se encienden. Se deja dicho para que nadie las "arregle".
COMMENT ON TABLE public.zonas_cobertura IS
  'D-754 · 20 filas del prototipo del 2-may con tarifas de Picap y Borzo, SIN '
  'VERIFICAR y con `activo=false`. Eran para el escenario de COURIER, que S95-G2 '
  'movió a v2 por firma del founder (moto propia). NO se encienden: cotizar con '
  'números que nadie confirmó es inventar el precio del flete.';

-- ═══════════════════════════════════════════════════════════════════════════
-- ② LOS ESTADOS DEL COURIER
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE cat_estados_pedido
   SET activo = false,
       motivo_inactivo = 'S95-G2: v1 entrega con MOTO PROPIA del vendedor. Este estado describe un paquete viajando en la red de un tercero; el courier es v2, modelado y apagado.'
 WHERE codigo IN ('en_transito', 'entregado_courier', 'devuelto_origen');

-- Y nace el camino corto del reparto propio: el vendedor sale con el pedido.
INSERT INTO cat_transiciones_pedido (desde, hasta, actor, activo, exige_motivo, descripcion)
VALUES ('esperando_courier', 'en_reparto', 'vendedor', true, false,
        'S95-G2 · reparto con moto propia: el vendedor sale con el pedido. Sin courier no hay tránsito intermedio.'),
       ('en_reparto', 'entrega_fallida', 'vendedor', true, true,
        'S95-G2 · con moto propia el intento fallido lo reporta el vendedor, y exige motivo: «no había nadie» no es lo mismo que «dirección equivocada».'),
       ('entrega_fallida', 'en_reparto', 'vendedor', true, false,
        'S95-G2 · el segundo intento también es del vendedor.')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ③ G2.4 · LA IDENTIDAD DE QUIEN ENTREGA — modelada, apagada
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.envios
  ADD COLUMN IF NOT EXISTS entregado_por_nombre     text,
  ADD COLUMN IF NOT EXISTS entregado_por_documento  text,
  ADD COLUMN IF NOT EXISTS codigo_verificacion      text,
  ADD COLUMN IF NOT EXISTS verificado_en            timestamptz;

COMMENT ON COLUMN public.envios.entregado_por_nombre IS
  'S95-G2 · QUIÉN entregó. NULLABLE Y SIN FLUJO EN v1. Con courier hay una '
  'empresa que responde; con moto propia, quien llega a la casa donde vive la '
  'familia es alguien del vendedor y nadie más lo respalda. Se modela ahora '
  'porque es la costura más barata hoy y la más cara después.';
COMMENT ON COLUMN public.envios.codigo_verificacion IS
  'S95-G2 · El código que la familia coteja EN LA PUERTA antes de abrir. '
  'NULLABLE, apagado en v1, sin flujo construido: solo la forma.';

-- ═══════════════════════════════════════════════════════════════════════════
-- ④ 🔴 EL COTIZADOR APRENDE EL DESTINO Y LA FRONTERA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.cotizar_envio_despensa(
  p_cuenta_comercial_id uuid,
  p_subtotal            numeric,
  p_peso_fisico_kg      numeric DEFAULT 0,
  p_peso_volumetrico_kg numeric DEFAULT 0,
  p_country_code        text DEFAULT 'EC',
  -- 🔴 EL DESTINO. Nace con DEFAULT NULL a propósito: los llamadores de S95-E
  --    no se rompen, y cuando no se declara destino la respuesta DICE que no
  --    se pudo verificar la cobertura en vez de afirmar que está cubierta.
  p_ciudad_destino      text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_regla    record;
  v_peso     numeric;
  v_costo    numeric;
  v_cubiertas jsonb;
  v_cubre    boolean;
BEGIN
  v_peso := GREATEST(COALESCE(p_peso_fisico_kg,0), COALESCE(p_peso_volumetrico_kg,0));

  SELECT r.*, t.usa_peso INTO v_regla
  FROM reglas_envio r
  JOIN cat_tipos_regla_envio t ON t.codigo = r.tipo
  WHERE r.cuenta_comercial_id = p_cuenta_comercial_id
    AND r.country_code = p_country_code
    AND r.activo AND t.activo
    AND now() >= r.vigencia_desde
    AND (r.vigencia_hasta IS NULL OR now() < r.vigencia_hasta)
  ORDER BY r.prioridad DESC, r.vigencia_desde DESC
  LIMIT 1;

  IF v_regla.id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false, 'error', 'sin_regla_envio',
      'detalle', 'El vendedor no tiene regla de envío vigente para ese país.');
  END IF;

  -- 🔴 LA FRONTERA, ANTES DEL PRECIO. Si la regla declara cobertura y el
  --    destino no está adentro, **no se cotiza**: se dice que no se entrega
  --    ahí. Comparación normalizada (sin acentos, sin mayúsculas) porque
  --    «Cumbayá» y «cumbaya» son el mismo lugar y una tilde no puede ser la
  --    diferencia entre vender y no vender.
  v_cubiertas := v_regla.parametros->'ciudades_cubiertas';
  IF v_cubiertas IS NOT NULL AND jsonb_array_length(v_cubiertas) > 0 THEN
    IF p_ciudad_destino IS NULL OR length(trim(p_ciudad_destino)) = 0 THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'destino_no_declarado',
        'detalle', 'Este vendedor entrega solo en ciertas ciudades y no se declaró el destino.');
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v_cubiertas) c
      WHERE lower(unaccent_simple(c)) = lower(unaccent_simple(p_ciudad_destino))
    ) INTO v_cubre;
    IF NOT v_cubre THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'fuera_de_cobertura',
        'detalle', format('Todavía no entregamos en %s.', p_ciudad_destino),
        'ciudades_cubiertas', v_cubiertas);
    END IF;
  END IF;

  v_costo := CASE v_regla.tipo
    WHEN 'plana' THEN (v_regla.parametros->>'monto')::numeric
    WHEN 'gratis_sobre_umbral' THEN
      CASE WHEN p_subtotal >= (v_regla.parametros->>'umbral')::numeric
           THEN 0 ELSE (v_regla.parametros->>'monto_bajo_umbral')::numeric END
    -- S95-G2: el reparto propio no le cobra flete al cliente. El costo real
    -- —nafta, tiempo, moto— lo absorbe el vendedor, y `pagado_por` lo dice.
    WHEN 'flota_propia' THEN COALESCE((v_regla.parametros->>'monto')::numeric, 0)
    ELSE NULL END;

  IF v_costo IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tipo_regla_sin_motor',
      'detalle', format('El tipo "%s" está modelado pero su cálculo no se construyó en v1.', v_regla.tipo));
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'costo', round(v_costo, 2),
    'moneda', v_regla.moneda,
    'regla_id', v_regla.id,
    'tipo_regla', v_regla.tipo,
    'peso_fisico_kg', p_peso_fisico_kg,
    'peso_volumetrico_kg', p_peso_volumetrico_kg,
    'peso_facturable_kg', v_peso,
    'parametros_aplicados', v_regla.parametros,
    -- HONESTIDAD: si la regla no declara cobertura, esta cotización no
    -- verificó nada. Se dice, en vez de dejar creer que sí.
    'cobertura_declarada', (v_cubiertas IS NOT NULL AND jsonb_array_length(v_cubiertas) > 0),
    'cotizado_en', now());
END $$;

-- Helper de normalización: sin extensión `unaccent` instalada, se resuelve con
-- `translate` — suficiente para el castellano y sin agregar una dependencia
-- que después hay que mantener.
CREATE OR REPLACE FUNCTION public.unaccent_simple(p text)
RETURNS text LANGUAGE sql IMMUTABLE
AS $$ SELECT translate(COALESCE(p,''), 'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouAEIOUnNuU'); $$;
REVOKE ALL ON FUNCTION public.unaccent_simple(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unaccent_simple(text) TO authenticated;

REVOKE ALL ON FUNCTION public.cotizar_envio_despensa(uuid, numeric, numeric, numeric, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cotizar_envio_despensa(uuid, numeric, numeric, numeric, text, text)
  TO authenticated;
-- La firma vieja de 5 argumentos muere: dos sobrecargas del mismo cotizador
-- serían dos verdades sobre el precio del flete (L-119).
DROP FUNCTION IF EXISTS public.cotizar_envio_despensa(uuid, numeric, numeric, numeric, text);

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN · la frontera rebota, el destino cubierto pasa
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_cc uuid; v_dueno uuid; v_reglas_antes int; v_n int; v_r jsonb;
BEGIN
  SELECT count(*) INTO v_reglas_antes FROM reglas_envio;
  SELECT cc.id, cc.owner_profile_id INTO v_cc, v_dueno
  FROM cuentas_comerciales cc WHERE cc.estado='activa' AND cc.owner_profile_id IS NOT NULL LIMIT 1;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'ABORTA: sin cuenta activa no se puede probar el cotizador.'; END IF;

  -- El tipo tiene que estar ENCENDIDO, o la regla ni se puede cargar.
  IF NOT (SELECT activo FROM cat_tipos_regla_envio WHERE codigo='flota_propia') THEN
    RAISE EXCEPTION 'ABORTA: flota_propia sigue apagado.';
  END IF;

  INSERT INTO reglas_envio (cuenta_comercial_id, country_code, tipo, parametros,
                            moneda, prioridad, vigencia_desde, activo, notas)
  VALUES (v_cc, 'EC', 'flota_propia',
          jsonb_build_object('monto', 0, 'pagado_por', 'vendedor',
                             'ciudades_cubiertas', jsonb_build_array('Quito','Cumbayá')),
          'USD', 999, now(), true, '__cint_s95g2b');

  -- ── A · destino CUBIERTO → cotiza, y cuesta cero ─────────────────────────
  v_r := cotizar_envio_despensa(v_cc, 100, 5, 2, 'EC', 'Quito');
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: un destino CUBIERTO no cotizó: %', v_r->>'error';
  END IF;
  IF (v_r->>'costo')::numeric <> 0 THEN
    RAISE EXCEPTION 'ABORTA: el reparto propio cobró % al cliente.', v_r->>'costo';
  END IF;
  IF (v_r->>'cobertura_declarada')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: la cotización no declara que verificó cobertura.';
  END IF;

  -- ── A2 · el acento NO puede decidir si se vende ──────────────────────────
  v_r := cotizar_envio_despensa(v_cc, 100, 5, 2, 'EC', 'cumbaya');
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: «cumbaya» sin tilde quedó fuera de cobertura — una tilde no puede ser la diferencia entre vender y no vender.';
  END IF;

  -- ── B · destino FUERA → rebota TIPADO, jamás con un costo inventado ──────
  v_r := cotizar_envio_despensa(v_cc, 100, 5, 2, 'EC', 'Guayaquil');
  IF (v_r->>'ok')::boolean IS TRUE THEN
    RAISE EXCEPTION 'ABORTA: cotizó un destino FUERA de cobertura (costo %).', v_r->>'costo';
  END IF;
  IF v_r->>'error' <> 'fuera_de_cobertura' THEN
    RAISE EXCEPTION 'ABORTA: rebotó con «%» y no con fuera_de_cobertura.', v_r->>'error';
  END IF;
  IF v_r->>'detalle' IS NULL OR length(v_r->>'detalle') = 0 THEN
    RAISE EXCEPTION 'ABORTA: el rebote no trae un detalle legible para la familia.';
  END IF;

  -- ── C · sin destino declarado, tampoco inventa ───────────────────────────
  v_r := cotizar_envio_despensa(v_cc, 100, 5, 2, 'EC', NULL);
  IF (v_r->>'ok')::boolean IS TRUE THEN
    RAISE EXCEPTION 'ABORTA: cotizó sin saber a dónde va.';
  END IF;

  -- ── D · CONTRA-CASO: una regla SIN cobertura declarada sigue cotizando ───
  -- Sin esto, agregar la frontera habría roto a todo vendedor que aún no la
  -- declaró — y el arreglo se habría llevado puesto el camino feliz.
  UPDATE reglas_envio
     SET parametros = parametros - 'ciudades_cubiertas'
   WHERE notas = '__cint_s95g2b';
  v_r := cotizar_envio_despensa(v_cc, 100, 5, 2, 'EC', 'Guayaquil');
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: sin cobertura declarada dejó de cotizar — se rompió el camino de siempre.';
  END IF;
  IF (v_r->>'cobertura_declarada')::boolean IS TRUE THEN
    RAISE EXCEPTION 'ABORTA: dice que verificó cobertura cuando la regla no declara ninguna.';
  END IF;

  -- ── E · los estados del courier quedaron apagados, con su motivo ─────────
  SELECT count(*) INTO v_n FROM cat_estados_pedido
   WHERE codigo IN ('en_transito','entregado_courier','devuelto_origen')
     AND (activo OR motivo_inactivo IS NULL);
  IF v_n <> 0 THEN RAISE EXCEPTION 'ABORTA: quedaron % estados de courier activos o sin motivo.', v_n; END IF;

  -- ── F · el reparto propio tiene camino ───────────────────────────────────
  SELECT count(*) INTO v_n FROM cat_transiciones_pedido
   WHERE desde='esperando_courier' AND hasta='en_reparto' AND actor='vendedor' AND activo;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ABORTA: el vendedor no tiene cómo salir a repartir.'; END IF;

  DELETE FROM reglas_envio WHERE notas = '__cint_s95g2b';
  SELECT count(*) INTO v_n FROM reglas_envio;
  IF v_n <> v_reglas_antes THEN
    RAISE EXCEPTION 'ABORTA 76(g): reglas_envio quedó en % y arrancó en %.', v_n, v_reglas_antes;
  END IF;

  RAISE NOTICE 'CINTURÓN S95-G2b: flota propia encendida, la frontera rebota tipada, el acento no decide, y sin cobertura declarada el camino de siempre sigue vivo. Residuo 0.';
END $$;

COMMIT;
