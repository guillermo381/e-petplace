# La chapita NFC · lo que hay que hacer el día que se compile

**Esta rama (`pista/s113-a-nfc`) NO se mergea a `main`.** Vive aparte a
propósito: en el momento en que entre, el próximo OTA del cliente deja de ser
posible y nadie va a saber por qué.

---

## Por qué está en una rama y no en `main`

`runtimeVersion` del cliente es `{ "policy": "appVersion" }`. Mientras
`version` sea `1.0.7`, todo OTA llega a los binarios 1.0.7 instalados. Un
módulo **nativo** nuevo no viaja en un OTA: el bundle lo pediría y el binario
no lo tendría — la app abre y crashea en el momento en que alguien toca la
pantalla que lo usa.

Por eso esta rama sube `version` a **1.0.8**: es la línea que corta el OTA y
obliga a la build. *Una build con NFC y una sin él no pueden compartir bundle,
y el número de versión es lo único que lo hace explícito.*

**El control, corrido y verde en su rojo** (`L-459`: la primera prueba de un
guard no es que dé verde, es que dé rojo sobre el caso real):

```
$ pnpm ota:deps 5fe9bea8      # sobre esta rama
🔴 1 cambio(s) de dependencia de RUNTIME:
   ALTA   react-native-nfc-manager  → 3.17.2   apps/cliente/package.json
exit 1
```

Sobre `main`, el mismo comando da **exit 0**. El gate distingue.

> ⚠️ **Y de correrlo salió un hueco que hay que saber: `ota:deps` compara
> COMMITS, no el árbol.** Con la dependencia instalada y sin commitear, dio
> **verde**. La regla 82 (el árbol se mide antes de bundlear) lo cubre por
> otro lado, pero el gate no lo dice y su silencio se lee como salud.
> Ficha: `D-1043`.

## La librería, medida antes de elegir

| | |
|---|---|
| paquete | `react-native-nfc-manager@3.17.2` |
| licencia | **MIT** |
| dependencias | **una**: `@expo/config-plugins`, que ya viene con Expo |
| config plugin | **propio** (por eso depende de config-plugins) |

*Se eligió por el número de dependencias, igual que el generador de QR: en una
app cada dependencia es peso de arranque y superficie de fallo.*

## Qué toca esta rama

- `apps/cliente/package.json` — la dependencia
- `apps/cliente/app.json` — `version` a 1.0.8, el plugin con su texto de
  permiso en español (**iOS lo muestra literal al usuario**: no es una cadena
  técnica, es una frase que una persona lee), y `android.permission.NFC`
- `pnpm-lock.yaml`

**No toca una sola línea de producto.** No hay pantalla de NFC todavía: esto es
el tren preparado y apagado, el patrón de `D-456` (el micrófono viajó cinco
sesiones apagado hasta que otra cosa obligó la build).

## El día de la build

1. `git checkout pista/s113-a-nfc && git rebase main` — la rama se pone al día
   con lo que haya, jamás al revés.
2. `pnpm --filter cliente exec expo prebuild --clean` si hay carpetas nativas;
   con build en la nube no hace falta.
3. `cd apps/cliente && npx eas-cli build -p android --profile preview`
   — **desde `apps/cliente/`, nunca desde la raíz**: `eas-cli` en la raíz
   scaffoldea un `app.json` stub y ensucia el árbol.
4. **Verificar el APK POR MANIFEST antes de distribuirlo**
   (`scripts/verify-manifest-apk.mjs`, la ley que dejó S81): que
   `android.permission.NFC` esté horneado. *Un secreto o un permiso que falta
   no falla en el build: se omite, y el crash llega en la calle.*
5. Instalar, y recién ahí publicar el primer OTA contra **runtime 1.0.8**.
   ⚠️ Los binarios 1.0.7 **dejan de recibir updates publicados a 1.0.8**: hay
   que publicar a los dos runtimes hasta que todos migren, o aceptar que quien
   no actualice queda congelado. Es la trampa de S78 con la 1.0.2 → 1.0.3.

## Lo que falta antes de que esto sirva de algo

- **La pantalla**: leer una chapita y abrir el pasaporte. Es de C.
- **Escribir** la chapita (grabar la URL en el tag) — decide si lo hacemos
  nosotros al despachar la placa o la familia desde la app.
- **La decisión del founder**: proveedor y precio de la placa.
  Anotado en `S113-NOCHE-PENDIENTES.md`.
- **iOS**: NFC exige un *entitlement* propio en la cuenta de Apple. No está
  medido si la cuenta lo tiene. Hasta que se mida, esto es Android.
