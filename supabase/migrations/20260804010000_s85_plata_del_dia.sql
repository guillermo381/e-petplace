-- S85-A · $ DEL DÍA — el segundo de los tres números de la portada
--
-- LETRA: `PORTAL_PRESTADOR` §2.4bis — **PLATA = el valor AGENDADO del día**, no
-- lo devengado ni lo cobrado. La pregunta es *"¿cuánto vale mi jornada?"*.
--
-- ⚠️ POR QUÉ ES UNA RPC Y NO UN `select` DEL WRAPPER — es letra, no comodidad:
-- `S72-P1a` (firmada) dice **"EL PULSO DEL NEGOCIO va en NEGOCIO, jamás en
-- HOY"**, con su razón fuerte: **la app es MULTI-ACTOR y el mostrador vive en
-- HOY** ⇒ *plata sin gate = la recepción ve los ingresos*. Y `§2.4bis` (firmada
-- el mismo día) pone PLATA en la portada. **Las dos se conservan con la forma
-- que `A3.5bis` firmó para el expediente: no se esconde que existe — se modula
-- qué se ve.**
--
-- **El gate va en el SERVIDOR porque un gate del cliente es decorativo** (regla
-- propia de A3.5bis). Un wrapper es cliente.
--
-- ⚠️ Y LO QUE ESTA FUNCIÓN **NO** CIERRA, declarado para que nadie la archive
-- creyendo de más (**D-641**): `evento_cita_servicio.precio` **sigue siendo
-- legible por la RLS** para quien ve la cita (`cita_select_prestador`, medido:
-- `has_column_privilege(authenticated, …, precio, SELECT) = true`, cero ACL por
-- columna). **Esta RPC es la puerta del TOTAL, no la del DATO.**
-- *Lo que S72-P1a protege no es el dato crudo: es no ponerle el total del
-- negocio en la cara. Sumar 200 filas a mano no es leer un número grande al
-- abrir la app.*
--
-- QUIÉN LO VE, hoy: **el TITULAR** (`prestadores.user_id`) y el admin.
-- El **administrador** NO entra **porque su motor no existe** (D-513/D-517) —
-- misma declaración que `obtener_jornada_recepcion` hizo en S78. Cuando exista,
-- cae en la rama del titular con una línea.
--
-- LOS TRES BORDES, medidos sobre las 105 citas vivas y adjudicados por la mesa:
--   · `precio` NULL (3 sueltas) **NO vale 0** ⇒ se cuentan aparte y el total
--     dice *"no lo sé entero"*. **L-197 al pie: un fallo degrada a AUSENCIA,
--     nunca a un valor que el consumidor use como cierto** — un 0 se sumaría.
--   · `cancelada` AFUERA (la firma dice **citas vivas**).
--   · `pendiente` AFUERA — un hold no está agendado, se está reservando.
--
-- Y EL PRECIO NO SE DERIVA: `precio` ya es el unitario correcto en los tres
-- orígenes (medido: PLAN 27/27 con 6.00 = el unitario efectivo que la Decisión S
-- estampa AL CREAR la cita; PAQUETE a precio de origen; suelta congelada).
-- *El unitario del plan no es estable ENTRE períodos, pero DENTRO del día es
-- exacto y ya calculado.*
--
-- 76(g) — DECLARADA: NO RIGE. Crea una función de solo lectura.
-- REVERSA escrita ANTES: docs/relevamientos/2026-08-03-s85a-REVERSA-plata-del-dia.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_plata_del_dia(p_prestador_id uuid, p_fecha date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid       uuid := auth.uid();
  v_es_titular boolean;
  v_total     numeric;
  v_contadas  integer;
  v_sin_precio integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT EXISTS (SELECT 1 FROM prestadores p WHERE p.id = p_prestador_id AND p.user_id = v_uid)
    INTO v_es_titular;

  IF NOT (v_es_titular OR is_admin()) THEN
    /* NO es un error: es la modulación. La superficie recibe `visible:false` y
       DICE algo — un tercer número ausente sin voz se lee como pantalla rota.
       (A3.5bis: no se esconde que existe, se modula qué se ve.) */
    RETURN jsonb_build_object('visible', false);
  END IF;

  SELECT
    coalesce(sum(c.precio), 0),
    count(*),
    count(*) FILTER (WHERE c.precio IS NULL)
  INTO v_total, v_contadas, v_sin_precio
  FROM evento_cita_servicio c
  WHERE c.prestador_id = p_prestador_id
    AND c.fecha = p_fecha
    AND c.estado IN ('confirmada', 'en_curso', 'completada');

  RETURN jsonb_build_object(
    'visible', true,
    'total', v_total,
    'citas', v_contadas,
    'sinPrecio', v_sin_precio   -- >0 ⇒ el total es PARCIAL y la superficie lo dice
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_plata_del_dia(uuid, date) TO authenticated;

-- ── FIXTURE con el PAR (L-063 · L-192): titular VE, no-titular NO ──
DO $$
DECLARE
  v_acl text; v_pid uuid; v_titular uuid; v_otro uuid; v_r jsonb;
BEGIN
  SELECT proacl::text INTO v_acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='obtener_plata_del_dia';
  IF v_acl LIKE '%anon=X%' THEN RAISE EXCEPTION 'L-140: anon con EXECUTE — %', v_acl; END IF;

  SELECT p.id, p.user_id INTO v_pid, v_titular
  FROM prestadores p JOIN evento_cita_servicio c ON c.prestador_id = p.id LIMIT 1;
  IF v_pid IS NULL THEN RAISE EXCEPTION 'ANCLA ROTA: ningún prestador con citas.'; END IF;

  -- (a) EL TITULAR VE
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_titular::text,'role','authenticated')::text, true);
  v_r := public.obtener_plata_del_dia(v_pid, (SELECT max(fecha) FROM evento_cita_servicio WHERE prestador_id = v_pid));
  IF (v_r->>'visible')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'el TITULAR no ve su plata: %', v_r; END IF;
  IF v_r->'total' IS NULL THEN RAISE EXCEPTION 'visible sin total: %', v_r; END IF;

  -- (b) CONTRA-CASO: otro usuario NO ve. Sin esto, una función que devuelve
  --     siempre `visible:true` daría el mismo verde en (a).
  SELECT id INTO v_otro FROM auth.users WHERE id <> v_titular LIMIT 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_otro::text,'role','authenticated')::text, true);
  v_r := public.obtener_plata_del_dia(v_pid, current_date);
  IF (v_r->>'visible')::boolean IS NOT FALSE THEN
    RAISE EXCEPTION 'FUGA: un NO-titular recibió el total — %', v_r;
  END IF;
  IF v_r ? 'total' THEN RAISE EXCEPTION 'FUGA PARCIAL: el no-titular recibió la clave total — %', v_r; END IF;

  PERFORM set_config('request.jwt.claims', NULL, true);
  RAISE NOTICE 'S85 OK — titular ve · no-titular NO ve ni la clave · anon sin EXECUTE.';
END $$;

COMMIT;
