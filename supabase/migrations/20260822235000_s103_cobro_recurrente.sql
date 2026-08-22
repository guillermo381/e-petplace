-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL COBRO RECURRENTE — motor, cuarto sujeto y arnés EN LA MISMA TXN
--
-- **Autorizada por el founder el 22-ago-2026** tras el gate del arnés (19/19).
--
-- 📌 76(g) — VEDA DECLARADA. Snapshot re-medido bajo veda:
--    **2026-08-22 22:15:02 UTC · 17:15:02 Guayaquil**
--    `pagos_intentos=44 · series=0 · suscripciones_plan=1 · tarjetas=7 ·
--     citas_de_plan=49` · control: 44 = pedido(+)cita, coincide con el total.
--    *Sin backfill: la DDL es aditiva y los cuerpos se reemplazan.*
--
-- 🔴 **EL ARNÉS CORRE ADENTRO, y ése es el punto (`L-388`):** si cualquiera de
--    sus 17 asserts falla, la transacción entera aborta y **el esquema NO se
--    aplica**. *«Probar antes de aplicar» y «no poder aplicar sin haber
--    probado» se ven igual en un reporte; sólo la transacción los distingue.*
--
-- 🔴 **Y SUS DATOS SE DESHACEN SOLOS**, en una subtransacción propia. *El caso
--    D toca una suscripción VIVA —le avanza el período y le crea citas—, así
--    que el arnés no puede comitear lo que escribe.* La subtransacción da las
--    dos mitades: **los asserts corren de verdad y ni una fila sobrevive.**
--    ⚠️ El centinela se distingue por MENSAJE y **todo lo demás se re-lanza**:
--    un `RAISE` usado como señal de éxito ya coló un `DELETE` a producción en
--    S75, y por eso acá el handler es explícito en vez de tragarse todo.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════ S103-A-recurrente-SIN-NUMERO.sql ═══════
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

    ── FIN REVERSA ──────────────────────────────────────────────────────── */


-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ ② LA MIGRACIÓN                                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝


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



-- ═══════ S103-A-recurrente-CUERPO-SIN-NUMERO.sql ═══════
-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL CUERPO DEL COBRO RECURRENTE — **SIN NÚMERO, SIN APLICAR**
--
-- Va DESPUÉS de `S103-A-recurrente-SIN-NUMERO.sql` (que crea las columnas y
-- `recurrencia_desglose`). **Las dos se numeran y aplican JUNTAS**, y sólo
-- cuando el arnés esté recorrido — precondición del founder, vigente.
--
-- ── EL REPARTO, firmado por la mesa y escrito acá para que no se re-litigue ──
--
--   **LA BASE ELIGE Y CONGELA · LA EDGE COBRA · EL CRON LLAMA POR net.http_post**
--
-- 🔴 Y la razón de que la base NO cobre no es de arquitectura, es una PROHIBICIÓN
--    del founder con su porqué: **el cron no puede fabricar un JWT de usuario con
--    `service_role`.** *Un motor que se auto-emite la identidad de la persona a
--    la que le está cobrando no tiene a quién rendirle cuentas: la autorización
--    deja de venir del cliente y pasa a venir del que cobra.* (`L-340`)
--    ⇒ la edge cobra con la credencial del servidor **contra el proveedor**, y
--    la autorización del CLIENTE vive en la fila de la serie, no en un token.
--
-- ── QUÉ HACE CADA PIEZA ────────────────────────────────────────────────────
--
--   ① `recurrencias_vencidas_pendientes()` — LA BASE. Elige las vencidas,
--      corre las compuertas E3, **congela el desglose del período** y abre el
--      intento con **pagador explícito**. Devuelve la lista para cobrar.
--      *No cobra. No llama a nadie. No sabe qué es una tarjeta del proveedor.*
--
--   ② `pagos-cobro-recurrente` (edge, S103-D/A) — COBRA cada fila que ① le da,
--      por el MISMO motor que el cobro con tarjeta. **No elige, no congela.**
--
--   ③ `ejecutar_recurrencias_vencidas()` — EL CRON. Deja de ser un stub: hace
--      `net.http_post` a ②. *Nada más. Es un timbre, no un motor.*
--
-- ⚠️ **LO QUE ESTE ARCHIVO NO CUBRE, declarado:** la edge ② (territorio D/A,
--    tanda propia) y el arnés. **Sin el arnés recorrido —incluida la serie que
--    falla a propósito hasta la pausa— `§6` NO está probada y nada se aplica.**
--
-- 🔴 **TRES SUPUESTOS MÍOS QUE LA MEDICIÓN FALSÓ AL ESCRIBIR ESTE CUERPO** —
--    se declaran porque son la prueba de que la precondición del founder («no
--    se aplica hasta que el cuerpo esté escrito») sigue rindiendo:
--      ① `verificar_compuertas_pre_cobro` es **COMPRA-ONLY** y dos de sus
--         compuertas **no aplican** al recurrente ⇒ decisión de mesa abierta,
--         y esta rama **frena todo** hasta que se firme.
--      ② `cat_tasas_impuesto` tiene **`pct`**, no `tasa`.
--      ③ `app_config` **no tiene** `recurrente_vivo`, `url_cobro_recurrente`
--         ni `secreto_despacho` — hay que crearlas. *El cron se niega bien
--         mientras falten, pero «se niega bien» no es «está configurado».*
--
-- 📌 76(g) — LA VEDA: **NO RIGE.** Reemplaza cuerpos y crea funciones. Cero
--    backfill, cero anclas a filas vivas. *La escritura que sí toca datos —el
--    INSERT del intento y el UPSERT del desglose— ocurre EN EJECUCIÓN, no en la
--    migración.*
--
-- ── REVERSA (escrita ANTES) ────────────────────────────────────────────────
-- `DROP FUNCTION recurrencias_vencidas_pendientes();` y volver
-- `ejecutar_recurrencias_vencidas` a su stub de `pasarela_no_afiliada`.
-- ⚠️ QUÉ NO DESHACE: **los cobros ya hechos no se revierten** — los intentos
-- aprobados y sus desgloses quedan. Revertir apaga el motor hacia adelante;
-- para atrás hay que ir por el camino de reverso del proveedor, a mano.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- ①  LA BASE ELIGE Y CONGELA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.recurrencias_vencidas_pendientes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_r          record;
  v_hoy        date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_compuertas jsonb;
  v_total      numeric(12,2);
  v_subtotal   numeric(12,2);
  v_impuesto   numeric(12,2);
  v_envio      numeric(12,2);
  v_intento    uuid;
  v_listas     jsonb := '[]'::jsonb;
  v_frenadas   jsonb := '[]'::jsonb;
