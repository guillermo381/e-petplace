# DIRECCION_ARTE — El lenguaje visual propio de e-PetPlace

> **Versión: v1.6 — S85 (3-4 Ago 2026).** Enmienda v1.6: nacen **6bis LA INSIGNIA DE COHORTE** (tercera familia `distincion`; eje TIEMPO y no mérito; el «N» no se muestra), **6ter EL GLOW** (solo la tarjeta EN CURSO — aplicar la Ley 7 donde ya significa «en vivo», no enmendarla) y **6quater EL PAPEL AL 5%** *con su verificador dentro de la firma*. Previa v1.5 — S85 (3 Ago 2026). Enmienda v1.5, **DOS firmas sobre
> §2, ninguna deroga nada**: **(a) la ley 4 SE ACOTA** — sigue rigiendo en
> la iconografía de CONTENIDO (humanos = manos u objetos) y **se
> excepciona donde el humano es SUJETO y no objeto**, hoy la tab Cuenta
> (*"el de cuenta no sé, una persona, algo que realmente parezca cuenta"*,
> founder 3-ago); el discriminador es **sujeto vs objeto**, no "barra de
> tabs". **(b) la ley 6 gana la REGLA GENERAL que estaba abajo de sus dos
> casos** (derivada por C, firmada por la mesa): **la huella que es
> ESTRUCTURA se recolorea; la que es MARCA aparece** — con eso el
> veredicto de S80 y la firma de S82 dejan de necesitar reconciliación:
> eran dos mecanismos distintos sin nombre. Previa v1.4 (C-S81, ACTO 1
> del brief — depósito ordenado por §0 de `DIRECTIVA_CRAFT_CLIENTE`):
> nace **§9bis EL BLOQUE A DEL LADO CLIENTE** — migración con estatuto
> real por ítem: A6 SIN CAJA ✅ · A4 la luz de la esquina ✅ · A5 la
> exclusión de #0F5E56 ✅ (lo firmado RIGE) · A1 y A3 entran como
> CANDIDATAS SIN FIRMA con gate propio · A2 ya era §1 · A7 VACÍA, no se
> reconstruye. La fuente única del Bloque A pasa a ser este doc; en la
> directiva queda la referencia. Previa v1.3 (A16, FIRMADA
> founder): **§2 pasa a nombrar CATEGORÍAS, no servicios** — nace la
> **ley 10, LA TAXONOMÍA DE CAPAS Y LA LEY DEL REPARTO** (SALUD ·
> CUIDADO · COMUNIDAD · CONSUMO + MARCA/AFECTO reservada; el canto dice
> categoría —cerrado, tope 5—, el glifo dice servicio —abierto—; si la
> taxonomía pasa de 5 se cambia de mecanismo, no de paleta) y §2 suelta
> "cuidado" del ocre — **D-573 cerrada por (a) en el mismo acto**.
> Previa v1.2: nacen **§8 LA
> DOSIS DE LA RAMPA** (dónde trabaja el magenta, dónde decora la marca,
> la dirección turquesa→magenta fijada, el brillo del objeto y la luz de
> lo que cambió) y **§9 COMPOSICIÓN Y FORMA** (los dos cantos, la
> posición del canto, el estado real primero, la forma que lleva el
> dato, la monotonía como síntoma) — leyes de craft del rediseño del
> portal, firmadas por el founder sobre la lámina S80; §5 gana el
> REGISTRO S80 del movimiento. Con **disparo de reconsideración
> declarado** (mecánica §5b): nacieron de la lectura del founder, no de
> un ensayo con prestadores. Previa v1.1 — S71: nace **§6b el
> estándar de la hoja de contacto** (el método de autoría de glifos, ahora
> que la sesión los autora) y la **Ley 9 se afila** con el criterio del
> founder (*a 21px la huella sobrevive o es ruido*). Base v1.0 — S53
> (10 Jul 2026): escrito por el arquitecto/director
> de arte; dirección FIRMADA por el founder en sesión tras tres rondas de
> propuestas (lenguajes a/b/c → crítica founder con vara Banco Pichincha →
> evolución b′). **Contrastes obligatorios:** la skill
> `epetplace-design-system` (este doc la ENMIENDA donde se indica; en todo
> lo demás, la skill manda), `DISEÑO_EXPERIENCIA.md` v1.2 (dosis por lado).
> **Qué es este doc:** la dirección de arte exigible — iconografía,
> ilustración y motion de marca. Ningún ícono, ilustración o gesto de
> marca nace fuera de este lenguaje (patrón Ley 11: lo que falta se
> propone, se gatea, y nace acá).

---

## 1. La regla madre (la firma del founder, S53)

**"En cada ícono, la mascota está presente."**

Todo ícono de producto se construye como: **objeto del oficio en trazo de
tinta + UNA huella rellena** (almohadilla + tres dedos) en el hex puro de
su capa, colocada donde la mascota está en el concepto:

- Paseo: la correa cae hasta la huella — la mascota tirando.
- Veterinaria: el estetoscopio ESCUCHA a la huella.
- Refugio/adopción: la huella vive dentro del corazón.
- Despensa: la bolsa lleva su huella — lo de adentro es para ellos.
- Grooming: las tijeras trabajan; la huella espera al costado.

