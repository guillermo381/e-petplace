# A → C · LA BURBUJA DE PENDIENTES — el motor, por nombre

> Entregado 3-sep. Motor aplicado, medido por camino real, tipos regenerados,
> tres typechecks en 0. **Nada de esto está montado: la puerta es tuya.**

---

## ① `contarPendientes()` — un viaje para toda la barra

```ts
import { contarPendientes, type Pendientes } from '@epetplace/api';

const r = await contarPendientes();
if (r.ok) {
  r.data.mensajesSinLeer;        // number  — los DOS lados de la misma cuenta
  r.data.hilosConSinLeer;        // string[] — ids de hilo, para el punto en la fila
  r.data.solicitudesPorRevisar;  // number  — sólo tiene sentido si publicás
}
```

**Rebota** con `codigo: 'sin_sesion'` si no hay sesión.

**Lo que NO trae, a propósito:** el número **por hilo**. Ya viaja en
`obtenerMisSolicitudesAdopcion` / `obtenerSolicitudesDeMisPublicaciones`, fila
por fila. *Mandarlo dos veces por caminos distintos es fabricar una divergencia
donde la burbuja diría un número y la lista otro.*

⚠️ **`solicitudesPorRevisar` sale de la MISMA función que ya usás** en
`(tabs)/adopcion/index.tsx` (`contarSolicitudesPorRevisar`). No son dos fuentes:
`contar_pendientes` la llama por dentro. Si la pantalla del refugio ya está
abierta y ya tiene ese número, **no lo pidas otra vez** — la burbuja es para
cuando la lista NO está cargada.

---

## ② `suscribirseAMisHilos(onCambio)` — UNA por sesión

```ts
import { suscribirseAMisHilos, type CambioEnMisHilos } from '@epetplace/api';

const cortar = suscribirseAMisHilos((c) => {
  if (c.tipo === 'mensaje' && c.esMio) return;   // no parpadees por lo tuyo
  refrescarContador();                            // un solo camino para los tres
});
// al CERRAR SESIÓN, no al salir de una pantalla:
cortar();
```

`CambioEnMisHilos` es una unión de tres:

| `tipo` | cuándo | qué trae |
|---|---|---|
| `'mensaje'` | llegó un mensaje a cualquier hilo tuyo | `solicitudId`, `esMio` |
| `'lectura'` | se marcó leído (**incluye tu otro aparato**) | `solicitudId` |
| `'reconectado'` | conectó o **volvió** de una caída | — |

🔴 **`'reconectado'` no es ruido, es la mitad que hace que la burbuja no mienta.**
En un teléfono el socket se cae cada vez que la pantalla se apaga, y **lo que
pasó en el hueco no llega nunca**. Sin refrescar ahí, la burbuja queda con el
número de antes de dormir y se lee como si fuera el de ahora. Llega **también
en la primera conexión**, a propósito: así tenés **un solo camino** y la carga
inicial sale gratis del mismo lugar.

**Es UNA suscripción, no una por hilo** — `postgres_changes` sólo filtra por
igualdad de una columna, así que **no lleva filtro y la RLS elige qué entregar**.

---

## ③ Lo que se midió antes de entregarte esto

`pnpm verify:mis-hilos-realtime` (**escribe una sonda y la borra — no va al
hook**):

```
socket   · familia=1 · refugio=1 · tercero=0 · residuo=0
contador · anon=rebotado — permission denied for function contar_pendientes
contador · familia={"mensajes_sin_leer":1,"hilos_con_sin_leer":["ebb3b9df…"],…}
           tercero={"mensajes_sin_leer":0,"hilos_con_sin_leer":[],…}
```

Tres cosas que quiero que sepas de esa corrida:

1. **El tercero es el mismo objeto que los participantes.** Si el socket no
   hubiera conectado, los tres darían 0. Que familia y refugio den 1 en la
   misma corrida es lo que convierte ese 0 en una medición.
2. **El contador se mide con la sonda VIVA.** Con los hilos al día la familia y
   un extraño devuelven los dos `0` — dos ceros que se leen como verde y no
   distinguen «correcto» de «roto».
3. **La variante obvia estaba mal.** `contar_pendientes` es `SECURITY INVOKER`,
   no `DEFINER` como el resto de la casa: con `DEFINER` el control le mostró a
   un tercero **los 6 mensajes de la casa**. La puerta es la misma RLS que
   sirve los mensajes, y así no puede divergir de sí misma.

---

## ④ Y una que es tuya y la encontraste vos

Tu medición de que **el refugio nunca llamaba `marcarHiloLeido`** es la que hace
que esto sirva: sin eso su contador **sólo podía subir**. No se veía porque no
había burbuja — *con la burbuja habría sido un número que crece y no baja*.
Queda anotado como lo que era: un defecto real que sólo aparece cuando algo lo
mira.
