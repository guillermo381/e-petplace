-- S84-A23 (b) · LA PROMOCIÓN MECÁNICA — con la traza que D-622 pidió.
--
-- FIRMADA 2-ago-2026. **(b) deja de ser la opción cara y pasa a ser el
-- ÚNICO camino:** el founder **no tiene acceso a la cuenta de Satori**, así
-- que la salida (a) —que el dueño cure su fila desde la pantalla— no existe
-- para esa fila.
--
-- ── POR QUÉ ESTO NO VIOLA P21 ────────────────────────────────────────
-- **El indicativo YA ESTÁ dentro del número.** Promover `573208408790` a
-- `+573208408790` **no infiere el país: lo lee del propio valor.** Lo que
-- P21 prohíbe es **derivarlo del `country_code` del perfil**, y eso sigue
-- prohibido — de hecho esta migración ni siquiera mira esa columna.
--
-- ── LA DIFERENCIA CON EL INTENTO ANTERIOR: LA TRAZA SOBREVIVE ────────
-- El intento de S84-A9b imprimía su tabla de trabajo con `RAISE NOTICE`
-- **y nadie la vio nunca**: `db query` devuelve FILAS, no el canal de
-- mensajes de Postgres. Cuando el cinturón abortó, la única evidencia de
-- qué había pasado se perdió con el `ROLLBACK`.
--
-- **Por eso esto va en CUATRO transacciones y no en una.** Una tabla
-- temporal —o una normal escrita dentro de la misma transacción— se
-- revierte con el aborto y deja el mismo silencio. **La traza se commitea
-- ANTES de mutar nada**, así que aborte donde aborte, queda escrito qué se
-- iba a tocar y por qué.
--
-- ── Y LA TRAZA REGISTRA LAS SIETE FILAS, NO SOLO LAS ALCANZADAS ──────
-- **Ése es el freno de la orden hecho instrumento:** si una fila cambia
-- **sin que el predicado la alcance**, la traza lo muestra —quedó grabada
-- con `alcanzada=false` y su `valor_antes`— y el paso 3 lo destapa
-- comparando. *Sin registrar las no-alcanzadas, D-622 reproducida sería
-- otra vez invisible.*
--
-- 76(g): **RIGE.** Alcance: `prestadores.telefono` y `.whatsapp`, solo
-- filas que cumplan el predicado. Anclas en `_traza_promocion_e164`.
-- REVERSA: `docs/relevamientos/2026-08-02-s84a-REVERSA-promocion-e164.sql`

-- ═══ PASO 1 · LA FOTO, COMMITEADA ANTES DE TOCAR NADA ═══════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public._traza_promocion_e164 (
  id            uuid,
  nombre        text,
  col           text,
  valor_antes   text,
  alcanzada     boolean,
  pais          text,
  propuesto     text,
  valor_despues text,
  momento       timestamptz DEFAULT now()
);
TRUNCATE public._traza_promocion_e164;

INSERT INTO public._traza_promocion_e164 (id, nombre, col, valor_antes, alcanzada, pais, propuesto)
SELECT p.id, p.nombre_comercial, c.col, c.valor,
       (m.propuesto IS NOT NULL), m.iso, m.propuesto
  FROM public.prestadores p
  CROSS JOIN LATERAL (VALUES ('whatsapp', p.whatsapp), ('telefono', p.telefono)) AS c(col, valor)
  LEFT JOIN LATERAL (
    -- el prefijo MÁS LARGO que el valor ya trae adentro, y SOLO si el país
    -- declara su formato y el E.164 resultante lo cumple (el mismo guard
    -- que (a′) usa en la pantalla: un nacional que arranca con los dígitos
    -- de un prefijo NO se promueve).
    SELECT cp.codigo_iso2 AS iso, '+' || c.valor AS propuesto
      FROM public.cat_paises cp
     WHERE c.valor IS NOT NULL AND c.valor <> '' AND c.valor !~ '^\+'
       AND c.valor ~ ('^' || regexp_replace(cp.prefijo_telefono, '\D', '', 'g'))
       AND cp.formato_telefono IS NOT NULL AND cp.formato_telefono <> ''
       AND ('+' || c.valor) ~ cp.formato_telefono
     ORDER BY length(regexp_replace(cp.prefijo_telefono, '\D', '', 'g')) DESC
     LIMIT 1
  ) m ON true;

COMMIT;

-- ═══ PASO 2 · LA ESCRITURA, con su cinturón ═════════════════════════
BEGIN;

UPDATE public.prestadores p
   SET whatsapp = t.propuesto
  FROM public._traza_promocion_e164 t
 WHERE p.id = t.id AND t.col = 'whatsapp' AND t.alcanzada;

