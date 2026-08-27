-- ============================================================================
-- S106-A tanda 3 · EL BORRADOR DE LA NOTA CLÍNICA
--
-- ── POR QUÉ, Y EL CRASH DE HOY LO VOLVIÓ URGENTE ───────────────────────────
-- Medido: **no existe nada de borrador.** Cero tablas, y `sedimentar_nota_
-- clinica` recibe la nota entera en un `jsonb` — **es todo o nada.**
--
-- ⇒ El vet que dicta veinte minutos y pierde la app **pierde todo.** Y hoy
-- (27-ago) se capturó por logcat un crash del modal que hacía exactamente eso.
-- *El riesgo dejó de ser teórico esta madrugada.*
--
-- C lo declaró en vez de disimularlo y puso **«Listo»** en lugar de
-- «Guardar»: *un «Guardar» que sólo baja el panel miente sobre dónde está la
-- nota.* Esta migración es lo que hace que «Guardar» pueda existir sin mentir.
--
-- ── 🔴 EL BORRADOR NO SE VALIDA, Y ES LA DECISIÓN DE DISEÑO ────────────────
-- `nota` es **`jsonb` opaco**. Ninguna columna tipada, ningún `CHECK` sobre su
-- contenido, ningún campo obligatorio.
--
-- > *Una nota a medio escribir es inválida POR DEFINICIÓN. Un borrador que
-- > exige estar completo para guardarse no es un borrador: es el formulario
-- > otra vez, y no salva a nadie del crash.*
--
-- La validación vive donde corresponde: en `sedimentar_nota_clinica`, que es
-- la que escribe el expediente. **El borrador guarda; el expediente juzga.**
--
-- ── UN BORRADOR POR CITA, POR CONSTRUCCIÓN ─────────────────────────────────
-- `cita_id` es la **PRIMARY KEY**: dos borradores de la misma consulta son
-- **inexpresables**, no «están prohibidos por prosa». *Con dos filas, la
-- pregunta «cuál es el bueno» no tiene respuesta correcta.*
--
-- ── EL BORRADO AL SEDIMENTAR VA EN UN TRIGGER, NO EN LA FUNCIÓN ────────────
-- 🔴 *Si el borrador sobrevive a la sedimentación, el vet vuelve a entrar y ve
-- texto viejo sobre una consulta ya cerrada* — y no tiene cómo saber cuál de
-- los dos es el bueno.
--
-- Se eligió **trigger** sobre editar `sedimentar_nota_clinica` por dos razones,
-- y las dos son de modo de falla:
--   · esa función es crítica y ya está probada; **tocarla para una limpieza es
--     riesgo sin necesidad**
--   · un trigger **no se puede olvidar**: el día que nazca un segundo camino
--     que escriba historia clínica, la limpieza viaja con él sola. *Una línea
--     dentro de UNA función sólo limpia mientras esa función sea la única
--     puerta* — que es la forma exacta en que `registrar_reverso_deuna` se
--     olvidó de mover el sujeto (`D-923`).
--
-- ── VEDA 76(g): NO RIGE. Tabla nueva VACÍA + funciones + trigger. Cero
--    backfill, cero anclas, cero datos tocados.
-- ── REVERSA: docs/relevamientos/2026-08-27-s106a-REVERSA-borrador-nota.sql
--    ⚠️ y NO es neutra: su `DROP TABLE` **destruye trabajo humano no
--    sedimentado**. Se mide antes de correrla.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nota_clinica_borrador (
  cita_id        uuid PRIMARY KEY REFERENCES public.evento_cita_servicio(id) ON DELETE CASCADE,
  mascota_id     uuid NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
  empleado_id    uuid REFERENCES public.prestador_empleados(id) ON DELETE SET NULL,
  nota           jsonb NOT NULL,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nota_clinica_borrador ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.nota_clinica_borrador IS
  'S106 · La nota clinica a medio escribir. UNO por cita (cita_id es la PK). '
  'Su contenido NO se valida: un borrador incompleto es valido por definicion. '
  'Se borra solo al sedimentar, por trigger.';

/* 🔴 EL REVOKE ES OBLIGATORIO — L-140 VALE TAMBIÉN PARA TABLAS.
   **Lo atrapó el cinturón de esta misma migración, en su primer intento:** una
   tabla nueva en `public` **nace con `SELECT/INSERT/UPDATE/DELETE` para
   `authenticated`** por los default privileges de Supabase. RLS encendida y
   sin policies la habría dejado *sin filas visibles*, sí — pero el privilegio
   concedido es una puerta abierta esperando a que alguien escriba una policy
   «para arreglar» algo, y ahí entra todo.
   *Igual que con las funciones: el default concede, y no decidirlo es
   decidir que sí.* */
REVOKE ALL ON TABLE public.nota_clinica_borrador FROM PUBLIC, anon, authenticated;

/* 🔴 CERO POLICIES A PROPÓSITO: RLS encendida y sin `GRANT` a `authenticated`
   ⇒ la tabla es **inalcanzable por PostgREST**. Se entra sólo por las dos
   puertas de abajo, que llevan el gate clínico adentro.
   *Una tabla de borradores legible por tabla dejaría a cualquiera con acceso
   a la mascota leer lo que un profesional está pensando y todavía no firmó.* */

-- ── LA PUERTA DE ESCRITURA ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guardar_borrador_nota(p_cita_id uuid, p_nota jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c evento_cita_servicio;
  v_emp uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion'); END IF;

  SELECT * INTO v_c FROM evento_cita_servicio WHERE id = p_cita_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe'); END IF;

  /* 🔴 GATE CLÍNICO, y además tiene que ser QUIEN ATIENDE. La familia tiene
     acceso clínico a su propia mascota y **no debe poder escribir la nota del
     veterinario**: acá el acceso no alcanza, hace falta ser del negocio. */
  IF NOT COALESCE(public.es_mi_prestador(v_c.prestador_id), false)
     AND NOT COALESCE(public.is_admin(), false) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'no_es_el_prestador_de_la_cita');
  END IF;

  SELECT pe.id INTO v_emp FROM prestador_empleados pe
  WHERE pe.prestador_id = v_c.prestador_id AND pe.user_id = auth.uid() AND pe.activo
  LIMIT 1;

  INSERT INTO public.nota_clinica_borrador (cita_id, mascota_id, empleado_id, nota, actualizado_en)
  VALUES (p_cita_id, v_c.mascota_id, v_emp, p_nota, now())
  ON CONFLICT (cita_id) DO UPDATE
    SET nota = EXCLUDED.nota, empleado_id = EXCLUDED.empleado_id, actualizado_en = now();

  RETURN jsonb_build_object('ok', true, 'guardado_en', now());
END;
$function$;

-- ── LA PUERTA DE LECTURA ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.leer_borrador_nota(p_cita_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_c evento_cita_servicio;
  v_b nota_clinica_borrador;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'codigo', 'sin_sesion'); END IF;

  SELECT * INTO v_c FROM evento_cita_servicio WHERE id = p_cita_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'codigo', 'cita_no_existe'); END IF;

  IF NOT COALESCE(public.es_mi_prestador(v_c.prestador_id), false)
     AND NOT COALESCE(public.is_admin(), false) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'no_es_el_prestador_de_la_cita');
  END IF;

  SELECT * INTO v_b FROM nota_clinica_borrador WHERE cita_id = p_cita_id;

  /* 🔴 «No hay borrador» NO es un error: es la respuesta normal la primera vez
     que se abre una consulta. *Devolver un fallo obligaría a la pantalla a
     tratar lo normal como excepción, y ahí es donde nace el mensaje de error
     que no significa nada.* */
  RETURN jsonb_build_object(
    'ok', true,
    'existe', v_b.cita_id IS NOT NULL,
    'nota', v_b.nota,
    'actualizado_en', v_b.actualizado_en
  );
