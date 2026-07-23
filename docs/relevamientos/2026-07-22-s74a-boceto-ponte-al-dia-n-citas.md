# S74-A · BOCETO M1 — **PONTE AL DÍA** CON N CITAS ACTIVAS (superficie FIRMADA)

> **BOCETO. CERO código — la construcción va a S75 con su vara.** Letra:
> `DISEÑO_EXPERIENCIA` §10ter.1 (dictado founder S74). **Superficie firmada
> por mesa: PONTE AL DÍA** — donde el founder estaba parado al dictarla
> (ítem 4 de su cosecha, con las por-coordinar reales). Reemplaza al boceto
> de la ficha de mascota, congelado por NO-OP.
> Fuentes leídas: `hogar/index.tsx:700-720` (el render de la franja) ·
> `citasMascota.ts` (orden `nullsFirst` del lector) · `hogar.ts:186-215` ·
> el corolario §10ter.1.

## 0 · Tesis y estado actual

**TESIS:** *Ponte al día dice todo lo que espera tu decisión — y nada dos
veces.*

**HOY la franja muestra:** una fila por **cada** cita `por_coordinar` del
hogar (`porCoordinar.map`), más los otros habitantes de la zona
(autorización pendiente S70-A5, presupuesto por aprobar S69), con **tope 3 +
`PieRevelar`**. Cada fila: título con la mascota · detalle con el negocio ·
**"Ver su cita ›"** (`CeldaNavegacion` sin glifo, anatomía 19.7 firmada S73).

**Lo que la letra cambia:** hoy la franja **solo** trae `por_coordinar`; la
letra pide que **las citas activas se muestren** y que **las del mismo
servicio colapsen a la próxima**.

## 1 · LA RESOLUCIÓN DEL BORDE (el centro del problema)

**EL EJE DE PONTE AL DÍA NO ES EL TIEMPO — ES ACCIÓN vs INFORMACIÓN.**

Ese es el principio que ordena todo lo demás, y sale de la naturaleza de la
zona: Ponte al día es **la casa de lo que espera una decisión tuya** (por eso
su firma es **la desaparición**: hogar al día = sección ausente).

| | Qué es | ¿Colapsa por servicio? | Orden |
|---|---|---|---|
| **`por_coordinar`** (sin fecha) | **ACCIÓN pendiente** — cada una exige coordinar *esa* cita | **NO.** Colapsarlas **esconde trabajo pendiente**: dos procedimientos por coordinar son dos actos, no dos vistas de lo mismo | **PRESIDEN** (ya es el comportamiento del lector: `nullsFirst`) |
| **citas agendadas** (con fecha) | **INFORMACIÓN** — ya están resueltas, solo avisan | **SÍ** — es exactamente lo que la letra pide (un plan L-V de 22 paseos aporta UNA línea) | por **la próxima en el tiempo** |

**Por qué esta partición y no "todo por tiempo":** *"la próxima en el tiempo"*
no puede ordenar lo que no tiene tiempo — y forzar a las `por_coordinar` a un
orden temporal exigiría inventarles una fecha (verosímil-falso, L-139) o
mandarlas al fondo, que es donde menos deben estar. **Lo que espera acción va
primero por definición de la zona, no por fecha.**

**Corolario de composición:** dentro de cada bloque el orden es estable — las
`por_coordinar` entre sí por antigüedad de la solicitud (la que espera hace
más tiempo, primero); las agendadas por proximidad.

## 2 · La composición

```
PONTE AL DÍA
┌────────────────────────────────────────┐
│ Autorización pendiente        (existente, preside)
├────────────────────────────────────────┤
│ Presupuesto por aprobar       (existente)
├────────────────────────────────────────┤
│ Falta coordinar la cita de Thor        │  ← ACCIÓN · sin fecha
│ Clínica Aurora            Ver su cita ›│
├────────────────────────────────────────┤
│ Falta coordinar la cita de Zeus        │  ← otra ACCIÓN: NO colapsa
│ Clínica Aurora            Ver su cita ›│
├────────────────────────────────────────┤
│ Paseo de Thor · 14 ago 10:30           │  ← INFORMACIÓN · colapsada
│                           Ver su cita ›│     (los otros 21 del plan no se listan)
└────────────────────────────────────────┘
                 Ver 2 más
```

- **Tope 3 + `PieRevelar`** — **se conserva el de hoy** (la zona ya lo tiene;
  cambiar el tope no es parte de esta letra).
- **Lo colapsado NO se cuenta en el «+N»** (L-139: un número que promete
  filas que la superficie decidió no mostrar es verosímil-falso). El «+N» del
  pie cuenta **habitantes**, no citas escondidas por el colapso.
- **El nombre de cada cita** lo gobierna **§10ter** (voz del comprable; con
  `procedimiento`, la descripción del presupuesto — el dueño OMITE el nombre
  genérico, asimetría intacta).
- **La fila sigue siendo `CeldaNavegacion` sin glifo con "Ver su cita ›"**
  (19.7 firmada S73): **nada de esta letra toca la anatomía**.

## 3 · Estados declarados

- **0 habitantes:** la sección **NO se monta** (la firma es la desaparición —
  sin cambio).
- **Solo agendadas, cero acciones:** la zona **sí** se monta — pero es una
  decisión de producto que conviene declarar: *¿Ponte al día debe hablar
  cuando no hay nada que decidir?* **Propuesta del boceto: sí, con tope 1**
  (la próxima del hogar) — si no, la zona desaparecería justo cuando el dueño
  quiere confirmar que todo está en orden. **Al gate.**
- **1 cita:** sin `PieRevelar` (nada apagado).
- **Error de carga:** la zona **no se disfraza de vacío** (Ley 13) — hoy ya
  cumple.
- **Memorial:** sin citas activas por motor (`mascotasElegibles`) ⇒ estado 0.

## 4 · Contrato de datos M4

**Se renderiza:** mascota · voz del servicio (§10ter) · fecha+hora en mono
**solo si existe** · negocio (ya vive en la fila de `por_coordinar`).
**Se DESCARTA:** precio · `estado` crudo · `atencion_id` (el vivo es de otra
zona).
**PEDIDO DE MOTOR: NINGUNO.** `obtenerCitasActivasHogar` (S74-A, la cura
hogar-wide de D-497) **ya trae todas las activas del hogar con
`tipo_servicio`, fecha y `nullsFirst`** — hoy la pantalla filtra
`estado === 'por_coordinar'` y descarta el resto: **la letra se implementa
dejando de descartar**, más la agrupación en pantalla. *(Y el arranque no
gana un solo request: D-497 intacta.)*

## 5 · Pasada M5

19.6 `PieRevelar` con número ✓ · 19.7 anatomía de la fila intacta ✓ · Ley 3
(fechas en mono, voz del diccionario) ✓ · Ley 13 ✓ · regla de existencia ✓ ·
§10ter.1 (colapso y orden) ✓ · cero acento nuevo ✓ · sin campos de texto ⇒
L-162 no aplica ✓.

**Lo que este boceto eleva al gate:** *(a)* si la zona debe hablar cuando
**solo** hay agendadas (§3) · *(b)* el orden interno de las `por_coordinar`
entre sí (propuesta: la que espera hace más tiempo, primero).
