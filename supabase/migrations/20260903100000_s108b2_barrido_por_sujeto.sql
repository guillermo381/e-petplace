-- ═══════════════════════════════════════════════════════════════════════════
-- S108-B2 · EL BARRIDO DEJA DE PREGUNTARLE A LAS TABLAS Y LE PREGUNTA AL RIEL
--
-- 🔴 EL DEFECTO, MEDIDO — y el número es el argumento entero:
--    `pagos_pendientes_de_conciliar` es el ÚNICO lector de los dos barridos y
--    su `FROM` es `compras`. Contra la base, hoy:
--
--        sujeto   huérfanos   los ve el lector   INVISIBLES
--        cita         6              0               6
--        pedido       6              6               0
--        TOTAL       12              6               6
--
--    **Ve exactamente la mitad, y la mitad que no ve es la que
--    `LETRA_PAGO_CITAS` §4 declara cubierta.**
--
--    ⚠️ Y NO SON PLATA. Hasta el 30-sep esto es ambiente de pruebas: cada una
--    de esas filas es dato de prueba. El número no mide cuánto se perdió —
--    mide que el mecanismo tiene un punto ciego con la forma exacta de los
--    sujetos que no nombra. El disparo real del barrido es producción (1-oct).
--
-- 🔴 EL DEFECTO NO ES «LE FALTA LA CITA»: ES QUE PREGUNTA POR TABLA.
--    Agregarle un `UNION` con `evento_cita_servicio` habría curado el síntoma y
--    dejado la puerta abierta para el séptimo sujeto. *Un lector que enumera
--    tablas necesita que alguien se acuerde de él cada vez que nace un sujeto —
--    y el olvido no da síntoma: da un conjunto más chico, que se lee igual que
--    «no hay nada que barrer».*
--
--    ⇒ Se pregunta al INTENTO, que es **lo único idéntico para los seis**: un
--    huérfano es un intento que se disparó (tiene id del proveedor o referencia
--    corta), no llegó a estado terminal y ya pasó su gracia. Eso no menciona
--    una sola tabla de sujeto. **El lector nuevo no tiene un `FROM` por sujeto:
--    tiene CERO.**
--
-- 🔴 Y EL «NO COMPILA»: el vocabulario de sujetos pasa a ser DATO
--    (`cat_sujetos_de_pago`) y un guard compara ese catálogo contra las
--    columnas que el XOR de `pagos_intentos` declara. Una migración que agregue
--    un sujeto al XOR y no lo agregue al catálogo **falla ahí mismo**.
--    *Es el equivalente del guard `never` de `cobrarSujeto`: la rama que falta
--    no se descubre en producción, se descubre al aplicar.*
--
-- 🔴 VEDA 76(g): NO RIGE. Tabla de catálogo nueva + dos funciones nuevas.
--    `pagos_pendientes_de_conciliar` NO se toca ni se dropea — sigue viva
--    mientras sus dos consumidores migran. Cero backfill, cero filas movidas.
--
-- REVERSA: docs/relevamientos/2026-09-03-s108b2-REVERSA-M1.sql (escrita ANTES).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ① EL VOCABULARIO, COMO DATO ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cat_sujetos_de_pago (
  codigo           text PRIMARY KEY,
  columna_intento  text NOT NULL UNIQUE,
  descripcion      text NOT NULL
);

COMMENT ON TABLE public.cat_sujetos_de_pago IS
  'S108-B2 · los sujetos que pueden cobrar por el riel, como DATO y no como '
  'CASE repartido en N funciones. `verificar_cobertura_sujetos_de_pago()` '
  'exige que esta tabla y el XOR de pagos_intentos digan lo mismo.';

INSERT INTO public.cat_sujetos_de_pago (codigo, columna_intento, descripcion) VALUES
  ('pedido',                'pedido_id',                'Despensa · el pedido de una compra'),
  ('cita',                  'cita_id',                  'Servicios · la cita de un oficio'),
  ('bono',                  'bono_id',                  'Guardería y paseo · el paquete de días'),
  ('recurrencia',           'recurrencia_id',           'Despensa · la compra recurrente'),
  ('suscripcion_servicio',  'suscripcion_servicio_id',  'Servicios · el plan mensual'),
  ('mensualidad_guarderia', 'guarderia_suscripcion_id', 'Guardería · el mandato mensual')
