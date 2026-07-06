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

Fuente de verdad: `packages/ui` (tokens v4 + 15 componentes + 3 temas).
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
3. **Regla de voz.** JetBrains Mono SOLO para datos que generó una máquina
   (IDs, horas, montos) — minúsculas, tracking suave, sin transform
   (`Celda.metadataMono` ya lo fuerza). Todo lo vivo/humano va en DM Sans;
   voz humana = DM Sans 300 en lg+. El vocabulario interno del modelo
   (M1..M7, IDs de capa) JAMÁS visible al usuario.
4. **Dosis.** Prestador = baja: UN acento de capa por vista, CTA en tinta
   (`Boton primario`), sin gradiente UI. Dueño = alta: capas visibles,
   gradiente firma solo en contextos cerrados (hero onboarding, CTA
   principal dueño, momento adopción). El isotipo es IDENTIDAD: va en
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
11. **Protocolo del componente faltante.** Si la UI necesita algo que los
    15 no cubren, PROHIBIDO inline en apps. Camino: (a) proponer al
    founder espec mínima (qué es, qué no es, estados), (b) nace en
    `packages/ui` con el método completo — tokens, WCAG si trae pares
    nuevos, galería, gate en dispositivo —, (c) se agrega al índice de
    esta skill. Sin excepción "por esta vez": la deuda visual no se paga
    nunca.
12. **Iconografía.** Outline ~1.75px, remates redondeados (`strokeLinecap
    ="round"`), UN color por ícono (el de su capa o el text del contexto),
    cero emojis en UI de producto, cero librerías de íconos nuevas sin
    decisión del founder.
13. **Carga de datos.** Listas y pantallas esperan con skeleton ESTÁTICO
    (formas en `bg.overlay`/hover, SIN shimmer — el shimmer es animación
    de espera y está prohibido); spinner solo pasado el umbral de 150ms
    (el patrón del `Boton`, generalizado); cuando llegan los datos,
    reemplazo directo — JAMÁS layout shift animado. `EstadoVacio` solo
    cuando se CONFIRMÓ el vacío, nunca como estado de carga.

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

## 3. ÍNDICE — los 15 componentes (import de `@epetplace/ui`)

| Export | Cuándo |
|---|---|
| `Boton` | Toda acción. primario=default producto · marca=gated dosis alta · secundario tonal · ghost terciaria · destructivo tonal (nunca coral sólido) |
| `Tarjeta` | Toda superficie contenedora. Tintes por capa/status; `interactiva` escala 0.99; sin margin propio |
| `Campo` | Todo input de texto. Label siempre visible; nada se anima al tipear |
| `Celda` | Toda fila de lista. Pressed resalta (jamás escala); `metadataMono` para voz de máquina |
| `Separador` | Divisor hairline entre Celdas (`ItemSeparatorComponent`) |
| `Insignia` | Todo chip de estado/capa. JAMÁS interactivo; `soloPunto` para celdas densas |
| `Encabezado` | Techo de pantalla. `navegacion` (interna) / `portada` (raíz de tab, con la voz) |
| `BarraTabs` | Navegación raíz — JSDoc trae el wiring de expo-router listo |
| `Hoja` | Todo modal: bottom sheet siempre. Cierra por swipe/backdrop/X/back |
| `useAviso` (+`AvisoProvider`) | Todo feedback efímero. Uno a la vez, cola |
| `EstadoVacio` | Todo "sin datos". Voz humana, sin animación de entrada |
| `CitaEnVivo` | Envolver LA cita en curso — UNO por pantalla, jamás decorativo (Ley 7). dark: glow de capa · claro: anillo 1.5 + pill "● vivo" · memorial: degrada. No suma accent.active |
| `Esqueleto` (+`EsqueletoGrupo`) | Todo estado de carga. Estático por ley — sin shimmer ni pulso. Componer imitando el layout final; `EsqueletoGrupo` anuncia la carga al lector |
| `AvatarMascota` | La cara de la mascota. fotoUrl → huella digna; no porta estado ni interacción; `especie` reservada para el set ilustrado D-288 |
| `Cronometro` | Tiempo transcurrido de la atención. Voz de máquina (mono, tabular-nums); corre por DIFERENCIA contra inicioTs del server; `pausadoEnMs` congela quieto. Tamaño display provisional (se ratifica en B4) |

También: `ThemeProvider`/`useTheme` (light default, memorial forzable),
`Isotipo` (tinta/blanco/gradiente), `palette`/`gradients`/`typography`/
`spacing`/`radius`/`shadows`/`motion`/`opacity`/`dosis`, temas y tipos.

**Dónde vive qué:** tokens `packages/ui/src/tokens/` · temas
`packages/ui/src/themes/` · gate WCAG `scripts/verify-contrast.ts`
(correr: `pnpm verify:contrast` — 115 pares, tiene que dar 0 fallos) ·
galería `packages/ui/src/gallery/TokenGallery.tsx` (verificación browser:
`node scripts/verify-gallery.mjs` con los dev servers arriba) · gate en
dispositivo: CLAUDE.md raíz.
