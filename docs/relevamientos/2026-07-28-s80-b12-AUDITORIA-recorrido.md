# S80-B12 · AUDITORÍA COMPLETA — recorrido Día 1 + HOY + la cita

> PARTE 1 del mandato B12. Todo MEDIDO (código, DB, tipos instalados,
> curl); lo que exige dispositivo queda columna del founder. Las curas
> de la Parte 2 se ejecutan DESPUÉS de este censo, en la misma tanda.

## A · AUDITORÍA LEY POR LEY (solo hallazgos — lo que cumple no se lista)

**Pantallas auditadas (12):** bienvenida · login · registro ·
solicitar-acceso · invitacion · sala-espera · bienvenida-dia1 · HOY
(+FiltroOficio +PreparaEspacio +AgendaRecepcion) · cita/[citaId] paseo ·
grooming · adiestramiento · veterinaria.

| Ley | Hallazgo | Dónde | Veredicto |
|---|---|---|---|
| §2 Ley 6 | **El filtro de oficio marca el activo con RECUADRO** (superficie apoyada + elevación, gramática SelectorSegmentado) — la huella no aparece/desaparece; el inactivo (`registro='tinta'`) CONSERVA su huella en tinta | `filtro-oficio.tsx:54-55,121` | **VIOLACIÓN — cura 4** (el caso que el founder señaló) |
| §2 Ley 9 | El glifo del filtro va a **18px** — bajo el gate de 21px (§2.9); en FilaCita va a 21 ✓, PreparaEspacio 24 ✓ | `filtro-oficio.tsx:121` | **VIOLACIÓN — se paga dentro de la cura 4** |
| §3 pre-b′ | Cero emoji, cero librería externa. Svg inline vivos: chevron de PreparaEspacio (affordance, no glifo) · `iconos-tabs`/`iconos-oficio`/`ControlEstado` (composiciones locales D-546, declaradas) · `dictado-en-vivo` | censo `react-native-svg` | Sin violación; **D-546 sigue creciendo** (la prop trazo/huella de `Icono` es de A) |
| Ley 13 | **`sala-espera` en 'cargando' dibuja un View VACÍO** — cero esqueleto (3 lecturas de red delante) | `sala-espera.tsx:112-114` | **VIOLACIÓN — cura 5** |
| Ley 13 | `bienvenida-dia1` no tiene estado de carga: pinta el texto al toque y el saludo con nombre llega después (Promise.all de 2) | `bienvenida-dia1.tsx:53` | Menor — salto de saludo; se declara, no se cura en esta tanda |
| Ley 13 | Los 4 detalles de cita SÍ tienen EsqueletoGrupo en 'cargando' (estado inicial) — **la "pantalla vacía" del founder es consistente con sala-espera y/o con el esqueleto percibido como vacío durante ~4s**; el número real está en C | 4 detalles | Cumple en código; el tiempo es el problema (C) |
| Ley 20 | Cero `borderWidth` artesanal en app/; Tarjeta gobierna hairline-vs-elevación por sistema | censo | ✓ |
| §7 | El canto (post-992a078): color completo, sin borde; el "sin sombra" no aplica (tira, no superficie) | HOY | ✓ con piso 33% |
| §8.2 | Cero `palette.pink`/magenta crudo en el prestador; accent.active solo vía BarraTabs (plataforma) | censo | ✓ |
| §8.4/8.5 | La pill "Prestador fundador" HOY es sobria (bg.overlay, sin rampa ni brillo) — el vidrio/brillo de PORTAL §2.2 NO está construido; cuando se construya rige 8.4 (turquesa→magenta) y D-572 (contraste en el frame más claro) | `firma-prestador.tsx` | Pendiente de construcción, no violación |
| §9.1/9.2 | Canto: piso de alfa 33% ✓ (992a078) · **AL RAS verificado por cadena**: Tarjeta `relleno="ninguno"` (sin padding) → View key (sin padding) → wrapper → `left:0`, y la Tarjeta recorta esquinas (`overflow:'hidden'`, Tarjeta.tsx:103). El síntoma "se pierde del contorno" era ENTERO del alfa a cero | HOY | ✓ tras cura 1; nada que mover |
| §9.3 | Con boceto de estado real: registro (M1 s80b) · prepara-espacio (M1 s79b) · canto (M2 s80-b8) · agenda-recepcion (lámina s78b). SIN boceto (pre-ley): filtro-oficio · sala-espera · bienvenida-dia1 · los 4 detalles | stock | Ley nueva vs stock viejo — se paga al tocarse (D-318 mecánica); el filtro lo paga HOY (cura 4 con boceto abajo) |
| §9.4 | Tapar el texto: HOY con canto = capa legible + glifo + avatar ✓ · detalles = avatar+insignia (parcial: el oficio no se ve sin leer — aceptado: pantalla mono-cita) · sala-espera = checks ✓ · formularios n/a | — | Sin cura ordenada |

