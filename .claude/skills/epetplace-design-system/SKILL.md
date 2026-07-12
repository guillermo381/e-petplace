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
  "backgroundColor". Autoridad: obliga tokens y componentes de @epetplace/ui,
  prohíbe inventar. Conflictos de stack (Expo/RN/Reanimated) los ganan
  expo/skills y Software Mansion; en SQL manda epetplace-db por encima de todo.
---

# epetplace-design-system — el sistema es exigible, no sugerido

Fuente de verdad: `packages/ui` (tokens v4 + 28 componentes + 3 temas).
Galería viva: tab "Tokens" (`/gallery`) en ambos apps. Si no está en
`@epetplace/ui`, no existe en el producto.

## 1. LAS LEYES (violarlas = PR rechazado)

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

## 3. ÍNDICE — los 28 componentes (import de `@epetplace/ui`)

| Export | Cuándo |
|---|---|
| `Boton` | Toda acción. primario=default producto · marca=gated dosis alta · secundario tonal · ghost terciaria · destructivo tonal (nunca coral sólido) |
| `Tarjeta` | Toda superficie contenedora. Tintes por capa/status; `interactiva` escala 0.99; sin margin propio |
| `Campo` | Todo input de texto. Label siempre visible; nada se anima al tipear |
| `Celda` | Toda fila de lista. Pressed resalta (jamás escala); `metadataMono` para voz de máquina — desde S44-B4.1 convive con `fin` (apilados: mono arriba, nodo abajo) |
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
| `SelectorOpcion` | Chips de selección ÚNICA (S45; ENMENDADO S55-B4). Radiogroup; seleccionado = borde 1.5 capa.identidad + tint capaBg (mismo tratamiento que SelectorEspecie, sin accent.active); memorial degrada. `disposicion`: 'fila' (default, 2-4 chips que llenan el ancho) · 'tira' (scroll horizontal — la tira de días del CUÁNDO) · 'grilla' (chips envueltos para conjuntos grandes — inicios/menú de bloques). NO es multi-select ni porta estado de datos (eso es Insignia) |
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
`spacing`/`radius`/`shadows`/`motion`/`opacity`/`dosis`, temas y tipos.

**Dónde vive qué:** tokens `packages/ui/src/tokens/` · temas
`packages/ui/src/themes/` · gate WCAG `scripts/verify-contrast.ts`
(correr: `pnpm verify:contrast` — 139 pares, tiene que dar 0 fallos) ·
galería `packages/ui/src/gallery/TokenGallery.tsx` (verificación browser:
`node scripts/verify-gallery.mjs` con los dev servers arriba) · gate en
dispositivo: CLAUDE.md raíz.
