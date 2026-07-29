# S81-C3 — INVENTARIO DE PANTALLAS (burn-down del rediseño)

> Fuente: `find apps/*/src/app -name "*.tsx"` (29-jul-2026, HEAD `89d44fd`+) — no de memoria. Los 8 `_layout.tsx` quedan fuera (no son pantallas). Estado: **✅ S80/S81** = rediseñada bajo §8-§9/Ley 10 · **parcial** = curas puntuales S80/S81 (con cuál) · **pre-S80** = sin pasada. "1ª sem" = ¿la ve un prestador en su primera semana?

| App | Ruta | Actor | Rediseño | 1ª sem |
|---|---|---|---|---|
| prestador | `(tabs)/index` (HOY) | titular/equipo (por rol) | **✅ S80** (FilaCita · canto Ley 10 · 4 listas · línea viajera) | sí |
| prestador | `(tabs)/mascotas` | titular/equipo | pre-S80 | sí |
| prestador | `(tabs)/negocio` | titular/gestor | pre-S80 | sí |
| prestador | `(tabs)/cuenta/index` | titular/empleado | parcial (pie identidad L-160, S81-B2) | sí |
| prestador | `(tabs)/cuenta/perfil` | titular/empleado | pre-S80 | sí |
| prestador | `(tabs)/cuenta/preferencias` | titular/empleado | pre-S80 | sí |
| prestador | `(tabs)/gallery` | dev (herramienta) | pre-S80 | no |
| prestador | `registro` | persona sin cuenta | parcial (nace S80-B1, port D-509① — sin pasada §8-§9) | sí |
| prestador | `login` | todos | parcial (entrada ghost S80-B1) | sí |
| prestador | `solicitar-acceso` | aspirante | pre-S80 | sí |
| prestador | `invitacion` | empleado entrante | pre-S80 | sí |
| prestador | `sala-espera` | aceptado sin activar | parcial (esqueleto Ley 13, S80-B12) | sí |
| prestador | `bienvenida-dia1` | prestador nuevo | pre-S80 (nace S79) | sí |
| prestador | `cita/[citaId]/index` | paseador | parcial (canto entró y SALIÓ §9.2 + transición, S80) | sí |
| prestador | `cita/[citaId]/durante` | paseador | parcial (guard mapa S80-B19 + track D-578, S81-B1) | sí |
| prestador | `cita/[citaId]/cierre` | paseador | parcial (guard mapa S80-B19) | sí |
| prestador | `paseo/index` | titular paseador | pre-S80 (PantallaCaida S79) | sí |
| prestador | `paseo/taller` | titular/gestor | pre-S80 | sí |
| prestador | `grooming/index` | titular groomer | pre-S80 (PantallaCaida S79) | sí |
| prestador | `grooming/dia` | groomer | pre-S80 | sí |
| prestador | `grooming/taller` | titular/gestor | pre-S80 | sí |
| prestador | `grooming/cita/[citaId]/index` | groomer | parcial (transición S80-B12) | sí |
| prestador | `grooming/cita/[citaId]/durante` | groomer | pre-S80 | sí |
| prestador | `grooming/cita/[citaId]/cierre` | groomer | pre-S80 | sí |
| prestador | `adiestramiento/index` | titular adiestrador | pre-S80 (PantallaCaida S79) | sí |
| prestador | `adiestramiento/taller` | titular/gestor | pre-S80 | sí |
| prestador | `adiestramiento/antes/[mascotaId]` | adiestrador | pre-S80 | sí |
| prestador | `adiestramiento/cita/[citaId]/index` | adiestrador | parcial (transición S80-B12) | sí |
| prestador | `adiestramiento/cita/[citaId]/durante` | adiestrador | pre-S80 | sí |
| prestador | `adiestramiento/cita/[citaId]/cierre` | adiestrador | pre-S80 | sí |
| prestador | `adiestramiento/clips` | adiestrador | pre-S80 | sí |
| prestador | `veterinaria/index` | titular vet | pre-S80 (PantallaCaida S79) | sí |
| prestador | `veterinaria/taller` | titular/gestor | pre-S80 | sí |
| prestador | `veterinaria/cita/[citaId]` | vet | pre-S80 | sí |
| prestador | `veterinaria/consulta/[citaId]` | vet (chip clínico) | pre-S80 | sí |
| prestador | `veterinaria/coordinar/[citaId]` | vet/recepción | pre-S80 | sí |
| prestador | `veterinaria/mostrador/index` | recepción/equipo | pre-S80 | sí |
| prestador | `veterinaria/mostrador/atencion` | recepción/equipo | pre-S80 | sí |
| prestador | `veterinaria/mostrador/autorizar` | recepción | pre-S80 | sí |
| prestador | `veterinaria/mostrador/nueva` | recepción | pre-S80 | sí |
| prestador | `veterinaria/movimiento` | titular vet | pre-S80 | sí |
| prestador | `veterinaria/presupuesto/nuevo` | vet | pre-S80 | sí |
| prestador | `veterinaria/procedimientos` | titular vet | pre-S80 | sí |
| prestador | `veterinaria/verificacion` | titular vet | pre-S80 | sí |
| prestador | `mascota/[mascotaId]` | equipo | pre-S80 | sí |
| prestador | `negocio/equipo` | titular | pre-S80 | sí |
| prestador | `negocio/casos-heredados` | titular vet | pre-S80 | no |
| prestador | `negocio/estadisticas` | titular | pre-S80 | no |
| prestador | `negocio/resenas` | titular | pre-S80 | no |
| prestador | `cuenta-comercial/index` | titular | pre-S80 | sí |
| prestador | `cuenta-comercial/nueva` | titular | pre-S80 | sí |
| prestador | `cuenta-comercial/bancarios` | titular | pre-S80 | sí |
| prestador | `liquidaciones` | titular | pre-S80 | sí |
| prestador | `vacaciones` | titular/empleado | pre-S80 | sí |
| cliente | `index` (raíz/routing) | familia | pre-S80 | no |
| cliente | `bienvenida` | familia | pre-S80 | no |
| cliente | `login` | familia | pre-S80 | no |
| cliente | `registro` | familia | pre-S80 | no |
| cliente | `onboarding/mascota` | familia | pre-S80 | no |
| cliente | `onboarding/fecha` | familia | pre-S80 | no |
| cliente | `onboarding/foto` | familia | pre-S80 | no |
| cliente | `onboarding/cierre` | familia | pre-S80 | no |
| cliente | `(tabs)/hogar/index` | familia | pre-S80 | no |
| cliente | `(tabs)/hogar/mascota/[mascotaId]` | familia | pre-S80 | no |
| cliente | `(tabs)/hogar/paseos` | familia | pre-S80 | no |
| cliente | `(tabs)/hogar/grooming` | familia | pre-S80 | no |
| cliente | `(tabs)/hogar/adiestramiento` | familia | parcial (bitácora al eje 19.8, S81-C — gate pendiente) | no |
| cliente | `(tabs)/hogar/agregar/index` | familia | pre-S80 | no |
| cliente | `(tabs)/hogar/agregar/fecha` | familia | pre-S80 | no |
| cliente | `(tabs)/hogar/agregar/foto` | familia | pre-S80 | no |
| cliente | `(tabs)/hogar/agregar/cierre` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/index` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/paseo/index` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/paseo/disponibles` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/paseo/checkout` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/paseo/paquete` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/grooming/index` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/grooming/disponibles` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/grooming/checkout` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/adiestramiento/index` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/adiestramiento/disponibles` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/adiestramiento/confirmar-programa` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/adiestramiento/checkout` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/veterinaria/index` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/veterinaria/disponibles` | familia | pre-S80 | no |
| cliente | `(tabs)/explorar/veterinaria/checkout` | familia | pre-S80 | no |
| cliente | `(tabs)/cuenta/index` | familia | parcial (pie identidad L-160, S81-A3) | no |
| cliente | `(tabs)/cuenta/perfil` | familia | pre-S80 | no |
| cliente | `(tabs)/cuenta/familia` | familia | pre-S80 | no |
| cliente | `(tabs)/cuenta/preferencias` | familia | pre-S80 | no |
| cliente | `(tabs)/cuenta/pagos` | familia | pre-S80 | no |
| cliente | `(tabs)/cuenta/direccion` | familia | pre-S80 | no |
| cliente | `(tabs)/cuenta/ayuda` | familia | pre-S80 | no |
| cliente | `paseo/[atencionId]` (EN VIVO/recorrido) | familia | **S81-B EN CURSO** (mapa a sangre + banda, gate pendiente) | no |
| cliente | `parte/[eventoId]` | familia | pre-S80 | no |
| cliente | `adiestramiento/[citaId]` (parte) | familia | pre-S80 | no |
| cliente | `citas/[mascotaId]` | familia | pre-S80 | no |
| cliente | `carnet` | familia | pre-S80 | no |
| cliente | `autorizacion/[solicitudId]` | familia | pre-S80 | no |
| cliente | `adoptar` | familia | pre-S80 | no |
| cliente | `gallery` | dev (herramienta) | pre-S80 | no |
| cliente | `lamina-fusion` | dev (herramienta) | pre-S80 | no |

**Burn-down: 102 pantallas (54 prestador · 48 cliente) — ✅ rediseñadas 1 · en curso 1 · parciales 12 · pre-S80 88. Primera semana del prestador: 50 de 54 pantallas del prestador (todas salvo gallery, casos-heredados, estadisticas, resenas) — de esas 50, UNA está rediseñada.**