UPDATE public.prestadores p
   SET telefono = t.propuesto
  FROM public._traza_promocion_e164 t
 WHERE p.id = t.id AND t.col = 'telefono' AND t.alcanzada;

DO $$
DECLARE v_sucias int; v_seed int;
BEGIN
  -- ninguna promovida quedó fuera de E.164
  SELECT count(*) INTO v_sucias
    FROM public.prestadores p JOIN public._traza_promocion_e164 t ON t.id = p.id
   WHERE t.alcanzada
     AND ((t.col='whatsapp' AND p.whatsapp !~ '^\+[1-9][0-9]{6,14}$')
       OR (t.col='telefono' AND p.telefono !~ '^\+[1-9][0-9]{6,14}$'));
  IF v_sucias <> 0 THEN RAISE EXCEPTION 'quedaron % promovidas fuera de E.164', v_sucias; END IF;

  -- ② LAS NO-ALCANZADAS NO SE TOCAN — y esta vez el guard verifica ESO,
  --    no la existencia de un literal.
  --
  -- ⚠️ LA VERSIÓN ANTERIOR DE ESTE CINTURÓN ERA LA CAUSA DE D-622, y se
  -- deja escrito porque el error es instructivo: preguntaba
  -- `count(*) WHERE whatsapp = '3208408790'` y exigía 1, con el mensaje
  -- *"la fila sin indicativo cambió"*. **Verificaba la EXISTENCIA DE UN
  -- VALOR y decía que verificaba un CAMBIO.** Cuando el founder curó esa
  -- fila desde la app —cosa perfectamente legítima—, el literal dejó de
  -- existir, el guard gritó, y su mensaje me hizo concluir que la
  -- migración había tocado la fila. **Nunca la tocó.**
  --
  -- *Un guard correcto con un mensaje que induce la conclusión equivocada
  -- cuesta lo mismo que un guard roto: costó una ficha 🔴 y un turno.*
  --
  -- Lo que rige ahora se apoya en la TRAZA, que sí sabe qué era cada fila
  -- antes: ninguna fila NO alcanzada por el predicado puede haber cambiado.
  SELECT count(*) INTO v_seed
    FROM public._traza_promocion_e164 t
    JOIN public.prestadores p ON p.id = t.id
   WHERE NOT t.alcanzada
     AND (CASE t.col WHEN 'whatsapp' THEN p.whatsapp ELSE p.telefono END)
         IS DISTINCT FROM t.valor_antes;
  IF v_seed <> 0 THEN
    RAISE EXCEPTION 'D-622: % fila(s) NO alcanzadas cambiaron — VER public._traza_promocion_e164', v_seed;
  END IF;
END $$;

COMMIT;

-- ═══ PASO 3 · EL DESPUÉS, y EL FRENO DE LA ORDEN ════════════════════
BEGIN;

UPDATE public._traza_promocion_e164 t
   SET valor_despues = CASE t.col WHEN 'whatsapp' THEN p.whatsapp ELSE p.telefono END
  FROM public.prestadores p
 WHERE p.id = t.id;

-- ⚠️ EL FRENO HECHO CÓDIGO: una fila que NO fue alcanzada por el predicado
-- y aun así CAMBIÓ es D-622 reproducida. Vale más que las cuatro curas, así
-- que aborta y deja la traza escrita para leerla.
DO $$
DECLARE v_fantasma int;
BEGIN
  SELECT count(*) INTO v_fantasma FROM public._traza_promocion_e164
   WHERE NOT alcanzada AND valor_despues IS DISTINCT FROM valor_antes;
  IF v_fantasma <> 0 THEN
    RAISE EXCEPTION 'D-622 REPRODUCIDA: % fila(s) cambiaron SIN que el predicado las alcance. La traza está en public._traza_promocion_e164', v_fantasma;
  END IF;
END $$;

COMMIT;

-- ═══ PASO 4 · VALIDATE — la condición de muerte de D-619 ════════════
-- Si pasa, no queda pasado ilegal y D-619 muere. Si aborta, DICE que
-- todavía hay filas que no cumplen (③: la que no matchea ningún prefijo
-- queda como está, declarada — jamás adivinada).
DO $$
BEGIN
  ALTER TABLE public.prestadores VALIDATE CONSTRAINT chk_prestadores_whatsapp_e164;
  ALTER TABLE public.prestadores VALIDATE CONSTRAINT chk_prestadores_telefono_e164;
  RAISE NOTICE 'VALIDATE OK';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'VALIDATE rebotó: queda pasado que no cumple';
END $$;
