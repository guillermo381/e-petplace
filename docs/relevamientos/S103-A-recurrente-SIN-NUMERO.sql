-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL COBRO RECURRENTE — **SIN NÚMERO, SIN APLICAR**
--
-- Contrato de tanda 1 del founder (22-ago-2026), punto 3, verbatim:
--   «estado de la serie con tres valores (activa · pausada · cancelada)
--    reemplaza el booleano · contador de reintentos, fecha y causa del fallo ·
--    columna del medio de pago autorizado (token) · aviso_dias fijo en 2 como
--    cinturón, no editable · idempotencia por período con UNIQUE.»
--
-- Letra que obedece: `LETRA_COBRO_RECURRENTE` v1.2 (§2 la autorización · §3 el
-- aviso · §6 los tres días y la pausa) sobre `LETRA_MOTOR_PAGOS_S101`.
--
-- 🔴 **LO QUE ESTA MIGRACIÓN NO HACE, a propósito:** no toca
-- `ejecutar_recurrencias_vencidas` (sigue siendo el stub declarado) ni saca al
-- aviso de sombra. **Es el orden que el founder firmó: primero el cobro,
-- `en_sombra` al final.** *Encender el aviso hoy mandaría el anuncio de un cobro
-- que no va a ocurrir.*
--
-- 📌 **DECLARACIÓN 76(g) — LA VEDA: NO RIGE.** Hay backfill, pero
-- `pedidos_recurrencias` tiene **0 filas** (medido 22-ago 15:00 UTC, control:
-- `pedidos` = 66 por el mismo instrumento). **Un backfill sobre cero filas no
-- tiene ventana que proteger.** El guard lo verifica igual y aborta si alguien
-- creó una serie entre esta lectura y el apply — *que es exactamente lo que
-- `L-329` manda: el snapshot se vuelve a tomar, no se edita.*
-- ═══════════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ① LA REVERSA — ESCRITA ANTES DE APLICAR NADA                              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- 🔴 **QUÉ NO DESHACE, y hay que leerlo antes de revertir:**
--
--   · **`estado` se pierde con su información.** Revertir colapsa tres valores
--     en un booleano: **`pausada` y `cancelada` se vuelven indistinguibles**
--     —las dos caen en `activo = false`— y esa distinción es justamente la que
--     §6 de la letra necesita. *Si ya hubo pausas por fallo, la reversa las
--     convierte en cancelaciones del cliente y nadie va a poder saber cuáles.*
--   · **`ultimo_fallo_causa` y `reintentos` no son recuperables**: nadie más
--     los tiene.
--   · **`tarjeta_id` tampoco** — y es dato de CONSENTIMIENTO (§2: la
--     autorización nombra un medio). Perderlo es perder de qué autorizó el
--     cliente.
--
-- ⇒ **Revertir esto después de que corra el primer cobro NO es una operación
--    técnica: es tirar el registro de una autorización.** Si hay que revertir,
--    se exporta antes.
--
/*  ── REVERSA (no ejecutar salvo que haya que revertir) ──────────────────────
BEGIN;

-- El orden importa: primero las funciones que usan las columnas, después las
-- columnas. Al revés, el DROP falla por dependencia y deja media reversa.

DROP TABLE IF EXISTS public.recurrencia_desglose;
DROP INDEX IF EXISTS public.uq_recurrencia_periodo_aprobado;

ALTER TABLE public.pagos_intentos
  DROP CONSTRAINT IF EXISTS chk_recurrencia_viaja_con_su_periodo,
  DROP COLUMN IF EXISTS recurrencia_periodo,
  DROP COLUMN IF EXISTS recurrencia_id;

ALTER TABLE public.pagos_intentos
  DROP CONSTRAINT IF EXISTS chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_intento_un_solo_sujeto
  CHECK (((pedido_id IS NOT NULL))::integer + ((cita_id IS NOT NULL))::integer = 1);

-- `activo` vuelve a ser columna real y escribible ANTES de tirar `estado`,
-- porque su valor se deriva de él.
ALTER TABLE public.pedidos_recurrencias DROP COLUMN IF EXISTS activo;
ALTER TABLE public.pedidos_recurrencias ADD COLUMN activo boolean NOT NULL DEFAULT true;
UPDATE public.pedidos_recurrencias SET activo = (estado = 'activa');

ALTER TABLE public.pedidos_recurrencias
  DROP CONSTRAINT IF EXISTS chk_recurrencia_aviso_48h,
  DROP CONSTRAINT IF EXISTS chk_recurrencia_fallo_coherente,
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS reintentos,
  DROP COLUMN IF EXISTS ultimo_fallo_en,
  DROP COLUMN IF EXISTS ultimo_fallo_causa,
  DROP COLUMN IF EXISTS tarjeta_id,
  DROP COLUMN IF EXISTS monto_esperado,
  DROP COLUMN IF EXISTS autorizada_en;

-- Las dos funciones vuelven a su forma anterior. Sus cuerpos viejos están en
-- las migraciones que las crearon; acá se restauran las FIRMAS.
DROP FUNCTION IF EXISTS public.alternar_recurrencia(uuid, boolean);
DROP FUNCTION IF EXISTS public.configurar_recurrencia(uuid, jsonb, jsonb, integer, integer, text, uuid, numeric);
-- ⚠️ Y hay que RE-CREARLAS con su cuerpo original, o el alta y el apagado
--    quedan sin puerta. Esta reversa NO las reconstruye: exige recuperar el
--    cuerpo de su migración de origen. *Se dice acá porque una reversa que
--    borra sin restaurar es peor que no revertir.*

COMMIT;
    ── FIN REVERSA ──────────────────────────────────────────────────────── */


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ② LA MIGRACIÓN                                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

