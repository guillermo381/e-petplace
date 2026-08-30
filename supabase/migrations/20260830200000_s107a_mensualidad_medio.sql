/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA MENSUALIDAD NACE CON SU MEDIO AUTORIZADO — `D-886` no se repite
   ═══════════════════════════════════════════════════════════════════════════

   ── LO QUE SE CONSTRUYE Y LO QUE **NO**, y por qué ───────────────────────
   🔴 **NO se construye qué días cubre el plan ni el cobro:** *son decisión de
   mesa abierta* (L-V fijo · los días que ESE lugar opere · o el prestador los
   declara), **y esa firma decide qué cupo se compromete y cuánto vale el mes**.
   Adelantarla sería elegirla.

   ✅ **Sí se construye la RAÍZ DE AUTORIZACIÓN**, que es lo más grande y **no
   cambia con la decisión**: quién autorizó, cuándo, sobre qué medio y por
   cuánto.

   ── 🔴 `D-886` ES EL PRECEDENTE, Y ESTÁ VIVO HOY ─────────────────────────
   `suscripciones_servicio` (el plan de paseos) **no tiene columna de tarjeta**,
   así que `pagos-cobro-recurrente` **frena TODOS los planes** con
   `sin_medio_autorizado`. *Su conducta es la correcta —la alternativa sería
   adivinar cuál de las tarjetas de la persona autorizó una renovación que nadie
   registró— pero el plan lleva meses sin poder cobrarse por una columna que no
   se puso al nacer.*

   > ### Un plan que se renueva solo sin registrar quién autorizó ese cobro,
   > cuándo y sobre qué medio, **no tiene raíz de autorización: tiene una
   > costumbre.** *Y una costumbre no se puede mostrar ante un contracargo.*

   ⇒ **acá las cuatro columnas nacen con la tabla, `NOT NULL`**, y el productor
   las exige. **Una suscripción de guardería sin medio autorizado es
   INEXPRESABLE** — no hay orden de construcción que pueda dejarla a medias.

   ⚠️ **Cuatro, no las tres del molde.** `pedidos_recurrencias` tiene
   `tarjeta_id`, `autorizada_en` y `monto_esperado` — **le falta QUIÉN**. *Sobre
   una autorización, «cuándo» sin «quién» no alcanza: el titular de la tarjeta y
   el que apretó el botón pueden ser dos personas de la misma familia.*

   ── NACE INERTE (molde S91) ──────────────────────────────────────────────
   La tabla y su productor existen; **no hay reloj, no hay cobro y no se
   compromete cupo.** *El motor se enciende cuando la mesa firme los días — y
   encenderlo antes sería cobrar por un mes cuyo alcance nadie definió.*

   **76(g): NO RIGE.** Tabla nueva, sin backfill.
   **Reversa:** `S107-A-REVERSA-mensualidad-medio.sql` — declara que **borrar
   esto se lleva la raíz de autorización de cobros que ya ocurrieron.**
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE TABLE public.guarderia_suscripciones (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id            uuid NOT NULL REFERENCES public.familia(id) ON DELETE CASCADE,
  prestador_id          uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  prestador_servicio_id uuid NOT NULL REFERENCES public.prestador_servicios(id) ON DELETE CASCADE,
  /* La mascota puede fijarse o no: el paquete es del HOGAR y la mensualidad
     también. Si es NULL, se elige por estadía, como en el paquete. */
  mascota_id            uuid REFERENCES public.mascotas(id) ON DELETE SET NULL,

  /* ══ LA RAÍZ DE AUTORIZACIÓN — las CUATRO, y las cuatro NOT NULL ══════
     🔴 `NOT NULL` es la decisión: **una suscripción sin medio autorizado es
     inexpresable.** `D-886` existe porque en el plan de paseos esto se dejó
     para después, y «después» fue nunca. */
  tarjeta_id            uuid NOT NULL REFERENCES public.tarjetas_guardadas(id),
  /* QUIÉN — la columna que al molde le falta. *El titular de la tarjeta y el
     que apretó el botón pueden ser dos personas de la misma familia.* */
  autorizada_por        uuid NOT NULL REFERENCES auth.users(id),
  autorizada_en         timestamptz NOT NULL DEFAULT now(),
  /* CUÁNTO se autorizó. **No es el precio de hoy: es el techo del mandato.**
     Un cobro por encima de esto no está autorizado por esta firma. */
  monto_esperado        numeric(14,2) NOT NULL CHECK (monto_esperado > 0),

  /* El precio congelado al contratar, como en el paquete. Puede diferir de
     `monto_esperado` el día que la letra permita un tope distinto del precio. */
  precio_mensual        numeric(14,2) NOT NULL CHECK (precio_mensual > 0),

  estado                text NOT NULL DEFAULT 'activa'
                          CHECK (estado IN ('activa','pausada','cancelada','vencida')),
  /* El período pagado. `NULL` mientras no haya cobro — **y hoy NUNCA hay**,
     porque el motor no existe todavía. */
  periodo_desde         date,
  periodo_hasta         date,
  cancelada_en          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  /* Un cancelado sin fecha miente, y una fecha sin cancelado también. */
  CONSTRAINT chk_susc_cancelacion_coherente
    CHECK ((estado = 'cancelada' AND cancelada_en IS NOT NULL)
        OR (estado <> 'cancelada' AND cancelada_en IS NULL)),
  /* UNA suscripción viva por (familia, lugar). Renovar extiende; no se apilan. */
  CONSTRAINT uq_susc_viva_por_lugar UNIQUE (familia_id, prestador_id, estado)
);

