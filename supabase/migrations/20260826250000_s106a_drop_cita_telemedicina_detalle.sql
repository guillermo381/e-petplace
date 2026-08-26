-- ═══════════════════════════════════════════════════════════════════════
-- S106-A · 2f — MUERE `cita_telemedicina_detalle` (D-930)
-- ═══════════════════════════════════════════════════════════════════════
--
-- 🔴 **LA RAZÓN VA PRIMERO, PORQUE ES LO QUE EVITA QUE ALGUIEN LA REVIVA
-- POR PROLIJIDAD.** *«Estaba vacía» invita a llenarla. Lo que sigue, no.*
--
-- **Guardaba `token_prestador` y `token_cliente` como columnas de texto**, y
-- su policy `telemedicina_select` alcanzaba a
-- `user_tiene_acceso_a_mascota(mascota_id) OR pet_parent_id = auth.uid()`.
--
--   ⇒ **El dueño de la mascota podía leer el token del veterinario.**
--
-- **Daño hoy: CERO, y medido** — 0 filas, 0 funciones que la nombren, 0 FKs
-- entrantes. *No hubo incidente porque no hubo dato, no porque el modelo
-- estuviera bien.* (Lo midió D sobre el censo de A.)
--
-- Las otras tres razones, todas medidas:
--   ① Su `CHECK` de `proveedor` (`daily|whereby|zoom`, default `'daily'`)
--      **pre-decidía el transporte** — habría rebotado LiveKit, que es lo
--      que la mesa evaluaba. *Una tabla muerta que ya había votado.*
--   ② `grabacion_url` y `grabacion_consentida` **contradicen la firma ⓪ de
--      §7** (la teleconsulta NO se graba en v1). *Una columna que existe
--      invita a llenarse* — la clase «código latente» de `AVISO-DE-IA.md`.
--   ③ **Ninguna migración del monorepo la creaba** (`D-929`): vivía en la
--      base y no en el ledger. Los dos ledgers estaban perfectos y no la
--      explicaban.
--
-- ⚠️ **EL MODELO CORRECTO NO ES ESTA TABLA: es el mint por cita en la edge
-- function** — token de vida corta, emitido contra la pertenencia
-- verificada, que **nunca se persiste**. *Un token guardado en una fila
-- legible es un token que dura lo que dure la fila.*
--
-- ─── LA PRECONDICIÓN, CUMPLIDA ANTES DEL DROP ──────────────────────────
-- Lección S95-F: **lo que bloquea vive AFUERA.** Grep en los cinco repos
-- vecinos —`e-petplace-admin`, `e-petplace-prestadores`, `e-petplace-B`,
-- `e-petplace-C`, `e-petplace-sistema-pruebas`— y en «Manual de Marca»:
--
--   · **CERO consumidores reales.**
--   · Aparece solo en `database.types.ts` (generados) y en documentación
--     (`BIO_EXPEDIENTE` D13.6, actas, y una lista de tablas con FK a
--     `mascotas` en el sistema de pruebas — una LISTA, no un escritor).
--
-- 📌 **`BIO_EXPEDIENTE` D13.6 queda desactualizado por este acto** y se
-- enmienda en la misma tanda: la marca de teleconsulta la lleva la CITA
-- (`modalidad='telemedicina'`), que es lo que D13.6 ya decía en su segunda
-- mitad — lo que muere es la «tabla anexa» de su primera mitad.
--
-- ─── VEDA 76(g): **NO RIGE.** ──────────────────────────────────────────
-- Se dropea una tabla con **0 filas** y **0 referencias entrantes**. No hay
-- backfill, no hay anclas, no hay ventana de escritura que proteger.
--
-- ─── REVERSA ───────────────────────────────────────────────────────────
-- docs/relevamientos/2026-08-25-s106a-REVERSA-drop-cita-telemedicina-detalle.sql
-- Con el `CREATE` completo **generado desde el objeto**, y con la
-- advertencia de que resucitarla resucita el problema de los tokens.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── CINTURÓN ANTES DEL DROP — aborta con la tabla todavía viva ────────
-- *Una precondición que vive en un comentario se cumple mientras alguien la
-- lea.* Ésta aborta.
DO $antes$
DECLARE v_filas int; v_fks int; v_fns int;
BEGIN
  SELECT count(*) INTO v_filas FROM public.cita_telemedicina_detalle;
  IF v_filas <> 0 THEN
    RAISE EXCEPTION 'CINTURON: la tabla tiene % fila(s) — el censo dijo 0. NO se dropea con datos adentro', v_filas;
  END IF;

  SELECT count(*) INTO v_fks FROM pg_constraint
   WHERE confrelid = 'public.cita_telemedicina_detalle'::regclass;
  IF v_fks <> 0 THEN
    RAISE EXCEPTION 'CINTURON: % tabla(s) la referencian — apareció una FK entrante desde el censo', v_fks;
  END IF;

  SELECT count(*) INTO v_fns FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prosrc ILIKE '%cita_telemedicina_detalle%';
  IF v_fns <> 0 THEN
    RAISE EXCEPTION 'CINTURON: % función/es la nombran — apareció un consumidor desde el censo', v_fns;
  END IF;

  RAISE NOTICE 'CINTURON PREVIO OK — 0 filas, 0 FKs entrantes, 0 funciones. Se dropea.';
END
$antes$;

-- RESTRICT y no CASCADE: si algo la referencia, que FALLE. *Un CASCADE se
-- lleva puesto lo que el censo no vio, y en silencio.*
DROP TABLE public.cita_telemedicina_detalle RESTRICT;

-- ─── CINTURÓN DESPUÉS ──────────────────────────────────────────────────
DO $despues$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema='public' AND table_name='cita_telemedicina_detalle') THEN
    RAISE EXCEPTION 'CINTURON: la tabla sigue existiendo';
  END IF;

  -- Y la marca de §7 sigue viva por su camino verdadero: la CITA.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname='evento_cita_servicio_modalidad_check'
                    AND pg_get_constraintdef(oid) ILIKE '%telemedicina%') THEN
    RAISE EXCEPTION 'CINTURON: se dropeó la anexa y `modalidad` NO admite telemedicina — la marca quedaría sin casa';
  END IF;

  RAISE NOTICE 'CINTURON OK — tabla muerta, y la marca de §7 vive en evento_cita_servicio.modalidad';
END
$despues$;

COMMIT;
