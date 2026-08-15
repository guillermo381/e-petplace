-- S98-A · EL REPARTIDOR GANA IDENTIDAD, Y SU VEHÍCULO GANA TABLA
--          (contrato de C: `docs/relevamientos/2026-08-14-s98c-pedido-a-A-corte-y-repartidor.md` §B)
--
-- ═══ POR QUÉ EXISTE ════════════════════════════════════════════════════════
-- La spec firmada del founder pide, para dar de alta a quien entrega: **tipo**
-- de documento · **foto del documento** · **foto de la persona** · **WhatsApp**
-- · y **su vehículo (tipo + placa, hasta dos)**. El esquema de hoy tiene
-- `nombre · documento · telefono` y nada más.
--
-- *Con tres repartidores en la calle, «quién entregó» no es un dato de
--  auditoría: es a quién llamás cuando un pedido no llegó.*
--
-- ═══════════════════════════════════════════════════════════════════════════
-- 76(g) — VEDA DE ESCRITURA: **NO RIGE**.
--   DDL puro: cuatro columnas nuevas (nacen NULL en las 4 filas vivas) y una
--   tabla nueva vacía. **Cero backfill, cero anclas, cero dato movido.**
--   El cinturón sí escribe y borra, y su residuo se mide al final.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ═══ 🔴 LO QUE ESTA MIGRACIÓN **NO** HACE, Y ES DELIBERADO ═════════════════
-- **NO exige las fotos ni el WhatsApp.** La spec dice «obligatoria» y C pidió
-- que la obligatoriedad viviera en la puerta — y las dos cosas son correctas.
-- Pero se MIDIÓ que `registrar_repartidor` tiene **DOS llamadores vivos en
-- `main`** (`ventas/configuracion.tsx` y `alta/PasoEquipo.tsx`), los dos
-- mandando solo `nombre · documento · teléfono`.
--
-- > ***Una migración se aplica a la base viva al instante; un OTA tarda.***
-- > Exigirlas hoy rompería las dos altas del bundle YA PUBLICADO —
-- > **antes de que exista la pantalla que las satisface**, y sin ninguna
-- > forma de arreglarlo desde la base.
--
-- Y el modo de falla no sería una excepción visible: sería **el vendedor sin
-- poder dar de alta a nadie**, que es justo lo que C protegió al dejar el alta
-- vieja viva.
--
-- ⇒ El guard de obligatoriedad se entrega ESCRITO Y APARTE
--   (`20260816120000_s98a_repartidor_exige_identidad.sql`), y **se aplica en
--   la misma ventana en que se mergea la pantalla nueva de C.** El disparo
--   está escrito en su cabecera para que no dependa de que alguien se acuerde.

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- ① LAS CUATRO COLUMNAS DE IDENTIDAD
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.repartidores
  ADD COLUMN IF NOT EXISTS tipo_documento      text,
  ADD COLUMN IF NOT EXISTS documento_foto_path text,
  ADD COLUMN IF NOT EXISTS foto_path           text,
  ADD COLUMN IF NOT EXISTS whatsapp            text;

-- ── `tipo_documento`: FK COMPUESTA, no un CHECK con la lista copiada ───────
-- Se midió que `cat_tipos_documento_titular` es único por **(country_code,
-- codigo)** —no por `codigo` solo— y que `repartidores.country_code` ya existe
-- NOT NULL. Con eso la FK real es gratis, y hace DOS cosas que un
-- `CHECK (tipo_documento IN ('CEDULA','RUC','PASAPORTE'))` no haría:
--   · el vocabulario vive en UN lugar — agregar un tipo es una fila, no una
--     migración que hay que acordarse de replicar acá;
--   · **ata el tipo al PAÍS del repartidor**: a uno con `country_code='CO'` no
--     se le puede poner un tipo que solo existe para EC. *Un CHECK con la
--     lista adentro habría aceptado «CEDULA» para cualquier país, que es un
--     dato válido en apariencia y falso en el hecho.*
--
-- Semántica de NULL: la FK es MATCH SIMPLE, así que con `tipo_documento IS
-- NULL` **no se evalúa** — que es exactamente lo que hace falta para que las
-- 4 filas vivas (todas sin tipo) sigan siendo legales.
ALTER TABLE public.repartidores
  ADD CONSTRAINT fk_repartidores_tipo_documento
  FOREIGN KEY (country_code, tipo_documento)
  REFERENCES public.cat_tipos_documento_titular (country_code, codigo)
  ON DELETE RESTRICT;

