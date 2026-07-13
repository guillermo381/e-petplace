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

Fuente de verdad: `packages/ui` (tokens v4 + 30 componentes + 3 temas).
Galería viva: tab "Tokens" (`/gallery`) en ambos apps. Si no está en
`@epetplace/ui`, no existe en el producto.

Desde S57 esta skill es EL EQUIPO DE DISEÑO completo, no un manual de
materiales: las Leyes 1–13 dicen CON QUÉ se construye; la capa de craft
(§1b, Leyes 14–20) dice CÓMO se decide que una pantalla está BIEN; y el
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
4. **Dosis.** Prestador = baja: UN acento de capa por vista, CTA en tinta
   (`Boton primario`), sin gradiente UI. Dueño = alta: capas visibles,
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
   dark only; en claro se traduce a anillo nítido 1.5px + pill "● vivo".
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
13. **Carga de datos (ENMENDADA S53, DIRECCION_ARTE §5.3).** Listas y
    pantallas esperan con skeleton ESTÁTICO (formas en `bg.overlay`,
    SIN shimmer); spinner solo pasado el umbral de 150ms; cuando llegan
    los datos, reemplazo directo — JAMÁS layout shift animado.
    `EstadoVacio` solo cuando se CONFIRMÓ el vacío. EXCEPCIÓN única:
    para esperas de PROCESO >2s (lectura de carnet, pagos) vive la
    ESPERA DE MARCA (huella/isotipo trazándose en loop sereno) SIEMPRE
    con la voz honesta debajo — es de marca, no shimmer.

## 1b. LA CAPA DE CRAFT (Leyes 14–20 — ENMIENDA S57 FIRMADA por el founder)

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
4. Primera pantalla patrón: el Hogar del cliente (boceto S57, dos notas
   abiertas: íconos del set b′ cuando el lote exista; fondo/marco por
   firmar).

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
// ✓ glow SOLO dark y SOLO "en curso"; en claro: borde 1.5 del hex puro + pill "● vivo" (S44)
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

## 3. ÍNDICE — los 30 componentes (import de `@epetplace/ui`)