BEGIN;

-- ── GUARD DE ESTADO ────────────────────────────────────────────────────────
DO $guard$
DECLARE v_n int; v_col int;
  -- Medido 22-ago-2026 15:00 UTC. Control positivo declarado: el mismo
  -- instrumento devuelve 66 sobre `pedidos`, así que el 0 es ausencia y no
  -- una consulta rota.
  c_series_esperadas CONSTANT int := 0;
BEGIN
  SELECT count(*) INTO v_n FROM public.pedidos_recurrencias;
  IF v_n <> c_series_esperadas THEN
    RAISE EXCEPTION 'ABORTA: hay % series y se esperaban %. Alguien creó una entre la medición y el apply: RE-MEDIR bajo veda y escribir el snapshot nuevo, jamás editar éste (L-329).', v_n, c_series_esperadas;
  END IF;

  SELECT count(*) INTO v_col FROM information_schema.columns
   WHERE table_schema='public' AND table_name='pedidos_recurrencias' AND column_name='estado';
  IF v_col > 0 THEN
    RAISE EXCEPTION 'ABORTA: `estado` ya existe. Alguien aplicó esto antes: releer antes de tocar.';
  END IF;
END $guard$;


-- ── ①  EL ESTADO DE TRES VALORES ───────────────────────────────────────────
--
-- 🔴 EL PORQUÉ, que es de producto y no de modelado: con un booleano **no se
--    puede distinguir «el cliente la apagó» de «la casa la pausó porque el
--    cobro falló»**. Son dos cosas distintas para el cliente, con dos pantallas
--    distintas y dos salidas distintas — §6 de la letra las separa
--    explícitamente («**pausa ≠ cancelación**») y hoy la letra **no tiene dónde
--    escribirse**.
ALTER TABLE public.pedidos_recurrencias
  ADD COLUMN estado text NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa','pausada','cancelada'));

COMMENT ON COLUMN public.pedidos_recurrencias.estado IS
  'activa = corre · pausada = LA CASA la paró tras 3 días de fallo (§6), el '
  'cliente la reanuda actualizando su medio · cancelada = EL CLIENTE la cortó. '
  'Pausa y cancelación NO son lo mismo y por eso no comparten valor.';

-- El backfill honra el único significado que el booleano podía tener: hoy la
-- única vía a `activo=false` es que el cliente apague (`alternar_recurrencia`).
-- **No existe todavía ninguna pausa por fallo**, así que traducir a 'cancelada'
-- no pierde información — la inventaría al revés.
UPDATE public.pedidos_recurrencias
   SET estado = CASE WHEN activo THEN 'activa' ELSE 'cancelada' END;

