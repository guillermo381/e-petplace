# S107-C · EL RECORRIDO DE RESERVA DE GUARDERÍA — escrito ANTES de construir

> **Gate del founder:** *«recorrido escrito antes de construir, con sus caminos tristes».*
> Todo número de acá está **medido contra el objeto el 29-ago-2026**, no leído de un plan.

---

## ⓪ EL CENSO DE CRITERIOS — lo que los hermanos ya resolvieron

*La lección de B, cobrada tres veces en un día: la respuesta a un problema nuevo suele
estar escrita como criterio en la entrada de un vecino.* **Seis preguntas, seis respuestas
que NO se re-deciden acá.**

| pregunta | la respuesta de la casa | dónde vive |
|---|---|---|
| **¿Qué forma tiene el selector de modalidad?** | `SelectorSegmentado` con `proposito="eleccion"` — **la misma pieza que Baño / Baño y corte** | `explorar/grooming/index.tsx:459` |
| **¿Qué precio va debajo?** | **UN solo texto bajo el riel**, para la opción activa, `size.sm` / `text.secondary`. Con `varia` dice **«desde»**; el número **sale del server, jamás se calcula en el cliente** | `grooming/index.tsx:472-482` |
| **¿Cómo se muestra la mascota sin re-preguntarla?** | Como **`detalle` del `CabezalOficio`**, y el `FiltroMascotas` **sobrevive guardado** para el camino sin parámetro | `grooming/index.tsx:268-275` y `:324-334` |
| **¿Cómo se dice el saldo?** | `CeldaNavegacion` con **subtítulo vivo**; **el singular tiene KEY PROPIA** (`teQuedaUna`), no es una interpolación | `hogar/paseos.tsx:581-584` |
| **¿Cómo se agenda contra saldo?** | **Hoja parejo-parejo de dos botones** («Reservar con tu paquete» · «Pagar suelto»), y el camino del saldo **saltea el checkout entero** | `lib/reserva/paseo.ts:324-335` |
| **¿Qué comprobante ve una reserva SIN cobro?** | **No hay pantalla ni Hoja: un TOAST que nombra el saldo restante + Go home**, y el rastro es la fila del hub **marcada con su origen** («Con tu paquete») | `lib/reserva/paseo.ts:303-305` · `paseos.tsx:696-702` |

**La séptima, de la letra:** la pantalla de una serie dice **qué · cuándo · a qué medio · cómo se corta**,
cada grupo en su carta, el botón de cortar `destructivo` y **confirmación simple, jamás doble**
(`components/serie-recurrente.tsx`, `LETRA_COBRO_RECURRENTE` §2).

---

## ① LA FORMA — dos etapas, y por qué AHORA sí se parte

**`modalidad → día → ver quién puede → elegir lugar → pagar`** (firma del founder, contrato
`s107-contrato-filtro-por-modalidad` ⓪).

```
explorar/guarderia/
  index.tsx         ETAPA 1 · la modalidad          (sin día todavía)
  disponibles.tsx   ETAPA 2 · día + quién puede     (param: modalidad)
  [prestadorId].tsx el lugar                        (ya existía)
  checkout.tsx      el pago                         (ya existía)
```

⏪ **ESTO REVOCA UNA DECISIÓN MÍA, y se dice en vez de dejarla contradiciéndose.**
El acta de traspaso §⑥① declaró *«guardería NO se parte en `index` + `disponibles` porque acá
el día ES lo que filtra a los lugares — partirlo inventaría un paso»*. **Era cierto mientras el
primer filtro era el día.** La firma de la modalidad puso **otro filtro antes**, y la primera
pantalla ya no repite nada: decide algo que la segunda necesita. *La razón vieja no era mala;
se le movió el piso.*

---

## ② EL RECORRIDO FELIZ, pantalla por pantalla

