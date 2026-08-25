# DeUna — LA RESPUESTA DEL 24-AGO-2026

> **Canal:** WhatsApp · **De:** Gabriela Villalba + contacto técnico de DeUna ·
> **Recibida:** 24-ago-2026 · **Depositada por:** pista A, turno 0 de la mesa.
>
> **Esta sección es TRANSCRIPCIÓN VERBATIM.** No se resume, no se interpreta y no
> se corrige. La lectura de la mesa vive abajo, en §2, separada a propósito:
> *un verbatim que se mezcla con su interpretación deja de servir como fuente y
> pasa a ser el recuerdo de alguien.*

---

## §1 · VERBATIM

1. **`pointOfSale` QA: `4262774`** — producción pedirá otro POS.
2. **Logo y manual de marca:** link de Corebook recibido.
3. **Webhook:** se maneja solo con headers — **nosotros enviamos URL + headers y
   ellos lo configuran**; no manejan nada más fuerte.
4. **Reversos:** **sí se pueden simular** · la ventana es de **24 horas**.
5. **Rate limit:** pendiente de consulta — *«alto, sin problema sin loops»*.

---

## §2 · QUÉ DESTRABA Y QUÉ NO — lectura de la mesa (NO es del proveedor)

### ✅ Lo que destraba

- **El `pointOfSale` era la única llave del riel entero** (canon S103). Con
  `4262774` el riel de DeUna deja de estar bloqueado por un tercero.
  ⚠️ **Y trae su propia advertencia adentro:** *producción pedirá otro POS* ⇒ el
  valor **es de ambiente**, no una constante. Nace donde nacen los valores de
  ambiente (secreto/config), **jamás horneado en el código** — si se escribe
  literal, el día del cambio a producción falla en el peor momento y sin síntoma
  previo.
- **El webhook se configura del lado de ellos con URL + headers.** Nosotros
  producimos y entregamos; ellos cargan.

### 🔴 Lo que RESUELVE UNA CONTRADICCIÓN VIVA, y por eso se cita

**La ventana de reverso es de 24 horas.** El documento del proveedor se
contradecía en este punto. **Esta respuesta es la que rige, y se cita en los
T&C** — el plazo que la casa le promete al cliente no puede apoyarse en un
documento ambiguo.

⚠️ **Choque medido contra letra propia, y hay que resolverlo antes de escribirlo
en ningún lado:** `LETRA_MOTOR_PAGOS_S101` §5.0 y `LETRA_DEUNA` §8 fundan las
compuertas pre-cobro en que el reverso es **MISMO-DÍA** (*«la plata que no se
cobra mal no hay que devolverla»*). **«Mismo día» y «24 horas» no son lo mismo:**
un cobro a las 23:50 tiene 10 minutos de mismo-día y 24 horas de ventana real.
**No se toca ninguna de las dos letras en este turno** — se declara el choque y
lo arbitra la mesa. *Las dos son defendibles por separado, y nadie las había
comparado.*

### 🔴 Lo que NO destraba — y es lo que la respuesta deja al descubierto

**«Los reversos se pueden simular» habilita el caso; no lo construye.**
Medido contra la base en este mismo turno: **cero reversos de cualquier
proveedor, y `reverso_fallido` con cero filas** pese a existir en el vocabulario.
⇒ La respuesta de DeUna **le quita el último argumento a `D-888`** (el reverso
mismo-día, descrito por dos letras y asignado por ninguna): *ya no está esperando
al proveedor, está esperando un dueño.*

### 🟡 Lo que queda pendiente del proveedor

**El rate limit.** *«Alto, sin problema sin loops»* es una tranquilidad, no un
número — y **no se puede diseñar un backoff contra una tranquilidad**. Queda
como pendiente de consulta, sin bloquear: el barrido y el webhook no son
cadencias agresivas. **Se convierte en número o se declara supuesto.**

---

*Depositado en el turno 0. El §1 no se edita nunca más; el §2 sí puede
enmendarse cuando la mesa arbitre el choque de la ventana.*
