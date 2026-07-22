---
name: epetplace-design-system
description: >-
  El design system de e-PetPlace hecho exigible. Cargar SIEMPRE antes de
  cualquier tarea que toque UI en este monorepo: crear o editar pantallas,
  componentes, estilos, colores, tipografía, animaciones, layouts, temas,
  íconos o navegación en apps/prestador, apps/cliente o packages/ui.
  Trigger en: "pantalla", "componente", "estilo", "color", "UI", "diseño",
  "tema", "dark", "animación", "layout", "botón", "card", "input", "lista",
  "modal", "sheet", "toast", "tab", "header", "StyleSheet", "fontFamily",
  "backgroundColor", "craft", "tesis", "firma", "elevación", "pantalla patrón",
  "segmento", "toggle". Autoridad: obliga tokens y componentes de @epetplace/ui,
  prohíbe inventar. Conflictos de stack (Expo/RN/Reanimated) los ganan
  expo/skills y Software Mansion; en SQL manda epetplace-db por encima de todo.
---

# epetplace-design-system — el sistema es exigible, no sugerido

Fuente de verdad: `packages/ui` (tokens v4 + 39 componentes + 3 temas).
Galería viva: tab "Tokens" (`/gallery`) en ambos apps. Si no está en
`@epetplace/ui`, no existe en el producto.

Desde S57 esta skill es EL EQUIPO DE DISEÑO completo, no un manual de
materiales: las Leyes 1–13 dicen CON QUÉ se construye; la capa de craft
(§1b, Leyes 14–22) dice CÓMO se decide que una pantalla está BIEN; y el
protocolo del diseñador (§1c) dice CÓMO SE PIENSA antes de tocar código.
El porqué, del founder: *"cada componente que nace mal es doble trabajo."*

## 1. LAS LEYES DE MATERIALES (1–13 — violarlas = PR rechazado)

1. **Cero hex/valores crudos en apps.** Todo color, tamaño, radio, sombra
   o duración sale de `@epetplace/ui` (tokens o componentes). Cero Views a
   mano donde exista componente: chips→`Insignia`, filas→`Celda`,
   inputs→`Campo`, modales→`Hoja`, toasts→`useAviso`, vacíos→`EstadoVacio`.
2. **Dos registros.** Hex PURO = gráfica (puntos, tints, indicadores,
   isotipo). Variante `*Dark` AA = texto y elemento funcional. AA es
   PROGRAMÁTICO: si tocás `palette.ts` o `themes/`, corré
   `pnpm verify:contrast` y pegá el output en el reporte. Gate en rojo =
   no se mergea.
3. **Regla de voz (MATIZ S53).** JetBrains Mono para metadata CHICA de
   máquina (fechas, horas, IDs inline — minúsculas, tracking suave;
   `Celda.metadataMono` lo fuerza). A ESCALA DISPLAY (números grandes
   de dashboard) el dato viste DM Sans light/regular con
   `fontVariant: tabular-nums` — el dato sigue siendo de máquina; el
   traje cambia con la escala (founder S53, fila hero de Vitales).
   Todo lo vivo/humano va en DM Sans; voz humana = DM Sans 300 en lg+.
   El vocabulario interno del modelo (M1..M7) JAMÁS visible. Las
   FECHAS se formatean con `fechaCortaMono` del riel (una función por
   idioma para todos los módulos — cero formateos artesanales).
4. **Dosis.** Prestador = baja: UN acento de capa por vista, CTA primario
   anclado al OFICIO (tealDark vía `accent.cta` — enmienda Ley 21 S63;
   memorial siempre tinta), sin gradiente UI. Dueño = alta: capas visibles,
   gradiente firma solo en contextos cerrados (hero onboarding, CTA
   principal dueño, momento adopción, y desde S52 el TECHO COMPACTO
   del Hogar — HeroMarca compacto con el saludo por franja). El isotipo es IDENTIDAD: va en
   gradiente oficial por default, fuera de la contabilidad de dosis —
   pero UNO por pantalla.
5. **accent.active: UN elemento activo por vista.** En la raíz ya lo usa
   la `BarraTabs` (el pill) — las pantallas bajo tabs no suman otro.
6. **Motion.** <300ms en UI (tokens de `motion.ts`); spring SOLO como
   confirmación física (pressed). JAMÁS animar: el tipeo (ni labels
   flotantes ni layout shift — `Campo`), el layout de listas, las sombras,
   los estados vacíos, ni nada en memorial (solo fades). Gradiente UI:
   v2 de 3 stops con violeta central y texto BLANCO — 2 stops está
   prohibido (el cyan se dispara a verde en OLED).
7. **Glow es semántico**, no decorativo: reservado a "en vivo/en curso",
   dark only; en claro se traduce a anillo nítido 1.5px + pill "● En vivo"
   (S59 §7.1: la voz única del estado vive en ui.citaEnVivo — jamás literal).
   Un solo elemento vivo por pantalla.
8. **Memorial degrada solo.** Todo componente de marca nuevo trae su
   degradación automática (patrón `Boton marca`→primario,
   `Isotipo`→blanco, `Hoja` sin rebote, `Aviso` solo fade). Memorial no
   es un tema que se soporta: es un momento que se respeta.
9. **Gate en dispositivo** (práctica D-284): la web NO cierra gates de
   componentes. Todo componente nuevo se revisa en teléfono (Expo Go por
   túnel — ver CLAUDE.md raíz, "Gate en dispositivo").
10. **Peers nativos de `packages/ui` con el rango del app, jamás `"*"`**
    (lección B3.1b: pnpm auto-instala peers y `"*"` resuelve otra versión
    → módulo nativo duplicado → build nativa rota).
11. **Protocolo del componente faltante (ENMENDADO S53).** Si la UI
    necesita algo que el set no cubre, PROHIBIDO inline en apps.
    Camino: (a) proponer al founder espec mínima (qué es, qué no es,
    estados) que DECLARA SU ESCALERA (DISEÑO_EXPERIENCIA §4b: qué
    muestra en los peldaños 0/1/2 y qué dato dispara cada subida —
    sin escalera declarada, la espec está INCOMPLETA; si el
    componente no muestra datos del expediente, lo dice explícito),
    (b) nace en `packages/ui` con el método completo — tokens, WCAG
    si trae pares nuevos, galería, gate en dispositivo —, (c) se
    agrega al índice de esta skill. Sin excepción "por esta vez": la
    deuda visual no se paga nunca.
12. **Iconografía (ENMENDADA S53 por `docs/DIRECCION_ARTE.md` §3).**
    Lenguaje b′: objeto del oficio en trazo 1.9 de tinta + UNA Huella
    RELLENA en el hex puro de su capa (la primitiva `Huella` de
    packages/ui — nadie la redibuja). Remates redondeados, cero emojis,
    cero librerías de íconos externas. Los íconos pre-b′ migran al
    tocarse su pantalla (D-318). Todo ícono se gatea a 21px además de
    su tamaño de diseño (§2.9). En tabs, la huella ES el estado activo
    (§2.6 — sin pills con `estadoPorHuella`). DIRECCION_ARTE manda en
    todo lo iconográfico/ilustrativo/motion de marca.
    **ENMIENDA S71 — DÓNDE VA EL GLIFO (firmada por las DOS sesiones en
    la vara cruzada del Antes de la consulta; el refinamiento es de A):**
    **"El glifo marca lo que VARÍA — y la variación es DENTRO DE LA
    UNIDAD DE BARRIDO. Headers que varían entre sí → glifo. Filas del
    mismo tipo dentro de una sección → sin glifo."**
    Un glifo repetido en cada fila de su propia sección no informa: el
    header ya dijo de qué son todas. Al revés, tres headers idénticos sin
    glifo hacen que el ojo no separe secciones que significan cosas
    distintas (identidad clínica · casos · dinero — el diagnóstico del
    Antes). **Evidencia relevada: cuatro casos vivos la cumplen y no se
    halló contraejemplo** — `CeldaNavegacion` (ícono por fila porque cada
    fila va a un destino DISTINTO), la huella de `BarraTabs` (cada tab
    distinta), el punto de capa de `LineaDeVida` (nodos de tipo distinto)
    y los headers del Antes (S71-B2). **Corolario para el catálogo:** si
    un set necesita el MISMO glifo repetido por fila, lo que falta es un
    set POR TIPO — no más repeticiones del genérico (caso vivo: los
    procedimientos del presupuesto, mandato S72-P2).