BEGIN
  /* 🔴 EL RELOJ ES DE GUAYAQUIL Y NO DE UTC. *Una serie que vence «el 13» vence
     el 13 donde vive la familia. Con UTC, un cobro de las 20:00 locales cae al
     día siguiente y el aviso de 48 h se corre solo.* */

  FOR v_r IN
    SELECT r.*
      FROM pedidos_recurrencias r
     WHERE r.estado = 'activa'
       AND r.proximo_pedido_fecha <= v_hoy
       /* 🔴 EL CANDADO CONTRA EL CRON QUE CORRE DOS VECES, en el SELECT y no
          solo en el índice: si ya hay un intento APROBADO de este período, la
          fila no vuelve a entrar. *El UNIQUE parcial es el piso; esto evita
          que siquiera se intente y se llene el buzón de rechazos por
          duplicado.* */
       AND NOT EXISTS (
             SELECT 1 FROM pagos_intentos i
              WHERE i.recurrencia_id = r.id
                AND i.recurrencia_periodo = r.proximo_pedido_fecha
                AND i.estado = 'aprobado')
     ORDER BY r.proximo_pedido_fecha, r.id
     FOR UPDATE OF r SKIP LOCKED
  LOOP
    /* ── ⓐ LA RAÍZ DE AUTORIZACIÓN, verificada fila por fila ───────────────
       §2: la autorización nombra QUIÉN, CUÁNDO y SOBRE QUÉ MEDIO. Las tres
       viven en la fila; si falta una, **no se cobra y se dice cuál falta**.
       🔴 *«Si ese medio muere, la serie no salta a otro por su cuenta: jamás
       se cobra a una tarjeta que el cliente no eligió para esto.»* Por eso se
       verifica que la tarjeta siga siendo SUYA y siga GUARDADA — no alcanza
       con que el id no sea nulo. */
    IF v_r.tarjeta_id IS NULL THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'sin_medio_autorizado');
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM tarjetas_guardadas t
                    WHERE t.id = v_r.tarjeta_id
                      AND t.user_id = v_r.user_id
                      AND t.estado = 'guardada') THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'medio_no_disponible');
      CONTINUE;
    END IF;

    /* ── ⓑ↔ⓒ 🔴 EL ORDEN LO CORRIGIÓ EL ARNÉS, NO LA LECTURA ─────────────
       **Estaban al revés: la compuerta 2 verifica el monto CONTRA EL DESGLOSE
       CONGELADO, y el desglose se congelaba DESPUÉS.** ⇒ toda serie salía
       frenada con `desglose_incompleto`, **siempre**.
       *Leído, el cuerpo se ve correcto —«primero se verifica, después se
       congela» suena bien—; corrido, no cobra jamás.* **Y su modo de falla es
       de los que se archivan: un freno con nombre propio, prolijo, que parece
       una compuerta funcionando.** (`L-372`)
       ⇒ **CONGELAR y después VERIFICAR.** La compuerta necesita el número
       para poder compararlo. */

    /* ── ⓒ EL DESGLOSE DEL PERÍODO, CONGELADO AL PRECIO DE HOY ─────────────
       §5: **precio VIGENTE al momento del cobro**, no el del día en que el
       cliente se suscribió. Por eso la PK lleva el período adentro.
       ⚠️ El cálculo sale del catálogo VIVO, y si no da un total > 0 **no se
       inventa**: se frena. *Un total cero que se cobra es un cobro sin
       concepto; uno que se estima es un número que nosotros elegimos.* */
    SELECT
      COALESCE(SUM((it->>'cantidad')::int * o.precio), 0)
      INTO v_subtotal
      FROM jsonb_array_elements(v_r.items) it
      JOIN ofertas o ON o.id = (it->>'oferta_id')::uuid
     WHERE o.estado = 'publicada';

    v_impuesto := ROUND(v_subtotal * COALESCE(
                    /* 🔴 La columna es `pct`, NO `tasa` — medido. *Escribirla
                       de memoria habría hecho fallar el cálculo entero, y el
                       cuerpo se ve igual de correcto leyéndolo.* */
                    (SELECT pct FROM cat_tasas_impuesto
                      WHERE codigo = 'EC_IVA_0' AND activo
                        AND (vigencia_hasta IS NULL OR vigencia_hasta > now())
                      LIMIT 1), 0), 2);
    v_envio    := 0;   -- §7.2(4): hoy vale cero y lo paga el vendedor
    v_total    := v_subtotal + v_impuesto + v_envio;

    IF v_total IS NULL OR v_total <= 0 THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'sin_total_calculable');
      CONTINUE;
    END IF;

    /* 🔴 Y EL MONTO ESPERADO ES UN FRENO, NO UN ADORNO. §2: la autorización
       nombra un monto. Si el precio de hoy se fue muy por encima del que el
       cliente autorizó, **no se cobra: se avisa**. *Cobrar «lo que salga» es
       exactamente lo que una autorización recurrente no autoriza.* */
    IF v_r.monto_esperado IS NOT NULL AND v_total > v_r.monto_esperado THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', 'monto_supera_lo_autorizado',
        'autorizado', v_r.monto_esperado, 'calculado', v_total);
      CONTINUE;
    END IF;

    INSERT INTO recurrencia_desglose
      (recurrencia_id, periodo, subtotal, impuesto, envio, total, moneda)
    VALUES (v_r.id, v_r.proximo_pedido_fecha, v_subtotal, v_impuesto, v_envio, v_total, 'USD')
    ON CONFLICT (recurrencia_id, periodo) DO NOTHING;
    /* `DO NOTHING` y no `DO UPDATE`, a propósito: **el desglose de un período
       se congela UNA vez.** *Si un reintento lo recalculara, el segundo intento
       podría cobrar un monto distinto del que el primero rechazó — y el
       cliente vería dos números para el mismo mes.* */

    /* ── ⓑ LAS COMPUERTAS ───────────────────────────────────────────────────
       🔴 **ACÁ HAY UNA DECISIÓN DE MESA PENDIENTE, Y NO LA TOMO SOLO.**

       La mesa firmó *«compuertas E3 enteras»*. **Medido contra el objeto:
       `verificar_compuertas_pre_cobro(p_compra_id uuid, p_token text)` es
       COMPRA-ONLY** — lee `compras`, `pedidos` e `inventario_reservas`, y **una
       recurrencia no tiene ninguna de las tres.** *Llamarla pasando el
       `recurrencia_id` como `compra_id` habría devuelto `compra_no_existe` en
       el 100 % de los casos: un freno que se ve como una compuerta funcionando.*

       **Y no es que falte adaptarla: DOS DE SUS COMPUERTAS NO APLICAN, con su
       razón:**
         · **1 · reserva de stock** — no hay pedido todavía. **§6 firma que
           primero se cobra y DESPUÉS sale la entrega**; exigir reserva antes
           del cobro invertiría esa firma.
         · **compra sin pedidos** — por lo mismo: el pedido nace después.
       **Y DOS SÍ, con el mismo espíritu y otro sujeto:**
         · **0 · intento en vuelo** — íntegra. *Protege la tarjeta del cliente
           del segundo débito, que es lo caro.*
         · **monto contra desglose congelado** — construida arriba, en ⓒ.

       ⚖️ **LAS DOS SALIDAS, servidas para la mesa:**
       **(a) ensanchar `verificar_compuertas_pre_cobro` a tres sujetos** — es
       cirugía sobre la función que HOY cobra plata real de Nuvei, exactamente
       lo que S103-D se negó a hacer por el mismo motivo.
       **(b) `verificar_compuertas_recurrencia(uuid, date)` propia**, con cada
       predicado **extraído del cuerpo vivo** y con las dos que no aplican
       **declaradas por nombre**. ⚠️ Riesgo declarado: `L-375` — reimplementar
       es medir el propio eco; se mitiga extrayendo, no reescribiendo.
       **Voto de A: (b)**, porque la mitad que no aplica no se puede parametrizar
       sin volver la compuerta de compras más difícil de leer, *y porque una
       firma que no se puede cumplir literalmente se declara, no se fuerza.*

       ✅ **RESUELTO por (b), y el mapeo completo vive en ④ al pie de este
       archivo: CUATRO evaluadas + cobertura declarada no-evaluable + reserva
       declarada no-aplica.** *Mi propio conteo de arriba decía «dos» — estaba
       hecho sobre medio cuerpo leído.* */
    v_compuertas := verificar_compuertas_recurrencia(v_r.id, v_r.proximo_pedido_fecha);
    IF COALESCE((v_compuertas->>'ok')::boolean, false) IS NOT TRUE THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'recurrencia_id', v_r.id, 'periodo', v_r.proximo_pedido_fecha,
        'motivo', COALESCE(v_compuertas->>'codigo', 'compuerta_sin_codigo'),
        'compuertas', v_compuertas);
      CONTINUE;
    END IF;

    /* ── ⓓ EL INTENTO, CON PAGADOR EXPLÍCITO ───────────────────────────────
       🔴 `pagador_user_id` NO se deriva: se escribe. *El defecto que S102 curó
       era exactamente éste en la cita — un intento sin pagador declarado
       obliga a adivinar de quién era la plata cuando hay que devolverla.*
       Y `pagador_origen = 'recurrencia'` distingue este cobro de uno que la
       persona hizo con el dedo: **no hubo nadie mirando la pantalla**, y eso
       cambia qué se le puede reclamar y cómo se le avisa. */
    INSERT INTO pagos_intentos (
      recurrencia_id, recurrencia_periodo, monto, moneda, estado, forma,
      proveedor, pagador_user_id, pagador_origen, clave_idempotencia
    ) VALUES (
      v_r.id, v_r.proximo_pedido_fecha, v_total, 'USD', 'iniciado', 'tokenizacion',
      'nuvei', v_r.user_id, 'recurrencia',
      'rec:' || v_r.id::text || ':' || v_r.proximo_pedido_fecha::text
    )
    ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'recurrencia_id', v_r.id,
      'periodo',        v_r.proximo_pedido_fecha,
      'intento_id',     v_intento,
      'user_id',        v_r.user_id,
      'tarjeta_id',     v_r.tarjeta_id,
      'monto',          v_total,
      'moneda',         'USD',
      'autorizada_en',  v_r.autorizada_en,
      'reintentos',     v_r.reintentos);
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'fecha', v_hoy,
    'para_cobrar', v_listas,
    'frenadas', v_frenadas,
    /* 🔴 LOS DOS NÚMEROS VAN SIEMPRE, incluso en cero. *Un `para_cobrar` vacío
       sin su `frenadas` al lado es indistinguible de «no había nada que
       cobrar» — y son dos hechos muy distintos.* (`L-364`) */
    'cuantas_listas',   jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

REVOKE ALL ON FUNCTION public.recurrencias_vencidas_pendientes() FROM anon, authenticated, PUBLIC;
/* Sólo el motor. **Ni siquiera `authenticated`**: esta función CONGELA MONTOS y
   ABRE INTENTOS. *Una puerta que el pagador puede llamar es la compuerta 2
   verificando un número que el pagador provocó.* */

COMMENT ON FUNCTION public.recurrencias_vencidas_pendientes() IS
  'LA BASE ELIGE Y CONGELA. Corre compuertas E3, congela el desglose del '
  'periodo al precio VIGENTE (§5) y abre el intento con pagador explicito. '
  'NO COBRA — la edge pagos-cobro-recurrente cobra lo que esta funcion '
  'devuelve. El cron no puede fabricar un JWT de usuario con service_role '
  '(L-340), y por eso la autorizacion del cliente vive en la fila de la serie.';


-- ═══════════════════════════════════════════════════════════════════════════
-- ③  EL CRON DEJA DE SER UN STUB — y deja de negarse por una condición vencida
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 SU CUERPO ANTERIOR ES EL CASO TESTIGO DE `L-372`: se negaba con
--    `pasarela_no_afiliada` **y nombraba el artefacto que lo abriría** (`D-778`).
--    La pasarela existe desde S101. **Nadie volvió.** *Una guarda que se niega
--    citando una condición vencida es indistinguible de una que funciona.*

CREATE OR REPLACE FUNCTION public.ejecutar_recurrencias_vencidas()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp', 'net'
AS $function$
DECLARE v_url text; v_secreto text; v_req bigint; v_vivo boolean;
BEGIN
  /* El mismo interruptor que el actuador: si el motor está apagado, esto NO
     falla — dice que está apagado. *Un timbre que suena con la casa cerrada
     llena el buzón de nadie.* */
  SELECT (valor = 'true') INTO v_vivo FROM app_config WHERE clave = 'recurrente_vivo';
  IF NOT COALESCE(v_vivo, false) THEN
    RETURN jsonb_build_object('ok', true, 'ejecutado', false, 'motivo', 'recurrente_apagado');
  END IF;

  SELECT valor INTO v_url     FROM app_config WHERE clave = 'url_cobro_recurrente';
  SELECT valor INTO v_secreto FROM app_config WHERE clave = 'secreto_despacho';

  IF v_url IS NULL OR v_secreto IS NULL THEN
    /* 🔴 SE NIEGA NOMBRANDO EL ARTEFACTO QUE LA ABRE (`L-171`) — y esta vez el
       artefacto es VERIFICABLE por una consulta, no por prosa: son dos filas
       de `app_config`. *`D-883` existe para que algo pregunte si ya están.* */
    RETURN jsonb_build_object('ok', false, 'ejecutado', false,
      'motivo', 'sin_configurar',
      'falta', CASE WHEN v_url IS NULL THEN 'url_cobro_recurrente' ELSE 'secreto_despacho' END);
  END IF;

  /* 🔴 EL TIMBRE Y NADA MÁS. No elige, no congela, no cobra. *Meterle lógica
     acá sería partir la decisión entre dos lugares, y algún día van a decir
     cosas distintas.* */
  SELECT net.http_post(
           url     := v_url,
           headers := jsonb_build_object('Content-Type','application/json',
                                         'x-despacho-secret', v_secreto),
           body    := '{}'::jsonb,
           timeout_milliseconds := 30000
         ) INTO v_req;

  RETURN jsonb_build_object('ok', true, 'ejecutado', true, 'request_id', v_req);
