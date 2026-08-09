-- ══════════════════════════════════════════════════════════════════════════
-- S92-A · B3+B4 — LAS CUATRO TABLAS SIN RLS, LOS CONSENTIMIENTOS Y LA AUDITORÍA
--
-- Cierra los hallazgos ①, ⑤, ⑥ y ⑨ del censo de S90 — los únicos que quedaban
-- abiertos de los nueve probados— y con ellos la parte de D-686 que de verdad
-- muerde.
--
-- ── DECLARACIÓN 76(g) · VEDA ──────────────────────────────────────────────
-- **NO RIGE.** DCL + un `ALTER TABLE … ENABLE ROW LEVEL SECURITY`. Sin
-- backfill, sin anclas: no se computa ningún snapshot sobre datos vivos. **No
-- se borra ni se modifica una sola fila** — ni siquiera las 14 de la traza (ver
-- abajo por qué se conservan).
--
-- ── EL HALLAZGO QUE VUELVE TRATABLE A D-686 ───────────────────────────────
-- El barrido parecía inabarcable: **861 grants de escritura para `anon` sobre
-- 217 tablas**. Medido de nuevo desde el otro lado, se ordena solo: **solo
-- CUATRO tablas de `public` no tienen RLS**, y son exactamente estas. En las
-- otras 213 la RLS es la defensa y funciona (por eso D-686 era 🟠 y no 🔴). *El
-- número grande describía el síntoma; el número chico es el trabajo.*
--
-- ── ① `_traza_promocion_e164` — EL ÚNICO DONDE EL DATO YA ESTÁ AFUERA ────
-- ROJO REPRODUCIDO por camino real como `anon`: **HTTP 200 y filas visibles**,
-- con teléfonos E.164 completos en `valor_despues`. Sin RLS, con CRUD entero
-- para `anon` ⇒ cualquiera con la app instalada podía leerlos **y borrarlos**.
-- CENSO DE IMPACTO: **cero funciones la mencionan, cero triggers, cero
-- consumidores en el árbol versionado.** Es una traza histórica de una
-- migración de teléfonos que quedó viva y sin dueño.
-- **Las 14 filas NO se borran acá**: borrar datos es freno 3 del arranque y
-- necesita palabra del founder. Lo que esta migración hace es CERRAR LA PUERTA;
-- el destino de las filas queda como deuda con su disparo.
--
-- ── ⑤ LOS TRES CATÁLOGOS — Y LA TRAMPA DECLARADA DE ESTA TANDA ───────────
-- `cat_bancos`, `cat_paises`, `cat_tipos_documento_titular` tenían las SIETE
-- privilegios para `anon`. S90 lo probó mutando de verdad: `DELETE FROM
-- cat_bancos` → 17 filas, `UPDATE cat_paises SET nombre='POISON'` → 23.
-- **PERO la pantalla de registro los LEE SIN SESIÓN.** Por eso se revoca
-- INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER **y se CONSERVA el SELECT**:
-- revocarlo dejaría a la gente sin poder registrarse *y el typecheck no diría
-- nada*. Es la trampa que S90 dejó escrita, y acá está esquivada a propósito.
-- Quien los escribe de verdad son funciones `SECURITY DEFINER`
-- (`actualizar_datos_bancarios`, `actualizar_datos_fiscales_cuenta`,
-- `crear_cuenta_comercial_inicial`), que no necesitan estos grants.
--
-- ── ⑥ `consentimientos` — se otorga, no se edita ─────────────────────────
-- `anon` tenía las siete privilegios y la policy de INSERT es `WITH CHECK true`.
-- **El INSERT se CONSERVA** (aceptar términos antes de tener cuenta es un flujo
-- legítimo y su policy es deliberada), pero **UPDATE, DELETE y TRUNCATE se
-- van**: *un consentimiento se otorga; no se borra ni se reescribe.* Un registro
-- legal que el interesado puede editar no prueba nada.
--
-- ── ⑨ `audit_log` — un audit log que el auditado puede borrar no es un audit log
-- `anon` **y** `authenticated` tenían CRUD completo sobre la bitácora. Se les
-- revoca toda la escritura. Los cuatro escritores reales son `SECURITY DEFINER`
-- (`log_admin_action`, los dos `_trg_otorgar_acceso_por_cita_*`,
-- `simular_cliente_otorga_acceso_prestador`) y siguen escribiendo igual: una
-- DEFINER no usa los grants del que la llama. El SELECT no se toca — sus dos
-- policies lo gobiernan.
--
-- Reversa: `docs/relevamientos/2026-08-08-s92a-REVERSA-tanda5-tablas-sin-rls.sql`
--          (lleva la advertencia más fuerte de la sesión: revertir REEXPONE
--           teléfonos reales)
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ══ ① LA TRAZA DE TELÉFONOS ══════════════════════════════════════════════
-- RLS encendida SIN policies: con RLS activa y cero policies, nadie que no sea
-- owner o BYPASSRLS ve una sola fila. Es la forma más angosta de cerrarla sin
-- borrar nada.
ALTER TABLE public._traza_promocion_e164 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public._traza_promocion_e164 FROM anon, authenticated;