13. **Carga de datos (ENMENDADA S53, DIRECCION_ARTE §5.3).** Listas y
    pantallas esperan con skeleton ESTÁTICO (formas en `bg.overlay`,
    SIN shimmer); spinner solo pasado el umbral de 150ms; cuando llegan
    los datos, reemplazo directo — JAMÁS layout shift animado.
    `EstadoVacio` solo cuando se CONFIRMÓ el vacío. EXCEPCIÓN única:
    para esperas de PROCESO >2s (lectura de carnet, pagos) vive la
    ESPERA DE MARCA (huella/isotipo trazándose en loop sereno) SIEMPRE
    con la voz honesta debajo — es de marca, no shimmer.

## 1b. LA CAPA DE CRAFT (Leyes 14–20 S57 + Leyes 21–22 S58 — FIRMADAS por el founder)

> **Qué es:** los principios de dirección minados de `frontend-design`,
> traducidos a nuestra casa. Las Leyes 1–13 dicen CON QUÉ se construye
> (tokens, componentes, dosis); esta capa dice CÓMO se decide que una
> pantalla está BIEN — la vara MoeGo+ de `DEFINICION_SOFTLAUNCH.md`.
> **Qué no es:** no enmienda tokens, componentes ni DIRECCION_ARTE — donde
> esta capa calle, mandan ellos. No es licencia para inventar: la firma de
> una pantalla se elige del lenguaje de la casa, jamás se importa.

14. **La TESIS de la pantalla.** Toda pantalla que se toque declara su
    tesis ANTES de tocarse: UNA frase que dice lo UNO que la pantalla
    comunica. No lo que muestra — lo que comunica. "El CUÁNDO comunica
    que la agenda del paseador es real y tiene lugar para vos."
    "Liquidaciones comunica que el que trabaja, cobra."
    - La tesis se escribe en el reporte del sub-bloque, primera línea.
    - Todo elemento de la pantalla se contrasta contra ella: lo que no
      la sirve ni la soporta es candidato a la Ley 16.
    - El gate en dispositivo EMPIEZA leyendo la tesis: el founder mira
      la pantalla y responde si la comunica. Si hay que explicarla, no
      la comunica (el wow es cero explicación — EL NORTE).
    - Una pantalla sin tesis declarada no entra a gate. Sin excepción.
15. **UN elemento firma por pantalla.** El coraje se gasta en UN lugar.
    Cada pantalla tiene UN elemento por el que se la recuerda — la
    firma — y todo lo demás se mantiene callado y disciplinado para que
    la firma respire.
    - La firma se ELIGE del lenguaje de la casa: la huella que aparece
      (DIRECCION_ARTE §2.6), un momento de motion de marca (§5), una voz
      humana en el lugar exacto, una manipulación directa con
      consecuencia visible (patrón Kaxo, lado prestador), una
      composición que preside (la mascota, el dato hero). Jamás un
      recurso importado ni un componente nuevo por esta vía (Ley 11
      intacta).
    - La firma NO suma acentos: se monta sobre la contabilidad
      existente (Ley 4 de dosis, Ley 5 de accent.active). Elevar uno
      que ya está, no agregar otro.
    - Lado prestador: la firma vive DENTRO de la dosis baja — la
      sobriedad es aplicación, no ausencia de firma (DIRECCION_ARTE
      §2.7). Una firma del lado prestador suele ser de COMPORTAMIENTO
      (la vista previa viva, la consecuencia visible), no de color.
    - **El test anti-genérico:** antes del gate, preguntarse "¿esta
      pantalla podría ser de cualquier app de servicios?". Si la
      respuesta es sí, no tiene firma — no está lista, aunque funcione
      y cumpla las Leyes 1–13.
16. **La regla Chanel.** Antes de entregar, quitá un accesorio. Toda
    pantalla que entra a gate pasa primero por una pasada de REMOCIÓN:
    se busca activamente qué sobra — un divisor, un chip, una
    repetición de dato, un texto que explica lo que ya se ve — y se
    quita.
    - El reporte del sub-bloque declara QUÉ se quitó en esa pasada. Si
      la conclusión honesta es "nada sobraba", se declara con su porqué
      — pero la pasada se hace siempre; "no la hice" no es un resultado
      válido.
    - La remoción respeta la Ley 37 del contrato: lo que se quita de la
      UI y deja código muerto, se elimina del código también.
17. **El copy es material de diseño.** Las palabras están en la pantalla
    para una sola cosa: hacerla más fácil de entender y de usar. Se
    diseñan con la misma intención que el espaciado y el color. Reglas
    exigibles:
    1. **Voz activa, verbos llanos.** El control dice exactamente lo que
       pasa al tocarlo: "Guardar cambios", jamás "Enviar". Tuteo neutro
       (regla 27).
    2. **Nombres del lado del usuario, jamás del sistema.** El dueño
       maneja "recordatorios", no "notificaciones push"; el prestador
       configura "tu oferta", no "prestador_servicios". El vocabulario
       del motor es del motor (Ley 3, extendida al copy entero).
    3. **Una acción, un nombre, todo el flujo.** El botón que dice
       "Reservar" produce una confirmación que dice "Reservado" — la
       cohesión es cómo la gente aprende a moverse. Renombrar a mitad de
       flujo = bug de copy.
    4. **Los errores dirigen, no se lamentan.** Qué pasó + qué hacer, en
       la voz de la interfaz, sin disculpas vagas y sin misterio
       ("revisá tu conexión" queda RESERVADO a errores de red —
       precedente S47). El error jamás se disfraza de vacío (Ley 13
       intacta).
    5. **El vacío invita a actuar.** Todo `EstadoVacio` termina en un
       camino, no en un estado de ánimo — coherente con §6ter del paseo
       (MODELO_PASEO): cero finales mudos, en ninguna superficie.
    6. **Cada elemento hace UN trabajo.** Un label rotula, un ejemplo
       demuestra; nada hace doble turno en silencio. Ser específico gana
       siempre a ser ingenioso.
18. **La estructura informa, no decora.** Todo recurso estructural —
    numeración, eyebrows, divisores, secciones — codifica una verdad del
    contenido o se corta. Una numeración solo vive si el contenido ES
    una secuencia real; un divisor solo vive si separa cosas realmente
    distintas; un header de sección solo vive si la sección existe como
    concepto para el usuario.
    - El eyebrow uppercase trackeado sigue muerto (prohibición S52) —
      esta ley generaliza el porqué: era estructura decorativa.
    - Ante la duda, la jerarquía se dice con tipografía y aire (tokens
      de spacing), no con más cajas.
