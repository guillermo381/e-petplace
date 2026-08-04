-- S85-A · «QUIÉN CUIDA A ESTA VIDA» — la familia, POR MASCOTA
--
-- LETRA: `BIO_EXPEDIENTE` A3.5quater (firmada): **la familia NO es una franja de
-- DATOS — es parte del DETALLE de cada mascota.** ⇒ el lector es **por mascota**,
-- no por prestador. *Más angosto que el pedido original, y más honesto: el
-- prestador no tiene una relación con "las familias"; tiene una con cada vida
-- que cuida, y la familia aparece como respuesta a "¿quién cuida a ésta?".*
--
-- ── POR QUÉ UNA RPC Y NO UN `select` ───────────────────────────────────────
-- **MEDIDO (S85-A):** las policies de SELECT de `familia` son
-- `admin · creator · miembro`; las de `familia_miembro`,
-- `admin · misma_familia · mismo_user`. **NINGUNA nombra al prestador**, y un
-- prestador **no es miembro** de la familia ⇒ **no lee ni una fila**.
-- *No falta un wrapper: la puerta está cerrada en la RLS.* **Es el hueco §6.4.5
-- que S51 declaró y nadie había abierto.**
--
-- ── POR QUÉ DEFINER ANGOSTA Y NO UNA POLICY NUEVA ──────────────────────────
-- Una policy sobre `familia` concedería **la fila entera** — y se llevaría
-- `notas_internas` y `cuenta_comercial_id` de arrastre. *Es exactamente cómo
-- S79 descubrió que `prestadores_public` exponía el propósito del founder.*
-- **Molde: `obtener_contacto_reserva_cita` (S74)** — la casa ya resolvió así el
-- teléfono de quien reservó.
--
-- ── EL GATE ES EL MISMO QUE EL DEL EXPEDIENTE, Y ESO ES DELIBERADO ─────────
-- `user_acceso_clinico_a_mascota(p_mascota_id)` — **el mismo predicado que
-- `obtener_expediente_modulado`**. *Dos criterios de acceso al mismo expediente
-- se separan un día y nadie se entera; y el día que se separen, uno de los dos
-- va a conceder de más.*
--
-- ── LO QUE DEVUELVE, Y LO QUE **NO** ──────────────────────────────────────
-- Nombre de la familia + los miembros VIGENTES con su nombre y su rol.
-- **NO devuelve:** email, teléfono, `user_id`, `notas_internas`, ni miembros
-- dados de baja (`hasta IS NOT NULL`). *El contacto tiene su propio lector
-- gateado (`obtener_contacto_reserva_cita`) y no se duplica acá — un dato de
-- contacto que viaja "de paso" es el que nadie recuerda haber concedido.*
--
-- MEDIDO: 20/20 mascotas con `familia_id` · 16 familias · 14 miembros vigentes ·
-- un solo rol vivo (`adulto_titular`). *El rol viaja igual: el día que exista
-- `familiar_autorizado`, la superficie ya lo distingue sin tocar el motor.*
--
-- 76(g) — DECLARADA: NO RIGE. Función de solo lectura.
-- REVERSA escrita ANTES.

BEGIN;

CREATE OR REPLACE FUNCTION public.obtener_familia_de_mascota(p_mascota_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_fam uuid;
  v_nombre text;
  v_miembros jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT user_acceso_clinico_a_mascota(p_mascota_id) THEN RAISE EXCEPTION 'sin_acceso'; END IF;

  SELECT m.familia_id INTO v_fam FROM mascotas m WHERE m.id = p_mascota_id;

  /* Una mascota sin familia NO es un error: es un estado (las legadas del
     modelo viejo). Se devuelve `familia: null` y la superficie lo dice —
     jamás una lista vacía, que se leería como "familia sin miembros". */
  IF v_fam IS NULL THEN
    RETURN jsonb_build_object('familia', NULL, 'miembros', '[]'::jsonb);
  END IF;

  SELECT f.nombre INTO v_nombre FROM familia f WHERE f.id = v_fam;

  SELECT coalesce(jsonb_agg(jsonb_build_object('nombre', pr.nombre, 'rol', fm.rol)
                            ORDER BY fm.desde), '[]'::jsonb)
    INTO v_miembros
  FROM familia_miembro fm
  JOIN profiles pr ON pr.id = fm.user_id
  WHERE fm.familia_id = v_fam
    AND fm.hasta IS NULL;   -- solo VIGENTES: un ex-miembro no cuida a nadie

  RETURN jsonb_build_object('familia', v_nombre, 'miembros', v_miembros);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.obtener_familia_de_mascota(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.obtener_familia_de_mascota(uuid) TO authenticated;

COMMIT;