La huella es la versión evolucionada de la "almohadilla" de la propuesta
(b) original, tras la crítica del founder ("tres rayas y una bola no son
elegantes") y la lección destilada del benchmark Banco Pichincha: **el
acento relleno es el corazón semántico del ícono, prominente — jamás un
punto decorativo.**

## 2. Las leyes del ícono (exigibles)

1. **Construcción:** grilla 24×24, geometría de círculos y rectas, trazo
   **1.9** en tinta (`text.primary` del tema), remates redondeados
   (`strokeLinecap/Linejoin="round"`).
2. **La huella:** UNA por ícono, RELLENA, en el **hex PURO de la capa**
   del concepto — y la capa se nombra por CATEGORÍA, no por servicio
   (la taxonomía firmada, ley 10): **verde vital SALUD · teal CUIDADO ·
   pink COMUNIDAD · terracotta CONSUMO** (el magenta es MARCA/AFECTO —
   reservada, §8.2: no es capa de servicio). Forma canónica: elipse
   (almohadilla) + tres dedos — el path canónico vive en `packages/ui`
   como primitiva `Huella` y NADIE lo redibuja a mano.
   *(ENMIENDA S80-A16: esta línea decía "teal paseo … ocre
   cuidado/consumo" — §2 SUELTA la palabra "cuidado" del ocre y se la
   da al teal, alineando con el token `capa.cuidado = teal` que lo dice
   desde V0. Con esto **D-573 se cierra por su camino (a)**: una línea,
   sin migrar ~30 consumidores. El ocre queda donde vive: `status.warning`.)*
3. **Escala de la huella:** prominente y legible — entre 0.7 y 1.1 de su
   escala base según el aire del ícono; jamás tan chica que se lea como
   punto.
4. **Cero figuras humanas.** Los oficios se dicen con sus objetos. Si un
   concepto exige presencia humana, se dice con una MANO — y una mano
   entra al set solo con craft que pase el gate del founder.

   > **ENMIENDA S85 — LA LEY SE ACOTA, NO SE DEROGA (firma del founder,
   > 3-ago-2026, sobre el gate de `019fcabf`; frontera transportada por
   > B y C).** Literal del founder:
   >
   > > *"el de cuenta no sé, una persona, algo que realmente parezca
   > > cuenta"*
   >
   > **DÓNDE SIGUE RIGIENDO — intacta, y es la mayoría del set:** la
   > **iconografía de CONTENIDO** (oficios, servicios, conceptos del
   > expediente). Ahí un humano se dice con **manos u objetos**, sin
   > excepción. *Un glifo de veterinaria con una persona adentro dice
   > "gente" cuando tiene que decir "cuidado de tu mascota".*
   >
   > **DÓNDE SE EXCEPCIONA — la BARRA DE TABS, y solo por su
   > semántica:** en la tab **Cuenta**, la persona **no es el objeto de
   > una acción — es el usuario mismo**. *Ahí una mano u objeto no
   > sustituye a la figura: la esquiva.* La placa de collar de S53 era
   > un objeto **del perro** puesto a nombrar **a la persona** — decía
   > "tu mascota" en el lugar donde el usuario busca "yo".
   >
   > **EL DISCRIMINADOR, para que la excepción no se ensanche sola:**
   > **¿el humano es SUJETO o es OBJETO?** Si el glifo nombra **a quien
   > mira** (su cuenta, su sesión, su identidad) → **la figura es
   > legal**. Si nombra **a alguien sobre quien se actúa** (el cliente,
   > el paseador, el equipo) → **rige la ley 4 original: manos u
   > objetos**. *La excepción es de SUJETO, no de barra de tabs — hoy
   > coinciden, y el día que dejen de coincidir manda el sujeto.*
   >
   > **Lo que NO concede esta enmienda:** ni emojis ni librerías
   > externas (ley 5, intacta) · ni la escala de la huella (ley 3) · ni
   > el gate a 21px (ley 9, y una figura humana es **el caso más duro**
   > de esa ley: se empasta antes que un objeto). **La figura entra con
   > craft que pase el gate del founder POR ÍCONO**, exactamente como
   > la mano — la excepción abre una puerta, no la cruza.
5. **Cero emojis, cero librerías de íconos externas** (hereda Ley 12).
6. **Estado activo en tabs:** la tab activa se marca porque su huella
   APARECE (en reposo, el ícono de tab va solo en trazo). La huella es el
   sistema de estado — sin recuadros, sin pills.

   > **ENMIENDA S82 — LA HUELLA TAMBIÉN PUEDE MARCAR EN UN FILTRO
   > (FIRMADA por el founder en dispositivo, 30-jul-2026, sobre las dos
   > candidatas montadas lado a lado; origen: C, r17 propuesta → r18
   > firma).** **En un filtro, el estado lo puede marcar LA HUELLA — y
   > cuando lo hace, la huella aparece SOLO EN LA OPCIÓN ELEGIDA.** La
   > línea que viaja **NO se deroga**: sigue vigente donde la huella no
   > puede marcar (ver el alcance). Lo que se enmienda es su
   > **exclusividad** — hasta hoy era el único marcador legal de estado
   > en un filtro (frontera S80-B15, `filtro-oficio.tsx`).
   >
   > **EL PORQUÉ, que es lo que esta enmienda existe para dejar escrito:
   > el veredicto de S80 no se contradice, se EXPLICA.** Ahí se midió que
   > *"la huella sola no leía"* — **pero en ese caso la huella estaba en
   > TODAS las opciones**, como identidad del glifo (los b′ llevan una
   > huella rellena por ley 2). **Una marca presente en todos los
   > hermanos no puede señalar a uno: no falló la huella, falló la huella
   > COMO CONSTANTE.** Por eso hizo falta la posición, y la posición la
   > da la línea. En la firma de hoy la huella aparece **solo en la
   > elegida**: marca por PRESENCIA, que es justamente lo que no podía
   > hacer estando en todas. **Es otro mecanismo, no el mismo intento dos
   > veces.** Y resuelve de raíz lo que abrió la ronda: **un eje sin
   > categoría no tiene color propio** (próximos/historial es ESTADO,
   > todos/semana/mes es TIEMPO; solo el eje de SERVICIO tiene categorías
   > — ley 10), así que marcar con color obligaba a pedir prestado un
   > verde de capa ajeno. **La forma no se pide prestada.**
   >
   > **ALCANCE — dónde rige cada una:** filtro del CLIENTE
   > (`FiltroPills`) → **la huella**, solo en la elegida (sus ejes no
   > tienen categoría) · filtro de OFICIO del prestador
   > (`filtro-oficio`) → **la línea que viaja**, porque ahí cada opción
   > ES un oficio y su glifo b′ ya lleva huella: la huella no puede
   > marcar una sin estar en todas · **tabs (§2.6): INTACTO.**
   >
   > **DIVERGENCIA DECLARADA, no escondida:** las dos apps marcan el
   > estado de un filtro de manera distinta. Es legítimo porque la
   > restricción es distinta —el prestador filtra por oficio y sus glifos
   > ya portan huella—, pero **es divergencia y se declara.
   > Unificarlas sería OTRA decisión**, con su costo: tocar un filtro del
   > prestador ya construido, firmado y gateado.
   >
   > **COROLARIO EXIGIBLE — LA HUELLA DE MARCA JAMÁS VA ADENTRO DE LA
   > PLACA.** Lo que mantiene distinguibles las DOS huellas de un chip
   > (la del objeto y la de la marca) es **escala y aislamiento**: dentro
   > del glifo, a 16px y adentro de la placa, es un DETALLE DEL OBJETO;
   > sola, a 13px, al lado del label y fuera de la placa, es una MARCA.
   > **El día que alguien la meta adentro de la placa, vuelve a ser el
   > caso de S80 — una huella más entre huellas — y la firma deja de
   > leerse sin que nadie haya cambiado la ley.** Por eso está MECANIZADO
   > en `R22` de `verify:diseno` (orden del founder): el defecto se ve
   > como decisión de layout, no como cambio de ley — no rompe el build,
   > no cambia un color, no toca nada escrito. **R22 nace con su
   > condición de muerte escrita:** se retira el día que el founder firme
   > un diseño donde la marca viva adentro de la placa (en el MISMO
   > commit de esa firma) o que `FiltroPills` suba a `packages/ui` con el
   > invariante en el CONTRATO del componente.
   >
   > **Murió con la firma (Ley 37):** la línea viajera del filtro del
   > CLIENTE y su maquinaria (vive intacta en el prestador) · el relleno
   > pleno del chip sin glifo, que había nacido como sustituto — **dos
   > marcas para un mismo estado es el tercer peso que no informa**.

   > ### ENMIENDA S85 — LA REGLA GENERAL QUE ESTABA ABAJO DE LAS DOS
   > **(derivada por C, FIRMADA por la mesa, 3-ago-2026.)**
   >
   > > **LA HUELLA QUE ES *ESTRUCTURA* SE RECOLOREA. LA QUE ES *MARCA*
   > > APARECE.**
   >
   > **No es una tercera regla: es la que explica a las otras dos**, y
   > por eso se escribe acá y no como ley aparte.
   >
   > - **ESTRUCTURA** = la huella está **siempre**, porque es identidad
   >   del glifo (ley 2: todo b′ lleva UNA huella rellena). **Está en
   >   todos los hermanos** ⇒ su presencia no puede señalar a ninguno, y
   >   el estado se marca **cambiándole el color**. *Caso vivo: el filtro
   >   de OFICIO del prestador.*
   > - **MARCA** = la huella **se agrega para decir el estado**. En
   >   reposo no está ⇒ su **aparición** ES la señal. *Casos vivos: las
   >   tabs (ley 6) y `FiltroPills` del cliente.*
   >
   > **POR QUÉ IMPORTA MÁS DE LO QUE PARECE:** el veredicto de S80
   > —*"la huella sola no leía"*— y la firma de S82 —*"la huella marca
   > por presencia"*— **parecían contradecirse durante dos sesiones**, y
   > la enmienda de arriba tuvo que argumentar largo para reconciliarlas.
   > **Con esta regla no hay nada que reconciliar: eran dos mecanismos
   > distintos y nadie los había nombrado.** *Una regla que convierte una
   > excepción explicada en un caso previsto vale más que la excepción.*
   >
   > **CÓMO SE USA — es un DISCRIMINADOR, se contesta antes de dibujar:**
   > *"¿la huella está en reposo?"* **Sí ⇒ recoloreá. No ⇒ que
   > aparezca.** *Nunca las dos: dos marcas para un mismo estado es el
   > tercer peso que no informa (misma razón que mató al relleno pleno,
   > tres líneas más arriba).*
   >
   > **CONSECUENCIA A VERIFICAR, no verdicto:** los tres glifos rebotados
   > en el gate de `019fcabf` (**Datos · Negocio · Cuenta**) se rehacen
   > **contra este discriminador** — viven en tabs, donde la huella es
   > MARCA. *Si al montarlos alguno pide recolorear, es señal de que su
   > huella dejó de ser marca, y eso es una decisión que se declara — no
   > un ajuste.*
6bis. **LA INSIGNIA DE COHORTE — TERCERA FAMILIA (S85, firmada por la mesa).**
   La `Insignia` tenía dos familias (estado · conteo) y nace la tercera:
   **`distincion`** — *pastilla PLENA con la palabra entera*.
   > **No comparte forma con las otras dos A PROPÓSITO: estado y conteo dicen
   > **cómo está** algo; la distinción dice **a qué pertenece alguien**.**
   **Y su eje es el TIEMPO, jamás el mérito** (`"Desde 2026"`, no
   `"Prestador fundador"`): *un hecho verificable **no otorga nada** y **no
   puede envejecer mal***. **El «N» de orden NO se muestra** — *un «N»
   convierte una pertenencia en un PUESTO*, y quien lee un número alto recibe
   lo contrario de lo que el emblema existe para dar (misma tesis que
   `MODELO_LOYALTY` §2/§3: progreso visible, **moneda invisible**).

6ter. **EL GLOW — SOLO en la tarjeta del servicio EN CURSO (S85, firma founder).**
   **No es enmienda de la Ley 7: es aplicarla donde ya significa *"en vivo"*.**
   > **Un glow repartido pierde su significado. Su valor entero es que aparece
   > en UN lugar** — el mismo criterio con que `CitaEnVivo` reservó su pill
   > desde S44. *Un efecto que marca "esto está pasando ahora" deja de marcar
   > nada apenas marca dos cosas.*

6quater. **EL PAPEL TAPIZ DEL OFICIO: 5% (S85, firma founder — subió de 3%).**
   **Y el número vino CON su verificador, que es parte de la firma:** *B re-mide
   `R12` y `R16` antes de commitear, y **si algo cae bajo el mínimo, FRENA**.*
   > **Es lo contrario del `cupo_techo` en 4 y del `> 4` del wrapper** — dos
   > números que entraron **sin verificador** y sobrevivieron a su premisa.
   > *Un número firmado sin quién lo verifica es una premisa esperando vencer.*

7. **Dosis del prestador:** el mismo lenguaje, con la huella en el color
   funcional AA de su capa (no hex puro) o en tinta cuando la vista ya
   porta su único acento — la sobriedad es aplicación, no otro idioma.
8. **Memorial degrada:** la huella pasa a tinta (`text.secondary`), el
   trazo se conserva. Jamás color en memorial.
9. **Legibilidad mínima:** todo ícono se gatea a 21px (tamaño tab)
   además de su tamaño de diseño. Si a 21px la huella no se lee, el
   ícono se simplifica — no se encoge la huella.
   **CRITERIO AFILADO (founder, gate S71): a 21px LA HUELLA DEBE
   SOBREVIVIR O ES RUIDO.** No es "se lee con esfuerzo": si a 21px la
   huella se empasta con el objeto, el ícono **no entra al set** hasta
   simplificarse. La huella es lo que hace al glifo NUESTRO (regla
   madre §1) — un glifo cuya huella muere a 21px es un glifo genérico
   con decoración invisible, y ahí el ruido cuesta más que el ícono.
10. **LA TAXONOMÍA DE CAPAS Y LA LEY DEL REPARTO (S80, FIRMADA por el
    founder — un solo acto con el cierre de D-573):**

    | Categoría | Capa/token | Servicios adentro (del destino, SOFTLAUNCH §2) |
    |---|---|---|
    | **SALUD** | verde vital (`capa.identidad`) | veterinaria · telemedicina · seguros |
    | **CUIDADO** | teal (`capa.cuidado`) | paseo · grooming · adiestramiento · hotel · guardería |
    | **COMUNIDAD** | pink (`capa.comunidad`) | adopción · refugios · donaciones |
    | **CONSUMO** | terracotta (`accent.warm` hoy; su slot de capa nace cuando la tienda lo pida) | tienda · despensa |
    | **MARCA/AFECTO** | magenta — **RESERVADA, §8.2: no es capa de servicio** | — |

    **LA LEY DEL REPARTO, que es lo que hace que esto escale: EL CANTO
    DICE CATEGORÍA (conjunto CERRADO, tope 5). EL GLIFO DICE SERVICIO
    (conjunto ABIERTO).** Un canto de 3px distingue 4-5 cosas; la
    taxonomía que crece va al glifo, que ya lo hace bien (el registry
    ya tiene hotel/guardería/seguros/telemedicina). **Corolario: si la
    taxonomía pasa de 5, hay que cambiar de MECANISMO, no de paleta.**

    **Consecuencia declarada: paseo y adiestramiento comparten canto A
    PROPÓSITO — los dos son CUIDADO. Los separa el glifo.** El "4º
    tono" (B10-③) deja de existir como problema.

    **Terracotta, verificada antes de depositar (los tres temas):**
    claro = `terracottaDark #AF5433` (oscurecido en S43-B2 exactamente
    para pasar AA sobre el base) · oscuro = `terracotta #D97757` —
    ambos DENTRO del gate programático corrido hoy (**178 pares / 0
    fallos**, vía `accent.warm`/`warmBg`/`warmBorder`) · memorial NO
    porta terracotta y NO DEBE: la ley 8 degrada toda capa (jamás
    color en memorial) — N/A por ley, no hueco.

## 3. ENMIENDA a la Ley 12 de `epetplace-design-system`

La Ley 12 decía "UN color por ícono". Queda: **"UN color de trazo (tinta
del contexto) + UNA huella rellena en el hex puro de su capa (lenguaje
b′, DIRECCION_ARTE §2). El resto de la Ley 12 (outline 1.75→1.9 en el
set nuevo, remates redondeados, cero emojis, cero librerías nuevas)
queda vigente."** Los íconos pre-b′ (campana S46, tabs S51, servicios
S52) migran al lenguaje cuando su pantalla se toque — deuda de
extracción visual, misma mecánica que D-315.

