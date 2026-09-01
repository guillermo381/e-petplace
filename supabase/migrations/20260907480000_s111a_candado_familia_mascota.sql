/* ═══════════════════════════════════════════════════════════════════════════
   S111-A · PASO ⓪ — EL CANDADO: `mascotas.familia_id` deja de escribirse
   desde la app. El traspaso va por RPC del motor. (`D-989`)
   ═══════════════════════════════════════════════════════════════════════════

   ── EL HECHO, EJERCIDO Y NO RAZONADO (sonda de S110-A) ───────────────────
   `mascotas_update_familia` tiene `USING` y `WITH CHECK` = **la misma
   expresión**, `user_es_familiar_adulto_de_mascota(id)`.

   > ### Toma el `id` de la mascota, **no su `familia_id`**. No puede ver a dónde va la fila.

   Y no es un descuido de la expresión: la función **re-lee `mascotas` por
   `id`**, así que bajo el snapshot de la sentencia ve **la fila VIEJA**. El
   destino nuevo nunca entra en la evaluación.

   | caso medido | resultado |
   |---|---|
   | mover `familia_id` hacia una familia **AJENA** | 🔴 **PASA** (`filas=1`, quedó escrito) |
   | hacia la **PROPIA** | PASA |

   ── POR QUÉ UN TRIGGER Y NO UN `WITH CHECK` MEJOR ───────────────────────
   Un `WITH CHECK` **no puede ver `OLD`**: puede validar que el destino sea
   legítimo, pero no puede decir *«esta columna no se cambia desde acá»*. Y la
   mesa firmó lo segundo: **el traspaso va por RPC del motor**, porque el
   traspaso no es un `UPDATE` — es un acto que además **escribe un evento de
   transferencia, cierra el acceso viejo y deja al refugio como procedencia
   permanente**. *Un camino que puede hacer la mitad del acto es peor que
   ninguno: deja la mascota movida y el expediente mudo.*

   ⇒ Molde de la casa: `_prestadores_protege_columnas` (`D-389`). Los DEFINER
   pasan porque corren como su dueño y `current_user <> 'authenticated'`.

   ── 🔴 SIN EXENCIÓN PARA `is_admin()`, y es deliberado ───────────────────
   El molde de `prestadores` exime al admin de casi todo **salvo de su cláusula
   del emblema**, que dice literal *«ni el prestador ni el admin lo editan;
   corregirlo exige una migración, que es un acto versionado»*. **Acá rige esa
   forma, no la laxa**, por la misma razón: un admin moviendo una mascota con
   un `UPDATE` suelto la mueve **sin evento de transferencia**, y el expediente
   queda diciendo que siempre estuvo ahí. *El agujero que esto cierra no es de
   permisos: es de RASTRO.*

   ── POR QUÉ CERRARLA ES GRATIS, MEDIDO ──────────────────────────────────
   **Cero funciones escriben `mascotas.familia_id`** (censo de S110-D) ⇒ **no
   hay escritor legítimo que quede afuera**. Y del lado de los datos: 83
   mascotas, **51 con `user_id` NULO y 32 con `user_id` no nulo**.
   ⚠️ *Ese par venía reportado AL REVÉS y se corrigió midiéndolo.*

   ── ⚠️ EL LÍMITE DE LA SONDA DE S110, Y CÓMO SE CIERRA ACÁ ──────────────
   Aquella sonda usó un actor que era **además el `user_id`** de la mascota, así
   que **no aislaba cuál de las dos ramas** de `user_es_familiar_adulto_de_mascota`
   dejaba pasar (la de `familia_miembro` o el brazo legacy `m.user_id = auth.uid()`).
   Se sugirió repetirla con un familiar que no fuera el `user_id`.
   🔴 **Medido: ese actor NO EXISTE en datos reales.** Ninguna familia tiene dos
   adultos activos (`0`), y las 32 mascotas con adulto activo en su familia
   tienen `user_id` **= ese mismo adulto** (`0` con adulto distinto).

   🔴 **Y al sembrarlo apareció el hallazgo que cierra el límite de verdad:**
   ese actor **no puede ver la mascota**. Ninguna policy de SELECT de `mascotas`
   usa el predicado de familiar adulto —sólo `codueño`, `prestador con acceso` y
   `admin`— y un `UPDATE ... WHERE` necesita LEER la fila.
   > ### La rama de `familia_miembro` de la policy de UPDATE es HOY letra muerta: quien la cumple no puede leer la fila que lo autorizaría a escribir.
   ⇒ **La puerta que S110 midió abierta se abre por la rama codueño/dueño**, que
   es la de las 32 mascotas reales. El cinturón produce SU rojo ahí, y mide la
   otra rama como **hallazgo con su brazo de caducidad**: si algún día esa
   lectura existe, el arnés lo grita en vez de seguir en verde.

   ── 76(g): NO RIGE ───────────────────────────────────────────────────────
   Un trigger nuevo, sin DDL de datos y **sin backfill**. El cinturón corre en
   subtransacción que se deshace sola (`L-406`) y no ancla snapshots.
   **Reversa:** `docs/relevamientos/S111-A-REVERSA-candado-familia.sql`,
   escrita ANTES; declara que **correrla REABRE la puerta**.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE OR REPLACE FUNCTION public._mascotas_protege_familia()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public','pg_temp' AS $$
BEGIN
  /* `current_user <> 'authenticated'` ⇒ es un DEFINER del motor (corre como su
     dueño) o una migración. Ésos SÍ pasan: son el camino que la mesa firmó.
     🔴 SIN exención de `is_admin()` — ver la cabecera: el agujero es de RASTRO,
     y un admin también deja el expediente mudo si mueve con un UPDATE suelto. */
  IF current_user = 'authenticated'
     AND NEW.familia_id IS DISTINCT FROM OLD.familia_id THEN
    RAISE EXCEPTION 'familia_no_se_cambia_desde_la_app' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public._mascotas_protege_familia() IS
  'S111-A · D-989. `familia_id` no se escribe desde la app: el traspaso es un ACTO (evento + cierre de acceso + procedencia), no un UPDATE. Los DEFINER del motor pasan.';

