# S88-B · RELEVAMIENTO — primitivas para LA CAMPANA (aviso in-app)

> **HALLAZGOS, NUNCA VEREDICTOS.** Mi mitad es la PIEZA, no la pantalla:
> qué tiene `packages/ui` para el punto/contador sobre un ícono y para la
> fila de aviso leído/no-leído, y qué faltaría. **RELEVAMIENTO, no
> construcción** — la mesa dibuja la lámina con este dato y el founder
> firma. Medido el 5-ago-2026 contra `packages/ui/src` en `pista/s87-b`.

---

## 0 · LA LETRA QUE YA RIGE, leída en su archivo

- **`MODELO_NOTIFICACIONES` §4 — LA LEY DE LA PANTALLA BLOQUEADA** rige
  sobre cualquier campana: el aviso in-app no interrumpe.
- **D-445 (angosta desde S73): el CENTRO de lectura** es la superficie
  pendiente — la campana es su puerta.
- **DIRECCION_ARTE §2.6**: en tabs, la huella ES el estado activo. La
  novedad es OTRO eje (ver hallazgo #2 — la casa ya los separó una vez).

## 1 · EL INVENTARIO — qué existe HOY, medido

| pieza | qué tiene | estado |
|---|---|---|
| **`BarraTabs.badge`** | **YA EXISTE el contador sobre ícono** — `badge?: number` por item: `Insignia estado="atencion" tamaño="sm"` posicionada `absolute top:-6 right:-14` sobre el glifo, **con a11y integrada** (`"{etiqueta}, {n} pendientes"`) | **construido S43, consumidores HOY: CERO** (ninguna pantalla pasa `badge`) |
| **`Insignia soloPunto`** | el punto de 10px sin texto (familia capa) — el «hay algo» sin número | vivo, con consumidores |
| **`Insignia estado`** | píldora con texto/número por estado semántico (`atencion` = el del badge) | vivo |
| **el DESTELLO** (`Icono nombre="ia"`) | **NO es de novedad**: es LA MARCA de la IA (trío de chispas de Kaxo, §5.1) — el «punto de novedad» del techo S53 era el LUGAR del Coach, no una primitiva de aviso | no confundir |
| **`Encabezado.accionDer`** | slot `ReactNode` en navegación Y portada — **la campana tiene DONDE vivir sin tocar `Encabezado`** | vivo |
| **glifo `campana`** | **NO EXISTE en el registry b′** (`IconoNombre` no tiene `campana`/`aviso`/`notificacion`). La campana S43 del Encabezado era pre-b′ y **hoy no vive en ninguna app** (grep: solo una mención en un comentario del dictado) | **falta — gate POR ÍCONO** (DIRECCION_ARTE §6b: hoja de contacto, 2-3 variantes, 21px) |
| **`Celda`** | fila con `inicio` (slot) · titulo · subtitulo · `metadataMono` (la hora del aviso) · pressed | vivo — **pero sin eje leído/no-leído** (ver #3) |
| **`CeldaNavegacion`** | si el aviso NAVEGA a su destino (los lectores de «Pide tu ojo» devuelven DESTINO — brief S87 §4) | vivo |
| **`PieRevelar`** | «Ver {{n}} más» al pie de la sección de avisos | vivo |
| **`EstadoVacio registro="seccion"`** | el centro sin avisos, sereno | vivo |

## 2 · HALLAZGO — la casa YA separó «estado» de «novedad» una vez, y el molde sirve

`BarraTabs` tiene **dos ejes que no se pisan**: la **huella** dice cuál
tab estás pisando (`estadoPorHuella`, §2.6) y el **`badge`** dice cuántas
cosas te esperan — construidos juntos en S43, sin conflicto de anatomía.
**La campana del Encabezado es el mismo par un piso arriba**: el glifo
(que falta) + el mismo contador encima. La anatomía del badge de
`BarraTabs` (Insignia `atencion` sm, absolute sobre el glifo, a11y con
el número EN el label) **es el molde ya firmado de la casa** — no hay
que inventar la geometría, hay que decidir si se EXTRAE.

## 3 · LO QUE FALTA, con su tamaño medido

1. **El glifo `campana` del set b′** — entrada nueva del registry
   (`Icono`), con su ley: objeto en trazo 1.9 + huella en el hex de su
   capa… **¿o SIN huella, como control?** El precedente vivo: el
   comentario del dictado llama a la campana *«glifo de CONTROL, como la
   S43»* — y la categoría «glifo de control» tiene **gate pendiente
   desde S78** (§6bis de DIRECCION_ARTE, PENDIENTE). **Es decisión de
   founder POR ÍCONO, no de esta pieza.**
2. **El punto/contador REUTILIZABLE sobre un ícono suelto** — hoy la
   anatomía vive INLINE en `BarraTabs` (8 líneas). Para la campana del
   `accionDer` hay dos caminos honestos que la lámina decide:
   **(a) componer inline otra vez** (8 líneas duplicadas — nace la
   segunda copia, y lo que se copia diverge, 19.9) ·
   **(b) extraer la anatomía** (`ConBadge`/prop en `Icono`) y que
   `BarraTabs` la consuma — la mecánica D-546 ya pidió que `Icono`
   exponga más de su contrato. **Dato para esa decisión: consumidores
   hoy = BarraTabs (0 usos vivos del badge) + la campana = 2.**
3. **El eje leído/no-leído de la fila** — `Celda` no lo tiene y **no hay
   precedente en la casa** (nada renderiza «no leído» hoy). Las piezas
   componen: `inicio={<Insignia soloPunto/>}` como marca de no-leído +
   `metadataMono` la hora. **Lo que NO se puede hoy sin ensanche: bajar
   el peso/color del título de una leída** — `Celda.titulo` es string
   con estilo fijo (primary/medium). Caminos: prop `leida` en Celda ·
   o el no-leído se dice SOLO con el punto (cero ensanche — y es la
   forma más Chanel: un eje, una marca, precedente E6 «la huella marca
   por PRESENCIA»). **La lámina decide; el dato es que la vía
   cero-ensanche existe.**
4. **La voz** — keys nuevas (título del centro, vacío, «hace X»). Es
   letra de lámina; el formateo de hora ya existe (`fechaCortaMono` del
   riel).

## 4 · LO QUE ESTE RELEVAMIENTO NO MIDIÓ, declarado

- **El MOTOR**: qué tabla alimenta el centro (las capas 1-3 de
  `MODELO_NOTIFICACIONES` son territorio de A; `notificaciones` existe
  en la DB — no medí su shape ni sus lectores).
- **La pantalla**: dónde vive el centro (¿stack de Cuenta? ¿Hoja desde
  el Encabezado?) — composición, de la lámina.
- **Píxeles**: nada de esto se vio en pantalla (L-143).
