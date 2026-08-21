-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ S101-C · SE CIERRA LA PUERTA VIEJA DE LOS SERVICIOS — `D-855`           ║
-- ║ ENTREGADA SIN APLICAR — pide firma.                                     ║
-- ║ Reversa: docs/relevamientos/2026-08-20-s101c-REVERSA-20260822050000.sql ║
-- ║ (escrita ANTES; declara que revertir REABRE D-855)                      ║
-- ║ Regla 76(g): NO RIGE — solo permisos, sin backfill, sin anclas.         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- ═══ 🔴 LA DEUDA, EN UNA LÍNEA ═════════════════════════════════════════════
--
-- `confirmar_cita_pagada(uuid)` es ejecutable por `authenticated` ⇒ **cualquiera
-- con una cuenta puede declarar pagada su propia cita sin que ninguna tarjeta se
-- toque.** La despensa cerró esa puerta en S101-B; servicios la tenía abierta.
--
-- > *La asimetría era la medida exacta de la deuda: el mismo producto, dos
-- > puertas, una con candado.*
--
-- ═══ 🔴 POR QUÉ RECIÉN AHORA, Y NO ANTES ═══════════════════════════════════
--
-- El orden estaba firmado: **`REVOKE` con el reemplazo listo, JAMÁS antes.**
-- Revocar sin puerta nueva **deja a los cuatro oficios sin poder reservar** —
-- paseo, grooming, veterinaria y adiestramiento comparten el MISMO checkout.
--
-- Y el reemplazo no se dio por listo cuando el arnés cobró una cita: se dio por
-- listo cuando **su consumidor real** —`components/checkout-reserva.tsx`, la
-- pantalla que montan los cuatro— dejó de llamar a esta RPC y pasó a cobrar por
-- `pagos-cobro`. *Un arnés puede estrenar la puerta nueva y dejar la vieja en
-- uso sin que nadie lo note: el productor se prueba desde su consumidor.*
--
-- ═══ 🔴 EL CENSO QUE HABILITA ESTO, con su instrumento declarado ═══════════
--
-- ① **Llamadores internos: CERO.** Medido sobre `pg_get_functiondef` **con los
--    comentarios eliminados** (L-170: un censo que no los quita lee un
--    comentario como código). Y el instrumento se probó contra un caso con
--    llamador conocido (`_pago_aprobado` → 2 llamadores) antes de creerle su
--    vacío. *Un instrumento que devuelve vacío sin haber probado que sabe
--    encontrar algo no midió nada.*
--
-- ② **Llamadores en la app: CERO** tras el enchufe. El único que quedaba era el
--    checkout de reserva.
--
-- ③ **Arneses de regresión (`scripts/verify-*.mjs`): los que la llaman van a
--    rebotar con 42501 — y eso es lo que queremos.** *Ese rebote es la
--    evidencia medible de que la puerta cerró; un arnés que sigue pasando
--    después de un REVOKE está probando otra cosa.*
--
-- ═══ 🔴 LO QUE ESTA MIGRACIÓN *NO* HACE ════════════════════════════════════
--
-- **No borra la función.** Sigue existiendo para `postgres`/`service_role`, y
-- ahí es donde tiene que quedar mientras las **138 citas con
-- `pago_simulado: true`** sigan siendo datos declarados del corte semilla/real.
-- *Borrarla dejaría sin explicación un pedazo de la historia de esas filas.*
--
-- **No toca las otras tres puertas simuladas** —plan de paseo, paquete de
-- salidas y programa de adiestramiento—, que **contratan por su propia RPC sin
-- tocar la tarjeta y lo DICEN en pantalla**. Siguen honestas; su enchufe es
-- trabajo aparte, con su propia letra. *Cerrar esta puerta no las cierra, y
-- decir que sí sería declarar seguro lo que no se midió.*

BEGIN;