## B · LOS DOS NÚMEROS POR PANTALLA

RT baseline MEDIDO (curl al proyecto, REST trivial): **frío 1.23s ·
caliente 215–260ms** desde desktop; en dispositivo móvil el RTT sube
(~1.5–2×). "Tiempo hasta pintar" en dispositivo = columna del founder
(cronómetro); acá va la ARITMÉTICA medida en código:

| Pantalla | Llamadas al montar | Forma | Est. (caliente, desktop) |
|---|---|---|---|
| bienvenida / login / registro / solicitar | 0 | — | inmediata |
| invitacion | 1 (`obtenerInvitacionPendiente`) | — | ~0.3s |
| sala-espera | 1 + 2 en paralelo (`miPrestador` → cuenta ∥ docs) — miPrestador esconde getUser(red)+1-3 queries | 2 ondas | ~0.8–1.2s **sin esqueleto** |
| bienvenida-dia1 | 2 en paralelo | 1 onda | ~0.3s |
| HOY | 12 en paralelo + `miEmpleadoId`→(titular ∥ chips) + rol + franjas + equipo secuenciales (D-497/D-555 declaradas) | ~5 ondas | ~1.2–1.6s |
| cita paseo | verificar(local) → paseoPorCita → citaPorId → foto(cache TTL 1ª vez) | **3-4 SECUENCIALES** | ~0.7–1.0s |
| cita grooming | groomingPorCita → citaPorId → ficha → foto | **4-5 SECUENCIALES** | ~1.0–1.3s |
| cita adiestramiento | (cita ∥ atencion) → ficha → foto | 3 ondas | ~0.7–0.9s |
| cita veterinaria | **CORRECCIÓN de esta misma auditoría (el literal del cargar completo corrigió la primera lectura):** el BLOQUEO de pintura es solo citaVet → foto (2 RTs); puedeAtender/contacto/presupuestos son colas `void` POST-pintura — el patrón BUENO (Ley 13). Las colas igual pagan los RTs escondidos de miPrestador/cuenta (getUser de red), pero sin bloquear | 2 RTs bloqueantes + 3 colas | ~0.5s pintura; **el peor pintador era GROOMING (4-5 seq) y paseo (3-4 seq)** — en móvil con RTT ~300-400ms + frío de conexión (1.23s medido), los ~4s del founder caen ahí |

## C · LOS 4 SEGUNDOS — diagnóstico

1. **La causa dominante es DE PANTALLA: cadenas secuenciales.** El vet
   encadena 7 awaits y dos de ellos (miPrestador, cuenta) esconden
   `auth.getUser()` — que en supabase-js SIEMPRE va a la red — más la
   resolución titular→vínculo→fila. 10-12 RTs × ~300-400ms móviles ≈ 4s.