### ETAPA 1 · `index.tsx` — la modalidad
`CabezalOficio` con **el nombre de la mascota como `detalle`** → `SelectorSegmentado` de tres
(**Día · Paquete · Mensual**) → `PieReserva` con «Continuar».

- 🔴 **SIN precio debajo, y es una decisión medida, no un olvido.** El precio de guardería vive
  **por lugar**, y los lugares no se conocen hasta que hay un día. No existe lector público de
  oferta de guardería (el de grooming, `obtenerOfertaGroomingPublica`, no tiene hermano acá).
  ⇒ **cualquier número acá sería inventado.** *La regla de la casa dice que jamás se muestra un
  número que no sea el que se va a cobrar; cuando no hay uno honesto, no va ninguno.*
- **La mascota no se re-pregunta.** Viaja del hub por parámetro. El `FiltroMascotas` **sobrevive
  guardado** (`mascota === null`) para el camino sin parámetro — **el mismo guard literal de
  grooming**. *Sin él, entrar sin mascota deja una pantalla sin sujeto.*

### ETAPA 2 · `disponibles.tsx` — el día y quién puede
`SelectorDia` (**los cinco estados del contrato, y jamás HOY**) → **«Ver quién puede»** → lista de lugares con
**su** precio → tocar uno lleva al lugar.

- **Qué significa el día**, por modalidad *(contrato ①)*: **día** = el día a agendar ·
  **paquete** = el **primer** día a agendar · **mensual** = el día de **inicio**.
- **Paquete suma un paso**: el **tamaño** (5 · 10 · 15) antes de la lista.

### EL LUGAR y EL PAGO
`[prestadorId].tsx` (franjas · cupo · semáforo) → reservar (**hold 15 min**, `pendiente_pago`)
→ `checkout.tsx`, que monta **`CheckoutReserva`, la misma pieza que paseo y grooming**
(`LETRA_PAGO_CITAS` §4: la espera con voz, jamás spinner mudo, jamás rechazo por timeout).

---

## ③ LOS CAMINOS TRISTES — los cuatro que el gate pide, y dos más que aparecieron

| camino | qué ve la familia | de dónde sale |
|---|---|---|
| **sin cupo ese día** | «Ninguna guardería tiene cupo ese día» — **con el día a la vista y la tira viva para mover el dedo** | ya construido, `hubGuarderia.sinLugaresTitulo` |
| **el día no es elegible** | **los CINCO estados del cupo, separados**: `pasado` · `mismo_dia` · `no_opera` · `sin_lugar` · `elegible`. 🔴 **«No abre» NO es «se llenó»** — y **`sobrevendido` NO es un sexto: es un booleano aparte que puede acompañar a cualquiera de los cinco** | contrato ② |
| **el día no vino en la respuesta** | voz propia (`cupo_sin_dato`) — **no es un estado del cupo, es una ausencia**, y decirlo así evita contarla como sexto | ya construido |
| **rebote de cupo al reservar** | el mensaje del motor **y el calendario se recarga** — *el cupo se toma bajo candado y dos familias pueden tocar en el mismo segundo* | `[prestadorId].tsx`, ya construido |
| **pago rechazado** | lo resuelve **`CheckoutReserva`**, que ya lo tiene: la cita queda `pendiente_pago` con su hold y **la familia puede volver a pagar** | pieza compartida |
| **paquete sin saldo** | 🔴 **HOY NO PUEDE OCURRIR** — ver ④: no hay compra de paquete, así que no hay saldo que agotar. **Cuando exista, se reusa la Hoja parejo-parejo del paseo** |
| **suscripción pausada** | 🔴 **HOY NO PUEDE OCURRIR** — ver ④. **Cuando exista: `estado === 'pausada'` preside en su carta con «cómo reanudar»**, criterio ya escrito en `serie-recurrente.tsx` |

---

## ④ 🔴 LO QUE NO TIENE MOTOR — medido contra el objeto, no supuesto

