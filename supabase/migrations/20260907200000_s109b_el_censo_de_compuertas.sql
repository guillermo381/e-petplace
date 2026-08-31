/* ═══════════════════════════════════════════════════════════════════════════
   S109-B · EL CENSO DE COMPUERTAS — la lección del día, hecha mecanismo

   🔴 DE DÓNDE SALE. Un cobro real (`DF-2108181`, $90) mostró que
   `verificar_compuerta_programa` existía, funcionaba, y **`pagos-cobro` nunca le
   preguntaba**. La plata se movió y el acto 2 se cayó.

   > **Abrir una puerta nueva obliga a cablear su COMPUERTA, no sólo su desglose
   > y su pertenencia.**

   *Y la lección no alcanza escrita: la escribí en S108-B2 curando la mensualidad
   y la volví a romper en S109 abriendo el programa. **El más expuesto a repetir
   la lección es el que acaba de pagarla, porque cree que ya la sabe.*** Por eso
   esta migración no agrega una nota: agrega una OBLIGACIÓN.

   LA FORMA: el catálogo de sujetos pasa a exigir que cada uno declare su
   compuerta **o por qué no tiene**, con un CHECK que hace el silencio
   inexpresable. Un octavo sujeto **no se puede insertar sin contestar** — igual
   que el `never` de `cobrarSujeto` no deja compilar un sujeto sin rama.

   ⚠️ Y `cobrable_por_checkout` separa dos preguntas que no son la misma: la
   recurrencia tiene compuerta y **no la llama esta edge** porque no se cobra
   desde un checkout. *Un censo que exigiera lo mismo a los siete daría un rojo
   permanente que nadie podría curar, y un rojo que no se puede apagar se
   aprende a ignorar.*

   Veda 76(g): NO RIGE — columnas nuevas sobre un catálogo de 7 filas, sin
   backfill de datos de negocio y sin anclas.
   ═══════════════════════════════════════════════════════════════════════════ */

ALTER TABLE cat_sujetos_de_pago
  ADD COLUMN IF NOT EXISTS compuerta text,
  ADD COLUMN IF NOT EXISTS compuerta_ausente_porque text,
  ADD COLUMN IF NOT EXISTS cobrable_por_checkout boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN cat_sujetos_de_pago.compuerta IS
  'Función que decide si este sujeto SE PUEDE cobrar, ANTES de mover plata. '
  'Si es NULL, `compuerta_ausente_porque` explica por qué — el CHECK no admite '
  'las dos vacías ni las dos llenas.';
COMMENT ON COLUMN cat_sujetos_de_pago.cobrable_por_checkout IS
  'false = este sujeto no se cobra desde `pagos-cobro` (lo cobra el lazo '
  'recurrente). El censo no le exige que la edge lo llame.';

/* ── LOS SIETE, MEDIDOS UNO POR UNO CONTRA `pg_proc` ────────────────────── */
UPDATE cat_sujetos_de_pago SET compuerta='verificar_compuertas_pre_cobro'
 WHERE codigo='pedido';
UPDATE cat_sujetos_de_pago SET compuerta='verificar_compuerta_programa'
 WHERE codigo='programa';
UPDATE cat_sujetos_de_pago SET compuerta='verificar_compuertas_mensualidad_guarderia'
 WHERE codigo='mensualidad_guarderia';
UPDATE cat_sujetos_de_pago SET compuerta='verificar_compuerta_plan'
 WHERE codigo='suscripcion_servicio';
UPDATE cat_sujetos_de_pago SET compuerta='verificar_compuertas_recurrencia',
       cobrable_por_checkout=false
 WHERE codigo='recurrencia';

/* La cita y el bono NO tienen función de compuerta, y eso se DECLARA en vez de
   quedar como un hueco que el próximo censo vuelve a descubrir. */
UPDATE cat_sujetos_de_pago SET compuerta_ausente_porque=
  'Los frenos de la cita viven inline en `pagos-cobro` (hold vigente, monto '
  'contra `cita_desglose`, pertenencia). No se extrajeron a función: el sujeto '
  'es anterior al patrón. 🟡 Deuda declarada, no hueco.'
 WHERE codigo='cita';
UPDATE cat_sujetos_de_pago SET compuerta_ausente_porque=
  'El bono se frena inline: `pago_expira_en` vencido y `bono_desglose` '
  'congelado obligatorio. Es saldo, no agenda — no hay cupo ni fecha que '
  'pueda dejar de caber, que es lo que las compuertas de programa y '
  'mensualidad protegen. 🟢 Ausencia por naturaleza del sujeto.'
 WHERE codigo='bono';