| Export | Cuándo |
|---|---|
| `Boton` | Toda acción. primario=default producto · marca=gated dosis alta · secundario tonal · ghost terciaria · destructivo tonal (nunca coral sólido) |
| `Tarjeta` | Toda superficie contenedora. Tintes por capa/status; `interactiva` escala 0.99; sin margin propio |
| `Campo` | Todo input de texto. Label siempre visible; nada se anima al tipear |
| `Celda` | Toda fila de lista. Pressed resalta (jamás escala); `metadataMono` para voz de máquina — desde S44-B4.1 convive con `fin` (apilados: mono arriba, nodo abajo). Entrar a una sección NO es su trabajo (eso es `CeldaNavegacion`) |
| `CeldaNavegacion` | Entrar a una sección (Ley 19.1, S58): ícono b′ TIPADO a la izquierda + título + detalle opcional + chevron de entrada; pressed 0.99. `registro` capa (dueño) / aa·tinta (prestador) — la dosis modula color, no gramática. Sin metadataMono/fin (eso es Celda). Memorial degrada adentro de Icono |
| `SelectorSegmentado` | Cambiar de vista dentro de una pantalla (Ley 19.3, S58 — los chips PROHIBIDOS como segmentos): riel hundido bg.overlay + 2-3 segmentos; el ACTIVO es superficie apoyada con `elevacion.reposo` (Chanel: sombra, jamás borde). Texto solo v1; se desliza la SUPERFICIE (fast/easeOut), la sombra viaja con ella; memorial = reemplazo directo. Mismo componente sin variante en dosis/memorial |
| `Separador` | Divisor hairline entre Celdas (`ItemSeparatorComponent`) |
| `Insignia` | Todo chip de estado/capa. JAMÁS interactivo; `soloPunto` para celdas densas |
| `Encabezado` | Techo de pantalla. `navegacion` (interna) / `portada` (raíz de tab, con la voz). S52: la portada es LOCKUP — isotipo+voz una composición horizontal, acción en línea |
| `BarraTabs` | Navegación raíz — JSDoc trae el wiring de expo-router listo |
| `Hoja` | Todo modal: bottom sheet siempre. Cierra por swipe/backdrop/X/back |
| `useAviso` (+`AvisoProvider`) | Todo feedback efímero. Uno a la vez, cola |
| `EstadoVacio` | Todo "sin datos". Voz humana, sin animación de entrada. S52: `registro='pantalla'` (default, display centrado) · `'seccion'` (sereno, dentro de una pantalla con contenido — jamás display) |
| `CitaEnVivo` | Envolver LA cita en curso — UNO por pantalla, jamás decorativo (Ley 7). dark: glow de capa · claro: anillo 1.5 + pill "● vivo" · memorial: degrada. No suma accent.active |
| `Esqueleto` (+`EsqueletoGrupo`) | Todo estado de carga. Estático por ley — sin shimmer ni pulso. Componer imitando el layout final; `EsqueletoGrupo` anuncia la carga al lector |
| `AvatarMascota` | La cara de la mascota. fotoUrl → huella digna; no porta estado ni interacción; `especie` reservada para el set ilustrado D-288 |
| `Cronometro` | Tiempo transcurrido de la atención. Voz de máquina (mono, tabular-nums); corre por DIFERENCIA contra inicioTs del server; `pausadoEnMs` congela quieto. Tamaño display provisional (se ratifica en B4) |
| `EvidenciaFoto` (`.Capturar`/`.Thumbnail`) | Captura y thumbnail de evidencia. Capturar abre cámara directo, galería secundaria en Hoja; Thumbnail porta estado subiendo/subida/error — la foto JAMÁS desaparece por error; no sube nada: la cola es de la pantalla |
| `MapaRecorrido` | El track del paseo sobre mapa real. `vivo` sigue el último punto (gestos muertos, punto hex puro + anillo) · `recorrido` encuadra con aire (zoom/pan sí, rotate/pitch no). Mapa claro en los 3 temas (F1); web = placeholder digno. EXIGE dev build (Expo Go sin tiles SDK 53+) |
| `SelectorEspecie` | Selección única de especie (onboarding dueño, S45). Grid 3×2, ficha AvatarMascota+nombre; seleccionada = borde 1.5 capa.identidad + tint capaBg — NO consume accent.active. Presentacional puro; memorial degrada (borde text.secondary) |
| `CampoFecha` | Fecha de nacimiento con precisión honesta (S45). Se ve como Campo; abre Hoja con selector JS puro (mes/año + día opcional + "No sé la fecha"→etapa). Valor {fecha, precision exacta/aproximada/estimada} = espejo del CHECK de DB. La pantalla es dueña del valor |
| `HojaScroll` | Scrollable interno que GANA dentro de la Hoja (patrón SM block — fix S45-B3.2). OBLIGATORIO para toda lista desplazable dentro de una Hoja: el ScrollView plano pierde contra el swipe-to-close en Android y web no lo delata (L-132) |
| `SelectorAvatar` | La foto de identidad de la mascota (S45). Vacío = AvatarMascota + invitación (la huella es cara válida); Hoja con cámara/galería PARES + "Por ahora no" primera clase; con foto: Cambiar/Quitar. Entrega {uri,width,height}; el upload es de la pantalla. Captura por `capturaFoto` (infra compartida con EvidenciaFoto — no duplicar) |
| `HeroMarca` | Cabecera con el gradiente firma (S45, contexto cerrado dosis alta). alto=bienvenida · compacto=techo de paso Y techo del Hogar (enmienda Ley 4, S52). Isotipo blanco adentro = el UNO por pantalla; CTAs JAMÁS adentro (marca sobre marca). Memorial: bg.card plano, text.primary — degrada solo |
| `SelectorOpcion` | Chips de selección de VALOR (S45; ENMENDADO S55-B4 y S56). Radiogroup (o checkbox-group con `multiple` — los 7 días del plan); seleccionado = borde 1.5 capa.identidad + tint capaBg (mismo tratamiento que SelectorEspecie, sin accent.active); memorial degrada. `disposicion`: 'fila' (default, 2-4 chips que llenan el ancho) · 'tira' (scroll horizontal — la tira de días del CUÁNDO) · 'grilla' (chips envueltos para conjuntos grandes — inicios/menú de bloques). NO porta estado de datos (eso es Insignia). **OJO Ley 19.3 (S57): PROHIBIDO como tabs/segmento de vistas** — ese trabajo es de `SelectorSegmentado` (vivo desde S58); las pantallas vivas con chips-como-segmento migran en su pasada de craft |
| `LineaDeVida` | El timeline del dueño (S45-B5.2). Diccionario CERRADO tipo→voz humana/capa ADENTRO (Ley 3: el dueño jamás ve un código; desconocido degrada digno por eje). Punto hex puro de capa + conector hairline + Tarjeta; mono solo hora/duración. Carga = esqueleto 3 nodos; el vacío es de la pantalla; pie con "Cargar más"/error. cita_servicio NO se muestra (filtra el wrapper) |
| `VisorFoto` | Lightbox una-foto-a-la-vez (S45-B5.3). SOLO fades (Ley 6/8 gratis); letterbox digno sin recortar; fondo pleno (tinta+scrim, no depende del tema); cierra por X/back(doble vía)/tap-fondo; swipe horizontal = reemplazo directo; contador "n de m" en mono |
| `FichaVacuna` | La ficha de UNA vacuna en la revisión del carnet (S47-B1.1; derivación S48). Presentacional pura: tap → `onEditar` (la edición es una Hoja de LA PANTALLA), "Esta no es" → `onDescartar`. Estados derivados de los datos: completa neutra (nombre+fecha; **tipo null NO tiñe** — decisión founder S48, los carnets reales no lo rotulan) · dudosa = SOLO fecha faltante, tinte cuidado y voz humana ("No pudimos leer la fecha") · `rechazada` (prop, del item_invalido de la RPC) danger — nada se pierde. Nombre en DM Sans (lo escribió un humano); fechas y lote en mono minúsculas. Memorial degrada: sin tinte, borde neutro |
| `Icono` (+primitiva `Huella`) | El set b′ de DIRECCION_ARTE (S53): nombre TIPADO (paseo·veterinaria·grooming·refugio·despensa·coach), objeto en trazo 1.9 + Huella rellena en el hex de su capa; `registro` capa/aa/tinta (dosis §2.7); memorial adentro (huella a text.secondary, el destello no destella). `Huella` es LA primitiva canónica — nadie la redibuja. Todo ícono nuevo = entrada del registry + galería + gate founder por ícono; gate a 21px obligatorio (§2.9) |
| `BarrasSemana` | La tira de 7 días de los Vitales (S53-B2c.1, espec firmada en brief). 7 barras proporcionales al valor REAL del día; día sin dato = barra base en bg.overlay (la verdad tal cual, L-139). Presentacional puro, ESTÁTICA (Ley 6), color hex puro de su capa; memorial degrada llenas a text.secondary. Sin ejes ni tooltips — no es un chart genérico |
| `FichaMascotaHogar` | v2 (S52-P3, espec gateada): la mascota PRESIDE — AvatarMascota 64 (foto primero, huella fallback) sobre superficie Tarjeta, nombre en DM Sans light xl y UNA voz SIN sujeto (ficha.* del riel; las variantes con {{nombre}} se conservan para contextos sin sujeto visible). Semántica intacta: alDia punto verdeVital · pideAtencion punto ochre + warningText · conociendolo neutral. Tap → perfil (pressed 0.99 de Tarjeta); sin badges ni CTA. Diseñada para 1-3 apiladas. Memorial degrada. Cero tokens nuevos |

