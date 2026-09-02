/* ═══════════════════════════════════════════════════════════════════════════
   S112-A2c · EL SEMAFORO SANITARIO NECESITA UN EJE COMUN
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Una vista se recrea; cero datos se tocan.

   Lo midio C montando la ficha: los tres datos de salud llegan **con tres
   formas distintas de decir «no se sabe»**.

     `esterilizado`   boolean | null
     `estado_vacunal` 'al_dia' | 'incompleto' | 'sin_datos' | null
     `desparasitado`  'si' | 'no' | 'no_se_sabe' | null

   Con eso, la pantalla tiene que traducir tres vocabularios para dibujar tres
   filas del mismo bloque — y **cada traduccion es un lugar donde alguien puede
   leer `null` como «no»**. Para Luna, `estado_vacunal = null` significa *«el
   refugio no lo declaro»*, jamas *«no esta vacunada»*: pintarlo como carencia
   seria **afirmar algo que nadie dijo**, que es lo que §2 prohibe.

   `salud` es DERIVADA y las tres columnas fuente se quedan. *Un eje comun que
   reemplaza a sus fuentes obliga a la pantalla del refugio a editar contra una
   forma y a leer contra otra.*

   ⚠️ Y el mapeo se declara, porque tiene una decision adentro:
   `incompleto` → `'no'`. **No es «no vacunado»: es «no esta al dia»**, y el
   semaforo pregunta eso. Lo que no se puede perder es el matiz, y por eso
   `estado_vacunal` sigue viajando entero al lado.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* La vista se baja primero: depende de la columna que se va a convertir, y
   Postgres no deja cambiarle el tipo mientras exista. Se recrea abajo, entera. */
DROP VIEW IF EXISTS public.v_adoptables_publicos;

/* ── 🔴 Y LA FUENTE, QUE ERA EL VERDADERO DEFECTO ──────────────────────────
   B lo midio por su cuenta y llego mas lejos que el eje derivado: **el eje
   comun cura al LECTOR y deja al ESCRITOR binario.** Con `boolean | null`, el
   `null` carga hoy dos significados que no son el mismo:

     · el refugio **no lo declaro**  ⇒ hoy `null`
     · el refugio dice que **no lo esta** ⇒ tambien acaba en `null` o en `false`,
       y desde afuera no se distinguen

   **Es la TERCERA vez que este vertical cobra la misma clase**: convivencia
   (S111), el codigo de firma vencido (B4) y ahora la salud. *Las tres veces
   era un binario donde el mundo tiene tres estados.* Curarlo en la vista
   habria sido curar el sintoma tres veces y dejar la causa.

   Se convierte a texto con el mismo vocabulario que convivencia. La columna
   nacio hoy (`20260907880000`) y **no tiene un solo dato declarado**: medido
   antes de convertir, cero filas con valor. 76(g) sigue sin regir. */
DO $conv$
DECLARE v_con_dato int;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='mascotas'
                AND column_name='esterilizado' AND data_type='boolean') THEN
    SELECT count(*) INTO v_con_dato FROM public.mascotas WHERE esterilizado IS NOT NULL;
    IF v_con_dato > 0 THEN
      /* Si alguien ya declaro, la conversion NO es libre: `false` podria
         significar «no declarado» en el momento en que se escribio. Se para y
         se dice, en vez de mapear a ciegas. */
      RAISE EXCEPTION 'CONVERSION: hay % fila(s) con esterilizado declarado — el mapeo booleano→tres estados exige decision, no se hace a ciegas', v_con_dato;
    END IF;
    ALTER TABLE public.mascotas ALTER COLUMN esterilizado DROP DEFAULT;
    ALTER TABLE public.mascotas ALTER COLUMN esterilizado TYPE text
      USING CASE WHEN esterilizado IS TRUE THEN 'si'
                 WHEN esterilizado IS FALSE THEN 'no' END;
    ALTER TABLE public.mascotas ALTER COLUMN esterilizado SET DEFAULT 'no_se_sabe';
    UPDATE public.mascotas SET esterilizado = 'no_se_sabe' WHERE esterilizado IS NULL;
    ALTER TABLE public.mascotas ALTER COLUMN esterilizado SET NOT NULL;
    ALTER TABLE public.mascotas ADD CONSTRAINT chk_esterilizado_tres_estados
      CHECK (esterilizado IN ('si','no','no_se_sabe'));
  END IF;