ALTER TABLE cat_sujetos_de_pago DROP CONSTRAINT IF EXISTS chk_sujeto_declara_su_compuerta;
ALTER TABLE cat_sujetos_de_pago
  ADD CONSTRAINT chk_sujeto_declara_su_compuerta
  CHECK ((compuerta IS NOT NULL) <> (compuerta_ausente_porque IS NOT NULL));

/* ── EL LECTOR DEL CENSO ─────────────────────────────────────────────────── */
CREATE OR REPLACE FUNCTION verificar_censo_de_compuertas()
RETURNS TABLE(codigo text, compuerta text, existe boolean,
              debe_llamarla boolean, nota text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT s.codigo, s.compuerta,
         s.compuerta IS NULL OR EXISTS (
           SELECT 1 FROM pg_proc p WHERE p.proname = s.compuerta),
         s.compuerta IS NOT NULL AND s.cobrable_por_checkout,
         s.compuerta_ausente_porque
    FROM cat_sujetos_de_pago s ORDER BY s.codigo;
$fn$;

/* L-140 — nace sin audiencia y se le concede sólo a quien la necesita. */
REVOKE ALL ON FUNCTION verificar_censo_de_compuertas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION verificar_censo_de_compuertas() TO service_role;

/* ── CINTURÓN ────────────────────────────────────────────────────────────── */
DO $cint$
DECLARE v_n int; v_falla text;
BEGIN
  /* ① los siete contestaron */
  SELECT count(*) INTO v_n FROM cat_sujetos_de_pago
   WHERE compuerta IS NULL AND compuerta_ausente_porque IS NULL;
  IF v_n <> 0 THEN RAISE EXCEPTION 'quedan % sujetos sin declarar', v_n; END IF;

  /* ② toda compuerta declarada EXISTE — si nombré una función inventada, acá
        se cae. *Declarar un nombre no lo hace existir.* */
  SELECT string_agg(c.compuerta, ', ') INTO v_falla
    FROM verificar_censo_de_compuertas() c WHERE NOT c.existe;
  IF v_falla IS NOT NULL THEN
    RAISE EXCEPTION 'compuertas declaradas que no existen: %', v_falla;
  END IF;

  /* ③ SABOTAJE: el CHECK tiene que rebotar un sujeto que no contesta. Sin este
        brazo, un CHECK mal escrito pasa desapercibido — *un cinturón que no
        prueba su propio rojo mide que la fila entró, no que el guard aprieta.* */
  BEGIN
    INSERT INTO cat_sujetos_de_pago (codigo, columna_intento, descripcion)
    VALUES ('_sabotaje_s109b', 'cita_id', 'fila de prueba');
    RAISE EXCEPTION 'EL CHECK NO APRIETA: entró un sujeto sin compuerta declarada';
  EXCEPTION
    WHEN check_violation THEN NULL;  -- correcto: rebotó por el CHECK
  END;

  /* ④ SABOTAJE INVERSO: uno que SÍ contesta tiene que entrar — si no, el CHECK
        aprieta de más y bloquearía todo sujeto nuevo.
        🔴 `columna_intento` es UNIQUE: el primer intento de este brazo reusó
        `cita_id` y **rebotó por la clave única, no por el CHECK** — o sea, habría
        dado su veredicto sobre otra cosa. *Un brazo que se cae por la razón
        equivocada no mide el guard: mide el vecino.* Va con un valor propio. */
  BEGIN
    INSERT INTO cat_sujetos_de_pago (codigo, columna_intento, descripcion, compuerta)
    VALUES ('_sabotaje_s109b_ok', '_sabotaje_col', 'fila de prueba', 'verificar_compuerta_plan');
    DELETE FROM cat_sujetos_de_pago WHERE codigo = '_sabotaje_s109b_ok';
  EXCEPTION
    WHEN others THEN
      RAISE EXCEPTION 'EL CHECK APRIETA DE MÁS: rebotó un sujeto bien declarado (%)', SQLERRM;
  END;

  /* ⑤ residuo 0 */
  SELECT count(*) INTO v_n FROM cat_sujetos_de_pago WHERE codigo LIKE '_sabotaje%';
  IF v_n <> 0 THEN RAISE EXCEPTION 'residuo de sabotaje: % filas', v_n; END IF;

  RAISE NOTICE 'censo de compuertas: 5 brazos verdes, residuo 0';
END $cint$;
