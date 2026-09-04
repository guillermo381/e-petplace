/* ═══════════════════════════════════════════════════════════════════════════
   S113-A · lote 0 — LAS DOS PUERTAS QUE LA FAMILIA NO TENÍA
   Migración 20260909000000 · reversa: docs/loop/S113-A-REVERSA-20260909000000.sql

   ═══ BLOQUE 3 · PESO Y RECUERDO ═══════════════════════════════════════════
   ✅ **EL PESO YA EXISTE Y YA CORRIÓ.** No se construye nada. Medido:
      · puerta: `registrarPesoMascota(mascotaId, {peso_kg, metodo})` en
        `packages/api/src/wrappers/salud.ts:102`
      · pantalla: `apps/cliente/src/components/registrar-peso-hoja.tsx:66`
      · CHECK vivo: metodo_medicion ∈ (bascula_clinica, bascula_casa, estimacion)
      · **control positivo**: 7 filas, de las cuales `bascula_casa`=4 y
        `estimacion`=1 ⇒ el camino de la familia no está construido: está USADO.
      ⇒ C la conecta donde falte; A no toca nada.

   🔴 **EL RECUERDO NO TIENE PUERTA, y el brief apuntaba a la tabla equivocada.**
      La letra decía «evento_hito_narrativo con foto». Medido:
      · `evento_hito_narrativo` **no tiene policy de INSERT** — sólo SELECT y
        DELETE de admin. Sus 3 productores son funciones DEFINER del sistema
        (`crear_familia_con_primera_mascota`, `agregar_mascota_a_familia`,
        `firmar_acta_adopcion`) con un vocabulario cerrado de 3 claves
        (`adopcion_completada`, `llego_a_la_familia`, `mundo_nuevo_empieza`).
      · **no tiene columna de foto**, y de sus 69 filas **ninguna** guarda una
        en `contexto` (0 con 'foto'/'imagen'/'url').
      ⇒ Es la tabla de los HITOS DEL SISTEMA. Meter ahí el recuerdo de una
        familia pediría abrirle una puerta de escritura y romperle el
        vocabulario: *dos cosas distintas en la misma tabla es cómo un
        catálogo deja de significar algo.*

      La tabla de la familia es **`evento_nota_dueno`**, y estaba esperando:
      eje `identidad`, `es_clinico=false`, CRUD completo del titular ya
      escrito (`nota_dueno_insert` = `user_id = auth.uid()` AND la mascota es
      suya), 0 filas. Le faltaban dos cosas: dónde poner la foto y cómo
      llamar a un recuerdo.

      ⚠️ **DOS DECISIONES QUE SE DECLARAN, no se esconden:**
      ① `categoria` gana el valor `recuerdo`. Es ampliar un vocabulario
         cerrado, que esta casa no hace de paso — se hace acá porque la
         alternativa era usar `otra` (un recuerdo que nadie puede volver a
         encontrar) o dejar a la familia sin puerta. Es UNA línea revertir.
      ② **`procedencia` queda NULL, y NO es un olvido**: `_crear_evento_padre_auto`
         escribe procedencia **sólo si el tipo es clínico** —regla suya,
         escrita en su cuerpo— y `nota_dueno` es `es_clinico=false`. Un
         recuerdo no tiene procedencia clínica. `modo_captura` sí se escribe:
         es ortogonal a lo clínico.

   ═══ BLOQUE 4 · ANTIPARASITARIO ════════════════════════════════════════════
   `evento_desparasitacion_aplicada` tiene **estructura, trigger y CERO filas**:
   nadie la escribe. Medido: policies INSERT/SELECT/UPDATE del titular ya
   escritas, CHECKs vivos (`tipo ∈ interna|externa|mixta` · `producto` no
   vacío · `fecha_proxima >= fecha_aplicada`), y su trigger ya estampa
   `declarado_por_familia` cuando no hay prestador — **y esta vez SÍ se
   escribe, porque `desparasitacion_aplicada` es `es_clinico=true`.**

   ⚠️ **LA PLAGA POR ESPECIE NO ENTRA** (pulga / garrapata / mosquito /
   interno). Llega en el lote 1 con su columna y su CHECK. **No se mete en
   `notas` ni en texto libre**: un dato que nace como prosa después no se
   puede consultar, y migrarlo es adivinarlo.

   ── 76(g) VEDA: **NO RIGE.** Cero backfill. Una columna nueva nullable, un
      valor nuevo en un CHECK, y dos funciones. Nada reescribe el pasado.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══ ① LA FOTO DEL RECUERDO ════════════════════════════════════════════════
   PATH del bucket `mascotas`, jamás URL — convención medida y copiada de
   `evento_vacuna_aplicada.archivo_url`, que la valida en su RPC. Acá el
   CHECK la hace inexpresable en vez de confiar en que cada escritor la
   respete. */