-- ── `whatsapp`: la convención NO se eligió, la dicta la columna de al lado ──
-- 🔴 D-823 vive acá: en la casa hay **9 columnas que PROHÍBEN el `+` contra 4
-- que lo EXIGEN**, y elegir mal es barato de escribir y caro de descubrir.
-- Se midió `repartidores.telefono`:
--
--     CHECK (telefono IS NULL OR telefono ~ '^\+[1-9][0-9]{6,14}$')
--
-- **Esta tabla ya está del lado que exige E.164.** El precedente completo es
-- `prestadores`, que tiene las DOS columnas y las dos en E.164.
--
-- > ***Un `whatsapp` sin `+` al lado de un `telefono` con `+` sería el peor
-- > caso posible de D-823: dos convenciones EN LA MISMA FILA.***
--
-- Y por eso esta columna **no agrega un caso al problema: lo cierra del lado
-- correcto**, sin tocar las otras nueve (que siguen esperando su letra, porque
-- P21 prohíbe DERIVAR el país y un backfill lo estaría inventando).
ALTER TABLE public.repartidores
  ADD CONSTRAINT chk_repartidores_whatsapp_e164
  CHECK (whatsapp IS NULL OR whatsapp ~ '^\+[1-9][0-9]{6,14}$');

-- ── Los dos paths: PATH, jamás URL ────────────────────────────────────────
-- No es preferencia de estilo. Se midieron **cinco precedentes vivos** con el
-- mismo CHECK (`mascotas_foto_url_es_path`, `prestador_documentos`,
-- `prestador_fotos`, `prestadores.clip_url`, `cuenta_comercial_documentos`).
-- Nació en S47 de un incidente real: un bundle viejo escribió una URL firmada
-- en una columna de path, **la URL venció**, y la foto se perdió sin error.
-- *Una URL firmada guardada es un dato con fecha de muerte que nadie ve venir.*
ALTER TABLE public.repartidores
  ADD CONSTRAINT chk_repartidores_doc_foto_es_path
  CHECK (documento_foto_path IS NULL OR documento_foto_path !~* '^https?://'),
  ADD CONSTRAINT chk_repartidores_foto_es_path
  CHECK (foto_path IS NULL OR foto_path !~* '^https?://');

COMMENT ON COLUMN public.repartidores.tipo_documento IS
  'Código de cat_tipos_documento_titular, atado al country_code del repartidor '
  'por FK compuesta. NULL = no declarado (las 4 filas previas a S98).';
COMMENT ON COLUMN public.repartidores.whatsapp IS
  'E.164 con + — la MISMA convención que `telefono` en esta tabla (D-823: la '
  'convención es POR TABLA, y ésta ya estaba del lado que exige el +).';
COMMENT ON COLUMN public.repartidores.documento_foto_path IS
  'PATH en el bucket privado `cuenta-documentos`, bajo <cuenta_comercial_id>/. '
  'Jamás URL: una URL firmada guardada vence y la foto se pierde sin error.';
COMMENT ON COLUMN public.repartidores.foto_path IS
  'PATH de la foto de la persona. Mismo bucket y misma regla que el documento.';

