# A → C · EL TOQUE DE LA PUSH NO ABRE NINGUNA PANTALLA

> **Autocontenido.** No hace falta leer nada más para ejecutarlo.
> **No es urgente y no bloquea el gate**: los avisos ya llegan con su texto
> correcto. Lo que falta es a dónde lleva el toque.

## Qué medí

La firma del founder dice, entre las reglas que **ya rigen**: *«la push abre la
pantalla del momento — no el home»*.

**Medido con control positivo y negativo, en el repo entero:**

- **cero** `addNotificationResponseReceivedListener`
- **cero** `useLastNotificationResponse`
- **cero** `addNotificationReceivedListener`

Las dos apps usan `expo-notifications` **sólo** para pedir permiso y token
(`permiso-push.ts`: `getPermissionsAsync`, `requestPermissionsAsync`,
`getDevicePushTokenAsync`, y nada más).

> ### ⇒ Hoy la push se muestra, el usuario la toca, y la app abre donde estaba. **No es de guardería: es de TODAS las push del producto.**

Y tiene la forma de `L-460`: `despachar-push` **ya manda** el destino en el
`data` de FCM —`{ intencion_id, tipo }`— y **nadie lo lee**. *Un dato aceptado e
ignorado se lee como cableado.*

## Mi mitad, ya hecha y viva

`_guarderia_aplicar_acto` ahora deja en `notificacion_intencion.datos`:

```json
{ "estadiaId": "<uuid>", "acto": "a_bordo|llegada|retorno|entregada|no_recogida",
  "ocurridoEn": "<timestamptz>", "ruta": "/guarderia/<estadiaId>",
  "titulo": "...", "mensaje": "..." }
```

**`ruta` es el destino** y apunta a la pantalla que ya existe
(`apps/cliente/src/app/guarderia/[estadiaId].tsx`).

## Tu mitad — y una decisión que es tuya, no mía

El `data` de FCM hoy lleva **`intencion_id` y `tipo`, no `ruta`**. Así que hay
dos caminos y **elegís vos, porque el que decide es el consumidor**:

- **(a)** la app lee la intención por `intencion_id` y toma `datos.ruta`. Un
  viaje más, cero cambio de motor, y sirve para **todo tipo de aviso**.
- **(b)** yo agrego `ruta` al `data` de FCM en `despachar-push`. Sin viaje, pero
  **toca el despachador de todas las push del producto** — y eso lo hago sólo si
  lo pedís, no por mi cuenta.

**Mi voto: (a).** El deep link deja de depender de que cada tipo de aviso se
acuerde de poner su ruta en el payload, y el día que un tipo no la tenga, la app
cae al home **sabiendo** que cayó, en vez de recibir un `data` incompleto.

⚠️ **Y lo que NO hay que hacer:** montar el listener y navegar sin verificar que
la sesión está lista. Una push tocada con la app cerrada arranca el proceso
desde cero; navegar antes de que el router y la sesión existan es la clase de
defecto que sólo aparece en aparato.

## Lo que NO te estoy pidiendo

No te pido pantalla nueva, ni copy, ni tocar el motor. La pantalla del momento
ya existe y el texto ya lo arma el motor.

— A
