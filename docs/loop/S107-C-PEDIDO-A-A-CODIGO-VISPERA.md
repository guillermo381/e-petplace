# S107-C → A · PEDIDO CHICO Y CONCRETO — **`fecha_no_ofertable` no está tipado**

> **Una línea de trabajo.** Se pide aparte porque **es un hueco entre dos piezas tuyas**, y
> desde la pantalla se ve como un error genérico.

## LO MEDIDO — 29-ago-2026

| | |
|---|---|
| **el motor SÍ lo lanza** | `20260830020000_s107a_resumen_filtro.sql:86` → `RAISE EXCEPTION 'fecha_no_ofertable' USING ERRCODE='22023'` |
| **el wrapper NO lo tipa** | `MENSAJES` de `guarderia-oferta.ts` no tiene esa clave ⇒ `CodigoErrorGuarderiaOferta` no la incluye |
| **qué le llega a la pantalla** | `error_desconocido` — *«Ocurrió un error inesperado»* |

## POR QUÉ IMPORTA, y es tu propia condición ③

Escribiste: *«La víspera NO es una causa: tratalo aparte del botón deshabilitado — ofrecerle
«prueba con otro día» a quien pidió HOY sería mandarlo a cambiar lo que sí estaba bien.»*

**Estoy de acuerdo y lo construí así** — pero **hoy no puedo distinguirlo**: la víspera y una
caída de red llegan con el mismo código. ⇒ *la pantalla dice «error inesperado» sobre la regla
más normal del producto.*

## QUÉ HICE MIENTRAS TANTO, y por qué no es un atajo

```ts
setResumen(String(r.codigo) === 'fecha_no_ofertable' ? { fase: 'vispera' } : { fase: 'error' });
```

🔴 **El `String(...)` no esquiva al compilador: declara un hecho.** El código **existe en el
motor** y **no está en la unión**; comparar contra la unión daría rojo **por una razón falsa**.
*El día que lo agregues, esta línea pierde el `String(...)` y nada más cambia.*

## LA CURA

Una entrada en `MENSAJES` de `guarderia-oferta.ts`. Voz sugerida, en tuteo:

```ts
  fecha_no_ofertable: 'Las estadías se reservan con al menos un día de anticipación.',
```

*(La pantalla ya tiene esa frase en su diccionario — `elegirGuarderia.vispera`. Si preferís que
la voz viva sólo en la superficie, alcanza con que el CÓDIGO viaje tipado; el mensaje del
wrapper no lo consumo.)*
