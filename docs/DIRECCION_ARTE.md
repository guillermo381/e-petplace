# DIRECCION_ARTE — El lenguaje visual propio de e-PetPlace

> **Versión: v1.2 — S80 (28 Jul 2026).** Enmienda v1.2: nacen **§8 LA
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
   del concepto (teal paseo, verde vital salud/protección, magenta
   marca/afecto, ocre cuidado/consumo). Forma canónica: elipse
   (almohadilla) + tres dedos — el path canónico vive en `packages/ui`
   como primitiva `Huella` y NADIE lo redibuja a mano.
3. **Escala de la huella:** prominente y legible — entre 0.7 y 1.1 de su
   escala base según el aire del ícono; jamás tan chica que se lea como
   punto.
4. **Cero figuras humanas.** Los oficios se dicen con sus objetos. Si un
   concepto exige presencia humana, se dice con una MANO — y una mano
   entra al set solo con craft que pase el gate del founder.
5. **Cero emojis, cero librerías de íconos externas** (hereda Ley 12).
6. **Estado activo en tabs:** la tab activa se marca porque su huella
   APARECE (en reposo, el ícono de tab va solo en trazo). La huella es el
   sistema de estado — sin recuadros, sin pills.
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
elemento: le da identidad al que ya existe. *(Nota de depósito, L-142:
la regla "A4" se cita por orden de mesa S80 y no tiene casa depositada
en el repo al escribir esto — la cláusula "único adorno del techo" rige
por esta cita hasta que su letra madre se deposite.)*

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
   · **Entrada de contenido:** escalón **45 ms** entre elementos ·
     duración **300 ms** · `cubic-bezier(.32,.72,0,1)` (la física de la
     casa, ya canónica en el punto 2) · desde `translateY: 15`.
     **Rápido lo funcional.**
   · **Brillo de placa (§8.5):** **6 s LINEALES, en loop** (número del
     founder, S80, sobre lámina — cerrado en A5). **Lento lo material:
     6 s es el paso del vidrio; por debajo de ~4 s se lee como LED.**
   *Nota de referencia declarada (L-142): el brief S80 rotula estos
   valores como "Bloque F" de la directiva de craft; esa directiva NO
   está depositada en el repo — su casa canónica es ESTE registro hasta
   que se deposite.*

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
relleno. Espejo de L-c (§5.3 de la directiva de craft — directiva NO
depositada en el repo al escribir esto; referencia declarada, L-142).

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

## Historial

- **v1.2 (S80, 28 Jul 2026):** nacen **§8 LA DOSIS DE LA RAMPA** (8.1
  inundar/acentuar · 8.2 el magenta tiene trabajo — con los dos
  rechazos del founder como origen · 8.3 la marca vive en la firma ·
  8.4 dirección turquesa→magenta fijada · 8.5 el brillo es del objeto,
  censo=1 · 8.6 la luz marca lo que cambió, con el retorno exigible) y
  **§9 COMPOSICIÓN Y FORMA** (9.1 dos cantos dos voces con su censo ·
  9.2 posición del canto por TIPO de tarjeta · 9.3 el estado real
  primero — origen: tres fallas de campo del mismo día · 9.4 la forma
  lleva el dato — la prueba de tapar el texto · 9.5 la monotonía como
  síntoma). §5 gana el **REGISTRO S80 del movimiento** (entrada 45 ms /
  300 ms / la física de la casa desde translateY 15; el brillo de placa
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
