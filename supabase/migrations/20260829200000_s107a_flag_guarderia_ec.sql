/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · SE ENCIENDE LA GUARDERÍA EN ECUADOR — firma del founder, 29-ago
   ═══════════════════════════════════════════════════════════════════════════

   `country_config.services_enabled.guarderia` → **`true`**, sólo **EC**.

   ── 🔴 POR QUÉ EL CINTURÓN VERIFICA LA OFERTA ANTES DE ENCENDER ───────────
   El acta de traspaso dejó escrita la regla, y no es una formalidad:

   > *flag sin oferta = una ficha que abre a una lista vacía;
   >  oferta sin flag = guarderías que ninguna familia alcanza.*
   > **La oferta va PRIMERO.**

   **Medido contra el objeto antes de escribir esta migración** — Clínica
   Aurora: `$12,00/día` · mensual `$75` · **activa** · especies
   `["gato","perro"]` · **1 espacio** (capacidad 8) · **2 franjas** (recogida y
   devolución) · **1 paquete** (5 días / $40).

   ⇒ **la condición se cumple, y el cinturón la vuelve MECÁNICA en vez de
   prosa**: si mañana alguien re-aplica esto sobre una base sin oferta
   publicada, **aborta**. *Mismo molde que el gate de la vitrina de S78: un
   guard que vive en una migración no se olvida; una regla que vive en un acta,
   sí.*

   ── LO QUE ESTA MIGRACIÓN **NO** HACE ────────────────────────────────────
   · **No toca CO.** Nunca se encendió y su `is_active` es `false`.
   · **No crea ni activa ninguna oferta** — la de Aurora ya estaba publicada por
     su dueño, que es como tiene que ser.
   · **No toca código.** C verificó que la ficha vive en el camino de los
     activos y que las rutas están montadas: *el flag es el último acto, no el
     primero.*

   **76(g): NO RIGE.** Un UPDATE de una fila de configuración; sin backfill de
   datos de negocio y sin anclas que se muevan.
   **Reversa:** `docs/relevamientos/S107-A-REVERSA-flag-guarderia-ec.sql`, que
   declara que apagarlo **no cancela reservas ya hechas** — *un flag de vitrina
   esconde la puerta, no vacía la casa.*
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ══ ① LA PRECONDICIÓN, COMO CINTURÓN Y NO COMO NOTA ══════════════════════
DO $pre$
DECLARE
  v_ofertas int; v_espacios int; v_franjas int;
BEGIN
  SELECT count(*) INTO v_ofertas
    FROM public.prestador_servicios ps
    JOIN public.prestadores p ON p.id = ps.prestador_id
   WHERE ps.tipo_servicio = 'guarderia_dia' AND ps.activo AND p.estado = 'activo';

  SELECT count(*) INTO v_espacios FROM public.guarderia_espacios WHERE activo;
  SELECT count(*) INTO v_franjas  FROM public.guarderia_franjas  WHERE activo;

  IF v_ofertas = 0 THEN
    RAISE EXCEPTION 'PRECONDICION: no hay ninguna oferta de guarderia activa de un prestador activo. Encender el flag abriria una ficha a una lista vacia.';
  END IF;
  -- Una oferta sin lugar ni horario no se puede reservar: la familia llegaria
  -- a una pantalla que dice «sin cupo» todos los dias, que es peor que no verla.
  IF v_espacios = 0 OR v_franjas = 0 THEN
    RAISE EXCEPTION 'PRECONDICION: hay oferta pero sin con que operar (espacios=%, franjas=%)', v_espacios, v_franjas;
  END IF;

  RAISE NOTICE 'PRECONDICION OK · % oferta(s) activa(s) · % espacio(s) · % franja(s)', v_ofertas, v_espacios, v_franjas;
END
$pre$;

-- ══ ② EL FLAG ════════════════════════════════════════════════════════════
UPDATE public.country_config
   SET services_enabled = jsonb_set(services_enabled, '{guarderia}', 'true'::jsonb),
       updated_at = now()
 WHERE country_code = 'EC';

-- ══ ③ CINTURÓN — con discriminador: EC encendido Y CO intacto ════════════
DO $cint$
DECLARE
  v_ec text; v_co text; v_filas int;
BEGIN
  SELECT services_enabled->>'guarderia' INTO v_ec FROM public.country_config WHERE country_code='EC';
  SELECT services_enabled->>'guarderia' INTO v_co FROM public.country_config WHERE country_code='CO';

  IF v_ec IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CINTURON: EC no quedo encendido (guarderia=%)', coalesce(v_ec,'(ausente)');
  END IF;
  -- 🔴 EL DISCRIMINADOR: sin este brazo, un `jsonb_set` sin WHERE habria
  -- encendido los dos paises y el verde no lo habria notado.
  IF v_co IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'CINTURON: CO se movio y no debia (guarderia=%)', coalesce(v_co,'(ausente)');
  END IF;

  -- y que no se haya perdido ningun otro servicio del mismo jsonb
  SELECT count(*) INTO v_filas FROM public.country_config
   WHERE country_code='EC' AND services_enabled ? 'guarderia'
     AND jsonb_typeof(services_enabled) = 'object';
  IF v_filas <> 1 THEN
    RAISE EXCEPTION 'CINTURON: services_enabled de EC quedo mal formado';
  END IF;

  RAISE NOTICE 'CINTURON VERDE · EC guarderia=true · CO intacto en false';
END
$cint$;

COMMIT;