ALTER TABLE public.evento_nota_dueno ADD COLUMN IF NOT EXISTS foto_url text;

ALTER TABLE public.evento_nota_dueno DROP CONSTRAINT IF EXISTS evento_nota_dueno_foto_es_path;
ALTER TABLE public.evento_nota_dueno ADD CONSTRAINT evento_nota_dueno_foto_es_path
  CHECK (foto_url IS NULL OR foto_url NOT LIKE 'http%');

/* ═══ ② EL VOCABULARIO GANA `recuerdo` ══════════════════════════════════════ */
ALTER TABLE public.evento_nota_dueno DROP CONSTRAINT IF EXISTS chk_nota_categoria;
ALTER TABLE public.evento_nota_dueno ADD CONSTRAINT chk_nota_categoria
  CHECK (categoria = ANY (ARRAY['observacion_general','sintoma','comportamiento',
                                'alimentacion','medicacion_aplicada_casa','recordatorio',
                                'recuerdo','otra']));

/* ═══ ②bis 🔴 LA PUERTA ESTABA TAPIADA, Y LO ENCONTRÓ EL CINTURÓN ══════════
   El primer intento de este arnés rebotó con
   `eventos_mascota_eje_jtbd_fkey (23503)`. Causa medida:
   `_trg_nota_dueno_crear_evento` le pasa a la puerta de eventos el eje
   **`cuidado_diario`**, y `cat_ejes_jtbd` NO lo tiene — sus ocho códigos son
   identidad · etapa_vida · salud · cuidado_externo · alimentacion ·
   comportamiento · datos_pasivos · administrativo. Con FK y `ON DELETE
   RESTRICT`, **TODO INSERT en `evento_nota_dueno` falla desde que ese trigger
   se escribió.**

   ⇒ Las 0 filas de esa tabla no eran «falta la UI». Eran **una puerta
   tapiada**: nadie podría haber escrito ahí aunque hubiera tenido pantalla.
   *Un cero se lee como «nadie lo usó» y a veces significa «nadie pudo».*

   El eje correcto no se elige: lo dice `cat_tipos_evento.eje_jtbd` para
   `nota_dueno`, que es **`identidad`** — la misma fuente que los otros 15
   triggers respetan.

   🟠 **EL CENSO DE LA CLASE, corrido antes de curar** (los 16 triggers
   `_trg_*_crear_evento` contra `cat_ejes_jtbd` y `cat_tipos_evento`), porque
   curar el síntoma y no censar la clase es media cura:
     · **`nota_dueno` es el ÚNICO con eje inexistente** ⇒ se cura acá.
     · 🟠 `_trg_peso_crear_evento` pasa `salud`, su catálogo dice `etapa_vida`.
       El eje EXISTE, así que escribe — pero diverge, y hay 7 filas ya
       escritas con `salud`. **No se toca acá**: cambiarlo mueve el eje de
       eventos vivos y es decisión de producto, no de esta migración.
     · 🟠 `_trg_microchip_crear_evento` escribe el tipo `microchip_asignado`,
       que **no tiene fila en `cat_tipos_evento`** — y `eventos_mascota.tipo`
       también tiene FK. **Es la SEGUNDA puerta tapiada** (0 filas). No se
       cura acá: crear su fila de catálogo exige decidir eje y si es clínico.
   Las dos van al parte con ficha. */
