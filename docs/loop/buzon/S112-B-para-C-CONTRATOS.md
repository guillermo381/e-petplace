# S112-B → C · CONTRATOS · el botón que explica, y la ficha de todo-desconocido

Commit `55f51ad6` (rama `pista/s112-b`). **Nada en aparato hasta el lote único.**

---

## ① `Boton` — LA RAZÓN AHORA SE DIBUJA. No tenés que hacer nada, salvo saber esto

**La firma NO cambió.** `BotonProps` quedó byte-idéntica: cero migración, cero
typecheck roto. Lo que cambió es lo que la pieza HACE con lo que ya le pasabas.

```ts
razonDeshabilitado?: string   // ← AHORA DIBUJA una línea bajo el botón
onRazon?: () => void          // ← sigue siendo el TOQUE. YA NO gobierna el texto.
```

**El cambio que te sirve:** hasta ayer `razonDeshabilitado` aparecía **una sola
vez en el render y era `accessibilityHint`** — o sea que *la razón no se
dibujaba nunca, ni con `onRazon` ni sin él*. Desde este commit:

| lo que pasás | lo que ve la familia |
|---|---|
| nada | el botón apagado, mudo (igual que siempre) |
| `razonDeshabilitado` sola | **el botón apagado + la razón escrita debajo** |
| `razonDeshabilitado` + `onRazon` | lo anterior, y además el toque lleva a resolverlo |

🔴 **`onRazon` DEJÓ DE SER REQUISITO PARA QUE SE VEA.** Era la mitad de un par
y estaba de guardia sobre el texto sin que ése fuera su trabajo. **Pasá la
razón sola cuando no tengas a dónde llevar** — es el caso normal, no un defecto.

**Lo que te pido a vos, y es lo único:**

- **Una línea corta.** Es lo que se lee para DECIDIR («Elegí para qué mascota
  es»), no la explicación de por qué. Si necesitás explicar, eso es N22 con su
  «i» y es otra pieza.
- **Decí qué FALTA, no qué está mal.** Va atenuada y jamás en rojo: no es un
  error de la persona, es un estado.
- **Que la razón desaparezca cuando deja de ser cierta** (`undefined`). El
  renglón queda reservado solo, así que no salta nada: eso ya lo resuelve la
  pieza.

**Lo que la pieza garantiza y no tenés que cuidar:** el renglón se latchea
(N24 — nunca hubo razón ⇒ no dibuja ni un píxel de hueco; hubo una ⇒ el
renglón queda y el encendido no salta) · el fundido suave al encenderse ·
el lector de pantalla no lee la razón de un botón ya encendido.

**Gratis, sin tocar una línea tuya:** `PieReserva` y `BotonCopiar` relevan la
prop a `Boton`, así que sus consumidores ganan la línea solos. Los **6
archivos** que hoy pasan razón sin `onRazon` ya dibujan.

> ⚠️ **UN BORDE DECLARADO, no escondido:** con un padre que CENTRA y una razón
> más ancha que el botón, el botón queda a la izquierda del bloque. Por eso la
> línea va corta. Si te aparece un caso donde no se puede, decímelo con el
> literal y lo resolvemos en la pieza — **no lo envuelvas en la pantalla**.

### 🔴 Y ANTES DE QUE TE PASE: `verify:razon-muda` te va a dar ROJO por hacer lo correcto

Ese gate cuenta archivos con `razonDeshabilitado` **sin** `onRazon`, y es
solo-baja. **Su premisa acaba de volverse falsa**: hoy esos archivos dibujan la
razón. Si agregás razones nuevas sin `onRazon` —que es exactamente lo que hay
que hacer— **el número sube y el gate corta**.

**Medido: NO está en el pre-commit**, así que no te va a frenar un commit; sale
en el cierre. **No lo bajes con `onRazon` vacíos** (es el error que S111 se
negó a cometer) **y no lo toques**: es de A, y le dejé la ficha en
`S112-B-para-A-gate-razon-muda.md`.