| modalidad | ¿se puede vender hoy? | lo medido |
|---|---|---|
| **DÍA** | ✅ **SÍ, entera** | `reservarDiaGuarderia` existe y cobra el día suelto |
| **PAQUETE** | ❌ **NO** | **no existe RPC de compra de paquete de guardería**, y `comprar_paquete_salidas` es del PASEO: cobraría contra `prestador_servicios.precio_paquete`, **la columna que el contrato de paquetes ⑤ DESCARTÓ explícitamente**. El propio contrato lo dice en su ⑥: *«Consumir un día del paquete al reservar — llega con el arco de la reserva por paquete»* |
| **MENSUAL** | ❌ **NO** | `precio_mensual_plan` se configura y **nadie lo cobra**: no hay hermano de `contratar_plan_paseo` para guardería |

**Y el filtro todavía no filtra:** `obtener_guarderias_disponibles` **no acepta `p_modalidad`**
(medido en los tipos generados) y el wrapper devuelve **los tres precios**, no uno resuelto.
*El contrato está publicado; el objeto viene atrás.*

### ⇒ LA CONSECUENCIA EN LA PANTALLA, y por qué NO es un callejón
**Las tres modalidades se construyen enteras.** Las dos sin motor quedan **detrás de una sola
constante nombrada** (`MODALIDADES_ABIERTAS`), y con ella apagada **el selector no se dibuja**:
la casa ya tiene esa regla —**N=1 colapsa**, *«con un turno nadie ve la palabra»*— y el flujo
entra directo al camino del día.

*El precedente es literal y es de esta casa: la pantalla de la serie recurrente se construyó
entera y **no se le agregó la entrada** hasta que existiera su lector, porque «una fila que
lleva a una pantalla que no puede leer nada es un callejón con nombre bonito».*
**Encender las otras dos es cambiar una línea el día que A publique sus RPC.**

---

## ⑤ ⏪ **ERROR MÍO, CORREGIDO — `guarderia_tramos` SÍ EXISTE** *(29-ago)*

**Esta sección afirmaba que la tabla no existía y que el punto vivo era inalcanzable por los dos
lados.** Era falso: **A la creó hace varias tandas**, y **en el mismo acto curó una fuga que el
hueco tapaba** — `obtener_punto_vivo` sólo pedía `auth.uid()`, así que cualquier logueado con un
`tramo_id` obtenía **la ubicación en vivo de un vehículo**.

🔴 **Y la forma corrige lo que yo había supuesto, que es lo caro:** el tramo es **del VIAJE**
(`prestador_id, fecha, direccion` — **sin `estadia_id`**) y **cada estadía apunta a los suyos**
con `tramo_recogida_id` / `tramo_devolucion_id`. *Un tramo por estadía haría que el mismo
vehículo emitiera N puntos idénticos: no fallaría, multiplicaría la misma verdad.*

**La sección se marca, no se borra.** *Un hallazgo que afirmó de más y desaparece deja a quien
lo leyó creyendo lo viejo.* ⇒ **`L-166` en su forma más cara: un dato medido no es un dato
vigente, y una afirmación ESTRUCTURAL vencida es peor que una ausencia — el que la lee
construye contra ella.**

## ⑥ UNA POLÍTICA QUE NO EXISTE, declarada porque el encargo la citó

El encargo nombra **P18 (ventanas, ancladas al inicio de la franja de recogida)**. Medido:
**`P18` cubre, por su propio encabezado, «el paseo INDIVIDUAL pagado, ni plan ni paquete»**, y
**guardería no tiene hermana** (`P22`, la clínica, está *DECLARADA sin letra* desde S76).

⇒ **El ancla que el founder firmó verbalmente no está en `POLITICAS_EPETPLACE`.**
No bloquea esta tanda —**cancelar y reagendar no entran acá**— y **depositar la política es de A**.
*Se escribe porque una ventana aplicada por analogía, sin letra, es la clase de regla que
después nadie puede citar cuando una familia reclama.*
