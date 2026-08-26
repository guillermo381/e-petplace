# PEDIDO A LA PISTA A · LA CITA SEMILLA PARA EJERCER `video-token`

> **De:** pista D · S106 · 26-ago-2026 · **autocontenido (76b).**
> **Disparo:** el cable dio verde y la RPC existe. **Lo único que falta para
> que `video-token` deje de ser una pieza construida y no ejercida es que
> exista una cita con la que probarla.**

---

## §1 · POR QUÉ ESTE PEDIDO EXISTE

**Medido hoy contra la DB viva:**

| | |
|---|---|
| ofertas de telemedicina activas | **1** |
| citas con `modalidad='telemedicina'` | **0** |
| de esas, pagadas | **0** |

⇒ **Mi arnés corre y declara `NO CONCLUYENTE` con 8 casos saltados.**
*No es que falle: es que no hay contra qué correr.*

> **`L-402`, que es la ley que este arnés obedece: «¿está alcanzable desde
> afuera?» no alcanza — hace falta «¿CORRIÓ ALGUNA VEZ?».**
> Hoy `video-token` está **desplegada y verificada por respuesta**, y
> **jamás emitió un token para una cita real.** Eso se declara así, **no como
> «anda»**.

---

## §2 · QUÉ NECESITO — y por qué son varias y no una

**Una cita sola sólo prueba el camino feliz.** Mi arnés existe para ejercer
**los rojos a propósito**, así que necesito **casos que discriminen**:

| # | cita | para qué caso |
|---|---|---|
| ① | teleconsulta **pagada, hoy, en ventana** | camino feliz **y** el borde de §4 |
| ② | teleconsulta **pagada, dentro de varios días** | `fuera_de_ventana` |
| ③ | teleconsulta **cancelada** | `cita_cancelada` |
| ④ | *(opcional)* cita **presencial** cualquiera | `no_es_teleconsulta` |

**Y tres identidades**, que ya existen en la casa y no hay que inventar:
- el **dueño** de la mascota de ①
- el **veterinario** de ① *(para el borde de §4)*
- **cualquier tercero** *(para `ajeno_a_la_cita`)*

⚠️ **Con ① y ③ ya tengo la mitad del arnés en verde.** Si el alcance aprieta,
**② y ④ pueden esperar** — pero decímelo y lo declaro como cobertura parcial,
*jamás como verde*.

---

## §3 · 🔴 EL CASO QUE MÁS ME IMPORTA, Y ES CONTRAINTUITIVO

**El borde de §4: el token del VETERINARIO se emite aunque el dueño nunca
entre.**

`LETRA_TELEMEDICINA` §4 firma que la consulta **se cobra aunque el dueño no
asista** — *«si el veterinario entra y determina que el caso necesita atención
presencial, eso ES el servicio prestado»*.

⇒ **En mi arnés ese caso es un VERDE QUE PARECE UN ROJO.** Si algún día
rebota, quiere decir que alguien "arregló" la sala para que se abra sólo con
ambos, **y le sacó al veterinario el derecho a cobrar que la letra le dio.**

**Para ejercerlo alcanza con ①**: pedir el token con la sesión del vet, y que
salga, **sin que el dueño haya pedido el suyo nunca.**

---

## §4 · CÓMO PREFIERO QUE SE SIEMBRE — y la decisión es tuya

**Por la puerta real** (`crear_bloqueo_agenda` + el camino de pago), **no con
un INSERT a mano.**

*Una cita insertada directo puede quedar en un estado que la puerta real
nunca produce* — y entonces el arnés estaría probando `video-token` contra un
dato que no existe en producción. **Es el mismo modo de falla que S95
documentó: un estado que miente es peor que uno que falta, porque nadie lo va
a ir a verificar.**

Además, tu propia migración hace que **la modalidad se derive de la categoría
del servicio** ⇒ sembrando por la puerta, `modalidad='telemedicina'` **sale
sola y correcta**, sin que nadie tenga que acordarse de ponerla.

⚠️ **Si preferís asserts in-txn con ROLLBACK, decímelo:** en ese caso el
arnés **no puede correr contra ellos** (viven y mueren dentro de la
transacción), y entonces lo que necesito es que **quede una cita persistida**,
aunque sea marcada como fixture. **Sin fila persistida, no hay arnés.**

---

## §5 · QUÉ NO PIDO

- ❌ **No pido datos de una familia real.** Fixture está bien, y **marcado**
  como tal si tu criterio lo pide.
- ❌ **No pido tocar `pagos-*`** ni mover plata de verdad.
- ❌ **No pido que corras vos el arnés** — lo corro yo, con los ids y las
  sesiones que me pases. Sólo necesito **los uuid y con qué cuentas entrar**.

---

## §6 · QUÉ DEVUELVO CUANDO LO TENGA

**La salida literal del arnés**, con sus verdes y sus rojos ejercidos — no un
resumen. Y si algún caso queda sin correr, **lo declaro saltado y el arnés
sale con exit 1**: *un caso omitido en silencio es un verde flojo, y este
instrumento está construido para no darlos.*
