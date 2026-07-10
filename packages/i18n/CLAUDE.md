# packages/i18n — Riel de internacionalización (nace en S51-B1a)

Puerta única del riel es/en (decisión founder S49/S51: bilingüe desde el día 1; español = TUTEO NEUTRO, regla 27 ampliada).

## Qué hay

- **Instancia** (`src/instancia.ts`): i18next + react-i18next. Idioma inicial: override persistido > locale del dispositivo (expo-localization) > `es`. `cambiarIdioma()` cambia en vivo Y persiste.
- **Persistencia** (`src/persistencia.ts`): AsyncStorage key `epetplace.idioma` — SOLO dispositivo; la sync a DB es D-316 (ciclo B1).
- **Keys tipadas exigibles** (`src/tipos.ts` + `src/useTraduccion.ts`): `crearUseTraduccion<typeof diccionarioEs>(namespace)` — una key inexistente ROMPE el typecheck; `Espejo<D>` obliga paridad es↔en (traducción faltante o sobrante rompe). Se eligió hook-factory sobre module augmentation global de i18next porque los diccionarios tienen DUEÑOS múltiples (apps + packages/ui) y dos augmentations de `CustomTypeOptions.resources` colisionan.
- **Provider** (`src/ProveedorI18n.tsx`): va en el `_layout` raíz de cada app con sus `recursos`.

## Reglas de la casa

- **Diccionarios por DUEÑO:** `apps/cliente/src/i18n/` (ns `cliente`), `apps/prestador/src/i18n/` (ns `prestador`), `packages/ui/src/i18n/` (ns `ui` — la voz de los componentes nace bilingüe EN el paquete). `RecursosPorIdioma` exige el ns `ui` por tipo.
- **Cero strings crudos en pantallas nuevas** (regla 26 bilingüe): toda pantalla A1+ nace con sus textos en el diccionario. Las viejas migran AL TOCARSE (D-315, voseo→tuteo al migrar).
- **Voz emocional con gate:** las traducciones en de textos emocionales exigen lote es/en aprobado por el founder (decisión 7 S51, patrón D-300). La funcional se traduce directo.
- **`expo-localization` es módulo nativo** — L-134: entrar el riel a una APK exige build nueva (ver nota operativa S51 en `docs/DEUDAS_CANONICAS.md`).
- Verificación runtime del riel: `node scripts/verify-i18n.mjs` (dev servers 8081/8082 arriba) — 3 escenarios × 2 apps (locale es / locale en / override gana al locale).