## 4. El lenguaje de ILUSTRACIÓN: los guijarros (de la propuesta c)

Para momentos ilustrativos — estados vacíos, onboarding, momentos de
marca, educación del despliegue progresivo — vive el **guijarro**: forma
orgánica irregular (jamás círculo perfecto, cada una rotada distinto) en
el tinte suave de su capa, con el motivo en trazo encima. Reglas:

- Solo en superficies GRANDES (EstadoVacio, heros, Hojas educativas).
  Jamás en celdas densas, tabs ni chips.
- El set ilustrado de especies (D-288) nace bajo este lenguaje cuando
  dispare.
- Puede convivir con la huella (un guijarro puede contener la huella).

## 4bis. CANDIDATA S80 — LA LUZ DE LA ESQUINA LLEVA LA NARIZ (espera gate del founder; SIN firma)

**QUÉ CAMBIA: la forma.** El círculo genérico pasa a ser el ISOTIPO —
la nariz.

**QUÉ NO CAMBIA, y es la mayor parte:** la dosis (blanco al 7%), la
posición (esquina superior derecha, centro fuera del lienzo), la escala
(~60% del ancho del techo), y la regla dura de A4 — **SIGUE SIENDO EL
ÚNICO ADORNO PERMITIDO EN UN TECHO**. Esta enmienda no agrega un
elemento: le da identidad al que ya existe. *(La letra madre de A4 —
✅ FIRMADA — vive en **§9bis.2** desde S81; había pasado por
`DIRECTIVA_CRAFT_CLIENTE` Bloque A en el depósito S80-A6, y la nota de
sin-casa que esta sección llevó quedó resuelta entonces.)*

