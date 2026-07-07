# e-petplace — Monorepo del ecosistema e-PetPlace

> Estado: **S44 CERRADA (6-7 Jul 2026)** — el paseo corre END-TO-END en la app del prestador (Agenda → Detalle → Durante con GPS/mapa/evidencia → Cierre con parte), verificado DOS veces en dispositivo por el founder. 17 componentes en packages/ui, 12 wrappers + puerta única viva en packages/api, pipeline EAS operativo.
> Arranque de sesión obligatorio: leer `docs/CONTRATO_TRABAJO.md` (v1.7, reglas 73-74 activas) y `docs/ESTRATEGIA_2026H2.md` (rumbo firmado S42) ANTES que cualquier backlog.

## Qué es esto

Monorepo pnpm workspaces + Turborepo del rumbo S42: reforma móvil-first con ambos lados en paralelo, React Native/Expo, vistas web del mismo código (RN-web).

| Ruta | Qué es | Estado |
|---|---|---|
| `apps/prestador/` | App Expo del prestador (iOS/Android/web) | **Paseo E2E vivo (S44)**: Agenda + Detalle + Durante + Cierre sobre el design system; shell Stack+(tabs); auth dev-only (D-290) |
| `apps/cliente/` | App Expo del dueño (iOS/Android/web) | Template limpio, pre-design-system |
| `packages/ui/` | Design system: tokens v4 + **17 componentes** + 3 temas (light default/dark/memorial) | S43 construyó 11; **S44 sumó 6** (CitaEnVivo, Esqueleto, AvatarMascota, Cronometro, EvidenciaFoto, MapaRecorrido) — gates WCAG 135 pares/0 fallos + gate en dispositivo |
| `packages/api/` | Tipos generados de Supabase + wrappers discriminated-union (puerta única a la DB) | **12 wrappers vivos (S44)**: 7 de paseo + 3 transversales + catálogos + lecturas (agenda/prestador/track), 17/17 asserts imperativos contra DB |
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
- **Expo Go cubre todo SALVO mapas** (hallazgo S44-B2.6): Google Maps fue REMOVIDO de Expo Go Android en SDK 53 — changelog oficial SDK 52: *"Google Maps will no longer be supported in Expo Go for Android in SDK 53 … You can use Google Maps in development builds"* (https://expo.dev/changelog/2024-11-12-sdk-52). La doc de map-view que dice "no additional setup in Expo Go" está desactualizada. Síntoma: contenedor sin tiles + "Authorization failure" en logcat.
- Módulos que exigen development build: **mapas (react-native-maps/expo-maps, vigente HOY)** + los ya conocidos (BLE del wearable, GPS background). La vía es EAS cloud: `eas login` (cuenta del founder, jamás credenciales en el repo) + profile `development` en eas.json + `eas build -p android --profile development`. La dev build convive con Expo Go en el teléfono: el resto del sistema sigue gateando por túnel.
- **Pipeline EAS OPERATIVO desde S44** (apps/prestador): projectId `83a4d295-764e-4067-add2-e91512c06649`, package `com.epetplace.prestador`, profile `development` (developmentClient, apk, environment development), keystore generada y guardada en la nube de Expo, `GOOGLE_MAPS_API_KEY` como env secret (environment development) inyectada vía `app.config.ts` — la key JAMÁS en el repo. Regla operativa: **módulo nativo nuevo = build nueva (L-134)**; la config de la key exige "Maps SDK for Android" habilitado en Google Cloud (S44 lo aprendió con 2 builds).

## Referencia al repo viejo (congelado)

`../e-petplace-prestadores` — **CONGELADO en S42** como referencia de flujos y RPCs (último commit: `a9b48d3`, cierre documental S42). Ahí viven: el CLAUDE.md histórico completo (S1-S42), las L-001 a L-130, los flujos del portal web y las migraciones históricas. No abrir sesiones de construcción sobre ese repo.

## Historial

- **S43-B0 (5 Jul 2026):** scaffold. Apps Expo SDK 57 (Expo Router, TS estricto, RN-web), packages ui/api/domain, supabase linkeado, `database.types.ts` generado de la DB real (verificaciones L-031 ✓), docs copiados verbatim, skills instaladas + `epetplace-db` creada.
- **S43-B1..B5 (5 Jul 2026 — sesión de design system):** dirección visual firmada (B1) → tokens v4 con la paleta CANONIZADA desde los SVG de marca (pink #FF00AF · teal #28E8DA · verdeVital #2BE86B; menta y amarillo solo-marca), 3 temas, regla de dos registros (B2/B2.1), gradiente firma v2 de 3 stops con violeta central y texto blanco (hallazgo OLED del gate físico, B3.1c) → 10 componentes construidos DE A UNO con gate en dispositivo cada uno (Boton, Tarjeta, Campo, Celda, Separador, Insignia, Encabezado, BarraTabs, Hoja, Aviso, EstadoVacio) → skill `epetplace-design-system` ACTIVA con 13 leyes (B4/B5). Gates: WCAG programático 115 pares/0 fallos; camino nativo = Expo Go 57 APK + túnel (B3.1b). B3.8 (back Android de la Hoja): CERRADO — verificado en dispositivo por founder post-b0fae55. Pendiente: D-285 iOS sin verificar. Próximo: S44 — paseo end-to-end sobre el sistema.
- **S44 (6-7 Jul 2026 — paseo end-to-end):** B0 fotografía (higiene B3.8 CERRADO, inventario ui, relevamiento del flujo viejo + RPCs verificadas con pg_get_functiondef contra DB viva, DM-S38.1, tensiones para B1; quedó operativo el acceso de Code a la DB: `npx supabase --experimental db query --linked`). B2: 6 componentes nuevos DE A UNO con gate en dispositivo — CitaEnVivo (glow semántico / anillo+pill), Esqueleto (+Grupo, estático Ley 13), AvatarMascota (huella digna; especie reservada a D-288; registro capaBg nuevo; violetText #AE59FF por gate), Cronometro (voz de máquina, tabular-nums, display provisional ratificado en B4), EvidenciaFoto (cámara directa + galería en Hoja + thumbnails con estados), MapaRecorrido (HALLAZGO: Google Maps removido de Expo Go Android en SDK 53 → dev build; 4 builds hasta tiles vivos). Celda enmendada (metadataMono+fin apilados). B3: 12 wrappers en packages/api (17/17 asserts imperativos con JWT+ROLE y ROLLBACK; 4 errores tipados ejercitados). B4: Agenda (estado por atención embebida; CitaEnVivo real), Detalle (redirect 7.5), Durante (GPS foreground, buffer 12/60s heredado, evidencia a cita-archivos, parte en grilla, motivos GPS de un toque), Cierre (parte + mensaje familia + guard visible), refetch en focus en las 4. Seed demo (regla 73, gate founder) + user demo + bootstrap dev de sesión. **CRITERIO DE SALIDA CUMPLIDO: dos paseos de Zeus cerrados con calidad de punta a punta en dispositivo (tracks GPS reales, fotos, partes, mensajes de familia, citas completadas, hitos sellados).** Deudas D-286→D-292 y lecciones L-133/L-134 en `docs/DEUDAS_CANONICAS.md`. **Los datos demo QUEDAN en DB** (decisión founder+arquitecto: el seed re-ancla a hoy y B5 los necesita; `supabase/dev/cleanup_demo_s44.sql` disponible cuando molesten). Único bloque no ejecutado: B5 (GPS background) — defer previsto, D-292.