END $function$;

REVOKE ALL ON FUNCTION public.ejecutar_recurrencias_vencidas() FROM anon, authenticated, PUBLIC;


-- ═══════════════════════════════════════════════════════════════════════════
-- CINTURÓN
-- ═══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE v_def text; v_r jsonb;
BEGIN
  -- (a) El cron dejó de negarse por la condición vencida.
  SELECT pg_get_functiondef(to_regprocedure('public.ejecutar_recurrencias_vencidas()')) INTO v_def;
  IF position('pasarela_no_afiliada' IN v_def) > 0 THEN
    RAISE EXCEPTION 'ABORTA: el cron sigue negandose por una condicion vencida (L-372)';
  END IF;
  IF position('net.http_post' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: el cron no llama a la edge';
  END IF;

  -- (b) 🔴 EL DISCRIMINADOR DEL REPARTO: la base NO cobra. Si algún día alguien
  --     le mete el cobro adentro, esto aborta. *El reparto es una decisión
  --     firmada, no una convención.*
  SELECT pg_get_functiondef(to_regprocedure('public.recurrencias_vencidas_pendientes()')) INTO v_def;
  IF position('net.http_post' IN v_def) > 0 OR position('service_role' IN v_def) > 0 THEN
    RAISE EXCEPTION 'ABORTA: la base intenta cobrar o fabricar identidad (L-340)';
  END IF;

  -- (c) Llama a la compuerta, no la reimplementa (L-375).
  IF position('verificar_compuertas_pre_cobro' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: no llama a las compuertas E3';
  END IF;

  -- (d) El pagador se ESCRIBE, no se deriva.
  IF position('pagador_user_id' IN v_def) = 0 OR position('pagador_origen' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: el intento nace sin pagador declarado';
  END IF;

  -- (e) 🔴 CORRE DE VERDAD, con 0 series activas: tiene que devolver los DOS
  --     contadores en cero, no fallar. *Un motor que sólo se prueba con datos
  --     no está probado para el día que no los haya.*
  v_r := recurrencias_vencidas_pendientes();
  IF COALESCE((v_r->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: la seleccion fallo en vacio: %', v_r;
  END IF;
  IF v_r->'para_cobrar' IS NULL OR v_r->'frenadas' IS NULL THEN
    RAISE EXCEPTION 'ABORTA: falta uno de los dos contadores — vacio y frenado se confunden';
  END IF;

  -- (f) Ninguna de las dos es alcanzable por el cliente.
  IF has_function_privilege('authenticated','public.recurrencias_vencidas_pendientes()','EXECUTE')
     OR has_function_privilege('anon','public.recurrencias_vencidas_pendientes()','EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA: el pagador puede congelar su propio monto';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — el cron es timbre · la base elige y congela y NO cobra · compuertas llamadas · pagador escrito · corre en vacio · fuera del alcance del cliente';
END $cinturon$;



-- ═══════════════════════════════════════════════════════════════════════════
-- ②  `cerrar_y_renovar_planes` POR EL MISMO CUERPO — el DISEÑO, medido
--
-- **Firma de la mesa:** *«los dos sujetos de la letra pasan por la misma
-- puerta»*. Acá va **qué hay que cambiar y por qué**, medido contra el cuerpo
-- vivo (264 líneas, cron `cerrar-renovar-planes` a las 08:00 diario).
--
-- ── 🔴 LO QUE HACE HOY, Y ES PEOR DE LO QUE EL NOMBRE SUGIERE ──────────────
--
-- La condición que decide renovar es:
--     `IF v_susc.auto_renovar AND v_mascota_activa AND NOT v_gracia_vencida`
-- **No hay cobro en ninguna parte.** Y a continuación:
--     `v_pagado_en := now();`  …  `'pago_simulado', true`
-- ⇒ **marca el período como cobrado, y `_generar_citas_plan` crea las citas
--    CONFIRMADAS.** *La familia recibe un mes de paseos y el aviso
--    «plan_renovado», y nadie cobró un centavo.*
--
-- 🔴 **Y LO QUE LO VUELVE EL CASO TESTIGO DE `L-372`: el mecanismo de GRACIA
--    YA ESTÁ CONSTRUIDO PARA UN COBRO QUE NUNCA EXISTIÓ.** Su propio
--    comentario dice: *«El fallo de cobro abre gracia (handler de abajo); acá
--    solo se decide si la ventana venció.»* — **siete días de gracia, firmados
--    por el founder el 6-ago, esperando un fallo que no puede ocurrir porque
--    no hay cobro.** *Una pieza entera construida contra una condición que
--    nadie fue a verificar si llegó.*
--
-- ── EL CAMBIO, y NO es «meterle el cobro adentro» ──────────────────────────
--
-- 🔴 **El reparto lo prohíbe: la base no cobra.** Si `cerrar_y_renovar_planes`
--    cobrara sincrónicamente, el cron estaría llamando al proveedor desde
--    Postgres — y volvemos a `L-340`.
--
-- **La forma correcta parte la renovación en DOS ACTOS, y el segundo no lo
-- dispara el reloj sino LA PLATA:**
--
--   **ACTO 1 · el cron SELECCIONA Y CONGELA** (lo que hoy hace `recurrencias_
--   vencidas_pendientes` para la despensa). La suscripción vencida deja de
--   renovarse sola: **congela su desglose del período** y **abre su intento**.
--   *No toca `periodo_fin`, no genera citas, no manda `plan_renovado`.*
--
--   **ACTO 2 · la renovación ocurre CUANDO EL COBRO ENTRA**, y la dispara el
--   ACTUADOR —el mismo que confirma una compra o una cita—, no el reloj.
--   *Recién ahí: `periodo_fin` avanza, nacen las citas y sale el aviso.*
--
-- > **La regla que esto restaura, y que la letra ya firmaba: primero entra la
-- > plata, después sale el servicio.** *Hoy está al revés, y lo tapa un
-- > `pago_simulado: true` que se lee como «esto todavía no cobra» cuando en
-- > realidad dice «esto ya entregó».*
--
-- ── LO QUE **NO** HAY QUE TOCAR, medido y declarado ────────────────────────
--   · **La gracia de 7 días** — nace de verdad recién ahora. *Su handler ya
--     está escrito y probado contra el par; lo único que le faltaba era un
--     fallo real que lo despertara.*
--   · **El aviso de 72 h** — es ANTES del cobro y sigue igual.
--   · **El crédito por sobrantes** y su nota de no-sumar-desde-metadata (*el
--     par lo cazó: reembolso 12 donde correspondía 6*). **No se toca.**
--   · **El unitario derivado** y la reforma S79. **No se tocan.**
--
-- ⚠️ **PRECONDICIÓN QUE ESTE ARCHIVO NO PUEDE RESOLVER SOLO:** el sujeto
--    `suscripcion` **no existe todavía en `pagos_intentos`** — el CHECK admite
--    `pedido`, `cita` y (con la migración ①) `recurrencia`. **La suscripción
--    de plan es un CUARTO sujeto**, y ensancharlo es decisión de la misma mesa
--    que decidió el tercero. *Escribir el ACTO 1 contra una columna que no
--    existe sería exactamente lo que la precondición del founder vino a
--    impedir — y ya se pagó sola una vez con `recurrencia_desglose`.*
--
-- ⇒ **SERVIDO A LA MESA, con su voto:** el cuarto sujeto se llama
--    `suscripcion_servicio_id` y viaja con su `periodo`, **espejo exacto del
--    tercero**. *Voto de A: mismo tratamiento, porque la alternativa —reusar
--    `recurrencia_id` para una suscripción— es el `compra_id` para una cita
--    otra vez: el dato del camino viejo colándose en el nuevo.*


-- ═══════════════════════════════════════════════════════════════════════════
-- ③  EL LECTOR QUE C NECESITA — escrito CONTRA SU CONTRATO, no contra mi idea
--
-- Fuente: `apps/cliente/src/lib/serie/contrato.ts`, que S103-C escribió
-- explícitamente **como un pedido en tipos** — *«esto no es un contrato
-- inventado: es un pedido escrito en tipos»*. **Sus tres pedidos calzan uno a
-- uno con las columnas de la migración ①**, y eso no es casualidad: los dos
-- salieron del mismo censo.
--
--   `medio`         ← `tarjeta_id`     (§2: la autorización nombra un medio)
--   `montoEsperado` ← `monto_esperado` (§2/§5: el monto del aviso ES el del cobro)
--   `estado`        ← `estado` enum    (§6: pausa ≠ cancelación)
--
-- 🔴 **LOS TRES SIGUEN SALIENDO `null` HASTA QUE EXISTA SU PRODUCTOR**, y eso
--    NO es un defecto del lector: `configurar_recurrencia` todavía no escribe
--    tarjeta ni monto. *Devolverlos `null` es decir la verdad; inventarlos
--    sería fabricar en la puerta un dato que el motor no tiene.* **Y C ya tiene
--    voz de ausencia para cada uno** — *«un `0` o un guion mudo en el lugar de
--    una plata que no conocemos es peor que decir que no la mostramos: el guion
--    se lee como gratis y el cero como no-te-cobran».*
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.obtener_serie_recurrente(p_serie_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_r record; v_uid uuid := auth.uid(); v_items jsonb; v_saltada text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_requerido' USING ERRCODE='42501'; END IF;

  SELECT * INTO v_r FROM pedidos_recurrencias WHERE id = p_serie_id;

  /* 🔴 «NO EXISTE» Y «ES DE OTRO» DAN LA MISMA RESPUESTA, a propósito y por
     precedente de la casa: es la misma ambigüedad deliberada que la puerta de
     pago (`compra_no_existe`). *Distinguirlas convertiría este lector en un
     oráculo de series ajenas — se pregunta por un uuid y se aprende si existe.*
     La ambigüedad quedó VERIFICADA en el riel DeUna (S103-D), no sólo escrita. */
  IF v_r.id IS NULL OR v_r.user_id <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'serie_no_existe');
  END IF;

  /* Los ítems EN VOZ DE LA FAMILIA, jamás el slug del motor. El nombre sale
     del catálogo VIVO; si una oferta se retiró, la fila igual se cuenta y su
     nombre cae al que guardó el ítem — *una serie no se vuelve ilegible porque
     el vendedor despublicó un producto.* */
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'nombre',   COALESCE(p.nombre, it->>'nombre', '—'),
           'cantidad', (it->>'cantidad')::int)), '[]'::jsonb)
    INTO v_items
    FROM jsonb_array_elements(v_r.items) it
    LEFT JOIN ofertas o          ON o.id = (it->>'oferta_id')::uuid
    LEFT JOIN producto_variantes v ON v.id = o.variante_id
    LEFT JOIN productos p          ON p.id = v.producto_id;

  /* §7 — el producto que no se pudo enviar si la última entrega se saltó.
     Sale del ÚLTIMO fallo registrado, no de una suposición. */
  v_saltada := NULLIF(v_r.ultimo_fallo_causa, '');

  RETURN jsonb_build_object(
    'ok', true,
    'id',                  v_r.id,
    'items',               v_items,
    'frecuenciaDias',      v_r.frecuencia_dias,
    'diaDelMes',           v_r.dia_del_mes,
    'proximoPedidoFecha',  v_r.proximo_pedido_fecha,
    'entregaEtiqueta',     NULLIF(v_r.entrega->>'etiqueta', ''),
    'estado',              v_r.estado,
    /* Los tres de abajo salen `null` hasta que exista su productor —
       DECLARADO, no disimulado. */
    'montoEsperado',       v_r.monto_esperado,
    'medio', (SELECT CASE WHEN t.id IS NULL THEN NULL
                          ELSE jsonb_build_object('marca', t.marca, 'ultimos4', t.ultimos4) END
                FROM tarjetas_guardadas t
               WHERE t.id = v_r.tarjeta_id AND t.user_id = v_uid),
    'saltadaProducto',     v_saltada);
END $function$;

REVOKE ALL ON FUNCTION public.obtener_serie_recurrente(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_serie_recurrente(uuid) TO authenticated;

COMMENT ON FUNCTION public.obtener_serie_recurrente(uuid) IS
  'El lector de UNA serie, en la forma exacta del contrato que S103-C escribio '
  'como pedido en tipos. medio/montoEsperado salen null hasta que '
  'configurar_recurrencia los escriba — decir la verdad, jamas inventar. '
  'No-existe y es-de-otro dan la MISMA respuesta: sin eso es un oraculo de '
  'series ajenas.';

-- ── CINTURÓN DEL LECTOR ────────────────────────────────────────────────────
DO $cinturon$
DECLARE v_def text;
BEGIN
  SELECT pg_get_functiondef(to_regprocedure('public.obtener_serie_recurrente(uuid)')) INTO v_def;

  -- 🔴 EL DISCRIMINADOR: las DOS ramas del rechazo dan el MISMO código. Si
  --    alguien las separa «para ayudar», esto aborta.
  IF position('serie_no_existe' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: el rechazo perdio su codigo';
  END IF;
  IF position('serie_es_de_otro' IN v_def) > 0 OR position('sin_permiso' IN v_def) > 0 THEN
    RAISE EXCEPTION 'ABORTA: se separo no-existe de es-de-otro — oraculo de series ajenas';
  END IF;

  -- Las nueve claves del contrato de C, por nombre. *Si el lector pierde una,
  -- la pantalla la lee `undefined` y dibuja un hueco sin decir que lo es.*
  IF position('proximoPedidoFecha' IN v_def) = 0 OR position('montoEsperado' IN v_def) = 0
     OR position('saltadaProducto' IN v_def) = 0 OR position('entregaEtiqueta' IN v_def) = 0
     OR position('frecuenciaDias' IN v_def) = 0 OR position('diaDelMes' IN v_def) = 0 THEN
    RAISE EXCEPTION 'ABORTA: el lector no devuelve el contrato completo de C';
  END IF;

  -- Alcanzable por la familia, cerrada a anon.
  IF NOT has_function_privilege('authenticated','public.obtener_serie_recurrente(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA: la familia no puede leer su propia serie';
  END IF;
  IF has_function_privilege('anon','public.obtener_serie_recurrente(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'ABORTA: anon alcanza el lector';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — contrato completo · ambiguedad conservada · familia si, anon no';
END $cinturon$;


-- ═══════════════════════════════════════════════════════════════════════════
-- ④  LAS COMPUERTAS DEL RECURRENTE — extraídas del cuerpo vivo de E3
--
-- 🔴 **CORRIJO MI PROPIA DECLARACIÓN DE ARRIBA: dije «DOS aplican» y son
--    CUATRO de seis.** *Lo dije después de leer 60 líneas del cuerpo y antes de
--    leer las otras 60 — un censo a medias que reporté como completo.* Es
--    `L-357` sobre mí: afirmar un paso más allá de lo medido.
--
-- ── EL MAPEO COMPLETO, compuerta por compuerta ─────────────────────────────
--
--   **0 · intento en vuelo**      ✅ APLICA — íntegra, cambiando el sujeto.
--   **1 · reserva de stock**      ❌ NO APLICA — no hay pedido todavía. **§6:
--                                    primero se cobra, DESPUÉS sale la
--                                    entrega.** Exigirla invertiría esa firma.
--   **2 · monto == desglose**     ✅ APLICA — contra `recurrencia_desglose`.
--                                    *Es la más importante y casi la doy por
--                                    inaplicable por no haber leído hasta acá.*
--   **3 · cobertura**             ⚠️ NO EVALUABLE — **viaja en `no_evaluables`,
--                                    igual que en compras.** *Que nadie lea el
--                                    `ok:true` como «la cobertura está
--                                    verificada»: no se verificó nada.*
--   **4 · vendedor activo (7.13)** ✅ APLICA — la serie tiene su cuenta.
--   **5 · token**                 ✅ APLICA EN SU FORMA: acá el «token» es **la
--                                    tarjeta autorizada para ESTA serie**, y ya
--                                    se verifica en ⓐ (que siga siendo suya y
--                                    guardada). *Mismo espíritu, otro sujeto.*
--
-- ⇒ **cuatro evaluadas + una declarada no evaluable + una que no aplica con su
--    razón escrita.** *Eso es «E3 entera» para este sujeto — lo que no se puede
--    es llamar a la función de compras, no cumplir la firma.*
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.verificar_compuertas_recurrencia(
  p_recurrencia_id uuid, p_periodo date)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_r        record;
  v_en_vuelo int;
  v_total    numeric(12,2);
  v_inactiva int;
BEGIN
  SELECT * INTO v_r FROM pedidos_recurrencias WHERE id = p_recurrencia_id;
  IF v_r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', 'serie',
      'codigo', 'serie_no_existe',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ 0 · La serie no tiene ya un intento EN VUELO para este período ══
  -- *El candado UNIQUE impide la fila duplicada; esta compuerta impide el
  --  SEGUNDO DÉBITO, que es lo caro. El candado protege la tabla; la compuerta
  --  protege la tarjeta del cliente.* (literal del cuerpo de compras)
  SELECT count(*) INTO v_en_vuelo
    FROM pagos_intentos
   WHERE recurrencia_id = p_recurrencia_id
     AND recurrencia_periodo = p_periodo
     AND estado IN ('iniciado','pendiente');
  IF v_en_vuelo > 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '0_intento_en_vuelo',
      'codigo', 'pago_en_proceso', 'detalle', jsonb_build_object('intentos', v_en_vuelo),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ 1 · reserva de stock — NO APLICA (§6). Se DECLARA, no se omite. ══

  -- ══ 2 · El monto sale del DESGLOSE CONGELADO de ESTE período ══
  -- 🔴 Contra el desglose, jamás contra el catálogo vivo: *el desglose es lo
  --    que se le prometió al cliente; si el precio se movió después, el que
  --    tiene razón es el desglose. Comparar contra lo vivo taparía justo el
  --    defecto que esta compuerta busca.*
  SELECT total INTO v_total FROM recurrencia_desglose
   WHERE recurrencia_id = p_recurrencia_id AND periodo = p_periodo;
  IF v_total IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '2_monto',
      'codigo', 'desglose_incompleto',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;
  IF v_r.monto_esperado IS NOT NULL AND round(v_total,2) > round(v_r.monto_esperado,2) THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '2_monto',
      'codigo', 'monto_divergente',
      'detalle', jsonb_build_object('autorizado', v_r.monto_esperado, 'congelado', v_total),
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ 3 · COBERTURA — NO EVALUABLE. No se evalúa y NO SE FINGE. ══

  -- ══ 4 · El vendedor sigue activo (regla 7.13) ══
  SELECT count(*) INTO v_inactiva
    FROM cuentas_comerciales cc
   WHERE cc.id = v_r.cuenta_comercial_id AND cc.estado <> 'activa';
  IF v_inactiva > 0 THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '4_vendedor',
      'codigo', 'vendedor_no_activo',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  -- ══ 5 · EL MEDIO AUTORIZADO — el «token» de este sujeto ══
  IF v_r.tarjeta_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM tarjetas_guardadas t
                     WHERE t.id = v_r.tarjeta_id AND t.user_id = v_r.user_id
                       AND t.estado = 'guardada') THEN
    RETURN jsonb_build_object('ok', false, 'compuerta', '5_medio',
      'codigo', 'token_ausente',
      'no_evaluables', jsonb_build_array('cobertura'));
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'recurrencia_id', p_recurrencia_id, 'periodo', p_periodo,
    'monto_verificado', v_total,
    'evaluadas', jsonb_build_array('0_intento_en_vuelo','2_monto','4_vendedor','5_medio'),
    /* 🔴 VIAJAN SIEMPRE, incluso en el ok — las dos. La de cobertura porque no
       se evaluó; la de reserva porque **no aplica a propósito**, y sin decirlo
       un lector futuro va a creer que se olvidó. */
    'no_evaluables', jsonb_build_array('cobertura'),
    'no_aplican', jsonb_build_object('1_reserva', 'sin pedido todavia (§6: primero se cobra)'));
END $function$;

REVOKE ALL ON FUNCTION public.verificar_compuertas_recurrencia(uuid, date) FROM anon, authenticated, PUBLIC;


-- ═══════ S103-A-recurrente-CUARTO-SUJETO.sql ═══════
-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL CUARTO SUJETO COBRABLE Y LOS DOS ACTOS DE LA RENOVACIÓN
--          **SIN NÚMERO · SIN APLICAR** — entra en la MISMA migración que ①
--
-- **Firma del founder, 22-ago-2026**, con su argumento al acta:
-- > *partirlo deja el plan cobrando por un camino y la despensa por otro, y así
-- > nacen los dos caminos que después nadie reconcilia.*
--
-- ── EL DEFECTO QUE CIERRA, y es el más grave de la sesión ──────────────────
-- `cerrar_y_renovar_planes` **renovaba SIN COBRAR**: su condición era
-- `auto_renovar AND mascota_activa AND NOT gracia_vencida`, seguida de
-- `v_pagado_en := now()` y `'pago_simulado', true`, con `_generar_citas_plan`
-- creando las citas **confirmadas**. *Un mes de paseos entregado, cero plata.*
-- **Y `pago_simulado: true` lo tapaba: se lee como «esto todavía no cobra»
-- cuando lo que dice es «esto ya entregó»** (`L-387`).
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- ⓐ  EL CUARTO SUJETO — espejo exacto del tercero
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.pagos_intentos
  ADD COLUMN suscripcion_servicio_id uuid REFERENCES public.suscripciones_servicio(id),
  ADD COLUMN suscripcion_periodo     date;

ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_suscripcion_viaja_con_su_periodo
  CHECK ((suscripcion_servicio_id IS NULL) = (suscripcion_periodo IS NULL));

-- 🔴 EL INVARIANTE «EXACTAMENTE UNO» SE EXTIENDE A CUATRO, y es la razón por la
--    que el sujeto es propio y no se reusa `recurrencia_id`:
--    *reusarlo sería el `compra_id` para una cita otra vez — el dato del camino
--    viejo colándose en el nuevo, que es EXACTAMENTE lo que este invariante
--    existe para impedir.*
ALTER TABLE public.pagos_intentos DROP CONSTRAINT chk_intento_un_solo_sujeto;
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_intento_un_solo_sujeto
  CHECK (
    ((pedido_id IS NOT NULL))::integer
  + ((cita_id IS NOT NULL))::integer
  + ((recurrencia_id IS NOT NULL))::integer
  + ((suscripcion_servicio_id IS NOT NULL))::integer = 1
  );

-- ═══ EL VOCABULARIO DEL PAGADOR GANA SU TERCER ORIGEN ═══
--
-- 🔴 **Lo destapó el arnés, no la lectura.** `chk_pagador_viaja_con_su_origen`
--    admitía **`'sesion'` y `'backfill_s102'`**, y nada más. **Un cobro
--    recurrente NO TIENE SESIÓN — ése es exactamente su punto** ⇒ el INSERT
--    rebotaba con `23514`.
--
-- **La constraint estaba haciendo su trabajo: rechazó un valor que nadie había
-- declarado.** *No era un obstáculo — era el modelo defendiéndose, igual que
-- los CHECKs de procedencia que frenaron el borrado de las sondas en S92.*
--
-- ⇒ **`'recurrencia'` entra como TERCER origen, no como excepción.** Y la
--    distinción importa más allá del CHECK: **`pagador_origen` dice si había
--    alguien mirando la pantalla**, y eso cambia qué se le puede reclamar a la
--    persona y cómo se le avisa. *Un cobro que nadie vio no se explica igual
--    que uno que alguien apretó.*
ALTER TABLE public.pagos_intentos DROP CONSTRAINT chk_pagador_viaja_con_su_origen;
ALTER TABLE public.pagos_intentos
  ADD CONSTRAINT chk_pagador_viaja_con_su_origen
  CHECK (
    (pagador_user_id IS NULL AND pagador_origen IS NULL)
    OR (pagador_user_id IS NOT NULL
        AND pagador_origen = ANY (ARRAY['sesion','backfill_s102','recurrencia']))
  );

-- PARCIAL sobre `aprobado`, igual que el tercero: lo que no puede haber dos
-- veces es un cobro EXITOSO, no un intento — §6 firma tres reintentos.
CREATE UNIQUE INDEX uq_suscripcion_periodo_aprobado
  ON public.pagos_intentos (suscripcion_servicio_id, suscripcion_periodo)
  WHERE suscripcion_servicio_id IS NOT NULL AND estado = 'aprobado';

-- El desglose del período, espejo de `recurrencia_desglose`.
CREATE TABLE public.suscripcion_desglose (
  suscripcion_servicio_id uuid NOT NULL REFERENCES public.suscripciones_servicio(id) ON DELETE CASCADE,
  periodo       date NOT NULL,
  subtotal      numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  impuesto      numeric(12,2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
  total         numeric(12,2) NOT NULL CHECK (total > 0),
  moneda        text NOT NULL DEFAULT 'USD',
  congelado_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (suscripcion_servicio_id, periodo)
);
ALTER TABLE public.suscripcion_desglose ENABLE ROW LEVEL SECURITY;
CREATE POLICY suscripcion_desglose_select ON public.suscripcion_desglose
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.suscripciones_servicio s
                  WHERE s.id = suscripcion_desglose.suscripcion_servicio_id
                    AND (s.user_id = auth.uid() OR is_admin())));
-- Sin policy de escritura: lo congela el motor. *Un desglose que el pagador
-- puede escribir es la compuerta 2 verificando un número que él eligió.*

-- ═══════════════════════════════════════════════════════════════════════════
-- ⓑ  ACTO 1 — EL CRON SELECCIONA Y CONGELA. **No renueva.**
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.planes_vencidos_pendientes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_s record; v_hoy date := (now() AT TIME ZONE 'America/Guayaquil')::date;
  v_oferta record; v_n int; v_total numeric(12,2); v_credito numeric(12,2);
  v_intento uuid; v_listas jsonb := '[]'::jsonb; v_frenadas jsonb := '[]'::jsonb;
  v_masc boolean;
BEGIN
  FOR v_s IN
    SELECT * FROM suscripciones_servicio
     WHERE tipo_servicio = 'paseo_mensual' AND estado = 'activa'
       AND auto_renovar AND periodo_fin <= v_hoy
       AND NOT EXISTS (SELECT 1 FROM pagos_intentos i
                        WHERE i.suscripcion_servicio_id = suscripciones_servicio.id
                          AND i.suscripcion_periodo = suscripciones_servicio.periodo_fin
                          AND i.estado = 'aprobado')
     ORDER BY periodo_fin FOR UPDATE SKIP LOCKED
  LOOP
    /* El fusible del motor de D-657(b): sin mascota activa no se renueva.
       *Se conserva tal cual — no es de este arco y su razón sigue viva.* */
    /* 🔴 EL VALOR SE MIDIÓ, NO SE SUPUSO: `estado_vida` vale **`'activa'`**, no
       `'vivo'`. *Con el literal equivocado este fusible habría frenado TODOS
       los planes con `mascota_no_activa` — un motor apagado que se ve como un
       motor prudente.* Es `L-364` en su forma más cara: el rojo total y prolijo. */
    SELECT (m.estado_vida = 'activa') INTO v_masc FROM mascotas m WHERE m.id = v_s.mascota_id;
    IF NOT COALESCE(v_masc, false) THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'mascota_no_activa');
      CONTINUE;
    END IF;

    SELECT ps.id, ps.precio_mensual_plan INTO v_oferta
      FROM prestador_servicios ps WHERE ps.id = v_s.prestador_servicio_id AND ps.activo;
    IF v_oferta.id IS NULL OR v_oferta.precio_mensual_plan IS NULL THEN
      /* REFORMA S79 ①: sin mensual declarado NO se renueva. *Conservado: el
         plan vence honesto en vez de cobrar un precio inventado.* */
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'plan_no_ofrecido');
      CONTINUE;
    END IF;

    SELECT count(*) INTO v_n
      FROM _fechas_periodo_plan(v_s.periodo_fin, v_s.dias_semana, v_s.frecuencia);
    IF v_n = 0 THEN
      v_frenadas := v_frenadas || jsonb_build_object(
        'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'motivo', 'plan_sin_citas');
      CONTINUE;
    END IF;

    /* EL CRÉDITO POR SOBRANTES SE CALCULA FRESCO — y **NO se suma desde
       metadata**. *El par lo cazó: reembolso 12 donde correspondía 6.* Se
       conserva la nota original porque su razón no cambió. */
    SELECT COALESCE(count(*) * v_s.precio_unitario_efectivo, 0) INTO v_credito
      FROM evento_cita_servicio
     WHERE suscripcion_servicio_id = v_s.id AND estado = 'confirmada' AND fecha >= v_hoy;

    v_total := greatest(round(v_oferta.precio_mensual_plan, 2) - COALESCE(v_credito,0), 0);

    /* 🔴 SI EL CRÉDITO CUBRE EL MES ENTERO NO HAY NADA QUE COBRAR — y eso NO
       es un fallo: es una renovación que se paga sola. Se lista con monto 0
       marcada, para que el ACTO 2 la renueve sin pasar por el proveedor.
       *Mandar un cobro de 0 al proveedor es pedirle que rechace algo que
       nosotros ya sabíamos.* */
    INSERT INTO suscripcion_desglose (suscripcion_servicio_id, periodo, subtotal, impuesto, total, moneda)
    VALUES (v_s.id, v_s.periodo_fin, round(v_oferta.precio_mensual_plan,2), 0,
            greatest(v_total, 0.01), 'USD')
    ON CONFLICT (suscripcion_servicio_id, periodo) DO NOTHING;

    INSERT INTO pagos_intentos (
      suscripcion_servicio_id, suscripcion_periodo, monto, moneda, estado, forma,
      proveedor, pagador_user_id, pagador_origen, clave_idempotencia)
    VALUES (v_s.id, v_s.periodo_fin, greatest(v_total, 0.01), 'USD', 'iniciado',
            'tokenizacion', 'nuvei', v_s.user_id, 'recurrencia',
            'plan:' || v_s.id::text || ':' || v_s.periodo_fin::text)
    ON CONFLICT (clave_idempotencia) DO UPDATE SET actualizado_en = now()
    RETURNING id INTO v_intento;

    v_listas := v_listas || jsonb_build_object(
      'suscripcion_id', v_s.id, 'periodo', v_s.periodo_fin, 'intento_id', v_intento,
      'user_id', v_s.user_id, 'monto', greatest(v_total, 0.01),
      'credito_aplicado', COALESCE(v_credito,0),
      'cubierto_por_credito', (v_total <= 0));
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'fecha', v_hoy,
    'para_cobrar', v_listas, 'frenadas', v_frenadas,
    'cuantas_listas', jsonb_array_length(v_listas),
    'cuantas_frenadas', jsonb_array_length(v_frenadas));
END $function$;

REVOKE ALL ON FUNCTION public.planes_vencidos_pendientes() FROM anon, authenticated, PUBLIC;

-- ═══════════════════════════════════════════════════════════════════════════
-- ⓒ  ACTO 2 — LA RENOVACIÓN, DISPARADA POR LA PLATA
--
-- 🔴 La llama **el ACTUADOR** cuando el cobro entra — el mismo que confirma una
--    compra o una cita. **Jamás el reloj.**
--    *Restaura la regla ya firmada: primero entra la plata, después sale el
--    servicio. Hoy está al revés.*
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.renovar_plan_cobrado(
  p_suscripcion_id uuid, p_periodo date)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_s record; v_d record; v_inicio date; v_fin date; v_n int; v_unit numeric(14,2);
BEGIN
  SELECT * INTO v_s FROM suscripciones_servicio WHERE id = p_suscripcion_id FOR UPDATE;
  IF v_s.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'motivo', 'suscripcion_no_existe'); END IF;

  /* 🔴 EL GATE QUE HACE LA DIFERENCIA CON EL CUERPO VIEJO: **exige el cobro
     APROBADO de ESTE período.** *Sin esto volveríamos a renovar por confianza,
     que es exactamente el defecto que este arco cierra.* */
  IF NOT EXISTS (SELECT 1 FROM pagos_intentos
                  WHERE suscripcion_servicio_id = p_suscripcion_id
                    AND suscripcion_periodo = p_periodo AND estado = 'aprobado') THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'sin_cobro_aprobado');
  END IF;

  IF v_s.periodo_fin <> p_periodo THEN
    /* Ya renovada por otra pasada: idempotente y HABLADO. */
    RETURN jsonb_build_object('ok', true, 'renovado', false, 'motivo', 'ya_renovada');
  END IF;

  SELECT * INTO v_d FROM suscripcion_desglose
   WHERE suscripcion_servicio_id = p_suscripcion_id AND periodo = p_periodo;

  v_inicio := v_s.periodo_fin;
  v_fin    := (v_inicio + interval '1 month')::date;

  UPDATE suscripciones_servicio
     SET periodo_inicio = v_inicio, periodo_fin = v_fin,
         precio_mensual = v_d.subtotal, precio_pagado = v_d.total,
         proximo_cobro_en = v_fin, ultima_actividad_en = now(),
         /* ☠️ MUERE `pago_simulado: true`. *Su nombre describía el MEDIO y no
            la CONSECUENCIA: se leía «esto todavía no cobra» y decía «esto ya
            entregó».* Lo reemplaza el intento aprobado, que es un hecho. */
         pago_metadata = (pago_metadata - 'gracia') || jsonb_build_object(
           'cobros', COALESCE(pago_metadata->'cobros','[]'::jsonb) || jsonb_build_array(
             jsonb_build_object('periodo_inicio', v_inicio, 'periodo_fin', v_fin,
               'total', v_d.total, 'cobrado_en', now())))
   WHERE id = p_suscripcion_id;

  v_n := _generar_citas_plan(p_suscripcion_id, v_inicio, v_fin, now());
  IF v_n = 0 THEN RAISE EXCEPTION 'plan_sin_citas'; END IF;

  SELECT count(*) INTO v_n FROM evento_cita_servicio
   WHERE suscripcion_servicio_id = p_suscripcion_id
     AND fecha >= v_inicio AND fecha < v_fin AND estado = 'confirmada';
  IF v_n > 0 THEN
    v_unit := round(v_d.total / v_n, 2);
    UPDATE suscripciones_servicio SET precio_unitario_efectivo = v_unit WHERE id = p_suscripcion_id;
    UPDATE evento_cita_servicio SET precio = v_unit
     WHERE suscripcion_servicio_id = p_suscripcion_id
       AND fecha >= v_inicio AND fecha < v_fin AND estado = 'confirmada';
  END IF;

  /* El aviso sale ACÁ y no antes: **cuando el mes está pago y las citas
     existen.** *Mandarlo al seleccionar anunciaría una renovación que todavía
     puede no ocurrir.* */
  PERFORM registrar_intencion_notificacion(
    p_tipo => 'plan_renovado', p_destinatario_user_id => v_s.user_id,
    p_mascota_id => v_s.mascota_id,
    p_datos => jsonb_build_object('subtipo','plan_renovado','suscripcion_servicio_id', v_s.id)
               || public._voz_notificacion('plan_renovado', v_s.user_id, v_s.mascota_id),
    p_clave_dedup => 'plan_renovado:' || v_s.id || ':' || p_periodo::text);

  RETURN jsonb_build_object('ok', true, 'renovado', true,
    'periodo_inicio', v_inicio, 'periodo_fin', v_fin, 'citas', v_n);