CREATE OR REPLACE FUNCTION public._trg_nota_dueno_crear_evento()
RETURNS trigger
LANGUAGE plpgsql
AS $trg$
BEGIN
  IF NEW.evento_id IS NULL THEN
    NEW.evento_id := _crear_evento_padre_auto(
      NEW.mascota_id, 'nota_dueno', 'identidad',   -- era 'cuidado_diario': no existe
      NEW.fecha_nota,
      NULL, NULL,
      NEW.user_id, NULL,
      NEW.country_code,
      jsonb_build_object('categoria', NEW.categoria)
    );
  END IF;
  RETURN NEW;
END;
$trg$;

/* ═══ ③ LA PUERTA DEL RECUERDO ══════════════════════════════════════════════
   INVOKER a propósito: la RLS de `evento_nota_dueno` **ya es** el gate del
   titular y está escrita desde antes. Una DEFINER acá sería una puerta nueva
   que tendría que reimplementar ese mismo gate (L-167) para no ensancharlo. */
CREATE OR REPLACE FUNCTION public.registrar_recuerdo_familia(
  p_mascota_id uuid,
  p_contenido  text,
  p_fecha      date DEFAULT NULL,
  p_foto_url   text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_uid      uuid := auth.uid();
  v_texto    text;
  v_foto     text;
  v_pais     text;
  v_id       uuid;
  v_evento   uuid;
  v_marcados int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  v_texto := nullif(btrim(coalesce(p_contenido,'')), '');
  IF v_texto IS NULL THEN RAISE EXCEPTION 'recuerdo_vacio' USING ERRCODE='22023'; END IF;

  /* La foto: path del bucket, carpeta de quien escribe. Espejo literal de lo
     que `registrar_vacunas_de_carnet` valida para el carnet. */
  v_foto := nullif(btrim(coalesce(p_foto_url,'')), '');
  IF v_foto IS NOT NULL THEN
    IF v_foto LIKE 'http%' THEN
      RAISE EXCEPTION 'foto_invalida: es una URL, se espera un path del bucket' USING ERRCODE='22023';
    END IF;
    IF split_part(v_foto, '/', 1) <> v_uid::text THEN
      RAISE EXCEPTION 'foto_invalida: el path no está en la carpeta del dueño' USING ERRCODE='22023';
    END IF;
  END IF;

  /* El país del hecho: el de la mascota, y si no lo tiene, el de quien lo
     escribe. `EC` es el último recurso, no el primero. (P21: el país es
     contexto de OPERACIÓN, jamás de identidad.) */
  SELECT coalesce(m.country_code, pr.country_code, 'EC') INTO v_pais
    FROM mascotas m LEFT JOIN profiles pr ON pr.id = v_uid
   WHERE m.id = p_mascota_id;
  IF v_pais IS NULL THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE='42501';   -- la RLS la ocultó
  END IF;

  /* El trigger `_trg_nota_dueno_crear_evento` crea el padre. Si la mascota no
     es del titular, la policy `nota_dueno_insert` rebota con 42501 — el gate
     es ÉSE, no un IF de cortesía. */
  INSERT INTO evento_nota_dueno
    (mascota_id, user_id, country_code, categoria, contenido, fecha_nota, foto_url)
  VALUES
    (p_mascota_id, v_uid, v_pais, 'recuerdo', v_texto,
     coalesce(p_fecha, (now() AT TIME ZONE 'America/Guayaquil')::date), v_foto)
  RETURNING id, evento_id INTO v_id, v_evento;

  v_marcados := public._marcar_modo_captura_evento(ARRAY[v_evento], 'tecleado');
  IF v_marcados <> 1 THEN
    RAISE EXCEPTION 'marca_incompleta: marcó % de 1', v_marcados;
  END IF;

  RETURN jsonb_build_object('ok', true, 'nota_id', v_id, 'evento_id', v_evento);
END;
$fn$;

REVOKE ALL ON FUNCTION public.registrar_recuerdo_familia(uuid, text, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_recuerdo_familia(uuid, text, date, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_recuerdo_familia(uuid, text, date, text) TO authenticated;

/* ═══ ④ LA PUERTA DEL ANTIPARASITARIO ═══════════════════════════════════════ */
CREATE OR REPLACE FUNCTION public.registrar_desparasitacion_familia(
  p_mascota_id     uuid,
  p_producto       text,
  p_tipo           text,
  p_fecha_aplicada date,
  p_fecha_proxima  date DEFAULT NULL,
  p_notas          text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_uid      uuid := auth.uid();
  v_prod     text;
  v_pais     text;
  v_id       uuid;
  v_evento   uuid;
  v_marcados int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;

  v_prod := nullif(btrim(coalesce(p_producto,'')), '');
  IF v_prod IS NULL THEN RAISE EXCEPTION 'producto_requerido' USING ERRCODE='22023'; END IF;

  IF p_fecha_aplicada IS NULL THEN
    RAISE EXCEPTION 'fecha_requerida' USING ERRCODE='22023';
  END IF;
  IF p_fecha_aplicada > (now() AT TIME ZONE 'America/Guayaquil')::date THEN
    RAISE EXCEPTION 'fecha_futura' USING ERRCODE='22023';
  END IF;

  /* Espejo literal del CHECK `evento_desparasitacion_aplicada_tipo_...`: se
     valida acá para que el rebote tenga NOMBRE en vez de llegar como un
     23514 crudo que la pantalla no sabe traducir. */
  IF p_tipo IS NULL OR p_tipo NOT IN ('interna','externa','mixta') THEN
    RAISE EXCEPTION 'tipo_invalido' USING ERRCODE='22023';
  END IF;

  /* La ventana la sigue defendiendo el CHECK de la tabla
     (`fecha_proxima >= fecha_aplicada`): acá se le pone nombre, allá se hace
     imposible. Dos capas, y la de abajo no se puede saltear. */
  IF p_fecha_proxima IS NOT NULL AND p_fecha_proxima < p_fecha_aplicada THEN
    RAISE EXCEPTION 'proxima_antes_de_aplicada' USING ERRCODE='22023';
  END IF;

  SELECT coalesce(m.country_code, pr.country_code, 'EC') INTO v_pais
    FROM mascotas m LEFT JOIN profiles pr ON pr.id = v_uid
   WHERE m.id = p_mascota_id;
  IF v_pais IS NULL THEN
    RAISE EXCEPTION 'sin_acceso_mascota' USING ERRCODE='42501';
  END IF;

  /* `prestador_id` va NULL a propósito: por esta puerta entra la FAMILIA, y
     el trigger lee justo eso para estampar `declarado_por_familia`. */
  INSERT INTO evento_desparasitacion_aplicada
    (mascota_id, country_code, producto, tipo_desparasitacion,
     fecha_aplicada, fecha_proxima, notas)
  VALUES
    (p_mascota_id, v_pais, v_prod, p_tipo,
     p_fecha_aplicada, p_fecha_proxima, nullif(btrim(coalesce(p_notas,'')), ''))
  RETURNING id, evento_id INTO v_id, v_evento;

  v_marcados := public._marcar_modo_captura_evento(ARRAY[v_evento], 'tecleado');
  IF v_marcados <> 1 THEN
    RAISE EXCEPTION 'marca_incompleta: marcó % de 1', v_marcados;
  END IF;

  RETURN jsonb_build_object('ok', true, 'desparasitacion_id', v_id, 'evento_id', v_evento);
END;
$fn$;

REVOKE ALL ON FUNCTION public.registrar_desparasitacion_familia(uuid, text, text, date, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_desparasitacion_familia(uuid, text, text, date, date, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_desparasitacion_familia(uuid, text, text, date, date, text) TO authenticated;

/* ═══════════════════════════════════════════════════════════════════════════
   EL CINTURÓN — ROJO ANTES QUE VERDE, EN LAS DOS PUERTAS
   Subtransacción que se deshace sola (L-406): estas dos funciones escriben
   expediente de una mascota REAL.
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  k_masc    uuid := '73c381cc-9f7c-4b82-91f6-a415c8b1676f';  -- mascota con titular
  k_titular uuid := '632727a3-9682-4fa7-b569-19a6399736ff';
  k_ajeno   uuid := '4f572081-26a5-4d3b-9d80-25ea751fdc9c';  -- otro usuario real
  v_r       jsonb;
  v_modo    text;
  v_proc    text;
  v_n       int;
  v_msg     text;
BEGIN
  BEGIN

  /* ⓪ CONTROL POSITIVO de los datos del arnés */
  IF NOT EXISTS (SELECT 1 FROM mascotas WHERE id=k_masc AND user_id=k_titular) THEN
    RAISE EXCEPTION 'ARNES: mascota/titular del fixture ya no existe — re-medir';
  END IF;
  IF k_ajeno = k_titular THEN RAISE EXCEPTION 'ARNES: el ajeno es el titular'; END IF;

  /* ① L-140: ninguna de las dos nace alcanzable por anon */
  IF has_function_privilege('anon','public.registrar_recuerdo_familia(uuid,text,date,text)','EXECUTE')
     OR has_function_privilege('anon','public.registrar_desparasitacion_familia(uuid,text,text,date,date,text)','EXECUTE') THEN
    RAISE EXCEPTION 'L-140: anon alcanza una de las puertas nuevas';
  END IF;
  -- control positivo del instrumento
  IF NOT has_function_privilege('authenticated','public.registrar_recuerdo_familia(uuid,text,date,text)','EXECUTE') THEN
    RAISE EXCEPTION 'ARNES: authenticated no alcanza el recuerdo — el gate mide mal';
  END IF;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_titular::text, 'role','authenticated')::text, true);

  /* ═══ PUERTA 1 · EL RECUERDO ══════════════════════════════════════════════ */

  /* 🔴 CONTROL DE LA CURA DE ②bis: el eje que el trigger usa AHORA existe.
     Sin esta comprobación, el verde de abajo no diría si la puerta se
     destapó o si nunca estuvo tapiada. */
  IF NOT EXISTS (SELECT 1 FROM cat_ejes_jtbd WHERE codigo='identidad') THEN
    RAISE EXCEPTION 'ARNES: el eje identidad no existe — el catálogo cambió';
  END IF;
  IF EXISTS (SELECT 1 FROM cat_ejes_jtbd WHERE codigo='cuidado_diario') THEN
    RAISE EXCEPTION 'ARNES: cuidado_diario EXISTE — el diagnóstico de la puerta tapiada era falso';
  END IF;

  /* ✅ VERDE */
  v_r := public.registrar_recuerdo_familia(k_masc, 'ARNES S113 recuerdo', NULL,
                                           k_titular::text || '/foto-arnes.jpg');
  SELECT modo_captura, procedencia INTO v_modo, v_proc
    FROM eventos_mascota WHERE id = (v_r->>'evento_id')::uuid;
  IF v_modo IS DISTINCT FROM 'tecleado' THEN
    RAISE EXCEPTION 'ARNES recuerdo: modo_captura quedó %, esperaba tecleado', v_modo;
  END IF;
  /* 🔴 Y ACÁ SE VERIFICA LA DECISIÓN DECLARADA ARRIBA, no se asume:
     `nota_dueno` es es_clinico=false ⇒ procedencia NULL por diseño del motor. */
  IF v_proc IS NOT NULL THEN
    RAISE EXCEPTION 'ARNES recuerdo: procedencia quedó % — el motor cambió de regla', v_proc;
  END IF;
  SELECT count(*) INTO v_n FROM evento_nota_dueno
   WHERE id=(v_r->>'nota_id')::uuid AND categoria='recuerdo' AND foto_url IS NOT NULL;
  IF v_n <> 1 THEN RAISE EXCEPTION 'ARNES recuerdo: la fila no quedó como recuerdo con foto'; END IF;

  /* 🔴 ROJO ①: una URL no es un path */
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, 'x', NULL, 'https://ejemplo/x.jpg');
    RAISE EXCEPTION 'ARNES: aceptó una URL como foto';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  /* 🔴 ROJO ②: la carpeta de OTRO */
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, 'x', NULL, k_ajeno::text || '/x.jpg');
    RAISE EXCEPTION 'ARNES: aceptó la carpeta de otro';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  /* 🔴 ROJO ③: texto vacío */
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, '   ', NULL, NULL);
    RAISE EXCEPTION 'ARNES: aceptó un recuerdo vacío';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  /* ═══ PUERTA 2 · EL ANTIPARASITARIO ══════════════════════════════════════ */

  /* ✅ VERDE — con procedencia, que acá SÍ se escribe (es_clinico=true) */
  v_r := public.registrar_desparasitacion_familia(
           k_masc, 'ARNES S113 producto', 'interna', public.hoy_local(), public.hoy_local() + 30, 'nota');
  SELECT modo_captura, procedencia INTO v_modo, v_proc
    FROM eventos_mascota WHERE id = (v_r->>'evento_id')::uuid;
  IF v_modo IS DISTINCT FROM 'tecleado' THEN
    RAISE EXCEPTION 'ARNES desp: modo_captura quedó %, esperaba tecleado', v_modo;
  END IF;
  IF v_proc IS DISTINCT FROM 'declarado_por_familia' THEN
    RAISE EXCEPTION 'ARNES desp: procedencia quedó %, esperaba declarado_por_familia', v_proc;
  END IF;

  /* 🔴 ROJO ④: próxima ANTES de aplicada — y se prueba que la defensa de
     abajo (el CHECK de la tabla) también está viva, no sólo el IF de arriba. */
  BEGIN
    PERFORM public.registrar_desparasitacion_familia(
      k_masc, 'x', 'interna', public.hoy_local(), public.hoy_local() - 1, NULL);
    RAISE EXCEPTION 'ARNES: aceptó fecha_proxima anterior a fecha_aplicada';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;
  BEGIN
    INSERT INTO evento_desparasitacion_aplicada
      (mascota_id, country_code, producto, tipo_desparasitacion, fecha_aplicada, fecha_proxima)
    VALUES (k_masc, 'EC', 'x', 'interna', public.hoy_local(), public.hoy_local() - 1);
    RAISE EXCEPTION 'ARNES: el CHECK de la tabla NO frena la ventana invertida';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  /* 🔴 ROJO ⑤: tipo fuera del catálogo */
  BEGIN
    PERFORM public.registrar_desparasitacion_familia(k_masc, 'x', 'nasal', public.hoy_local(), NULL, NULL);
    RAISE EXCEPTION 'ARNES: aceptó un tipo fuera del catálogo';
  EXCEPTION WHEN sqlstate '22023' THEN NULL;
  END;

  /* ═══ 🔴 EL DISCRIMINADOR — OTRO USUARIO, MISMA MASCOTA, REBOTA ═══════════
     Sin este brazo, todo lo de arriba probaría igual con la RLS apagada. */
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', k_ajeno::text, 'role','authenticated')::text, true);
  BEGIN
    PERFORM public.registrar_recuerdo_familia(k_masc, 'intruso', NULL, NULL);
    RAISE EXCEPTION 'ARNES: un tercero escribió un recuerdo en mascota ajena';
  EXCEPTION WHEN sqlstate '42501' OR sqlstate '22023' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg LIKE 'recuerdo_vacio%' OR v_msg LIKE 'foto_invalida%' THEN
      RAISE EXCEPTION 'ARNES: rebotó por validación de forma, NO por acceso: %', v_msg;
    END IF;
  END;
  BEGIN
    PERFORM public.registrar_desparasitacion_familia(k_masc, 'intruso', 'interna', public.hoy_local(), NULL, NULL);
    RAISE EXCEPTION 'ARNES: un tercero escribió un antiparasitario en mascota ajena';
  EXCEPTION WHEN sqlstate '42501' OR sqlstate '42501' THEN NULL;
  END;

  SET LOCAL ROLE postgres;
  RAISE EXCEPTION 'ROLLBACK_ARNES_OK';

  EXCEPTION WHEN OTHERS THEN
    SET LOCAL ROLE postgres;
    IF SQLERRM = 'ROLLBACK_ARNES_OK' THEN
      RAISE NOTICE '✅ CINTURÓN S113-A bloques 3+4 VERDE — arnés deshecho, residuo 0';
    ELSE
      RAISE;
    END IF;
  END;
END;
$cinturon$;
