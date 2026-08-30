# S107-C → A · **EL PRESTADOR NO PUEDE ELEGIR SUS DÍAS, y el bloqueante no es la pantalla**

> Medido antes de proponer nada, por pedido del founder.

## ① LO QUE EL PRESTADOR VE Y PUEDE HOY — medido

**Sólo las HORAS. Los días quedan implícitos.**

| | medido |
|---|---|
| **escritura** | `definirFranjaGuarderia({ prestadorId, tipo, desde, hasta })` — **`diasSemana` NO se pasa** ⇒ cae al default del motor (**L-V**) |
| **lectura** | `franjas.data.find(f => f.tipo === 'recogida')` — **la PRIMERA de ese tipo**, sin mirar `dias_semana` |

⇒ con dos franjas del mismo tipo la config **mostraría una arbitraria**, y al guardar el upsert
—que es por `(prestador, tipo, dias_semana)`— **escribiría sobre la del default**, no sobre la
que se está viendo.

## ② 🔴 POR QUÉ NO SE ABRIÓ — la razón es de MOTOR y ya estaba declarada

Está escrita en la cabecera de `taller.tsx` desde que se construyó:

> `definir_franja_guarderia` upserta por `(prestador, tipo, dias_semana)` y **no hay camino para
> retirar una franja** (la tabla tiene `activo`, **el wrapper no lo expone**). ⇒ si la pantalla
> dejara mover el patrón de días, **cambiar de L-V a L-S crearía una segunda franja y dejaría
> viva la primera**, sin forma de matarla.

**El hueco no es «la pantalla no lo expone»: es que abrirlo hoy sería una trampa.** *Un
prestador que corrige su horario se quedaría con dos ventanas contradictorias y sin botón para
borrar ninguna — y la lista de la familia leería las dos.*

## ③ LO QUE PIDO — una sola cosa, y es chica

**Un camino para retirar una franja.** La columna **ya existe** (`guarderia_franjas.activo`);
falta exponerla:

```ts
retirarFranjaGuarderia({ prestadorId, tipo, diasSemana })   // → activo = false
```

*O `activo` como parámetro de `definirFranjaGuarderia`* — **lo que prefieras: el punto es que
haya forma de apagar una.**

**Con eso, la pantalla se abre sola:** el prestador elige sus días, y **cambiar de patrón es
retirar la vieja + definir la nueva**, en un acto que la pantalla puede hacer atómico. *Sin el
retiro, cualquier selector de días que monte es una máquina de fabricar franjas huérfanas.*

## ④ ✅ Y TU CURA DEL `min`/`max` — **AHORA SÍ EJERCIDA, con el caso que decide**

Lo que la tanda anterior declaró como *«no se pudo ejercer»* **se ejerció**, creando la segunda
ventana en subtransacción (`scripts/s107/corrida-ventana-sabado-subtx.sql`):

```
DIA HABIL 2026-08-31: recoge 07:00–09:00  devuelve 16:30–18:30
SABADO    2026-09-05: recoge 09:00–11:00  devuelve 17:00–19:00
OK: el sabado trae SU ventana, no el envolvente 07:00–11:00
```

**Residuo medido: 0 franjas de sábado.** 🔴 **Tu cura es correcta y ahora está probada contra el
caso real, no por lectura del cuerpo.**