COMMENT ON TABLE public._traza_promocion_e164 IS
  'S92: traza histórica de la promoción a E.164. CERRADA (RLS on, sin policies, sin grants a roles de cliente) tras medirse legible y borrable por anon con 14 filas de teléfonos reales. Cero consumidores. El destino de las filas es decisión del founder — esta tabla no se borra desde una migración de permisos.';

-- ══ ⑤ LOS TRES CATÁLOGOS — escritura fuera, LECTURA INTACTA ══════════════
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.cat_bancos FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.cat_paises FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.cat_tipos_documento_titular FROM anon, authenticated;

-- el SELECT se re-concede EXPLÍCITAMENTE. No es redundante: deja escrito que
-- la lectura pública es una DECISIÓN y no un resto, que es la diferencia que
-- D-686 vino a marcar.
GRANT SELECT ON public.cat_bancos TO anon, authenticated;
GRANT SELECT ON public.cat_paises TO anon, authenticated;
GRANT SELECT ON public.cat_tipos_documento_titular TO anon, authenticated;

-- ══ ⑥ CONSENTIMIENTOS — se otorga, no se edita ═══════════════════════════
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.consentimientos FROM anon, authenticated;

-- ══ ⑨ AUDIT_LOG — la escritura vuelve a ser solo de las DEFINER ══════════
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.audit_log FROM anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- EL CINTURÓN
-- ══════════════════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE
  v_traza_grants int;
  v_traza_rls boolean;
  v_escritura int;
  v_lectura int;
  v_filas int;
BEGIN
  -- (a) la traza: RLS encendida y sin un solo grant de cliente
  SELECT relrowsecurity INTO v_traza_rls FROM pg_class WHERE relname = '_traza_promocion_e164';
  IF NOT v_traza_rls THEN
    RAISE EXCEPTION 'CINTURÓN (a): la traza sigue SIN RLS';
  END IF;
  SELECT count(*) INTO v_traza_grants FROM information_schema.role_table_grants
   WHERE table_schema='public' AND table_name='_traza_promocion_e164'
     AND grantee IN ('anon','authenticated','PUBLIC');
  IF v_traza_grants > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (a2): la traza conserva % grants de rol de cliente', v_traza_grants;
  END IF;

  -- (b) ningún rol de cliente escribe los catálogos, consentimientos ni la auditoría
  SELECT count(*) INTO v_escritura FROM information_schema.role_table_grants
   WHERE table_schema='public'
     AND table_name IN ('cat_bancos','cat_paises','cat_tipos_documento_titular','audit_log')
     AND grantee IN ('anon','authenticated','PUBLIC')
     AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE');
  IF v_escritura > 0 THEN
    RAISE EXCEPTION 'CINTURÓN (b): quedan % grants de escritura sobre catálogos/auditoría', v_escritura;
  END IF;

  -- (c) EL BRAZO QUE PROTEGE EL REGISTRO — la trampa declarada de S90.
  --     Los tres catálogos DEBEN conservar SELECT para anon. Si este brazo
  --     salta, la migración habría dejado a la gente sin poder registrarse, y
  --     ningún typecheck lo diría.
  SELECT count(*) INTO v_lectura FROM information_schema.role_table_grants
   WHERE table_schema='public'
     AND table_name IN ('cat_bancos','cat_paises','cat_tipos_documento_titular')
     AND grantee='anon' AND privilege_type='SELECT';
  IF v_lectura <> 3 THEN
    RAISE EXCEPTION 'CINTURÓN (c): esperaba SELECT de anon en los 3 catálogos, hay % — el registro quedaría roto', v_lectura;
  END IF;

  -- (d) y NADA se borró: las 14 filas de la traza siguen ahí
  SELECT count(*) INTO v_filas FROM public._traza_promocion_e164;
  IF v_filas < 14 THEN
    RAISE EXCEPTION 'CINTURÓN (d): la traza tiene % filas y tenía 14 — esta migración NO borra datos', v_filas;
  END IF;

  RAISE NOTICE 'CINTURÓN VERDE — traza cerrada (RLS on, 0 grants, % filas intactas) · 0 escrituras de cliente en catálogos y auditoría · los 3 catálogos conservan su SELECT anon', v_filas;
END
$cinturon$;

COMMIT;