END $conv$;

COMMENT ON COLUMN public.mascotas.esterilizado IS
  'S112-A1/A2c. TRES estados: si | no | no_se_sabe. Nacio boolean y se convirtio '
  'el mismo dia, porque `null` cargaba dos significados distintos — «no lo '
  'declaro» y «no lo esta» — y desde afuera no se distinguian. Tercera vez que '
  'este vertical cobra la misma clase (convivencia S111, codigo de firma B4).';

/* La regla de los seis meses lee el vocabulario nuevo. Sigue siendo
   fail-closed: para un adulto, `no` y `no_se_sabe` rebotan igual — y no porque
   sean lo mismo, sino porque publicar un adulto exige DECLARARLO. */
CREATE OR REPLACE FUNCTION public.evaluar_esterilizacion_adoptable(p_publicacion_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_fn date; v_est text; v_meses int;
BEGIN
  SELECT m.fecha_nacimiento, m.esterilizado INTO v_fn, v_est
    FROM adopcion_publicacion p JOIN mascotas m ON m.id = p.mascota_id
   WHERE p.id = p_publicacion_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;

  IF v_fn IS NULL THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'edad_no_declarada',
      'requiere_compromiso', false,
      'detalle', 'Sin fecha de nacimiento no se puede saber si le corresponde estar esterilizado. Una fecha estimada alcanza.');
  END IF;

  v_meses := (EXTRACT(YEAR FROM age(CURRENT_DATE, v_fn)) * 12
            + EXTRACT(MONTH FROM age(CURRENT_DATE, v_fn)))::int;

  IF v_meses < 6 THEN
    RETURN jsonb_build_object('puede', true, 'motivo', NULL,
      'requiere_compromiso', true, 'edad_meses', v_meses);
  END IF;
  IF v_est = 'si' THEN
    RETURN jsonb_build_object('puede', true, 'motivo', NULL,
      'requiere_compromiso', false, 'edad_meses', v_meses);
  END IF;

  RETURN jsonb_build_object('puede', false, 'motivo', 'adoptable_no_esterilizado',
    'requiere_compromiso', false, 'edad_meses', v_meses,
    'esterilizado_declarado', v_est <> 'no_se_sabe',
    'detalle', CASE WHEN v_est = 'no_se_sabe'
                 THEN 'Falta declarar si está esterilizado.'
                 ELSE 'Pasados los seis meses, se publica esterilizado.' END);