También: `ThemeProvider`/`useTheme` (light default, memorial forzable),
`Isotipo` (tinta/blanco/gradiente), y las PRIMITIVAS DE MARCA S53:
`Huella` (el path canónico b′), `Guijarro` (ilustración §4),
`EsperaDeMarca` (la única animación de espera legal: la huella respirando ~1.9s easeInOut para procesos >2s, SIEMPRE con voz honesta debajo; memorial quieta; no muestra datos — escalera no aplica), `palette`/`gradients`/`typography`/
`spacing`/`radius`/`shadows`/`elevacion` (S58: reposo/elevada por tema —
Ley 20)/`motion`/`opacity`/`dosis`, temas y tipos.

**Dónde vive qué:** tokens `packages/ui/src/tokens/` · temas
`packages/ui/src/themes/` · gate WCAG `scripts/verify-contrast.ts`
(correr: `pnpm verify:contrast` — 142 pares desde S58, tiene que dar 0 fallos) ·
galería `packages/ui/src/gallery/TokenGallery.tsx` (verificación browser:
`node scripts/verify-gallery.mjs` con los dev servers arriba) · gate en
dispositivo: CLAUDE.md raíz · dirección de arte e iconografía:
`docs/DIRECCION_ARTE.md` · tests de pantalla y escalera §4b:
`docs/DISEÑO_EXPERIENCIA.md`.

## Historial de la skill

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
