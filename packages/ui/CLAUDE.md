# packages/ui — Design system e-PetPlace

**Estado: S43 CERRADA — sistema completo y exigible. Las pantallas (S44+) se construyen SOLO con esto.**

## Qué hay

- **Tokens v4** (`src/tokens/`): palette canonizada desde los SVG de marca (pink #FF00AF · teal #28E8DA · verdeVital #2BE86B · menta/amarillo SOLO marca; extensiones v3.1; alphas precomputadas — nada se interpola en runtime), typography (DM Sans única UI + JetBrains Mono con REGLA DE VOZ), spacing/radius/motion (v3.1), shadows (RN objects; glow SEMÁNTICO solo-dark), opacity, dosis (prestador baja / dueño alta; isotipo = identidad, fuera de contabilidad).
- **Reglas estructurales**: DOS REGISTROS (puro=gráfica, *Dark AA=texto — gate programático), gradiente firma v2 (3 stops, violeta central, texto blanco, contextos cerrados; pinkVivo #DF00A1), paridad de tints perceptual (comunidad dark .09/.21).
- **Temas** (`src/themes/`): light (DEFAULT §7.3) / dark (opt-in) / memorial (M6 automático, sin gradiente, nada rebota) + capaText + accent.active (pink puro, UN elemento activo por vista).
- **11 componentes** (`src/components/`), cada uno con su gate en dispositivo cerrado: Boton (5 variantes, loading 150ms sin layout shift, marca degrada en memorial) · Tarjeta (tintes, interactiva 0.99, sombra jamás animada) · Campo (nada se anima al tipear, slot de mensaje reservado) · Celda (jerarquía protegida, metadataMono fuerza la voz, pressed resalta jamás escala) · Separador · Insignia (jamás Pressable, dos familias, soloPunto con a11y forzada) · Encabezado (navegacion con centrado óptico / portada con la voz humana e isotipo gradiente default) · BarraTabs (pill accent.active por opacity, wiring expo-router en JSDoc, aria-selected directo) · Hoja (bottom sheet, gestos SM, back Android DOBLE VÍA — CERRADO, verificado en dispositivo por founder post-b0fae55) · Aviso (cola de-a-uno con ref síncrono) · EstadoVacio (dignidad, sin animación de entrada).
- **Marca**: `src/brand/Isotipo.tsx` (path oficial; tinta/blanco/gradiente) + `assets/brand/` (8 logos + 3 isotipos).
- **Galería**: `src/gallery/TokenGallery.tsx` — tab "Tokens" en ambos apps; incluye la pantalla raíz completa del prestador (portada + agenda + CTA + tabs), el template de S44.

## Gates

- WCAG: `pnpm verify:contrast` — 115 pares, 0 fallos (regla de peor punto del gradiente con exención de cola verificada; tab inactivo exento por espec con medición informativa).
- Browser: `node scripts/verify-gallery.mjs` (dev servers arriba).
- Dispositivo: OBLIGATORIO por componente (Ley 9) — Expo Go 57 APK + túnel (CLAUDE.md raíz). S43 corrió solo Android → D-285 (iOS antes del primer TestFlight).

## La ley

La skill **`epetplace-design-system`** (`.claude/skills/`) es obligatoria en toda tarea de UI: 13 leyes, ejemplos correcto/incorrecto reales, índice de exports. Componente faltante = Ley 11 (espec al founder → nace acá con el método completo → entra al índice). Peers nativos con rango del app, jamás `"*"`.

Skills que pesan acá: Software Mansion (código del motion), emil-design-eng (criterio), impeccable (vara visual). Tabla de autoridad: CLAUDE.md raíz.