ON CONFLICT (codigo) DO UPDATE
  SET columna_intento = EXCLUDED.columna_intento,
      descripcion     = EXCLUDED.descripcion;

ALTER TABLE public.cat_sujetos_de_pago ENABLE ROW LEVEL SECURITY;
/* Catálogo de vocabulario: lo lee el motor. Nadie de afuera lo necesita, y
   `L-140` manda cerrar lo que no se abrió a propósito. */
REVOKE ALL ON public.cat_sujetos_de_pago FROM anon, authenticated, PUBLIC;

-- ── ② EL GUARD DE COBERTURA — el «no compila» ──────────────────────────────
CREATE OR REPLACE FUNCTION public.verificar_cobertura_sujetos_de_pago()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_xor text[]; v_cat text[]; v_falta text[]; v_sobra text[];
BEGIN
  /* Las columnas que el XOR declara sujetos. Se leen del CONSTRAINT VIVO, no
     de una lista escrita acá: *una segunda lista es una segunda verdad sobre
     cuántos sujetos hay, y la que se olvida es siempre la copia.* */
  SELECT array_agg(m[1] ORDER BY m[1]) INTO v_xor
    FROM pg_constraint c,
         LATERAL regexp_matches(pg_get_constraintdef(c.oid),
                                '\(([a-z_]+) IS NOT NULL\)', 'g') AS m
   WHERE c.conrelid = 'public.pagos_intentos'::regclass
     AND c.conname  = 'chk_intento_un_solo_sujeto';

  IF v_xor IS NULL OR array_length(v_xor, 1) IS NULL THEN
    /* 🔴 FAIL-CLOSED. Si el constraint cambió de nombre o de forma y el regex
       no engancha, esto NO puede devolver «todo bien»: sería un guard que
       aprueba porque no encontró nada que mirar. */
    RAISE EXCEPTION 'cobertura_sujetos: no pude leer el XOR de pagos_intentos '
      '(¿cambió chk_intento_un_solo_sujeto?) — el guard NO aprueba a ciegas'
      USING ERRCODE='22023';
  END IF;

  SELECT array_agg(columna_intento ORDER BY columna_intento) INTO v_cat
    FROM cat_sujetos_de_pago;

  SELECT array_agg(x) INTO v_falta FROM unnest(v_xor) x WHERE x <> ALL(COALESCE(v_cat,'{}'));
  SELECT array_agg(y) INTO v_sobra FROM unnest(COALESCE(v_cat,'{}')) y WHERE y <> ALL(v_xor);

  IF v_falta IS NOT NULL THEN
    RAISE EXCEPTION 'cobertura_sujetos: el XOR declara sujetos que el catálogo '
      'no nombra: % — el barrido no los vería y nadie se enteraría', v_falta
      USING ERRCODE='22023';
  END IF;
  IF v_sobra IS NOT NULL THEN
    RAISE EXCEPTION 'cobertura_sujetos: el catálogo nombra columnas que el XOR '
      'no declara sujetos: % — el barrido buscaría una columna que no cobra', v_sobra
      USING ERRCODE='22023';
  END IF;

  RETURN jsonb_build_object('ok', true, 'sujetos', array_length(v_xor,1), 'columnas', v_xor);
END $fn$;

COMMENT ON FUNCTION public.verificar_cobertura_sujetos_de_pago() IS
  'S108-B2 · el «no compila» del barrido. Compara cat_sujetos_de_pago contra el '
  'XOR VIVO de pagos_intentos y REVIENTA si difieren. Se corre en TODA migración '
  'futura que agregue o quite un sujeto — el precedente es '
  'verificar_coherencia_tablas_tipadas().';

-- ── ③ EL LECTOR — cero FROM por sujeto ─────────────────────────────────────
/* El tipo de retorno cambia si se agrega una columna ⇒ DROP antes del CREATE.
   `CREATE OR REPLACE` sobre otra firma de tabla rebota. */
