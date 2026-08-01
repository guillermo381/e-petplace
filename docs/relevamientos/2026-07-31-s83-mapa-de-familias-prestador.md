# S83-A15 — EL MAPA DE FAMILIAS DEL PRESTADOR

> **La pregunta que contesta:** *54 pantallas es el número que asusta; el número
> que importa es cuántas FAMILIAS hay.* Si son cinco o seis, el rediseño es
> **firmar cinco arquetipos y multiplicar**.
>
> **Método declarado (candidata #16: se dice por qué se buscó así).** No clasifiqué
> por ruta ni por tamaño: **por SEÑAL ESTRUCTURAL medida archivo por archivo** —
> presencia y conteo de `Campo` · `SliderPrecio` · `Interruptor` · `SelectorOpcion`
> · `CeldaNavegacion` · `EstadoVacio` · `.map(` · ejes de filtro · `useState` ·
> llamadas a wrapper · `Hoja` · `Tarjeta` · `<Entrada>` · `TarjetaEstado`. Las 54
> son `find apps/prestador/src/app -name "*.tsx" ! -name "_layout.tsx"` sobre el
> árbol vivo — el mismo número que R0 midió y que C3 declara.

---

## EL TITULAR

**Son NUEVE familias, pero CINCO cubren 42 de 54 (78%), y TRES cubren 33 (61%).**

| # | familia | n | % |
|---|---|---|---|
| **F3** | **EL CICLO DE LA ATENCIÓN** (antes · durante · cierre) | **12** | 22% |
| **F5** | **CAPTURA** (formulario) | **12** | 22% |
| **F4** | **LISTA CON EJES** | **9** | 17% |
| **F1** | **EL TALLER** (configurar el oficio) | **5** | 9% |
| **F2** | **PORTADA DE OFICIO** | **4** | 7% |
| F7 | PUERTA / MOMENTO | 4 | 7% |
| F8 | ESTADO VACÍO PURO (peldaño 0) | 4 | 7% |
| F6 | MENÚ DE NAVEGACIÓN | 3 | 6% |
| F9 | FICHA DE ENTIDAD | 1 | 2% |

**La lectura para el founder: el rediseño del prestador NO son 54 decisiones. Son
CINCO arquetipos que se firman una vez y se multiplican, más cuatro colas cortas.**

---

## LAS FAMILIAS, con su evidencia

### F1 · EL TALLER — configurar el oficio · **5**
`paseo/taller` (905) · `grooming/taller` (874) · `adiestramiento/taller` (936) ·
`veterinaria/taller` (862) · `veterinaria/procedimientos` (346)

**Señal que las une:** son las **únicas** con `SliderPrecio` (2-5 c/u) +
`Interruptor` (1-5) + `SelectorOpcion` (2-5) juntos, `useState` 18-25 y 4-7
llamadas a wrapper. **Y son las cuatro más grandes del prestador** (862-936
líneas, ±8% entre sí — una regularidad que no puede ser casualidad: son la misma
pantalla cuatro veces).

**Ya tienen arquetipo firmado:** §15b.5(a) *"El arte de…"* con su wizard de
secciones. **Es la familia mejor definida de la app y la que menos falta le hace
un arquetipo nuevo** — le falta que el arquetipo se aplique.

### F2 · PORTADA DE OFICIO — **4**
`paseo/index` (332) · `grooming/index` (353) · `adiestramiento/index` (290) ·
`veterinaria/index` (346)

**Señal:** `CeldaNavegacion` 4-6 · `EstadoVacio` 3 · `Boton` 3-4 · `useState` 3 ·
**exactamente 1 llamada a wrapper** · cero `Campo`. **Las cuatro caben en 290-353
líneas.** Son cuatro copias de una sola pantalla: *estado de tu oferta + puertas*.

**Su letra ya existe:** §15b.5(b), el resumen **una fila por servicio activado**.

### F3 · EL CICLO DE LA ATENCIÓN — **12** *(la familia más grande)*
- **Antes (5):** `cita/index` (317) · `adiestramiento/cita/index` (302) ·
  `grooming/cita/index` (452) · `veterinaria/cita/[citaId]` (401) ·
  `adiestramiento/antes/[mascotaId]` (295)
- **Durante (4):** `cita/durante` (691) · `adiestramiento/durante` (530) ·
  `grooming/durante` (591) · `veterinaria/consulta` (784)
- **Cierre (3):** `cita/cierre` (371) · `adiestramiento/cierre` (353) ·
  `grooming/cierre` (592)

**Señal:** referencias a cita/atención altísimas (6-38), `useState` que **escala
con la fase** (Antes 4-7 · Durante 12-27 · Cierre 5-13) y `SelectorOpcion` como
chips de registro **solo en el Durante**.

**El hallazgo de este mapa: no son tres familias, es UNA con tres momentos** — y
los tres momentos ya están nombrados en la casa desde S26 (*Antes · Durante ·
Después*). **Firmar el ciclo una vez resuelve 12 pantallas, el 22% de la app.**
*Nota: `veterinaria/consulta` (784) es el Durante más pesado — el dictado clínico
— y `adiestramiento/antes/[mascotaId]` es un Antes que no cuelga de una cita.*

### F4 · LISTA CON EJES — **9**
`(tabs)/index` **HOY** (1311) · `negocio/equipo` (884) · `clips` (397) ·
`liquidaciones` (313) · `vacaciones` (321) · `mostrador/index` (215) ·
`grooming/dia` (207) · `mascotas` (144) · `veterinaria/movimiento` (131)

**Señal:** `.map(` alto sin `Campo` dominante; `EstadoVacio` 2-4 (la lista vacía
es estado de primera clase).

**Lo que el mapa destapa: el rango es de 131 a 1311 líneas — un factor DIEZ dentro
de la misma anatomía.** El HOY tiene 18 marcas de filtro y 21 `.map(`: **es la
única con ejes de verdad**; las otras ocho son listas simples que **hoy no tienen
ejes y probablemente los necesiten**. El arquetipo se firma sobre el HOY y **baja**
a las otras ocho, no al revés.

### F5 · CAPTURA (formulario) — **12**
`cuenta/perfil` (440, `Campo` ×10) · `perfil-v2` (396, ×5) ·
`veterinaria/mostrador/nueva` (260, ×4) · `cuenta-comercial/nueva` (316, ×3) ·
`cuenta-comercial/bancarios` (294, ×3) · `registro` (138, ×3) ·
`veterinaria/presupuesto/nuevo` (273, ×2) · `login` (114, ×2) ·
`veterinaria/verificacion` (353) · `veterinaria/coordinar` (269, `SelectorOpcion`
×9) · `veterinaria/mostrador/autorizar` (363) · `cuenta/preferencias` (86)

**Señal:** `Campo` ≥2 **o** captura por selección pura (`coordinar`: 9
`SelectorOpcion` y cero `Campo` — **es captura sin teclado, que es justo lo que
§15b.4 manda**), `useState` 6-17, sin lista.

**Empatada con F3 como la familia más grande, y es la que más dispersión de craft
tiene** — de `login` (114) a `cuenta/perfil` (440). **Es la que más rinde por
arquetipo firmado.**

### F6 · MENÚ DE NAVEGACIÓN — **3**
`(tabs)/negocio` (422, `CeldaNavegacion` ×9, `router.push` ×8, **cero wrapper**) ·
`(tabs)/cuenta/index` (661) · `cuenta-comercial/index` (210)

**Señal:** `CeldaNavegacion` dominante, captura nula. **Negocio no lee datos: solo
enruta.** Es la familia que la firma del **tercer verbo** (§15b.0, S83) acaba de
tocar directo — el seccionado de Cuenta es trabajo de esta familia.

### F7 · PUERTA / MOMENTO — **4**
`bienvenida-dia1` (213) · `sala-espera` (241) · `invitacion` (218) ·
`solicitar-acceso` (80)

**Señal:** `<Entrada>` presente (2 c/u), `useState` 2-5, cero lista, cero
configuración. **Se ven UNA vez y marcan** — es exactamente el triage MOMENTO de
C4. **Ya son las mejor tratadas de la app** (S81-C las trabajó con su carta y su
membrete).

### F8 · ESTADO VACÍO PURO (peldaño 0) — **4**
`negocio/casos-heredados` (29) · `negocio/estadisticas` (27) · `negocio/resenas`
(26) · `(tabs)/gallery` (7)

**Señal inequívoca:** 26-29 líneas, `EstadoVacio` ×2, **cero `useState`, cero
`Boton`, cero wrapper**. No son pantallas a medio hacer: **son promesas honestas**.
*(`gallery` son 7 líneas de re-export: herramienta, no superficie — L-161.)*

**El hallazgo (4) de C16 aplica acá:** las tres de `negocio/` están juntas **por
madurez, no por familia de uso** — y eso mezcla cosas sin relación entre sí.

### F9 · FICHA DE ENTIDAD — **1**
`mascota/[mascotaId]` (303)

**Única de su clase en el prestador**, y su gemela del cliente ya está rediseñada.
**No necesita arquetipo propio: necesita mirar al del cliente.**

---

## EL BURN-DOWN REAL — cuántas tienen el patrón nuevo

**7 de 54 (13%) montan al menos una pieza del patrón S82/S83.** Medido por
consumo real, no por commit:

| pieza | pantallas del prestador |
|---|---|
| `<Entrada>` | **6** — `login` · `registro` · `invitacion` · `sala-espera` · `solicitar-acceso` · (`adiestramiento/antes`) |
| `TarjetaEstado` | **1** — `negocio/equipo` |
| `FilaCita` | **1** — `(tabs)/index` (HOY) |
| `SelectorSegmentado` | 3 |
| `PieReserva` · `MarcaEleccion` · `CantoMarca` · `sinCaja` | **0** |

**Las 7 con pieza nueva:** `(tabs)/index` · `negocio/equipo` · `login` ·
`registro` · `invitacion` · `sala-espera` · `solicitar-acceso`.

### La lectura del burn-down, que es más útil que el 13%

**Las 6 de `<Entrada>` son 5 de las 4+ de F7 (puertas) más `registro`.** O sea:
**el patrón nuevo entró casi entero por UNA familia** — la de las puertas, que es
la que S81-C trabajó. **No está repartido: está concentrado.**

**Y las familias grandes están en cero o casi:** F3 (el ciclo, 12) tiene **0** ·
F5 (captura, 12) tiene **1** (`registro`) · F1 (talleres, 5) tiene **0** · F2
(portadas, 4) tiene **0**. **El 78% de la app —las cinco familias grandes— no
tocó el patrón nuevo salvo una pantalla.**

**Eso es una buena noticia disfrazada de mala:** significa que **no hay que
deshacer nada**. Las cinco familias grandes están **uniformemente pre-S82**, así
que un arquetipo firmado baja limpio sobre las 12, las 12, las 9, las 5 y las 4 —
sin el trabajo de reconciliar pantallas a medio migrar, que es lo caro.

---

## LO QUE ESTE MAPA NO DICE

- **No mide CALIDAD, mide ANATOMÍA.** Que 12 pantallas sean de la misma familia no
  dice que las 12 estén bien ni mal — dice que **una decisión de composición las
  alcanza a las 12**.
- **No reemplaza el eje COMPOSICIÓN de la regla 81.** Sigue sin existir la tabla
  por pantalla de dos ejes (declarado en R0 §3, y sigue vigente).
- **Las fronteras de F5 son las más discutibles**, y lo digo antes de que alguien
  lo descubra: `coordinar` (captura por selección), `autorizar` (decisión con
  captura) y `verificacion` (subida de archivos) entraron ahí por *captura*, pero
  **cada una podría defender familia propia**. Si el arquetipo de captura no las
  cubre bien, **se parten — y eso no invalida el mapa, lo afina.**

---

*Origen: S83-A15. Señales medidas sobre el árbol vivo en `1f9a53c`+; el conteo de
54 coincide con R0 y con el inventario C3.*
