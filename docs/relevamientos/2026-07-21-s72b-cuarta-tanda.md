# S72-B · CUARTA TANDA — el shape de la pieza 3, el boceto de `atencion`, y el veredicto del presupuesto-sin-destino

> Territorio B (`apps/prestador` + este doc). La A está en ventana de motor
> (pieza 3, REVOKE, P5). Nada de esto toca `packages/api`/`ui`/`cliente`/DB.

---

## §1 · LA OTRA MITAD DE LA PIEZA 3 — el shape que necesito de la A

### Lo relevado (dónde vive hoy la etiqueta de tipo en la celda de agenda vet)

**La celda de agenda es `FilaCita`** — `apps/prestador/src/app/(tabs)/index.tsx:297`.
El subtítulo (la "etiqueta de tipo") sale de **`cita.tipo.nombre`**:

```
:340  subtitulo={
:341    cita.suscripcion_servicio_id !== null
:342      ? `${cita.tipo.nombre} · ${t('agenda.parteDelPlan')}`
:343      : cita.tipo.nombre
:344  }
```

El `metadataMono` de `FilaCita` es `hora · dur min` (`:353`) — **NO muestra
total.** El contrato «EL TOTAL, JAMÁS» ya se cumple en esta celda.

**El problema que la pieza 3 resuelve:** el commit `04a93b4` (A) estampa
`tipo_servicio = COALESCE(tipo_servicio, 'procedimiento')` al fijar la fecha.
Entonces un procedimiento todo-libre coordinado entra a la agenda vet con
`cita.tipo.nombre = "Procedimiento"` (el genérico). El vet ve **"Procedimiento"**
en vez de **"Ecografía"**. El lector que la A está construyendo trae la
**descripción del presupuesto** a esa fila.

### El shape que NECESITO (declarado — si el de la A difiere, FRENO)

`FilaCita` consume `CitaAgendaPaseo`, que es **el tipo compartido de los 4
oficios** — el propio commit de la A lo dice: *"rompe el tipo compartido
CitaAgendaPaseo, no nullable, de 4 oficios"*. Por eso el campo nuevo tiene que
ser **nullable/opcional** (null = los otros 3 oficios y las citas vet normales,
que siguen usando `cita.tipo.nombre` como hoy).

**Prefiero recibir los insumos crudos y resolver la regla 1/N/sin en la celda**
(la regla de render es mía, no del lector):

```ts
// sumar a CitaAgendaPaseo (o al tipo de la cita de agenda), OPCIONAL/nullable:
descripcionPresupuesto?: {
  primera: string | null;   // descripcion_libre del PRIMER item del presupuesto
                            //   (null si ese item no tiene descripción libre)
  extras: number;           // cuántos items MÁS allá del primero (0 si es 1 solo)
} | null
```

Con eso la celda resuelve el contrato de mesa:
- **`primera` no-null, `extras = 0`** → `primera` («Ecografía»)
- **`primera` no-null, `extras > 0`** → `primera` + `t('agenda.procMasN', {n: extras})` («Ecografía +2»)
- **`primera` null** (o el objeto entero null en una cita-procedimiento) →
  `t('agenda.procGenerico')` = **«Procedimiento»** (el genérico honesto, L-139)
- **el objeto null** en una cita NO-procedimiento → `cita.tipo.nombre` como hoy

**Alternativa aceptable** (si a la A le sale más barato desde el motor): que el
lector traiga el **array de items** (`{ descripcionLibre: string | null }[] | null`)
y yo derivo `primera`/`extras`. Cualquiera de las dos sirve; la regla 1/N/sin
la aplico yo.

**Lo que NO quiero recibir:** una etiqueta ya resuelta (`"Ecografía +2"`) — eso
mete la regla de UI en el lector, y el «+2» tendría que traducirse por idioma en
el riel, no en la DB. Ni el **total** (contrato: jamás en HOY).

### Dos strings nuevos que la celda va a necesitar (al lote cuando renderice)

| key | es | en |
|---|---|---|
| `agenda.procGenerico` | Procedimiento | Procedure |
| `agenda.procMasN` | {{base}} +{{n}} | {{base}} +{{n}} |

### El hallazgo que va CON el render — «Por coordinar» muestra el total

