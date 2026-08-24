# Huellas de firma y estado de Google — dato operativo

> **24-ago-2026.** Datos que hacen falta para configurar OAuth y las fichas de
> tienda. **No son secretos**: una huella SHA-1 de firma es pública por diseño
> (va en Google Cloud y en Play Console), y un *client ID* de OAuth viaja en
> claro en cualquier app que lo use. **Lo que sí es secreto —el *client
> secret*— no está acá ni debe estarlo.**

## Las dos apps

| app | applicationId | SHA-1 de la firma |
|---|---|---|
| **cliente** | `com.epetplace.cliente` | `33:31:AC:30:3C:DC:F8:25:17:AE:12:79:E0:90:0C:EE:DC:E9:5B:61` |
| **prestador** | `com.epetplace.prestador` | `49:8D:A5:E3:E2:6D:59:DF:3F:90:0E:0B:17:00:12:DF:38:BC:E9:56` |

*Los `applicationId` fueron medidos del `app.json` de cada app; las huellas las
entregó el founder desde las credenciales de EAS (la keystore vive en la nube de
Expo y `eas credentials` no tiene salida no-interactiva en esta versión).*

## Estado de Google — MEDIDO, no declarado (24-ago-2026)

**Verde, con control negativo incluido:**

- `authorize?provider=google` → **302 a `accounts.google.com`** ⇒ habilitado.
- `authorize?provider=github` → **400** ⇒ **control negativo: el 302 discrimina**,
  no es que el endpoint redirija a cualquier cosa que se le pida.
- `auth.epetplace.com` responde como GoTrue (401 por falta de `apikey`, que es
  la respuesta correcta de un servidor vivo).

### 🔴 Y lo que cierra una precondición del canon

El `redirect_uri` que Supabase manda a Google es
**`https://auth.epetplace.com/auth/v1/callback`** — **no** `*.supabase.co`.

⇒ **Queda cumplida la precondición 🔴 de `MODELO_LOGIN` §4**: *«custom auth
domain ANTES de Google — la pantalla de consentimiento jamás muestra
`*.supabase.co`»*. **No es una promesa: es lo que el servidor contesta hoy.**
La persona que apriete «Entrar con Google» va a ver el dominio de la casa.

## Lo que NO hace falta en la app

El *client ID* web **lo lee Supabase de su propia configuración**: con
`signInWithOAuth({ provider: 'google' })` la app no lo declara ni lo hornea.
*Meterlo en el bundle sería agregar una copia que hay que sincronizar a mano el
día que cambie.*
