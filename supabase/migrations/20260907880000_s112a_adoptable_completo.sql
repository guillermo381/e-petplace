/* ═══════════════════════════════════════════════════════════════════════════
   S112-A1 · EL ADOPTABLE COMPLETO
   ───────────────────────────────────────────────────────────────────────────
   La publicacion tenia NUEVE columnas. La ficha que el founder describio en
   §4.1 del loop pide veinte datos que no existen en ningun lado — y C no puede
   montar contra promesas.

   ── 76(g) · VEDA DE ESCRITURA: **NO RIGE.** Medido antes de escribir:
      `adopcion_publicacion` tiene **0 filas**. Cero backfill, cero ancla.
      Lo de `mascotas` son dos columnas NULLABLE: nada que rellenar.

   ── LA REGLA QUE DECIDE DONDE VA CADA DATO, y se declara porque el proximo
      que agregue un campo la va a necesitar:

        **Lo que es del CUERPO va en `mascotas` y SOBREVIVE la adopcion.
         Lo que es de la OFERTA va en la publicacion y MUERE con ella.**

      Por eso `esterilizado` y `remetfu` van a `mascotas` —el dia que Luna sea
      de una familia, la familia tiene que seguir sabiendo que esta esterilizada
      y cual es su registro municipal— y `urgente`, `bono` o `historia` van a la
      publicacion: describen una OFERTA, no un animal.

      Y por eso NO se duplica lo que ya existe: `microchip`, `talla`, `sexo`,
      `especie` y `fecha_nacimiento` ya viven en `mascotas`. *Un segundo lugar
      para el mismo hecho es una divergencia esperando su dia.*

   ── EL MEMORIAL NO ES UN ESTADO DE LA PUBLICACION, y se declara porque el
      pedido lo listaba junto a los otros cinco:
      el memorial vive en **`mascotas.estado_vida='fallecida'`**, y los lectores
      lo DERIVAN por join. Si fuera un sexto valor de `estado` habria **dos
      fuentes de verdad para «murio»** y podrian divergir: una mascota fallecida
      con su publicacion en `publicada`. Derivandolo, ese estado es
      inexpresable (`L-439`: un atajo que puede producir un valor equivocado no
      se declara — se hace inexpresable).

   ── `destacado_espera`: **no nace columna.** El founder firmo la opcion ① —
      `ingresado_en` nace en el adoptable — y el destacado se DERIVA de el.
      *Una columna «destacado» seria un segundo lugar donde decir lo mismo, y
      podria decir que si mientras la fecha dice que no.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── 1 · EL CUERPO ─────────────────────────────────────────────────────────
   Dos hechos del animal que la casa no sabia decir. Nullable: `NULL` es
   «no declarado» y **se dice**, jamas se lee como «no». */
ALTER TABLE public.mascotas
  ADD COLUMN IF NOT EXISTS esterilizado boolean,
  ADD COLUMN IF NOT EXISTS remetfu      text;

COMMENT ON COLUMN public.mascotas.esterilizado IS
  'S112-A1. NULL = no declarado, y se DICE. La regla de los seis meses (A3) lo '
  'lee fail-closed: para un adulto, NULL y false rebotan igual — no porque sean '
  'lo mismo, sino porque publicar un adulto exige DECLARARLO.';
COMMENT ON COLUMN public.mascotas.remetfu IS
  'S112-A1. Registro municipal de tenencia de fauna urbana. Vive al lado de '
  '`microchip` porque es el mismo tipo de hecho: un identificador del animal '
  'que sobrevive el cambio de familia. El acta lo lee con su «si vacio».';

/* ── 2 · LA OFERTA ─────────────────────────────────────────────────────────
   `ingresado_en` es NOT NULL SIN DEFAULT a proposito: es la unica forma de que
   la puerta este OBLIGADA a preguntarla. Un default (`now()`) haria que todo
   rescate viejo entrara como si hubiera llegado hoy — y ese dato es el que
   ordena los destacados: **el default mentiria justo donde mas importa.** */
