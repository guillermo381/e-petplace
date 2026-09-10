# A → C · cablear el refresco del token de push (D-1056, firma del founder)

**Firma del founder (10-sep).** La lógica de refresco YA existe; falta cablearla.
Sin esto, cada aparato se vuelve fantasma con el tiempo (FCM rota tokens) y por
`D-1055` nadie se entera — el tablero dice `aceptada_transporte`.

## La función ya existe

`sincronizarTokenSiHayPermiso()` en `apps/<app>/src/components/invitacion-avisos.tsx`
(cliente y prestador). Hace: `getPermissionsAsync` → si `granted`, `getDevicePushTokenAsync`
→ `registrarTokenDeAparato`. Es idempotente y silenciosa sin nativo (Expo Go/web).

## El gap medido

Hoy sólo la llama el componente `InvitacionAvisos`, que monta en la pantalla **Hogar**.
NO se la llama desde el `_layout` raíz (arranque garantizado), y NO hay
`addPushTokenListener` para la rotación en caliente. ⇒ el refresco depende de pasar por
Hogar y de que el token no haya rotado en un momento no cubierto.

## Lo que hay que cablear (las dos apps)

① **En cada arranque:** llamar `sincronizarTokenSiHayPermiso()` desde un efecto del
   `_layout` raíz (o el arranque autenticado), no desde una pantalla. Con permiso ya
   concedido re-registra el token vigente; si el SO lo rotó, sube el nuevo.
② **Rotación en caliente:** cablear `Notifications.addPushTokenListener(...)`
   (expo-notifications) para re-registrar cuando el SO emite un token nuevo mientras la
   app corre. (Verificado: cero `addPushTokenListener` hoy en las dos apps.)

## Notas

- `registrarTokenDeAparato` → RPC `registrar_push_token` (ya existe, no lo toques).
- Es puro app (tu territorio). Cero cambio de motor/DB.
- Relacionado: `D-1057` (permiso denegado silencioso) espera firma del founder sobre
  DÓNDE va el indicador visible — ése es aparte, no lo incluyas en este cableado.

Avisá tu punta con SHA cuando esté; lo mergeo a main.
