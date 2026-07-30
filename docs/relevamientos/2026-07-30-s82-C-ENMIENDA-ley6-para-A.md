# ENMIENDA A LA LEY 6 — LA MARCA DEL ESTADO EN UN FILTRO

> **Para A, a depositar junto con las otras enmiendas de la sesión.**
> Firmada por el founder en dispositivo, S82 (30 jul 2026), sobre las dos
> candidatas montadas lado a lado en la misma pantalla.
> Origen del pedido: S82-C r17 (el founder propone la huella) → r18 (firma).
> **Gana (b): la huella marca el chip elegido.**

---

## 1 · QUÉ DECÍA LA FRONTERA VIGENTE (y no se toca por arrastre)

La distinción actual **no es** "huella = tabs / línea = filtros". Su
literal vive en `apps/prestador/src/components/filtro-oficio.tsx`
(S80-B15, firmada por el founder) y dice:

> *"en TABS la huella marca el estado (Ley 6 §2.6, intacta); en FILTROS
> la huella está SIEMPRE (es identidad del glifo) y **el estado lo marca
> UNA LÍNEA QUE VIAJA** — no recuadro, no pill; una línea que viaja
> cumple §9.6 por construcción (se ve de dónde viene y a dónde llega)."*

Con su porqué medido, también del founder en dispositivo:

> *"la huella sola no leía"*.

## 2 · QUÉ SE ENMIENDA

**En un filtro, el estado lo puede marcar LA HUELLA — y cuando lo hace,
la huella aparece SOLO EN LA OPCIÓN ELEGIDA.**

La línea que viaja **no se deroga**: sigue vigente donde la huella no
puede marcar (ver §4). Lo que se enmienda es la exclusividad: hasta hoy
la línea era el ÚNICO marcador legal de estado en un filtro.

## 3 · EL PORQUÉ — POR QUÉ NO ES EL MISMO INTENTO DOS VECES

Esta es la parte que la enmienda existe para dejar escrita, porque sin
ella el veredicto de S80 parece contradecir la firma de S82.

**El veredicto de S80 midió que la huella sola no leía — pero ahí la
huella estaba en TODAS las opciones**, como identidad del glifo (los
glifos b′ llevan una huella rellena por Ley 12). Una marca presente en
todos los hermanos no puede señalar a uno: no falló *la huella*, falló
*la huella como constante*. Por eso hizo falta la posición, y la
posición la da la línea.

**En (b) la huella aparece SOLO en la elegida.** Marca por PRESENCIA, que
es justamente lo que no podía hacer cuando estaba en todas. **Es otro
mecanismo, no el mismo dos veces.**

Y resuelve de raíz el problema que abrió la ronda: **un eje sin
categoría no tiene color propio** (próximos/historial es ESTADO,
todos/semana/mes es TIEMPO; solo el eje de SERVICIO tiene categorías,
Ley 10). Marcar con color obligaba a pedir prestado un verde de capa que
no le correspondía. **La forma no se pide prestada.**

## 4 · ALCANCE — DÓNDE RIGE CADA UNA

| | marca del estado | por qué |
|---|---|---|
| **Filtro del cliente** (`FiltroPills`) | **la huella**, solo en la elegida | sus ejes no tienen categoría; la huella marca por forma |
| **Filtro de oficio del prestador** (`filtro-oficio`) | **la línea que viaja** | ahí cada opción ES un oficio y su glifo b′ ya lleva huella: la huella no puede marcar una sin estar en todas |
| **Tabs** (`BarraTabs`, §2.6) | **la huella** | INTACTO, no se toca |

**Divergencia declarada, no escondida:** las dos apps marcan el estado de
un filtro de manera distinta. Es legítimo porque la restricción es
distinta —el prestador filtra por oficio y sus glifos ya portan huella—,
pero **es divergencia y se declara**. Unificarlas sería otra decisión,
con su costo: tocar un filtro del prestador ya construido, firmado y
gateado.

## 5 · LA CONDICIÓN QUE HACE QUE (b) FUNCIONE — y que puede romperse sola

Los glifos b′ **contienen** una huella rellena (Ley 12). O sea que en un
chip con glifo hay DOS huellas: la del objeto y la de la marca. Lo que
las mantiene distinguibles es **escala y aislamiento**:

- dentro del glifo, a 16 px y adentro de la placa, la huella es un
  DETALLE DEL OBJETO;
- sola, a 13 px, al lado del label y fuera de la placa, es una MARCA.

**Corolario exigible: la huella de marca NUNCA va adentro de la placa.**
El día que alguien la meta ahí, vuelve a ser el caso de S80 — una huella
más entre huellas — y (b) deja de leerse sin que nadie haya cambiado la
ley.

## 6 · LO QUE MURIÓ CON LA FIRMA (Ley 37)

- **La línea viajera del filtro del CLIENTE** y su maquinaria (marcos por
  `onLayout`, shared values, física). Vive intacta en el prestador.
- **El relleno pleno del chip sin glifo** (nacido en S82-C r14-2 como
  sustituto: no había placa que rellenar). Con una marca que no depende
  del glifo, el sustituto sobra — **dos marcas para un mismo estado es el
  tercer peso que no informa** (Ley 18 + regla Chanel). Y era, otra vez,
  pedirle prestado un color a un eje sin categoría.
- El andamio de comparación (a)/(b) de la pantalla del log.

## 7 · LO QUE NO CAMBIA

- Ley 6 §2.6 (la huella en tabs): **intacta**.
- El eje de SERVICIO conserva el color de su capa en la placa del glifo:
  **ahí sí hay categorías** (Ley 10).
- La placa del elegido sigue rellenándose —en tinta si el eje no tiene
  categoría, en su color de capa si la tiene—; lo que se agrega es la
  huella.
- Cero contorno, en cualquier caso (A6).
