/* ═══════════════════════════════════════════════════════════════════════════
   S112-A9d · EL CODIGO DE FIRMA NECESITA SU TIPO — Y SU CATEGORIA NO SE APAGA
   ───────────────────────────────────────────────────────────────────────────
   76(g) · VEDA: **NO RIGE.** Una fila de catalogo y un CHECK sobre una tabla
   con **0 filas que lo violen**, medido antes de escribirlo.

   🔴 DEFECTO MIO, ENCONTRADO POR E: `solicitar_codigo_firma` registra el tipo
   `codigo_firma_adopcion`, y ese tipo **no estaba en `cat_notificacion_tipos`**
   ⇒ la RPC muere con `tipo_desconocido` y **nadie puede firmar un acta**.
   *Daño cero y por la razon correcta: la excepcion revierte la RPC entera, asi
   que no quedaron codigos huerfanos.* El diseño estaba sano; le faltaba una fila.

   ── LA FILA COPIA A `cierre_cuenta_confirmado`, que es su precedente exacto:
      `seguridad_cuenta` · `audiencia=ambas` · `canal_forzado=email` ·
      `ignora_techo=true`. Cada uno tiene su razon y ninguna es de estilo:

      · **`seguridad_cuenta`** — GATE 1 la exime del memorial, y hace falta: el
        codigo es de la PERSONA, no de la mascota. Si el animal fallece a mitad
        del tramite, quien firma sigue necesitando su codigo.
      · **`audiencia=ambas`** — firman los dos, la familia y el refugio.
      · **`canal_forzado=email`** — no es preferencia, es REQUISITO. El codigo
        existe para probar que la persona controla ese correo; mandarlo por otro
        canal lo convierte en un paso mas.
      · **`ignora_techo`** — un codigo de firma que el techo descarta deja a
        alguien sin poder firmar y **sin saber por que**.

   ── 🔴 Y LO QUE E DESTAPO SIN BUSCARLO: `apagable_existencia = false` ESTABA
      DECLARADO Y NADA LO HACIA CUMPLIR.

      `cat_notificacion_categorias.seguridad_cuenta` dice `apagable_existencia:
      false`, pero `preferencia_efectiva` lee **primero** `user_notificacion_prefs`
      ⇒ una fila con `habilitada=false` gana igual. *Una propiedad declarada en
      un catalogo que ninguna puerta consulta protege a quien lee el catalogo,
      no a quien usa el producto* — es `L-439` con otra ropa.

      Medido: **0 filas la violan hoy**, asi que el CHECK entra sin backfill. El
      agujero era LATENTE, y su modo de falla es el peor: quien se apagara esa
      categoria **nunca recibiria el codigo de su propia firma, en silencio**.

      ⚠️ CRUCE DE TERRITORIO DECLARADO: `user_notificacion_prefs` es del modulo
      de mensajeria (D). Se toca porque protege directamente la firma y porque
      es un CHECK sobre 0 filas — pero **queda avisado a su dueño**, no tomado.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

INSERT INTO public.cat_notificacion_tipos
  (codigo, categoria, descripcion, en_sombra, activo, audiencia, canal_forzado, ignora_techo)
VALUES
  ('codigo_firma_adopcion', 'seguridad_cuenta',
   'El código de 8 dígitos para firmar un acta de adopción. Vence en 10 minutos.',
   false, true, 'ambas', 'email', true)
ON CONFLICT (codigo) DO UPDATE
  SET categoria = EXCLUDED.categoria, audiencia = EXCLUDED.audiencia,
      canal_forzado = EXCLUDED.canal_forzado, ignora_techo = EXCLUDED.ignora_techo,
      activo = true;

/* El CHECK que hace cumplir lo que el catalogo ya declaraba. Se escribe como
   `NOT EXISTS` contra el catalogo para que **la fuente siga siendo el catalogo**
   y no una lista copiada acá: el dia que otra categoria pase a no-apagable, el
   CHECK se entera solo. */
CREATE OR REPLACE FUNCTION public._categoria_es_apagable(p_categoria text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $fn$
  SELECT COALESCE((SELECT c.apagable_existencia FROM public.cat_notificacion_categorias c
                    WHERE c.codigo = p_categoria), true);
$fn$;
REVOKE ALL ON FUNCTION public._categoria_es_apagable(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public._categoria_es_apagable(text) TO authenticated;

DO $$ BEGIN
  ALTER TABLE public.user_notificacion_prefs
    ADD CONSTRAINT chk_no_apagar_lo_inapagable
    CHECK (habilitada OR public._categoria_es_apagable(categoria));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $cint$
DECLARE v_uid uuid; v_n int;
BEGIN
  -- ① ✅ POSITIVO PRIMERO (`L-482`): el tipo existe y con la forma acordada.
  SELECT count(*) INTO v_n FROM cat_notificacion_tipos
   WHERE codigo='codigo_firma_adopcion' AND categoria='seguridad_cuenta'
     AND audiencia='ambas' AND canal_forzado='email' AND ignora_techo AND activo;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'CINTURON ROJO ①: el tipo no quedo con la forma acordada';
  END IF;

  -- ② ✅ Y el consentimiento por defecto lo deja pasar por email.
  SELECT id INTO v_uid FROM auth.users LIMIT 1;
  IF NOT public.preferencia_efectiva(v_uid, 'seguridad_cuenta', 'email') THEN
    RAISE EXCEPTION 'CINTURON ROJO ②: el codigo de firma no pasaria el consentimiento';
  END IF;

  -- ③ 🔴 EL ROJO: apagarse `seguridad_cuenta` ya es INEXPRESABLE.
  BEGIN
    INSERT INTO user_notificacion_prefs (user_id, categoria, canal, habilitada)
    VALUES (v_uid, 'seguridad_cuenta', 'email', false)
    ON CONFLICT (user_id, categoria, canal) DO UPDATE SET habilitada = false;
    RAISE EXCEPTION 'CINTURON ROJO ③: se pudo apagar una categoria no apagable';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- ④ ✅ CONTROL: una categoria que SI es apagable sigue apagandose. Sin este
  --    brazo, un CHECK que rechazara todo habria pasado ③.
  INSERT INTO user_notificacion_prefs (user_id, categoria, canal, habilitada)
  VALUES (v_uid, 'comercial', 'email', false)
  ON CONFLICT (user_id, categoria, canal) DO UPDATE SET habilitada = false;
  DELETE FROM user_notificacion_prefs
   WHERE user_id=v_uid AND categoria='comercial' AND canal='email';

  RAISE NOTICE 'CINTURON A9d: 4 brazos verdes (1 rojo producido, 1 positivo primero, 1 control)';
END $cint$;

COMMIT;