---

## ② `Convivencia` — CAMBIO QUE TE ROMPE EL TYPECHECK (una línea)

```ts
voces: { si: string; no: string; sinObservar: string }   // ← sinObservar es NUEVA y OBLIGATORIA
```

**Por qué obligatoria y no opcional:** es el título propio del bloque cuando
**ninguna** convivencia fue observada todavía — la tarjeta del rescate de seis
días, la que §3 dice que cuesta un hogar. *Ese estado no puede depender de que
alguien se acuerde de pasar una prop* (mismo criterio con el que `voces.si` ya
era obligatoria en una tarjeta sin ningún «sí»).

**Qué verifiqué, que es lo que el founder pidió:** con todas las filas en
`no_se_sabe` la tarjeta se leía **rota**, y no por gusto — era estrictamente
MENOS que cualquier otra en los tres canales a la vez: cero puntos en toda la
columna, cero `primary`, ningún enunciado propio. **El defecto era de
cardinalidad:** «la ausencia de marca es la marca» es correcta por fila y falsa
por bloque.

**Curado:** con todo desconocido, el bloque gana **título propio** y sus voces
suben a `primary` — mismo peso que un «sí», sin gris de vacío. **No colapsa a
un enunciado único**: eso habría borrado la voz de la fila que dice algo
distinto (*«aún no lo vimos con chicos»* no es *«todavía no se sabe»*), que es
el dato que la pieza existe para respetar.

**Voz sugerida, tuya la última palabra:** `sinObservar: 'Todavía lo están
conociendo'` — presente y en voz de la casa. *Lo que pasa es que lo están
conociendo, no que falte un dato.*

**Y una del layout que es tuya (N21):** la pieza no dibuja superficie. Como
lleva rótulo, **es un grupo ⇒ va en carta**. La pieza no se la pone sola porque
no sabe si la estás anidando.

---

## ③ LO QUE YA TENÉS PARA VIDRIERA Y FICHA — pedime lo que falte POR NOMBRE

**Vivas y exportadas** (contratos completos en sus cabeceras):

| pieza | qué resuelve |
|---|---|
| `Convivencia` | los tres estados, con la tarjeta de todo-desconocido curada |
| `SemaforoSanitario` | `requisitos: RequisitoSanitario[]`, `rotulo?` |
| `SenalesAdoptable` | `senales: SenalAdoptable[]`, `rotulo?` — urgente · pareja vinculada · tiempo en rescate |
| `EstadoSolicitudAdopcion` | `estado`, `voces`, `vozDeclinada`, `registro: 'compacta' \| 'completa'` |

**No existen todavía, y son las que tu lista nombra:**

- **la tarjeta de adoptable** — foto grande y nombre; edad *estimada* y
  *mestizo* leídos como lo que son, sin vergüenza. Sin swipe, sin corazones,
  sin puntaje.
- **el bloque «Llevan más tiempo esperando»** — con **su porqué a la vista**, y
  es parte de la pieza: sin la línea que explica por qué están arriba, el
  bloque parece un ranking, que es justo lo que la letra prohíbe.
- **los chips de filtro con convivencia en tres estados** — ojo: §4 dice
  *filtrar no borra al que no se midió*, así que el filtro activo **no puede
  producir una lista sin los `no_se_sabe`**; van abajo con su título. Eso es
  composición tuya, pero el chip tiene que poder decir los tres estados.

**Para construirlas necesito de vos, por pieza:** ① el dato REAL que tenés
(campos y cuáles pueden faltar) · ② dónde vive (grilla de vidriera o ficha) ·
③ qué pasa al tocar. **No mando prop sin caso** — una prop sin consumidor
decora, y esta casa las retira.

**Mandámelo por nombre y lo construyo.** Mientras tanto no invento: sin tu dato
real, lo que salga va a tener la forma de mi suposición y no la de la vidriera.
