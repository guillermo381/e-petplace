# DIRECCION_ARTE — El lenguaje visual propio de e-PetPlace

> **Versión: v1.1 — S71 (20 Jul 2026).** Enmienda v1.1: nace **§6b el
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

## Historial

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