-- ── `activo` PASA A SER DERIVADO, y esto es lo que vuelve el desvío imposible
--
-- Se conserva porque **tres funciones lo leen** (`avisar_recurrencias_proximas`,
-- `ejecutar_recurrencias_vencidas`, y la policy no lo usa pero el futuro sí):
-- borrarlo obligaría a reescribirlas en esta misma migración, y una de ellas
-- —`ejecutar…`— **se reescribe en la tanda siguiente por otra razón**. *Cambiar
-- dos veces la misma función en dos migraciones distintas es cómo se pierde un
-- cuerpo.*
--
-- 🔴 Y se conserva **GENERADO, no copiado**: así «`activo` dice una cosa y
--    `estado` otra» **es inexpresable**, en vez de ser un invariante que
--    alguien tiene que recordar mantener.
ALTER TABLE public.pedidos_recurrencias DROP COLUMN activo;
ALTER TABLE public.pedidos_recurrencias
  ADD COLUMN activo boolean
    GENERATED ALWAYS AS (estado = 'activa') STORED;

COMMENT ON COLUMN public.pedidos_recurrencias.activo IS
  'DERIVADO de estado. No se escribe: se deriva. Existe para que los lectores '
  'que ya preguntaban `WHERE activo` sigan andando sin cambiar una línea.';


-- ── ②  EL FALLO: CUÁNTAS VECES, CUÁNDO Y POR QUÉ ───────────────────────────
--
-- §6 firma **tres días de reintento** y **aviso el día 0 con su causa**. Sin
-- estas tres columnas esa letra no tiene dónde vivir.
ALTER TABLE public.pedidos_recurrencias
  ADD COLUMN reintentos          int NOT NULL DEFAULT 0 CHECK (reintentos >= 0 AND reintentos <= 3),
  ADD COLUMN ultimo_fallo_en     timestamptz,
  ADD COLUMN ultimo_fallo_causa  text;

-- Coherencia: no puede haber reintentos sin un fallo que los explique, ni una
-- causa sin su fecha. *Un contador suelto no dice nada; un contador con fecha y
-- causa es un diagnóstico.*
ALTER TABLE public.pedidos_recurrencias
  ADD CONSTRAINT chk_recurrencia_fallo_coherente
  CHECK (
    (reintentos = 0 AND ultimo_fallo_en IS NULL AND ultimo_fallo_causa IS NULL)
    OR
    (reintentos > 0 AND ultimo_fallo_en IS NOT NULL)
  );

COMMENT ON COLUMN public.pedidos_recurrencias.ultimo_fallo_causa IS
  '🔴 La CAUSA con su nombre, no el código del proveedor. Mientras «no aprobado '
  'con causa conocida» y «no aprobado sin causa» compartan etiqueta (ficha de '
  'S102), acá va la voz genérica declarada — se construye el cajón, no se '
  'adivina la etiqueta.';


-- ── ③  EL MEDIO DE PAGO AUTORIZADO, Y EL MONTO ESPERADO ────────────────────
--
-- §2: *«La autorización nombra un medio de pago concreto (el token guardado).
-- Si ese medio muere, la serie no salta a otro por su cuenta: jamás se cobra a
-- una tarjeta que el cliente no eligió para esto.»*
--
-- 🔴 **Sin esta columna, esa frase es INEXPRESABLE** — no hay «otro» del cual
--    no saltar, porque no hay «éste».
ALTER TABLE public.pedidos_recurrencias
  ADD COLUMN tarjeta_id     uuid REFERENCES public.tarjetas_guardadas(id) ON DELETE SET NULL,
  ADD COLUMN monto_esperado numeric(12,2) CHECK (monto_esperado IS NULL OR monto_esperado > 0),
  ADD COLUMN autorizada_en  timestamptz NOT NULL DEFAULT now();

-- `ON DELETE SET NULL` y no CASCADE, a propósito: **si el cliente borra la
-- tarjeta, la serie NO se borra — se queda sin medio y hay que avisarle** (§6,
-- «medio de pago muerto»). *Borrarle la serie por borrar una tarjeta sería
-- tomar por él una decisión que no tomó.*

COMMENT ON COLUMN public.pedidos_recurrencias.tarjeta_id IS
  'El medio que el cliente autorizó PARA ESTA SERIE. Nullable HOY porque la '
  'puerta todavía no lo escribe; se endurece a NOT NULL (o a CHECK contra '
  'estado=activa) en la tanda del cobro, cuando exista el productor. '
  'DECLARADO: hoy una serie activa puede no tener medio, y eso es un hueco '
  'conocido, no un permiso.';

