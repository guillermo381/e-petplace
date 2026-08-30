# LOS SEIS DOCUMENTOS DE GUARDERÍA — v1

> **Nace:** 29-ago-2026. **Fuente obligada:** `CRITERIO_LEGAL_GUARDERIA.md`
> (respuesta del abogado) y `LETRA_GUARDERIA.md` §3 y §6 reescritas.
> **Qué es:** el texto **exacto** que se siembra en `guarderia_documentos` y que
> la familia acepta al contratar guardería. Vive acá **fuera de la base** para
> que se lea sin entrar a Supabase y para que **toda corrección sea un diff**.

---

## 🔴 QUIÉN LO ESCRIBIÓ — leer antes que cualquier cláusula

Lo redactó **A (pista de Claude Code), que no es abogada**. El **fondo** es del
abogado ecuatoriano; **la redacción es interpretación**.

Cada documento cierra con su **mapa de interpretación**: qué es transcripción
del criterio legal y qué es redacción propia. **Lo segundo es lo que el abogado
tiene que mirar primero, y es lo único que A no puede garantizar.**

⚠️ **Condición de soft launch (`D-979`):** un abogado ecuatoriano revisa estos
seis textos **antes de abrir**. Se siembran ahora por decisión del founder
(29-ago) para destrabar el camino de compra — **abrir sin esa revisión no está
autorizado.**

## ⚠️ LA VERSIÓN NO ES DECORATIVA

Las aceptaciones se guardan por **`(codigo, version)`**. ⇒ **corregir un texto
después de la revisión legal publica una v2, y la v2 le vuelve a pedir la
aceptación a toda familia que aceptó la v1.**

**Eso está bien y es el diseño** —una familia no queda atada a un texto que ya
no rige— pero **no puede descubrirse el día del launch**: es trabajo de aviso,
no una sorpresa.

## Qué NO está acá

- **La autorización de redes** (`CRITERIO_LEGAL` §5 capa 4) **no es uno de los
  seis**: es una **casilla separada, específica y revocable**, y el motor ya la
  tiene como `p_redes_autorizadas`. *Meterla adentro de un documento la
  convertiría en parte del paquete, que es exactamente lo que el criterio
  prohíbe.*
- **El acta de traslado a un refugio** (§6 día 15) es un **séptimo documento**,
  entre el prestador y el refugio — **no existe** y es una de las tres
  decisiones abiertas de `LETRA_GUARDERIA` §6.4.
- **Precios, cancelaciones y tarifas.** No se inventan acá: viven en la oferta
  publicada y en las políticas.

---

# ① `contrato_custodia` · v1

**CONTRATO DE CUSTODIA REMUNERADA DE ANIMAL DE COMPAÑÍA**

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
retiro. **Todos rigen juntos.**

### 🗺️ Mapa de interpretación — ①

| cláusula | origen |
|---|---|
| 1 · e-PetPlace no firma, aloja y exhibe | ✅ criterio §4, regla madre |
| 2 · custodia de acta a acta | ✅ criterio §1 |
| 3 · la cláusula de responsabilidad | ✅ **VERBATIM del abogado** |
| 4 · Art. 1563 y Resolución 121 | ✅ criterio §1 |
| 5 · el personal | ✅ criterio §1 |
| 6 · seguro del prestador | 🟢 firma del founder (29-ago) sobre la escalera ③ del criterio §2 |
| 6 · «e-PetPlace no otorga ni sustituye» | ⚠️ **INTERPRETACIÓN de A** — redactado para **no prometer** la póliza futura. Es la línea que traduce la condición del founder |
| 7 · entregas | ✅ criterio §3, prohibición 5 |
| 8 · imágenes | ⚠️ **INTERPRETACIÓN de A** de las capas 1, 2 y 4 del criterio §5, que pide *«una cláusula descriptiva»* sin dar su texto |
| 9 · plazos del reclamo | ✅ criterio §1 (los llama *sugeridos*; acá quedan **firmes** — ⚠️ **interpretación**) |
| 10 · rigen juntos | ⚠️ **INTERPRETACIÓN de A** |

---

# ② `declaracion_sanitaria` · v1

**DECLARACIÓN SANITARIA**

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

**5.** Me comprometo a **avisar antes de cada estadía** si algo de esto cambió.

### 🗺️ Mapa de interpretación — ②

| punto | origen |
|---|---|
| 1 y 3 · carnet vigente y revisión al ingreso | ✅ criterio §4 (*«declaración sanitaria con carnet vigente, obligatorio por Res. 121»*) y §1 (*«revisión clínica al ingreso»*) |
| 2 · la lista de signos | ⚠️ **INTERPRETACIÓN de A** — el criterio no enumera; la lista es redacción propia |
| 4 · la consecuencia de no recibirlo | ⚠️ **INTERPRETACIÓN de A** — se deriva de que la revisión sea obligatoria, pero **el criterio no la dice**. *Es una consecuencia contractual que conviene revisar.* |
| 5 · avisar si cambia | ⚠️ **INTERPRETACIÓN de A** |

