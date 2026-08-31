/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · `protocolo_no_retiro` v3 — el tope, y qué pasa cuando se agota
   ═══════════════════════════════════════════════════════════════════════════
   🟢 Firma del founder (31-ago-2026), cerrando `LETRA_GUARDERIA` §6.4:
   **e-PetPlace adelanta las expensas del refugio desde el día 15 hasta
   USD 300, y el dueño las debe.**

   🔴 **Y el tope OBLIGABA a decir qué pasa al agotarse**, porque el texto no
   puede prometer custodia sin fecha de cierre *y* tener un tope. La firma:

   > **Lo que cambia al agotarse el tope NO es el destino del animal: es quién
   > financia la espera.** El dueño **no pierde el derecho a recuperarlo —
   > pierde el derecho a recuperarlo sin pagar.**

   **Sube SOLA esta versión.** Los otros cinco documentos **no cambian ni una
   coma** ⇒ siguen donde están (cuatro en v2, dos en v1). *Versionar de más no
   informa a la familia: la cansa.*

   ☠️ **Costo de re-aceptación: CERO.** Medido — `guarderia_aceptaciones` no
   tiene ninguna fila sobre la v2 de este documento.

   ⚠️ El texto se DERIVÓ del `contenido` vivo de la v2 con **una sola**
   inserción; no se retipeó.

   ⚖️ VEDA 76(g): **NO RIGE**. ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260901020000-protocolo-v3.sql`
   ═══════════════════════════════════════════════════════════════════════════ */

INSERT INTO guarderia_documentos (codigo, version, contenido)
VALUES ('protocolo_no_retiro', 3, '**PROTOCOLO SI NO RETIRO A MI ANIMAL**

**Esto se firma ahora, antes de que pase nada** — para que, si pasa, ya
sepamos los dos qué sigue.

**1. La guardería no es un lugar para vivir.** Si el día de la devolución no
aparezco y no me pueden contactar, empieza este protocolo. **Que mi animal vaya
a otro lado no significa que yo lo pierda.**

**2. El mismo día.** La guardería me busca por **todos** los canales que
registré —llamada, WhatsApp, correo, y mi contacto alternativo— y **anota cada
intento** con fecha, hora, medio y resultado.

**3. Al día siguiente.** Recibo una **notificación formal**: mi animal está bajo
cuidado, **corren gastos diarios a la tarifa publicada**, y se me informa este
protocolo con sus fechas.

**4. Los primeros quince días.** Mi animal **se queda en la guardería**, con los
gastos corriendo. Se me sigue buscando. Si la estadía se prolonga, se le hace un
**chequeo veterinario**.

**5. A los quince días.** Si sigo sin aparecer, mi animal **pasa a la custodia
de un refugio verificado**, y se me notifica **dónde está y cómo recuperarlo**.
El refugio recibe **la tenencia, no la propiedad**: **sigue siendo mi animal**,
y el refugio **se obliga a no disponer de él**.

**6. Puedo recuperarlo siempre.** **En cualquier momento, sin fecha límite**,
pagando los gastos documentados que se hayan generado.

**6 bis. Quién paga mientras yo no aparezco.** Desde el día quince, e-PetPlace
**adelanta** al refugio los gastos de la custodia **hasta USD 300** —, y **esos gastos son míos**: se suman a lo que debo pagar
para recuperarlo.

**Cuando ese monto se agota**, e-PetPlace deja de adelantar. **Mi animal se
queda donde está y sigue siendo mío**: puedo recuperarlo en cualquier momento
pagando todo lo que se haya gastado. **Lo que cambia no es qué pasa con mi
animal — es que a partir de ahí nadie está pagando su cuidado por mí.**

**7. Lo que NUNCA se hace con mi animal**, ni pasados los quince días ni nunca:

- **no se lo suelta ni se lo deja en la vía**;
- **no se lo sacrifica**, salvo prescripción veterinaria por sufrimiento
  irremediable documentada por el profesional;
- **no se lo vende, ni se lo subasta, ni se lo usa para cobrar la deuda** — la
  deuda se me cobra por la vía civil, jamás con mi animal;
- **no se lo da en adopción** sin que yo firme la cesión;
- **no se lo entrega** a ninguna persona que no sea yo o mi contacto
  alternativo registrado — **y si no registré ninguno, sólo a mí**.

**8.** Entiendo que **nada de esto me quita la propiedad de mi animal**, y que
la deuda por los gastos es una deuda común, que se cobra como cualquier otra.');

/* La v2 sale de la oferta. Su fila NO se borra: nadie la aceptó todavía, pero
   la regla es la misma que con la v1 — el texto que estuvo publicado se
   conserva (P23). */
UPDATE guarderia_documentos SET activo = false
 WHERE codigo = 'protocolo_no_retiro' AND version = 2;

DO $cinturon$
DECLARE v_txt text; v_vig int; v_v3 int; v_acep int;
BEGIN
  SELECT contenido INTO v_txt FROM guarderia_documentos
   WHERE codigo='protocolo_no_retiro' AND activo ORDER BY version DESC LIMIT 1;
  SELECT count(*) INTO v_vig FROM public.obtener_documentos_guarderia();
  SELECT version INTO v_v3 FROM guarderia_documentos
   WHERE codigo='protocolo_no_retiro' AND activo;
  SELECT count(*) INTO v_acep FROM guarderia_aceptaciones a
   WHERE a.documento_codigo='protocolo_no_retiro';

  RAISE NOTICE E'\n═══ CINTURON · el protocolo v3 ═══\n  vigentes: % · el protocolo vigente es v%\n  dice el tope: % · dice que se agota: %\n  aceptaciones de este documento (re-aceptacion a pagar): %',
    v_vig, v_v3, (v_txt LIKE '%USD 300%'), (v_txt LIKE '%se agota%'), v_acep;

  IF v_vig <> 6 THEN RAISE EXCEPTION 'CINTURON ROJO: vigentes % y tienen que ser 6', v_vig; END IF;
  IF v_v3 <> 3 THEN RAISE EXCEPTION 'CINTURON ROJO: el vigente es v% y tiene que ser v3', v_v3; END IF;
  /* 🔑 Los dos brazos que separan «tiene un tope» de «dice qué pasa cuando se
     agota». Un texto con tope y sin salida es el que la firma prohíbe:
     *parece resuelto y sólo mueve el problema.* */
  IF v_txt NOT LIKE '%USD 300%' THEN RAISE EXCEPTION 'CINTURON ROJO: el texto no dice el tope'; END IF;
  IF v_txt NOT LIKE '%se agota%' THEN RAISE EXCEPTION 'CINTURON ROJO: el texto tiene tope y NO dice que pasa al agotarse'; END IF;
END $cinturon$;
