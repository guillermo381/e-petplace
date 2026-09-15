-- ═══════════════════════════════════════════════════════════════════════════
-- S116-A · LA VITRINA DEJA DE MOSTRAR DATOS DE PRUEBA
--
-- Lo vio C en su lote 5 y lo confirmó el censo: en «Cerca de ti» aparecen
-- «Clinica S97 (borrable)», «PASEOS DE PRUEBA S97 - NO REAL» y «Wizard». **Es
-- lo primero que un invitado de F&F ve el 1 de octubre.**
--
-- ── LO MEDIDO ANTES DE TOCAR NADA ──────────────────────────────────────────
--   prestadores visibles ......... 11, de los cuales **7** dicen en su propio
--                                   nombre que son de prueba
--   ofertas de despensa publicadas 563, de **5** vendedores — y **4 de esos 5
--                                   se llaman «(borrable)», «NO REAL» o
--                                   «de Pruebas»**: son **545 ofertas, el 96,8 %**
--   adoptables públicos .......... 4, con nombres normales (Tito · Mica ·
--                                   Bruno · Luna) — NO se tocan
--
-- 🔴 LA DESPENSA ERA EL PEOR, Y NO ESTABA EN EL REPORTE: el nombre del vendedor
-- se ve en la ficha del producto. *Nadie miró la despensa porque el síntoma
-- estaba en «Cerca de ti».*
--
-- ── EL MECANISMO ES EL QUE LA CASA YA TIENE ────────────────────────────────
-- `creado_por_sistema` **text**, igual que en `mascotas` — una etiqueta que dice
-- QUIÉN lo creó y por qué, no un booleano. **NADA SE BORRA**: las filas siguen,
-- con sus citas y su historia, y dejan de ser públicas.
--
-- ⚠️ **Y LA MARCA SOLA NO ALCANZA: se cablea en las DOS VISTAS.** Una columna
-- marcada que ninguna vista mira es una etiqueta que no esconde nada — *que es
-- exactamente el defecto de «marcar» sin efecto.*
--
-- ⚠️ SE MARCA POR PATRÓN **CON ASERCIÓN DE CANTIDAD**: si el patrón cae sobre
-- más o menos filas de las medidas, la migración ABORTA. *Un `UPDATE ... LIKE`
-- sin contar es cómo se despublica un negocio real por llamarse «Prueba y
-- Compañía».*
--
-- 76(g): NO RIGE — DDL + marca de 16 filas, cero backfill de datos de negocio.
-- REVERSA: docs/relevamientos/2026-09-15-s116a-REVERSA-vitrina-sin-pruebas.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.prestadores         ADD COLUMN IF NOT EXISTS creado_por_sistema text;
ALTER TABLE public.cuentas_comerciales ADD COLUMN IF NOT EXISTS creado_por_sistema text;

COMMENT ON COLUMN public.prestadores.creado_por_sistema IS
  'Etiqueta de dato interno (mismo criterio que mascotas.creado_por_sistema). NO NULL ⇒ fuera de v_prestadores_publicos. Nada se borra: deja de ser público.';
COMMENT ON COLUMN public.cuentas_comerciales.creado_por_sistema IS
  'Etiqueta de dato interno. NO NULL ⇒ sus ofertas salen de v_vitrina_publicada.';

DO $marca$
DECLARE v_p int; v_c int;
BEGIN
  UPDATE prestadores SET creado_por_sistema = 'prueba_interna_s116'
   WHERE estado = 'activo'
     AND creado_por_sistema IS NULL
     AND nombre_comercial ~* '(borrable|no real|de prueba|prueba|^wizard$)';
  GET DIAGNOSTICS v_p = ROW_COUNT;

  UPDATE cuentas_comerciales SET creado_por_sistema = 'prueba_interna_s116'
   WHERE creado_por_sistema IS NULL
     AND coalesce(nombre_comercial, razon_social) ~* '(borrable|no real|de pruebas|prueba)';
  GET DIAGNOSTICS v_c = ROW_COUNT;

  -- LA ASERCIÓN: los números son los MEDIDOS el 15-sep. Si el patrón cambió de
  -- alcance, esto para en vez de despublicar algo que nadie revisó.
  IF v_p <> 7 THEN RAISE EXCEPTION 'marca: % prestadores (se midieron 7) — la migración PARA', v_p; END IF;
  IF v_c <> 9 THEN RAISE EXCEPTION 'marca: % cuentas (se midieron 9) — la migración PARA', v_c; END IF;
  RAISE NOTICE 'marcados: % prestadores · % cuentas comerciales', v_p, v_c;
END $marca$;

