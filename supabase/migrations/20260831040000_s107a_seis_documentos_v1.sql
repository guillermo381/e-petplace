/* ═══════════════════════════════════════════════════════════════════════════
   S107-A · LOS SEIS DOCUMENTOS DE GUARDERÍA — v1, SEMBRADOS
   ═══════════════════════════════════════════════════════════════════════════
   Cierra `D-977`: el perímetro estaba entero y el contenido en CERO ⇒ **el
   camino de compra estaba bloqueado, no por motor sino por texto.**

   📄 **EL TEXTO NO NACE ACÁ.** Vive en `docs/legales/GUARDERIA_DOCUMENTOS_V1.md`
   y de ahí se EXTRAJO — para que el abogado lo lea sin entrar a Supabase, para
   que toda corrección sea un diff, y para que **el texto que se publica y el
   que se revisa sean el mismo objeto**.

   🔴 **QUIÉN LO REDACTÓ:** A (pista), **que no es abogada**. El fondo es del
   abogado ecuatoriano (`CRITERIO_LEGAL_GUARDERIA.md`); la redacción es
   interpretación, y **cada documento lleva su mapa marcando qué transcribe y
   qué interpreta**. Las dos firmas del founder que lo destrabaron (29-ago):
   **plazo de 15 días, tramo único** · **garantía = seguro propio del
   prestador**.

   ⚠️ **`D-979` — LA REVISIÓN LEGAL ES CONDICIÓN DE SOFT LAUNCH.** Se siembra
   ahora por decisión del founder para destrabar la compra; **abrir sin esa
   revisión no está autorizado.** Y su consecuencia, escrita para que nadie la
   descubra el día del launch: las aceptaciones se guardan por
   `(codigo, version)` ⇒ **corregir publica una v2, y la v2 le vuelve a pedir
   aceptación a toda familia que aceptó la v1.** *Eso está bien y es el diseño.*

   ⚖️ VEDA 76(g): **NO RIGE** — es un INSERT de seis filas, sin backfill sobre
   datos vivos (`guarderia_aceptaciones` = 0 al aplicar).
   ↩️ REVERSA escrita ANTES:
      `docs/relevamientos/S107-A-REVERSA-20260831040000-seis-documentos.sql`
      (declara que revertir APAGA la guardería, y que rebota si alguien aceptó).
   ═══════════════════════════════════════════════════════════════════════════ */

