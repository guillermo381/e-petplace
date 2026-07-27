-- S78-A4 — EL TRIGGER DE HERENCIA DE CHIPS (§6.1 LETRA_RECEPCION_S76)
-- ==================================================================
-- Declarado en S76, SIN DUENO desde entonces: no se construyo en S76, no
-- se toco en S77, y §13 lo seguia listando abierto. S78 lo toma.
--
-- EL AGUJERO, con la letra firmada: el chip es por OFICIO en la pantalla
-- pero el motor guarda a grano de OFERTA (prestador_empleado_servicios,
-- PK (empleado_id, servicio_id)). Las 8 lectoras que consultan esa tabla
-- son EXCLUYENTES, no inertes: con 0 filas el EXISTS es falso y solo
-- sobrevive la rama pe.rol='dueno'. Consecuencia, verbatim de la letra:
-- "la clinica agrega Ecografia el mes que viene -> nadie tiene ese chip
-- -> todos los veterinarios desaparecen de la disponibilidad de
-- ecografia, EN SILENCIO. Las 8 son excluyentes: no rebota, simplemente
-- no hay quien atienda."
--
-- LA CURA, tal como la letra la fija: un trigger sobre INSERT de
-- prestador_servicios que copie los chips del mismo oficio a la oferta
-- nueva. ADITIVO — una funcion, un trigger, LAS 8 LECTORAS INTACTAS. La
-- alternativa (migrar las 8 a grano de oficio) es el arco que no
-- queremos.
--
-- ── LA LLAVE DEL OFICIO, medida y decidida ────────────────────────────
-- `categoria` NO es el eje de oficio limpio que la letra presupone. La
-- DB tiene OCHO categorias (adiestramiento, emergencia, grooming,
-- hospedaje, otro, paseo, telemedicina, veterinario) y LO MEDICO SE
-- REPARTE EN TRES: veterinario (13 tipos), telemedicina (1) y
-- emergencia (1).
--
-- Por eso la herencia usa DOS llaves, no una:
--   * oferta nueva con es_medico=true -> hereda de quien tenga chip en
--     CUALQUIER oferta es_medico=true del mismo negocio.
--   * oferta nueva no medica          -> hereda por `categoria`.
--
-- No es ingenio: es la regla que la casa YA firmo. S70: "el dia clinico
-- se compone por es_medico, JAMAS por categoria" (filtrar por categoria
-- perdia telemedicina y urgencias), y §6.2 de esta misma letra gatea la
-- capacidad clinica por es_medico. Heredar lo medico por categoria
-- dejaria el agujero abierto justo donde la letra lo denuncia: un vet
-- con seis chips veterinario no heredaria una urgencia nueva.
--
-- NO se exige ps.activo en la oferta ORIGEN — espejo literal de la
-- decision de §6.2 ("desactivar una oferta no le quita el expediente al
-- vet").
--
-- SECURITY DEFINER, y su porque: la herencia tiene que ser determinista
-- sin importar QUIEN crea la oferta (titular por RLS, admin, o una RPC
-- DEFINER). Es contenido por construccion: el trigger solo copia chips
-- DENTRO DEL MISMO prestador — no puede cruzar negocios, porque tanto la
-- oferta origen como el empleado se filtran por NEW.prestador_id. Y no
-- puede inventar personas: solo copia a quien YA tenia el oficio.
--
-- 76(g) — DECLARACION OBLIGATORIA: **NO RIGE**. Es DDL aditiva pura
-- (CREATE FUNCTION + CREATE TRIGGER), sin backfill y sin calculo de
-- anclas sobre datos vivos. No se abre veda de escritura.
--
-- SIN BACKFILL, declarado: esta migracion NO reparte chips sobre las
-- ofertas que ya existen. Rige hacia adelante. Repartir hacia atras seria
-- CONCEDER disponibilidad que hoy nadie tiene — decision de producto, no
-- de migracion, y pide censo y firma propios.
--
-- L-140: la funcion es de trigger (RETURNS trigger). Igual se le REVOCA
-- EXECUTE a PUBLIC/anon al pie — nadie la llama directo; el unico
-- invocador legitimo es el trigger.
--
-- REVERSA: docs/relevamientos/2026-07-26-s78a-REVERSA-herencia-de-chips.sql
-- ==================================================================

CREATE OR REPLACE FUNCTION public._trg_ps_hereda_chips()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_es_medico boolean;
  v_categoria text;
BEGIN
  SELECT ts.es_medico, ts.categoria
    INTO v_es_medico, v_categoria
  FROM tipos_servicio ts
  WHERE ts.codigo = NEW.tipo_servicio;

  -- Tipo desconocido: no se inventa herencia (regla 36, cero fallback
  -- silencioso). La oferta se crea igual; simplemente no hereda.
  IF v_categoria IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO prestador_empleado_servicios (empleado_id, servicio_id)
  SELECT DISTINCT pes.empleado_id, NEW.id
  FROM prestador_empleado_servicios pes
  JOIN prestador_servicios ps ON ps.id = pes.servicio_id
  JOIN tipos_servicio ts      ON ts.codigo = ps.tipo_servicio
  JOIN prestador_empleados pe ON pe.id = pes.empleado_id
  WHERE ps.prestador_id = NEW.prestador_id      -- el oficio, en ESTE negocio
    AND pe.prestador_id = NEW.prestador_id      -- y la persona, tambien
    AND pe.activo                               -- a los dados de baja, no
    AND ps.id <> NEW.id
    AND (
      CASE WHEN COALESCE(v_es_medico, false)
           THEN COALESCE(ts.es_medico, false)   -- lo medico, por es_medico
           ELSE ts.categoria = v_categoria      -- el resto, por categoria
      END
    )
  ON CONFLICT (empleado_id, servicio_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_ps_hereda_chips ON public.prestador_servicios;
CREATE TRIGGER trg_ps_hereda_chips
AFTER INSERT ON public.prestador_servicios
FOR EACH ROW EXECUTE FUNCTION public._trg_ps_hereda_chips();

REVOKE EXECUTE ON FUNCTION public._trg_ps_hereda_chips() FROM PUBLIC, anon;
