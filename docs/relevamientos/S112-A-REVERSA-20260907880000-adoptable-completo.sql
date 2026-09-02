-- REVERSA de 20260907880000_s112a_adoptable_completo.sql
-- ESCRITA ANTES DE APLICAR (regla de la casa).
--
-- QUE DESHACE: las columnas nuevas de `adopcion_publicacion` y de `mascotas`,
-- el trigger de sincronia, el vocabulario de estados y las funciones nuevas.
--
-- 🔴 QUE **NO** DESHACE, y hay que leerlo antes de correrla:
--   · Los DATOS de esas columnas se PIERDEN. `ingresado_en` es la fecha de
--     ingreso al rescate: si algun refugio ya publico, ese dato no esta en
--     ningun otro lado y no vuelve.
--   · `mascotas.estado_adopcion` queda con el valor que el trigger dejo. La
--     reversa NO lo recalcula: el estado viejo era `publicada|retirada` y el
--     nuevo tiene cinco valores; mapear para atras inventaria un estado.
--   · Las publicaciones que esten en `borrador`, `pausada`, `adoptada` o
--     `no_disponible` **violan el CHECK viejo**. Por eso la reversa las lleva
--     a `retirada` explicitamente ANTES de restaurar el CHECK — y eso es una
--     PERDIDA DE INFORMACION declarada, no un efecto colateral.

BEGIN;

DROP TRIGGER IF EXISTS trg_publicacion_sincroniza_mascota ON public.adopcion_publicacion;
DROP FUNCTION IF EXISTS public._trg_publicacion_sincroniza_mascota() CASCADE;

DROP FUNCTION IF EXISTS public.cambiar_estado_adoptable(uuid, text, text);
DROP FUNCTION IF EXISTS public.actualizar_adoptable(uuid, jsonb);
DROP FUNCTION IF EXISTS public.publicar_adoptable(uuid, uuid, date, jsonb);

-- Restaurar la firma vieja de publicar_adoptable (dos argumentos).
CREATE OR REPLACE FUNCTION public.publicar_adoptable(p_mascota_id uuid, p_cuenta_comercial_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_user uuid := auth.uid(); v_pub uuid; v_cc text; v_fam uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  IF NOT public._user_gestiona_cuenta_refugio(p_cuenta_comercial_id) THEN
    RAISE EXCEPTION 'no_sos_cuenta_de_refugio' USING ERRCODE='42501';
  END IF;
  SELECT country_code, familia_id INTO v_cc, v_fam FROM mascotas WHERE id = p_mascota_id;
  IF v_cc IS NULL THEN RAISE EXCEPTION 'mascota_no_existe' USING ERRCODE='22023'; END IF;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'mascota_sin_familia' USING ERRCODE='22023'; END IF;
  SELECT id INTO v_pub FROM adopcion_publicacion
   WHERE mascota_id = p_mascota_id AND estado = 'publicada';
  IF v_pub IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'publicacion_id', v_pub, 'ya_existia', true);
  END IF;
  INSERT INTO adopcion_publicacion (mascota_id, cuenta_comercial_id, publicada_por, country_code)
       VALUES (p_mascota_id, p_cuenta_comercial_id, v_user, v_cc)
    RETURNING id INTO v_pub;
  UPDATE mascotas SET estado_adopcion = 'publicada', updated_at = now() WHERE id = p_mascota_id;
  RETURN jsonb_build_object('ok', true, 'publicacion_id', v_pub, 'ya_existia', false);
END $function$;

-- 🔴 PERDIDA DECLARADA: todo lo que no sea `publicada` pasa a `retirada`.
UPDATE public.adopcion_publicacion
   SET estado = 'retirada',
       retirada_en = COALESCE(retirada_en, now()),
       motivo_retiro = COALESCE(motivo_retiro, 'reversa 20260907880000: el estado real se perdio')
 WHERE estado <> 'publicada';

ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_estado_adoptable;
ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_no_disponible_coherente;
ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_origen_rescate_coherente;
ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_bono_positivo;
ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_pareja_no_es_si_misma;
ALTER TABLE public.adopcion_publicacion DROP CONSTRAINT IF EXISTS chk_ingresado_no_futuro;

ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT adopcion_publicacion_estado_check
  CHECK (estado = ANY (ARRAY['publicada'::text,'retirada'::text]));
ALTER TABLE public.adopcion_publicacion
  ADD CONSTRAINT chk_retiro_coherente
  CHECK (((estado='publicada' AND retirada_en IS NULL) OR (estado='retirada' AND retirada_en IS NOT NULL)));

DROP INDEX IF EXISTS public.uq_publicacion_viva_por_mascota;
CREATE UNIQUE INDEX uq_publicacion_viva_por_mascota
  ON public.adopcion_publicacion (mascota_id) WHERE (estado = 'publicada');

DROP INDEX IF EXISTS public.ix_adoptable_espera;
DROP INDEX IF EXISTS public.ix_adoptable_recientes;
DROP INDEX IF EXISTS public.ix_adoptable_ciudad;
DROP INDEX IF EXISTS public.ix_adoptable_cuenta;

ALTER TABLE public.adopcion_publicacion
  DROP COLUMN IF EXISTS ingresado_en,
  DROP COLUMN IF EXISTS ciudad_id,
  DROP COLUMN IF EXISTS zona,
  DROP COLUMN IF EXISTS senas,
  DROP COLUMN IF EXISTS origen_rescate,
  DROP COLUMN IF EXISTS fecha_cesion,
  DROP COLUMN IF EXISTS estado_vacunal,
  DROP COLUMN IF EXISTS desparasitado,
  DROP COLUMN IF EXISTS urgente,
  DROP COLUMN IF EXISTS pareja_id,
  DROP COLUMN IF EXISTS bono_monto,
  DROP COLUMN IF EXISTS bono_destino,
  DROP COLUMN IF EXISTS historia,
  DROP COLUMN IF EXISTS convive_perros,
  DROP COLUMN IF EXISTS convive_gatos,
  DROP COLUMN IF EXISTS convive_ninos,
  DROP COLUMN IF EXISTS actualizada_en;

ALTER TABLE public.mascotas
  DROP COLUMN IF EXISTS esterilizado,
  DROP COLUMN IF EXISTS remetfu;

COMMIT;
