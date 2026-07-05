# packages/ui — Design system e-PetPlace

**Estado: S43-B2 CERRADO (pendiente gate visual del founder) — Design Tokens v4 construidos.**

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