INSERT INTO guarderia_documentos (codigo, version, contenido) VALUES
  ('contrato_custodia', 1, '**CONTRATO DE CUSTODIA REMUNERADA DE ANIMAL DE COMPAÑÍA**

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
  ('declaracion_sanitaria', 1, '**DECLARACIÓN SANITARIA**

**1.** Declaro que mi animal **tiene su esquema de vacunación vigente** según su
carnet, y que el carnet que cargué en e-PetPlace **corresponde a él y está
actualizado**.

**2.** Declaro que **no presenta signos de enfermedad transmisible** —
diarrea, vómito, tos, secreciones, lesiones de piel, parásitos externos— **en
los días previos a la estadía**, y que cumple su desparasitación.

**3.** Autorizo a la guardería a **revisarlo al ingreso**. Esa revisión es
obligatoria por la Resolución 121.

**4.** Entiendo que **si al ingreso presenta signos compatibles con una
enfermedad transmisible, la guardería puede no recibirlo ese día** — no es una
sanción: es lo que protege a los demás animales del lugar.

**5.** Me comprometo a **avisar antes de cada estadía** si algo de esto cambió.'),
  ('declaracion_comportamiento', 1, '**DECLARACIÓN DE COMPORTAMIENTO**

**1.** Declaro conocer el comportamiento de mi animal e informar de buena fe lo
que sé de él.

**2.** Declaro si mi animal **ha mordido o intentado morder** a una persona o a
otro animal; si **reacciona mal ante otros animales**, ante desconocidos o ante
el manejo; si **protege su comida, sus juguetes o su espacio**; si **intenta
escaparse**; y si **sufre ansiedad por separación**.

**3.** Entiendo que **e-PetPlace no verifica esta declaración**: la guardería
decide cómo recibirlo a partir de lo que yo informe y de lo que observe.

**4.** **Informar no es un obstáculo: es lo que permite cuidarlo bien.** Un
animal reactivo se maneja distinto —separado, con más espacio, con otro
horario—, y declararlo no le cierra el servicio.

**5.** Entiendo que **omitir a sabiendas un antecedente de agresión es
incumplimiento mío de este contrato**, y que la guardería puede terminar la
estadía si aparece una conducta que yo conocía y no informé.'),
  ('autorizacion_urgencia_veterinaria', 1, '**AUTORIZACIÓN DE ATENCIÓN VETERINARIA DE URGENCIA**

**1.** Si mi animal necesita atención veterinaria urgente durante la custodia,
**autorizo a la guardería a llevarlo y a que reciba la atención necesaria**.

**2.** **Primero se me busca.** La guardería intenta contactarme por todos los
medios que registré, y a mi **contacto alternativo autorizado**, antes de
decidir por su cuenta.

**3.** **Tope de gasto.** Autorizo gastos de urgencia hasta el **monto que fijé
al firmar esta autorización**. Por encima de ese monto, la guardería sólo puede
autorizar **lo indispensable para evitar sufrimiento o estabilizarlo** mientras
sigue intentando contactarme.

**4.** **Los costos son míos.** La guardería me entrega los comprobantes y el
informe del veterinario.

**5.** **Eutanasia: sólo con prescripción veterinaria** por sufrimiento
irremediable, **documentada por el profesional**. Fuera de ese supuesto la
guardería **no puede** hacerlo, y hacerlo sería delito.

**6.** Puedo **cambiar el tope, los contactos y el contacto alternativo** cuando
quiera desde la app.'),
  ('autorizacion_transporte', 1, '**AUTORIZACIÓN DE TRANSPORTE**

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
contacto alternativo que registré**. A nadie más.

**6.** Las fotografías del acta **encuadran a mi animal, no mi casa**.'),
  ('protocolo_no_retiro', 1, '**PROTOCOLO SI NO RETIRO A MI ANIMAL**

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
  alternativo registrado.

**8.** Entiendo que **nada de esto me quita la propiedad de mi animal**, y que
la deuda por los gastos es una deuda común, que se cobra como cualquier otra.');

/* ═══════════════════════════════════════════════════════════════════════════
   CINTURÓN CON DISCRIMINADOR — «hay seis filas» no es la medición
   ───────────────────────────────────────────────────────────────────────────
   Contar seis filas prueba que el INSERT corrió. **La pregunta es otra: ¿el
   camino de compra se DESTRABÓ?** Y eso sólo lo contesta el motor, así que el
   cinturón le pregunta a la compuerta y **exige que su respuesta CAMBIE** —
   `documentos_no_disponibles` era el estado de ayer; hoy tiene que ser
   `documentos_sin_aceptar`, que es el paso anterior y **la familia sí puede
   resolverlo**.

   *La diferencia entre los dos códigos es exactamente la diferencia entre «es
   nuestro» y «es tuyo, y tenés cómo».*
   ═══════════════════════════════════════════════════════════════════════════ */
DO $cinturon$
DECLARE
  v_rol text := current_user;
  v_n int; v_vacio int; v_user uuid; v_fam uuid; v_prest uuid; v_tam int;
  v_estado text; v_r text;
BEGIN
  SELECT count(*) INTO v_n FROM guarderia_documentos WHERE activo AND version = 1;
  IF v_n <> 6 THEN RAISE EXCEPTION 'CINTURON: se esperaban 6 documentos activos y hay %', v_n; END IF;

  /* Ningún texto vacío ni truncado por un error de extracción. */
  SELECT count(*) INTO v_vacio FROM guarderia_documentos
   WHERE version = 1 AND (contenido IS NULL OR length(btrim(contenido)) < 400);
  IF v_vacio > 0 THEN RAISE EXCEPTION 'CINTURON: % documento(s) vacios o truncados', v_vacio; END IF;

  /* Y que el lector los vea — la tabla puede tener filas que el lector filtre. */
  SELECT count(*) INTO v_n FROM public.obtener_documentos_guarderia();
  IF v_n <> 6 THEN RAISE EXCEPTION 'CINTURON: la tabla tiene 6 y el LECTOR devuelve % — no alcanza con insertar', v_n; END IF;

  SELECT c.user_id INTO v_user FROM evento_cita_servicio c JOIN mascotas m ON m.id=c.mascota_id
   WHERE m.especie IN ('perro','gato') AND c.user_id IS NOT NULL LIMIT 1;
  SELECT fm.familia_id INTO v_fam FROM familia_miembro fm
   WHERE fm.user_id=v_user AND fm.hasta IS NULL LIMIT 1;
  SELECT ps.prestador_id INTO v_prest FROM prestador_servicios ps
   WHERE ps.tipo_servicio='guarderia_dia' AND ps.activo LIMIT 1;
  SELECT gp.tamano INTO v_tam FROM guarderia_paquetes gp
   WHERE gp.prestador_id=v_prest AND gp.activo ORDER BY gp.tamano LIMIT 1;

  EXECUTE format('SET LOCAL request.jwt.claims = %L',
                 json_build_object('sub', v_user, 'role','authenticated')::text);
  SET LOCAL ROLE authenticated;
  v_estado := public.evaluar_documentos_guarderia(v_fam)->>'estado';
  BEGIN PERFORM public.comprar_paquete_guarderia(v_prest, v_tam); v_r := 'PASO';
  EXCEPTION WHEN OTHERS THEN v_r := SQLERRM; END;
  EXECUTE format('SET LOCAL ROLE %I', v_rol);

  RAISE NOTICE E'\n═══ CINTURON · los seis documentos ═══\n  6 activos · 6 en el lector · cero vacios\n  estado de la familia: %  (ayer: documentos_no_disponibles)\n  la compra ahora dice:  %', v_estado, v_r;

  IF v_estado <> 'faltan' THEN
    RAISE EXCEPTION 'CINTURON: el evaluador dice "%" y tenia que decir "faltan" — los documentos existen y nadie los acepto todavia', v_estado;
  END IF;
  IF v_r <> 'documentos_sin_aceptar' THEN
    RAISE EXCEPTION 'CINTURON: la compra dice "%" y tenia que decir "documentos_sin_aceptar" — el camino NO se destrabo', v_r;
  END IF;
END $cinturon$;