2. **¿El HOY ya tiene lo que el detalle re-pide? SÍ:** la fila ya trae
   id, fecha, hora, estado, duración, nombre del tipo, mascota
   (id/nombre/especie/foto_url) y hasta la URL FIRMADA de la foto. El
   detalle re-fetchea todo; solo la foto tiene caché (TTL por path ✓).
3. **¿Caché o prefetch? NO** — cada focus re-consulta todo (7.5 por
   diseño para el ESTADO; el resto viaja de nuevo sin necesidad).
4. **¿Sistémico? SÍ** — los 4 detalles comparten la forma; sala-espera y
   el propio HOY suman ondas secuenciales; D-497 (31 requests), D-531
   (header 1067ms) y D-555 (+3 viajes del rol) son la misma familia.
5. **La mitad que es de A (PARÁ Y REPORTÁ, cumplido):** `obtenerMiPrestador`
   resuelve titular→vínculo→fila con getUser de red EN CADA LLAMADA y sin
   caché de sesión de JS; 10 wrappers llaman `auth.getUser()` (censo);
   el "resolvedor de rol cacheado" ya está pedido en D-555. **Cortar esos
   RTs internos es cirugía de packages/api — territorio A.** La cura de
   pantalla (paralelizar ondas, abajo) es mía y baja el vet a ~2 ondas
   visibles; el piso restante lo pone el wrapper.

**Cura 6 (de pantalla, esta tanda):** paseo → `paseoPorCita ∥ citaPorId`
(2 ondas) · grooming → `(grooming ∥ cita)` → `(ficha ∥ foto)` (2 ondas) ·
adiestramiento → wave2 `ficha ∥ foto` (2 ondas) · vet →
`(citaVet ∥ miPrestador ∥ cuenta)` → `(foto ∥ puedoAtender ∥ presupuestos)`
(2 ondas). El costo de una llamada tirada en la rama redirect: 1 RT
barato contra 1-2 RTs secuenciales ahorrados siempre.

## D · CENSO DE COMPONENTES

**De packages/ui, por clase:**
- **LAYOUT (genéricos):** Boton · Tarjeta · Celda · CeldaNavegacion ·
  Campo · Separador · Texto · Esqueleto/Grupo · EstadoVacio · Hoja ·
  SelectorOpcion/Segmentado · Encabezado · PieRevelar · FilaDato.
- **DOMINIO (saben qué representan):** AvatarMascota · Icono/Huella ·
  LogoNegocio · CitaEnVivo · Insignia (semi) · Cronometro · ClipSesion ·
  FichaVacuna/FichaMascotaHogar/LineaDeVida (cliente) · VozComision.
- **Por pantalla (recorrido):** bienvenida = Boton+Isotipo (+Text crudo
  legado) · login/registro = Campo+Boton+Encabezado+Texto · invitacion =
  LogoNegocio+Boton+EstadoVacio+Esqueleto · sala-espera = Celda+
  CeldaNavegacion+Insignia+Tarjeta+Texto · dia1 = Texto+Boton · HOY =
  ~14 (Celda, Tarjeta, Icono, AvatarMascota, Insignia, CitaEnVivo,
  Esqueleto, Boton, Separador, PieRevelar…) · detalles = AvatarMascota+
  Encabezado+Esqueleto+EstadoVacio+Insignia+Tarjeta+Texto (+Text crudo).

**Craft atornillado LOCAL en la app (21 archivos en components/), los
que son CRAFT y no composición:** `canto-oficio` (el caso vivo — se
promueve en Parte 3) · `techo-oficio` (muro §15b.2) · `filtro-oficio`
(control de vistas con glifo — pedido de enmienda a SelectorSegmentado
registrado en su header) · `tarjeta-estado` (gramática está/espera S78,
promoción declarada D-535) · `gate-roto`/`pantalla-caida` (anatomías
L-178, promoción declarada) · `iconos-tabs`/`iconos-oficio`/
`ControlEstado` (D-546: el contrato de Icono no expone trazo/huella) ·
`firma-prestador` (composición §2.4) · `prepara-espacio` (anatomía 19.1
compuesta — el slot `fin` de CeldaNavegacion pedido a la mesa). **El
patrón: el craft nace local y la promoción se declara pero no se
ejecuta — FilaCita (Parte 3) es el primer molde que cruza.**

