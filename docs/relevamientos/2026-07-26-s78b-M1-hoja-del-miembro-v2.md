# S78-B · M1 v2 — LA HOJA DEL MIEMBRO, SEGUNDA PASADA

Contra la **vara de acabado** (`2026-07-26-s78-VARA-acabado-hoja-del-miembro.html`,
depositada en `docs/relevamientos/` en esta tanda — llegó por Downloads) y contra
`LETRA_EDICION_VINCULO_S77` **v2.4 ✅ FIRMADA** (§6 · §11).

**Píxeles: `2026-07-26-s78b-LAMINA-hoja-del-miembro-v2.html`** — la firma es sobre la
lámina, no sobre esta prosa (L-143). Esta prosa dice el porqué.

**NO SE CONSTRUYE.** El gate del boceto es del founder.

**Estado del gate anterior:** CAMPOS aprobados (contrato de datos, orden narrativo,
piezas de §6) · DISEÑO rechazado. Esta es segunda pasada de M1 sobre el mismo
contenido, no un M1 desde cero.

**Decisión de producto del founder que rige esta pasada: LA JORNADA PRESIDE.**

---

## 0. LO PRIMERO — LAS CUATRO DECLARACIONES DE MESA, CONTRASTADAS CONTRA LA FUENTE

El pedido las mandó montar y declarar, no darlas por vigentes. **Se leyeron contra el
repo (L-166) y DOS DE LAS CUATRO CAEN — las dos achican el trabajo.**

### ① La Ley 6 estirada más allá de los tabs — **EN PIE, y necesita firma**

Sin cambio: el canon usa la huella como estado *en tabs* (§2.6, `estadoPorHuella`).
Usarla como único marcador de "este servicio lo atiende" es extensión. **Va al gate.**
Pero su construcción tropieza con ③ (abajo).

### ② «Los cuatro glifos son grado VARA, no grado registry» — **FALSA, ENTERA**

**Los cuatro EXISTEN en el registry y están gateados.** `packages/ui/src/components/Icono.tsx`:

| glifo | línea | estado |
|---|---|---|
| `veterinaria` | :72 | de los **6 firmados S53**, gate founder cerrado |
| `grooming` | :82 | ídem |
| `paseo` | :63 | ídem |
| `training` | :221 | **estrenado por pedido del founder EN el gate S67** (`da0c754`) |

Y el sub-hallazgo que mata el punto más débil que la mesa se había marcado sola: la vara
declara el silbato de adiestramiento como *"METÁFORA NUEVA, sin precedente en §1, riesgo
declarado"*. **El registry ya dibuja el silbato**, y su comentario literal dice por qué:

```js
// El silbato del adiestrador — MATA la estrella (violaba el set).
training: ({ tinta, huella }) => (
  <Circle cx={9} cy={14.2} r={4.6} … />
  <Path d="M9.6 9.6h9.2a1.2 1.2 0 0 1 1.2 1.2v2l-5.6 1.6" … />
  <Huella color={huella} x={6.5} y={11.6} escala={0.32} />
```

⇒ **Cero hoja de contacto §6b. Cero gate por ícono. Cero glifo nuevo. Cero montaje
21/44px junto a 5 del registry.** El lote de glifos que el pedido presupuestaba **no
existe como trabajo**. La lámina renderiza los cuatro paths del registry, verbatim.

> **Corolario de método:** la vara los redibujó a mano — geometrías distintas a las
> firmadas (su estetoscopio es `M6 3.4v4.4…`, el de la casa es `M7.2 3v3.5…`). Eso es
> Ley 2 rota en la vara misma. **Gana el registry**, que es lo que el founder ya firmó.

### ③ «Dos hexes son invento de la mesa» — **CIERTA, y resuelve SIN tokens nuevos**

Los cuatro hexes (`#F7EEDC`/`#7A5313`/`#FAEAE5`/`#9A3B22`) no están en tokens v4.
**Pero la casa ya tiene el par, con nombre y con precedente vivo:**