-- ── LAS DOS VISTAS ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_vitrina_publicada AS
 SELECT o.id AS oferta_id, o.cuenta_comercial_id, o.precio, o.moneda,
        o.country_code, o.hay_stock,
        pv.id AS variante_id, pv.presentacion, pv.contenido_valor,
        pv.contenido_unidad, pv.peso_kg,
        p.id AS producto_id, p.nombre, p.marca, p.familia_codigo,
        p.especies_aplicables, p.momentos_aplicables, p.alergenos,
        p.composicion_estado, p.es_dieta_prescripcion, p.imagen_url, p.imagenes
   FROM ofertas o
   JOIN producto_variantes pv ON pv.id = o.variante_id AND pv.activo
   JOIN productos p ON p.id = pv.producto_id AND p.estado = 'activo'
   JOIN cuentas_comerciales cc ON cc.id = o.cuenta_comercial_id
  WHERE o.estado = 'publicada'
    AND cc.creado_por_sistema IS NULL;

-- `v_prestadores_publicos` NO se re-transcribe: son 40 columnas, un LATERAL y
-- dos subconsultas, y **copiarlas a mano es cómo dos definiciones de la misma
-- vista empiezan a divergir**. Se toma su definición VIVA y se le agrega la
-- cláusula, **con una aserción sobre la cola**: si el `WHERE` cambió de forma,
-- esto ABORTA en vez de generar una vista distinta de la que alguien revisó.
DO $vista$
DECLARE v_def text; v_cola text := 'WHERE p.estado = ''activo''::text;';
BEGIN
  v_def := pg_get_viewdef('public.v_prestadores_publicos'::regclass, true);

  IF position('creado_por_sistema' in v_def) > 0 THEN
    RAISE NOTICE 'la vista ya filtraba por creado_por_sistema — nada que hacer';
    RETURN;
  END IF;

  IF right(btrim(v_def), length(v_cola)) <> v_cola THEN
    RAISE EXCEPTION 'la cola de v_prestadores_publicos no es la medida (%) — la migración PARA',
      right(btrim(v_def), 60);
  END IF;

  v_def := left(btrim(v_def), length(btrim(v_def)) - length(v_cola))
           || 'WHERE p.estado = ''activo''::text AND p.creado_por_sistema IS NULL;';
  EXECUTE 'CREATE OR REPLACE VIEW public.v_prestadores_publicos AS ' ||
          left(v_def, length(v_def) - 1);
END $vista$;

-- ── CINTURÓN ──────────────────────────────────────────────────────────────
DO $cint$
DECLARE v_pres int; v_ofe int; v_marcados int;
BEGIN
  -- ① las dos vistas filtran de verdad
  IF position('creado_por_sistema' in pg_get_viewdef('public.v_prestadores_publicos'::regclass, true)) = 0 THEN
    RAISE EXCEPTION 'cinturon ①: v_prestadores_publicos NO filtra por la marca — la marca sería decorativa';
  END IF;
  IF position('creado_por_sistema' in pg_get_viewdef('public.v_vitrina_publicada'::regclass, true)) = 0 THEN
    RAISE EXCEPTION 'cinturon ①b: v_vitrina_publicada NO filtra por la marca';
  END IF;

  -- ② los números DESPUÉS, contra los medidos antes
  SELECT count(*) INTO v_pres FROM v_prestadores_publicos;
  SELECT count(*) INTO v_ofe  FROM v_vitrina_publicada;
  IF v_pres <> 4 THEN
    RAISE EXCEPTION 'cinturon ②: quedan % prestadores visibles (se esperaban 4: Aurora, Los Shyris, Paseos Andres, Satori Latam)', v_pres;
  END IF;
  IF v_ofe <> 18 THEN
    RAISE EXCEPTION 'cinturon ②b: quedan % ofertas visibles (se esperaban 18, las de Clínica Aurora)', v_ofe;
  END IF;

  -- ③ NADA SE BORRÓ — el conteo de filas sigue entero
  SELECT count(*) INTO v_marcados FROM prestadores WHERE creado_por_sistema IS NOT NULL;
  IF (SELECT count(*) FROM prestadores) <> 12 THEN
    RAISE EXCEPTION 'cinturon ③: hay % prestadores en la tabla (eran 12) — algo se borró', (SELECT count(*) FROM prestadores);
  END IF;

  -- ④ CONTROL NEGATIVO: los reales NO quedaron marcados.
  IF EXISTS (SELECT 1 FROM prestadores
              WHERE creado_por_sistema IS NOT NULL
                AND nombre_comercial IN ('Clínica Aurora','Clínica Los Shyris','Paseos Andres','Satori Latam sas')) THEN
    RAISE EXCEPTION 'cinturon ④: el patrón se llevó puesto un negocio que NO es de prueba';
  END IF;

  RAISE NOTICE 'cinturon: 4 brazos verdes · prestadores 11 → % · ofertas 563 → % · marcados % (cero borrados)',
    v_pres, v_ofe, v_marcados;
END $cint$;

COMMIT;