-- ═══════════════════════════════════════════════════════════════════════════
-- ② `repartidor_vehiculos` — TABLA NUEVA (adjudicado, con doble voto)
--
-- 🔴 **`recursos_reparto` NO SE TOCA.** Se verificó que existe, que su
-- semántica es **CAPACIDAD DE LA CUENTA** (`capacidad_por_dia`,
-- `dias_operacion`) y que **está cableada**: `cupo_reparto_del_dia` la lee para
-- el techo del día. La spec pide **identidad de vehículo** (tipo + placa).
--
-- > ***Montar identidad encima de capacidad le cambiaría el significado a la
-- > tabla que da el cupo, y el cupo empezaría a contar vehículos en vez de
-- > recursos — sin error, sin excepción y sin síntoma.***
--
-- Un lector que ya existe convierte un cambio de semántica en un cambio de
-- resultado. Por eso son dos tablas.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.repartidor_vehiculos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repartidor_id  uuid NOT NULL REFERENCES public.repartidores(id) ON DELETE CASCADE,

  -- Vocabulario cerrado de DOS valores. Acá un CHECK es proporcionado: un
  -- catálogo para dos filas sería infraestructura sin lectores.
  tipo           text NOT NULL CHECK (tipo IN ('moto', 'carro')),

  -- ⚠️ SIN máscara de formato, A PROPÓSITO. Ecuador tiene varios formatos
  -- vivos (particular, comercial, moto, y placas viejas todavía en circulación).
  -- *Un regex que rechaza una placa real deja al vendedor sin poder registrar
  --  la moto con la que reparte — y ese daño es inmediato, mientras que el de
  --  una placa mal tipeada es corregible.* Se normaliza (mayúsculas, sin
  -- espacios) en la puerta y se exige no-vacía acá.
  placa          text NOT NULL CHECK (length(btrim(placa)) > 0),

  -- 🔴 EL TECHO DE 2, HECHO INEXPRESABLE (no vigilado).
  -- `orden` ∈ {1,2} + UNIQUE(repartidor_id, orden) ⇒ **un tercer vehículo no
  -- es un caso que un trigger rechace: es una fila que no se puede escribir.**
  -- Es el patrón de L-222: ante un estado malo, la cura no es mirarlo mejor —
  -- es volverlo imposible de expresar.
  orden          smallint NOT NULL DEFAULT 1 CHECK (orden IN (1, 2)),

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_repartidor_vehiculo_orden UNIQUE (repartidor_id, orden),
  -- La misma placa dos veces en la misma persona no significa nada. Entre
  -- personas distintas SÍ puede repetirse: una casa con una sola moto y dos
  -- repartidores que se turnan es un caso real, no un error.
  CONSTRAINT uq_repartidor_vehiculo_placa UNIQUE (repartidor_id, placa)
);

COMMENT ON TABLE public.repartidor_vehiculos IS
  'IDENTIDAD del vehículo de un repartidor (tipo + placa), techo de 2 por '
  'UNIQUE(repartidor_id, orden). NO confundir con `recursos_reparto`, que es '
  'CAPACIDAD de la cuenta y alimenta `cupo_reparto_del_dia`.';

CREATE INDEX IF NOT EXISTS idx_repartidor_vehiculos_repartidor
  ON public.repartidor_vehiculos (repartidor_id);

-- ── RLS: espejo EXACTO de `repartidores` ──────────────────────────────────
-- Se midió que `repartidores` tiene **una sola policy y es de SELECT**: toda
-- escritura entra por las puertas DEFINER. Se copia esa forma en vez de
-- inventarle policies de escritura a la tabla hija — *dos tablas hermanas con
-- modelos de escritura distintos es cómo nace un agujero que nadie audita.*
ALTER TABLE public.repartidor_vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY repartidor_vehiculos_select ON public.repartidor_vehiculos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.repartidores r
     WHERE r.id = repartidor_vehiculos.repartidor_id
       AND (es_vendedor_de(r.cuenta_comercial_id) OR r.user_id = auth.uid() OR is_admin())
  ));

-- L-140: nada de esto para `anon`.
REVOKE ALL ON public.repartidor_vehiculos FROM anon, PUBLIC;
GRANT SELECT ON public.repartidor_vehiculos TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN CON DISCRIMINADOR
--
-- Que la columna exista no prueba que defienda. Cada guard se prueba EN ROJO
-- adentro de la transacción, y el que no rechace ABORTA la migración entera.
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_rep uuid; v_filas int; v_residuo int;
  v_r_wa boolean := false; v_r_path boolean := false;
  v_r_fk boolean := false; v_r_techo boolean := false; v_r_tipo boolean := false;
