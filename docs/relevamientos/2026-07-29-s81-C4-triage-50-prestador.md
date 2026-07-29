# S81-C4 — TRIAGE de las 50 del prestador (la tabla C3 + la columna)

> Misma tabla que `s81-C3` (solo las 50 filas prestador con "1ª sem = sí"). Regla aplicada: uso DIARIO → CLARIDAD · se ve UNA vez y marca → MOMENTO · solo le falta piel de ui → MECÁNICA.

| Ruta | Actor | Rediseño | Triage |
|---|---|---|---|
| `(tabs)/index` (HOY) | titular/equipo | **✅ S80** | CLARIDAD |
| `(tabs)/mascotas` | titular/equipo | pre-S80 | CLARIDAD |
| `(tabs)/negocio` | titular/gestor | pre-S80 (+composición S81-C) | CLARIDAD |
| `(tabs)/cuenta/index` | titular/empleado | parcial | **MOMENTO** (la firma del negocio) |
| `(tabs)/cuenta/perfil` | titular/empleado | pre-S80 | CLARIDAD |
| `(tabs)/cuenta/preferencias` | titular/empleado | pre-S80 | MECÁNICA (stub "Pronto") |
| `registro` | persona sin cuenta | parcial | CLARIDAD |
| `login` | todos | parcial | CLARIDAD |
| `solicitar-acceso` | aspirante | pre-S80 (+composición S81-C) | **MOMENTO** (primera impresión) |
| `invitacion` | empleado entrante | pre-S80 | **MOMENTO** (Día 1 del empleado, la firma del negocio preside) |
| `sala-espera` | aceptado sin activar | parcial | **MOMENTO** (Día 1 — la espera marca) |
| `bienvenida-dia1` | prestador nuevo | pre-S80 | **MOMENTO** (Día 1 — la carta) |
| `cita/[citaId]/index` | paseador | parcial | CLARIDAD |
| `cita/[citaId]/durante` | paseador | parcial | **MOMENTO** (el durante) |
| `cita/[citaId]/cierre` | paseador | parcial | **MOMENTO** (el cierre) |
| `paseo/index` | titular paseador | pre-S80 | CLARIDAD |
| `paseo/taller` | titular/gestor | pre-S80 | CLARIDAD |
| `grooming/index` | titular groomer | pre-S80 | CLARIDAD |
| `grooming/dia` | groomer | pre-S80 | CLARIDAD |
| `grooming/taller` | titular/gestor | pre-S80 | CLARIDAD |
| `grooming/cita/[citaId]/index` | groomer | parcial | CLARIDAD |
| `grooming/cita/[citaId]/durante` | groomer | pre-S80 | **MOMENTO** (el durante de la silla) |
| `grooming/cita/[citaId]/cierre` | groomer | pre-S80 | **MOMENTO** (el cierre — el parte que ve la familia) |
| `adiestramiento/index` | titular adiestrador | pre-S80 | CLARIDAD |
| `adiestramiento/taller` | titular/gestor | pre-S80 | CLARIDAD |
| `adiestramiento/antes/[mascotaId]` | adiestrador | pre-S80 | CLARIDAD |
| `adiestramiento/cita/[citaId]/index` | adiestrador | parcial | CLARIDAD |
| `adiestramiento/cita/[citaId]/durante` | adiestrador | pre-S80 | **MOMENTO** (el durante) |
| `adiestramiento/cita/[citaId]/cierre` | adiestrador | pre-S80 | **MOMENTO** (el cierre) |
| `adiestramiento/clips` | adiestrador | pre-S80 | CLARIDAD |
| `veterinaria/index` | titular vet | pre-S80 | CLARIDAD |
| `veterinaria/taller` | titular/gestor | pre-S80 | CLARIDAD |
| `veterinaria/cita/[citaId]` | vet | pre-S80 | CLARIDAD |
| `veterinaria/consulta/[citaId]` | vet (chip clínico) | pre-S80 | **MOMENTO** (el durante clínico — el dictado) |
| `veterinaria/coordinar/[citaId]` | vet/recepción | pre-S80 | CLARIDAD |
| `veterinaria/mostrador/index` | recepción/equipo | pre-S80 | CLARIDAD |
| `veterinaria/mostrador/atencion` | recepción/equipo | pre-S80 | CLARIDAD |
| `veterinaria/mostrador/autorizar` | recepción | pre-S80 | CLARIDAD |
| `veterinaria/mostrador/nueva` | recepción | pre-S80 | CLARIDAD |
| `veterinaria/movimiento` | titular vet | pre-S80 | CLARIDAD |
| `veterinaria/presupuesto/nuevo` | vet | pre-S80 | CLARIDAD |
| `veterinaria/procedimientos` | titular vet | pre-S80 | CLARIDAD |
| `veterinaria/verificacion` | titular vet | pre-S80 | CLARIDAD |
| `mascota/[mascotaId]` | equipo | pre-S80 | CLARIDAD |
| `negocio/equipo` | titular | pre-S80 | CLARIDAD |
| `cuenta-comercial/index` | titular | pre-S80 | CLARIDAD |
| `cuenta-comercial/nueva` | titular | pre-S80 | CLARIDAD |
| `cuenta-comercial/bancarios` | titular | pre-S80 | CLARIDAD |
| `liquidaciones` | titular | pre-S80 | CLARIDAD |
| `vacaciones` | titular/empleado | pre-S80 | CLARIDAD |

**Conteo: MOMENTO 12 · CLARIDAD 37 · MECÁNICA 1.**
**Las 9 parciales del prestador (C3), por grupo:** MOMENTO = `cuenta/index` · `sala-espera` · `cita/durante` · `cita/cierre` (4) — CLARIDAD = `registro` · `login` · `cita/index` · `grooming/cita/index` · `adiestramiento/cita/index` (5) — MECÁNICA = ninguna. *(Las otras parciales de C3 son del cliente y quedan fuera de las 50.)*
