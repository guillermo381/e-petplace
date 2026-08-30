/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LA v2 DE LOS DOCUMENTOS — cuatro suben, dos se quedan
   ═══════════════════════════════════════════════════════════════════════════
   🟢 TRES FIRMAS DEL FOUNDER (30-ago-2026):
     ① el acto es UNO y dice **«Declaro y acepto»** con los seis enumerados
     ② el tope de urgencia es **USD 150**, como **término del texto y no campo
        del flujo** — la familia lo acepta con el acto y lo edita después
     ③ **sin contacto alternativo, el animal se entrega sólo al dueño**

   🔴 **SUBEN CUATRO, NO SEIS** — y es decisión de la mesa, adoptada:
   `declaracion_sanitaria` y `declaracion_comportamiento` **no cambian ni una
   coma** (el «Declaro» de ambas vive en el ACTO, no en su texto). Subirlas
   igual le pediría a la familia aceptar **el mismo texto otra vez** y **vacía
   de significado el número de versión**, que existe para decir *«esto cambió,
   míralo de nuevo»*. *La familia nunca ve el número: ve seis documentos.
   Versionar de más no la informa: la cansa.*

   ⚠️ **LA v1 NO SE BORRA — se DESACTIVA.** Una familia real la aceptó el
   30-ago 16:34, y **la prueba de esa aceptación tiene que poder mostrar el
   texto que se aceptó** (P23). `activo=false` la saca de la oferta; su fila
   queda para siempre.

   📄 **EL TEXTO SE DERIVÓ DEL OBJETO, no se retipeó:** cada v2 se construyó
   tomando el `contenido` VIVO de su v1 y aplicando **una sola** sustitución con
   su ancla verificada. *Retipear un documento legal entero para cambiar una
   frase es cómo se cuela una diferencia que nadie pidió.*

   🔑 **EL NÚMERO LLEGÓ EN BLANCO Y NO SE ADIVINÓ.** El mensaje que traía la
   firma decía *«Firma del founder sobre el tope: USD ___»*. La pista **frenó**:
   ese número es lo que la familia autoriza a gastar de su bolsillo, y ponerlo
   habría sido el *default silencioso* que la propia firma prohíbe. **Y tenía
   costo medible:** sembrar dos veces la v2 —una sin número y otra con— le
   muestra la pantalla de aceptación **DOS VECES** a quien ya aceptó la v1.

   ⚖️ VEDA 76(g): **NO RIGE** — INSERT de 4 filas + UPDATE de un flag sobre 4.
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831100000-documentos-v2.sql`
      (declara que si alguien ya aceptó la v2, **la salida no es revertir: es
       publicar una v3**).
   ═══════════════════════════════════════════════════════════════════════════ */

INSERT INTO guarderia_documentos (codigo, version, contenido) VALUES
  ('autorizacion_transporte', 2, '**AUTORIZACIÓN DE TRANSPORTE**

**1.** Autorizo a la guardería a **transportar a mi animal desde mi domicilio
hasta sus instalaciones y de regreso**, en los horarios acordados.

**2.** El transporte lo hace **la guardería, con su personal y sus vehículos**,
y **responde por él igual que por la estadía**: la custodia empieza con el acta
de recogida en mi domicilio y termina con el acta de devolución en el mismo
lugar. **e-PetPlace no organiza ni ejecuta ningún tramo del transporte.**

**3.** El animal viaja **asegurado y contenido** durante todo el trayecto.

**4.** **En la recogida y en la devolución se levanta un acta** con su estado,
fotografías fechadas, verificación del carnet, objetos entregados y
observaciones. **Puedo dejar constancia de mi conformidad o de mi reserva.**

**5.** **Entrega.** El animal se recoge y se devuelve **únicamente a mí o al
contacto alternativo que registré**. A nadie más. **Si no registro un contacto
alternativo, sólo a mí.**

**6.** Las fotografías del acta **encuadran a mi animal, no mi casa**.'),
  ('autorizacion_urgencia_veterinaria', 2, '**AUTORIZACIÓN DE ATENCIÓN VETERINARIA DE URGENCIA**

**1.** Si mi animal necesita atención veterinaria urgente durante la custodia,
**autorizo a la guardería a llevarlo y a que reciba la atención necesaria**.

**2.** **Primero se me busca.** La guardería intenta contactarme por todos los
medios que registré, y a mi **contacto alternativo autorizado**, antes de
decidir por su cuenta.

**3.** **Tope de gasto.** Autorizo gastos de urgencia hasta **USD 150**.
**Puede cambiar este monto cuando quiera desde su cuenta**, y el que rija al
momento de la urgencia es el que vale. Por encima de ese monto, la guardería sólo puede
autorizar **lo indispensable para evitar sufrimiento o estabilizarlo** mientras
sigue intentando contactarme.

**4.** **Los costos son míos.** La guardería me entrega los comprobantes y el
informe del veterinario.

**5.** **Eutanasia: sólo con prescripción veterinaria** por sufrimiento
irremediable, **documentada por el profesional**. Fuera de ese supuesto la
guardería **no puede** hacerlo, y hacerlo sería delito.

**6.** Puedo **cambiar el tope, los contactos y el contacto alternativo** cuando
quiera desde la app.'),
  ('contrato_custodia', 2, '**CONTRATO DE CUSTODIA REMUNERADA DE ANIMAL DE COMPAÑÍA**

**1. Quiénes.** Este contrato es entre **usted, dueño del animal**, y **la
guardería** que aparece nombrada en su reserva. **e-PetPlace no es parte de este
contrato**: aloja este documento, lo conserva y se lo exhibe a ambas partes
cuando lo pidan.

**2. Qué se contrata.** La guardería **recoge a su animal en su domicilio**, lo
mantiene bajo su cuidado durante la jornada contratada, y **lo devuelve a su
domicilio**. La custodia **empieza con el acta de recogida y termina con el acta
de devolución**: el transporte de ida y de vuelta está adentro.

**3. Cómo responde cada parte.**

> e-PetPlace responde por la verificación del prestador, la veracidad de la
> información publicada, la gestión del cobro y la atención del canal de
> reclamos; el Prestador responde por la custodia, el cuidado y el transporte
> del animal desde su recogida hasta su devolución, por su personal y por el
> cumplimiento de la normativa aplicable a su actividad. **Ninguna disposición
> de estos términos limita los derechos que la Ley Orgánica de Defensa del
> Consumidor reconoce al Usuario.**

**4. El estándar de cuidado.** La guardería responde como **depositario
remunerado**, con la diligencia de un buen padre de familia (**Art. 1563 del
Código Civil**), y cumple los requisitos de la **Resolución 121**: revisión
clínica al ingreso, instalaciones adecuadas, registro de entradas y salidas, y
responsable técnico veterinario.

**5. Su personal.** La guardería responde por los actos y omisiones de sus
empleados y transportistas **como si fueran propios**.

**6. Garantía.** La guardería **mantiene un seguro propio vigente** que cubre su
actividad de guardería y de transporte. **e-PetPlace no otorga ni sustituye esa
cobertura**, y no ofrece garantía propia sobre el servicio.

**7. Entregas.** El animal se entrega **únicamente a usted o al contacto
alternativo que usted haya registrado**. A nadie más, por ningún motivo.
**Si usted no registra un contacto alternativo, el animal se entrega
únicamente a usted.**

**8. Imágenes.** Durante la jornada la guardería puede tomar fotografías y
videos de su animal, **y se los envía a usted como parte del servicio**. Esas
imágenes forman parte de su expediente. La guardería tiene instrucción de
**encuadrar al animal**, no fotografiar personas, y descartar lo que aparezca de
forma incidental. **Publicar imágenes de su animal en redes sociales requiere su
autorización aparte**, que usted da o niega por separado y puede revocar cuando
quiera.

**9. Reclamos.** Si algo sale mal, el canal de e-PetPlace acusa recibo **dentro
de 24 horas** y responde el fondo **dentro de 10 días**.

**10. Documentos que acompañan.** Este contrato se firma junto con la
declaración sanitaria, la declaración de comportamiento, la autorización de
urgencia veterinaria, la autorización de transporte y el protocolo de no
retiro. **Todos rigen juntos.**'),
  ('protocolo_no_retiro', 2, '**PROTOCOLO SI NO RETIRO A MI ANIMAL**

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

/* La v1 de esos cuatro sale de la OFERTA — su fila NO se borra: una familia
   la acepto y la prueba tiene que poder mostrar el texto aceptado (P23).
   Las otras dos siguen ACTIVAS en v1: su texto no cambio. */
UPDATE guarderia_documentos SET activo = false
 WHERE version = 1 AND codigo IN ('autorizacion_transporte', 'autorizacion_urgencia_veterinaria', 'contrato_custodia', 'protocolo_no_retiro');

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR
   ───────────────────────────────────────────────────────────────────────────
   «Hay seis vigentes» no distingue nada — antes también había seis. Los brazos
   que miden de verdad son los que hablan de **la familia que ya aceptó**:

     ① el token del monto NO sobrevivió (si sobrevive, se sembró un documento
        con un hueco donde va la plata de la familia)
     ② vigentes = 6, y son **4 en v2 + 2 en v1** — no seis de cualquier cosa
     ③ 🔑 la familia que aceptó la v1 vuelve a `faltan` con **EXACTAMENTE 4**
        faltantes, y **las dos declaraciones le siguen contando aceptadas**.
        *Ése es el brazo que prueba el versionado selectivo: con seis subidas
        serían 6 faltantes, y con cero subidas sería `al_dia`.*
     ④ la v1 sigue EXISTIENDO (desactivada, no borrada): su texto tiene que
        poder mostrarse como prueba de lo que esa familia aceptó.
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_tok int; v_vig int; v_v2 int; v_v1 int; v_v1_filas int;
  v_fam uuid; v_user uuid; v_est jsonb; v_falt int; v_out text := '';
  v_ok int := 0; v_rol text := current_user;
BEGIN
  SELECT count(*) INTO v_tok FROM guarderia_documentos WHERE contenido LIKE '%MONTO_PENDIENTE%';
  IF v_tok > 0 THEN
    RAISE EXCEPTION 'CINTURON: % documento(s) con el token del monto sin reemplazar — eso es un hueco donde va la plata de la familia', v_tok;
  END IF;
  v_ok := v_ok + 1;

  SELECT count(*) INTO v_vig FROM public.obtener_documentos_guarderia();
  SELECT count(*) FILTER (WHERE version=2), count(*) FILTER (WHERE version=1)
    INTO v_v2, v_v1 FROM public.obtener_documentos_guarderia();
  v_out := v_out || format(E'\n  vigentes: %s  (v2: %s · v1: %s)', v_vig, v_v2, v_v1);
  IF v_vig = 6 AND v_v2 = 4 AND v_v1 = 2 THEN v_ok := v_ok + 1; END IF;

  SELECT count(*) INTO v_v1_filas FROM guarderia_documentos WHERE version = 1;
  v_out := v_out || format(E'\n  filas v1 conservadas: %s (la prueba de lo aceptado no se borra)', v_v1_filas);
  IF v_v1_filas = 6 THEN v_ok := v_ok + 1; END IF;

  /* 🔑 el brazo de la familia real */
  SELECT a.familia_id INTO v_fam FROM guarderia_aceptaciones a
   WHERE a.documento_version = 1 GROUP BY a.familia_id
   HAVING count(*) = 6 LIMIT 1;
  IF v_fam IS NULL THEN
    RAISE EXCEPTION 'CINTURON: no hay familia con las seis v1 aceptadas — el brazo que mide el versionado selectivo no puede correr';
  END IF;
  SELECT fm.user_id INTO v_user FROM familia_miembro fm WHERE fm.familia_id=v_fam AND fm.hasta IS NULL LIMIT 1;

  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub',v_user,'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_est := public.evaluar_documentos_guarderia(v_fam);
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  v_falt := jsonb_array_length(v_est->'faltantes');
  v_out := v_out || format(E'\n  🔑 la familia que acepto la v1 -> estado %s · faltantes %s  %s',
                           v_est->>'estado', v_falt, v_est->'faltantes');
  IF v_est->>'estado' = 'faltan' AND v_falt = 4 THEN v_ok := v_ok + 1; END IF;

  RAISE NOTICE E'\n═══ CINTURON · la v2 ═══%\n\n  %/4 esperados', v_out, v_ok;
  IF v_ok <> 4 THEN RAISE EXCEPTION 'CINTURON ROJO: %/4. %', v_ok, v_out; END IF;
END $cinturon$;