BEGIN
  SELECT count(*) INTO v_filas FROM repartidores;
  IF v_filas = 0 THEN
    RAISE EXCEPTION
      'CINTURON ABORTA: no hay repartidores vivos — sin una fila real los guards no se pueden ejercer y el assert seria decorativo.';
  END IF;
  SELECT id INTO v_rep FROM repartidores ORDER BY created_at LIMIT 1;

  -- ── ROJO ①: whatsapp sin `+` (el defecto que D-823 predice) ──
  BEGIN
    UPDATE repartidores SET whatsapp = '0999123456' WHERE id = v_rep;
  EXCEPTION WHEN check_violation THEN v_r_wa := true;
  END;
  IF NOT v_r_wa THEN
    UPDATE repartidores SET whatsapp = NULL WHERE id = v_rep;
    RAISE EXCEPTION 'CINTURON ROJO: el CHECK de whatsapp ACEPTO un numero sin +. No discrimina.';
  END IF;

  -- ── ROJO ②: una URL donde va un path (el defecto de S47) ──
  BEGIN
    UPDATE repartidores SET foto_path = 'https://ejemplo.com/foto.jpg' WHERE id = v_rep;
  EXCEPTION WHEN check_violation THEN v_r_path := true;
  END;
  IF NOT v_r_path THEN
    UPDATE repartidores SET foto_path = NULL WHERE id = v_rep;
    RAISE EXCEPTION 'CINTURON ROJO: el CHECK de path ACEPTO una URL.';
  END IF;

  -- ── ROJO ③: un tipo de documento que no esta en el catalogo ──
  BEGIN
    UPDATE repartidores SET tipo_documento = 'LICENCIA' WHERE id = v_rep;
  EXCEPTION WHEN foreign_key_violation THEN v_r_fk := true;
  END;
  IF NOT v_r_fk THEN
    UPDATE repartidores SET tipo_documento = NULL WHERE id = v_rep;
    RAISE EXCEPTION 'CINTURON ROJO: la FK ACEPTO un tipo de documento inexistente.';
  END IF;

  -- ── VERDE de control: uno que SI esta en el catalogo tiene que pasar.
  --    Sin este brazo, un guard que rechace TODO daria «verde» en los tres
  --    rojos de arriba y estaria roto igual.
  UPDATE repartidores SET tipo_documento = 'CEDULA' WHERE id = v_rep;
  IF (SELECT tipo_documento FROM repartidores WHERE id = v_rep) IS DISTINCT FROM 'CEDULA' THEN
    RAISE EXCEPTION 'CINTURON ROJO: la FK RECHAZO un tipo valido del catalogo.';
  END IF;
  UPDATE repartidores SET tipo_documento = NULL WHERE id = v_rep;

  -- ── ROJO ④: el TECHO DE 2 ──
  INSERT INTO repartidor_vehiculos (repartidor_id, tipo, placa, orden)
    VALUES (v_rep, 'moto', 'CINTURON-1', 1), (v_rep, 'carro', 'CINTURON-2', 2);
  BEGIN
    INSERT INTO repartidor_vehiculos (repartidor_id, tipo, placa, orden)
      VALUES (v_rep, 'moto', 'CINTURON-3', 1);
  EXCEPTION WHEN unique_violation THEN v_r_techo := true;
  END;
  IF NOT v_r_techo THEN
    DELETE FROM repartidor_vehiculos WHERE repartidor_id = v_rep;
    RAISE EXCEPTION 'CINTURON ROJO: entro un TERCER vehiculo. El techo de 2 no es inexpresable.';
  END IF;

  -- ── ROJO ⑤: un tipo fuera del vocabulario ──
  BEGIN
    INSERT INTO repartidor_vehiculos (repartidor_id, tipo, placa, orden)
      VALUES (v_rep, 'bicicleta', 'CINTURON-4', 2);
  EXCEPTION WHEN check_violation THEN v_r_tipo := true;
       WHEN unique_violation THEN
         DELETE FROM repartidor_vehiculos WHERE repartidor_id = v_rep;
         RAISE EXCEPTION 'CINTURON ABORTA: el brazo del vocabulario reboto por el UNIQUE y no por el CHECK — no midio lo que dice medir.';
  END;
  IF NOT v_r_tipo THEN
    DELETE FROM repartidor_vehiculos WHERE repartidor_id = v_rep;
    RAISE EXCEPTION 'CINTURON ROJO: el CHECK de tipo ACEPTO «bicicleta».';
  END IF;

  -- ── TEARDOWN con residuo MEDIDO ──
  DELETE FROM repartidor_vehiculos WHERE repartidor_id = v_rep;
  SELECT count(*) INTO v_residuo FROM repartidor_vehiculos;
  IF v_residuo <> 0 THEN
    RAISE EXCEPTION 'CINTURON ABORTA: quedo residuo en repartidor_vehiculos (% filas)', v_residuo;
  END IF;
  IF EXISTS (SELECT 1 FROM repartidores
              WHERE whatsapp IS NOT NULL OR foto_path IS NOT NULL OR tipo_documento IS NOT NULL) THEN
    RAISE EXCEPTION 'CINTURON ABORTA: el teardown dejo residuo en repartidores.';
  END IF;

  RAISE NOTICE 'CINTURON OK · % repartidores · 5 rojos rechazaron · 1 verde de control paso · residuo 0', v_filas;
END;
$cinturon$;

COMMIT;
