# El día de la build · LA LISTA VIVA de lo que viaja ese día

## ⚖️ FIRMA DEL FOUNDER (7-sep-2026) — el corte y la regla

**La build se corta DESPUÉS del rediseño: dos sesiones más, y es UNA SOLA, con
el NFC adentro.** Hasta entonces:

- **TODO sale por OTA.**
- **Ninguna rama `*-nfc` se mergea** — hoy `pista/s113-a-nfc` y `pista/s113-b-nfc`
  están fuera de `main` **a propósito**, no por olvido. *Un módulo nativo en
  `main` no se nota: compila, corre en dev, y el APK que la gente tiene no lo
  tiene* — el bundle sigue pidiendo algo que el binario no trae, y el fallo
  aparece en el teléfono de una familia, no acá.
- **`ota:deps` es el discriminador de cada candidato.** Corre antes de bundlear,
  siempre. Su verde es lo único que dice que el OTA que estás por publicar
  **puede** aplicarse sobre el binario que la gente ya tiene.

### 🔴 FIRMA DEL FOUNDER (8-sep-2026) — TAMPOCO SE PIDE EL BUILD PARA VERIFICAR

**Todos los despliegues son por OTA, sin excepción. Ninguna pista pide un build
por ningún motivo — ni siquiera para desbloquear una verificación propia.** Lo
que pida binario se anota en la tabla de abajo y NO se instala (eso ya regía); lo
nuevo es que **tampoco se pide el build para verificar.**

**La consecuencia, escrita, porque es donde se cae:** si algo no se puede caminar
sin un dev client, **NO queda como «pendiente de build».** Se verifica en el
aparato con la app publicada, **o se declara como NO VERIFICADO con su razón.**
*«Pendiente de build» es una deuda que nadie salda y que se lee como que va a
pasar; «no verificado, porque X» es un hecho que el founder puede decidir.*

Ya pasó **dos veces en el arco de postventa** y las dos se declaran así, no como
pendientes:
- **C8 — el «servicios sin cerrar» en el Hoy del prestador.**
- **El dictado** (`expo-speech-recognition`, sólo en `apps/prestador`, es build).

---

### 🔴 SI NECESITÁS ALGO NATIVO: SE ANOTA ACÁ, NO SE INSTALA

**Cualquier pista que necesite una capacidad nativa agrega su fila a la tabla de
abajo y sigue trabajando sin ella** — con el camino degradado que corresponda, y
diciéndolo en pantalla si la familia lo va a notar.

*Instalarlo «para probar» es exactamente el modo de falla que esta regla existe
para evitar: pnpm resuelve el peer, funciona en dev, nadie lo declara en ninguna
app, y el gate queda partido en dos mitades que por separado dan verde.*

### 🔴 EL NFC DE iPHONE QUEDA FUERA DEL ALCANCE — firma del founder, 7-sep-2026

**No es una decisión de producto: no hay con qué.** El founder **todavía no
tiene cuenta de desarrollador de Apple** — espera el **DUNS**, que es trámite de
un tercero y **no tiene fecha que dependa de nosotros**.

**Lo que esto significa el día de la build, para que nadie lo dé por hecho:**

- **La build de Android se corta igual.** No espera a Apple. El NFC funciona ahí.
- **Lo de iPhone viaja cuando Apple habilite la cuenta**, en su propia build.
- **El entitlement de NFC se pide ENTONCES**, no antes: *es un permiso que se
  solicita desde una cuenta que todavía no existe.*

⚠️ **La trampa concreta:** el entitlement de NFC en iOS **no es una casilla que
se marca al compilar** — es una capacidad que Apple concede, y llega después de
pedirla. Quien planifique el día de la build contando con iPhone va a descubrirlo
**al final**, cuando ya no hay margen. *Por eso está escrito acá arriba y no en
una nota al pie: la fila 1 de la lista dice «iOS queda FUERA» y este bloque dice
por qué.*

**Lo que sí se puede adelantar sin la cuenta:** todo el código NFC vive en
`pista/s113-a-nfc` y `pista/s113-b-nfc`, sin mergear. *No se pierde nada
esperando: se pierde si alguien lo mergea antes de la build.*


---

## LA LISTA VIVA — lo que viaja el día de la build

> Se agrega, no se reemplaza. Cada fila dice **quién la pidió** y **qué se rompe
> si ese día falta** — porque el día de la build alguien va a tener que decidir
> rápido qué se prueba primero, y sin esa columna se prueba lo que se recuerda.

| # | capacidad | paquete / permiso | pidió | qué se rompe si falta |
|---|---|---|---|---|
| 1 | **Leer y escribir NFC** (la placa) | `react-native-nfc-manager` | A · B | La placa sólo funciona por QR. 🔴 **iOS queda FUERA — ver el bloque de abajo** |
| 2 | **Guardar en la galería** | `expo-media-library` (permiso de escritura) | A | La descarga del QR **abre** la imagen en vez de guardarla. Hoy sale por ahí, y se nota |
| 3 | **Compartir archivos** | `expo-sharing` | A | El pasaporte y el QR no se pueden mandar por WhatsApp desde la app |
| 4 | **Micrófono de Nexo** (dictar) | `expo-audio` / permiso de micrófono | D | Nexo sólo se escribe. *El dictado es lo que lo vuelve usable con el perro en brazos* |
| 5 | **Selector de PDF** (la bóveda) | `expo-document-picker` | A | Un examen en PDF no se puede subir: hoy la bóveda sólo toma imagen |

<!-- PISTA QUE NECESITA ALGO NATIVO: agregá tu fila ACÁ ARRIBA, con las cinco
     columnas. No instales el paquete. Si tu camino queda degradado hasta la
     build, decilo en pantalla — la familia tiene que entender por qué algo no
     está, no encontrarse con un botón que no hace nada. -->

---


> **Nada nativo entra a `main` antes de la build.** Un módulo nativo **no viaja
> por OTA**: el JS del bundle lo importa, el binario instalado no lo tiene, y la
> app revienta **en hilo nativo — fuera de toda `ErrorBoundary`**, sin stack
> trace en JS.
>
> 🔴 Y lo peor: **ningún gate del tren normal lo avisa.** `ota:deps` compara
> COMMITS y da verde con la dependencia instalada en disco (`D-1043`); el
> typecheck no ve módulos nativos ausentes. *La única defensa es este documento
> y la disciplina de no mergear.* Ficha: **`D-1046`**.

## Lo que espera, RE-MEDIDO (7-sep-2026, segundo repaso)

**Nada cambió desde el primero**, y eso se dice: los cuatro siguen fuera y el
micrófono sigue viviendo sólo en el prestador. *Un «sigue igual» medido vale lo
mismo que un cambio; lo que no vale es suponerlo.*

Comando: `grep '"<dep>"' apps/*/package.json` · las ramas, con
`git diff --name-only main...origin/pista/s113-{a,b}-nfc`.

## Lo que espera, medido

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