-- 🔴 POR QUÉ NULLABLE Y NO `NOT NULL` HOY, declarado en vez de decidido a
--    escondidas: `configurar_recurrencia` es la única puerta y **todavía no
--    manda tarjeta**; ponerlo NOT NULL acá dejaría el alta rota entre esta
--    migración y la del cobro. **El endurecimiento va CON su productor** — es
--    la misma ley que el `REVOKE` con el reemplazo listo (`L-326`).


-- ── ④  EL AVISO DE 48 h, HECHO CINTURÓN ────────────────────────────────────
--
-- Firma ① del founder: **48 horas.** Hoy `aviso_dias` es `DEFAULT 2` y
-- **editable por argumento** — o sea que la firma se cumple *por coincidencia*.
-- *Un default es una sugerencia; un CHECK es la ley.*
ALTER TABLE public.pedidos_recurrencias
  ADD CONSTRAINT chk_recurrencia_aviso_48h CHECK (aviso_dias = 2);

COMMENT ON COLUMN public.pedidos_recurrencias.aviso_dias IS
  'FIJO EN 2 POR CINTURÓN (firma ① del founder: 48 h). No es configurable. '
  'El día que la mesa quiera otra ventana, se cambia el CHECK con su firma — '
  'no se le pasa otro número a la puerta.';


-- ── ⑤  IDEMPOTENCIA POR PERÍODO ────────────────────────────────────────────
--
-- §4.7: *«un período de una serie no puede tener dos cobros exitosos. El
-- candado es de base, no de código.»*
--
-- 🔴 **Y el caso que lo hace obligatorio no es exótico: un cron que corre dos
--    veces.** Sin este UNIQUE, dos ticks del mismo día cobran dos veces y el
--    cliente lo descubre en su resumen.
ALTER TABLE public.pagos_intentos
  ADD COLUMN recurrencia_id       uuid REFERENCES public.pedidos_recurrencias(id),
  ADD COLUMN recurrencia_periodo  date;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_recurrencia_viaja_con_su_periodo
  CHECK ((recurrencia_id IS NULL) = (recurrencia_periodo IS NULL));

-- El invariante «exactamente uno» SE EXTIENDE, no se reemplaza: la serie es el
-- TERCER sujeto cobrable, al lado del pedido y la cita.
ALTER TABLE public.pagos_intentos DROP CONSTRAINT chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_intento_un_solo_sujeto
  CHECK (
    ((pedido_id IS NOT NULL))::integer
  + ((cita_id IS NOT NULL))::integer
  + ((recurrencia_id IS NOT NULL))::integer = 1
  );

-- 🔴 EL CANDADO, y su forma importa: **PARCIAL sobre `aprobado`.**
--    Un UNIQUE total prohibiría *reintentar* — y §6 firma tres reintentos.
--    *Lo que no puede haber dos veces es un cobro EXITOSO, no un intento.*
CREATE UNIQUE INDEX uq_recurrencia_periodo_aprobado
  ON public.pagos_intentos (recurrencia_id, recurrencia_periodo)
  WHERE recurrencia_id IS NOT NULL AND estado = 'aprobado';