DROP FUNCTION IF EXISTS public.pagos_huerfanos_por_sujeto(integer, text);
CREATE OR REPLACE FUNCTION public.pagos_huerfanos_por_sujeto(
  p_minutos_de_gracia integer DEFAULT 10,
  p_proveedor         text    DEFAULT NULL
) RETURNS TABLE(
  intento_id        uuid,
  sujeto_tipo       text,
  sujeto_id         uuid,
  /* 🔴 `compra_id` NO es un sexto sujeto: es CONTEXTO del intento —una compra
     agrupa N pedidos— y viaja porque `resolver_consulta_activa` está tecleada
     por compra. Es una COLUMNA de `pagos_intentos`, no un JOIN a otra tabla:
     el lector sigue sin tener un solo `FROM` de sujeto. */
  compra_id         uuid,
  proveedor         text,
  transaction_id    text,
  referencia_corta  text,
  monto             numeric,
  creado_en         timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  /* 🔴 QUÉ ES UN HUÉRFANO, sin nombrar una sola tabla de sujeto: un intento que
     SE DISPARÓ —tiene id del proveedor o referencia corta, o sea que hay a
     quién preguntarle— y **no llegó a estado terminal**. `iniciado` y
     `pendiente` son los dos no-terminales; con eso quedan afuera `aprobado`,
     `rechazado`, `expirado`, `reversado` y `reverso_fallido`, así que el filtro
     de `D-916` (los reversados no se re-preguntan) queda SUBSUMIDO y no hay que
     acordarse de él. */
  SELECT i.id,
         /* 🔴 EL SUJETO SE RESUELVE POR CATÁLOGO, no por un CASE. `to_jsonb`
            convierte la fila en objeto y el catálogo dice qué llave mirar ⇒
            **agregar un sujeto es agregar una FILA, no editar esta función**. */
         COALESCE(s.codigo, 'sin_resolver'),
         (to_jsonb(i) ->> s.columna_intento)::uuid,
         i.compra_id,
         i.proveedor, i.proveedor_transaction_id, i.referencia_corta,
         i.monto, i.creado_en
    FROM pagos_intentos i
    LEFT JOIN LATERAL (
      SELECT c.codigo, c.columna_intento
        FROM cat_sujetos_de_pago c
       WHERE to_jsonb(i) ->> c.columna_intento IS NOT NULL
       LIMIT 1
    ) s ON true
   WHERE i.estado IN ('iniciado','pendiente')
     /* Sin id ni referencia no hay a quién preguntarle: no es huérfano, es un
        intento que nunca salió. */
     AND (i.proveedor_transaction_id IS NOT NULL OR i.referencia_corta IS NOT NULL)
     AND i.creado_en < now() - make_interval(mins => p_minutos_de_gracia)
     /* `NULL` significa TODOS, no «ninguno» — mismo contrato que el lector viejo,
        para que la llamada de un solo argumento siga significando lo mismo. */
     AND (p_proveedor IS NULL OR i.proveedor = p_proveedor)
   ORDER BY i.creado_en
$fn$;

/* 🔴 `sin_resolver` NO ES UN DESCUIDO: es la mitad del mecanismo. Si algún día
   un intento nace con un sujeto que el catálogo no nombra, el `LEFT JOIN` lo
   deja pasar CON ESE RÓTULO en vez de dejarlo caer del conjunto. *Un lector que
   descarta lo que no entiende devuelve un número más chico, y un número más
   chico se lee igual que «no hay nada que barrer».* El guard de ② lo impide al
   aplicar; esto lo hace ruidoso si igual pasara. */

REVOKE ALL ON FUNCTION public.pagos_huerfanos_por_sujeto(integer, text)
  FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.verificar_cobertura_sujetos_de_pago()
  FROM anon, authenticated, PUBLIC;

-- ═══ CINTURÓN ══════════════════════════════════════════════════════════════
/* 🔴 Se prueba lo que la migración PROMETE —que el punto ciego se cerró y que
   el séptimo sujeto no puede entrar callado—, no que corrió. */
DO $cinturon$
DECLARE
  v_r jsonb; v_viejo int; v_nuevo int; v_citas int; v_sinres int; v_grito text;
BEGIN
  -- ── (a) CONTROL POSITIVO: el guard aprueba el estado REAL de hoy ─────────
  /* Sin esto, un guard que reviente siempre también pasaría el rojo de (b).
     *Una compuerta que siempre dice que no también rebota.* */
  v_r := verificar_cobertura_sujetos_de_pago();
  IF (v_r->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'CINTURON: el guard no aprueba el estado vigente · %', v_r;
  END IF;
  IF (v_r->>'sujetos')::int <> 6 THEN
    RAISE EXCEPTION 'CINTURON: el XOR declara % sujetos, esperaba 6', v_r->>'sujetos';
  END IF;

  -- ── (b) ROJO: un sujeto en el XOR que el catálogo no nombra ──────────────
  /* Es el «no compila» ejercido: se simula el olvido del séptimo sujeto
     sacando uno del catálogo, y el guard tiene que reventar. */
  BEGIN
    DELETE FROM cat_sujetos_de_pago WHERE codigo = 'mensualidad_guarderia';
    PERFORM verificar_cobertura_sujetos_de_pago();
    RAISE EXCEPTION 'CINTURON: el guard APROBÓ con un sujeto sin nombrar';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    GET STACKED DIAGNOSTICS v_grito = MESSAGE_TEXT;
    IF v_grito NOT LIKE '%el XOR declara sujetos que el catálogo no nombra%' THEN
      RAISE EXCEPTION 'CINTURON: gritó, pero por otra cosa · %', v_grito;
    END IF;
  END;
  /* La subtransacción del BEGIN deshizo el DELETE. Se verifica, no se supone. */
  IF NOT EXISTS (SELECT 1 FROM cat_sujetos_de_pago WHERE codigo='mensualidad_guarderia') THEN
    RAISE EXCEPTION 'CINTURON: el DELETE de prueba NO se deshizo';
  END IF;

  -- ── (c) EL PUNTO CIEGO, CERRADO — con los dos números ────────────────────
  SELECT count(*) INTO v_viejo FROM pagos_pendientes_de_conciliar(10, NULL);
  SELECT count(*) INTO v_nuevo FROM pagos_huerfanos_por_sujeto(10, NULL);
  SELECT count(*) INTO v_citas FROM pagos_huerfanos_por_sujeto(10, NULL) WHERE sujeto_tipo='cita';
  IF v_nuevo <= v_viejo THEN
    RAISE EXCEPTION 'CINTURON: el lector nuevo (%) no ve MÁS que el viejo (%) — '
      'si el punto ciego existía, esto tenía que subir', v_nuevo, v_viejo;
  END IF;
  IF v_citas = 0 THEN
    RAISE EXCEPTION 'CINTURON: cero huérfanos de CITA — es justo el sujeto que '
      'el lector viejo no veía; sin al menos uno esta migración no discriminó nada';
  END IF;

  -- ── (d) NINGÚN HUÉRFANO QUEDA `sin_resolver` HOY ─────────────────────────
  SELECT count(*) INTO v_sinres FROM pagos_huerfanos_por_sujeto(10, NULL)
   WHERE sujeto_tipo = 'sin_resolver';
  IF v_sinres <> 0 THEN
    RAISE EXCEPTION 'CINTURON: % intentos con sujeto sin resolver', v_sinres;
  END IF;

  -- ── (e) los permisos, medidos ────────────────────────────────────────────
  IF has_function_privilege('anon','public.pagos_huerfanos_por_sujeto(integer,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.pagos_huerfanos_por_sujeto(integer,text)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON: el lector del barrido es ejecutable desde el bundle';
  END IF;

  RAISE NOTICE 'CINTURON S108B2 OK · guard positivo 1/1 · rojo del séptimo sujeto 1/1 · '
    'lector viejo=% nuevo=% (citas rescatadas=%) · sin_resolver=0 · permisos 1/1',
    v_viejo, v_nuevo, v_citas;
END $cinturon$;