DROP TRIGGER IF EXISTS trg_mascotas_protege_familia ON public.mascotas;
CREATE TRIGGER trg_mascotas_protege_familia
  BEFORE UPDATE ON public.mascotas
  FOR EACH ROW EXECUTE FUNCTION public._mascotas_protege_familia();

-- ══ CINTURÓN — EL ROJO PRIMERO, sobre la rama que SÍ es alcanzable ═══════
/* 🔴 ESTE CINTURÓN SE REESCRIBIÓ DESPUÉS DE FALLAR, y el fallo fue el hallazgo.
   Mi primera versión sembraba un segundo adulto de familia y esperaba que su
   UPDATE rebotara. **Dio `filas=0` y ninguna excepción.** Medido en vez de
   supuesto: `predicado=true`, `current_user=authenticated`, y aun así **la
   mascota era INVISIBLE** para ese actor.
   La causa, medida contra `pg_policy`: **ninguna policy de SELECT de `mascotas`
   usa el predicado de familiar adulto** — sólo `codueño`, `prestador con
   acceso` y `admin`. Y un `UPDATE ... WHERE` necesita LEER la fila.

   > ### ⇒ La rama de `familia_miembro` de `mascotas_update_familia` es HOY INALCANZABLE: quien la cumple no puede ver la fila que la policy lo autorizaría a escribir.

   *Un permiso de escritura sobre algo que no podés leer no es un permiso: es
   letra muerta esperando que alguien agregue la policy de lectura que falta.*
   ⇒ El rojo que importa es el de la rama **codueño/dueño directo**, que es la
   que la sonda de S110 ejerció de verdad — y es la de las 32 mascotas reales.
   La rama familiar se mide igual, como HALLAZGO y no como rojo. */
DO $cint$
DECLARE
  v_rol text := current_user;
  v_masc uuid; v_fam uuid; v_ajena uuid; v_duenio uuid; v_segundo uuid;
  v_rojo boolean; v_msg text; v_nombre text; v_n int; v_visible int;