-- ── ① EL CINTURÓN DE PRECONDICIÓN ─────────────────────────────────────────
-- 🔴 **Esto es lo que hace que el orden firmado sea mecánico y no una promesa.**
--    Si el reemplazo no está en pie, la migración **aborta con el agujero
--    todavía cerrado** en vez de dejar a los cuatro oficios sin reservar.
DO $$
DECLARE v_faltan text[] := '{}';
BEGIN
  -- El desglose congelado: sin él, `pagos-cobro` es fail-closed y no cobra.
  IF to_regclass('public.cita_desglose') IS NULL THEN
    v_faltan := v_faltan || 'tabla cita_desglose';
  END IF;

  -- El trigger que lo congela al reservar (cubre las SIETE puertas que
  -- insertan citas, y la octava que alguien escriba sin leer la letra).
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgrelid = 'public.evento_cita_servicio'::regclass
       AND NOT tgisinternal
       AND tgname LIKE '%desglose%'
  ) THEN
    v_faltan := v_faltan || 'trigger de congelado del desglose';
  END IF;

  -- El actuador: quien mueve la cita a `pagada` cuando el pago se confirma.
  IF to_regprocedure('public.aplicar_evento_de_pago(uuid)') IS NULL THEN
    v_faltan := v_faltan || 'aplicar_evento_de_pago';
  END IF;

  -- La lectura de acceso con usuario explícito: sin ella el cobro server-side
  -- no puede verificar pertenencia (auth.uid() es NULL con service_role).
  IF to_regprocedure('public.user_tiene_acceso_a_mascota_como(uuid,uuid)') IS NULL THEN
    v_faltan := v_faltan || 'user_tiene_acceso_a_mascota_como';
  END IF;

  IF array_length(v_faltan, 1) IS NOT NULL THEN
    RAISE EXCEPTION
      'S101-C: el REVOKE se aborta — el reemplazo NO está completo. Falta: %. '
      'Revocar sin puerta nueva deja a los cuatro oficios sin poder reservar.',
      array_to_string(v_faltan, ', ');
  END IF;
END $$;

-- ── ② EL REVOKE ───────────────────────────────────────────────────────────
-- 🔴 `PUBLIC` y `anon` van explícitos aunque S61 ya los haya sacado: **todo rol
--    hereda de PUBLIC**, y un revoke que deja PUBLIC intacto no cierra nada
--    (L-216, aprendida cerrando otra puerta que parecía cerrada).
REVOKE EXECUTE ON FUNCTION public.confirmar_cita_pagada(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.confirmar_cita_pagada(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_cita_pagada(uuid) FROM PUBLIC;

COMMENT ON FUNCTION public.confirmar_cita_pagada(uuid) IS
  'S54 · Confirma una cita contra un pago. 🔴 S101-C: REVOCADA de `authenticated`, '
  '`anon` y PUBLIC (D-855) — la puerta viva de los servicios es la Edge Function '
  '`pagos-cobro` con `cita_id`, que cobra de verdad y confirma por webhook. '
  'Se conserva para service_role: las 138 citas con metadata.pago_simulado la '
  'tienen como productor y borrarla dejaría esa historia sin explicación.';

-- ── ③ EL CINTURÓN DE SALIDA ───────────────────────────────────────────────
-- 🔴 Se mide por `has_function_privilege`, **jamás por `LIKE` sobre `proacl`**:
--    el ACL no dice quién hereda de PUBLIC, y un censo por texto ya abortó una
--    migración de seguridad con el agujero abierto.
DO $$
BEGIN
  IF has_function_privilege('authenticated','public.confirmar_cita_pagada(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'S101-C: `authenticated` TODAVÍA puede ejecutar confirmar_cita_pagada';
  END IF;
  IF has_function_privilege('anon','public.confirmar_cita_pagada(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'S101-C: `anon` TODAVÍA puede ejecutar confirmar_cita_pagada';
  END IF;

  -- 🔴 Y EL DISCRIMINADOR: que el cinturón sepa distinguir. Si
  --    `has_function_privilege` devolviera `false` para todo, los dos asserts
  --    de arriba pasarían sin medir nada.
  --    La vecina elegida es **la puerta del hold**: sin ella no hay reserva que
  --    pagar, así que su verde es a la vez discriminador y verificación de que
  --    reservar sigue vivo.
  --
  -- ⚠️ La firma va **medida, no escrita de memoria**: mi primera versión
  --    inventó `(uuid,uuid,date,time,integer,uuid)` y la real es la de abajo.
  --    Con la inventada, `to_regprocedure` devuelve NULL y **el discriminador
  --    pasa sin medir** — un verde flojo puesto justamente en el assert que
  --    existe para que no haya verdes flojos.
  IF to_regprocedure('public.crear_bloqueo_agenda(uuid,uuid,uuid,date,time without time zone,text,uuid)') IS NULL THEN
    RAISE EXCEPTION
      'S101-C: el discriminador no encuentra `crear_bloqueo_agenda` con la firma medida. '
      'Si la firma cambió, se re-mide: un discriminador que no resuelve no discrimina.';
  END IF;
  IF NOT has_function_privilege(
       'authenticated',
       'public.crear_bloqueo_agenda(uuid,uuid,uuid,date,time without time zone,text,uuid)',
       'EXECUTE') THEN
    RAISE EXCEPTION
      'S101-C: el cinturón no discrimina — `crear_bloqueo_agenda` también salió revocada. '
      'Sin la puerta del hold no hay reserva que pagar.';
  END IF;
END $$;

COMMIT;
