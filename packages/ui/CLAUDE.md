# packages/ui — Design system e-PetPlace

**Estado: S43-B3.1 — primer componente (Boton) construido; pendiente gate del founder EN DISPOSITIVO (D-284 dispara acá).**

B3.1: `src/components/Boton.tsx` — 5 variantes (primario tinta = default de todo el producto; marca gradiente gated a dosis alta, degrada a primario en memorial; secundario tonal; ghost; destructivo tonal — la destrucción no grita), 3 tamaños (36/48/56, sm con hitSlop → target 44), estados default/pressed/disabled/loading/focus-web. Motion: receta SM (CSS transitions de Reanimated + Pressable + estado, sin worklets) — pressed scale 0.97, spring de motion.ts, nada más se anima. Loading respeta la regla emil de 150ms y no mueve layout (label invisible preserva ancho). Token nuevo: `opacity.disabled` 0.45. Limpieza: verdeDark #2E7A28 + verdeAlphaL/verdeBorderL eliminados (huérfanos). B3 construye componentes DE A UNO: nada más nace hasta que el botón tenga gate.

B2.1 (hotfix aprobado sobre B2): REGLA DE DOS REGISTROS (palette.ts) — hex PUROS para gráfica (puntos, tints, indicadores), variantes *Dark AA solo para texto. `verdeVital #2BE86B` = capa Vida + success en los 3 temas (texto AA claro: `verdeVitalDark #1E7A33`); el menta #90FF8B quedó solo-marca. Tints claros saturados sobre hex puro. `accent.active` = pink puro (indicador de activo, uno por vista). Temas light/dark ganan `capaText` (registro de texto); memorial INTACTO. Gate: 97 pares, 0 fallos (ajustes: ochreDark→#925F0C, coralDark→#BE3535).

Qué hay:
- `src/tokens/` — palette (marca canonizada del SVG: pink #FF00AF, teal #28E8DA, verde #90FF8B; amarillo #FFF645 SOLO logo; alphas precomputadas rgba — nada se interpola en runtime), typography (DM Sans única familia UI + JetBrains Mono con REGLA DE VOZ), spacing/radius/motion (v3.1 intactos), shadows (objetos RN, glow SOLO dark), dosis (asimetría prestador=baja / dueño=alta).
- `src/themes/` — light (DEFAULT §7.3), dark (opt-in), memorial (M6 automático, sin gradiente) + getTheme. Shape v3.1: bg/text/accent/capa/status/services/shadow/border.
- `src/ThemeProvider.tsx` — useTheme(); memorial forzable por prop.
- `src/fonts.ts` — epetplaceFonts para useFonts (cableado en el root layout de ambos apps).
- `src/brand/Isotipo.tsx` — path oficial del Manual de Marca; variantes tinta/blanco/gradiente. `assets/brand/` — 8 SVG del logo + 3 isotipos generados.
- `src/gallery/TokenGallery.tsx` — herramienta de verificación, montada en /gallery de ambos apps (tab "Tokens", se retira en B3).

Gates pasados: `pnpm verify:contrast` → **97 pares WCAG, 0 fallos** (ajustes S43-B2: ochreDark→#97620C, terracottaDark→#AF5433, violetText #A64BFF para texto en dark, memorial text.warm corregido). Runtime web verificado en ambos apps con browser real (`scripts/verify-gallery.mjs`): 3 temas, toggle, 0 errores JS. **Nativo pendiente: esta máquina no tiene Xcode/Android SDK.**

Regla de oro: ningún componente escribe color/tamaño/sombra hardcodeado. Los componentes (B3) nacen SOLO sobre estos tokens. La skill `epetplace-design-system` nace al cierre de S43 (B4).

Skills: ante tarea que matchee una skill, leerla ANTES de escribir código.
Cuál manda por dominio: tabla "Skills del proyecto" en el CLAUDE.md raíz.
Acá pesan: Software Mansion (código del motion), emil-design-eng (criterio), impeccable (vara visual).