ALTER TABLE public.adopcion_publicacion
  ADD COLUMN IF NOT EXISTS ingresado_en   date,
  ADD COLUMN IF NOT EXISTS ciudad_id      uuid REFERENCES public.cat_ciudades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zona           text,
  ADD COLUMN IF NOT EXISTS senas          text,
  ADD COLUMN IF NOT EXISTS origen_rescate text,
  ADD COLUMN IF NOT EXISTS fecha_cesion   date,
  ADD COLUMN IF NOT EXISTS estado_vacunal text,
  ADD COLUMN IF NOT EXISTS desparasitado  text,
  ADD COLUMN IF NOT EXISTS urgente        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pareja_id      uuid REFERENCES public.adopcion_publicacion(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bono_monto     numeric(10,2),
  ADD COLUMN IF NOT EXISTS bono_destino   text,
  ADD COLUMN IF NOT EXISTS historia       text,
  ADD COLUMN IF NOT EXISTS convive_perros text NOT NULL DEFAULT 'no_se_sabe',
  ADD COLUMN IF NOT EXISTS convive_gatos  text NOT NULL DEFAULT 'no_se_sabe',
  ADD COLUMN IF NOT EXISTS convive_ninos  text NOT NULL DEFAULT 'no_se_sabe',
  ADD COLUMN IF NOT EXISTS actualizada_en timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.adopcion_publicacion ALTER COLUMN ingresado_en SET NOT NULL;

/* ── 3 · CONVIVENCIA: TRES ESTADOS, JAMAS UN BOOLEAN ───────────────────────
   El pedido es explicito y la razon es de producto: con un boolean, «no se
   sabe» se guarda como `false` o como `NULL`, y las dos lecturas mienten —
   `false` dice «no convive» sobre un animal que nadie probo, y `NULL` deja a la
   pantalla eligiendo que significa. **Con `text` + CHECK, «no se sabe» es un
   valor de primera clase y la pantalla lo dibuja con el mismo peso.** */
DO $$ BEGIN
  ALTER TABLE public.adopcion_publicacion
    ADD CONSTRAINT chk_convivencia_tres_estados CHECK (
      convive_perros IN ('si','no','no_se_sabe') AND
      convive_gatos  IN ('si','no','no_se_sabe') AND
      convive_ninos  IN ('si','no','no_se_sabe'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

/* ── 4 · EL VOCABULARIO DE ESTADOS ─────────────────────────────────────────
   `retirada` se jubila y pasa a `no_disponible`: la palabra vieja describia el
   ACTO (alguien la retiro) y no el ESTADO (no esta disponible) — y con
   `adoptada` y `pausada` conviviendo, «retirada» ya no distinguia nada. */
ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS adopcion_publicacion_estado_check;
ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_retiro_coherente;

UPDATE public.adopcion_publicacion SET estado='no_disponible' WHERE estado='retirada';

ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_estado_adoptable CHECK (
    estado IN ('borrador','publicada','pausada','adoptada','no_disponible'));

/* El retiro es coherente SOLO con `no_disponible`. Una `adoptada` no esta
   «retirada»: encontro casa, que es lo contrario. */
ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_no_disponible_coherente CHECK (
    (estado = 'no_disponible' AND retirada_en IS NOT NULL)
    OR (estado <> 'no_disponible' AND retirada_en IS NULL));

ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_origen_rescate_coherente CHECK (
    (origen_rescate IS NULL AND fecha_cesion IS NULL)
    OR (origen_rescate = 'rescate' AND fecha_cesion IS NULL)
    OR (origen_rescate = 'cesion'));

ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_estado_vacunal CHECK (
    estado_vacunal IS NULL OR estado_vacunal IN ('al_dia','incompleto','sin_datos'));
ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_desparasitado CHECK (
    desparasitado IS NULL OR desparasitado IN ('si','no','no_se_sabe'));
ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_bono_positivo CHECK (bono_monto IS NULL OR bono_monto > 0);
ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_pareja_no_es_si_misma CHECK (pareja_id IS NULL OR pareja_id <> id);
/* Una fecha de ingreso en el futuro daria un «lleva -3 meses esperando». */
ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_ingresado_no_futuro CHECK (ingresado_en <= (now() AT TIME ZONE 'America/Guayaquil')::date);

/* ── 5 · UNA PUBLICACION VIVA POR MASCOTA — y «viva» son TRES estados ──────
   El indice viejo miraba solo `publicada`, asi que un refugio podia tener DOS
   borradores del mismo animal y publicar el equivocado. */
DROP INDEX IF EXISTS public.uq_publicacion_viva_por_mascota;
CREATE UNIQUE INDEX uq_publicacion_viva_por_mascota
  ON public.adopcion_publicacion (mascota_id)
  WHERE (estado IN ('borrador','publicada','pausada'));

/* ── 6 · LOS INDICES DE §6 ─────────────────────────────────────────────────
   La vidriera pagina por keyset y ordena de dos formas: por espera (los tres
   destacados) y por publicacion reciente (el resto). */
CREATE INDEX IF NOT EXISTS ix_adoptable_espera
  ON public.adopcion_publicacion (ingresado_en ASC, id ASC) WHERE (estado = 'publicada');
CREATE INDEX IF NOT EXISTS ix_adoptable_recientes
  ON public.adopcion_publicacion (creada_en DESC, id DESC) WHERE (estado = 'publicada');
CREATE INDEX IF NOT EXISTS ix_adoptable_ciudad
  ON public.adopcion_publicacion (ciudad_id) WHERE (estado = 'publicada');
CREATE INDEX IF NOT EXISTS ix_adoptable_cuenta
  ON public.adopcion_publicacion (cuenta_comercial_id, estado);

/* ── 7 · LA SINCRONIA QUE VUELVE LA DIVERGENCIA INEXPRESABLE ───────────────
   `mascotas.estado_adopcion` ya existia y `obtener_adoptables` lo lee por join
   con `cat_estados_adopcion.visible_en_vidriera`. Son **dos lugares para el
   mismo hecho**, y hasta hoy los sincronizaba a mano cada funcion — que es
   exactamente como divergen.

   No se borra el de `mascotas` (83 filas vivas y un lector), y no se deja a
   mano: **un trigger lo escribe.** El mapeo es 1:1 con `cat_estados_adopcion`,
   salvo `no_disponible` → `no_aplica`, que es su nombre en ese catalogo. */
CREATE OR REPLACE FUNCTION public._trg_publicacion_sincroniza_mascota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
BEGIN
  UPDATE public.mascotas
     SET estado_adopcion = CASE NEW.estado
                             WHEN 'no_disponible' THEN 'no_aplica'
                             ELSE NEW.estado END,
         updated_at = now()
   WHERE id = NEW.mascota_id;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_publicacion_sincroniza_mascota ON public.adopcion_publicacion;
CREATE TRIGGER trg_publicacion_sincroniza_mascota
  AFTER INSERT OR UPDATE OF estado ON public.adopcion_publicacion
  FOR EACH ROW EXECUTE FUNCTION public._trg_publicacion_sincroniza_mascota();

/* ── 8 · LA PUERTA DE ALTA, ENSANCHADA ─────────────────────────────────────
   Nace en **`borrador`**, no en `publicada`: §0 paso 4 dice que el refugio
   llena la ficha y DESPUES enciende «publicado». Publicar en el mismo acto de
   crear haria inalcanzable el unico momento donde la regla de los seis meses
   puede frenarlo con la ficha a la vista.

   🔴 Y exige **cuenta ACTIVA**, no solo rol (§5.7). El rol se otorga junto con
   la activacion, pero una cuenta puede suspenderse despues — y sin este gate
   una cuenta suspendida seguiria publicando animales. */
DROP FUNCTION IF EXISTS public.publicar_adoptable(uuid, uuid);
CREATE OR REPLACE FUNCTION public.publicar_adoptable(
  p_mascota_id uuid,
  p_cuenta_comercial_id uuid,
  p_ingresado_en date,
  p_ficha jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_user uuid := auth.uid(); v_pub uuid; v_cc text; v_fam uuid; v_estado_cuenta text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_cuenta_de_refugio' USING ERRCODE='42501';
  END IF;

  SELECT estado INTO v_estado_cuenta FROM cuentas_comerciales WHERE id = p_cuenta_comercial_id;
  IF v_estado_cuenta <> 'activa' THEN
    RAISE EXCEPTION 'cuenta_no_activa: %', v_estado_cuenta USING ERRCODE='42501';
  END IF;

  IF p_ingresado_en IS NULL THEN
    RAISE EXCEPTION 'ingresado_en_requerido' USING ERRCODE='22023';
  END IF;

  SELECT country_code, familia_id INTO v_cc, v_fam FROM mascotas WHERE id = p_mascota_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE='22023'; END IF;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'mascota_sin_familia' USING ERRCODE='22023'; END IF;

  /* Idempotencia hablada: devuelve la que YA existe con su id (`L-424`), para
     que la pantalla LLEVE ahi en vez de decir que no. */
  SELECT id INTO v_pub FROM adopcion_publicacion
   WHERE mascota_id = p_mascota_id AND estado IN ('borrador','publicada','pausada');
  IF v_pub IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'publicacion_id', v_pub, 'ya_existia', true);
  END IF;

  INSERT INTO adopcion_publicacion (
    mascota_id, cuenta_comercial_id, publicada_por, country_code, estado, ingresado_en,
    ciudad_id, zona, senas, origen_rescate, fecha_cesion, estado_vacunal, desparasitado,
    urgente, bono_monto, bono_destino, historia,
    convive_perros, convive_gatos, convive_ninos)
  VALUES (
    p_mascota_id, p_cuenta_comercial_id, v_user, v_cc, 'borrador', p_ingresado_en,
    NULLIF(p_ficha->>'ciudad_id','')::uuid, NULLIF(p_ficha->>'zona',''),
    NULLIF(p_ficha->>'senas',''), NULLIF(p_ficha->>'origen_rescate',''),
    NULLIF(p_ficha->>'fecha_cesion','')::date, NULLIF(p_ficha->>'estado_vacunal',''),
    NULLIF(p_ficha->>'desparasitado',''),
    COALESCE((p_ficha->>'urgente')::boolean, false),
    NULLIF(p_ficha->>'bono_monto','')::numeric, NULLIF(p_ficha->>'bono_destino',''),
    NULLIF(p_ficha->>'historia',''),
    COALESCE(NULLIF(p_ficha->>'convive_perros',''), 'no_se_sabe'),
    COALESCE(NULLIF(p_ficha->>'convive_gatos',''),  'no_se_sabe'),
    COALESCE(NULLIF(p_ficha->>'convive_ninos',''),  'no_se_sabe'))
  RETURNING id INTO v_pub;

  RETURN jsonb_build_object('ok', true, 'publicacion_id', v_pub,
                            'ya_existia', false, 'estado', 'borrador');
END $fn$;

/* ── 9 · EDITAR LA FICHA ───────────────────────────────────────────────────
   Lista blanca de claves. Una clave que no este aca **rebota con su nombre**:
   *un editor que ignora en silencio lo que no conoce le dice a la pantalla que
   guardo algo que no guardo.* */
CREATE OR REPLACE FUNCTION public.actualizar_adoptable(p_publicacion_id uuid, p_ficha jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_cta uuid; v_k text;
  v_permitidas text[] := ARRAY['ciudad_id','zona','senas','origen_rescate','fecha_cesion',
    'estado_vacunal','desparasitado','urgente','bono_monto','bono_destino','historia',
    'convive_perros','convive_gatos','convive_ninos','ingresado_en','pareja_id'];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT cuenta_comercial_id INTO v_cta FROM adopcion_publicacion WHERE id = p_publicacion_id;
  IF v_cta IS NULL THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(v_cta) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;

  FOR v_k IN SELECT jsonb_object_keys(p_ficha) LOOP
    IF NOT (v_k = ANY(v_permitidas)) THEN
      RAISE EXCEPTION 'campo_no_editable: %', v_k USING ERRCODE='22023';
    END IF;
  END LOOP;

  UPDATE adopcion_publicacion SET
    ciudad_id      = CASE WHEN p_ficha ? 'ciudad_id'      THEN NULLIF(p_ficha->>'ciudad_id','')::uuid   ELSE ciudad_id END,
    zona           = CASE WHEN p_ficha ? 'zona'           THEN NULLIF(p_ficha->>'zona','')              ELSE zona END,
    senas          = CASE WHEN p_ficha ? 'senas'          THEN NULLIF(p_ficha->>'senas','')             ELSE senas END,
    origen_rescate = CASE WHEN p_ficha ? 'origen_rescate' THEN NULLIF(p_ficha->>'origen_rescate','')    ELSE origen_rescate END,
    fecha_cesion   = CASE WHEN p_ficha ? 'fecha_cesion'   THEN NULLIF(p_ficha->>'fecha_cesion','')::date ELSE fecha_cesion END,
    estado_vacunal = CASE WHEN p_ficha ? 'estado_vacunal' THEN NULLIF(p_ficha->>'estado_vacunal','')    ELSE estado_vacunal END,
    desparasitado  = CASE WHEN p_ficha ? 'desparasitado'  THEN NULLIF(p_ficha->>'desparasitado','')     ELSE desparasitado END,
    urgente        = CASE WHEN p_ficha ? 'urgente'        THEN COALESCE((p_ficha->>'urgente')::boolean, false) ELSE urgente END,
    bono_monto     = CASE WHEN p_ficha ? 'bono_monto'     THEN NULLIF(p_ficha->>'bono_monto','')::numeric ELSE bono_monto END,
    bono_destino   = CASE WHEN p_ficha ? 'bono_destino'   THEN NULLIF(p_ficha->>'bono_destino','')      ELSE bono_destino END,
    historia       = CASE WHEN p_ficha ? 'historia'       THEN NULLIF(p_ficha->>'historia','')          ELSE historia END,
    convive_perros = CASE WHEN p_ficha ? 'convive_perros' THEN COALESCE(NULLIF(p_ficha->>'convive_perros',''),'no_se_sabe') ELSE convive_perros END,
    convive_gatos  = CASE WHEN p_ficha ? 'convive_gatos'  THEN COALESCE(NULLIF(p_ficha->>'convive_gatos',''),'no_se_sabe')  ELSE convive_gatos END,
    convive_ninos  = CASE WHEN p_ficha ? 'convive_ninos'  THEN COALESCE(NULLIF(p_ficha->>'convive_ninos',''),'no_se_sabe')  ELSE convive_ninos END,
    ingresado_en   = CASE WHEN p_ficha ? 'ingresado_en'   THEN (p_ficha->>'ingresado_en')::date         ELSE ingresado_en END,
    pareja_id      = CASE WHEN p_ficha ? 'pareja_id'      THEN NULLIF(p_ficha->>'pareja_id','')::uuid   ELSE pareja_id END,
    actualizada_en = now()
  WHERE id = p_publicacion_id;

  RETURN jsonb_build_object('ok', true, 'publicacion_id', p_publicacion_id);
END $fn$;

/* ── 10 · CAMBIAR DE ESTADO ────────────────────────────────────────────────
   Una sola puerta para los cinco estados. `despublicar_adoptable` pasa a ser su
   consumidor y no una segunda implementacion: *dos funciones que mueven el
   mismo estado divergen el dia que una gana un gate y la otra no* — que es
   exactamente lo que va a pasar en A3 con la regla de los seis meses. */
CREATE OR REPLACE FUNCTION public.cambiar_estado_adoptable(
  p_publicacion_id uuid, p_estado text, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
DECLARE v_cta uuid; v_estado text; v_masc uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF p_estado NOT IN ('borrador','publicada','pausada','adoptada','no_disponible') THEN
    RAISE EXCEPTION 'estado_no_valido: %', p_estado USING ERRCODE='22023';
  END IF;

  SELECT cuenta_comercial_id, estado, mascota_id INTO v_cta, v_estado, v_masc
    FROM adopcion_publicacion WHERE id = p_publicacion_id FOR UPDATE;
  IF v_cta IS NULL THEN RAISE EXCEPTION 'publicacion_no_existe' USING ERRCODE='22023'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(v_cta) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'sin_acceso' USING ERRCODE='42501';
  END IF;
  IF v_estado = p_estado THEN
    RETURN jsonb_build_object('ok', true, 'ya_estaba', true, 'estado', p_estado);
  END IF;

  /* 🔴 `adoptada` NO se escribe a mano: la escribe el traspaso, que ocurre con
     las DOS firmas del acta. *Un refugio que puede marcar «adoptada» sin acta
     puede sacar un animal de la vidriera sin que exista el documento que la
     ley exige.* */
  IF p_estado = 'adoptada' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'adoptada_la_escribe_el_acta' USING ERRCODE='42501';
  END IF;

  UPDATE adopcion_publicacion
     SET estado = p_estado,
         retirada_en   = CASE WHEN p_estado='no_disponible' THEN now() ELSE NULL END,
         motivo_retiro = CASE WHEN p_estado='no_disponible' THEN p_motivo ELSE NULL END,
         actualizada_en = now()
   WHERE id = p_publicacion_id;

  RETURN jsonb_build_object('ok', true, 'ya_estaba', false,
                            'estado', p_estado, 'estado_anterior', v_estado);
END $fn$;

CREATE OR REPLACE FUNCTION public.despublicar_adoptable(p_publicacion_id uuid, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp' AS $fn$
BEGIN
  RETURN public.cambiar_estado_adoptable(p_publicacion_id, 'no_disponible', p_motivo);
END $fn$;

REVOKE ALL ON FUNCTION public.publicar_adoptable(uuid,uuid,date,jsonb) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.actualizar_adoptable(uuid,jsonb) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.cambiar_estado_adoptable(uuid,text,text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.publicar_adoptable(uuid,uuid,date,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_adoptable(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cambiar_estado_adoptable(uuid,text,text) TO authenticated;

/* ═══ CINTURON — CADA BRAZO PRODUCE SU ROJO ANTES DE DAR VERDE ═════════════
   `L-459`: la primera prueba de un guard nuevo no es que de VERDE, es que de
   ROJO sobre el primer caso real. Corre en subtransaccion que se deshace sola
   (`L-406`: un arnes que ejecuta de verdad hace lo que vino a vigilar). */
DO $cint$
DECLARE
  v_m uuid; v_p uuid; v_ok boolean; v_n int; v_estado_previo text;
BEGIN
  -- ①  Convivencia no admite un cuarto estado.
  BEGIN
    SELECT id INTO v_m FROM mascotas WHERE familia_id IS NOT NULL LIMIT 1;
    IF v_m IS NULL THEN RAISE EXCEPTION 'CINTURON: no hay mascota con familia para medir'; END IF;
    SELECT estado_adopcion INTO v_estado_previo FROM mascotas WHERE id = v_m;
    INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code,
                                      estado, ingresado_en, convive_perros)
    SELECT v_m, (SELECT id FROM cuentas_comerciales LIMIT 1), 'EC',
           'borrador', current_date - 30, 'quizas';
    RAISE EXCEPTION 'CINTURON ROJO ①: convivencia acepto «quizas»';
  EXCEPTION
    WHEN check_violation THEN NULL;   -- verde: el CHECK lo rechazo
  END;

  -- ②  El estado viejo `retirada` es inexpresable.
  BEGIN
    INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code,
                                      estado, ingresado_en)
    SELECT v_m, (SELECT id FROM cuentas_comerciales LIMIT 1), 'EC', 'retirada', current_date - 30;
    RAISE EXCEPTION 'CINTURON ROJO ②: el estado jubilado «retirada» sigue entrando';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- ③  `ingresado_en` es obligatoria.
  BEGIN
    INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code, estado)
    SELECT v_m, (SELECT id FROM cuentas_comerciales LIMIT 1), 'EC', 'borrador';
    RAISE EXCEPTION 'CINTURON ROJO ③: se pudo publicar sin fecha de ingreso al rescate';
  EXCEPTION WHEN not_null_violation THEN NULL; END;

  -- ④  Una fecha de ingreso futura no entra.
  BEGIN
    INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code,
                                      estado, ingresado_en)
    SELECT v_m, (SELECT id FROM cuentas_comerciales LIMIT 1), 'EC',
           'borrador', current_date + 5;
    RAISE EXCEPTION 'CINTURON ROJO ④: entro un ingreso al rescate en el futuro';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- ⑤  CONTROL POSITIVO: una fila legitima SI entra, y el trigger sincroniza.
  --     (sin este brazo, los cuatro de arriba pasarian con una tabla rota)
  INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code,
                                    estado, ingresado_en, convive_perros, urgente)
  SELECT v_m, (SELECT id FROM cuentas_comerciales LIMIT 1), 'EC',
         'borrador', current_date - 200, 'no_se_sabe', true
  RETURNING id INTO v_p;
  IF v_p IS NULL THEN RAISE EXCEPTION 'CINTURON ROJO ⑤: la fila legitima no entro'; END IF;

  SELECT estado_adopcion = 'borrador' INTO v_ok FROM mascotas WHERE id = v_m;
  IF NOT COALESCE(v_ok,false) THEN
    RAISE EXCEPTION 'CINTURON ROJO ⑤b: el trigger no sincronizo estado_adopcion';
  END IF;

  -- ⑥  Dos publicaciones vivas de la misma mascota: imposible.
  BEGIN
    INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, country_code,
                                      estado, ingresado_en)
    SELECT v_m, (SELECT id FROM cuentas_comerciales LIMIT 1), 'EC', 'pausada', current_date - 10;
    RAISE EXCEPTION 'CINTURON ROJO ⑥: entro una segunda publicacion viva de la misma mascota';
  EXCEPTION WHEN unique_violation THEN NULL; END;

  -- ⑦  Una pareja consigo misma es inexpresable.
  BEGIN
    UPDATE adopcion_publicacion SET pareja_id = v_p WHERE id = v_p;
    RAISE EXCEPTION 'CINTURON ROJO ⑦: una publicacion quedo emparejada consigo misma';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- ⑧  `no_disponible` exige su fecha de retiro.
  BEGIN
    UPDATE adopcion_publicacion SET estado='no_disponible', retirada_en=NULL WHERE id = v_p;
    RAISE EXCEPTION 'CINTURON ROJO ⑧: quedo no_disponible sin fecha de retiro';
  EXCEPTION WHEN check_violation THEN NULL; END;

  RAISE NOTICE 'CINTURON A1: 8 brazos verdes (4 rojos producidos, 1 control positivo, 3 mas)';

  -- Residuo cero: la fila del control positivo se borra en la misma transaccion.
  DELETE FROM adopcion_publicacion WHERE id = v_p;
  SELECT count(*) INTO v_n FROM adopcion_publicacion;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: residuo % filas', v_n; END IF;
  /* El trigger le escribio `borrador` a la mascota. Se restaura el valor EXACTO
     que tenia antes — no se pone NULL «porque queda parecido»: ese es el atajo
     que un dia deja una mascota real fuera de la vidriera. */
  UPDATE mascotas SET estado_adopcion = v_estado_previo WHERE id = v_m;
  SELECT count(*) INTO v_n FROM mascotas WHERE id = v_m AND estado_adopcion IS DISTINCT FROM v_estado_previo;
  IF v_n <> 0 THEN RAISE EXCEPTION 'CINTURON: la mascota quedo con estado_adopcion cambiado'; END IF;
END $cint$;

COMMIT;
