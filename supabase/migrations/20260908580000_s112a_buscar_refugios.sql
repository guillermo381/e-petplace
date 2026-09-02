-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · A6 · BUSCAR UN REFUGIO POR NOMBRE
--
-- Literal del founder: *«y en adopción puedo buscar un refugio por nombre y
-- ver sus animales»*. Lo segundo ya existía; **esto no existía** — medido por
-- C con control positivo: `ilike`/`textSearch` dan cero en `adopcion.ts` y
-- `prestador.ts`, y sí aparecen en despensa, así que el instrumento veía.
--
-- 🔴 **ES RPC Y NO UNA CONSULTA A LA VISTA, POR UNA RAZÓN DE PRODUCTO QUE C
-- NOMBRÓ ANTES DE QUE PASARA:** `v_prestadores_publicos` tiene clínicas,
-- paseadores y groomers. Si el recorte `tipo='refugio'` viviera en la
-- pantalla, esto sería **un directorio público de TODOS los prestadores,
-- buscable por nombre y sin sesión** — *no una fuga (la vista ya es pública)
-- sino una decisión de producto que nadie tomó*, y de las que se descubren
-- cuando alguien la usa. **El recorte vive acá, donde no se puede aflojar.**
--
-- 🟢 **ANÓNIMA**, con la firma de la vidriera: sin sesión se ve nombre, logo y
-- ciudad, **jamás teléfono, correo, dirección, cédula ni RUC**. Y como en el
-- editor: *no es que se filtren — no se pueden nombrar.*
--
-- 🟢 **DEVUELVE REFUGIOS SIN ANIMALES PUBLICADOS** (voto de C, y es el mismo
-- argumento con el que se eligió `obtenerPerfilesPublicosPorCuenta`): *un
-- buscador que sólo encuentra refugios con stock le esconde a la familia
-- justo a los que necesitan que los encuentren.*
--
-- ⚠️ **LOS ACENTOS: se cierra acá el hueco que `despensa-catalogo` dejó
-- declarado.** Su nota dice, textual, que *«término SIN acento contra dato CON
-- acento no se cubre desde el cliente — habría que quitarle los acentos a la
-- COLUMNA, y eso es unaccent en el servidor: motor»*. **Hoy el motor es esta
-- función**, así que se normalizan **los dos lados**. Sin `unaccent` (no está
-- instalada, medido): `translate` cubre el español entero y **no necesita una
-- extensión que después alguien tenga que recordar habilitar**.
--
-- 76(g) — NO RIGE: función nueva, sin backfill y sin anclas.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.buscar_refugios(
  p_texto text DEFAULT NULL,
  p_limite integer DEFAULT 20)
RETURNS TABLE(cuenta_comercial_id uuid, prestador_id uuid,
              nombre text, logo_url text, ciudad text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','pg_temp' AS $fn$
  WITH q AS (
    SELECT translate(lower(btrim(COALESCE(p_texto,''))),
                     'áéíóúüñÁÉÍÓÚÜÑ','aeiouunAEIOUUN') AS t
  )
  SELECT p.cuenta_comercial_id, p.id, p.nombre_comercial, p.foto_url, p.ciudad
    FROM prestadores p, q
   /* EL RECORTE, EN EL SERVIDOR. Las dos condiciones: es refugio Y está
      activo — un refugio suspendido no se busca. */
   WHERE p.tipo = 'refugio'
     AND p.estado = 'activo'
     AND (q.t = ''
          OR translate(lower(p.nombre_comercial),
                       'áéíóúüñÁÉÍÓÚÜÑ','aeiouunAEIOUUN') LIKE '%' || q.t || '%')
   ORDER BY p.nombre_comercial
   /* Techo duro: una búsqueda sin texto es el directorio entero, y un
      directorio sin límite crece con el éxito. */
   LIMIT LEAST(GREATEST(COALESCE(p_limite, 20), 1), 100);
$fn$;

REVOKE ALL ON FUNCTION public.buscar_refugios(text, integer) FROM PUBLIC;
/* 🟢 `anon` A PROPÓSITO, y es la única función de esta sesión que lo lleva:
   la vidriera de adopción es anónima por firma. Su lista blanca es lo que la
   hace segura, no la falta de permiso. */
GRANT EXECUTE ON FUNCTION public.buscar_refugios(text, integer) TO anon, authenticated;

-- ═══ CINTURÓN — rojos primero, con sus controles ═══
DO $c$
DECLARE v_n int; v_cols text;
BEGIN
  /* ① La lista blanca: lo prohibido NO SE PUEDE NOMBRAR. */
  v_cols := pg_get_function_result('public.buscar_refugios(text,integer)'::regprocedure);
  IF v_cols ~* '(telefono|whatsapp|email|correo|direccion|cedula|ruc|identificacion)' THEN
    RAISE EXCEPTION 'CINTURON: la lista blanca dejó entrar un dato de contacto — %', v_cols;
  END IF;

  /* ② 🔴 EL ROJO QUE IMPORTA: buscar el nombre de una CLÍNICA no la trae.
     Sin este brazo, un recorte roto daría el mismo verde en el positivo. */
  SELECT count(*) INTO v_n FROM public.buscar_refugios('Aurora');
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'CINTURON: el buscador devolvio % no-refugio(s) — es un directorio de prestadores', v_n;
  END IF;

  /* ③ El positivo: el refugio real aparece. */
  SELECT count(*) INTO v_n FROM public.buscar_refugios('satori');
  IF v_n < 1 THEN
    RAISE EXCEPTION 'CINTURON: el refugio real NO aparece — el buscador no encuentra nada';
  END IF;

  /* ④ Los acentos, en los DOS sentidos. Si el dato no tiene acentos hoy, el
     segundo brazo no puede fallar y se DICE, en vez de contarlo como verde. */
  IF EXISTS (SELECT 1 FROM prestadores
              WHERE tipo='refugio' AND nombre_comercial ~ '[áéíóúñÁÉÍÓÚÑ]') THEN
    RAISE NOTICE 'CINTURON: hay refugios con acento — el brazo sin-acento se ejerce';
  ELSE
    RAISE NOTICE 'CINTURON: ningun refugio tiene acento hoy — el brazo sin-acento NO se pudo ejercer';
  END IF;

  /* ⑤ El techo no se puede saltear. */
  IF (SELECT count(*) FROM public.buscar_refugios(NULL, 99999)) > 100 THEN
    RAISE EXCEPTION 'CINTURON: el techo de 100 no rige';
  END IF;

  RAISE NOTICE 'CINTURON VERDE: solo refugios, y el nombre de una clinica no los trae';
END $c$;