La OTRA celda de HOY que dibuja la descripción del presupuesto es **«Por
coordinar»** (`index.tsx:988-1027`), y **hoy SÍ muestra el total**:

```
:1004  metadataMono={`$${pc.totalCongelado.toFixed(2)}`}
```

Eso viola «EL TOTAL, JAMÁS» en HOY (superficie multi-actor; D-457 puso la plata
en NEGOCIO gateada por rol). **La cura es quitar ese `metadataMono`** — la celda
queda mascota + descripción + «Fijar fecha ›», que es suficiente; el precio
congelado se ve en la pantalla de **coordinar** (superficie dedicada, no la
agenda). El param `total` que se pasa a coordinar (`:998`) NO se toca.

> **Por qué no lo curé ya:** el punto 1 dice *"Cuando su commit esté, renderizás.
> Es la última cura de JS antes del gate."* Junto el render de `FilaCita` + el
> quitar-total de «Por coordinar» en **una sola cura de JS** cuando el lector de
> la A aterrice — ambas son "la celda que dibuja la descripción", y así el bundle
> del gate lleva la pieza 3 completa de una. Si el total fuera a quedar visible
> por mucho tiempo lo separaría; pero el gate espera a la A de todos modos.

### El protocolo de choque (declarado)

Cuando el commit de la A llegue: si el campo se llama distinto, o trae el total,
o mete la etiqueta ya resuelta con el «+N» hardcodeado → **FRENO y reporto el
choque**, no lo adapto en silencio (L-149).

---

## §2 · BOCETO M1 (chico) — `atencion.tsx`: la máquina de estados que falta

> El freno se venció (el founder movió el gate). Este boceto NO se construye —
> sale a M2 con los otros. Es M1 chico: la máquina de estados + los 5 estados.

### El problema (relevado)

`veterinaria/mostrador/atencion.tsx:77-101` es un **fetch suelto sin máquina de
estados**. `servicios: ServicioActivo[] | null`, y `null` significa **dos cosas
distintas**: "cargando" y "falló". Si `obtenerMiPrestador()` falla:

```
:80  const pr = await obtenerMiPrestador();
:81  if (!vigente || !pr.ok) return;   // ← sale en silencio: servicios queda null
```

Resultado: **la pantalla queda con el `Campo` precio + el botón gris, sin
esqueleto ni error** — parece colgada. Es el camino triste del paso 3 del gate.
Viola Ley 13 (el error se disfraza de botón muerto).

### Tesis · Firma · Chanel

- **TESIS** (heredada, ratificada): *"En dos toques la clínica registra lo que
  pasó — y queda en la agenda de hoy y en el expediente."*
- **FIRMA** (comportamiento): la cita aparece en el HOY al volver. **No cambia** —
  este boceto no toca el happy path, solo le da voz a los caminos que hoy callan.
- **CHANEL:** nada que quitar; lo que falta es agregar los estados ausentes.

### La máquina de estados propuesta (patrón de la casa — copiar-al-vecino)

Hoy la pantalla mezcla `prestadorId`, `servicios`, `fase` en useStates sueltos.
El boceto propone una discriminada, **espejo de `coordinar/[citaId].tsx`** (que
ya lo hace bien, `type Estado = cargando | error | listo`):

```
type Carga =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; prestadorId: string; servicios: ServicioActivo[] }
```

`fase`/`citaId`/`monto`/`medio` (la máquina de la atención→cobro) siguen como
están — esto solo envuelve **la carga**.

### Los 5 estados declarados

1. **CARGANDO** — `EsqueletoGrupo` estático (Ley 13, sin shimmer): una línea +
   un bloque de selector. Hoy: **no existe** (pantalla en blanco).
2. **ERROR** — `EstadoVacio registro="seccion"` + `Boton secundario` reintentar,
   con voz que dirige (17.4). Distingue "no cargó tu consultorio" de la red.
   Hoy: **no existe** (botón gris mudo).
3. **VACÍO** — el `EstadoVacio` de «sin servicios activos» YA existe (`:201-202`);
   se conserva. Es el vet que no activó servicios vet — su camino es ir al taller
   (candidato a sumarle un CTA, hoy solo tiene título — decisión de M2).