-- ── ⑤bis  EL DESGLOSE CONGELADO DEL PERÍODO ───────────────────────────────
--
-- 🔴 **ESTA TABLA FALTABA, y el hueco lo destapó ESCRIBIR EL CUERPO DEL COBRO,
--    no releer la migración.** *La precondición que la mesa puso —«no se aplica
--    hasta que el cuerpo esté escrito»— se pagó sola acá: aplicada como estaba,
--    el esquema declaraba un sujeto cobrable **sin dónde congelar su monto**, y
--    la compuerta 2 del motor (`sin desglose no hay cobro`) habría rebotado
--    TODO cobro recurrente — con el esquema ya aplicado y el defecto a una
--    migración de distancia.*
--
-- **Por qué el período ES sujeto propio y no se cobra un pedido:**
--   · **§6 lo exige:** *«el período impago no se presta… para la despensa, esa
--     entrega no sale»* ⇒ **primero se cobra, después sale la entrega.** Un
--     pedido creado para poder cobrarlo sería una entrega comprometida antes
--     de que entre la plata.
--   · **El plan de paseos no produce pedido alguno** y es el sujeto ① de esta
--     letra. Sin período-como-sujeto, `cerrar_y_renovar_planes` no tendría qué
--     cobrar.
--   · **§5 lo obliga a nacer por cobro:** el monto es **el precio vigente al
--     momento del cobro**, no el del día en que el cliente se suscribió.
--     *Un desglose que se congela una vez y se reusa cobraría para siempre el
--     precio de la suscripción.*
--
-- La forma es la de sus dos hermanos (`compra_desglose`, `cita_desglose`), y su
-- clave lleva el PERÍODO adentro: **un desglose por cobro, no por serie.**
CREATE TABLE public.recurrencia_desglose (
  recurrencia_id  uuid NOT NULL REFERENCES public.pedidos_recurrencias(id) ON DELETE CASCADE,
  periodo         date NOT NULL,
  subtotal        numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  impuesto        numeric(12,2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
  envio           numeric(12,2) NOT NULL DEFAULT 0 CHECK (envio >= 0),
  total           numeric(12,2) NOT NULL CHECK (total > 0),
  moneda          text NOT NULL DEFAULT 'USD',
  congelado_en    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (recurrencia_id, periodo)
);

COMMENT ON TABLE public.recurrencia_desglose IS
  'El desglose congelado de UN cobro de una serie. La PK lleva el período '
  'adentro a propósito: §5 firma precio VIGENTE al momento del cobro, así que '
  'cada período congela el suyo. Un desglose por serie cobraria para siempre el '
  'precio del dia en que el cliente se suscribio.';

-- CASCADE y no SET NULL, al revés que `tarjeta_id`: **el desglose no tiene vida
-- propia sin su serie** — es su fotografía, no un dato del cliente. *Conservar
-- desgloses de una serie borrada sería guardar el monto de algo que ya nadie
-- puede explicar.*

ALTER TABLE public.recurrencia_desglose ENABLE ROW LEVEL SECURITY;

CREATE POLICY recurrencia_desglose_select ON public.recurrencia_desglose
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pedidos_recurrencias r
                  WHERE r.id = recurrencia_desglose.recurrencia_id
                    AND (r.user_id = auth.uid() OR is_admin())));

-- 🔴 Sin policy de escritura, y es deliberado: **lo congela el motor
--    (`SECURITY DEFINER`), jamás el cliente.** *Un desglose que el pagador
--    puede escribir es la compuerta 2 verificando el monto contra un número que
--    el pagador eligió.*

-- ── ⑥  LAS DOS PUERTAS QUE CAMBIAN DE FORMA ────────────────────────────────
--
-- `alternar_recurrencia` **conserva su firma** `(uuid, boolean)` para que el
-- wrapper y la pantalla de C no cambien una línea — pero ahora escribe `estado`
-- y **jamás puede escribir `pausada`**: pausar es acto de la casa, no del
-- cliente.
CREATE OR REPLACE FUNCTION public.alternar_recurrencia(p_recurrencia_id uuid, p_activo boolean)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_estado text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE='42501'; END IF;

  /* El cliente solo puede mover entre 'activa' y 'cancelada'. **'pausada' no
     está en su vocabulario**: la pone la casa tras tres días de fallo y se sale
     de ella actualizando el medio, no apretando un interruptor. */
  v_estado := CASE WHEN p_activo THEN 'activa' ELSE 'cancelada' END;

  UPDATE public.pedidos_recurrencias
     SET estado = v_estado, updated_at = now(),
         /* Reactivar limpia el rastro de fallo: si vuelve a fallar, el conteo
            arranca de cero. *Arrastrar reintentos viejos pausaría la serie
            nueva antes de tiempo.* */
         reintentos = CASE WHEN p_activo THEN 0 ELSE reintentos END,
         ultimo_fallo_en    = CASE WHEN p_activo THEN NULL ELSE ultimo_fallo_en END,
         ultimo_fallo_causa = CASE WHEN p_activo THEN NULL ELSE ultimo_fallo_causa END
   WHERE id = p_recurrencia_id
     AND (user_id = v_uid OR is_admin());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'recurrencia_no_encontrada' USING ERRCODE='42501';
  END IF;

  RETURN jsonb_build_object('ok', true, 'activo', p_activo, 'estado', v_estado);
END $function$;

