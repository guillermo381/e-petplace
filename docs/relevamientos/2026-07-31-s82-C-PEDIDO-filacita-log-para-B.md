# PEDIDO A B — `FilaCita` NO CUBRE LA FILA DEL LOG

> **De C a B, autocontenido** (regla S54). **C NO lo construye:
> `packages/ui` es frontera cerrada para esta pista — y el founder fue
> explícito: *"Es FilaCita o su variante — consumí la pieza, no cuatro
> copias. Si FilaCita no cubre esta anatomía, es pedido a B, no un clon
> local."***
> Origen: gate del founder S82 r40 — la fila del log divergió en los
> cuatro oficios y pidió EL ESTÁNDAR antes de curar pantalla por pantalla.

---

## 1 · LA ANATOMÍA QUE EL FOUNDER FIJÓ (una sola para los cuatro)

1. **SIN chip de mascota con foto.** El log ya filtra por mascota arriba
   y la fila dice el nombre en el título ("Adiestramiento de Zeus"). La
   cara repetida en cada fila no informa: es la misma en todas.
2. **Fecha y duración en su lugar, SIN ocupar todo el ancho.**
3. **Estado SOLO cuando dice algo.** "espera fecha" en vet **sí**;
   "confirmada" en una cita normal es **ruido**; y "completada" en una
   cita futura es **un dato mintiendo**.
4. **La FLECHA, y una de las dos SIEMPRE:** chevron **abajo** si la fila
   despliega · chevron **derecha** si navega. Hoy unas la tienen y otras
   no, *"y el usuario no sabe qué se puede tocar"*.

## 2 · POR QUÉ `FilaCita` NO ALCANZA — medido en su contrato

```ts
export interface FilaCitaProps {
  oficio: FilaCitaOficio
  titulo: string
  subtitulo?: string
  metadataMono?: string
  /** La cara: el avatar se compone ADENTRO (huella digna sin foto). */
  mascota: { nombre: string; fotoUrl?: string; especie?: AvatarMascotaEspecie }
  fin?: ReactNode
  acciones?: ReactNode
  onPress: () => void
}
```

- **`mascota` es OBLIGATORIA y el avatar se compone ADENTRO** — o sea que
  `FilaCita` **siempre** pinta la cara. El punto ① de la anatomía la
  quita. No hay prop para apagarla, y apagarla desde afuera es imposible
  por diseño (es su firma: *"el canto adentro, cero prop de color"*).
- **No hay chevron.** La pieza delega en `Celda`, que no lo monta; el
  punto ④ lo exige **siempre**, en una de sus dos direcciones.

O sea: **dos de los cuatro puntos son del componente, no del consumidor.**
Por eso no lo curo desde las pantallas: sería la quinta copia de una fila
que ya tiene dueño — exactamente lo que el founder prohibió.

## 3 · LO QUE C PROPONE (y B decide)

Una variante del mismo componente, no una pieza nueva:

- **`cara?: boolean` (default `true`)** — con `false` la fila no monta el
  avatar y `mascota` pasa a servir solo para la voz. Default intacto:
  cero consumidores existentes cambian.
- **`direccion: 'despliega' | 'navega'`** — monta el chevron ⌄ o ›
  según el caso, con la misma letra de la Ley 19.7 que ya rige
  (`›` navega · `⌄` revela · `⌃` pliega). **Sin default**, para que cada
  consumidor lo DECLARE: una fila sin dirección declarada es justamente
  el defecto que el founder describió.

**Lo que NO pido:** un slot de estado. El punto ③ es del CONSUMIDOR —
`fin` ya existe y la pantalla decide si monta algo. Lo que falla hoy no
es la pieza: es que las pantallas pintan literales.

## 4 · LO QUE C YA CURÓ, SIN TOCAR LA PIEZA

- 🔴 **grooming: el dato que mentía.** El mismo renderer servía a las dos
  listas y pintaba `"completada"` HARDCODEADO — una cita de las 2 de la
  tarde de HOY se anunciaba cerrada. **El lector no traía mal el estado:
  la fila pintaba un literal.** Es de C (r31). Ahora el chip solo se
  monta si la cita cerró.
- **paseo: la segunda columna que no se leía.** Es el slot `metadataMono`
  de `Celda` —columna alineada a la DERECHA, para dato de máquina
  CORTO— y C le había metido fecha + hora + duración (r39-5). Tres datos
  en una columna angosta compiten con el título y ninguno gana. Repartido:
  el cuándo corto en la columna, la duración al subtítulo.

## 5 · LO QUE QUEDA BLOQUEADO HASTA LA VARIANTE

Los puntos ① y ④ en los CUATRO logs. C no los ejecuta con clones
locales: se consumen el día que la variante exista, y ese día es **un
renglón por log**.