CREATE INDEX idx_susc_guarderia_familia ON public.guarderia_suscripciones (familia_id, estado);

ALTER TABLE public.guarderia_suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY susc_guarderia_familia ON public.guarderia_suscripciones
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM familia_miembro fm
                  WHERE fm.familia_id = guarderia_suscripciones.familia_id
                    AND fm.user_id = auth.uid() AND fm.hasta IS NULL));
CREATE POLICY susc_guarderia_prestador ON public.guarderia_suscripciones
  FOR SELECT TO authenticated
  USING (public.user_gestiona_prestador(prestador_id) OR public.is_admin());

GRANT SELECT ON public.guarderia_suscripciones TO authenticated;

-- ══ EL PRODUCTOR — exige el medio, y por eso no puede nacer sin él ═══════
CREATE OR REPLACE FUNCTION public.contratar_mensualidad_guarderia(
  p_prestador_id uuid, p_tarjeta_id uuid,
  p_mascota_id uuid DEFAULT NULL, p_monto_esperado numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_auth uuid := auth.uid(); v_fam uuid; v_serv record; v_id uuid; v_dueno uuid;
BEGIN
  IF v_auth IS NULL THEN RAISE EXCEPTION 'auth_required' USING ERRCODE='42501'; END IF;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id=v_auth AND fm.hasta IS NULL LIMIT 1;
  IF v_fam IS NULL THEN RAISE EXCEPTION 'sin_familia' USING ERRCODE='22023'; END IF;

  /* 🔴 LA TARJETA TIENE QUE SER DE QUIEN AUTORIZA. *Autorizar un cobro
     recurrente sobre la tarjeta de otro es exactamente lo que la raíz de
     autorización existe para impedir.* */
  SELECT t.user_id INTO v_dueno FROM tarjetas_guardadas t WHERE t.id = p_tarjeta_id;
  IF v_dueno IS NULL THEN RAISE EXCEPTION 'tarjeta_no_existe' USING ERRCODE='22023'; END IF;
  IF v_dueno <> v_auth THEN RAISE EXCEPTION 'tarjeta_de_otra_persona' USING ERRCODE='42501'; END IF;

  SELECT ps.id, ps.precio_mensual_plan INTO v_serv
    FROM prestador_servicios ps
   WHERE ps.prestador_id=p_prestador_id AND ps.tipo_servicio='guarderia_dia' AND ps.activo;
  IF v_serv.id IS NULL THEN RAISE EXCEPTION 'guarderia_no_disponible' USING ERRCODE='22023'; END IF;
  IF v_serv.precio_mensual_plan IS NULL OR v_serv.precio_mensual_plan <= 0 THEN
    RAISE EXCEPTION 'no_ofrece_mensualidad' USING ERRCODE='22023';
  END IF;

  INSERT INTO guarderia_suscripciones (
    familia_id, prestador_id, prestador_servicio_id, mascota_id,
    tarjeta_id, autorizada_por, monto_esperado, precio_mensual)
  VALUES (v_fam, p_prestador_id, v_serv.id, p_mascota_id,
          p_tarjeta_id, v_auth,
          /* El techo del mandato: lo que se pida, o el precio de hoy. */
          COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
          v_serv.precio_mensual_plan)
  RETURNING id INTO v_id;

  /* ⚠️ CERO COBRO Y CERO CUPO: el motor de cobro y los días del plan **no
     existen todavía** (decisión de mesa abierta). Esto registra el MANDATO. */
  RETURN jsonb_build_object('ok', true, 'suscripcion_id', v_id,
    'precio_mensual', v_serv.precio_mensual_plan,
    'monto_esperado', COALESCE(p_monto_esperado, v_serv.precio_mensual_plan),
    'cobrada', false,
    'nota', 'mandato registrado — el cobro espera la firma de los dias del plan');
END $fn$;

REVOKE EXECUTE ON FUNCTION public.contratar_mensualidad_guarderia(uuid,uuid,uuid,numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.contratar_mensualidad_guarderia(uuid,uuid,uuid,numeric) TO authenticated;

-- ══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $cint$
DECLARE v_nn int; v_acl text;
BEGIN
  /* 🔴 EL DISCRIMINADOR: las CUATRO columnas de la raíz son NOT NULL. Si alguna
     admitiera nulo, `D-886` volvería a ser posible — una suscripción a medias
     que nadie nota hasta que hay que cobrarla. */
  SELECT count(*) INTO v_nn FROM information_schema.columns
   WHERE table_schema='public' AND table_name='guarderia_suscripciones'
     AND column_name IN ('tarjeta_id','autorizada_por','autorizada_en','monto_esperado')
     AND is_nullable='NO';
  IF v_nn <> 4 THEN
    RAISE EXCEPTION 'CINTURON: solo % de 4 columnas de la raiz son NOT NULL — D-886 vuelve a ser posible', v_nn;
  END IF;

  SELECT array_to_string(proacl,' ') INTO v_acl FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='contratar_mensualidad_guarderia';
  IF v_acl ILIKE '%anon=%' THEN RAISE EXCEPTION 'CINTURON: anon con EXECUTE (%)', v_acl; END IF;

  RAISE NOTICE 'CINTURON VERDE · las 4 columnas de la raiz son NOT NULL (una suscripcion sin medio autorizado es INEXPRESABLE) · anon fuera';
END
$cint$;

COMMIT;