-- `configurar_recurrencia` **pierde `p_aviso_dias`** (ya no es configurable) y
-- **gana `p_tarjeta_id` OPCIONAL**.
--
-- 🔴 El parámetro nuevo va OPCIONAL a propósito: **la pantalla de C llama a
--    esta puerta hoy** y no manda tarjeta. Un parámetro obligatorio le rompería
--    el alta sin avisarle. *Se ensancha; no se cambia el contrato bajo los pies
--    de quien lo consume* — y cuando C empiece a mandarla, no hay que migrar
--    nada.
DROP FUNCTION IF EXISTS public.configurar_recurrencia(uuid, jsonb, jsonb, integer, integer, integer, text);

CREATE FUNCTION public.configurar_recurrencia(
  p_cuenta_comercial_id uuid,
  p_items jsonb,
  p_entrega jsonb,
  p_frecuencia_dias integer DEFAULT NULL,
  p_dia_del_mes integer DEFAULT NULL,
  p_metodo_entrega text DEFAULT 'despacho',
  p_tarjeta_id uuid DEFAULT NULL,
  /* 🔴 EL MONTO ESPERADO — §2: la autorización nombra **qué monto**.
     Opcional por la misma razón que la tarjeta: **la pantalla de C llama a esta
     puerta hoy** y no lo manda. *Se ensancha; no se cambia el contrato bajo los
     pies de quien lo consume.*
     ⚠️ **Y su ausencia NO es neutral, está declarada:** sin monto esperado, el
     freno de §2 («no se cobra más de lo autorizado») **no puede disparar** —
     `recurrencias_vencidas_pendientes` sólo compara cuando el valor existe.
     *Una serie sin monto esperado se cobra a lo que salga, y eso es
     exactamente lo que una autorización recurrente NO autoriza.* Es un hueco
     conocido, no un permiso. */
  p_monto_esperado numeric DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_prox date; v_it jsonb; v_masc uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE = '42501'; END IF;
  IF (p_frecuencia_dias IS NULL) = (p_dia_del_mes IS NULL) THEN
    RAISE EXCEPTION 'cadencia_invalida: frecuencia O día del mes, exactamente uno'
      USING ERRCODE = '22023';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'recurrencia_sin_items' USING ERRCODE = '22023';
  END IF;

  -- La tarjeta, si viene, tiene que ser DEL QUE AUTORIZA y estar guardada.
  -- *Una serie que apunta a la tarjeta de otro es la falla que §2 nombra.*
  IF p_tarjeta_id IS NOT NULL THEN
    PERFORM 1 FROM public.tarjetas_guardadas
      WHERE id = p_tarjeta_id AND user_id = v_uid AND estado = 'guardada';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'tarjeta_no_disponible' USING ERRCODE = '42501';
    END IF;
  END IF;

  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_masc := NULLIF(v_it->>'mascota_id','')::uuid;
    IF v_masc IS NOT NULL AND NOT _user_es_familia_de_mascota(v_masc, v_uid) AND NOT is_admin() THEN
      RAISE EXCEPTION 'mascota_sin_acceso' USING ERRCODE = '42501';
    END IF;
  END LOOP;

  v_prox := CASE
    WHEN p_frecuencia_dias IS NOT NULL THEN current_date + p_frecuencia_dias
    WHEN extract(day FROM current_date)::int < p_dia_del_mes
      THEN date_trunc('month', current_date)::date + (p_dia_del_mes - 1)
    ELSE (date_trunc('month', current_date) + interval '1 month')::date + (p_dia_del_mes - 1)
  END;

  INSERT INTO public.pedidos_recurrencias (user_id, cuenta_comercial_id, frecuencia_dias,
                                    dia_del_mes, items, entrega, metodo_entrega,
                                    proximo_pedido_fecha, tarjeta_id,
                                    monto_esperado, autorizada_en)
    VALUES (v_uid, p_cuenta_comercial_id, p_frecuencia_dias, p_dia_del_mes,
            p_items, p_entrega, p_metodo_entrega, v_prox, p_tarjeta_id,
            p_monto_esperado,
            /* 🔴 `autorizada_en` SE ESCRIBE ACÁ, aunque la columna tenga
               DEFAULT now(). *Un default se dispara igual si alguien inserta
               por otro camino; escribirlo en LA PUERTA dice que la marca de
               autorización nace en el acto del cliente, no en el reloj de la
               tabla.* La raíz de §2 es «quién, cuándo y sobre qué medio», y las
               tres tienen que salir del mismo lugar. */
            now())
    RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'recurrencia_id', v_id,
                            'proximo_pedido_fecha', v_prox,
                            'tarjeta_id', p_tarjeta_id,
                            'monto_esperado', p_monto_esperado,
                            'nota', 'El cobro corre cuando ejecutar_recurrencias_vencidas deje de ser stub (tanda siguiente).');
