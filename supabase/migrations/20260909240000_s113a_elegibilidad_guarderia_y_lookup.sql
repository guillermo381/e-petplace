-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — ① la guardería pregunta por la vida · ③ el lookup de raza deja de
--            perder mascotas por una tilde
--
-- ── ① EL AGUJERO, MEDIDO Y CON SU ROJO ──────────────────────────────────────
-- 🔴 **VEINTE funciones consultan `_mascota_elegible_servicio` y
-- `_guarderia_puede_reservar` NO.** Censado por cuerpo en `pg_proc`, no por
-- nombre. Rojo producido sobre un caso real (L-459): **Sombra, perro, memorial
-- de verdad desde el 5-ago → `puede=true`**, mientras
-- `_mascota_elegible_servicio(Sombra,'guarderia')` ya devolvía `false`.
-- *La respuesta correcta existía en la casa y esta puerta no la pedía.*
--
-- ⚠️ **VA PRIMERO DE TODO, antes del gate sanitario.** No es orden estético:
-- preguntarle a una mascota que ya no está si tiene las vacunas al día produce
-- una lista de faltantes sobre alguien que no las necesita — *y esa lista es
-- exactamente lo que la familia no tiene por qué leer.* El motivo es
-- `mascota_no_elegible`, el mismo vocabulario que ya usan las hermanas.
--
-- ── ③ EL LOOKUP QUE PIERDE MASCOTAS POR UNA MAYÚSCULA ───────────────────────
-- `mascotas.raza` es TEXTO LIBRE (D-379: el catálogo sugiere, jamás impone) y
-- los lectores lo casan contra `cat_razas.nombre` con igualdad EXACTA. Medido:
-- una mascota real declara «Schnauzer miniatura» y el catálogo dice «Schnauzer
-- Miniatura» ⇒ **una mayúscula la deja sin su cara**. Y las 215 filas del
-- catálogo tienen acento o mayúscula interna, o sea que la superficie de
-- colisión es el catálogo entero.
--
-- Se resuelve con una columna GENERADA y no en cada consumidor, por la misma
-- razón de siempre: *dos normalizaciones distintas del mismo dato divergen, y
-- el día que una se arregle la otra sigue perdiendo mascotas.*
--
-- ⚠️ **`unaccent` NO está instalada** (medido) y no se instala para esto: es una
-- extensión que además **no es IMMUTABLE**, así que no puede sostener una
-- columna generada ni un índice. Se usa `translate` sobre las vocales del
-- español — determinista, inmutable y suficiente para el idioma en el que está
-- escrito este catálogo. *Se elige la herramienta que el problema necesita, no
-- la que suena más general.*
--
-- 76(g) — VEDA: NO RIGE. CREATE OR REPLACE de una función + columna generada.
-- Cero backfill (la generada se calcula sola), cero anclas.
-- ═══════════════════════════════════════════════════════════════════════════
begin;

-- ── ① ───────────────────────────────────────────────────────────────────────
create or replace function public._guarderia_puede_reservar(p_mascota_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public', 'pg_temp'
as $function$
DECLARE v_san jsonb; v_doc jsonb; v_familia uuid; v_duro boolean;
BEGIN
  /* 🔴 LA VIDA PRIMERO — S113-A. Antes de sanitario y antes de documentos:
     una mascota que ya no está no reserva, y **no se le arma una lista de
     vacunas faltantes para decírselo**. Doce hermanas ya preguntaban esto; ésta
     era la que faltaba. */
  IF NOT public._mascota_elegible_servicio(p_mascota_id, 'guarderia') THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'mascota_no_elegible');
  END IF;

  SELECT COALESCE((SELECT valor::boolean FROM app_config
                    WHERE clave = 'guarderia_gate_sanitario_duro'), false)
    INTO v_duro;

  v_san := public.evaluar_requisitos_guarderia(p_mascota_id);
  /* 🔴 SÓLO FRENA SI EL FLAG ESTÁ ENCENDIDO. Con el flag apagado el resultado
     **igual viaja** —en `sanitario`— para que el semáforo diga la verdad
     completa: *informar no es lo mismo que callar.* */
  IF v_duro AND v_san->>'estado' <> 'al_dia' THEN
    RETURN jsonb_build_object('puede', false, 'motivo', 'requisitos_sanitarios',
                              'faltantes', v_san->'faltantes');
  END IF;

  SELECT m.familia_id INTO v_familia FROM mascotas m WHERE m.id = p_mascota_id;
  v_doc := public.evaluar_documentos_guarderia(v_familia);
  IF v_doc->>'estado' <> 'al_dia' THEN
    /* El motivo se normaliza acá, en la fuente, y no en cada puerta: las dos
       puertas no pueden divergir. */
    RETURN jsonb_build_object('puede', false,
                              'motivo', CASE v_doc->>'estado'
                                          WHEN 'faltan' THEN 'documentos_sin_aceptar'
                                          ELSE v_doc->>'estado' END,
                              'faltantes', v_doc->'faltantes', 'sanitario', v_san);
  END IF;

  RETURN jsonb_build_object('puede', true, 'sanitario', v_san,
                            'gate_sanitario_duro', v_duro);
END $function$;

-- ── ③ ───────────────────────────────────────────────────────────────────────
alter table public.cat_razas
  add column if not exists nombre_norm text
  generated always as (
    lower(translate(nombre,
      'ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòùÂÊÎÔÛâêîôûÄËÏÖäëïö',
      'AEIOUUNaeiouunAEIOUaeiouAEIOUaeiouAEIOaeio'))
  ) stored;

comment on column public.cat_razas.nombre_norm is
  'El nombre en minúsculas y sin tildes, para que el lookup de mascotas.raza '
  '—que es texto libre— no pierda una mascota por una mayúscula. GENERADA: hay '
  'una sola definición de «igual» en toda la casa.';

create index if not exists idx_cat_razas_nombre_norm
  on public.cat_razas (especie, nombre_norm);

commit;
