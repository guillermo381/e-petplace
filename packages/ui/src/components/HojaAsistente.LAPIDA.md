# ☠️ `HojaAsistente` — MURIÓ EN EL LOTE 11 (S116-B)

**Vivió dos lotes.** La construí en el lote 8 con la orden *«que el asistente al tocarse abra una hoja corta desde abajo»*, y el founder la reemplazó al ver su propia captura del orbe: **lo que quería era el abanico**.

## Por qué se retira, y no es que estuviera mal hecha

**Una hoja modal tapa la pantalla desde la que se la abrió** — y el contexto de lo que se va a preguntar **es esa pantalla**. *Preguntar sobre algo no puede empezar por esconderlo.*

Y hay una segunda razón, de gesto: **una hoja pide dos manos o un pulgar que viaje**; el abanico **nace donde está el dedo**, que ya está sobre el botón.

## Lo que se conserva, y por eso no fue trabajo perdido

- **El contrato de los atajos es el MISMO** (`{glifo, texto, onPress}`) y viajó entero a `AbanicoAsistente`. *El founder lo pidió así: «mismo contrato de atajos».*
- **El censo del orbe** —`apps/cliente/src/lib/nexo/atajos.ts:57`, `['peso','vacuna','antiparasitario','foto']`— sigue siendo la fuente, y sigue siendo lo que corrige a la memoria de la mesa (nombró «agregar recuerdo» y «carné de vacunas»; el objeto dice otra cosa).
- **La decisión de que la monte el BOTÓN y no cada pantalla** se conserva tal cual: *si cada pantalla la montara, abrir el asistente sería un acto distinto en cada una.*

## Lo que se perdió a propósito

El **campo de pregunta escrito** (`BarraEscribir`). En el abanico, «Pregúntale a Nexo» es **una fila que navega**, no un input. *Un campo de texto colgando de un abanico obliga a que el abanico sobreviva al teclado, y eso es una hoja con otro nombre.*

---

**No se revive sin volver a pasar por la firma del founder.** Si algún día hace falta una hoja del asistente, nace de nuevo con su razón — no se desarchiva ésta.
