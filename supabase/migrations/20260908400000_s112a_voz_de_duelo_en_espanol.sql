/* ═══════════════════════════════════════════════════════════════════════════
   S112-A · LA VOZ DE DUELO QUEDO EN INGLES PARA LOS DOS IDIOMAS
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.**

   🔴 DEFECTO MIO, DE LA MIGRACION ANTERIOR. Inserte el brazo nuevo con texto en
   español en **los dos** `CASE` —el `replace` matchea las dos veces— y despues
   quise corregir el segundo a ingles con un `regexp_replace` posicional.
   **El primer `CASE` es el INGLES** (`IF v_idioma = 'en' THEN`), asi que
   corregi el brazo equivocado y **las dos ramas quedaron en ingles**.

   Medido: `_voz_adopcion(..., 'Nube')` con idioma español devolvia
   *«Nube passed away»*.

   ── LO QUE LO HACE PEOR QUE UN TYPO: **es el aviso mas doloroso del vertical.**
      Una familia que postulo por un animal se entera de que murio, y se entera
      en un idioma que no eligio. *Un error de idioma en un aviso comercial es
      una molestia; en este es una falta de respeto.*

   ── Y LA CAUSA ES DE INSTRUMENTO, no de descuido: **conte las anclas (2) y no
      medi CUAL era CUAL.** Saber que hay dos no dice cual viene primero. Esta
      cura corrige por POSICION EXPLICITA —la segunda ocurrencia, calculada— y
      **su cinturon llama a la funcion con un usuario en cada idioma**, que es
      lo unico que distingue las dos ramas de verdad.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DO $fix$
DECLARE
  v_def text; v_nueva text; v_ing text; v_esp text; v_tmp text := '@@SWAP@@';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='_voz_adopcion';

  v_esp := 'coalesce(v_n || '' falleció'', ''El animal falleció''),' || chr(10) ||
           '        ''mensaje'', ''Tu postulación no va a poder continuar. Lamentamos mucho darte esta noticia.''';
  v_ing := 'coalesce(v_n || '' passed away'', ''The animal passed away''),' || chr(10) ||
           '        ''mensaje'', ''Your application cannot continue. We are very sorry to give you this news.''';

  /* 🔴 LOS DOS BRAZOS ESTAN CRUZADOS, medido leyendolos: el `CASE` INGLES —que
     viene PRIMERO, `IF v_idioma = 'en' THEN`— lleva el texto en español, y el
     español lleva el ingles. **No es que falte uno: estan al reves.**
     Se INTERCAMBIAN con un placeholder, que es la unica forma de cambiar A por
     B y B por A sin que el segundo replace deshaga el primero. */
  IF position(v_esp in v_def) = 0 OR position(v_ing in v_def) = 0 THEN
    RAISE NOTICE 'FIX: no estan los dos brazos — nada que intercambiar'; RETURN;
  END IF;

  v_nueva := replace(v_def, v_esp, v_tmp);
  v_nueva := replace(v_nueva, v_ing, v_esp);
  v_nueva := replace(v_nueva, v_tmp, v_ing);

  IF position(v_tmp in v_nueva) > 0 THEN
    RAISE EXCEPTION 'FIX: quedo el placeholder en el cuerpo — el intercambio salio mal';
  END IF;
  EXECUTE v_nueva;
END $fix$;

/* ═══ CINTURON — SE LLAMA A LA FUNCION CON UN USUARIO EN CADA IDIOMA ══════
   Contar anclas no dice cual es cual; llamarla, si. */
DO $cint$
DECLARE v_es uuid; v_en uuid; v_t_es text; v_t_en text; v_prev text;
BEGIN
  SELECT id INTO v_es FROM auth.users LIMIT 1;
  SELECT id INTO v_en FROM auth.users WHERE id <> v_es LIMIT 1;
  IF v_es IS NULL OR v_en IS NULL THEN
    RAISE EXCEPTION 'CINTURON: hacen falta dos usuarios — el brazo no puede dar verde por vacio';
  END IF;

  SELECT idioma INTO v_prev FROM user_preferencias WHERE user_id = v_en;
  INSERT INTO user_preferencias (user_id, idioma) VALUES (v_en, 'en')
    ON CONFLICT (user_id) DO UPDATE SET idioma = 'en';
  DELETE FROM user_preferencias WHERE user_id = v_es;   -- sin fila ⇒ default `es`

  v_t_es := public._voz_adopcion('adopcion_no_concretada_fallecimiento', v_es, 'Nube')->>'titulo';
  v_t_en := public._voz_adopcion('adopcion_no_concretada_fallecimiento', v_en, 'Nube')->>'titulo';

  -- ① 🔴 EL ROJO: en español NO dice «passed away».
  IF v_t_es !~ 'falleció' THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: la voz en español dice «%»', v_t_es;
  END IF;
  -- ② ✅ CONTROL POSITIVO: en ingles SI dice «passed away». Sin este brazo, una
  --    funcion que devolviera español SIEMPRE pasaria ①.
  IF v_t_en !~ 'passed away' THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: la voz en ingles dice «%»', v_t_en;
  END IF;
  -- ③ 🔴 Y NINGUNA de las dos invita a otro animal (D-3).
  IF (public._voz_adopcion('adopcion_no_concretada_fallecimiento', v_es, 'Nube')->>'mensaje')
       ~* '(otro animal|otras mascotas|adopta)'
     OR (public._voz_adopcion('adopcion_no_concretada_fallecimiento', v_en, 'Nube')->>'mensaje')
       ~* '(another animal|other pets|adopt)' THEN
    RAISE EXCEPTION 'CINTURON ROJO ③: la voz de duelo invita a otro animal';
  END IF;

  RAISE NOTICE 'CINTURON: 3 brazos verdes · es=«%» · en=«%»', v_t_es, v_t_en;

  DELETE FROM user_preferencias WHERE user_id = v_en;
  IF v_prev IS NOT NULL THEN
    INSERT INTO user_preferencias (user_id, idioma) VALUES (v_en, v_prev)
      ON CONFLICT (user_id) DO UPDATE SET idioma = v_prev;
  END IF;
END $cint$;

COMMIT;