| pieza de la vara | lo que se usa | valor real |
|---|---|---|
| bloque ocre de jornada | `Tarjeta tinte="warning"` | `status.warningBg` `rgba(232,181,71,.24)` · texto `warningText #925F0C` · borde `rgba(146,95,12,.22)` |
| bloque ladrillo de peligro | `Tarjeta tinte="danger"` | `status.dangerBg` `rgba(255,92,92,.16)` · texto `dangerText #BE3535` · borde `rgba(190,53,53,.22)` |

`tinte="danger"` tiene **12+ consumidores vivos en el prestador** (HOY, grooming ×4,
adiestramiento ×4, mostrador…) y `tinte="warning"` uno (cierre de grooming). Es
copiar-al-vecino (protocolo 1c, preguntas 2 y 3), no invención.

⇒ **Ley 11 NO se dispara. Tokens nuevos: 0. Pares WCAG nuevos: 0. Sigue 178 / 0.**
**Segundo achique del trabajo.**

### ④ Solo tema claro — **EN PIE**

Sin cambio. Oscuro no está resuelto en la vara. Memorial: la degradación ya vive
ADENTRO de `Icono` (§2.8 — la huella pasa a `text.secondary`), así que el mecanismo de
estado por huella **se rompe solo en memorial** si se elige la opción A. Se declara; y
se confirma la sospecha del pedido: **una Hoja de miembro de un negocio no entra en
memorial** (memorial es de MASCOTA, M6) — no hay camino que la lleve ahí.

---

## 1. FRENO DECLARADO — el mecanismo central de la vara exige `packages/ui`

`Icono` acepta hoy **cuatro props**: `nombre · tamano · registro · tinta`.
El color de la huella se resuelve ADENTRO por `registro`:

- `'capa'` → hex puro de la capa del concepto (arcoíris: vet verde, paseo teal, grooming ocre)
- `'aa'` → el funcional AA de esa capa (mismo arcoíris, un tono AA)
- `'tinta'` → **el mismo color que el trazo**

**Consecuencia dura, en dos patas:**

1. **La huella no se puede ocultar.** El dibujante siempre la pinta. "El estado se lee
   solo por la presencia o ausencia de la huella" **no es construible hoy**.
2. **La huella no se puede llevar a tealDark sin llevar también el trazo.** La vara pide
   trazo tinta + huella teal; el único registro que da teal para las cuatro es `'tinta'`,
   y ese pinta *todo* de teal. Los otros dos dan arcoíris — que en el prestador
   **contradice §15b.1** (*acento único tealDark; el arcoíris de capas es del dueño*).

⇒ **La opción A (la vara literal) necesita una enmienda ADITIVA en `Icono`**
(una prop de huella: color y/o visibilidad). `packages/ui` es territorio de UNA sesión
por tanda (76d) y **hoy no está designado**.

**B FRENA y lo pide** — no lo deduce ni lo toca. El pedido lo ordena explícito, y el
precedente de S78 es ese: *el que no puede tocar un archivo lo PIDE*.

**Y el freno NO bloquea el boceto**, porque hay camino legal sin `packages/ui`:

| | opción A — la vara literal | opción B — construible hoy |
|---|---|---|
| qué codifica el estado | la huella APARECE o NO | el glifo ENTERO se apaga |
| trazo activo / apagado | tinta / tinta | `text.primary` / `text.tertiary` |
| huella activa / apagada | tealDark / ausente | tealDark / `text.tertiary` |
| `packages/ui` | **enmienda requerida** | **cero** |
| lectura | más fina, más silenciosa | se lee más rápido de lejos |
| memorial | se rompe (§2.8 fuerza la huella) | degrada bien |

**Las dos están renderizadas en la lámina, bloques 1 y 2. La elección es del founder.**
Voto de esta sesión: **B** — sobrevive a memorial, no abre territorio ajeno, y la
diferencia de finura no paga el costo de un componente compartido tocado por la sesión
que no lo gobierna.

---

## 2. LO QUE LA VARA PIDE Y LA LEY FIRMADA NO DEJA — tres choques

Se declaran; **no se ejecutan en silencio en ninguna de las dos direcciones.**

1. **El CTA "Cargar su jornada" en tinta `#221E19`.** La **Ley 21 enmendada S63,
   FIRMADA**, dice que el CTA primario del PRESTADOR ancla al OFICIO (`tealDark`), no a
   tinta; y `apps/prestador/src/app/_layout.tsx:62` pasa `cta="oficio"`. **La lámina lo
   pinta teal.** (De paso: `#221E19` es `bg.tinta`, el *techo* del prestador — no es
   color de texto. El texto real es `text.primary #1D1A2E`.)