19. **El diccionario de patrones (cada trabajo, UN componente).** Toda
    interacción recurrente tiene UN componente canónico. Usar otro es
    ilegal aunque los tokens estén bien — la consistencia de materiales
    no absuelve la confusión de roles. El diccionario (nace de las notas
    literales del founder, S57):
    1. **Entrar a una sección** (navegar hacia adentro: "Mis paseos",
       "Agregar carnet", "Mascotas"): **celda de navegación** — ícono
       del set b′ a la izquierda + título + (subtítulo opcional) +
       chevron. JAMÁS un botón blanco de solo texto: la celda dice A
       DÓNDE va con su ícono; el botón mudo no dice nada.
    2. **Acción primaria de la pantalla** (crear, confirmar, pagar):
       botón con jerarquía real (el acento de la capa) — UNO por
       pantalla (Ley 5 intacta). Las acciones secundarias, en jerarquía
       menor visible.
    3. **Cambiar de vista dentro de una pantalla** (segmentos: Próximos
       / Agenda / Historial; Hoy / Semana; secciones de Cuenta):
       **selector segmentado (toggle)** — el control de vistas
       exclusivas. **Los chips QUEDAN PROHIBIDOS como tabs/segmentos**
       (decisión founder S57): chips son para filtros y multi-selección
       (los 7 días del plan), donde elegir varios o ninguno es legal.
    4. **Estado/dato pasivo** (De vacaciones, Parte del plan): chip
       informativo, sin pretender ser botón.
    5. **Elemento hero de una posición consolidada** (la próxima cita,
       el dato que manda): tarjeta con jerarquía propia — jamás la misma
       celda que todo lo demás, más ancha porque "tiene más texto". El
       ancho no es jerarquía; la jerarquía se diseña.
    6. **Revelar el resto de una sección** (lo truncado por techo visual,
       lo plegado por default): **control al PIE de la sección con el
       NÚMERO en la etiqueta** — "Ver las 5", jamás un "Ver más" mudo.
       **Su forma es la anatomía 19.7 (enmienda S73, reacción de campo
       del founder sobre Momentos): SIN caja, texto + chevron
       direccional (⌄ revela · ⌃ pliega — FIRMADO en dispositivo,
       21-Jul-2026), SIN glifo (pie de sección: no tiene hermanos),
       target 44.** La forma vieja (`Boton compacto`) murió
       con la mecánica D-318: sus tres consumidores pasaron por craft
       en S73. El número es lo que deja decidir si vale
       el toque. **No aplica** a paginación (cargar la tanda siguiente de
       una lista larga) ni a abrir un compuesto en sus partes (una salida
       grupal ES una unidad: expandirla es entrar a sus miembros, otro
       trabajo — `FilaSalida` se queda como está).
       > FIRMADA en el gate founder S71 (piloto B1). Origen: la jornada
       > del prestador tenía **tres** soluciones para el mismo trabajo —
       > un `Boton ghost` "Ver todas (n)", una `Celda` con texto
       > "Ver"/"Ocultar" haciendo de encabezado, y el tap de `FilaSalida`.
       > Las dos primeras eran el MISMO trabajo con distinto estado
       > inicial y ahora comparten control; la tercera era otro trabajo y
       > quedó declarada. La Celda-como-encabezado murió: una celda
       > promete NAVEGAR (19.1), y plegar no es navegar.
       > **`PieRevelar` YA EXISTE (S71-A3, packages/ui)** — el disparo de
       > D-454 se cumplió el mismo día: el Hogar v2 fue el TERCER consumidor
       > real y el componente nació con galería. Su etiqueta canónica es la
       > forma NEUTRA `"Ver {{n}} más"` (namespace ui) — "Ver las 5 / Ver
       > los 4" obligaría a un género por consumidor; el número, que es lo
       > que la ley exige, se conserva. Los dos consumidores viejos del
       > cliente (`citas/[mascotaId]`, `hogar/paseos`) migran por D-318 al
       > tocarse. *(Esta nota decía "NO existe todavía" hasta S71 — se
       > corrige en el mismo cierre que lo construyó, no se duplica la
       > entrada.)*

    7. **LA LEY DEL CONTORNO TRANSPARENTE — la acción DENTRO de una fila**
       (dictada por el founder en el gate S71, sobre píxeles; **ENMENDADA
       S73 — versión ANGOSTA firmada en mesa.** El porqué de la enmienda:
       19.7 era la única entrada del diccionario SIN componente nombrado —
       decía "baja a label" y ahí terminaba; `Boton ghost` cumplía esa
       letra y el founder lo rechazó en el gate S72. La enmienda es de
       FORMA, no de destino):
       **"El contorno transparente MUERE como acción de fila. Por
       superficie UN sólido — la acción primaria; todo lo demás baja a
       LABEL. Y la acción que baja a label TIENE FORMA NOMBRADA — no es
       texto sin caja. Su anatomía es la del path canónico de
       `CeldaNavegacion`:**
       - **Glifo b′ del set** — SOLO si la acción es fila entre filas que
         van a destinos que VARÍAN (Ley 12 enmendada S71: el glifo marca
         lo que varía dentro de la unidad de barrido). El pie de una
         sección NO lleva glifo: no tiene hermanos, y un glifo sin
         vecindad es decoración (Chanel).
       - **Texto** en la voz del diccionario (verbo llano, tuteo, L-148).
       - **Chevron QUE GIRA** *(FIRMADO por el founder, 21-Jul-2026 —
         gate de campo sobre PieRevelar en Momentos, "muchísimo mejor";
         no lámina)*: `›` NAVEGA (te vas a otra pantalla) · `⌄` REVELA
         en el lugar (se abre abajo tuyo) · `⌃` PLIEGA. La dirección
         codifica una verdad del contenido (Ley 18); el chevron conserva
         su rol de discriminador navega/ejecuta que la letra original
         protegía.
       - **Target 44** siempre; en fila, la FILA ENTERA tapea con rol
         `button` (precedente `18e0c61`).
       **`Boton ghost` queda PROHIBIDO como acción de fila.** En el
       cliente el CTA es tinta (Ley 21): el label no tiene color del que
       agarrarse — lo que lo vuelve control es ESTRUCTURAL (glifo,
       chevron, peso, target), no cromático. La gramática es UNA para las
       dos apps; la dosis modula color, jamás anatomía.
       El porqué original (S71) sigue vivo: la caja de contorno es un
       tercer peso que no informa — ni tiene la jerarquía del sólido ni
       la humildad del label, y repetida por fila convierte una lista en
       un tablero de botones donde nada preside (el diagnóstico literal
       del gate del Hogar v2 y de la jornada del prestador).
       - **ESTA ES LA ANGOSTA (S73):** `Boton compacto` sigue vigente
         donde manda 22c (comando con consecuencias, acción suelta de
         pantalla). **19.6/`PieRevelar` SALIÓ de esta cláusula el mismo
         día (reacción de campo del founder sobre Momentos — "el botón
         que no me gusta"): su forma ES la anatomía 19.7** — la mecánica
         D-318 ya estaba disparada (sus tres consumidores pasaron por
         craft en S73). La ANCHA — la caja del `compacto` muere también
         en 22c — sigue siendo **D-483** con mecánica D-318 (*migra al
         tocarse*): cero barrida grande.
       - **Vara existente que ya la cumplía:** `prestador/cita/[citaId]`
         — ícono + label + chevron.
       - **Primera aplicación:** S71 (`18e0c61`) — la fila de "Por
         coordinar" pasó a tapear ENTERA con rol `button`, su acción de
         contorno murió y el `fin` bajó a label + chevron (path canónico
         de `CeldaNavegacion`).
       - **Convive con 22c sin contradecirla:** 22c gobierna la acción
         SUELTA de una pantalla (comando con consecuencias = botón
         compacto); esta gobierna la acción DENTRO de una fila de lista,
         donde la fila entera ya es el área tocable. El par
         primario+ghost de las Hojas de decisión NO es 19.7 (no es
         acción de fila) — es entrada nueva del diccionario pendiente de
         boceto y gate (**D-484**).
       - Corolario de lectura: si una fila necesita DOS acciones, casi
         siempre una de las dos no es de la fila — subí una al header de
         sección o bajala al detalle.

    8. **[PROPUESTA S73 — el founder la firma en su próximo gate]
       SE RELLENA LO QUE EXISTE · SE CONTORNEA LO QUE SE FIJA.**
       Prueba: *"¿esto existiría igual si yo no estuviera reservando?"*
       Thor existe; "baño y corte" existe (fila de catálogo, con nombre
       y precio); "martes" y "10:30" NO existen — son coordenadas que
       aparecen porque alguien elige. El relleno da imagen y presencia
       (letra founder S73, DIRECCION_ARTE §7) y solo puede tener
       presencia lo que tiene existencia.
       **ÁRBITRO DE BORDE: el CATÁLOGO.** Fila de catálogo (nombre +
       precio) = existe = relleno. Parámetro de una fila = se fija =
       contorno. Confirmación práctica: lo que existe viene de a pocos;
       lo que se fija, de a muchos — la ley nunca pide una pared de 20
       rellenos. Migración: de a una, en la pasada de craft de cada
       superficie (mecánica D-318). Origen: el founder resolviendo el
       falso binario de D-499 ("no todos los chips — fecha y horarios
       me gustan como están; pero cuando es algo como un servicio,
       baño vs baño y corte, puede que sí"). Censo clasificado:
       `docs/relevamientos/2026-07-22-s73a-censo-relleno-contorno.md`.

    Si un trabajo de interacción no está en el diccionario, se propone
    su patrón, se gatea y ENTRA al diccionario (patrón Ley 11) — jamás
    se improvisa con el ladrillo genérico. El diccionario aplica a LAS
    DOS apps: la dosis del prestador modula color y acento, no la
    gramática.
    > CONSTRUIDO (S58, D-359): el selector segmentado canónico del
    > punto 3 es **`SelectorSegmentado`** en `packages/ui` (ver índice).
    > La celda de navegación del punto 1 es **`CeldaNavegacion`** (S58,
    > relevamiento L-144: la Celda de lista NO cumplía la letra — sin
    > chevron, slot de ícono libre, pressed que resalta). Las pantallas
    > vivas con chips-como-segmento migran en su pasada de craft.
20. **La elevación (el 3D sutil, por sistema).** Nacen los tokens de
    elevación — hoy el sistema es plano y por eso las pantallas no
    despegan (diagnóstico del founder S57, vara Airbnb: sombras
    pequeñas, efecto sutil, jamás dramáticas). Dos niveles, y solo dos:
    1. **Reposo** (`elevacion.reposo`): la superficie que vive sobre el
       fondo — tarjetas, celdas. Sombra doble suave (contacto + difusa),
       apenas perceptible.
    2. **Elevado** (`elevacion.elevada`): lo que flota — Hojas, menús.
       Un paso más, sigue siendo sutil.

    Los valores exactos nacen en `packages/ui` como tokens (una sola
    definición, jamás sombras artesanales por pantalla) y se calibran en
    el primer lote de pantallas patrón con gate del founder. Reglas: la
    elevación acompaña a la jerarquía (el hero puede llevarla; el fondo
    jamás); en dosis prestador se conserva (la elevación no es color);
    en memorial se conserva (no es celebración). El fondo de la casa
    deja de ser blanco puro: **papel algodón #FAF9F7** (D-360, firmado
    S58), para que las superficies blancas con sombra respiren.
    > CONSTRUIDO (S58, D-358 + D-360): `theme.elevacion.reposo` /
    > `theme.elevacion.elevada` (`tokens/elevacion.ts`, boxShadow de
    > DOS capas — contacto + difusa — en TINTA CÁLIDA rgb(31,27,22),
    > jamás negro puro; dark/memorial resuelven a contacto mínimo).
    > REGLA CHANEL DEL MARCO cableada en Tarjeta: la superficie que
    > gana elevación PIERDE el hairline (el borde de tinte, semántico,
    > se conserva). Tarjeta habla `plana | reposo | elevada` ('sm'/'md'
    > = alias DEPRECADOS, no usar en código nuevo); la Hoja porta
    > `elevada`. Sombras artesanales: PROHIBIDAS (grep en el gate).
    > `shadows` v4 sigue vivo SOLO para glow semántico (Ley 7) y Aviso.
    > Ley 6 intacta: las sombras JAMÁS se animan. La calibración fina
    > se sella en la pantalla patrón del Hogar (D-358).

21. **La ley de geometría (S58, firma founder).** Lo que se ELIGE es
    rectángulo suave (`radius.suave` 10 a 12 — SelectorOpcion vive en
    10); lo que INFORMA es píldora (`radius.full` — Insignia y pills
    de estado INTACTAS). Y el acento que marca la elección es del
    tema: **`accent.control`** (claro = magentaDark #8E1F68, el
    registro TRABAJADOR del magenta — el hex puro #FF00AF conserva su
    reserva: destello, huella de tab, techo · dark = violetText ·
    memorial = tinta). **ENMIENDA S63 (FIRMADA por el founder): el CTA
    primario del CLIENTE sigue en tinta; el CTA primario del PRESTADOR
    ancla al acento del oficio (tealDark), en light Y dark. Memorial
    SIEMPRE tinta — memorial no se celebra. La cláusula "no se reabre"
    del anexo D-395 queda REEMPLAZADA por esta enmienda firmada.**
    Mecánica: el slot `accent.cta`/`accent.ctaTexto` del tema, resuelto
    por `ThemeProvider cta="tinta"|"oficio"` (default tinta; el raíz
    del prestador pasa "oficio") — Boton primario consume el slot,
    nadie re-resuelve por pantalla. Pares medidos en el gate:
    papel/tealDark 5.51 (light) · textDark0/tealDark 5.05 (dark). El
    control sigue marcando ELECCIÓN y estado — un solo acento lleno
    por vista. El tinte verdeVital MUERE como color de control en
    ambas apps (las pantallas construidas migran AL PASO); el oficio
    del prestador sigue en tealDark (§15b; su par oscuro del MURO es
    tealDarkNoche #0A4A44, D-407 pagada S63).

22. **La ley de intensidad del acento (S58, firma founder).** El acento
    tiene DOS intensidades por FUNCIÓN — **TONAL** (borde 1.5 en el
    acento + tinte claro del acento + TEXTO en el acento) para
    SELECCIÓN entre pares (SelectorOpcion: días, duraciones, idioma) ·
    **SÓLIDO** (fill del acento, contenido en blanco/papel) para
    estados BINARIOS y singulares (Interruptor encendido, fill+thumb
    del slider). Rige en AMBAS apps con su registro (control =
    magentaDark/violetText/tinta · oficio = tealDark). Un binario
    disfrazado de chips es un bug de rol: se desenmascara a
    Interruptor. Apagado JAMÁS dice error — apagado es estado, no
    falla.

22c. **Comando con consecuencias = ACCIÓN, viste de botón (S58, firma
    founder).** Primaria en tinta (UNA por vista); secundarias =
    `Boton variante="compacto"` (borde `border.default`, radius suave,
    texto tinta, target 44) — jamás texto pelado, jamás Celda. La
    prueba: "si al flipearlo necesitarías confirmar, era una acción".

23. **EL PRINCIPIO DE LA PUERTA (S71, cura de la Sesión B en "Fijar
    fecha").** **"La puerta no ofrece lo que va a rechazar."** La UI no
    muestra opciones que el server va a rebotar: si el motor va a decir
    que no, el control no se dibuja — y si el conjunto entero queda
    vacío, se dice con voz honesta en vez de ofrecer una grilla muerta.
    Caso de origen: la grilla de horas para coordinar un procedimiento
    ofrecía horas YA PASADAS del día de hoy (el server las rebotaba con
    `slot_en_pasado`); la cura filtra con hora local, deriva la
    invalidación al cambiar de día, y después de las 18:00 dice
    `coordinar.hoySinHoras` en lugar de una grilla de nada.
    **CRITERIO DECLARADO — por qué es LEY NUEVA y no enmienda a la Ley
    13 ni entrada del diccionario:** la Ley 13 gobierna cómo se MUESTRA
    un estado que ya existe (cargando, vacío, error — "el error jamás se
    disfraza de vacío"); esta gobierna qué se OFRECE **antes** de que
    exista estado alguno. Y no es diccionario porque no nombra un
    componente: **restringe a todos**. Su prueba: *"si el usuario lo
    toca y el server dice que no, ¿podíamos saberlo antes de dibujarlo?
    Si la respuesta es sí, era un bug de puerta."*
    Corolario anti-trampa: la puerta filtra lo que YA SABE, jamás
    adivina — un filtro que oculta algo legal es peor que ofrecerlo. El
    server sigue siendo la autoridad (los guards NO se retiran: la
    puerta es cortesía, no validación).
    **COROLARIO S73 (firmado en mesa — la letra del selector por
    elegibilidad, `docs/LETRA_SELECTOR_ELEGIBILIDAD_S73.md`): "LA PUERTA
    NO PREGUNTA LO QUE YA SABE."** Prueba: *"si solo hay una respuesta
    posible, ¿por qué la estoy preguntando?"* — si la respuesta es "por
    costumbre del formulario", era bug de puerta. Con N=1 no se pregunta
    pero **SE DICE** (la elegida visible con avatar+nombre — la magia
    muda se vuelve confusión el día que acierta mal); con N=0 rige la
    cláusula del conjunto vacío de arriba. El N lo computa el MOTOR
    (frontera `mascotasElegibles` de packages/api: momento vital PRIMERO
    — memorial no es elegible, apagado estructural §7.1 LOYALTY —,
    especie por servicio después), jamás la pantalla.

### Las pantallas patrón (cómo se firma lo visual)

**Ninguna ley de composición se firma en prosa: se firma sobre
píxeles.** El mecanismo (inaugurado S57 con el boceto del Hogar,
aprobado en esencia por el founder en primera ronda):

1. El arquitecto boceta la pantalla aplicando las leyes → crítica del
   founder → iteración → **firma sobre el boceto**.
2. La pantalla firmada entra a la skill como **pantalla patrón**: la
   referencia visual de sus patrones (así se ve un hero, una celda de
   navegación, un toggle). Las sesiones de Code construyen COPIANDO
   NIVEL de la pantalla patrón, no interpretando prosa.
3. El gate en dispositivo compara contra la pantalla patrón — la vara
   deja de ser adjetivo ("espectáculo") y pasa a ser comparación.
4. Primera pantalla patrón: el Hogar del cliente — **v2 "techo vivo"
   FIRMADA (S58)**. La referencia visual vive en
   `pantallas-patron/hogar-v2.png` (junto a esta skill; ver el README
   de esa carpeta — el PNG lo deposita el founder/arquitecto). Claves
   de la firma: techo con curva orgánica 44/26 · hero del próximo paseo
   en tarjeta de DOS PISOS · fichas por mascota con próxima cita ·
   grupo de celdas de navegación con subtítulo VIVO · capas paseo=TEAL
   y salud=VERDE VITAL (el boceto S57 pintaba paseo en verde —
   corregido en la firma) · fondo papel + elevación (D-358/D-360).

### LA LEY CHICA DE LA COLA DE SCROLL (S70-B5, exigible)

**Toda pantalla nueva nace con `insets.bottom` en la cola de su scroll —
jamás un `paddingBottom` hardcodeado.**

```tsx
const insets = useSafeAreaInsets()
<ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
```

El número mágico (`paddingBottom: 96`) miente en cuanto cambia el
dispositivo: en teléfonos con barra de gestos el último elemento queda
tapado, y en los que no la tienen sobra aire. Es el patrón scroll-cola que
venía como nota a la mesa desde S65 y se pagó en S70-B5 sobre **38
pantallas**. Aplica igual a `HojaScroll` y a cualquier contenedor
desplazable con contenido o botón al final.

**Corolario:** si una pantalla tiene un CTA fijo al pie, el `paddingBottom`
suma **además** la altura de ese CTA — el contenido tiene que poder
scrollear por encima de él, no debajo.

### El protocolo del gate de craft (por pantalla, exigible)

Toda pantalla que entre a la pasada de craft (D-347 y sucesoras) llega
al gate en dispositivo con esta declaración de CUATRO líneas en el
reporte:

1. **TESIS:** la frase (Ley 14).
2. **FIRMA:** cuál es el elemento y por qué ese (Ley 15).
3. **CHANEL:** qué se quitó (Ley 16).
4. **TESTS:** pasa los 6 tests de `DISEÑO_EXPERIENCIA` §10 (dueño) o los
   del §15 (prestador) — se declara, no se asume.

El gate del founder es POR PANTALLA, en dispositivo (APK con doble
reinicio, L-138), con la vara MoeGo+: la fluidez no alcanza; la pantalla
tiene que tener firma. **Dosis baja SIEMPRE en la ejecución: el patrón
viaja, el maquillaje no** — si una pantalla mejora, la mejora tiene que
ser reproducible por sistema (tokens, componentes, leyes), no un retoque
artesanal que la siguiente pantalla no hereda.

## 1c. CÓMO PIENSA EL DISEÑADOR (protocolo obligatorio, founder S57)

Antes de crear, agregar o modificar CUALQUIER componente visual, la
sesión razona como un **diseñador de interiores QUE CONOCE TODA LA
CASA** — jamás como un carpintero que fabrica un mueble suelto. Las
preguntas son OBLIGATORIAS, en este orden, y se responden en el reporte
ANTES de tocar código:

1. **¿Qué TRABAJO hace este elemento?** (entrar a una sección, acción
   primaria, cambiar de vista, estado pasivo, hero) → buscalo en el
   diccionario (Ley 19). Si el trabajo tiene patrón, se USA el patrón.
   Punto.
2. **¿Ya existe en la casa?** Relevá `packages/ui` Y las pantallas
   vecinas Y la otra app ANTES de crear: reusar > adaptar > crear
   (crear es el último recurso y entra por Ley 11: propuesta + gate +
   nace en `packages/ui`, jamás inline).
3. **¿Recorriste la casa?** Mirá las pantallas que el usuario ve ANTES
   y DESPUÉS de esta: ¿el elemento habla el mismo idioma que sus
   vecinas (mismos patrones, misma jerarquía, mismos nombres de
   acciones — Ley 17.3)? Un elemento correcto pero incoherente con sus
   vecinas está MAL.
4. **¿Cuál es la tesis de la pantalla (Ley 14)** y este elemento la
   sirve — o le roba atención a la firma (Ley 15)?
5. **¿Qué capa de color le toca** (paseo/salud/marca/cuidado) **y qué
   dosis** (lado dueño / lado prestador / memorial)?
6. **¿Cómo se ve en los 3 temas y en es/en?** ¿Y sus estados: vacío,
   cargando, error, deshabilitado? (Un componente sin sus estados no
   está terminado.)
7. **La pasada Chanel (Ley 16):** ¿qué le quitaste antes de entregarlo?

**La regla madre:** *el diseñador de interiores no compra un mueble
nuevo sin caminar la casa: primero reusa, luego mueve, luego restaura —
comprar es lo último, y lo que compra combina con TODO.*

## 2. CORRECTO / INCORRECTO (casos reales de S43)

**Chip artesanal → Insignia**
```tsx
// ✗ INCORRECTO (así estaba la galería en B2)
<View style={{ backgroundColor: theme.status.successBg, borderRadius: 999, … }}>
  <Text style={{ color: theme.status.successText }}>Al día</Text></View>
// ✓ CORRECTO
<Insignia estado="alDia" etiqueta="Al día" />
```

**Regla de voz**
```tsx
// ✗ "ZEUS · 17:30 · 45 MIN" en mono — Zeus es un ser vivo, y mono jamás en mayúsculas
// ✓ titulo="Zeus" (DM Sans) + metadataMono="17:30 · 45 min" (Celda lo fuerza a minúsculas)
```

**Glow**
```tsx
// ✗ theme.shadow.glow.teal en una card cualquiera en claro (decorativo + claro = prohibido)
// ✓ glow SOLO dark y SOLO estado real; en claro: borde 1.5 del hex puro + pill "● En vivo" (S44; voz única S59)
```

**Gradiente UI**
```tsx
// ✗ colors: ['#FF00AF', '#28E8DA'] con texto tinta — 2 stops: el medio se ensucia (OLED)
// ✓ theme.accent.gradient (v2: [#DF00A1|#C4008A, violeta, teal] @ [0,.5,1]) + text.onGradient (blanco)
```

**Voz humana**
```tsx
// ✗ fontFamily: 'PlayfairDisplay_400Regular'  — Playfair NO está en v4, no instalarla
// ✓ fontFamily: typography.family.sans.light, fontSize: size.xl  — la voz es DM Sans 300 por óptica
```

**Peers**
```json
// ✗ "react-native-svg": "*"            → pnpm instaló 15.15.5 al lado del 15.15.4 del app
// ✓ "react-native-svg": "^15.15.4"     → una sola copia (expo-doctor 20/20)
```

**Iconografía (la campana de B3.6)**
```tsx
// ✗ <Text style={{ fontSize: 20 }}>🔔</Text>   — emoji en UI de producto (murió en review)
// ✓ <Svg …><Path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"
//     stroke={theme.text.primary} strokeWidth={1.75} strokeLinecap="round" /></Svg>
```

## 3. ÍNDICE — los 39 componentes (import de `@epetplace/ui`)

| Export | Cuándo |
|---|---|
| `Boton` | Toda acción. primario=default producto · marca=gated dosis alta · secundario tonal · ghost terciaria · destructivo tonal (nunca coral sólido) |
| `Tarjeta` | Toda superficie contenedora. Tintes por capa/status; `interactiva` escala 0.99; sin margin propio |
| `Campo` | Todo input de texto. Label siempre visible; nada se anima al tipear |
| `Celda` | Toda fila de lista. Pressed resalta (jamás escala); `metadataMono` para voz de máquina — desde S44-B4.1 convive con `fin` (apilados: mono arriba, nodo abajo). Entrar a una sección NO es su trabajo (eso es `CeldaNavegacion`) |
| `CeldaNavegacion` | Entrar a una sección (Ley 19.1, S58): ícono b′ TIPADO a la izquierda + título + detalle opcional + chevron de entrada; pressed 0.99. `registro` capa (dueño) / aa·tinta (prestador) — la dosis modula color, no gramática. Sin metadataMono/fin (eso es Celda). Memorial degrada adentro de Icono |
| `SliderPrecio` | Pasos DISCRETOS para precio (S58, depósito prestador): riel hundido con puntos + tramo recorrido en acento POR REGISTRO (§2.7) + thumb apoyado con `elevacion.reposo` (Chanel: sombra, jamás borde). `onStep` = hook de háptica futura, v1 VACÍO (sin expo-haptics — L-134, decisión founder pendiente). Memorial degrada adentro y no desliza. A11y adjustable con increment/decrement. **ENMIENDA S68 (B7-4, firma founder — EXCEPCIÓN FIRMADA a la regla del teclado §15b):** el valor mono se INTEGRA al componente con tap → edición numérica (teclado decimal), clampeada al riel y REDONDEADA al paso más cercano — jamás valor ilegal; prop `edicionNumerica` default true (los cuatro talleres la ganan; murieron los NUEVE displays de valor duplicados — Chanel: el valor vive UNA vez); etiquetas no-parseables apagan la edición sola (degradación honesta). **SEGUNDA ENMIENDA S68 (B9, hallazgo founder sobre B7-4): la affordance es VISIBLE, no solo accesible** — subrayado punteado en el valor + hint `ui.sliderPrecio.editarHint` en secundaria bajo el valor («Toca el valor para escribirlo»); sin glifo nuevo |
| `StepperCantidad` | Cantidad ACOTADA min/max (S58, comp. 33 — el cupo "a la vez" por franja): [−] valor mono tabular [+]; botones 44 en superficie hundida con glifo en el acento por registro; EN EL TOPE SE APAGA SERENO (terciario, jamás error); a11y adjustable. La regla del teclado (§15b): lo que se ajusta no se digita |
| `Interruptor` | El estado BINARIO (S58, Ley 22): SÓLIDO en el acento por registro (control/oficio) al encender, riel apagado en bg.overlay — apagado JAMÁS dice error; thumb blanco con elevacion.reposo que se desliza (memorial: tinta y reemplazo directo); a11y switch. Un binario disfrazado de chips se desenmascara acá (primer caso: Preferencias On/Muted) |
| `SelectorSegmentado` | Cambiar de vista dentro de una pantalla (Ley 19.3, S58 — los chips PROHIBIDOS como segmentos): riel hundido bg.overlay + 2-3 segmentos; el ACTIVO es superficie apoyada con `elevacion.reposo` (Chanel: sombra, jamás borde). Texto solo v1; se desliza la SUPERFICIE (fast/easeOut), la sombra viaja con ella; memorial = reemplazo directo. Mismo componente sin variante en dosis/memorial |
| `Separador` | Divisor hairline entre Celdas (`ItemSeparatorComponent`) |
| `Insignia` | Todo chip de estado/capa. JAMÁS interactivo; `soloPunto` para celdas densas |
| `Encabezado` | Techo de pantalla. `navegacion` (interna) / `portada` (raíz de tab, con la voz). S52: la portada es LOCKUP — isotipo+voz una composición horizontal, acción en línea |
| `BarraTabs` | Navegación raíz — JSDoc trae el wiring de expo-router listo |
| `Hoja` | Todo modal: bottom sheet siempre. Cierra por swipe/backdrop/X/back |
| `useAviso` (+`AvisoProvider`) | Todo feedback efímero. Uno a la vez, cola |
| `EstadoVacio` | Todo "sin datos". Voz humana, sin animación de entrada. S52: `registro='pantalla'` (default, display centrado) · `'seccion'` (sereno, dentro de una pantalla con contenido — jamás display) |
| `CitaEnVivo` | Envolver LA cita en curso — UNO por pantalla, jamás decorativo (Ley 7). dark: glow de capa · claro: anillo 1.5 + pill "● En vivo" (voz única S59, key ui.citaEnVivo.estado — a11y incluida) · memorial: degrada con su voz serena ("En curso"). No suma accent.active. §7.5: N citas vivas REALES simultáneas = N celdas (multi-paseo del Hogar) |
| `Esqueleto` (+`EsqueletoGrupo`) | Todo estado de carga. Estático por ley — sin shimmer ni pulso. Componer imitando el layout final; `EsqueletoGrupo` anuncia la carga al lector |
| `AvatarMascota` | La cara de la mascota. fotoUrl → huella digna; no porta estado ni interacción; `especie` reservada para el set ilustrado D-288 |
| `Cronometro` | Tiempo transcurrido de la atención. Voz de máquina (mono, tabular-nums); corre por DIFERENCIA contra inicioTs del server; `pausadoEnMs` congela quieto. Tamaño display provisional (se ratifica en B4) |
| `EvidenciaFoto` (`.Capturar`/`.Thumbnail`) | Captura y thumbnail de evidencia. Capturar abre cámara directo, galería secundaria en Hoja; Thumbnail porta estado subiendo/subida/error — la foto JAMÁS desaparece por error; no sube nada: la cola es de la pantalla |
| `MapaRecorrido` | El track del paseo sobre mapa real. `vivo` sigue el último punto (gestos muertos, punto hex puro + anillo) · `recorrido` encuadra con aire (zoom/pan sí, rotate/pitch no). Mapa claro en los 3 temas (F1); web = placeholder digno. EXIGE dev build (Expo Go sin tiles SDK 53+) |
| `SelectorEspecie` | Selección única de especie (onboarding dueño, S45). Grid 3×2, ficha AvatarMascota+nombre; seleccionada = borde 1.5 capa.identidad + tint capaBg — NO consume accent.active. Presentacional puro; memorial degrada (borde text.secondary) |
| `CampoFecha` | Fecha de nacimiento con precisión honesta (S45). Se ve como Campo; abre Hoja con selector JS puro (mes/año + día opcional + "No sé la fecha"→etapa). Valor {fecha, precision exacta/aproximada/estimada} = espejo del CHECK de DB. La pantalla es dueña del valor |
| `HojaScroll` | Scrollable interno que GANA dentro de la Hoja (patrón SM block — fix S45-B3.2). OBLIGATORIO para toda lista desplazable dentro de una Hoja: el ScrollView plano pierde contra el swipe-to-close en Android y web no lo delata (L-132) |
| `SelectorAvatar` | La foto de identidad de la mascota (S45). Vacío = AvatarMascota + invitación (la huella es cara válida); Hoja con cámara/galería PARES + "Por ahora no" primera clase; con foto: Cambiar/Quitar. Entrega {uri,width,height}; el upload es de la pantalla. Captura por `capturaFoto` (infra compartida con EvidenciaFoto — no duplicar) |
| `HeroMarca` | Cabecera con el gradiente firma (S45, contexto cerrado dosis alta). alto=bienvenida · compacto=techo de paso · techoVivo=techo del Hogar (curva 44/26, S58). Isotipo blanco adentro = el UNO por pantalla; CTAs JAMÁS adentro (marca sobre marca). Memorial: bg.card plano, text.primary — degrada solo. **S59: la SAFE AREA superior la absorbe la PRIMITIVA** — el fondo pinta edge-to-edge bajo la barra de estado y el contenido baja por el inset; las pantallas NO agregan paddingTop: insets.top por fuera (`techo={false}` SOLO para muestras fuera de posición, galería). Íconos de barra CLAROS sobre el gradiente: wiring en la pantalla con useFocusEffect (patrón BarraTabs; memorial no lo toca) |
| `SelectorOpcion` | Chips de selección de VALOR (S45; ENMENDADO S55-B4 y S56). Radiogroup (o checkbox-group con `multiple` — los 7 días del plan); seleccionado = TONAL en el ACENTO por prop `acento` (Ley 21/22): **'control'** (cliente — magentaDark, el acento de ELECCIÓN) · 'oficio' (prestador, tealDark) · 'capa' (verdeVital — MUERE al paso); borde 1.5 + tinte + texto en el acento, sin accent.active; memorial degrada. **NOTA DE VERDAD DE PRODUCCIÓN (corregida S73):** esta entrada decía "capa.identidad como SelectorEspecie" — la espec ORIGINAL; S58-A (`da059ae`) migró los selectores a 'control' por Ley 21/22 y la **firma ② del founder (21-Jul-2026)** consolidó control para el selector de mascota. El índice decía la letra vieja — que nadie "arregle" el color de vuelta. `disposicion`: 'fila' (default, 2-4 chips que llenan el ancho) · 'tira' (scroll horizontal — la tira de días del CUÁNDO) · 'grilla' (chips envueltos para conjuntos grandes — inicios/menú de bloques) · **'columnas' (S73, firma founder DEFINITIVA — el QUÉ vet): DOS columnas de ancho UNIFORME, la etiqueta larga ENVUELVE, el impar queda a ancho de columna**. **MODO `entidad` (S73, dictado founder — el ENTITY CHIP del selector de mascota, V2 provisional 52/44):** avatar al borde con overhang, contorno FUSIONADO (cero borde — `elevacion.reposo`, regla Chanel del marco Ley 20), elegido = LLENO (`accent.controlLleno` = magentaDark + blanco, **FIRMADO en ambos temas** — registro: fill-vs-fondo dark 2.24–2.47, el ojo del founder lo firmó igual), esquinas izquierdas a CHIP/2 (la cura de la lengüeta), fallback `sobreLleno` (recede — el nombre es el dato), memorial degrada a tonal con elevación. **LA LEY DEL ANCHO (S73, ENMIENDA DE ESPEC FIRMADA — letra founder):** *"un chip con avatar JAMÁS ocupa el 100% del ancho; ideal ~50% (dos por fila); N=1 se CENTRA — jamás se alarga."* El porqué (mesa): el avatar es ancla de tamaño FIJO y el chip elástico sin tope la vuelve estampilla sobre banderola — aplica a toda anatomía elemento-fijo + contenedor-elástico. **"Llenar el ancho" queda PROHIBIDO para chips con avatar** — el default 'fila' de esta entrada NO los cubre (que nadie lo revierta: firma S73). NO porta estado de datos (eso es Insignia). **OJO Ley 19.3 (S57): PROHIBIDO como tabs/segmento de vistas** — ese trabajo es de `SelectorSegmentado` (vivo desde S58); las pantallas vivas con chips-como-segmento migran en su pasada de craft |
| `LineaDeVida` | El timeline del dueño (S45-B5.2). Diccionario CERRADO tipo→voz humana/capa ADENTRO (Ley 3: el dueño jamás ve un código; desconocido degrada digno por eje). Punto hex puro de capa + conector hairline + Tarjeta; mono solo hora/duración. Carga = esqueleto 3 nodos; el vacío es de la pantalla; pie con "Cargar más"/error. cita_servicio NO se muestra (filtra el wrapper) |
| `VisorFoto` | Lightbox una-foto-a-la-vez (S45-B5.3). SOLO fades (Ley 6/8 gratis); letterbox digno sin recortar; fondo pleno (tinta+scrim, no depende del tema); cierra por X/back(doble vía)/tap-fondo; swipe horizontal = reemplazo directo; contador "n de m" en mono |
| `FichaVacuna` | La ficha de UNA vacuna en la revisión del carnet (S47-B1.1; derivación S48). Presentacional pura: tap → `onEditar` (la edición es una Hoja de LA PANTALLA), "Esta no es" → `onDescartar`. Estados derivados de los datos: completa neutra (nombre+fecha; **tipo null NO tiñe** — decisión founder S48, los carnets reales no lo rotulan) · dudosa = SOLO fecha faltante, tinte cuidado y voz humana ("No pudimos leer la fecha") · `rechazada` (prop, del item_invalido de la RPC) danger — nada se pierde. Nombre en DM Sans (lo escribió un humano); fechas y lote en mono minúsculas. Memorial degrada: sin tinte, borde neutro |
| `Icono` (+primitiva `Huella`) | El set b′ de DIRECCION_ARTE (S53): nombre TIPADO (paseo·veterinaria·grooming·refugio·despensa·coach), objeto en trazo 1.9 + Huella rellena en el hex de su capa; `registro` capa/aa/tinta (dosis §2.7); memorial adentro (huella a text.secondary, el destello no destella). `Huella` es LA primitiva canónica — nadie la redibuja. Todo ícono nuevo = entrada del registry + galería + gate founder por ícono; gate a 21px obligatorio (§2.9) |
| `BarrasSemana` | La tira de 7 días de los Vitales (S53-B2c.1, espec firmada en brief). 7 barras proporcionales al valor REAL del día; día sin dato = barra base en bg.overlay (la verdad tal cual, L-139). Presentacional puro, ESTÁTICA (Ley 6), color hex puro de su capa; memorial degrada llenas a text.secondary. Sin ejes ni tooltips — no es un chart genérico |
| `ClipSesion` | El clip corto de la sesión de adiestramiento (S63, componente 34 — espec aprobada por el arquitecto; MODELO_ADIESTRAMIENTO §5: el video es el medio del oficio). Poster sereno `radius.suave` + tap-para-reproducir con controles nativos (expo-video); JAMÁS autoplay — en ningún tema, en memorial menos (la reproducción es siempre un acto del usuario). Estados: cargando/error con voz honesta (namespace ui, Ley 13 — el clip jamás se disfraza de vacío). Escalera: 0 clips = NO se monta (cero estado vacío decorativo). Tokens puros — sirve a ambos temas y a la dosis del prestador sin variante. Consumidores: el parte del dueño + el Durante del prestador. Peer NUEVO: expo-video ~57.0.1 (nativo — build, no OTA) |
| `VozComision` | La voz del NETO/comisión bajo un precio del taller (S68-B, componente 35 — pagó D-412): "recibís $X" con la comisión VIVA desde `fee_configs` (regla 7.15 del financiero — jamás hardcode). Extraída a `packages/ui` desde los talleres donde vivía DUPLICADA por copia (paseo/grooming inline, hallazgo S68-B0); consumidores: los rieles de precio de los talleres de oficio (paseo/grooming/adiestrador/vet). Voz de máquina para el número (mono), voz humana para la frase; presentacional pura — el fee lo resuelve el caller. Memorial degrada (sin celebración del número) |
| `Texto` | **La pieza de texto del sistema (S71-A2).** El design system tenía 57 exports y NINGUNO era texto: la consecuencia no era hardcodeo (los tokens estaban bien puestos) sino algo peor — **la jerarquía tipográfica se re-decidía a mano en cada pantalla**, ~200 veces. Cinco variantes (Ley 3): `titulo` DM Sans 300 · **`seccion`** DM Sans 500 con `accessibilityRole="header"` DE FÁBRICA (absorbió **10 definiciones byte-idénticas de `TituloBloque`** + 3 `tituloSeccion` locales) · `cuerpo` la prosa por default · `apoyo` secundario **con `lineHeight` de prosa** (absorbió las **4 `VozSecundaria`**, que coincidían todas en ese interlineado — el censo corrigió al diseñador, no al revés) · `dato` JetBrains Mono con `tabular-nums`. **SIN prop `style`, deliberado:** la escotilla de estilo libre devolvería el gobierno de la jerarquía a la pantalla, que es el problema que existe para cerrar. Es una HOJA: no lleva margin, flex ni ancho — el layout es del padre. `montoCorto` NO nació (D-448: el formateo de plata es del RIEL por idioma, como `fechaCortaMono`) |
| `FilaDato` | **Etiqueta sobre valor, sin interacción (S71-A2).** Su hueco estaba DECLARADO en un comentario del código desde S70 (`veterinaria/cita/[citaId]`: *"no hay componente de campo de solo lectura"*) — el comentario documentaba la deuda en vez de dispararla. **La prueba de su trabajo: si tocarlo no hace nada, es `FilaDato`** (no `Celda`, que es fila de lista tapeable; no `Campo`, que se edita). `mono` es del VALOR, jamás del rótulo (Ley 3). Hermano de `Texto`, NO variante: es layout (dos nodos apilados) — como variante habría obligado a `Texto` a devolver dos elementos. Un valor ausente NO se dibuja vacío: la pantalla omite la fila o pasa su voz honesta (Ley 13). **Candidato registrado sin construir: la disposición HORIZONTAL compacta** (rótulo izquierda / valor derecha) — el caso del perfil del Antes la pidió y se decidió NO meter una prop al pasar en un componente recién congelado |
| `PieRevelar` | **El control canónico de la entrada 19.6 (S71-A3, D-454 pagada; anatomía 19.7 desde S73 — reacción de campo del founder).** SIN caja: texto en tinta + chevron direccional (⌄ revela · ⌃ pliega) centrado al pie de una sección truncada o plegada, target 44, con **el NÚMERO en la etiqueta** (`"Ver {{n}} más"`, forma neutra del namespace ui); con `revelado`, pasa a "Ocultar" — plegar de vuelta es el mismo control en el mismo lugar. `n=0` sin revelar: **no se dibuja** (regla de existencia). **NO es paginación** (traer datos que no están: eso es el pie de `LineaDeVida` con su cursor) ni abrir un compuesto en sus partes (`FilaSalida`). Nació con su tercer consumidor real, no antes |
| `FichaMascotaHogar` | v2 (S52-P3, espec gateada): la mascota PRESIDE — AvatarMascota 64 (foto primero, huella fallback) sobre superficie Tarjeta, nombre en DM Sans light xl y UNA voz SIN sujeto (ficha.* del riel; las variantes con {{nombre}} se conservan para contextos sin sujeto visible). Semántica intacta: alDia punto verdeVital · pideAtencion punto ochre + warningText · conociendolo neutral. Tap → perfil (pressed 0.99 de Tarjeta); sin badges ni CTA. Diseñada para 1-3 apiladas. Memorial degrada. Cero tokens nuevos |

También: `ThemeProvider`/`useTheme` (light default, memorial forzable),
`Isotipo` (tinta/blanco/gradiente), y las PRIMITIVAS DE MARCA S53:
`Huella` (el path canónico b′), `Guijarro` (ilustración §4),
`EsperaDeMarca` (la única animación de espera legal: la huella respirando ~1.9s easeInOut para procesos >2s, SIEMPRE con voz honesta debajo; memorial quieta; no muestra datos — escalera no aplica), `palette`/`gradients`/`typography`/
`spacing`/`radius`/`shadows`/`elevacion` (S58: reposo/elevada por tema —
Ley 20)/`motion`/`opacity`/`dosis`, temas y tipos.

**Dónde vive qué:** tokens `packages/ui/src/tokens/` · temas
`packages/ui/src/themes/` · gate WCAG `scripts/verify-contrast.ts`
(correr: `pnpm verify:contrast` — 178 pares desde S71, tiene que dar 0 fallos) ·
galería `packages/ui/src/gallery/TokenGallery.tsx` (verificación browser:
`node scripts/verify-gallery.mjs` con los dev servers arriba) · gate en
dispositivo: CLAUDE.md raíz · dirección de arte e iconografía:
`docs/DIRECCION_ARTE.md` · tests de pantalla y escalera §4b:
`docs/DISEÑO_EXPERIENCIA.md`.

## Historial de la skill

- **S73 (21 Jul 2026) — LA ENMIENDA 19.7, versión ANGOSTA (firmada en
  mesa; la anatomía fina — el chevron que gira — se sella en el gate en
  dispositivo con la lámina).** La acción que baja a label gana FORMA
  NOMBRADA (anatomía del path canónico de `CeldaNavegacion`: glifo solo
  si varía + texto + chevron que gira + target 44); `Boton ghost` muere
  como acción de fila; `compacto` sobrevive en 22c/19.6. La ANCHA queda
  como **D-483** (mecánica D-318, migra al tocarse); el par
  primario+ghost de las Hojas de decisión es **D-484** (entrada nueva
  del diccionario, boceto y gate propios). Corrección de prosa L-158:
  22c decía "hairline-strong" — el token no existe, el código usa
  `border.default`. Fundada sobre el literal de A (censo ~13 compactos +
  ~12 ghosts en cliente; `PieRevelar.tsx:51`; `Boton.tsx:112/115/117`),
  no sobre la prosa de la skill. **ENMIENDA DEL MISMO DÍA (reacción de
  campo):** el founder vio el `PieRevelar` de Momentos en su camino real
  ("el botón que no me gusta" — la caja del compacto del gate S72) y
  **19.6/PieRevelar salió de la cláusula de supervivencia**: su forma es
  la anatomía 19.7 (sin caja, texto + chevron direccional ⌄/⌃ variante
  d, sin glifo, target 44); los tres consumidores la heredaron gratis.
  El chevron direccional se juzga EN VECINDAD (Momentos, datos reales) —
  esa es la firma ① del gate; la lámina queda para ② el acento y ③ la
  voz del N=1. D-483 (la ancha de 22c) intacta con su disparo.
- **S71 (20 Jul 2026) — LAS LEYES QUE SALIERON DEL PRIMER GATE DEL
  MECANISMO.** Entran: **19.6** "revelar el resto de una sección" (la
  depositó B en el gate del piloto B1; su nota se CORRIGE acá —
  `PieRevelar` ya existe, nació el mismo día con su tercer consumidor) ·
  **19.7 LA LEY DEL CONTORNO TRANSPARENTE** (dictada por el founder en
  el gate: la caja vacía muere como acción de fila; UN sólido por
  superficie, el resto a label con/sin chevron según navegue o ejecute)
  · **enmienda a la Ley 12 — DÓNDE VA EL GLIFO** (firmada por las dos
  sesiones en la vara cruzada: marca lo que VARÍA dentro de la unidad de
  barrido; 4 casos vivos la cumplen, cero contraejemplo) · **Ley 23 EL
  PRINCIPIO DE LA PUERTA** (no se ofrece lo que el server va a rechazar;
  criterio de ubicación declarado: la Ley 13 muestra estados que
  existen, esta gobierna lo que se ofrece antes de que exista estado) ·
  y los **componentes 37-39 al índice**: `Texto` (la pieza que faltaba —
  absorbió 10 `TituloBloque` + 4 `VozSecundaria` byte-idénticas),
  `FilaDato` (su hueco estaba declarado en un comentario desde S70) y
  `PieRevelar` (D-454 pagada por su disparo). **Contadores RE-MEDIDOS
  (L-141): 35→39 componentes y 154→178 pares WCAG — ambos venían
  desactualizados de sesiones anteriores.**
- **S58 (12 Jul 2026) — LOS MATERIALES DE LOS ACABADOS NACEN (D-358 +
  D-359 + D-360, firmas founder S58-0.5(a); construcción Sesión A,
  territorio packages/ui):** el fondo claro pasa a PAPEL ALGODÓN
  #FAF9F7 (dark INTACTO; memorial intacto — su calidez ya es dignidad)
  + tokens `elevacion.reposo/elevada` (tinta cálida 31,27,22, boxShadow
  dos capas; regla Chanel del marco cableada en Tarjeta; Hoja porta
  elevada; 'sm'/'md' de Tarjeta = alias deprecados) + **SelectorSegmentado**
  (componente 29 — Ley 19.3 deja de ser pendiente) + **CeldaNavegacion**
  (componente 30 — relevamiento L-144: la Celda de lista NO cumplía la
  letra 19.1; la regla S43 "las filas resaltan" queda INTACTA para
  Celda; la tensión pressed-0.99 vs S43 se declaró al gate). WCAG
  139→142 pares / 0 fallos. Gates founder en dispositivo sobre la
  galería: PENDIENTES al escribir esto; la calibración fina de sombras
  se sella en la pantalla patrón del Hogar.
- **S57 (12 Jul 2026) — LA SKILL SE VUELVE EL EQUIPO DE DISEÑO (enmienda
  de craft FIRMADA por el founder):** entra la sección 1b (Leyes 14–20:
  tesis · firma única · regla Chanel · copy como material · estructura
  que informa · diccionario de patrones · elevación) + el mecanismo de
  pantallas patrón (lo visual se firma sobre píxeles, primera: el Hogar
  del cliente) + el protocolo del gate de craft (TESIS/FIRMA/CHANEL/
  TESTS) + la sección 1c "Cómo piensa el diseñador" (protocolo de 7
  preguntas obligatorias, pedido literal del founder). Fuente minada:
  skill `frontend-design`, traducida al lenguaje de la casa. El porqué,
  del founder: *"la casa con la mejor estructura no puede tener acabados
  que no estén a la altura."* Pendientes declarados: tokens de elevación
  y selector segmentado (nacen en packages/ui, territorio de la A);
  papel cálido del fondo (el tono se firma con el marco). Integrada por
  la Sesión B con autorización territorial puntual del founder.
- **S43–S56:** nacimiento (13 leyes, B4/B5 S43) y enmiendas por sesión
  (S52: eyebrow muerto · S53: Leyes 11/12/13 enmendadas por
  DIRECCION_ARTE, matiz Ley 3 · S55-S56: SelectorOpcion
  disposicion/multiple) — el detalle vive en el CLAUDE.md raíz.