BEGIN
  SELECT m.id, m.familia_id, m.user_id, m.nombre INTO v_masc, v_fam, v_duenio, v_nombre
    FROM mascotas m
   WHERE m.familia_id IS NOT NULL AND m.user_id IS NOT NULL
     AND public._user_es_codueño_mascota(m.id, m.user_id)
   LIMIT 1;
  IF v_masc IS NULL THEN RAISE EXCEPTION 'CINTURON: sin sujeto real alcanzable'; END IF;

  SELECT f2.id INTO v_ajena FROM familia f2 WHERE f2.id <> v_fam LIMIT 1;
  IF v_ajena IS NULL THEN RAISE EXCEPTION 'CINTURON: sin familia ajena'; END IF;

  -- El actor del HALLAZGO se resuelve ACÁ, con el rol de la migración.
  SELECT u.id INTO v_segundo FROM auth.users u
   WHERE u.id <> v_duenio
     AND NOT EXISTS (SELECT 1 FROM familia_miembro x WHERE x.user_id=u.id AND x.familia_id=v_fam)
   LIMIT 1;

  BEGIN   -- ← subtransacción: TODO lo que sigue se deshace solo (L-406)
    EXECUTE format('SET LOCAL request.jwt.claims = %L',
                   json_build_object('sub', v_duenio, 'role','authenticated')::text);
    SET LOCAL ROLE authenticated;

    -- CONTROL: el actor VE la fila. Sin esto, un `filas=0` se leería como
    -- «el candado funcionó» cuando en realidad nadie llegó a la puerta.
    SELECT count(*) INTO v_visible FROM mascotas WHERE id = v_masc;
    IF v_visible <> 1 THEN
      RAISE EXCEPTION 'CINTURON: el actor no VE la mascota (n=%) — el rojo no probaria nada', v_visible;
    END IF;

    -- ══ ROJO · LA PUERTA QUE LA SONDA DE S110 MIDIÓ ABIERTA, AHORA CERRADA ══
    v_rojo := false;
    BEGIN
      UPDATE mascotas SET familia_id = v_ajena WHERE id = v_masc;
    EXCEPTION WHEN OTHERS THEN v_rojo := true; v_msg := SQLERRM; END;
    IF NOT v_rojo OR v_msg NOT LIKE 'familia_no_se_cambia_desde_la_app%' THEN
      RAISE EXCEPTION 'CINTURON ROJO: la puerta SIGUE ABIERTA (rojo=%, msg=%)', v_rojo, v_msg;
    END IF;
    IF (SELECT familia_id FROM mascotas WHERE id = v_masc) <> v_fam THEN
      RAISE EXCEPTION 'CINTURON ROJO: reboto y escribio igual';
    END IF;

    -- ══ VERDE ① · LO LEGÍTIMO SIGUE PASANDO ═════════════════════════════
    /* 🔴 SIN ESTE BRAZO EL CANDADO NO SE DISTINGUE DE ROMPER LA EDICIÓN.
       *Un guard que frena todo también frena lo que había que dejar pasar, y su
       rojo se lee exactamente igual de bien.* */
    UPDATE mascotas SET nombre = v_nombre WHERE id = v_masc;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'CINTURON VERDE-1: el candado se comio la edicion legitima (filas=%)', v_n;
    END IF;

    -- ══ HALLAZGO · la rama familiar, medida y declarada (no es un rojo) ══
    /* `auth.users` NO la lee `authenticated` (42501): el actor se busca ANTES,
       con el rol de la migración. *Un arnés que se queda sin permisos a mitad
       reporta el error del arnés como si fuera del sujeto.* */
    IF v_segundo IS NOT NULL THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      INSERT INTO familia_miembro (familia_id, user_id, rol) VALUES (v_fam, v_segundo, 'adulto_autorizado');
      EXECUTE format('SET LOCAL request.jwt.claims = %L',
                     json_build_object('sub', v_segundo, 'role','authenticated')::text);
      SET LOCAL ROLE authenticated;
      IF NOT public.user_es_familiar_adulto_de_mascota(v_masc) THEN
        RAISE EXCEPTION 'CINTURON HALLAZGO: el actor sembrado no cumple el predicado';
      END IF;
      SELECT count(*) INTO v_visible FROM mascotas WHERE id = v_masc;
      IF v_visible <> 0 THEN
        RAISE EXCEPTION 'CINTURON HALLAZGO: la rama familiar SI ve la fila (n=%) — el analisis de la cabecera esta VENCIDO y hay que re-medir', v_visible;
      END IF;
    END IF;

    -- ══ VERDE ② · EL CAMINO DEL MOTOR SIGUE ABIERTO ═════════════════════
    EXECUTE format('SET LOCAL ROLE %I', v_rol);
    UPDATE mascotas SET familia_id = v_ajena WHERE id = v_masc;
    IF (SELECT familia_id FROM mascotas WHERE id = v_masc) <> v_ajena THEN
      RAISE EXCEPTION 'CINTURON VERDE-2: el motor tampoco puede mover — la puerta nueva nace cerrada';
    END IF;

    RAISE EXCEPTION 'CINTURON_OK_ROLLBACK';
  EXCEPTION
    WHEN OTHERS THEN
      EXECUTE format('SET LOCAL ROLE %I', v_rol);
      IF SQLERRM <> 'CINTURON_OK_ROLLBACK' THEN RAISE; END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE · ROJO: la rama codueno/dueno (la que S110 midio ABIERTA) queda BLOQUEADA, con control de visibilidad previo · VERDE-1: la edicion legitima del nombre SIGUE pasando · HALLAZGO: la rama familiar pura NO VE la fila (cero policy de SELECT la cubre) ⇒ es letra muerta, y el guard la cubre igual · VERDE-2: el motor (DEFINER) SI mueve';
END
$cint$;

COMMIT;