**EL PORQUÉ** (§5b, que ya separó los dos símbolos): la nariz es QUIÉN
SOMOS; la huella es QUIÉN ESTÁ. Un fondo no dice quién está presente —
dice de quién es esta casa. Por eso el que se disuelve en el techo es
el isotipo, JAMÁS la huella. Un techo con huellas de fondo diría "acá
hay mascotas" en una pantalla donde puede no haber ninguna.

**LA GUARDA, o se arruina:** al 7% y disuelto, no puede leerse como
patrón repetido ni pedir atención. **Si se NOTA como decoración, ya es
demasiado.** Una sola, jamás repetida, jamás en dos superficies de la
misma pantalla.

**EL GATE — cuatro veredictos explícitos, en dispositivo:**

1. **LEY 9 A ESCALA NUEVA.** El círculo lee a cualquier tamaño porque
   no tiene detalle interno; la nariz sí lo tiene. En el techo MÁS
   CHICO que existe hoy (~96 px), ¿la nariz SOBREVIVE o es barro? Si se
   empasta, se simplifica la silueta — no se sube la opacidad.
2. **EL DEGRADADO.** El techo tiene dos paradas (A3). Un blanco al 7%
   contrasta distinto arriba que abajo. ¿La nariz se lee pareja o
   aparece y desaparece según dónde caiga?
3. **EL TEMA OSCURO.** En tealDarkNoche el 7% se comporta distinto.
   Veredicto propio, no heredado del claro.
4. **EL RECORTE.** Con el centro fuera del lienzo, ¿qué parte de la
   nariz entra? Es decisión de composición y se firma con la forma a la
   vista, no antes.

**SI EL GATE FALLA: A4 QUEDA COMO ESTÁ.** Es ley firmada; una candidata
no la erosiona por defecto.

**BLOQUEO — RESUELTO (S80-B7):** el boceto exigía el path real del
isotipo. Está extraído: vive en `packages/ui/src/brand/Isotipo.tsx`
(`PATH_D`, viewBox 471.82×324 — la nariz del Manual de Marca,
`Iso_Estandar0.svg`). **El boceto consume ESA fuente única — dibujarlo
de memoria sería L-139; duplicar el path en otro archivo sería D-546.**

## 5. El motion de marca

1. **El destello de la IA** (adoptado de Kaxo, decisión founder): trío de
   chispas cóncavas de 4 puntas a tres escalas (paths canónicos minados
   del SVG de Kaxo, S53). RE-TOKENIZADO: magenta puro #FF00AF (jamás el
   mostaza de Kaxo). Es LA marca del Coach: vive en el Encabezado del
   Hogar (con punto de novedad cuando corresponda) y en toda entrada
   contextual de la IA. En memorial NO destella (degrada a tinta,
   quieto).
2. **La apertura del Coach:** Hoja (componente existente) con la física
   minada del prototipo: `translateY` con curva `cubic-bezier(.32,.72,0,1)`,
   ~340ms, scrim a .4. En nativo se implementa con el equivalente
   Software Mansion (la skill pone el código; esta curva es el criterio).
3. **La espera de marca (ENMIENDA a la Ley 13 de la skill, founder S52→53):**
   skeleton estático para carga de contenido queda INTACTO; para esperas
   de PROCESO >2s (lectura de carnet, pagos futuros) vive una animación
   de marca — la huella/isotipo trazándose en loop sereno — SIEMPRE con
   la voz honesta debajo ("puede tardar un minuto"). Es la única
   animación de espera legal, y es de marca, no shimmer.
4. **REGISTRO S80 — los valores del movimiento (founder, rediseño del
   portal):**
   · **Entrada de contenido:** escalón **120 ms** entre elementos
     *(ENMIENDA FIRMADA S81 — founder: el 45 de S80 pasó a 120,
     `motion.stagger.slow`, el token de la casa; el porqué medido en el
     lazo regla 80 de B: con 45, tres bloques resolvían en ~390 ms y el
     escalonado no se PERCIBÍA como orden de lectura)* ·
     duración **300 ms** · `cubic-bezier(.32,.72,0,1)` (la física de la
     casa, ya canónica en el punto 2) · desde `translateY: 15`.
     **Rápido lo funcional.**
   · **Brillo de placa (§8.5):** **6 s LINEALES, en loop** (número del
     founder, S80, sobre lámina — cerrado en A5). **Lento lo material:
     6 s es el paso del vidrio; por debajo de ~4 s se lee como LED.**
   *Nota (mesa A7, alcance corregido en A8): la presión rige por
   `usePresionado` (0.97/0.99, receta única S62); el 0.972 de las
   láminas S80 fue transcripción imprecisa, no calibración — un tercer
   valor sería enmienda de primitiva con gate propio. De la lámina, la
   ENTRADA (300 ms / bezier .32,.72,0,1 / translateY 15; escalón 45→
   **120 FIRMADO S81**) es la única pieza firmada y este registro es su
   fuente única. Dos
   CANDIDATAS sin firma esperan gate propio: el empuje de pantalla
   −16% (a §5.2 — la pantalla que retrocede) y el overshoot 280 ms de
   la huella de tab (a la Ley 6/§2.6 — el CÓMO aparece). La
   reconciliación entera: `DIRECTIVA_CRAFT_CLIENTE` §0bis.*

## 5b. La nariz considerada — por qué la huella (nota S53)

El isotipo de la marca nace de la NARIZ: es QUIÉN SOMOS. La huella de
los íconos dice otra cosa: QUIÉN ESTÁ — la mascota presente en el
concepto. Dos símbolos, dos preguntas; por eso el acento del set b′ es
la huella y no la nariz. **Disparo de reconsideración:** si el ensayo
con usuarios muestra que la huella NO se lee como mascota, esta
decisión se reabre.

## 6. Gobernanza del set

- El set nace en `packages/ui` (`Icono` con nombre tipado — cero strings
  mágicos), galería propia en los 3 temas, gate founder POR ÍCONO.
- Primer lote firmado en dirección (S53): paseo (correa+huella), vet,
  grooming, refugio, despensa, coach (destello). El lote 2 sale del
  relevamiento de íconos existentes en las apps.
- **Cláusula del ilustrador — ENMENDADA (decisión founder, S71):** los
  glifos b′ los AUTORA LA SESIÓN en SVG, con gate founder POR ÍCONO a
  21px (precedente S58); **no hay ilustrador externo**. La salvedad
  original (contratar afuera si el primer lote no alcanzaba la vara)
  quedó superada por los hechos: los lotes construidos pasaron sus
  gates. Este documento sigue siendo la ley del lenguaje; el gate por
  ícono sigue siendo la vara. *(Letra original: si el primer lote
  construido no alcanza la vara del founder, se contrata un ilustrador
  externo para FIRMAR el pulso del trazo.)*
- Este doc se enmienda con historial, como todo canónico.

### 6b. EL ESTÁNDAR DE LA HOJA DE CONTACTO (proceso, firmado S71)

