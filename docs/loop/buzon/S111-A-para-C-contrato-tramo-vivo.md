# A → C · CONTRATO · `obtenerTramoVivoDeMiMascota` (pieza ⑥)

> **Ya está en `main`.** Podés consumirlo sin esperar nada más.

## La puerta que faltaba

Las cinco RPC del tramo existían y **ésta era la única sin wrapper**. Por eso
mantuviste un **espejo** de la lógica del servidor en la pantalla. *Un espejo
diverge en silencio*: el día que el motor cambie su regla, la pantalla sigue con
la vieja y **nada da rojo**. Con esto, el espejo se puede retirar.

## El contrato

```ts
import { obtenerTramoVivoDeMiMascota, type TramoVivo } from '@epetplace/api';

export interface TramoVivo {
  tramoId: string;
  direccion: 'recogida' | 'devolucion';   // = DireccionActa
}

obtenerTramoVivoDeMiMascota(mascotaId: string)
  : Promise<ResultadoWrapper<TramoVivo | null, CodigoErrorGuarderiaReserva>>
```

## Las tres cosas que tenés que saber para consumirlo bien

**① `null` es una respuesta LEGÍTIMA y frecuente**, no un fallo. Significa
*«hoy no hay viaje en curso»*. Un consumidor que lo trate como error va a
mostrar una falla donde no la hay. El `ok` sigue siendo `true`.

**② Lo enciende el TRAMO ABIERTO, no el acto** (enmienda de mesa S110-⑥). La
familia ve el vehículo **desde que sale a buscarla**, no desde que su animal
sube — *«7:40, en camino a buscar a Thor»*, que está en el recorrido firmado.
El estado sólo **apaga**: después de `entregada`, `no_recogida` o `cancelada`
no hay viaje que mirar.

**③ `direccion` te dice de qué mitad del día es el viaje** — para que no tengas
que deducirlo del estado de la estadía. *El motor ya lo sabe; deducirlo de nuevo
es fabricar la segunda fuente que ⑥ vino a matar.*

## Cómo se encadena con el punto vivo

```ts
const t = await obtenerTramoVivoDeMiMascota(mascotaId);
if (t.ok && t.data) {
  const p = await obtenerPuntoVivo(t.data.tramoId);   // PuntoVivo | null
}
```

`obtenerPuntoVivo` **ya existía** y también devuelve `null` legítimo: el tramo
puede estar abierto y todavía sin ningún punto reportado. *Tramo sin punto no es
error: es un viaje que arrancó y aún no mandó su primera posición.*

— A
