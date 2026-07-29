# S81-C7 — TRIAGE del CLIENTE (las 48, método C4)

> Misma regla que C4: uso DIARIO → CLARIDAD · se ve UNA vez y marca → MOMENTO · solo piel → MECÁNICA. Base: el inventario C3 (48 pantallas cliente). La bienvenida ya tiene palabra del founder: *"harto trabajo de artesano por hacer"*.

| Ruta | Rediseño (C3) | Triage |
|---|---|---|
| `bienvenida` | pre-S80 | **MOMENTO** (la primera impresión — palabra del founder) |
| `onboarding/mascota` | pre-S80 | **MOMENTO** (el alta de la primera mascota marca) |
| `onboarding/fecha` | pre-S80 | **MOMENTO** |
| `onboarding/foto` | pre-S80 | **MOMENTO** |
| `onboarding/cierre` | pre-S80 | **MOMENTO** |
| `carnet` | pre-S80 | **MOMENTO** (el wow del expediente — la espera de marca vive acá) |
| `parte/[eventoId]` | pre-S80 | **MOMENTO** (lo que la familia recibe del paseo) |
| `adiestramiento/[citaId]` (parte) | pre-S80 | **MOMENTO** (el parte con clip) |
| `autorizacion/[solicitudId]` | pre-S80 | **MOMENTO** (el handshake de un toque) |
| `paseo/[atencionId]` (EN VIVO) | **S81-B EN CURSO** | **MOMENTO** (ya en manos de B — no se toca) |
| `index` (raíz) · `login` · `registro` | pre-S80 | CLARIDAD |
| `(tabs)/hogar/index` | pre-S80 | CLARIDAD (el diario) |
| `(tabs)/hogar/mascota/[id]` | **parcial S81-C** (perfil antes que historial) | CLARIDAD |
| `(tabs)/hogar/paseos` · `grooming` · `adiestramiento` (hubs) | adiestramiento parcial S81 | CLARIDAD |
| `(tabs)/hogar/agregar/{index,fecha,foto,cierre}` | pre-S80 | CLARIDAD |
| `(tabs)/explorar/*` (15: portadas, disponibles, checkouts, paquete, confirmar) | pre-S80 | CLARIDAD (reserva = claro, no memorable) |
| `(tabs)/cuenta/*` (7) | index parcial S81-A | CLARIDAD |
| `citas/[mascotaId]` · `adoptar` | pre-S80 | CLARIDAD |
| `gallery` · `lamina-fusion` | dev | MECÁNICA/N-A (herramientas) |

**Conteo: MOMENTO 10 · CLARIDAD 36 · MECÁNICA/dev 2.**
**Orden de arranque de los MOMENTOS (declarado):** ① `bienvenida` (palabra del founder, primera impresión) → ② el arco del alta (`onboarding` ×4 — se caminan juntas) → ③ `carnet` → ④ los partes (`parte`, `adiestramiento/[citaId]`) → ⑤ `autorizacion`. El EN VIVO queda en B.
