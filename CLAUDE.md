# e-petplace — Monorepo del ecosistema e-PetPlace

> Estado: **scaffold S43-B0 (5 Jul 2026)** — estructura, tooling, tipos y skills. CERO pantallas, CERO lógica de negocio.
> Arranque de sesión obligatorio: leer `docs/CONTRATO_TRABAJO.md` (v1.7, reglas 73-74 activas) y `docs/ESTRATEGIA_2026H2.md` (rumbo firmado S42) ANTES que cualquier backlog.

## Qué es esto

Monorepo pnpm workspaces + Turborepo del rumbo S42: reforma móvil-first con ambos lados en paralelo, React Native/Expo, vistas web del mismo código (RN-web).

| Ruta | Qué es | Estado |
|---|---|---|
| `apps/prestador/` | App Expo del prestador (iOS/Android/web) | Template limpio, pre-design-system |
| `apps/cliente/` | App Expo del dueño (iOS/Android/web) | Template limpio, pre-design-system |
| `packages/ui/` | Design system: tokens v4 + 11 componentes + 3 temas (light default/dark/memorial) | **CONSTRUIDO en S43** — gates WCAG programáticos + gate en dispositivo |
| `packages/api/` | Tipos generados de Supabase + wrappers discriminated-union (puerta única a la DB) | Tipos reales generados + 1 wrapper ejemplo del patrón |
| `packages/domain/` | Helpers puros (periodo, validaciones, países/servicios) | Placeholder |
| `supabase/` | Migraciones + config. Proyecto linkeado: `zyltipqscdsdsxnjclhp`. Las migraciones nuevas nacen ACÁ y las crea Code (regla 73) | `migrations/` vacía |
| `docs/` | Docs maestros únicos del ecosistema (copiados verbatim del repo viejo en S43-B0) | 9 docs |
| `.claude/skills/` | Skills del proyecto (`epetplace-db` + `epetplace-design-system`, ambas ACTIVAS) | ver Sección 11 de ESTRATEGIA |

## Reglas de la casa (índice, no reemplazo del contrato)

- **Candado S42 — ACTUALIZADO al cierre de S43:** el design system EXISTE — las pantallas se construyen SOLO con él (skill `epetplace-design-system` obligatoria en toda tarea de UI; componente faltante = Ley 11, jamás inline).
- **Puerta única a la DB:** los apps jamás llaman `supabase.from()/rpc()` directo — todo pasa por wrappers de `@epetplace/api` con `ResultadoWrapper<T>`.
- **Migraciones:** las escribe y ejecuta Code con la DB a la vista (regla 73); founder conserva gate de aprobación. Skill `epetplace-db` se autocarga en tareas de SQL.
- **Deudas D-NNN y lecciones L-NNN:** las nuevas viven en `docs/DEUDAS_CANONICAS.md` de ESTE repo (deudas por sesión + sección "Lecciones del monorepo"). El histórico L-001–L-130 y D-001–D-282 vive en el repo viejo congelado. La numeración continúa, no se reinicia.

## Skills del proyecto — cuándo y cuál manda

| Skill | Dispara en | Autoridad |
|---|---|---|
| `expo/skills` (19: expo-ui, expo-deployment, use-dom, native-data-fetching, upgrading-expo…) + Expo MCP (`.mcp.json`) | Todo lo que toque Expo Router, builds, EAS, deployment, data fetching nativo | PRIMERA autoridad del stack. Ante conflicto con conocimiento propio del agente, gana la skill |
| `software-mansion-labs/skills` (8: react-native-best-practices, animation, radon-mcp…) | Animaciones, gestos, performance nativa (Reanimated, Skia) | El CÓDIGO del motion nativo sale de acá |
| `emil-design-eng` + `animation-vocabulary` + `review-animations` | Decidir QUÉ animar, duraciones, curvas; auditar motion existente | El CRITERIO del motion. Sus recetas son web: en nativo aplica la filosofía, Software Mansion pone el código |
| `impeccable` | Revisión visual de UI, anti-slop, audits | Vara de calidad visual. No autoridad final en patrones nativos |
| `epetplace-db` | TODA tarea SQL, migración, RPC, wrapper | NO NEGOCIABLE — encima de cualquier otra fuente |
| `epetplace-design-system` | **ACTIVA desde B4.** Toda pantalla, componente, estilo o UI del monorepo | Obliga tokens y componentes de `@epetplace/ui`, prohíbe inventar. Conflictos de stack los ganan expo/SM; `epetplace-db` sigue arriba en SQL |

Reglas de uso:
- (a) Ante tarea que matchea una skill, leerla ANTES de escribir código — no después de equivocarse.
- (b) Si dos skills opinan distinto, manda la columna Autoridad; si la duda persiste, se escala (regla 6 del contrato).

## Gate en dispositivo (D-284) — camino nativo vigente

- **Expo Go del Play Store NO sirve** (quedó atrás de SDK 57). Instalar el APK oficial por SDK: **https://expo.dev/go** → SDK 57 → Android (sirve `Expo-Go-57.0.2.apk` desde los releases de GitHub de Expo). Se instala por fuera del Play Store (permitir "orígenes desconocidos").
- Conexión: `npx expo start --tunnel` en el app a revisar → abrir la URL `exp://<id>.exp.direct` en Expo Go (misma mecánica que una dev build: la dev build también se conecta al Metro por túnel con la misma URL exp://).
- Si algún módulo futuro exige development build (BLE del wearable, GPS background), la vía es EAS cloud: `eas login` (cuenta del founder, jamás credenciales en el repo) + profile `development` en eas.json + `eas build -p android --profile development`.

## Referencia al repo viejo (congelado)

`../e-petplace-prestadores` — **CONGELADO en S42** como referencia de flujos y RPCs (último commit: `a9b48d3`, cierre documental S42). Ahí viven: el CLAUDE.md histórico completo (S1-S42), las L-001 a L-130, los flujos del portal web y las migraciones históricas. No abrir sesiones de construcción sobre ese repo.

## Historial

- **S43-B0 (5 Jul 2026):** scaffold. Apps Expo SDK 57 (Expo Router, TS estricto, RN-web), packages ui/api/domain, supabase linkeado, `database.types.ts` generado de la DB real (verificaciones L-031 ✓), docs copiados verbatim, skills instaladas + `epetplace-db` creada.
- **S43-B1..B5 (5 Jul 2026 — sesión de design system):** dirección visual firmada (B1) → tokens v4 con la paleta CANONIZADA desde los SVG de marca (pink #FF00AF · teal #28E8DA · verdeVital #2BE86B; menta y amarillo solo-marca), 3 temas, regla de dos registros (B2/B2.1), gradiente firma v2 de 3 stops con violeta central y texto blanco (hallazgo OLED del gate físico, B3.1c) → 10 componentes construidos DE A UNO con gate en dispositivo cada uno (Boton, Tarjeta, Campo, Celda, Separador, Insignia, Encabezado, BarraTabs, Hoja, Aviso, EstadoVacio) → skill `epetplace-design-system` ACTIVA con 13 leyes (B4/B5). Gates: WCAG programático 115 pares/0 fallos; camino nativo = Expo Go 57 APK + túnel (B3.1b). Pendientes: back Android de la Hoja verificación founder (B3.8 reabierto), D-285 iOS sin verificar. Próximo: S44 — paseo end-to-end sobre el sistema.