Con la cláusula del ilustrador enmendada, **la sesión autora los glifos
— así que el método deja de ser tácito y se vuelve exigible.** La vara
es la hoja de contacto de S71-B2 (los glifos `caso` y `presupuesto`).
Todo glifo nuevo llega al gate founder con:

1. **Estudio de familia DECLARADO EN NÚMEROS**, no en adjetivos: grilla
   **24** · trazo **1.9 round** · aire **~3.4** · densidad **2-4 trazos**
   · escala de huella por tamaño. Si el glifo nuevo se sale de esos
   números, el desvío se declara con su porqué — no se disimula.
2. **Metáforas OCUPADAS mapeadas.** Antes de dibujar se lista qué
   conceptos del registry ya usan qué objeto, para no colisionar (el
   caso vivo: `pagos` existe y NO es "presupuesto" — cotización ≠ cobro).
3. **2–3 variantes, con el RIESGO DECLARADO POR VARIANTE** (qué puede
   leerse mal, con qué se puede confundir). Una sola propuesta no es un
   estudio: es una corazonada.
4. **Montaje a 21px Y 44px, junto a 5 glifos del registry**, en claro y
   oscuro. El glifo se juzga EN VECINDAD — un glifo que solo funciona
   solo, no funciona.
5. **Gate founder POR ÍCONO** (nunca por lote): la firma es de a uno.

**El criterio de muerte es el de la Ley 9 afilada:** a 21px la huella
sobrevive o el glifo no entra. **Y la regla de economía:** un glifo que
nadie va a montar no se pide — pedirlo es fabricar deuda (precedente
S71-B2: de 5 conceptos faltantes se pidieron los 2 que la pantalla
montaba; los otros 3 esperan a que su superficie tenga boceto).

## 6bis. REGISTRO S78 — el glifo del MICRÓFONO: gate por ícono PENDIENTE

> `DictadoEnVivo` (S78-B, la puerta del dictado en vivo) entró al gate de
> graduación del founder y **el flujo dio VERDE — pero el gate POR ÍCONO
> (§2.9: todo ícono se gatea a 21px, veredicto explícito por ícono) NO
> tiene veredicto transcrito.** Se registra PENDIENTE, no aprobado por
> arrastre: un verde de flujo no firma un glifo (la misma distinción que
> §6 exige — el gate es POR ÍCONO). Se resuelve en el próximo gate visual
> del prestador o junto al diseño de la vitrina (S79-B).

## 7. NOTA DE DIRECCIÓN FIRMADA S73 — el color completo, sin borde, con sombra

Letra del founder (gate del entity chip, 21-Jul-2026), textual:

> *"Me gusta mucho más el color completo y sin borde marcado con algo de
> sombra: le da imagen y presencia y le quita lo caricaturesco."*

Ligada a la **Ley 20 de la skill** (la regla Chanel del marco: la
superficie que gana elevación PIERDE el hairline — vara Airbnb, sombras
sutiles) y al **diagnóstico de la crisis de craft S70** ("el diseño no me
enamora"): es el founder nombrando el ANTÍDOTO — presencia por
superficie y sombra, no por contorno. Primer portador: el entity chip
del selector de mascota (S73). Cuando D-499 dispare (el LLENO a todos
los selectores), no será cambio de opinión — será esta dirección
cumpliéndose.

### ➕ S86 — LA REGLA CHANEL GANA SU **CONDICIÓN** (firma founder)

> ### **«BORDE + SOMBRA = DECIRLO DOS VECES» RIGE **CUANDO LA SOMBRA LO DICE**. EL LÍMITE LO PONE EL **CONTRASTE**.**

**La regla era correcta y su alcance era ciego:** quitaba el hairline
**siempre** que hubiera elevación, sin preguntar si la elevación se
**veía**. **Medido en claro: la tarjeta `#FFFFFF` sobre el papel algodón
`#FAF9F7` da un contraste de `1.052`** — *una sombra que no se ve no dice
nada, y quitarle el hairline no elimina una redundancia: elimina el
único límite que la superficie tenía.*

**⇒ EN CLARO, LA SUPERFICIE EN REPOSO RECUPERA SU HAIRLINE.** En oscuro
la regla sigue intacta: ahí la sombra **sí** habla.

*(El borde de TINTE nunca fue hairline —es semántico de capa/status— y
se conserva en los dos temas.)*

### ➕ S86 — `border.presente`: JERARQUÍA **ENTRE DOS BORDES** (firma founder)

**Nace para el único caso donde dos bordes tienen que distinguirse ENTRE
SÍ: la gramática ESTÁ / ESPERA de `TarjetaEstado`.** *No es «un borde más
fuerte»: es el segundo escalón de una escala de presencia.*

| tema | valor | contraste medido |
|---|---|---|
| **claro** (`palette.light5` `#C4BFD8`) | — | **1.693** sobre papel algodón `#FAF9F7` · **1.663** sobre el tapiz del oficio `#F4F8F6` |
| *comparación* (`light4`, el borde normal) | — | **1.234 / 1.212** ⇒ el presente separa **≈1.4×** |
| **oscuro** | `palette.dark5` | — |
| **memorial** | `rgba(143,166,142,.30)` | — |

**Y lo que se DESCARTÓ, con su razón:** `#B8B2CE` (**1.938**) separaba
más **y empezaba a leerse como MARCO**. **La Ley 20 mata el marco**, y lo
que hace falta acá es **jerarquía entre dos límites, no encerrar**.

## 7bis. EL EJE DEL RELLENO — FIRMADO (founder, 29-jul-2026, S81)

**SE RELLENA LO QUE EXISTE · SE CONTORNEA LO QUE SE FIJA** (ley 19.8
del diccionario de la skill, propuesta S73 → FIRMADA S81 — el acto que
ordena el rediseño con selectores: las filas del censo D-499 se
clasifican con esta vara). Prueba: *"¿esto existiría igual si yo no
estuviera reservando?"* — árbitro de borde: el CATÁLOGO (fila con
nombre+precio = existe = relleno; parámetro = se fija = contorno).

**La nota del cruce, misma firma:** L-b de `DIRECTIVA_CRAFT_CLIENTE`
(el relleno pleno se cae con ≥4 hermanos) **NO queda derogada —
convive como ley de DOSIS**. EL EJE dice **QUÉ** se rellena; L-b dice
**CUÁNTO** relleno pleno tolera una fila. Es la dirección de §7 (el
color completo con sombra) ganando su criterio de aplicación.

## 8. LA DOSIS DE LA RAMPA (leyes de craft S80, firma founder)

**8.1 — La rampa se INUNDA en la marca y se ACENTÚA en el producto.**
Mismo alfabeto, dos volúmenes. Evidencia: el feed de Instagram vivo —
la marca allá afuera se permite el degradado a superficie completa; el
producto lo administra en acentos.

**8.2 — EL MAGENTA TIENE TRABAJO.** Sus tres empleos: marca/afecto
(§2), el destello del Coach (§5.1), y el control que elige. **Donde no
hay ninguno de los tres, el magenta MIENTE: promete una acción que no
existe.** Turquesa, lima y amarillo son solo-marca (no prometen nada) y
por eso pueden decorar. Origen: firma founder S80, sobre dos rechazos
concretos — magenta en la fecha y magenta en un dato de contexto.

**8.3 — LA MARCA VIVE EN LA FIRMA.** El taller es sobrio. La rampa
entra donde el prestador SE VE A SÍ MISMO (el monograma, la pill de
fundador) y en los momentos. Jamás en la herramienta.

**8.4 — DIRECCIÓN DE LA RAMPA: turquesa → magenta, SIEMPRE**, en todo
degradado de marca (monograma incluido). Era inconsistente en la lámina
S80; se fija acá.

