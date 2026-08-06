# S88-C — ESTADO PRE-COMPACTACIÓN (5-ago-2026, ~22:00)

Depósito ordenado por la mesa antes de compactar. La C fresca abre acá.

## 1. Territorio y entorno

- **Territorio:** `apps/prestador` + su canal OTA (preview). A = main/DB/packages-api/docs/merges/publishes · B = packages/ui/lint.
- **Worktree:** `e-petplace-s87-C`, rama `pista/s87-c`.
- **Emulador (D-655, dos veces pagado):** exige DNS explícito y lanzamiento DESACOPLADO del turno o muere con él:
  ```
  cd /tmp && nohup ~/Library/Android/sdk/emulator/emulator -avd <avd> \
    -dns-server 8.8.8.8,1.1.1.1 -no-snapshot-load > /tmp/emu.log 2>&1 & disown
  ```
- `eas-cli` SIEMPRE desde `apps/prestador/` (el scaffold del stub depende del DIRECTORIO, aunque solo mires).
- Mensajes de commit con backticks: SIEMPRE `git commit -F <archivo>` (el shell ejecuta los backticks de `-m` como sustitución — mutila en silencio). Commits forma pathspec (regla 84).

## 2. Dónde estás

- Rama en **`b823eaa`**, árbol limpio, `tsc` EXIT=0 y `verify:diseno` VERDE.
- **Tanda partida:** `50aa1a6` · `91f4db6` · `8d527d6` **YA viajaron** en el bundle **`019fd4e6-003d`** (group `a01a4b11`, ancla `93669b6` — verificado por contenido con `update:view`: updateId android `019fd4e6-003d-79a7-85a4-a19d54566de7`, gitCommitHash `93669b660`). Es el group MÁS NUEVO del canal.
- **`b823eaa` (las cuatro derivaciones de D-664) espera la próxima veda de A** — NO está en ningún bundle; su dedo no se declara desde `019fd4e6`.

## 3. Lo construido por C en esta corrida (una línea cada uno)

- **El reset en dos pasos** (`recuperar.tsx`: pedir → código → clave) + **CampoCodigo enchufado** (largo=8) + **la cura del bucle** (pedir uno nuevo LIMPIA el campo) — **D-659 MUERTA con el dedo del founder**.
- **El home por rol sin parpadeo** (`(tabs)/index.tsx`: rol resuelto en el loader ANTES de pintar — gestor/recepcion/profesional).
- **La banda «En la puerta»** en el HOY consolidado (las tres huérfanas del censo: llegadas, esperando, solicitudes con reloj del server; solo recepción y gestor; vacía no se pinta).
- **MOSTRADOR_ORDEN** (el botón entre SelectorDia y FiltroOficio, según lámina).
- **La vitrina por titularidad** («Tu perfil» y «Tu negocio» gateadas por `esTitular === true` en `cuenta/index.tsx`) + **GateAjeno** (componente, sin reintento a propósito) en la ruta alcanzable `cuenta/perfil`.
- **El entierro de `agenda-recepcion.tsx`** (borrado tras el dedo founder de la banda; censo previo de 11 capacidades → 3 huérfanas → firma founder).
- **El censo de prosa caducada** + curas (7 sitios + soloDueno + nota `_own` retirada + `plataSoloTitular` reescrita: la razón es «quien está en el mostrador»).
- **La Hoja de asignar** en `pizarra.tsx` cableada a `obtenerPersonasParaAsignar(citaId)` (por-apertura; ` · sin horario` cuando !tieneJornada; `cita_ya_asignada` → fila pasa a 'tomada').
- **Las cuatro derivaciones `esDueno` muertas** con `obtenerMiPosicionEnPrestador` (en `b823eaa`): equipo→**gestiona** (orden de mesa: el admin no pierde esa superficie) · mascotas→gestiona · cuenta/index→esTitular · cuenta/perfil→esTitular. Fallo = error con reintento, jamás rol adivinado.

## 4. Dedos — corridos y pendientes

