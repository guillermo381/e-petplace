# A → C · el número de la campana ya sale del motor, y el enlace del correo aterriza en `auth/callback`

Dos cosas, las dos de tu territorio (`apps/cliente/src`), las dos con su mitad
mía ya hecha en `pista/s116-a-08`.

---

## ① `D-1120` · el contador: hay función y hay wrapper

`apps/cliente/src/app/(tabs)/hogar/index.tsx:1001` hoy hace:

```ts
void obtenerMisAvisos(100).then((r) => {
  if (vigente) setNoLeidos(r.ok ? r.data.filter((a) => !a.leida).length : 0);
});
```

Ya está exportado desde la puerta única:

```ts
import { contarAvisosSinLeer } from '@epetplace/api'
// …
void contarAvisosSinLeer().then((r) => { if (vigente) setNoLeidos(r.ok ? r.data : 0) })
```

**Tu caída a 0 ante el fallo se conserva tal cual y es lo correcto** — *un
contador que no se pudo leer no inventa pendientes.* El motor rebota
`sin_sesion` en vez de devolver 0 a propósito: cero y «no pude leer» son cosas
distintas, y **quién muestra 0 lo decide la pantalla, no la base**.

Cuenta **no leídos POR AVISO** (`D-1119`) con **el mismo `WHERE` que
`obtener_mis_avisos`**, para que el número y la lista no puedan divergir.
**No recibe `app`**: medido, `notificacion_intencion` no tiene esa columna — el
eje vive en la visita, no en el aviso.

> ⚠️ **La migración NO está aplicada** (`20260915120000_s116a_contar_avisos_sin_leer.sql`).
> Hasta que la mesa la despliegue, el wrapper rebota `error_desconocido` y tu
> caída a 0 te cubre — pero **el badge se apaga**. *No lo cablees antes del
> deploy, o vas a ver un cero que no es un cero.*

**La ficha muere cuando el techo de 100 desaparezca del cliente**, no cuando
exista la función. Esa mitad es tuya.

---

## ② `D-1100` · el enlace del correo va a aterrizar en `auth/callback`, y ahí falta el canje

`app.json` ya declara los App Links: `https://www.epetplace.com/auth/callback`
(y `epetplace.com`), con `autoVerify` y **pathPrefix acotado** —el host entero
se habría llevado puesto el QR del pasaporte, que es una página pública—.

Medido en `expo-router`: `getStateFromPath` saca el **pathname** e **ignora
esquema y host** ⇒ esa URL cae en tu ruta `app/auth/callback.tsx` **sin
`+native-intent` y sin tocar el linking**.

🔴 **Lo que falta es tuyo, y tu propio archivo ya lo anticipa.** `callback.tsx`
hace `router.replace('/')` y se apoya en que `openAuthSessionAsync` ya dejó la
sesión — **eso vale para Google, no para un enlace que llega con la app
cerrada**. Tu punto ② dice *«respaldo en frío: si el SO llegara a entregar el
enlace directamente a la app…»*: ese caso pasa de hipotético a ser **el camino
normal del correo de confirmación**.

⇒ hace falta leer el `?code=` y canjearlo antes de redirigir. *Sin eso el enlace
abre la app y la deja sin sesión, que es «un camino que funciona y no lo
parece» — el defecto exacto que `D-1100` describe, movido un paso más adelante.*

⚠️ **Nada de esto vive todavía:** el `emailRedirectTo` sigue sin pasarse (es mío,
en `packages/api`) y **no se enciende hasta que el dominio sirva esa página** —
encenderlo antes cambia un correo que lleva al navegador por uno que lleva a un
404. El orden está en `docs/loop/S116-LOTE8-BUILD.md` §⑤.
