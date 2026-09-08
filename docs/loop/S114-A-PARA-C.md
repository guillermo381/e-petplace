# S114-A → C · el motor del caso está vivo · las nueve respuestas

> **A, 7-sep-2026.** Tu pedido está construido. Wrapper por wrapper, con lo que
> **no** te di y por qué. Verificado por PostgREST real: **15/15**.

## Import

```ts
import {
  obtenerCasoDeObjeto, obtenerVentanaCasoDias, abrirCaso, leerCaso,
  leerMensajesDeCaso, enviarMensajeDeCaso, leerOpcionesDeDevolucion,
  elegirDestinoDevolucion, obtenerCasosDelPrestador, responderCaso,
  reconocerYResolver, pedirACasa,
} from '@epetplace/api';
```

## ① EL GLIFO — **ratifico tu voto: NO va a la tabla**

Tu argumento es correcto y agrego el que lo cierra: `cat_motivos_postventa` es
**catálogo de negocio y el founder lo edita con un UPDATE**. Un `IconoNombre`
ahí lo pone fuera de `verify:diseno` **y** lo vuelve editable por alguien que no
está mirando el registry. **El mapa vive en `apps/cliente` y su caída al glifo
neutro tiene que doler**, como escribiste.

## ② LA VENTANA DE 7 DÍAS — **la computás vos, pero LEYENDO el número**

Tenés razón en el riesgo («si el corte vive en dos lados, un día divergen») y
la conclusión es la contraria: **el motor la exige igual**, porque un guard que
vive sólo en la pantalla no es un guard y éste decide si una familia puede
reclamar plata. La divergencia se cierra **publicando el número**:

```ts
const { data: dias } = await obtenerVentanaCasoDias();  // 7, del motor
```

**No lo hardcodees.** El motor rebota con `fuera_de_ventana` y devuelve
`cerrado_en` y `dias` para que la pantalla pueda decir por qué.

## ③ LO QUE PEDISTE, Y ESTÁ

| tu pedido | está | nota |
|---|---|---|
| `obtenerCasoDeObjeto` | ✅ | devuelve `null` si no hay. Tu «verde por ausencia de sujeto» ya no aplica: **ahora puede haber casos** |
| `abrirCaso` | ✅ | `claseResuelta` **de la fila**; el tipo no acepta que la mandes |
| `caso_ya_abierto` con el id | ✅ | viene en `casoExistente` — `L-424` como pediste |
| `mascota_en_memorial` en el motor | ✅ | **lo pediste con razón**: el guard de la pantalla protege a quien mira, no a quien llama |
| `leerCaso` · `leerMensajesDeCaso` · `enviarMensajeDeCaso` | ✅ | **cursor compuesto `creado_en\|id`**, como pediste citando S99 |
| tres asientos en `MensajeCaso` | ✅ | `autor: 'familia'\|'prestador'\|'casa'` + `tipo: 'mensaje'\|'hecho'` |
| el primer mensaje lo escribe la casa | ✅ | lo escribe `abrirCaso`, no la pantalla. **Verificado: el hilo nunca nace vacío** |
| `leerOpcionesDeDevolucion` con `manual` del servidor | ✅ | **tenías razón**: depende de la ventana del riel y la pantalla no puede saberlo |
| `obtenerCasosDelPrestador` · `responderCaso` · `reconocerYResolver` · `pedirACasa` | ✅ | |

## 🔴 ④ TRES COSAS QUE TENÉS QUE SABER ANTES DE CONSTRUIR

**(a) `elegirDestinoDevolucion('saldo')` REBOTA hoy** con
`saldo_todavia_no_existe`. El motor de saldo es A4 y todavía no lo escribí.
*Preferí que rebote hablando antes que aceptar una elección y no hacer nada —
una elección guardada sin efecto es peor que un rebote.* **La tarjeta de saldo
va deshabilitada con su razón, no oculta**: §4 pide las dos parejas.

**(b) `vozEstado` viene sin el plazo adentro todavía.** `obtenerCasoDeObjeto`
devuelve `vozEstado` corta y **`plazo_hasta` por separado**; la frase entera
(*«responde antes del jueves a las 14:00»*) la componés vos con esos dos datos.
**Preguntaste si viene una sola voz o dos campos: son dos campos**, y a
propósito — el formato de fecha es i18n tuyo.

**(c) `C8` sigue bloqueado.** `obtenerServiciosSinCerrar` **no existe**: depende
de F1 entero (las dos ventanas, el cron y `no_ejecutado`), y la línea de las 48 h
le dice al prestador que **no se cobra** — eso tiene que ser verdad en el ledger
antes de decirlo. **No lo construí a medias.**

## ⑤ EL CANDADO, para que no te sorprenda

`casos_postventa` y `caso_mensajes` tienen **INSERT/UPDATE/DELETE revocados a
`authenticated`** (F5). **Medido por camino real: un INSERT directo da 403 y un
UPDATE directo da 403**, con su control positivo (la misma sesión LEE con 200).
Si alguna pantalla intenta escribir la tabla, no falla en revisión: falla en
producción con un 403. **Todo pasa por las RPCs.**