### Corridos sobre `019fd4e6` (5-ago, capturas en el scratchpad de la sesión vieja — las horas valen como registro)

- ✅ **(a) profesional sin «Tu perfil» ni «Tu negocio»** — 21:46, Cuenta reducida a Seguridad·Preferencias (`s87c-v2-prof-cuenta.png`).
- ✅ **Deep link `prestador:///cuenta/perfil` → GateAjeno con su voz** — 21:46:55 (`s87c-v3-deeplink.png`).
- ⚠️ **(c) titular con las dos celdas** — 21:45 (`s87c-v1-titular.png`) **con asterisco: era sesión residual, no login fresco** (ver freno).

### 🛑 FRENO ABIERTO — las credenciales de (b) y (c) murieron fuera de C

- (b) `+s87recep` rebota «no coinciden» ×3 (21:48 · 21:49:24 · 21:55, clave verificada en pantalla pre-envío, `s87c-v7-pre.png`). (c) `demo-prestador` rebota con login fresco 21:57.
- **Sonda funcional 21:58 contra el auth de Supabase:** (a) → 200 · (b) → **400 `invalid_credentials`** · (c) → **400 `invalid_credentials`**.
- **Contra qué midió que no fue C:** censo del transcript — el par del reset corrió sobre `+s87prof` y su restauración está registrada y probada (el 200 de (a)); `s87recep` y `demo-prestador` solo aparecen en logins. (b) además logueó verde con la misma clave más temprano (evidencia D-651).
- Reportado a la mesa; **esperando claves vigentes de (b) y (c)** o la palabra de A/founder sobre la rotación.

### Bloqueados por el freno (correr apenas lleguen claves, sobre `019fd4e6`)

- (b) recepción: **HOY con plata visible + voz nueva + banda**.
- **La Hoja de asignar** (no ofrece al titular sin chip) — exige gestor logueado; (a) profesional no ve «Asignar» por diseño.
- **(c) intacto** + devolver el emulador a (c) (instrucción vigente, hoy incumplible — quedó en Sign in con los campos de (c) cargados).

### Sobre la veda siguiente (cuando A publique con `b823eaa`)

- **El dedo de D-664:** admin ve equipo en DATOS y edita en `/negocio/equipo` · recepción/profesional sin vitrina · titular intacto. Cada superficie con su verdad.

## 5. Las cuentas y su regla

| Cuenta | Rol | Clave |
|---|---|---|
| (a) `guillo381+s87prof@gmail.com` | profesional, 2 chips | `S87prueba!2026` ✅ viva (sonda 200) |
| (b) `guillo381+s87recep@gmail.com` | recepción, 0 chips | ⚠️ canónica MUERTA (invalid_credentials) |
| (c) `demo-prestador@epetplace.dev` | titular Paseos Andres | ⚠️ canónica MUERTA (invalid_credentials) |
| admin `guillo381+s88rolpuro@gmail.com` | administrador puro | `S88puro!2026` (sin probar por C) |

**Todo recuento excluye `+s87`/`+s88` o miente** (regla de la mesa desde D-651).

## 6. Lo que C espera de otros

- **La veda de A** (lleva `b823eaa`).
- **De B:** el glifo campana + la variante huella del badge.
- **La lámina de la campana YA está depositada** (`docs/laminas/LAMINA_CAMPANA.md`) — su pantalla del prestador probablemente sea de C: leerla ANTES de construir.

## 7. Las leyes de esta corrida (por referencia al acta)

- La prosa caducada se cura con ⏪ y fecha, **jamás se borra**.
- **L-206:** un lector de pre-filtro espeja la puerta que alimenta.
- El rol se resuelve **ANTES de pintar** (cero parpadeo entre caras).
- **Un censo previo precede a todo entierro** (11 capacidades → 3 huérfanas → firma → recién ahí se borra).
- El método de dedos: **capturar y verificar entre cada paso** (los dos incidentes de taps ciegos están en acta); el marcador se verifica en pantalla ANTES de medir (forzar detención ×2); todo freno declara **contra qué midió**.