**8.5 — EL BRILLO ES DEL OBJETO.** Legal donde la cosa ES un objeto:
placa, sello, credencial — la luz sobre el vidrio de `PORTAL` §2.2.
**PROHIBIDO sobre texto, botones o datos.** Censo al firmar: UNO (la
pill "Prestador fundador", acotada a los ~15 fundadores). Su duración:
**6 s lineales, en loop** (§5.4, firmado S80 — el paso del vidrio; por
debajo de ~4 s se lee como LED). Deuda ligada:
**D-572** (el contraste de la tinta sobre la pill mientras brilla no
está medido — WCAG AA sobre el punto más claro de la rampa).

**8.6 — LA LUZ MARCA LO QUE CAMBIÓ.** Dato en reposo, sobrio. Al
cambiar se enciende en turquesa y VUELVE SOLO. **Corolario exigible: si
todo queda encendido, nada informa — el retorno no es opcional.**

## 9. COMPOSICIÓN Y FORMA (leyes de craft S80, firma founder)

**9.1 — DOS CANTOS, DOS VOCES.** Canto de CAPA (un tono, degradado en
alfa) = tu trabajo, y de qué oficio. Canto de MARCA (turquesa→magenta)
= acá te habla e-PetPlace. **Nunca en la misma tarjeta.** Censo del
canto de marca en el portal: `PORTAL` §2.3 bienvenida · §2.5
aspiracional · §2.7 hitos · §3.3 Día 30 · §4 graduación.

**9.2 — POSICIÓN DEL CANTO.** Al BORDE cuando distingue entre hermanos
(trabajo de barrido). ADENTRO cuando es voz única. **Es propiedad del
TIPO de tarjeta, no del instante** — una tarjeta de servicio lleva su
canto al borde aunque hoy esté sola.

**9.3 — TODA PANTALLA SE DISEÑA CON SU ESTADO REAL PRIMERO.** El boceto
M1 declara qué dato tiene el usuario que la va a ver. **Una pantalla
cuyo boceto solo existe LLENA es una pantalla sin diseñar.** Origen:
tres fallas de campo del mismo día (D-570 · D-571 · el clamp del email)
— ninguna fue de craft, las tres de composición. *(Nota de depósito:
al escribir la v1.2 D-570/D-571 estaban citadas sin letra — quedaron
RESERVADAS por regla 66; su letra llegó en la misma sesión (S80-A4) y
están depositadas en `DEUDAS_CANONICAS`. El protocolo D-434/D-435
funcionó.)*

**9.4 — LA FORMA LLEVA EL DATO.** Prueba: tapá el texto. Si la pantalla
sigue diciendo lo mismo, la forma trabaja. Si enmudece, la forma era
relleno. Espejo de L-c (`DIRECTIVA_CRAFT_CLIENTE`, depositada S80-A6:
si al quitar la animación dice lo mismo, sobraba — la misma prueba,
una sobre la forma estática y otra sobre el movimiento).

**9.5 — LA MONOTONÍA ES SÍNTOMA DE COMPOSICIÓN POR PLANTILLA.** Una
pantalla que se repite y se ve igual pase lo que pase es MUDA, no
aburrida. **El antídoto es dejar ver lo real, jamás agregar variedad
decorativa** — un adorno repetido cansa más rápido que la sobriedad.

**9.6 — EL ORIGEN Y EL DESTINO SON PARTE DEL DATO.** Nada aparece de
la nada ni desaparece en la nada; **el destino acusa recibo**. Prueba:
si al terminar no sabés de dónde salió ni adónde fue, la transición
ENTRETUVO en vez de informar. **Corolario: fluidez es CONTINUIDAD
CAUSAL, no suavidad** — una animación suave que rompe la cadena
origen→destino es ruido con buena física. (Primer banco de prueba: la
continuidad lista-del-día→cita de B7 — una tarjeta que al volver no
regresa a SU fila es una transición fallada por esta ley, por más
correcta que sea su curva.)

**DISPARO DE RECONSIDERACIÓN DE §8-§9 (obligatorio, mecánica §5b):**
estas leyes nacieron de la LECTURA del founder sobre la lámina S80, no
de un ensayo con prestadores. **Se reabren si la cohorte de 15 muestra
que no leen lo que dicen leer.**

## 9bis. EL BLOQUE A DEL LADO CLIENTE (depósito S81 — fuente única desde acá)

> **Origen y estatuto:** firmas del 26-jul-2026 (sesión de craft founder
> + arquitecto sobre láminas), depositadas en `DIRECTIVA_CRAFT_CLIENTE`
> S80-A6, **migradas acá en S81** porque el Bloque A es ENMIENDA DE LEY
> (§0 de la directiva: nada se construye antes de que esté en la ley).
> **Este depósito NO entra al disparo de reconsideración de §8-§9** (la
> cohorte de 15): su procedencia es otra sesión y otra firma. Lo ✅
> FIRMADO rige; lo SIN FIRMA entra como CANDIDATA con gate propio —
> regla del hueco 1 de la directiva: `ACTA_DISENO_CRAFT` (el hermano de
> los porqués) NO EXISTE, así que **lo sin-firma se RE-ARGUMENTA en su
> gate, jamás se hereda**. Alcance: LADO CLIENTE (la dosis del
> prestador §15b es otra; el teal oscuro sigue siendo suyo — directiva
> §10). Las láminas de origen son web hechas a mano: SON CRITERIO, NO
> EVIDENCIA — toda calibración se traduce a los rieles de RN
> (elevation/shadow\*, Reanimated) en su gate, no por copy-paste de CSS.

**9bis.1 — SIN CAJA (A6). ✅ FIRMADA (26-jul-2026).** Letra literal
completa: **"SIN CAJA."** Su alcance fino se lee en el gate de cada
pantalla — el porqué vivía en el acta hermana que no existe, y **no se
reconstruye** (reconstruirlo sería L-139): la firma es del QUÉ.

**9bis.2 — LA LUZ DE LA ESQUINA (A4). ✅ FIRMADA.** Círculo de blanco
al 7% desbordando por la esquina superior derecha del techo, diámetro
~60% del ancho, centro fuera del lienzo. **Es el ÚNICO adorno permitido
en un techo.** Esta es la letra madre (antes vivía en la directiva; la
nota de sin-casa de §4bis quedó resuelta en S80 y la casa definitiva es
esta). La candidata §4bis (la nariz) la ENMIENDA solo si su gate de
cuatro veredictos pasa; **si falla, A4 queda como está**.

> **ENMIENDA S82 — EL VALOR ES POR CONTEXTO, LA INTENCIÓN NO CAMBIA
> (corrección del founder en dispositivo, 30-jul-2026; origen: C, commit
> `551e332`).** **A4 NO SE MATA.** Se conservan la intención, **el alfa
> FIRMADO (7%)**, el diámetro (~60% del ancho) y el desborde por la
> esquina superior derecha: **lo único que cambia es el REGISTRO del
> color, resuelto POR CONTEXTO — sobre techo OSCURO la luz es BLANCA,
> sobre techo CLARO es TINTA.** Es el patrón que la casa ya tiene
> probado (tealDark: mismo color, otro registro; y el tapiz). El valor
> sale del token del tema (`text.primary` + opacity), **jamás de un
> literal**.
> *El porqué de esta enmienda es un ERROR DE MÉTODO declarado por su
> autora, y la distinción importa: la MEDICIÓN era correcta (blanco al
> 7% sobre tinte claro no se ve) pero la CONCLUSIÓN estaba mal — matar
> A4 apoyándose en L-c era resolver EN SILENCIO un choque contra letra
> firmada, que es justo lo que la casa prohíbe (precedente S63: el
> choque SE DECLARA, jamás se difiere callado). La letra de A4 dice "el
> ÚNICO adorno permitido EN UN TECHO", sin acotar a techo de marca.*
> **AL GATE, declarado y NO resuelto:** si la inversión TAMPOCO se lee,
> entonces A4 necesita **ALCANCE FINO** ("en un techo de MARCA") — y eso
> **lo firma el founder, no se deduce de una pantalla**. Por eso el
> techo claro **NO PROPAGA** a los otros oficios hasta esa firma: si la
> luz muriera en cada techo, A4 moriría en veinte pantallas sin que
> nadie lo haya decidido.

