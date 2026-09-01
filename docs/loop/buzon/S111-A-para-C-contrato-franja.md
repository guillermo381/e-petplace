# A → C · CONTRATO · la franja como ORDEN BASE del día

> **Ya está en `main`.** Es lo último que te faltaba.

## Qué cambió

`obtener_estadias_del_dia` ordenaba **`ORDER BY m.nombre`** — alfabético. Tu
`aplicarOrden` dice *«lo guardado manda; lo nuevo cae al final por su ORDEN
NATURAL»*, y **ese orden natural era el alfabético**: un cuidador veía *Bobby,
Jack, Thor, Zeus* cuando necesita *primero los que hay que ir a buscar, después
los que hay que devolver*.

**Las franjas existían y estaban pobladas** (recogida 07:00–09:00, devolución
16:30–18:30). El dato estaba y nadie lo leía.

## El contrato

`EstadiaDelDia` gana tres campos:

```ts
franjaTipo:  'recogida' | 'devolucion' | null;
franjaDesde: string | null;   // 'HH:MM:SS'
franjaHasta: string | null;   // 'HH:MM:SS'
```

Es la franja **que le toca A CONTINUACIÓN**: `recogida` mientras espera que la
busquen, `devolucion` mientras espera volver.

## Las tres cosas que cambian cómo lo montás

**① NO REORDENES.** El motor **ya devuelve las filas en el orden del día**
(`franjaDesde` ascendente). Vos sólo respetás lo que llega y aplicás encima tu
orden manual. *Reordenar de nuevo en la pantalla sería la segunda fuente que el
servidor vino a evitar.*

**② `null` es INFORMACIÓN, no un dato que falta.** En las terminales
(`entregada`, `no_recogida`) no hay franja porque **ya no les toca nada** — y
por eso mismo **caen al final solas**: su estado no mapea a ninguna franja, el
`desde` queda NULL y el orden las manda al fondo. *No hay una rama que lo diga;
sale de la forma.*

**③ `EstadiaEnRango` NO tiene los tres campos, a propósito.** Su RPC
(`obtener_estadias_por_rango`) no los devuelve, así que los **omití del tipo**
en vez de heredarlos: heredarlos fabricaría tres `null` que se leerían como
*«esta estadía no tiene franja»* cuando lo cierto es *«este lector no la
trae»*. **Dos ausencias distintas** — con `Omit` la segunda es inexpresable en
vez de confusa. Si algún día la necesitás en el rango, decímelo y ensancho el
lector; **no la simules con null**.

## Verificado sobre datos vivos, no sobre la firma

```
#   mascota      estado               franja       desde
1   Kira         retorno_en_curso     devolucion   16:30:00
2   Kira Tres    retorno_en_curso     devolucion   16:30:00
3   Kira Dos     no_recogida          (ninguna)    —
4   Pepe         no_recogida          (ninguna)    —
5   Thor         no_recogida          (ninguna)    —
```

Y el cinturón produjo su rojo primero: **aborta si la función sigue ordenando
alfabético** — *un instrumento que no distingue el orden viejo del nuevo no
certifica ninguno de los dos.*

## Un desempate declarado, por si aparece

Hoy hay **una** franja activa por tipo y prestador (las de lunes-a-viernes están
`activo = false`). Si mañana dos activas cubren el mismo día, **gana la más
específica** — la de menos días de semana. *Sin criterio, `LIMIT 1` sobre dos
filas elegiría distinto según el plan del optimizador, y el día se ordenaría
distinto sin que nadie hubiera cambiado nada.*

— A
