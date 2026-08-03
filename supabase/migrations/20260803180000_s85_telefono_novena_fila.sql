-- S85-A · LA NOVENA FILA — la única de las nueve que se corrige
--
-- CONTEXTO MEDIDO (S85-A, antes de proponer nada). `profiles` tiene 24 filas
-- con teléfono: **15 ya en E.164 con su `+`** y **9 en el formato viejo**.
-- El plan original era backfillear las nueve usando `telefono_codigo_pais`.
--
--   🔴 **NO SE PUDO: `telefono_codigo_pais` es NULL en las NUEVE.**
--
-- *La mitad que el cierre de S84 daba por existente —"en `profiles` el país
-- vive en otro lado"— existía como COLUMNA y no como DATO.* Y `country_code`
-- no sirve: las nueve dicen `EC`, y derivar de ahí es justo lo que P21
-- prohíbe. **Ninguna de las nueve era resoluble por máquina.**
--
-- ⇒ Se preguntó, y el founder contestó las dos preguntas (3-ago):
--
--   ① *"3208408790 este es correcto"* → **esta fila**, y solo ésta.
--   ② *"Los 8 teléfonos de tus usuarios de prueba: dejarlos como están.
--      De acuerdo"* → **las otras ocho QUEDAN.** El backfill se cierra por
--      decisión, no por olvido (D-635). **Nadie las repara de oficio.**
--
-- LA CORRECCIÓN, que es de DOS cosas a la vez y conviene verlas separadas:
--   · le faltaba **un dígito** — `320848790` (9) → `3208408790` (10, que es
--     el largo de un celular colombiano);
--   · y le faltaba **el país** — queda `+573208408790`, E.164 entero, la ley
--     firmada el 2-ago.
--
-- ⚠️ NOTA DE BORDE, declarada y no escondida: la fila es de
-- `guillo381+8@gmail.com`, que el canon lista como **identidad de prueba**
-- (el pet parent de Thor y Zeus). *O sea: la novena también es una cuenta de
-- prueba — lo que la separa de las otras ocho no es la cuenta, es que lleva
-- un número REAL adentro.* Por eso se corrige y las otras no.
--
-- 76(g) — DECLARADA: **NO RIGE.** Un UNICO UPDATE keyed por `id` literal,
-- con predicado sobre el VALOR VIEJO: si alguien editó ese teléfono desde la
-- app entre que se midió y esto corre, **no se pisa nada y se dice**. No hay
-- ancla sobre datos móviles, no hay ventana de escritura expuesta.
--
-- REVERSA escrita ANTES:
--   docs/relevamientos/2026-08-03-s85a-REVERSA-telefono-novena-fila.sql
--
-- ⚠️ Y LA CONSECUENCIA QUE ESTA MIGRACIÓN DEJA VIVA (D-635): el guard de
-- `actualizarMiPerfil` todavía exige el formato VIEJO, porque endurecerlo
-- rompe `apps/cliente`. ⇒ **esta fila queda correcta según la ley y NO
-- re-guardable desde la app del cliente** hasta que D-635 se ejecute. Es un
-- estado declarado, no un accidente: el dato correcto vale más que la
-- simetría con un guard que ya sabemos viejo.

BEGIN;

DO $$
DECLARE
  v_antes    text;
  v_despues  text;
  v_tocadas  integer;
BEGIN
  SELECT telefono INTO v_antes
  FROM public.profiles
  WHERE id = 'dd024680-3d1c-4465-b38b-dedab45da037';

  IF v_antes IS NULL THEN
    RAISE EXCEPTION 'ANCLA ROTA: la fila dd024680-… no existe o no tiene teléfono. No escribo a ciegas.';
  END IF;

  UPDATE public.profiles
     SET telefono = '+573208408790'
   WHERE id = 'dd024680-3d1c-4465-b38b-dedab45da037'
     AND telefono = '320848790';          -- ← el predicado ES el valor medido
  GET DIAGNOSTICS v_tocadas = ROW_COUNT;

  SELECT telefono INTO v_despues
  FROM public.profiles
  WHERE id = 'dd024680-3d1c-4465-b38b-dedab45da037';

  IF v_tocadas = 0 THEN
    -- NO es éxito silencioso: el guard DICE contra qué midió (candidata #21).
    RAISE EXCEPTION
      'NO-OP: esperaba encontrar ''320848790'' y encontré ''%''. '
      'La fila cambió entre la medición y esta migración — NO la piso. '
      'Re-medí y decidí a mano.', v_despues;
  END IF;

  IF v_despues <> '+573208408790' THEN
    RAISE EXCEPTION 'el UPDATE corrió pero la fila quedó en ''%''.', v_despues;
  END IF;

  -- Contra-caso: las otras ocho NO se tocaron. Sin esto, un UPDATE sin WHERE
  -- daría el mismo verde en la fila que sí miramos.
  IF (SELECT count(*) FROM public.profiles
      WHERE telefono IS NOT NULL AND telefono <> '' AND telefono NOT LIKE '+%') <> 8 THEN
    RAISE EXCEPTION
      'ALCANCE ROTO: esperaba EXACTAMENTE 8 filas en formato viejo después de esto (9 − la novena) y hay %. '
      'Algo tocó filas que esta migración no nombra.',
      (SELECT count(*) FROM public.profiles
       WHERE telefono IS NOT NULL AND telefono <> '' AND telefono NOT LIKE '+%');
  END IF;

  RAISE NOTICE 'S85 OK — % → % · las otras ocho intactas.', v_antes, v_despues;
END $$;

COMMIT;