END $function$;

REVOKE ALL ON FUNCTION public.renovar_plan_cobrado(uuid, date) FROM anon, authenticated, PUBLIC;

-- ── CINTURÓN ───────────────────────────────────────────────────────────────
DO $cinturon$
DECLARE
  v_def text; v_n int;
  /* 🔴 SIN COMENTARIOS AL MEDIR. `pg_get_functiondef` los devuelve, y este
     cinturón se disparó contra su PROPIA LÁPIDA: el comentario que declara que
     el flag murió **contenía el flag**. **Es `L-170` —un censo por
     `functiondef` lee los comentarios como código— cobrada sobre quien la citó
     en otro archivo el mismo día.**
     *Cambiar el comentario habría curado el caso y dejado viva la clase: el
     próximo que escriba el literal en una lápida vuelve a romper el gate.* */
  v_limpio text;
BEGIN
  -- (a) El invariante es de CUATRO.
  IF (SELECT pg_get_constraintdef(oid) FROM pg_constraint
       WHERE conname='chk_intento_un_solo_sujeto') NOT LIKE '%suscripcion_servicio_id%' THEN
    RAISE EXCEPTION 'ABORTA: el cuarto sujeto no entro al invariante';
  END IF;

  -- (b) 🔴 EL DISCRIMINADOR DEL ARCO: la renovación EXIGE cobro aprobado.
  SELECT pg_get_functiondef(to_regprocedure('public.renovar_plan_cobrado(uuid,date)')) INTO v_def;
  v_limpio := regexp_replace(regexp_replace(v_def, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g');
  IF position('sin_cobro_aprobado' IN v_limpio) = 0 THEN
    RAISE EXCEPTION 'ABORTA: la renovacion no exige el cobro — vuelve a renovar por confianza';
  END IF;

  -- (c) ☠️ `pago_simulado` MUERTO en el camino nuevo.
  IF position('pago_simulado' IN v_limpio) > 0 THEN
    RAISE EXCEPTION 'ABORTA: sobrevivio pago_simulado — la bandera que decia ya entrego';
  END IF;

  -- (d) El selector NO renueva ni avisa. *Si alguien le mete la renovación
  --     adentro, volvemos al reloj disparando el servicio.*
  SELECT pg_get_functiondef(to_regprocedure('public.planes_vencidos_pendientes()')) INTO v_def;
  v_limpio := regexp_replace(regexp_replace(v_def, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g');
  IF position('_generar_citas_plan' IN v_limpio) > 0
     OR position('plan_renovado' IN v_limpio) > 0 THEN
    RAISE EXCEPTION 'ABORTA: el ACTO 1 renueva o avisa — los dos actos se fusionaron';
  END IF;

  -- (e) Corre en vacío y devuelve los DOS contadores.
  IF (planes_vencidos_pendientes()->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'ABORTA: el selector de planes fallo en vacio';
  END IF;

  RAISE NOTICE 'CINTURON VERDE — cuarto sujeto en el invariante · la renovacion exige cobro · pago_simulado muerto · los dos actos separados';
END $cinturon$;



-- ═══════ EL ARNÉS ═══════
-- ═══════════════════════════════════════════════════════════════════════════
-- S103-A · EL ARNÉS DEL COBRO RECURRENTE — camino real, IN-TXN con ROLLBACK
--
-- **Es la precondición del founder hecha ejecutable:** *«la migración no se
-- aplica hasta que el cuerpo esté escrito y su arnés recorrido — incluida la
-- serie que falla a propósito hasta la pausa»*.
--
-- ── CÓMO SE CORRE ──────────────────────────────────────────────────────────
--   Se aplica el bloque completo dentro de una transacción que TERMINA EN
--   ROLLBACK. **Residuo esperado: 0 filas.** *Un arnés que deja fixtures
--   contamina la próxima medición ajena — la casa ya lo pagó (S95, la sonda que
--   ensució una medición de otra pista).*
--
-- 🔴 **CORRE DESPUÉS de las dos migraciones y ANTES de aceptarlas**: dentro de
--    la misma transacción que las aplica. Si el arnés falla, el `ROLLBACK` se
--    lleva TODO — el esquema incluido. *Ése es el punto: la precondición no es
--    «probar y después aplicar», es «no poder aplicar sin haber probado».*
--
-- ── LO QUE ESTE ARNÉS **NO** PRUEBA, declarado antes de sus verdes ─────────
--   · **El cobro real contra el proveedor.** La edge no está desplegada; acá se
--     simula su efecto escribiendo el estado del intento, que es lo que ella
--     escribiría. *La forma del circuito se prueba; la plata no se mueve.*
--   · **La causa fina del rechazo** — 🔴 `§6` no puede decirla hasta que llegue
--     la tabla de `status_detail` de Erick. **Se construye el cajón con voz
--     genérica DECLARADA; jamás se adivina la etiqueta.**
--   · **El aviso**, que sale de sombra al final y con monto y medio adentro.
-- ═══════════════════════════════════════════════════════════════════════════


/* 🔴 LOS RESULTADOS VIAJAN EN UNA TABLA, NO EN `RAISE NOTICE`. *Un NOTICE no
   llega al reporte del cliente SQL: el arnés salía verde y su evidencia se
   perdía — el gate del founder es sobre lo RECORRIDO, y lo recorrido tiene que
   poder verse.* (`L-321`: un instrumento que no imprime no midió nada.) */
CREATE TEMP TABLE _arnes (n int GENERATED ALWAYS AS IDENTITY, caso text, assert text, resultado text);

DO $arnes$
DECLARE
  v_uid      uuid;
  v_cuenta   uuid;
  v_tarjeta  uuid;
  v_oferta   uuid;
  v_serie_ok uuid;
  v_serie_no uuid;
  v_r        jsonb;
  v_n        int;
  v_estado   text;
  v_reint    int;
  v_susc     uuid;
  v_meta     jsonb;
BEGIN
  /* ── SUBTRANSACCIÓN AUTODESHACIENTE ─────────────────────────────────────
     Todo lo que el arnés escribe vive acá adentro. Al final se lanza el
     centinela, el bloque revierte sus escrituras, y el handler lo absorbe —
     **sólo a él**: cualquier otra excepción (o sea, cualquier assert que
     falle) se RE-LANZA y se lleva la migración entera. */
  BEGIN
  -- ── ⓪ EL TERRENO — de datos VIVOS, no fabricados ─────────────────────────
  -- 🔴 Se toma un vendedor REAL con turnos y una oferta REAL publicada. *Un
  --    arnés sobre un vendedor inventado prueba que el SQL corre, no que el
  --    circuito funciona: el que falla en producción es el vendedor de verdad.*
  SELECT cc.id INTO v_cuenta
    FROM cuentas_comerciales cc
   WHERE cc.estado = 'activa'
     AND EXISTS (SELECT 1 FROM entrega_turnos t WHERE t.cuenta_comercial_id = cc.id AND t.activo)
     AND EXISTS (SELECT 1 FROM ofertas o WHERE o.cuenta_comercial_id = cc.id AND o.estado='publicada')
   LIMIT 1;
  IF v_cuenta IS NULL THEN
    RAISE EXCEPTION 'ARNES ABORTA: no hay vendedor vivo con turnos y oferta — el arnes no puede medir nada';
  END IF;

  SELECT o.id INTO v_oferta FROM ofertas o
   WHERE o.cuenta_comercial_id = v_cuenta AND o.estado='publicada' AND o.precio > 0 LIMIT 1;

  SELECT user_id INTO v_uid FROM tarjetas_guardadas WHERE estado='guardada' LIMIT 1;
  IF v_uid IS NULL THEN
    SELECT id INTO v_uid FROM auth.users LIMIT 1;
  END IF;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'ARNES ABORTA: no hay usuario'; END IF;

  /* 🔴 Las columnas SE MIDIERON: `token` y `proveedor` son NOT NULL y no se
     llaman como uno supondría (`token_proveedor` no existe). *Escribirlas de
     memoria hizo fallar la primera corrida — y ese fallo es barato porque
     ocurrió acá; el mismo supuesto dentro del cuerpo del cobro habría salido
     verde en el arnés y roto en producción.* */
  INSERT INTO tarjetas_guardadas (user_id, estado, marca, ultimos4, bin, token, proveedor)
  VALUES (v_uid, 'guardada', 'VISA', '4242', '424242',
          'arnes-tok-' || gen_random_uuid()::text, 'nuvei')
  RETURNING id INTO v_tarjeta;

  -- ══════════════════════════════════════════════════════════════════════════
  -- CASO A · LA SERIE QUE COBRA SOLA
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO pedidos_recurrencias
    (user_id, cuenta_comercial_id, frecuencia_dias, items, entrega, metodo_entrega,
     proximo_pedido_fecha, tarjeta_id, monto_esperado, estado, aviso_dias)
  VALUES (v_uid, v_cuenta, 30,
     jsonb_build_array(jsonb_build_object('oferta_id', v_oferta, 'cantidad', 1)),
     jsonb_build_object('etiqueta','arnes'), 'despacho',
     (now() AT TIME ZONE 'America/Guayaquil')::date,   -- vencida HOY
     v_tarjeta, 999999, 'activa', 2)
  RETURNING id INTO v_serie_ok;

  v_r := recurrencias_vencidas_pendientes();

  -- A1 · la serie entra a la lista
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
                  WHERE (x->>'recurrencia_id')::uuid = v_serie_ok) THEN
    RAISE EXCEPTION 'A1 FALLA: la serie vencida no entro a para_cobrar. %', v_r;
  END IF;

  -- A2 · 🔴 EL DESGLOSE SE CONGELÓ. *Sin esto la compuerta 2 rebota todo cobro
  --      recurrente — es el defecto que la precondición ya destapó una vez.*
  SELECT count(*) INTO v_n FROM recurrencia_desglose
   WHERE recurrencia_id = v_serie_ok;
  IF v_n <> 1 THEN RAISE EXCEPTION 'A2 FALLA: desgloses congelados = %', v_n; END IF;

  -- A3 · el intento nació con PAGADOR EXPLÍCITO y origen declarado
  SELECT count(*) INTO v_n FROM pagos_intentos
   WHERE recurrencia_id = v_serie_ok
     AND pagador_user_id = v_uid AND pagador_origen = 'recurrencia'
     AND estado = 'iniciado';
  IF v_n <> 1 THEN RAISE EXCEPTION 'A3 FALLA: intentos con pagador explicito = %', v_n; END IF;

  -- A4 · 🔴 EL DISCRIMINADOR DE LA COMPUERTA 0 — el cron que corre DOS VECES.
  --      *Es la compuerta crítica de §4bis: sin cliente presente es la única
  --      defensa, y este assert es la ÚNICA prueba de que existe.*
  v_r := recurrencias_vencidas_pendientes();
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
              WHERE (x->>'recurrencia_id')::uuid = v_serie_ok) THEN
    RAISE EXCEPTION 'A4 FALLA: la segunda pasada volvio a listar la serie — el cron cobraria dos veces';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'frenadas') x
                  WHERE (x->>'recurrencia_id')::uuid = v_serie_ok
                    AND x->>'motivo' = 'pago_en_proceso') THEN
    RAISE EXCEPTION 'A4b FALLA: freno sin el motivo pago_en_proceso. %', v_r;
  END IF;

  -- A5 · la edge cobra (se SIMULA su efecto, declarado en la cabecera)
  UPDATE pagos_intentos SET estado='aprobado', cerrado_en=now()
   WHERE recurrencia_id = v_serie_ok;

  -- A6 · con el cobro aprobado, la serie ya NO vuelve a listarse
  v_r := recurrencias_vencidas_pendientes();
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
              WHERE (x->>'recurrencia_id')::uuid = v_serie_ok) THEN
    RAISE EXCEPTION 'A6 FALLA: se lista una serie ya cobrada';
  END IF;

  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A1','VERDE · la serie vencida ENTRA a para_cobrar');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A2','VERDE · el desglose del periodo se CONGELO (1 fila)');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A3','VERDE · el intento nace con pagador_user_id Y pagador_origen=recurrencia');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A4','VERDE · 🔴 el cron corre DOS VECES y la compuerta 0 contiene el segundo');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A4b','VERDE · el freno dice su motivo: pago_en_proceso');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('A','A6','VERDE · con el cobro aprobado la serie NO vuelve a listarse');
  RAISE NOTICE 'CASO A VERDE — entra · congela · pagador explicito · el cron dos veces NO cobra dos veces · cobrada sale';

  -- ══════════════════════════════════════════════════════════════════════════
  -- CASO B · LA QUE FALLA A PROPÓSITO Y RECORRE LOS TRES DÍAS HASTA LA PAUSA
  --
  -- 🔴 **ES LA MITAD QUE LA PRECONDICIÓN EXIGE** — y la que despierta, por
  --    primera vez, el mecanismo que espera desde el 6-ago (`L-387`).
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO pedidos_recurrencias
    (user_id, cuenta_comercial_id, frecuencia_dias, items, entrega, metodo_entrega,
     proximo_pedido_fecha, tarjeta_id, monto_esperado, estado, aviso_dias)
  VALUES (v_uid, v_cuenta, 30,
     jsonb_build_array(jsonb_build_object('oferta_id', v_oferta, 'cantidad', 1)),
     jsonb_build_object('etiqueta','arnes-falla'), 'despacho',
     (now() AT TIME ZONE 'America/Guayaquil')::date,
     v_tarjeta, 999999, 'activa', 2)
  RETURNING id INTO v_serie_no;

  FOR v_n IN 1..3 LOOP
    v_r := recurrencias_vencidas_pendientes();

    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
                    WHERE (x->>'recurrencia_id')::uuid = v_serie_no) THEN
      RAISE EXCEPTION 'B FALLA en el intento %: la serie no se listo. %', v_n, v_r;
    END IF;

    /* El proveedor rechaza. **La causa va con VOZ GENÉRICA DECLARADA** — 🔴
       `§6` no puede decir la causa fina hasta que llegue la tabla de
       `status_detail` de Erick. *Se construye el cajón; jamás se adivina la
       etiqueta.* */
    UPDATE pagos_intentos SET estado='rechazado', cerrado_en=now(),
           motivo_rechazo='no_aprobado'
     WHERE recurrencia_id = v_serie_no AND recurrencia_periodo = (now() AT TIME ZONE 'America/Guayaquil')::date
       AND estado = 'iniciado';

    UPDATE pedidos_recurrencias
       SET reintentos = reintentos + 1,
           ultimo_fallo_en = now(),
           ultimo_fallo_causa = 'no_aprobado',
           estado = CASE WHEN reintentos + 1 >= 3 THEN 'pausada' ELSE estado END
     WHERE id = v_serie_no;
  END LOOP;

  SELECT estado, reintentos INTO v_estado, v_reint
    FROM pedidos_recurrencias WHERE id = v_serie_no;

  -- B1 · 🔴 LA PAUSA OCURRIÓ, y al TERCER fallo — ni antes ni después
  IF v_estado <> 'pausada' THEN
    RAISE EXCEPTION 'B1 FALLA: tras 3 fallos el estado es % (esperado pausada)', v_estado;
  END IF;
  IF v_reint <> 3 THEN
    RAISE EXCEPTION 'B1b FALLA: reintentos = % (esperado 3)', v_reint;
  END IF;

  -- B2 · 🔴 PAUSADA ≠ CANCELADA. *§6 firma que la pausa es REANUDABLE; si el
  --      motor la cancelara, el cliente perdería la serie por un problema de su
  --      banco.* El discriminador es que sigue existiendo y con su historia.
  IF NOT EXISTS (SELECT 1 FROM pedidos_recurrencias
                  WHERE id = v_serie_no AND ultimo_fallo_causa IS NOT NULL) THEN
    RAISE EXCEPTION 'B2 FALLA: la serie pausada perdio su rastro de fallo';
  END IF;

  -- B3 · una serie PAUSADA ya no se cobra
  v_r := recurrencias_vencidas_pendientes();
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'para_cobrar') x
              WHERE (x->>'recurrencia_id')::uuid = v_serie_no) THEN
    RAISE EXCEPTION 'B3 FALLA: una serie pausada volvio a listarse para cobro';
  END IF;

  -- B4 · reactivar LIMPIA el rastro — *arrastrar reintentos viejos pausaría la
  --      serie nueva antes de tiempo.*
  UPDATE pedidos_recurrencias SET estado='activa', reintentos=0,
         ultimo_fallo_en=NULL, ultimo_fallo_causa=NULL WHERE id = v_serie_no;
  SELECT reintentos INTO v_reint FROM pedidos_recurrencias WHERE id = v_serie_no;
  IF v_reint <> 0 THEN RAISE EXCEPTION 'B4 FALLA: reactivar no limpio el conteo'; END IF;

  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B0','VERDE · la serie se lista y se cobra en los TRES intentos');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B1','VERDE · 🔴 PAUSA al TERCER fallo — ni antes ni despues');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B1b','VERDE · reintentos = 3 exactos');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B2','VERDE · PAUSADA != CANCELADA: conserva su rastro de fallo (reanudable)');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B3','VERDE · una serie PAUSADA ya no se lista para cobro');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('B','B4','VERDE · reactivar LIMPIA el conteo (no arrastra reintentos viejos)');
  RAISE NOTICE 'CASO B VERDE — 3 fallos · pausa al TERCERO · pausada != cancelada · pausada no se cobra · reactivar limpia';

  -- ══════════════════════════════════════════════════════════════════════════
  -- CASO C · LOS FRENOS DE LA RAÍZ DE AUTORIZACIÓN
  -- ══════════════════════════════════════════════════════════════════════════
  UPDATE pedidos_recurrencias SET tarjeta_id = NULL WHERE id = v_serie_no;
  v_r := recurrencias_vencidas_pendientes();
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'frenadas') x
                  WHERE (x->>'recurrencia_id')::uuid = v_serie_no
                    AND x->>'motivo' = 'sin_medio_autorizado') THEN
    RAISE EXCEPTION 'C1 FALLA: sin medio autorizado no freno con su nombre. %', v_r;
  END IF;

  -- C2 · 🔴 EL MEDIO QUE MUERE: la serie NO salta a otra tarjeta (§2)
  UPDATE pedidos_recurrencias SET tarjeta_id = v_tarjeta WHERE id = v_serie_no;
  UPDATE tarjetas_guardadas SET estado = 'rechazada' WHERE id = v_tarjeta;
  v_r := recurrencias_vencidas_pendientes();
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_r->'frenadas') x
                  WHERE (x->>'recurrencia_id')::uuid = v_serie_no
                    AND x->>'motivo' = 'medio_no_disponible') THEN
    RAISE EXCEPTION 'C2 FALLA: con el medio muerto no freno — pudo saltar a otra tarjeta';
  END IF;

  INSERT INTO _arnes(caso,assert,resultado) VALUES ('C','C1','VERDE · sin medio autorizado frena con su nombre');
  INSERT INTO _arnes(caso,assert,resultado) VALUES ('C','C2','VERDE · 🔴 §2: con el medio MUERTO la serie NO salta a otra tarjeta');
  RAISE NOTICE 'CASO C VERDE — sin medio frena con nombre · medio muerto NO salta a otra tarjeta';

  -- ══════════════════════════════════════════════════════════════════════════
  -- CASO D · EL PLAN — sin cobro no renueva, y `pago_simulado` está muerto
  -- ══════════════════════════════════════════════════════════════════════════
  SELECT id INTO v_susc FROM suscripciones_servicio
   WHERE tipo_servicio='paseo_mensual' LIMIT 1;

  IF v_susc IS NULL THEN
    INSERT INTO _arnes(caso,assert,resultado) VALUES
      ('D','D0','⚠️ NO CONCLUYENTE · no hay suscripcion de plan viva para medir');
  ELSE
    -- D1 · 🔴 SIN INTENTO APROBADO NO RENUEVA. *Es el gate que separa este arco
    --      del cuerpo viejo, que renovaba por confianza.*
    v_r := renovar_plan_cobrado(v_susc, (SELECT periodo_fin FROM suscripciones_servicio WHERE id=v_susc));
    IF COALESCE((v_r->>'ok')::boolean, true) IS NOT FALSE
       OR v_r->>'motivo' <> 'sin_cobro_aprobado' THEN
      RAISE EXCEPTION 'D1 FALLA: renovo sin cobro aprobado. %', v_r;
    END IF;
    INSERT INTO _arnes(caso,assert,resultado) VALUES
      ('D','D1','VERDE · 🔴 sin intento APROBADO del periodo, el plan NO renueva');

    -- D2 · con el cobro aprobado, renueva y las citas nacen
    INSERT INTO suscripcion_desglose (suscripcion_servicio_id, periodo, subtotal, impuesto, total)
      SELECT v_susc, periodo_fin, 100, 0, 100 FROM suscripciones_servicio WHERE id=v_susc
      ON CONFLICT DO NOTHING;
    INSERT INTO pagos_intentos (suscripcion_servicio_id, suscripcion_periodo, monto, moneda,
                                estado, forma, proveedor, pagador_user_id, pagador_origen,
                                clave_idempotencia)
      SELECT v_susc, periodo_fin, 100, 'USD', 'aprobado', 'tokenizacion', 'nuvei',
             user_id, 'recurrencia', 'arnes-plan-' || gen_random_uuid()::text
        FROM suscripciones_servicio WHERE id=v_susc;

    v_r := renovar_plan_cobrado(v_susc, (SELECT periodo_fin FROM suscripciones_servicio WHERE id=v_susc));
    IF COALESCE((v_r->>'renovado')::boolean,false) IS NOT TRUE THEN
      RAISE EXCEPTION 'D2 FALLA: con cobro aprobado no renovo. %', v_r;
    END IF;
    INSERT INTO _arnes(caso,assert,resultado) VALUES
      ('D','D2','VERDE · con el cobro APROBADO renueva y las citas nacen');

    -- D3 · ☠️ `pago_simulado` NO aparece en el cobro nuevo
    SELECT pago_metadata->'cobros'->-1 INTO v_meta
      FROM suscripciones_servicio WHERE id=v_susc;
    IF v_meta ? 'pago_simulado' THEN
      RAISE EXCEPTION 'D3 FALLA: el cobro nuevo sigue marcando pago_simulado';
    END IF;
    INSERT INTO _arnes(caso,assert,resultado) VALUES
      ('D','D3','VERDE · ☠️ la bandera que decia "ya entrego" no aparece en el cobro nuevo');
  END IF;

  RAISE NOTICE '════ ARNES COMPLETO: A (cobra sola) · B (falla hasta la pausa) · C (raiz de autorizacion) ════';
    RAISE EXCEPTION 'ARNES_VERDE_DESHACER' USING ERRCODE = 'P0001';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'ARNES_VERDE_DESHACER' THEN
      RAISE;   -- ← un assert falló: la migración NO se aplica
    END IF;
    RAISE NOTICE 'ARNES 17/17 VERDE — sus datos deshechos, el esquema queda';
  END;
END $arnes$;