4. **PARCIAL** — no aplica (la pantalla no depende de RLS de otra entidad).
5. **MEMORIAL** — no aplica: no se registra una atención de mostrador sobre una
   mascota en memorial (la puerta de entrada — el mostrador — no la ofrece).

### Contrato de datos (M4)

Lo que ya consume (`obtenerMundoVeterinariaPropio` + `obtenerCatalogoVeterinaria`
+ `obtenerCatalogoVacunas`): sin cambios. El boceto **no pide datos nuevos** —
solo hace honesto el manejo de los tres fetches que hoy se tragan en silencio
(`:83-87`). Un fallo de CUALQUIERA de los tres pasa a `fase: 'error'`.

### Territorio

Cero componentes nuevos (todo existe: `EsqueletoGrupo`, `EstadoVacio`, `Boton`).
Es cableado de una máquina de estados con el patrón vivo del vecino. **No se
construye en esta tanda** — M2 lo audita con P2/P3.

---

## §3 · VEREDICTO — el presupuesto sin destino en el path del gate

### La pregunta

¿El vet necesita **abrir** el presupuesto aprobado para saber qué le aprobaron,
en el camino del gate (mostrador → presupuesto → aprobación → coordinar →
consulta)?

### La evidencia

**En la CONSULTA**, el presupuesto se muestra pobre —
`consulta/[citaId].tsx:482-485`:

```tsx
<Celda
  titulo={money(p.total)}                          // ← SOLO el total
  fin={<Insignia … etiqueta={t(`consulta.estadoPresupuesto.${p.estado}`)} />}  // ← + estado
/>
```

Es **$total + estado**, sin ítems ni descripción, sin `onPress`. En la consulta,
el vet NO ve *qué* le aprobaron.

**PERO en el resto del path SÍ lo ve:**
- **«Por coordinar»** (`index.tsx:970-977`) muestra la etiqueta =
  `casoCondicion ?? servicioNombre ?? items.map(descripcionLibre).join(' · ')` —
  **es la descripción de qué se aprobó.**
- **Coordinar** (`coordinar/[citaId].tsx:197-206`) muestra `servicioNombre`.

### El veredicto

**NO hay hueco BLOQUEANTE en el path del gate.** El vet ve qué le aprobaron en
«Por coordinar» y al coordinar la fecha — antes de llegar a la consulta. La
tarjeta pobre de la consulta ($total + estado) es **contexto de solo-lectura del
Antes**, no un bloqueo: cuando el vet abre la consulta, ya coordinó ESE
procedimiento y sabe cuál es.

**Por lo tanto NO bocetó un detalle de presupuesto dedicado** — el gate no lo
pide, y agregar una pantalla que el path no necesita contradice la Ley 16.

### Lo que SÍ se declara como deuda (no se cierra en silencio)

- **D-nueva (tarjeta de presupuesto en la consulta):** muestra $total+estado sin
  *qué*. Enriquecerla para que diga la descripción (misma regla 1/N/sin de §1)
  es una mejora real para el caso **consulta ≠ día de coordinar** (el
  procedimiento se agenda a futuro; días después, en la consulta, el vet solo ve
  $total). No bloquea el gate. Disparo: pasada de acabados del oficio vet.
- **Los presupuestos sin destino (C-3/C-4/C-6 de B0):** confirmados como
  read-only sin detalle. Una pantalla de detalle de presupuesto dedicada sería
  útil pero **no la pide el gate** — queda como deuda, con disparo "cuando el
  volumen de presupuestos lo justifique".
- **«El movimiento»** (`veterinaria/movimiento.tsx`): pantalla entera de
  presupuestos sin fila navegable. **Está en NEGOCIO, fuera del path del gate** —
  deuda declarada, no se toca en esta tanda.

---

## Estado de la tanda

- **Cero JS tocado.** La cura de JS de la pieza 3 (render de la descripción +
  quitar el total de «Por coordinar») **espera el commit del lector de la A** —
  será el bundle del gate.
- Los puntos 2 y 3 son **bocetos/relevamiento**, no construcción.
- La hoja de ruta del gate (`2026-07-20-s72b-hoja-de-ruta-gate-vet.md`) se
  actualiza cuando la pieza 3 renderice: se quitará de «declarado abierto» la
  línea del «Procedimiento» genérico. Hoy **no se actualiza** (aún no renderizado).
