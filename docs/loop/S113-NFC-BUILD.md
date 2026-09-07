# El día de la build · qué entra, en qué orden y qué se rompe si se saltea

> **Nada nativo entra a `main` antes de la build.** Un módulo nativo **no viaja
> por OTA**: el JS del bundle lo importa, el binario instalado no lo tiene, y la
> app revienta **en hilo nativo — fuera de toda `ErrorBoundary`**, sin stack
> trace en JS.
>
> 🔴 Y lo peor: **ningún gate del tren normal lo avisa.** `ota:deps` compara
> COMMITS y da verde con la dependencia instalada en disco (`D-1043`); el
> typecheck no ve módulos nativos ausentes. *La única defensa es este documento
> y la disciplina de no mergear.* Ficha: **`D-1046`**.

## Lo que espera, medido (7-sep-2026)

| qué | dónde vive | estado hoy |
|---|---|---|
| **NFC** · `react-native-nfc-manager@3.17.2` | `pista/s113-a-nfc` (dep + `app.json`) · `pista/s113-b-nfc` (`GrabarTagNfc`, `tag-nfc.ts`) | **fuera de main** |
| **Permiso de galería** · `expo-media-library` | sin instalar | **falta instalarlo** |
| **Compartir** · `expo-sharing` | sin instalar | **falta instalarlo** |
| **Micrófono de Nexo** · `expo-speech-recognition@56.0.1` | ya está en **`apps/prestador`**, NO en `apps/cliente` | **falta en el cliente** |

⚠️ El micrófono es el caso interesante: **el paquete ya vive en el prestador**,
así que en un monorepo pnpm `resolve` lo encuentra desde el cliente y **compila
en dev**. *Compila, corre en dev, y el APK no lo tiene* — es exactamente el
defecto que `verify:hoisting-nativo` nació para cazar (S112).

## El orden exacto, y por qué cada paso va donde va

**1 · Mergear las ramas `*-nfc` a `main`.**
Primero A (la dep y el `app.json`), después B (las piezas que la usan). Al
revés, `main` queda con un componente que importa un módulo que nadie declaró.

**2 · Instalar lo que falta, en `apps/cliente`:**
```
pnpm --filter @epetplace/cliente add expo-media-library expo-sharing expo-speech-recognition
```
Los tres son nativos. `expo-speech-recognition` se instala **aunque ya esté en
el prestador**: cada app declara lo suyo, y heredarlo por hoisting es la trampa
de arriba.

**3 · Subir `version` en `app.json` de las DOS apps: `1.0.7` → `1.0.8`.**
El `runtimeVersion` sale de `appVersion` por policy, así que subir la versión
**es** cambiar el runtime.

🔴 **Y acá está lo que hay que entender antes de tocarlo: los OTAs publicados
contra `1.0.7` quedan pegados a `1.0.7` para siempre.** No se pierden y no
molestan — les siguen llegando a los binarios viejos —, pero **el APK nuevo no
los ve**: arranca con su bundle embebido y espera updates de `1.0.8`. *Un
teléfono que no recibe un update no muestra un error: muestra la app de antes,
y eso se lee como «no pasó nada».*

**4 · Build de las dos apps:**
```
cd apps/cliente   && npx eas-cli build -p android --profile preview
cd apps/prestador && npx eas-cli build -p android --profile preview
```

**5 · Reinstalar los APK.** Un update no arregla un binario sin el módulo: el
módulo viaja en el binario. Y **el gate empieza confirmando el binario**
(`L-138`): `adb shell dumpsys package <paquete> | grep versionName` tiene que
decir **1.0.8** antes de mirar nada más.

**6 · Recién ahí, el primer OTA contra `1.0.8`.**

## Lo que hay que probar en ese aparato, y no antes

- **NFC**: grabar un tag y leerlo. Es lo único que no se puede simular.
- **Galería**: el permiso se pide **cuando la familia toca «traer papeles»**, no
  al arrancar. *Un permiso que se pide sin que nadie lo haya pedido se deniega.*
- **Compartir**: el pasaporte sale por la hoja del sistema.
- **Micrófono**: Nexo escucha en el cliente, que es donde no estaba.

## Lo que NO entra en ese tren

La **impresión de placas** (`S113-PLACAS-IMPRESION.md`): no necesita build.
Se decidió aparte y sigue afuera.

## Pista C · tres dependencias nativas, ninguna instalada (S113, cierre)

| dependencia | para qué | qué hace la app mientras tanto |
|---|---|---|
| `expo-document-picker` | el **PDF** en «Traer papeles» | el selector de archivo **lo dice con su voz**; la foto alcanza — un examen fotografiado se lee igual |
| `expo-camera` | el **escaneo de placa** desde el pasaporte | la pantalla del deep link **no la necesita**: se llega por el link del QR, que es como llega quien encuentra al animal |
| micrófono de Nexo | dictar en el chat | heredado de tandas anteriores |

🔴 **Ninguna se instaló, y es la decisión correcta**: *una dependencia nativa no
viaja por OTA (`L-134`), así que instalarla hoy dejaría rota la app que ya está
en la calle* — peor que no ofrecer la función.

⚠️ **El día de la build**, cada una tiene su camino ya escrito y apagado con su
voz: se enchufan sin diseñar nada nuevo.
