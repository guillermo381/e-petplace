# S112-A · CENSO DE LOS ESCRITORES DE `consentimientos` — ¿quién captura la IP?

> **Depositado porque el founder lo pidió («CURAR NO ES CENSAR») y sólo vivía en
> la conversación.** Medido contra la base el 2-sep-2026.

## DE DÓNDE SALE: C SE NEGÓ A RELLENAR UN CAMPO

Monté `aceptar_documento_adopcion` con `p_ip_hash` como parámetro del cliente.
C montó la pantalla y **no lo mandó**, con su razón:

> *«la app no conoce la IP, y fabricar un hash de algo que no conozco sería
> inventar evidencia legal»*

Tiene razón. Y lo que eso destapa no es un campo vacío:

> ### *Un campo que sólo puede llenar quien no lo conoce no se llena nunca.* **Y su modo de falla es el peor: la fila existe, se ve completa, y el dato falta.**

## EL CENSO — SEIS LUGARES, UNO CAPTURA

| # | escritor | dónde | ¿captura IP? | veredicto |
|---|---|---|---|---|
| 1 | `aceptar_documento_adopcion` | motor, DEFINER | 🟢 **SÍ** | curado el 2-sep: lee `x-forwarded-for` server-side y lo guarda hasheado |
| 2 | `crear_bloqueo_agenda` | motor, DEFINER | 🔴 **NULL** | escribe el consentimiento de **teleconsulta** — 30 filas, 0 con IP. **CURABLE con las mismas cuatro líneas**: es motor y el header le llega igual |
| 3 | `registrarConsentimientos` (`packages/api/src/wrappers/auth.ts:381`) | **APP, `insert` directo** | 🔴 **NULL, y NO PUEDE** | 8 filas `origen: app`. El cliente no conoce su IP. **Es el camino del registro y del alta: el consentimiento más usado de la casa** |
| 4 | `registrar_consentimiento_de_alta` | motor | ⚪ n/a | **medido: NO inserta.** Camino del invitado por enlace, declarado vivo y sin uso |
| 5 | `auth-google.ts:83` | APP | ⚪ n/a | **sólo lee** (`select count`) para no duplicar; su escritura pasa por el #3 |
| 6 | `consultarConsentimiento` (`auth.ts:632`) | APP | ⚪ n/a | **sólo lee** |

**Las 97 filas por origen:** 59 `registro` sin metadata (anteriores a la
convención) · 30 `teleconsulta` del #2 · 8 `origen: app` del #3.
**Cero con IP en las tres.** Medido: `grep` de `ip_hash` en los wrappers de la
app da **0** — ninguno lo manda jamás.

## LO QUE EL CENSO CAMBIA

**No son «escritores que se olvidaron del campo»: son DOS CLASES distintas.**

- **El #2 es un olvido curable** — mismo patrón, mismo lugar, cuesta un bloque.
- 🔴 **El #3 NO se cura recordándolo.** Mientras el `insert` viva en el cliente,
  la IP es **inalcanzable por construcción**. Curarlo significa **mover esa
  escritura detrás de una RPC** — que es exactamente lo que la puerta única
  manda y que ese camino se saltea.

## POR QUÉ NO LOS CURÉ

El #2 es teleconsulta y el #3 toca el alta de **las dos apps**. **Ninguno es
adopción**, y meter mano al camino de registro con un lote recién publicado y
cuatro pistas en vuelo **cambia el riesgo de lugar, no lo baja.** Quedan con su
costo nombrado: el #2 es un bloque; el #3 es una RPC nueva más el retiro del
insert directo.

> ### ⇒ La promesa de `P23` —poder demostrar qué aceptó cada quien, con su evidencia— **hoy se cumple entera en UN camino de los tres que escriben**, y es el que nació esta noche.

## LA TRAMPA DE MEDICIÓN QUE ESTE CENSO PAGÓ

🔴 **Mi primera medición dijo que la IP no se podía capturar.**
`current_setting('request.headers')` me daba NULL… **porque yo medía por la
Management API, no por PostgREST.** Por el camino real, con un JWT de verdad,
`x-forwarded-for` devolvió una IP pública.

*Era un falso negativo de mi instrumento* — la misma familia que el
`router.d.ts` viejo (`L-479`) y el `tsc` sin dependencias (`L-480`).
**Si hubiera creído mi propia medición, habría dejado el campo sin cura con una
justificación técnica que sonaba correcta.**
