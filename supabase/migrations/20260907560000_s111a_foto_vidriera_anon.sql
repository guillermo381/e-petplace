/* ═══════════════════════════════════════════════════════════════════════════
   S111-A · LA CARA DEL ADOPTABLE SE VE SIN CUENTA — la otra mitad de §4.
   ═══════════════════════════════════════════════════════════════════════════

   ── EL HUECO, MEDIDO POR C ANTES DE CABLEAR NADA ─────────────────────────
   Abrí `obtener_adoptables` a `anon` y **la mitad de la puerta seguía cerrada**:
   el bucket `mascotas` es privado y su única policy de SELECT es
   `TO authenticated`. `createSignedUrl` necesita ese SELECT ⇒ **para un anónimo
   no sale ninguna firma y TODAS las caras caen al fallback.**

   > ### §4 dice *«se presentan vidas, no inventario»*. Una grilla de siluetas grises con nombres **es** inventario.

   *Quien llega de una foto en Instagram y toca «ver mascotas en adopción» para
   encontrar doce siluetas se va peor que si nunca hubiéramos ofrecido la
   puerta.* **C midió esto y NO cableó la pantalla** — entregar la puerta a
   medias habría sido peor que no entregarla.

   ── 🔴 LA CURA OBVIA ERA UN AGUJERO ─────────────────────────────────────
   Abrir el bucket a `anon` expone **el álbum entero de la casa**: ahí viven las
   fotos de TODAS las mascotas, no sólo las publicadas. *Un `GRANT` ancho acá
   publica las caras de gente que nunca publicó nada.*

   ⇒ **Policy acotada a lo publicado**, y con la precisión que C pidió al
   escribirla: **mira la MASCOTA, no la carpeta.** Si mirara el path, el día que
   cambie la convención de carpetas **la vidriera se apagaría sola y nadie
   sabría por qué**. El molde ya existe: la policy vigente matchea
   `m.foto_url = objects.name`, y ésta usa el mismo camino.

   ── Y EL PREDICADO ES EL MISMO QUE EL DE LA FUNCIÓN, A PROPÓSITO ─────────
   `visible_en_vidriera` del catálogo + `publicacion.estado='publicada'`. *Las
   dos preguntas —«¿esta fila sale en la vidriera?» y «¿esta foto se puede
   ver?»— se contestan con la misma regla, así que no pueden divergir.*

   **76(g): NO RIGE.** Una policy nueva; cero DDL de datos, cero backfill.
   **Reversa:** `docs/relevamientos/S111-A-REVERSA-foto-vidriera.sql`, escrita
   ANTES; declara que **correrla apaga las caras sin dejar error**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE POLICY mascotas_select_vidriera_anon ON storage.objects
  FOR SELECT TO anon USING (
    bucket_id = 'mascotas'
    AND EXISTS (
      SELECT 1
        FROM public.mascotas m
        JOIN public.adopcion_publicacion p ON p.mascota_id = m.id AND p.estado = 'publicada'
        JOIN public.cat_estados_adopcion e ON e.estado = m.estado_adopcion AND e.visible_en_vidriera
       WHERE m.foto_url = objects.name));

DO $cint$
DECLARE v_n int; v_expr text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid) INTO v_expr FROM pg_policy
   WHERE polrelid='storage.objects'::regclass AND polname='mascotas_select_vidriera_anon';
  IF v_expr IS NULL THEN RAISE EXCEPTION 'CINTURON: la policy no se creo'; END IF;

  /* 🔴 EL BRAZO QUE IMPIDE LA VERSIÓN PELIGROSA: la policy tiene que mirar la
     PUBLICACIÓN. Una que sólo mire el bucket abriría el álbum entero. */
  IF v_expr NOT ILIKE '%adopcion_publicacion%' THEN
    RAISE EXCEPTION 'CINTURON: la policy de anon NO se acota a lo publicado — abre el album entero';
  END IF;
  /* Y NO tiene que mirar la carpeta: si mirara el path, cambiar la convención
     apagaría la vidriera en silencio. */
  IF v_expr ILIKE '%foldername%' THEN
    RAISE EXCEPTION 'CINTURON: la policy mira la CARPETA — el dia que cambie la convencion se apaga sola';
  END IF;
  IF v_expr NOT ILIKE '%foto_url%' THEN
    RAISE EXCEPTION 'CINTURON: la policy no matchea por foto_url — no sigue el molde vigente';
  END IF;

  /* CONTROL: la policy vieja de `authenticated` sigue viva. Sin este brazo, un
     verde acá no distinguiría «agregué una» de «reemplacé la que había». */
  SELECT count(*) INTO v_n FROM pg_policy
   WHERE polrelid='storage.objects'::regclass AND polname='mascotas_select_dueno_o_acceso';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: la policy de authenticated desaparecio (n=%)', v_n; END IF;

  /* Y que sea de `anon` y sólo de SELECT: una de escritura acá sería otra cosa. */
  SELECT count(*) INTO v_n FROM pg_policy p
   WHERE p.polrelid='storage.objects'::regclass AND p.polname='mascotas_select_vidriera_anon'
     AND p.polcmd = 'r';
  IF v_n <> 1 THEN RAISE EXCEPTION 'CINTURON: la policy nueva no es SELECT-only'; END IF;

  RAISE NOTICE 'CINTURON VERDE · la policy de anon existe, se acota a adopcion_publicacion (no al bucket entero), matchea por foto_url y NO por carpeta, es SELECT-only, y la policy de authenticated sigue viva';
END
$cint$;

COMMIT;