END $function$;

REVOKE ALL ON FUNCTION public.configurar_recurrencia(uuid, jsonb, jsonb, integer, integer, text, uuid, numeric) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.configurar_recurrencia(uuid, jsonb, jsonb, integer, integer, text, uuid, numeric) TO authenticated;
REVOKE ALL ON FUNCTION public.alternar_recurrencia(uuid, boolean) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.alternar_recurrencia(uuid, boolean) TO authenticated;


-- ── CINTURÓN, CON DISCRIMINADOR POR BRAZO ──────────────────────────────────
--
-- 🔴 Cada brazo prueba que el estado malo es **INEXPRESABLE**, no que el bueno
--    pasa. *Un cinturón que solo verifica el camino feliz da verde con la
--    puerta abierta.*
DO $cinturon$
DECLARE v_ok boolean; v_sobrecargas int;
BEGIN
  -- (a) El vocabulario de `estado` está cerrado.
  BEGIN
    INSERT INTO public.pedidos_recurrencias
      (user_id, cuenta_comercial_id, frecuencia_dias, items, entrega, proximo_pedido_fecha, estado)
      SELECT gen_random_uuid(), gen_random_uuid(), 7, '[]'::jsonb, '{}'::jsonb, current_date, 'suspendida';
    RAISE EXCEPTION 'ABORTA: el CHECK de estado dejó entrar un valor inventado.';
  EXCEPTION WHEN check_violation OR foreign_key_violation THEN NULL;
  END;

  -- (b) `aviso_dias` distinto de 2 es inexpresable.
  BEGIN
    INSERT INTO public.pedidos_recurrencias
      (user_id, cuenta_comercial_id, frecuencia_dias, items, entrega, proximo_pedido_fecha, aviso_dias)
      SELECT gen_random_uuid(), gen_random_uuid(), 7, '[]'::jsonb, '{}'::jsonb, current_date, 3;
    RAISE EXCEPTION 'ABORTA: aviso_dias aceptó un valor distinto de 2 — la firma ① no es cinturón.';
  EXCEPTION WHEN check_violation OR foreign_key_violation THEN NULL;
  END;

  -- (c) `activo` es DERIVADO: escribirlo tiene que fallar.
  BEGIN
    EXECUTE 'UPDATE public.pedidos_recurrencias SET activo = false WHERE false';
    RAISE EXCEPTION 'ABORTA: `activo` sigue siendo escribible — no quedó generado.';
  EXCEPTION WHEN others THEN
    IF SQLSTATE NOT IN ('42601','0A000','42P10','428C9') THEN RAISE; END IF;
  END;

  -- (d) El tercer sujeto entró al invariante y NO aflojó el «exactamente uno».
  SELECT pg_get_constraintdef(oid) ~ 'recurrencia_id' INTO v_ok
    FROM pg_constraint
   WHERE conrelid='public.pagos_intentos'::regclass AND conname='chk_intento_un_solo_sujeto';
  IF NOT COALESCE(v_ok,false) THEN
    RAISE EXCEPTION 'ABORTA: el invariante no conoce a la recurrencia.';
  END IF;

  -- (e bis) El sujeto nuevo tiene DÓNDE congelar su monto. *Un sujeto cobrable
  --         sin desglose es un cobro que la compuerta 2 rebota siempre.*
  IF to_regclass('public.recurrencia_desglose') IS NULL THEN
    RAISE EXCEPTION 'ABORTA: la serie es sujeto cobrable y no tiene desglose congelado.';
  END IF;

  -- (e) NO quedaron dos versiones de la puerta (L-119: el DROP explícito).
  SELECT count(*) INTO v_sobrecargas FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='configurar_recurrencia';
  IF v_sobrecargas <> 1 THEN
    RAISE EXCEPTION 'ABORTA: hay % versiones de configurar_recurrencia. Dos puertas es peor que ninguna.', v_sobrecargas;
  END IF;

  RAISE NOTICE 'CINTURON VERDE — estado cerrado · aviso fijo en 2 · activo derivado · invariante con 3 sujetos · 1 sola puerta';
END $cinturon$;

COMMIT;