**9bis.3 — LA EXCLUSIÓN DE #0F5E56 (A5, la mitad que es ley). ✅
FIRMADA.** **#0F5E56 y familia quedan FUERA del lado cliente** — es
barro, no está en la marca, y colisiona con el acento firmado del
prestador. Las otras dos mitades de A5 NO viven acá y se referencian
para no duplicar: los 6 stops de la rampa del isotipo (#ff00af ·
#d32eb7 · #68a2cd · #28e8da · #90ff8b · #fff645) viven como
`gradients.logo` en `packages/ui/src/tokens/palette.ts` (fuente única
de los hex), y el estatuto solo-marca de los verdes/amarillo es ley v4
vigente. **Nota de no-confusión (heredada del censo S80):** la rampa de
MARCA de §8.4 (turquesa→magenta) es OTRA regla — dirección de
degradados de marca en producto, no los stops del isotipo.

> **ALCANCE FINO S82 — EL ESTATUTO SOLO-MARCA CUBRE EL ROL INFORMACIÓN,
> Y UN CTA DECIDE (30-jul-2026; origen: B, `d7fe130` r15 ②, ratificado
> al firmar el oro en `788bc1b`).** La pregunta que lo forzó fue si el
> amarillo de marca `#fff645` podía ser el CTA del tema oscuro. **No, y
> el porqué es de alcance, no de gusto:** el estatuto solo-marca cubre
> el rol **INFORMACIÓN** — **un CTA DECIDE, no informa**, así que
> usarlo ahí sería **ENMENDAR el estatuto, no aplicarlo**, y eso exige
> firma propia. **Desenlace: `#fff645` quedó RETIRADO** (el oro
> `#FCBC1D` sirve a los DOS temas con un solo color y lo volvió
> innecesario) ⇒ **el estatuto solo-marca de los verdes y el amarillo
> sigue INTACTO, sin enmienda.** *Lección de método que deja: cuando un
> candidato obliga a tocar una ley firmada, la salida barata suele ser
> un candidato mejor — no una enmienda.*

**9bis.4 — CANDIDATAS SIN FIRMA (gate propio; NO RIGEN hasta su gate):**

- **A1 — la escala de la huella en números: 0.70 de la grilla en glifos
  de superficie, 0.50 en tabs.** La regla madre §1 y la ley §2.3 ya
  firman que la huella es el relleno prominente; **el NÚMERO fijo por
  contexto es nuevo y espera gate**. Choque declarado, no resuelto: el
  0.50 de tabs queda POR DEBAJO del rango 0.7–1.1 que §2.3 firma — el
  gate de A1 resuelve ese choque (enmienda §2.3 o rechazo), nadie lo
  resuelve por arrastre.
- **A3 — EL MATERIAL DEL TECHO: dos paradas del mismo tono (claro
  arriba → oscuro abajo, ~175°), sombra proyectada del MISMO color al
  34-38%, luz interior de 1px al 16% en el borde superior.** La mesa lo
  usó en tres láminas y §4bis lo cita ("el techo tiene dos paradas
  (A3)") — pero SIN FIRMA: gate propio en dispositivo. Su traducción a
  RN (la "luz interior 1px" y la sombra son calibraciones de lámina
  web) se decide en ese gate.

**9bis.5 — Registro de lo que NO vive acá:** **A2** (el resto en trazo;
la huella único relleno) ES la regla madre §1 (S53, firmada) — fuente
única §1, no se duplica. **A7 está VACÍA** — número sin letra (su
literal remitía al acta hermana que no existe) — **y NO SE
RECONSTRUYE**: nace cuando su literal llegue (protocolo D-434/D-435).

## Historial

- **v1.5 (S85-A, 3 Ago 2026 — DOS firmas sobre §2):**
  **(a) LEY 4 ACOTADA, no derogada** (firma del founder sobre el gate de
  `019fcabf`; frontera transportada por B y C). Sigue rigiendo en la
  **iconografía de CONTENIDO**; se excepciona **donde el humano es
  SUJETO** — la tab Cuenta, *"una persona, algo que realmente parezca
  cuenta"*. El discriminador firmado es **sujeto vs objeto**, no "barra
  de tabs": *hoy coinciden, y el día que dejen de coincidir manda el
  sujeto*. La placa de collar de S53 muere con su diagnóstico escrito —
  **era un objeto DEL PERRO puesto a nombrar A LA PERSONA**. No concede
  nada más: ley 5, ley 3 y el gate a 21px de la ley 9 quedan intactos, y
  **la figura entra POR ÍCONO con gate del founder**, igual que la mano.
  **(b) LEY 6 gana su REGLA GENERAL** (derivada por C, firmada por la
  mesa): ***la huella que es ESTRUCTURA se recolorea; la que es MARCA
  aparece***. No es una tercera regla — **es la que explica a las otras
  dos**: el veredicto de S80 (*"la huella sola no leía"*) y la firma de
  S82 (*"marca por presencia"*) **parecieron contradecirse durante dos
  sesiones y eran dos MECANISMOS distintos que nadie había nombrado**.
  Queda como discriminador corrible antes de dibujar: *¿la huella está
  en reposo?* → sí recoloreá, no que aparezca; **nunca las dos**.

- **v1.4 (C-S81, 29 Jul 2026 — depósito, no firma nueva):** nace
  **§9bis EL BLOQUE A DEL LADO CLIENTE** — la migración que §0 de
  `DIRECTIVA_CRAFT_CLIENTE` exigía antes de toda construcción, cada
  ítem con su estatuto real: **A6 SIN CAJA ✅** (letra literal, el
  porqué no se reconstruye) · **A4 la luz de la esquina ✅** (letra
  madre acá; §4bis la enmienda solo si su gate pasa) · **A5 la
  exclusión de #0F5E56 ✅** (las otras mitades referenciadas:
  `gradients.logo` + solo-marca v4) · **A1 (0.70/0.50) y A3 (material
  del techo) CANDIDATAS SIN FIRMA con gate propio** (choque A1 vs
  §2.3 declarado) · **A2** fuente única §1 · **A7 VACÍA, no se
  reconstruye** (D-434/D-435). §9bis declarado FUERA del disparo de
  reconsideración de §8-§9 (otra procedencia, otra firma). §4bis
  re-apuntada a §9bis.2. Ninguna firma nueva: es mudanza con estatuto,
  no ley nueva.
- **v1.3 (S80-A16, 28 Jul 2026 — FIRMADA founder):** §2 nombra
  CATEGORÍAS (ley 2 enmendada: verde vital SALUD · teal CUIDADO · pink
  COMUNIDAD · terracotta CONSUMO · magenta MARCA/AFECTO reservada) +
  ley 10 nueva (la taxonomía + LA LEY DEL REPARTO: canto=categoría
  cerrada tope 5, glifo=servicio abierto; corolario del mecanismo;
  paseo y adiestramiento comparten canto A PROPÓSITO — el "4º tono"
  muere como problema). D-573 cerrada por (a) en el MISMO acto (§2
  suelta "cuidado" del ocre). Terracotta verificada en gate programático
  (178/0) con memorial N/A por ley 8. Un solo acto por diseño: separar
  la taxonomía del cierre de D-573 reabría la colisión.
- **v1.2 (S80, 28 Jul 2026):** nacen **§8 LA DOSIS DE LA RAMPA** (8.1
  inundar/acentuar · 8.2 el magenta tiene trabajo — con los dos
  rechazos del founder como origen · 8.3 la marca vive en la firma ·
  8.4 dirección turquesa→magenta fijada · 8.5 el brillo es del objeto,
  censo=1 · 8.6 la luz marca lo que cambió, con el retorno exigible) y
  **§9 COMPOSICIÓN Y FORMA** (9.1 dos cantos dos voces con su censo ·
  9.2 posición del canto por TIPO de tarjeta · 9.3 el estado real
  primero — origen: tres fallas de campo del mismo día · 9.4 la forma
  lleva el dato — la prueba de tapar el texto · 9.5 la monotonía como
  síntoma). §5 gana el **REGISTRO S80 del movimiento** (entrada 300 ms /
  la física de la casa desde translateY 15; escalón 45→**120 firmado
  S81**; el brillo de placa
  espera su número — no se construye sin él). Disparo de
  reconsideración declarado sobre §8-§9 entero (mecánica §5b): la
  cohorte de 15 es el ensayo que falta. Deuda ligada: D-572 (contraste
  de la tinta sobre la pill que brilla). Dos referencias del brief
  declaradas sin casa en el repo (L-142): la "directiva de craft" (y su
  "Bloque F"/L-c) y D-570/D-571 — nacen cuando su letra llegue.
- **v1.1 (S71, 20 Jul 2026):** con la cláusula del ilustrador enmendada
  (la sesión autora, no hay externo), el método deja de ser tácito:
  nace **§6b EL ESTÁNDAR DE LA HOJA DE CONTACTO** — estudio de familia
  declarado en NÚMEROS, metáforas ocupadas mapeadas, 2-3 variantes con
  riesgo por variante, montaje a 21px y 44px junto a 5 del registry en
  claro y oscuro, gate POR ÍCONO. Vara: la hoja de contacto de S71-B2
  (`caso` y `presupuesto`). Y la **Ley 9 se AFILA con el criterio del
  founder: a 21px la huella SOBREVIVE O ES RUIDO** — un glifo cuya
  huella muere a esa escala es un glifo genérico con decoración
  invisible. Más la regla de economía: un glifo que nadie va a montar
  no se pide (pedirlo es fabricar deuda).
- **v1.0 (S53, 10 Jul 2026):** dirección firmada. Camino: propuestas
  a/b/c → founder elige (b) "la huella escondida" + guijarros (c) para
  ilustración → crítica founder sobre paseo (figura humana de palitos;
  vara Banco Pichincha: acento = corazón semántico relleno, humanos =
  manos u objetos) → evolución (b′) "la huella presente" FIRMADA.
  Destello Kaxo adoptado re-tokenizado; física de apertura del Coach
  minada del prototipo; enmienda de la espera de marca.


## §2.10 — LA FORMA DEL AVATAR POR POSICIÓN (S74, firmada por el founder)

El squircle 32% (S61-A10) se firmó sobre el avatar **SUELTO**. S74 le pone
su excepción, firmada en el gate del chip chico del filtro por mascota
(verbatim del founder: ***"cara flotante dentro"***):

> **EL AVATAR ANIDADO DERIVA SU RADIO DEL CONTENEDOR; EL AVATAR SUELTO
> CONSERVA EL SQUIRCLE 32%.**

**El porqué:** dentro de un chip, un radio que no sigue la curva del
contenedor hace que la cara **flote** en vez de fundirse con la superficie
que la abraza — el mismo síntoma que el founder diagnosticó en el chip
grande (*"aún con fondo la imagen"*) y confirmó en el chico. **Mecánica:**
`radioEnChip(lado) = ALTO/2 − |ALTO − lado|/2` (reproduce los dos valores
firmados: entidad 52 → **18** · xs en chip 28 → **14**); la pantalla declara
la POSICIÓN (`anidadoEn="chip"`), jamás el número. **No aplica** al avatar
en slot de `Celda` (sin contenedor curvo) ni a las tallas sueltas. La letra
exigible y su censo viven en la skill (Ley 21b) y en `DEUDAS_CANONICAS`.
**Sigue abierto (S74):** la FUSIÓN no está resuelta por geometría — el
material (D-506) y la sombra (D-507) siguen en su lámina.

---

## §11 · S84 — LO FIRMADO SOBRE PÍXELES ⚠️ **PUBLICADO, NO GATEADO**

> **La pasada de gate de S84 NO SE HIZO.** Lo de abajo está **construido y
> publicado**; el ojo del founder se difiere a S85. **Regla 80 al pie: la ley se
> escribe después del resultado firmado** — esta sección registra **lo decidido**,
> y marca qué falta ver.

### 11.1 EL OCRE DEL DESTELLO — firmado, con su respuesta

**El destello del prestador se viste del COMERCIO.** *La pregunta abierta desde
S72 —magenta de capa vs §15b.1— se contesta por un tercer camino: no es el
acento del cliente ni el teal del oficio, es **el color de lo comercial**.*

**⚠️ Y el ORO se cayó por MEDICIÓN antes de que nadie mirara** (S84-B15) — se
descarta con su número, no por gusto.

### 11.2 `Boton` GANA `acento` Y `superficie="muro"` — **sin gate**

Dos variantes pedidas por C y construidas por B. **Ninguna de las dos pasó por el
ojo del founder.** *Se registran para que S85 sepa qué mirar, no como firmadas.*

### 11.3 LOS GLIFOS NUEVOS — **candidato elegido, dibujo NO**

**contacto · documento · fiscal · bancario.**

| lo que SÍ está | lo que NO |
|---|---|
| **el candidato A elegido** en los cuatro | **el dibujo a 21px sin ver** |
| los descartes **medidos**, no por gusto | — |

**Los descartes medidos, que valen tanto como la elección:**
- **CONTACTO** — *el candidato obvio se cayó por medición*, y ganó **EL GLOBO**;
  el perdedor **se retira con su lápida, no en silencio**.
- **DOCUMENTO** — *el retrato es lo que lo salva del idioma ya ocupado.*
- **BANCARIO** — **el censo previo encontró una colisión que lo habría
  arruinado.** *Ese censo es el patrón: se mide el idioma ocupado ANTES de
  dibujar, no después de que dos glifos se parezcan.*

> **⚠️ CÓMO SE FIRMAN, y ahorra una confusión: LOS GLIFOS VIAJAN SIN CONSUMIDOR.**
> La celda no tiene ícono a propósito. **Se firman EN LA GALERÍA, comparando los
> candidatos — no montados en pantalla.** *Si se los busca en la app, no
> aparecen.*

### 11.4 ☠️ LA LÁMINA MUERE ENTERA — también para variantes de token

S83 la mató como instrumento de pantalla y le dejó un último trabajo: comparar
variantes de un token barato. **S84 le retira también eso.**

**La razón es medida:** **la galería viaja en el OTA igual**, así que la lámina
**nunca fue más barata — solo más lejos**. Y el dato que cierra:
**el founder no llega a ella.**

> **UN INSTRUMENTO DE GATE AL QUE EL GATE NO LLEGA NO ES UN INSTRUMENTO.**

**Evidencia de la propia sesión:** las **cuatro variantes del destello** se
montaron en lámina **y el founder no las reportó**. *La lámina hizo su trabajo y
nadie la miró — exactamente el modo de falla que la enmienda nombra.*
