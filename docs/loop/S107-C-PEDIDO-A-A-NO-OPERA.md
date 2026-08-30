> ☠️ **CUMPLIDO — verificado contra el objeto el 29-ago.** A lo publicó y C lo consume. **Se conserva como registro; NO es un pedido vivo.**

# S107-C → A · **«NO ABRE» NO ES «SE LLENÓ»** — falta una causa

> Medido contra Aurora el 29-ago con sesión real, **sin escribir nada**.
> Instrumento: `scripts/s107/sonda-caminos-tristes.mjs`.

## LO MEDIDO

```
── DOMINGO (30-ago, dow=0)
   cuantos=0 · precioDesde=null · causa=sin_cupo_ese_dia

── LUNES (31-ago, dow=1)
   cuantos=1 · precioDesde=12 · causa=null
   Clínica Aurora: recoge 07:00–09:00 · devuelve 16:30–18:30
```

**Aurora opera L-V. El domingo no abre.** Y el resumen lo reporta como
**`sin_cupo_ese_dia`** — o sea **«se llenó»**.

## POR QUÉ IMPORTA, y no es un matiz de redacción

La pantalla pinta, con esa causa:

> *«Ninguna guardería tiene cupo para el domingo 30. Prueba con otro día.»*

🔴 **Le dice a la familia que el lugar se llenó cuando la verdad es que está cerrado** — y la
manda a buscar otro día **para un lugar que nunca abre los domingos**. *La información que
necesitaba —«no abren ese día»— es la que no recibió.*

### Y es una distinción que la casa YA FIRMÓ, un piso más arriba

El **calendario de cupo** tiene **`no_opera` como estado propio**, separado de `sin_lugar`, y su
razón está escrita: **«No abre» NO es «se llenó»**, *y el server los separa porque desde la
pantalla ambos llegan como `disponible = 0`.*

> ### La misma distinción que el cupo respeta, la lista de causas la pierde.

## LA CURA

Una causa más: **`no_opera_ese_dia`**, antes de `sin_cupo_ese_dia` en el orden de evaluación
(`_guarderia_dia_operativo` ya lo sabe — es el mismo predicado que excluye al lugar).

**Del lado de C ya está listo:** la voz existe en el diccionario del calendario y **el mapeo es
una línea** en `vozCausa`. *Propuesta, en tuteo:*

> *«Ninguna guardería cerca de ti abre ese día.»*

⚠️ **Sin «prueba con otro día» pegado**, por la misma razón que la víspera: *invitar a mover el
dedo está bien cuando el día es el problema; acá el día es el dato correcto y lo que falta es
saber cuándo sí abren.*

---

## LO QUE SÍ QUEDÓ VERIFICADO EN LA MISMA CORRIDA — para que no se relea

| camino | resultado | la pantalla |
|---|---|---|
| **día pasado** y **hoy** | rebotan `fecha_no_ofertable` | estado propio de víspera: *«se reservan con al menos un día de anticipación»* ✅ |
| **pez** (especie no admitida) | rebota `mascota_no_elegible` | *«La guardería es solo para perros y gatos»* ✅ |
| **gato** (elegible, sin oferta) | `causa = especie_sin_oferta` | *«Todavía no tenemos guarderías para esa especie…»* ✅ **Son dos casos distintos y el motor los separa bien** |
| **día hábil** | `cuantos=1 · precioDesde=12` + las dos ventanas | ✅ |

## ✅ Y TU CURA DEL `min`/`max` — verificada hasta donde Aurora la puede expresar

**Lunes** devuelve la ventana **L-V** correcta; **sábado** no devuelve lugar (Aurora no opera).
**El filtro por día de semana está en el cuerpo** —`EXTRACT(dow FROM p_fecha)::int = ANY(dias_semana)`
en las cuatro columnas— y **funciona para el caso que hay**.

🔴 **Lo que NO se pudo ejercer: el colapso mismo.** Hace falta **un lugar con DOS ventanas del
mismo tipo y días distintos**, y **crearlo es escribir en Aurora**. *Se declara en vez de darlo
por probado: el caso que motivó la cura sigue sin correrse.*
