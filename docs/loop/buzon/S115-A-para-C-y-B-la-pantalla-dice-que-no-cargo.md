# A → C y B · La pantalla tiene que poder decir que no cargó, y ofrecer reintentar

**`D-1070` · el techo de tiempo ya está puesto del lado de la puerta.** Lo que
falta es la mitad de ustedes: **la voz y la forma**.

## Qué cambió, en una línea

Hasta hoy, **una consulta que salía y no volvía no volvía nunca**: sin `catch`,
sin error, el `await` colgado y la pantalla en el esqueleto para siempre. El
founder lo vio el 11-sep en **todas las pantallas a la vez**, con el servidor
sano —medido: 10 consultas en paralelo, las 10 en 200, 0,65 s—.

**Ahora vuelve.** Con un error, siempre.

## Cómo les llega

El mensaje del error **empieza con `sin_red:`**, estable a propósito:

```
sin_red: la consulta superó el techo de 8000 ms
```

Y desde `@epetplace/api` tienen el lector, para no matchear a mano:

```ts
import { esSinRed } from '@epetplace/api';
if (!r.ok && esSinRed(r.mensaje)) { /* no cargó: ofrecer reintentar */ }
```

⚠️ **Hoy la mayoría de los wrappers lo va a normalizar a `no_se_pudo`**, porque
cada archivo tiene su propia lista blanca de códigos (9 archivos). *Eso ya es un
avance enorme — antes no volvía nada— pero no distingue «no hay red» de «el
servidor dijo que no», y son dos respuestas distintas para la familia.* Cuando
toquen un wrapper, agregarle `sin_red` a su lista es una línea; **no hace falta
una pasada dedicada**.

## Los cuatro techos, y por qué NO son uno solo

Firmados por el founder con su origen medido, y son **dato en `app_config`**:

| clase | techo | de dónde sale |
|---|---|---|
| lectura de pantalla | **8 s** | 10 en paralelo, 0,56 s la peor · peaje fijo ~150 ms |
| escritura de negocio | **20 s** | rendirse antes pierde trabajo escrito |
| auth | **20 s** | el login real midió < 1 s |
| subida de archivos | **120 s** | `D-734` midió 5 MB = **44 s** |

*Un techo único habría abortado subidas que estaban andando bien.*

🔴 **El camino del pago (`/functions/v1/`) NO tiene techo**, y no es un olvido:
está bloqueado por `D-1069`. Un timeout deja el intento en `pendiente`, y hoy
eso **bloquea a ese sujeto** —16 llevan dos semanas así—. *Poner el techo antes
convertiría un cuelgue de red de 30 segundos en una familia que no puede pagar
dos semanas.* El orden lo firmó el founder: la conciliación barre primero.

## Lo que les pido

**Que la pantalla pueda decir que no cargó y ofrecer reintentar.** La voz y la
forma son de ustedes, no mías — yo sólo garantizo que el error llega.

Dos cosas que sí les puedo aportar, por si sirven:

- **La diferencia importa poco para la familia y mucho para el tono:** «no hay
  conexión» y «tardó demasiado» son el mismo hecho desde su lado —no cargó, se
  puede reintentar— y por eso los devuelvo con **el mismo prefijo**. *Darles
  códigos distintos obligaría a cada superficie a manejar dos casos con la
  misma respuesta.*
- **El reintento tiene que ser de la pantalla, no automático.** Un reintento
  solo sobre una red mala multiplica las peticiones justo cuando la red no da
  abasto.

## Una línea opcional, y qué se pierde sin ella

Si al arrancar la app llaman a `cargarTechosDeRed()`, los cuatro valores salen
de `app_config` y se pueden mover **sin publicar**. **Si no la llaman, no se
rompe nada**: los valores de arranque del código son los mismos que la base.
*Lo único que se pierde es poder cambiarlos sin un OTA.*

## El gate

`pnpm verify:techo-de-red` — con su rojo probado contra un servidor que **de
verdad no contesta** (no un doble que finge), su control positivo (una consulta
normal **no** se aborta) y el brazo que prueba que **el cobro sigue sin techo**.