## E · CANDIDATOS PARA LA CAPA DEL ADIESTRAMIENTO (la firma es del founder)

**Tokens de capa vivos (light):** `capa.cuidado` = teal `#28E8DA`
(paseo, HOY training) · `capa.identidad` = verdeVital `#2BE86B` (vet) ·
`capa.comunidad` = pink `#FF00AF` · `capa.comunidadAmplia` = violet
`#9E3AFF` · ocre = `status.warning` `#E8B547` (grooming). Cada uno con
su par Dark AA (`capaText.*`). **La rampa del isotipo:** light
`[pinkVivo #DF00A1 → violet #9E3AFF → teal #28E8DA]`.

| Candidato | Hex | A favor | Colisión |
|---|---|---|---|
| **violet (`capa.comunidadAmplia`)** | `#9E3AFF` | token VIVO con par AA; está en la rampa; distinto de teal/verde/ocre en fila | semántica "comunidad amplia" (Explorar, cliente); `violetText` es el acento de CONTROL en dark — un canto violeta en dark roza esa lectura |
| pink (`capa.comunidad`) | `#FF00AF` | token vivo | **§8.2 DURA: el magenta tiene TRES trabajos y el canto de oficio no es ninguno — "el magenta MIENTE"**. Se lista para descartarse con letra |
| menta / amarillo de marca | — | — | **ILEGAL: solo-marca desde v4** (palette canonizada S43) |
| capa NUEVA (hex nuevo) | — | semántica limpia "adiestramiento" | pide token + par AA + WCAG + enmienda de DIRECCION_ARTE §2 — y CHOCA con D-573 (el vocabulario de capas ya tiene una colisión abierta) |

**Nota ligada:** D-573 (depositada) — "cuidado" nombra teal en el token
y ocre en §2; cualquier decisión acá debería resolver las dos de una.

## Bocetos M2 de la Parte 2 (píxeles nuevos)

**Cura 4 — FiltroOficio a Ley 6 (el M2):** MUERE el riel `bg.overlay` y
la superficie apoyada del activo (el recuadro). Queda una FILA de
segmentos target-44: cada oficio con su glifo (`IconoOficio`, trazo y
huella independientes — la pieza D-546 ya construida): **inactivo =
trazo tinta secundaria SIN huella · activo = LA HUELLA APARECE en el
tono AA de su capa + label en primaria**. "Todos" (sin glifo, no es
oficio): activo = primaria + peso medium; inactivo = secundaria. Glifos
a **21px** (paga la violación Ley 9). Press: scale 0.99 (receta de la
casa). A11y tablist/tab intactos. CHANEL: mueren el riel, la elevación
del segmento y el borderRadius interno — tres cajas menos en el techo
de la jornada. Estados: 1 oficio → el filtro no se monta (regla de
existencia, ya vigente por `conFiltro`).

**Parte 3 — FilaCita a packages/ui (mismos píxeles, cero nuevo):** nace
`FilaCita` DOMINIO en ui: recibe `{ oficio, titulo, subtitulo,
metadataMono, mascota{nombre,fotoUrl?,especie?}, fin?, onPress }` y
dibuja Celda + AvatarMascota + **su canto ADENTRO** (color del mapa
oficio→capa DENTRO del componente, piso 33% DENTRO, posición DENTRO —
**cero prop de color/hex/alfa/posición: ninguna pantalla puede
romper la ley**). `fin` es slot de DATOS (insignias/voz), no de craft.
Galería en 3 temas; cero par WCAG nuevo (tokens existentes). El local
`canto-oficio.tsx` MUERE (Ley 37) — su único consumidor migra.