---

# ③ `declaracion_comportamiento` · v1

**DECLARACIÓN DE COMPORTAMIENTO**

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
estadía si aparece una conducta que yo conocía y no informé.

### 🗺️ Mapa de interpretación — ③

| punto | origen |
|---|---|
| que este documento exista y que sea *«el que decide quién responde en una mordida»* | ✅ criterio §4 |
| 2 · **la lista de conductas** | ⚠️ **INTERPRETACIÓN de A** — el criterio nombra el documento y no su contenido |
| 3 · e-PetPlace no verifica | ⚠️ **INTERPRETACIÓN de A**, coherente con §3.2: la plataforma verifica al **prestador**, no al animal |
| 4 · «informar no cierra el servicio» | ⚠️ **INTERPRETACIÓN de A** — redactado para que la declaración no se llene con mentiras piadosas. Es criterio de producto, no legal |
| 5 · **la consecuencia de omitir** | 🔴 **INTERPRETACIÓN de A, y la MÁS CARGADA de las seis.** Es la cláusula que mueve responsabilidad entre las partes ante una mordida. **Que el abogado la mire antes que ninguna otra.** |

---

# ④ `autorizacion_urgencia_veterinaria` · v1

**AUTORIZACIÓN DE ATENCIÓN VETERINARIA DE URGENCIA**

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
quiera desde la app.

### 🗺️ Mapa de interpretación — ④

| punto | origen |
|---|---|
| que exista con **tope de gasto y cadena de contactos** | ✅ criterio §4, explícito |
| 5 · eutanasia sólo con prescripción documentada | ✅ criterio §3, prohibición 2 |
| 2 · el orden «primero se me busca» | ⚠️ **INTERPRETACIÓN de A** |
| 3 · **qué se puede hacer POR ENCIMA del tope** | ⚠️ **INTERPRETACIÓN de A** — el criterio fija que haya tope, no qué pasa arriba. *Un tope sin esta cláusula obligaría a dejar sufrir a un animal por un límite de dinero* |
| 4 · los costos son del dueño | ⚠️ **INTERPRETACIÓN de A** |

---

# ⑤ `autorizacion_transporte` · v1

**AUTORIZACIÓN DE TRANSPORTE**

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

**6.** Las fotografías del acta **encuadran a mi animal, no mi casa**.

### 🗺️ Mapa de interpretación — ⑤

| punto | origen |
|---|---|
| 2 · custodia puerta a puerta y ningún tramo de e-PetPlace | ✅ criterio §1 |
| 4 · el contenido de las dos actas | ✅ criterio §4 |
| 5 · entrega sólo al dueño o contacto autorizado | ✅ criterio §3, prohibición 5 |
| 6 · encuadrar al animal, no la casa | ✅ criterio §5, capa 3 |
| 3 · «asegurado y contenido» | ⚠️ **INTERPRETACIÓN de A** — el criterio no describe el modo del transporte |

---

# ⑥ `protocolo_no_retiro` · v1

**PROTOCOLO SI NO RETIRO A MI ANIMAL**

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
la deuda por los gastos es una deuda común, que se cobra como cualquier otra.

### 🗺️ Mapa de interpretación — ⑥

| punto | origen |
|---|---|
| 2, 3, 4, 5 · el protocolo y su tabla | ✅ criterio §3 |
| 5 · tenencia ≠ propiedad, el refugio no dispone | ✅ criterio §3 |
| 6 · recuperar pagando expensas | ✅ criterio §3 (Art. 648 CC) |
| 7 · **las cinco prohibiciones** | ✅ criterio §3, textuales |
| **quince días como plazo único** | 🟢 **firma del founder** (29-ago) |
| 6 · **«sin fecha límite»** | ⚠️ **INTERPRETACIÓN de A** — consecuencia de descartar el segundo tramo. **El criterio contemplaba disposición al día 60; acá NO HAY disposición.** *Es la línea que más cambia respecto del criterio, y la que el abogado tiene que mirar primero.* |
| 7 · «ni pasados los quince días **ni nunca**» | ⚠️ **INTERPRETACIÓN de A**, misma raíz |
| 8 · la deuda es común | ⚠️ **INTERPRETACIÓN de A** — se deriva de la prohibición 3 |

---

## 🔴 LO QUE ESTOS SEIS NO RESUELVEN, y está abierto en `LETRA_GUARDERIA` §6.4

1. **Quién le adelanta el dinero al refugio** desde el día 15, si el dueño
   nunca aparece. El punto 6 le promete al dueño una custodia **sin fecha
   límite**, y **nadie la financia todavía**.
2. **Qué refugio, y el acta de traslado** — el séptimo documento, que no existe.
3. **Quién ejecuta las notificaciones** y quién declara que llegó el día 15.