2. **El botón sólido ladrillo "Quitar veterinaria".** `Boton.tsx:12` es explícito:
   *destructivo → tonal danger. **NUNCA coral sólido***. **La lámina lo pinta tonal.**
3. **"Desvincular del negocio" como texto pelado sin caja.** Ley 22c: comando con
   consecuencias **viste de botón** — *jamás texto pelado, jamás Celda*. La lámina lo
   deja en `Boton destructivo` (tonal, que es lo que ya está vivo). **Si el founder
   quiere el silencio que la vara buscaba, la forma legal es `Boton compacto`** (borde
   `border.default`, texto tinta) — queda como pregunta ② del gate.

---

## 3. LA COMPOSICIÓN — el orden que el founder decidió

    [1]  LA PERSONA — avatar de iniciales 44/r14 + nombre + correo
         · si !activo → pill "Invitación pendiente"   (contrato aprobado, sobrevive)
    [2]  LA JORNADA  ← PRESIDE (decisión founder S78)
         · Tarjeta tinte="warning" · DOS voces (§4bis) · CTA teal
    [3]  QUÉ ATIENDE — Texto seccion + hint
         · una fila por oficio: glifo + rótulo + (sublínea)
         · SIN divisores entre filas
    [4]  ⟨LUGAR RESERVADO — Administrador⟩ · NO SE DIBUJA
    [5]  Separador (uno solo, el que separa gestión de baja)
    [6]  DESVINCULAR + el aviso de §11.3
    [7]  vozError

**Por qué la jornada preside y no "Qué atiende":** es la tesis de S78 — el segundo
profesional no existe para la familia, y esta es la superficie donde el titular se
entera. El chip dice *puede*; la jornada dice *aparece*. Lo que falta preside (§15b.0
punto 2: *lo que sigue preside*).

### [2] LAS DOS VOCES DE LA JORNADA — verificadas contra el wrapper

`obtenerJornadaEmpleado` (`equipo.ts:565`) devuelve `{ franjasActivas, franjasTotales,
tieneJornada }` — **leído, existe, alcanza**:

| estado | qué pasó | voz | CTA |
|---|---|---|---|
| `franjasActivas > 0` | aparece en reservas | **sin bloque** | — |
| `franjasTotales === 0` | **nunca cargó** | "Todavía no tiene jornada" | Cargar su jornada |
| `totales > 0 && activas === 0` | **la pausó** | "Su jornada está pausada" | Ver su jornada |

Dos hechos distintos, dos caminos distintos: uno se crea, el otro se reactiva. Decirlos
con la misma frase manda al titular a crear lo que ya existe.
El bloque se monta **solo con ≥1 chip** — sin chips no hay promesa que romper.

> **El CTA es puerta honesta, no botón muerto.** D-540 (ningún empleado puede recibir
> reservas) es del MOTOR y es de A. Si al construir el destino no existe todavía, **el
> bloque dice el hecho y el CTA no se dibuja** — Ley 23. Lo que NO se hace es dibujar el
> botón y que rebote.

### [3] QUÉ ATIENDE — grano OFICIO, y el catálogo es la UNIÓN

Grano oficio (no oferta): copiar-al-vecino de la Hoja de invitar **del mismo archivo**
(L446-459, `SelectorOpcion multiple acento="oficio"`). Un archivo con dos gramáticas
para el mismo trabajo es lo que §6.2bis denuncia.

**El catálogo que se pinta es `oficios(activos del negocio) ∪ oficios(que la persona
tiene)`.** El porqué, con literal: `obtenerOficiosNegocio` filtra `.eq('activo', true)`;
`obtenerChipsEmpleado` **no filtra**, y `empleado_tiene_capacidad_clinica` tampoco (S76,
a propósito: *desactivar una oferta no le quita el expediente al vet*). Sin la unión, un
chip sobre oferta apagada **sigue dando expediente y desaparece del selector**:
invisible e inquitable — el lector que degrada a lista vacía y esconde el hueco (§6.3).
Por eso la cuarta fila de la lámina existe y dice su porqué.

