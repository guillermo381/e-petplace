# M1 — el selector de persona en el QUIÉN vet (S78-A, superficie cliente)

> Composición NUEVA en cliente ⇒ M1 obligatorio. Corto porque el flujo no
> cambia: cambia UN toque, y solo cuando hay elección real.

**TESIS:** elegir quién atiende es un regalo del negocio que lo permite —
jamás un peaje del flujo. El que no quiere elegir no ve nada distinto.

**PUNTO DE INSERCIÓN — el tap de la fila del negocio en `disponibles.tsx`
(el QUIÉN).** Hoy ese tap crea el hold. Con esta pieza:

- negocio que **no expone** (`expone_personas=false`, el default y las 5
  filas de hoy) → **cero diff**: el tap crea el hold como siempre.
- negocio que expone pero con **<2 ofertables** → **cero diff** (colapso
  N=1 — *la puerta no pregunta lo que ya sabe*; es diseño, no bug).
- negocio que expone con 2+ ofertables → el tap abre una **Hoja**:
  `SelectorOpcion` (acento `control`, Ley 21) con **"Cualquiera del
  equipo" PRESELECCIONADO** + una chip por persona, voz de una línea, y
  Continuar. **El default preseleccionado ES la vara 3:** continuar sin
  tocar nada = el camino de hoy, byte-idéntico.

**"OFERTABLE" = CHIP + JORNADA, y dónde vive el filtro (vara 1, medida):**
`obtener_personas_que_atienden` trae **a propósito** al que tiene chip sin
jornada (`tiene_jornada boolean`) — ese campo existe para el lado del
PRESTADOR (D-540 visible: "atiende pero le falta horario"). **La familia
jamás lo ve:** la pantalla filtra `tieneJornada === true` y el conteo del
colapso N=1 se hace sobre lo filtrado. Elegir a alguien sin horarios sería
ofrecer lo que el motor va a rechazar (Ley 23).

**FIRMA:** la Hoja que solo existe cuando hay elección real. En el 100% de
los negocios de hoy, esta pieza es invisible.

**`persona_no_disponible` — SU PROPIA CARA (vara 2):** el rebote vive
DENTRO de la Hoja, con voz propia (*"Justo a esa hora no puede — pero la
clínica sí"*) y **dos caminos**: primario **"Dejar que la clínica asigne"**
(reintenta el hold SIN persona — la elección se suelta, la reserva no se
pierde) y **"Probar otro horario"** (vuelta al CUÁNDO). `slot_ocupado`
conserva su cara de siempre (toast + recarga): son dos verdades distintas
y no comparten ropa.

**CHANEL:** la fila del negocio queda IDÉNTICA — sin badge de equipo, sin
contador de personas, sin chevron nuevo. La elección aparece recién al
tocar. Y si la lectura de vitrina falla, la pantalla **degrada al camino
de siempre y lo declara** (D-542 decidido para este caso: la elección es
accesoria por diseño — su ausencia no esconde datos, la reserva sigue
entera).

**CHECKOUT:** si la familia eligió, el resumen lo dice — *"Quién atiende:
{nombre}"* — antes del Dónde. Si no eligió, la línea no se monta (§8 de
`LETRA_TURNOS_S78`, la mitad "confirmación"; el detalle de la cita es
arrastre declarado).

**ESTADOS:** carga de personas = spinner del tap (150ms, receta Boton) ·
error de personas = degrada a hold directo, declarado · Hoja cierra por
swipe/backdrop/X sin crear nada.

**CONTRATO DE DATOS:** `obtenerVitrinaNegocios(ids)` (RLS directa a
`prestadores.expone_personas`, policy `prestadores_public` leída literal) ·
`obtenerPersonasQueAtienden` (se consume `empleadoId`, `nombre` —null
honesto→ etiqueta genérica—, `tieneJornada` SOLO como filtro; no se
renderiza) · `crearBloqueoAgenda` gana `empleado_id` opcional. Se descarta
A PROPÓSITO: `tieneJornada` en pantalla (es dato del prestador, no de la
familia).