END;
$function$;

-- ── LA LIMPIEZA, POR TRIGGER ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_hc_limpia_borrador()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.cita_id IS NOT NULL THEN
    DELETE FROM public.nota_clinica_borrador WHERE cita_id = NEW.cita_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_hc_limpia_borrador ON public.evento_historia_clinica_registrada;
CREATE TRIGGER trg_hc_limpia_borrador
AFTER INSERT ON public.evento_historia_clinica_registrada
FOR EACH ROW EXECUTE FUNCTION public._trg_hc_limpia_borrador();

REVOKE EXECUTE ON FUNCTION public.guardar_borrador_nota(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leer_borrador_nota(uuid)           FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.guardar_borrador_nota(uuid, jsonb) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.leer_borrador_nota(uuid)           TO authenticated;

-- ── CINTURÓN: ejerce el ciclo completo y los dos rechazos ──────────────────
DO $cinturon$
DECLARE
  v_rol text := current_user;   -- ⚠️ jamás RESET ROLE
  v_cita uuid; v_vet uuid; v_familia uuid; v_out jsonb;
BEGIN
  IF has_function_privilege('anon','public.guardar_borrador_nota(uuid,jsonb)','EXECUTE')
     OR has_table_privilege('authenticated','public.nota_clinica_borrador','SELECT') THEN
    RAISE EXCEPTION 'cinturon: el borrador quedo alcanzable por fuera de sus puertas';
  END IF;

  SELECT c.id, pr.user_id INTO v_cita, v_vet
  FROM evento_cita_servicio c JOIN prestadores pr ON pr.id = c.prestador_id
  WHERE c.tipo_servicio = 'telemedicina' ORDER BY c.created_at DESC LIMIT 1;
  IF v_cita IS NULL THEN RAISE EXCEPTION 'cinturon: no hay cita con la que ejercer'; END IF;

  -- ① EL VET GUARDA Y RELEE
  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_vet, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_out := public.guardar_borrador_nota(v_cita, '{"motivo":"a medio escribir"}'::jsonb);
  IF (v_out->>'ok') IS DISTINCT FROM 'true' THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'cinturon: el vet no pudo guardar — %', v_out::text;
  END IF;
  v_out := public.leer_borrador_nota(v_cita);
  IF (v_out->>'existe') IS DISTINCT FROM 'true'
     OR (v_out->'nota'->>'motivo') IS DISTINCT FROM 'a medio escribir' THEN
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    RAISE EXCEPTION 'cinturon: lo guardado no volvió igual — %', v_out::text;
  END IF;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  -- ② 🔴 LA FAMILIA NO ESCRIBE LA NOTA DE SU VETERINARIO, aunque tenga acceso
  --    clínico a su propia mascota. *Acá el acceso no alcanza.*
  SELECT fm.user_id INTO v_familia
  FROM evento_cita_servicio c JOIN mascotas m ON m.id = c.mascota_id
  JOIN familia_miembro fm ON fm.familia_id = m.familia_id AND fm.hasta IS NULL
  WHERE c.id = v_cita LIMIT 1;
  IF v_familia IS NOT NULL THEN
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_familia, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;
    v_out := public.guardar_borrador_nota(v_cita, '{"motivo":"no deberia entrar"}'::jsonb);
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    IF (v_out->>'codigo') IS DISTINCT FROM 'no_es_el_prestador_de_la_cita' THEN
      RAISE EXCEPTION 'cinturon: la familia pudo escribir la nota del vet — %', v_out::text;
    END IF;
  END IF;

  -- ③ EL TRIGGER LIMPIA. Se ejerce de verdad y se DESHACE: la fila de historia
  --    clínica de prueba no puede quedar en el expediente de una mascota real.
  BEGIN
    /* `veterinario_user_id` NO es opcional acá: el trigger de procedencia del
       expediente (`_crear_evento_padre_auto`) exige saber QUIÉN lo escribió y
       rebota si no lo tiene. *Es el modelo defendiéndose, y el cinturón lo
       descubrió chocando — no leyendo.* */
    INSERT INTO evento_historia_clinica_registrada
      (cita_id, mascota_id, prestador_id, veterinario_user_id,
       motivo_consulta, diagnostico_principal, completado_en)
    SELECT v_cita, c.mascota_id, c.prestador_id, v_vet,
           'cinturon', 'cinturon', now()
    FROM evento_cita_servicio c WHERE c.id = v_cita;
    IF EXISTS (SELECT 1 FROM nota_clinica_borrador WHERE cita_id = v_cita) THEN
      RAISE EXCEPTION 'cinturon: el trigger NO limpio el borrador al sedimentar';
    END IF;
    RAISE EXCEPTION 'cinturon_ok_deshacer';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM <> 'cinturon_ok_deshacer' THEN RAISE; END IF;
  END;

  -- Residuo: el borrador de prueba se retira a mano (el bloque de arriba se
  -- deshizo entero, así que sigue vivo).
  DELETE FROM nota_clinica_borrador WHERE cita_id = v_cita;

  RAISE NOTICE 'cinturon borrador: OK · ciclo guardar/leer · la familia rebota · el trigger limpia';
END;
$cinturon$;