END $fn$;
REVOKE ALL ON FUNCTION public.evaluar_esterilizacion_adoptable(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluar_esterilizacion_adoptable(uuid) TO authenticated;

CREATE VIEW public.v_adoptables_publicos AS
SELECT
  p.id AS publicacion_id, p.mascota_id, p.creada_en, p.ingresado_en,
  (CURRENT_DATE - p.ingresado_en)::int AS espera_dias,
  p.zona, p.ciudad_id, p.urgente, p.senas, p.historia, p.origen_rescate,
  p.fecha_cesion, p.estado_vacunal, p.desparasitado, p.bono_monto, p.bono_destino,
  p.pareja_id, p.country_code, p.convive_perros, p.convive_gatos, p.convive_ninos,
  m.nombre, m.especie, m.raza, m.sexo, m.fecha_nacimiento, m.fecha_nacimiento_precision,
  m.foto_url, m.talla, m.esterilizado,
  m.microchip IS NOT NULL AS tiene_microchip,
  m.remetfu   IS NOT NULL AS tiene_remetfu,
  /* ── EL EJE COMUN: los tres en el mismo vocabulario de tres estados. ───── */
  jsonb_build_object(
    'vacunas', CASE p.estado_vacunal
                 WHEN 'al_dia'     THEN 'si'
                 WHEN 'incompleto' THEN 'no'
                 ELSE 'no_se_sabe' END,
    'esterilizado', m.esterilizado,
    'desparasitado', COALESCE(p.desparasitado, 'no_se_sabe')
  ) AS salud,
  cc.id AS publicador_id, cc.nombre_comercial AS publicador_nombre,
  pr.foto_url AS publicador_foto, ciu.nombre AS ciudad_nombre
FROM public.adopcion_publicacion p
JOIN public.mascotas m              ON m.id  = p.mascota_id
JOIN public.cuentas_comerciales cc  ON cc.id = p.cuenta_comercial_id
LEFT JOIN public.prestadores pr     ON pr.cuenta_comercial_id = cc.id
LEFT JOIN public.cat_ciudades ciu   ON ciu.id = p.ciudad_id
WHERE p.estado = 'publicada' AND m.estado_vida <> 'fallecida';

COMMENT ON VIEW public.v_adoptables_publicos IS
  'S112-A2/A2c. LA VENTANA PUBLICA de la vidriera. Vista DEFINER a proposito: '
  'la RLS de cuentas_comerciales es solo-dueño y con invoker un anonimo veria '
  'cero filas. La UNICA proteccion es (a) esta lista blanca de columnas y (b) '
  'el WHERE. Agregar una columna aca es una decision de privacidad.';

/* 🔴 EL `DROP` SE LLEVO LOS GRANTS, asi que se vuelven a poner A MANO — y este
   es exactamente el silencio que el cinturon de abajo vigila: recrear la vista
   y olvidar el REVOKE le devolveria a `anon` el catalogo entero, sin error y
   sin sintoma. Por eso el brazo mide el privilegio, no la intencion. */
GRANT SELECT ON public.v_adoptables_publicos TO authenticated;
REVOKE SELECT ON public.v_adoptables_publicos FROM anon;

/* El filtro de la lista lee el vocabulario nuevo. Pedir «esterilizado» ahora
   trae SOLO los declarados `si`: `no_se_sabe` **no cuenta como si**, que es la
   diferencia entera entre este vocabulario y el binario que reemplaza. */
DO $flt$
DECLARE v_def text; v_nueva text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_adoptables';
  v_nueva := replace(v_def, 'v.esterilizado IS TRUE', 'v.esterilizado = ''si''');
  IF v_nueva = v_def THEN
    RAISE EXCEPTION 'FILTRO: no encontre el predicado de esterilizado — mirar el cuerpo antes de tocar';
  END IF;
  EXECUTE v_nueva;
END $flt$;

DO $cint$
DECLARE v_cols text[]; v_prohibidas text[];
BEGIN
  SELECT array_agg(column_name::text) INTO v_cols FROM information_schema.columns
   WHERE table_schema='public' AND table_name='v_adoptables_publicos';
  v_prohibidas := ARRAY['identificacion_fiscal','razon_social','datos_bancarios',
    'telefono','email','direccion','owner_profile_id','kushki_subaccount_id',
    'saldo_arrastre','user_id','familia_id'];
  IF v_cols && v_prohibidas THEN
    RAISE EXCEPTION 'CINTURON ROJO: la ventana publica expone %',
      array_to_string(ARRAY(SELECT unnest(v_cols) INTERSECT SELECT unnest(v_prohibidas)),', ');
  END IF;
  IF NOT ('salud' = ANY(v_cols)) THEN
    RAISE EXCEPTION 'CINTURON ROJO: el eje de salud no quedo en la ventana';
  END IF;
  IF has_table_privilege('anon','public.v_adoptables_publicos','SELECT') THEN
    RAISE EXCEPTION 'CINTURON ROJO: recrear la vista le devolvio el catalogo a anon';
  END IF;
  IF NOT has_function_privilege('anon','public.obtener_adoptables(jsonb,text,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'CINTURON ROJO: la vidriera quedo cerrada para anon';
  END IF;
  PERFORM public.obtener_adoptables('{}'::jsonb, NULL, 3);
  /* 🔴 EL ROJO DEL VOCABULARIO NUEVO: el binario es inexpresable. */
  BEGIN
    UPDATE public.mascotas SET esterilizado = 'true'
     WHERE id = (SELECT id FROM public.mascotas LIMIT 1);
    RAISE EXCEPTION 'CINTURON ROJO: esterilizado acepta un valor fuera de los tres estados';
  EXCEPTION WHEN check_violation THEN NULL; END;
  IF (SELECT count(*) FROM public.mascotas WHERE esterilizado IS NULL) <> 0 THEN
    RAISE EXCEPTION 'CINTURON ROJO: quedaron mascotas con esterilizado NULL';
  END IF;
  RAISE NOTICE 'CINTURON A2c: 6 brazos verdes · % columnas en la ventana', array_length(v_cols,1);
END $cint$;

COMMIT;