**Sin divisores entre filas** (éxito #1 del pedido, y Ley 18: el divisor solo vive si
separa cosas realmente distintas — cuatro filas del mismo tipo no lo son).
**Sin checks, sin pills, sin tintes de fila** (éxito #2).

### [4] EL ADMINISTRADOR — reserva de ORDEN, cero píxeles

Va entre [3] y el Separador para que cuando su motor llegue entre sin reordenar nada.
**Cero placeholder, cero toggle apagado, cero "próximamente"** — Ley 23 y el precedente
literal de la Hoja vecina (L426-428).

### [6] DESVINCULAR — el aviso de §11.3, con su honestidad

- **La asimetría, siempre:** la baja es reversible; **el despegue no**. Si la reactivás,
  las citas no vuelven.
- **El número:** L-139 manda. **No existe lector de citas futuras por empleado.**
  `desvincularEmpleado` **sí** devuelve `citasDespegadas` (`ResultadoBaja`, verificado en
  `equipo.ts:159-186`) — pero **DESPUÉS del acto**. Antes no hay número ⇒ **la
  consecuencia se dice sin cantidad**, jamás un número plausible.
  *(El número que el motor sí da se usa en el reporte posterior, con `useAviso`.)*
- **La voz NO recicla el aviso de renovación** (§6.3): ese string nombra *cambio de
  agenda del paseador* — causa falsa acá, y llega semanas tarde.

---

## 4. LO QUE SALE (Chanel) — y lo que arrastra

**Se quita (4 piezas, heredadas del M1 aprobado y ahora también su código muerto):**

1. `Interruptor` **profesional** (L361-366) — la letra lo declara DERIVADO de ≥1 chip.
2. `Interruptor` **recepcion** (L370-375) — membresía, no identidad; su `DELETE` puede
   borrar el piso que A2bis garantiza (§6.2ter).
3. La clave **`equipo.rolesAyuda`** — describe los dos roles que mueren (Ley 37).
4. El handler **`toggleRol`** (L147-168) queda sin llamador desde esta Hoja.

> **Pendiente para A, no del boceto:** si `asignarRolEmpleado`/`quitarRolEmpleado` quedan
> sin consumidor al sacar los dos toggles, o si otra superficie los usa.

**Se quita además, nuevo de esta pasada:** los divisores entre filas de servicio y todo
marcador de estado que no sea el glifo (Chanel sobre la vara misma).

### EL ARRASTRE — confirmado con literal, entra al mismo alcance

`equipo.tsx:312-316`:

```tsx
subtitulo={ m.roles.length === 0 ? t('equipo.sinRolAccion')
                                 : m.roles.map(vozRol).join(' · ') }
```

Es **100% role-driven**, y desde A2bis **todo el mundo tiene la fila `recepcion`** ⇒ el
subtítulo dice **"Recepción"** a todos, incluido el vet con seis chips. Recomponer solo
la Hoja dejaría dos superficies contando historias distintas del mismo vínculo.

**La cura, en la misma gramática que la Hoja:** el subtítulo pasa a decir **lo que la
persona atiende** (los oficios de sus chips), y `recepcion` deja de ser identidad —
`recepción ⟺ NOT EXISTS chip`. Sin chips: la voz del piso. **Sin lector nuevo si la
lista ya trae chips; si no los trae, es pedido a A y se declara antes de construir.**

---

## 5. Declaración de craft (protocolo obligatorio)

- **TESIS:** *"Lo que esta persona puede hacer en tu negocio se decide acá — y hasta que
  tenga jornada, poder no es aparecer."*
  *(Enmendada respecto del M1 aprobado: la tesis vieja terminaba en "nada cambia sin
  decir antes qué se lleva". Sigue siendo verdad y la firma la sostiene, pero el founder
  movió el centro de gravedad a la jornada.)*
- **FIRMA (Ley 15):** **la consecuencia visible.** Quitar el último chip médico no se
  ejecuta y se informa: la Hoja dice, en el lugar y ANTES, que esa persona deja de ver la
  historia clínica. Firma de COMPORTAMIENTO — la que la skill pide del lado prestador.
  Test anti-genérico: una app de servicios cualquiera quita un tag en silencio.
- **CHANEL:** las 4 piezas de arriba + los divisores + los marcadores redundantes.
- **TESTS (§15 prestador):** dosis baja (UN acento: el teal del oficio) · NEGOCIO
  gestiona · vacío ≠ negocio muerto (0 chips tiene voz con camino) · verdad firme (el
  número de citas sale de lector real o no se muestra).

## 6. Números (medidos, no adjetivados)

- **Componentes nuevos: 0.** Ley 11 no se dispara. Se usan `Hoja · Texto · Tarjeta
  (tinte warning/danger) · Icono · Boton · Insignia · Separador · Esqueleto · useAviso`.
- **Glifos nuevos: 0** (corrección ②).
- **Tokens nuevos: 0** ⇒ **pares WCAG nuevos: 0** ⇒ sigue **178 / 0**.
- **`accent.active` sumados: 0** (Ley 5).
- **Sólidos por superficie: 1** — el CTA teal de la jornada (Ley 19.7).
- **Interruptores: 2 → 0.**
- **Targets: 44.**
- **Viajes de red al abrir la Hoja: 3** — `obtenerChipsEmpleado` = 2 (piso alcanzable:
  bajar a 1 exige FK nueva sobre `prestador_servicios.tipo_servicio` ⇒ migración ⇒
  motor, y eso no es de la Hoja) + `obtenerJornadaEmpleado` = 1.

## 7. Estados declarados

| estado | qué muestra |
|---|---|
| cargando | `Esqueleto` en jornada + servicios; la persona ya vive |
| sin jornada / pausada | el bloque warning en su voz (tabla §3) |
| 0 chips | la voz del piso, con camino |
| chip sobre oferta apagada | se muestra, quitable, con su porqué |
| escribiendo | filas bloqueadas (`ocupado`), sin doble disparo |
| error de lectura | voz honesta + reintento — jamás lista vacía (Ley 13) |
| error DESPUÉS del DELETE | estado incierto + re-leer; **jamás "no se quitó"** (mentiría) |
| último chip médico | confirmación en el lugar, dos toques, `Tarjeta tinte="danger"` |
| tras quitar | `perdioCapacidadClinicaPorChip` re-leído se muestra (`useAviso`) |
| miembro titular | rama `roles.includes('dueño')`: solo Insignia (§6.3, L6) |
| no-dueño | la pantalla ya gatea por `esDueno` (Ley 23) |

Temas: claro resuelto; **oscuro sin resolver, declarado (④)**. es/en: claves nuevas
nacen en par. **M3:** esta superficie **no tiene campo de texto** ⇒ **L-162 no aplica**
(verificado, no supuesto: los dos `Campo` del archivo viven en la Hoja de *invitar*).

## 8. LO QUE VA AL GATE — cinco preguntas, ninguna retórica

1. **¿A o B?** (el mecanismo del estado — lámina bloques 1 y 2). Si A: **autorizar a A la
   enmienda de `Icono`**, porque B no puede tocarlo.
2. **¿"Desvincular" queda tonal o baja a `compacto`?** (que el teal presida solo).
3. **La Ley 6 estirada** (declaración ①): ¿se firma la huella como marcador de estado
   fuera de tabs?
4. **La alarma de vocabulario:** *turno* = cita (familia) vs *turno* = plantilla de
   jornada (Pista A de S78). **Misma palabra, dos significados, los dos en la app del
   prestador.** Posición de mesa: la plantilla se llama **jornada**, *turno* queda para
   la familia. **Sin firma.** La lámina escribe **"una cita"** para no comprometer la
   decisión; si la firma cae del otro lado, el string entra al lote que lo corrija.
5. **El arrastre del subtítulo** (§4): ¿entra en esta tanda? (voto: sí — si no, la app
   queda contando dos historias del mismo vínculo).

## 9. LO QUE ESTE M1 NO AUTORIZA NI PIDE

Cero motor: cero migración, cero policy, cero RPC. Cero ingreso de glifos al registry
(no hace falta: ya están). Cero wrapper de jornada por empleado (existe). Cero toque a
`packages/ui` **salvo que el founder elija A y lo autorice a la sesión que lo gobierna**.

---

**M2 la corre la OTRA sesión, jamás B (L-153).**
