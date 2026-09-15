# LOTE 8 · LA BUILD DE OCTUBRE — lo que lleva, cómo se produce, y qué espera una firma

## ⓿ 🔴 FIRMA DEL FOUNDER (15-sep-2026) — **NADA VIAJA POR BUILD TODAVÍA**

> **Todo sigue por OTA hasta una próxima sesión de diseño que revise el splash y
> la miniatura.**

**Qué significa, en concreto:**

- **`pista/s116-a-08` queda ARMADA Y SIN MERGEAR.** No entra a `main`, no se
  construye, no se despliega. El trabajo está hecho y esperando.
- **Todo lo que la app entregue hasta entonces sale por OTA**, o sea: sólo JS.
  Nada de este lote llega a un aparato — *y no porque falte trabajo, sino porque
  la decisión de construir no está tomada.*
- **El splash y el ícono se revisan en SESIÓN DE DISEÑO antes de construir.**
  Están cableados y medidos; lo que falta no es ingeniería: es que el founder
  los mire. Los dos tienen su montaje listo para esa sesión:
  `docs/loop/capturas-s116-a-lote8/iconos-y-splash.png` y
  `monocromo-dos-candidatas.png`.

⚠️ **Y lo que esta firma NO cambia, para que nadie lo lea de más:** los gates
nuevos (`verify:costura-splash`, `verify:icono-notificacion`) y el ensanche de
los dos del 3b **también viven en esta rama**, así que **tampoco rigen todavía**.
Hasta que la rama se mergee, el hook que corre es el de `main`.

### La lista de lo que viaja por BUILD

Es la de §① de este documento — los seis renglones de la tabla — **más un
séptimo que la firma agrega:**

| | |
|---|---|
| **⑦** | **el splash y el ícono se revisan en sesión de diseño antes de construir** |

*No es un ítem técnico: es una precondición de mesa, y por eso entra a la misma
lista que los otros seis en vez de vivir en una nota al pie.*

### Las firmas del founder que siguen ABIERTAS

| | qué es | estado |
|---|---|---|
| **Apple Developer** | la cuenta (USD 99/año) | 🔴 abierta |
| **Google Play Developer** | la cuenta (USD 25, una vez) | 🔴 abierta |
| **D-U-N-S** | sólo si la cuenta de Apple es de EMPRESA; lo emite un tercero | 🔴 abierta |
| **¿APK o tienda?** | **la decisión que ordena a las tres de arriba** | 🔴 abierta |

🔴 **La cuarta no es una cuenta más: es la que decide si las otras tres hacen
falta.** Si la build de octubre es **APK interno para F&F**, ninguna de las tres
es necesaria y el camino es corto. Si es **tienda**, las tres son precondición y
el canon ya midió **3 a 6 semanas de calendario** (S81).
*Mientras esa pregunta no se conteste, las otras tres no se pueden ni priorizar.*

⚠️ **El D-U-N-S es el único cuya demora no depende de nosotros** — por eso, si la
respuesta llega a ser «tienda» y la cuenta va a nombre de una empresa, ése
arranca el mismo día, aunque su resultado se use al final.

---

**Estado: PREPARADA, NO CONSTRUIDA.** Esta tanda dejó la configuración y las
imágenes listas y **no corrió un solo build**. Este documento es lo que la mesa
lee para decidir cuándo se construye.

> **Alcance: `apps/cliente`.** El prestador no se tocó, y su caso está al final
> con lo que le falta — que no es poco.

---

## ① QUÉ CONTIENE

| | qué cambia | por qué necesita BUILD |
|---|---|---|
| **El ícono** | los cuatro PNG derivados de `icono-app.svg` de B · fondo adaptativo a ciruela `#26062E` · **muere `ios.icon` de la plantilla** | los íconos se hornean en el binario |
| **El splash nativo** | magenta `#D10788` y la nariz a `imageWidth: 180` | `expo-splash-screen` escribe drawables y el storyboard |
| **El ícono de push** (`D-1093`) | la silueta que B dibujó para 24 px | el plugin genera los cinco `drawable` |
| **App Links** (`D-1100`) | `intentFilters` con `autoVerify` + `associatedDomains` | va al `AndroidManifest` y a los *entitlements* |
| **`crypto` nativo** (`D-1101`) | `expo-crypto` **anotada, sin instalar** | es módulo nativo (`L-134`) |
| **La barra sin velo** | plugin local `with-barra-sin-velo` | escribe `styles.xml` |

**Y lo que la build arrastra sin ser suyo:** todo el JS de S116 que hoy vive en
`main` y viaja por OTA. *Una build no es sólo lo nativo: es una foto del árbol.*

### Los dos gates nuevos que la vigilan
- **`verify:costura-splash`** — que el splash nativo y el JS no se separen.
- **`verify:icono-notificacion`** — que el ícono de push siga siendo una máscara
  y no un cuadrado blanco. **Mide las dos casas.**

Los dos están cableados en el hook y **los seis brazos tienen su rojo probado**.
⚠️ El cableado **no se pudo ejercer**: `core.hooksPath` apunta al árbol PRINCIPAL
(`L-490`), así que el hook que corre para un worktree es el de `main`. Entra en
vigor al mergear.

---

## ② QUÉ COMANDOS LA PRODUCEN

```bash
# 0 · las imágenes, si algún SVG de B cambió (no hace falta si no cambió nada)
node scripts/lote8/generar-assets.mjs

# 1 · instalar la dependencia nativa que el punto 5a dejó anotada
cd apps/cliente && npx expo install expo-crypto

# 2 · aplicar el cambio de PKCE a s256 — docs/loop/S116-LOTE8-PKCE-S256.md

# 3 · subir la versión (ver ③) y recién entonces construir
cd apps/cliente && npx eas-cli build -p android --profile preview
```

⚠️ **`eas-cli` SIEMPRE desde `apps/<app>/`, aunque sólo estés mirando.** Desde la
raíz scaffoldea un `app.json` de mentira; medido, pasa **hasta con comandos de
lectura**.

---

## ③ 🔴 LA VERSIÓN SUBE A `1.0.8`, Y NO ES OPCIONAL

`runtimeVersion` es `{"policy": "appVersion"}` ⇒ **el runtime ES `version`**. Si
esta build sale como `1.0.7`, convive con los APK 1.0.7 que ya están instalados
**en el mismo canal de updates** — y ahí aparece el defecto que `L-134` describe:
el primer OTA que se publique con `crypto-nativo.ts` adentro **importa un módulo
nativo que el binario viejo no tiene**, y ese aparato queda con la app rota.

*No hay forma de que un OTA distinga dos binarios con el mismo runtime: el
runtime es la única llave.* ⇒ **`version: "1.0.8"` en `app.json` antes de
construir**, y los OTAs siguientes se publican contra 1.0.8.

---

## ④ LO QUE ESPERA UNA FIRMA — y qué bloquea cada cosa

### 🔴 BLOQUEANTE, y viene firmado de antes: la migración de llaves (`D-784`)

> *«Ninguna build nueva sale sin la migración de llaves adentro.»*

La `anon` legacy está horneada en los dos APK vivos. El camino firmado es que en
**el próximo tren de build** las apps pasen a `sb_publishable_` y las legacy se
apaguen. **Es esta build.** La llave entra por la variable de EAS
`EXPO_PUBLIC_SUPABASE_ANON_KEY` ⇒ **no es un cambio de código: es cambiar el
valor en EAS y apagar las legacy en el dashboard.**
*No se pudo verificar desde acá qué valor tiene hoy esa variable: vive en EAS.*

### 🔴 El identificador de bundle de iOS — **no existe**

Medido: ni `apps/cliente` ni `apps/prestador` declaran `ios.bundleIdentifier`.
**Nunca se construyó para iOS.** Es una decisión de una sola vez: **el bundle id
no se cambia jamás** — si se toca, es una app nueva y se pierden las
instalaciones (`D-752`). El espejo de Android sería `com.epetplace.cliente`.
**Sin él no se puede completar el `apple-app-site-association`.**

### Las cuentas, y lo que cada una tarda

| qué | cuánto cuesta | qué desbloquea |
|---|---|---|
| **Apple Developer Program** | USD 99/año | firmar iOS · TestFlight · App Store |
| **D-U-N-S** (sólo si la cuenta es de EMPRESA) | gratis, **días o semanas** | que Apple acepte el alta de organización |
| **Google Play Developer** | USD 25 una vez | Play App Signing · testing cerrado |

⚠️ **El D-U-N-S es el que sorprende**: si la cuenta va a nombre de una empresa,
Apple lo exige antes de dejar crear la cuenta, y lo emite un tercero. *Es el
único ítem de esta lista cuya demora no depende de nosotros.*

⚠️ **Y una cuenta personal nueva de Google Play exige testing cerrado con 12
probadores durante 14 días corridos antes de poder publicar.** El canon ya lo
midió en S81: **de 3 a 6 semanas de calendario** si el 1-oct exige tienda.

### Los certificados: NO son trabajo, son un `sí`

EAS genera y guarda el keystore de Android y los certificados de iOS. **Lo que
hace falta no es producirlos: es que el founder inicie sesión con las cuentas.**

### Lo que falta en `eas.json`: **no hay perfil `production`**

Medido: `apps/cliente/eas.json` tiene `development` y `preview`, los dos
`distribution: internal` y **APK**. Para tienda hacen falta **AAB** y un perfil
propio. ⇒ **si la build de octubre es para F&F por APK, no falta nada; si es
para tienda, falta el perfil y todo lo de arriba.** *Es la pregunta que ordena
el resto y la mesa no la contestó todavía.*

---

## ④bis ⚠️ «ANOTADA SIN INSTALAR» NO SOBREVIVE A UN SOLO `pnpm run`

**Medido en esta misma tanda, y me lo hice yo solo:** después de anotar
`expo-crypto` en `apps/cliente/package.json`, el primer `pnpm -s verify:…` que
corrí **resolvió la dependencia y reescribió `pnpm-lock.yaml`** — pnpm v11
verifica las dependencias antes de ejecutar un script y, si faltan, las instala.

Reproducido a propósito para no acusar sin medir: árbol limpio →
`pnpm -s verify:gates-existen` → `M pnpm-lock.yaml`, +12 líneas con
`expo-crypto@57.0.3`.

⇒ **la rama se entrega con el lockfile SIN tocar**, que es el estado que la
orden pidió, **pero cualquiera que corra un script de pnpm acá lo va a volver a
mover.** Dos consecuencias prácticas:
- Quien trabaje en esta rama corre los gates con `node scripts/…` o restaura el
  lockfile antes de commitear.
- **Es un argumento de tiempo, no de forma:** mientras la anotación esté sin
  resolver, `pnpm install --frozen-lockfile` falla para toda pista que abra un
  worktree nuevo. *Cuanto antes la mesa decida el tren, menos gente lo paga.*

*Lo interesante del caso no es el lockfile: es que **una medición publicada puede
quedar falsa por un efecto colateral de un comando posterior del mismo autor**.
La del punto 5a («`--frozen-lockfile` falla») era cierta al escribirla y dejó de
serlo diez minutos después, sin que nada avisara.*

---

## ⑤ EL ORDEN

0. 🔴 **LA SESIÓN DE DISEÑO — splash y miniatura.** Firma del founder del
   15-sep: **nada viaja por build hasta que esos dos se revisen.** Es el paso
   cero de verdad: mientras no ocurra, los ocho de abajo no arrancan y **el
   producto sigue entregando por OTA**. (Ver §⓿.)
1. **La mesa contesta: ¿APK interno para F&F, o tienda?** Todo lo demás depende.
2. **Migración de llaves (`D-784`)** — precondición firmada, va primero.
3. El bundle id de iOS, si iOS entra.
4. Las cuentas (**el D-U-N-S arranca ya**, si hace falta: es el que espera).
5. `npx expo install expo-crypto` + el cambio de `s256`.
6. `version: 1.0.8`.
7. Construir, instalar, **y recién ahí** publicar los archivos del dominio.
8. Verificar en el aparato: ícono · splash sin costura · push con la nariz · el
   enlace del correo abriendo la app · el log **sin** el aviso de WebCrypto.

> ⚠️ **El paso 7 tiene su orden adentro y es contraintuitivo:** los archivos del
> dominio se publican **antes de instalar**, porque **Android verifica los App
> Links AL INSTALAR**. Publicarlos después deja al aparato con el veredicto
> viejo hasta un `pm verify-app-links --re-verify`.

---

## ⑥ LO QUE QUEDA ABIERTO, con dueño

| qué | dueño |
|---|---|
| `emailRedirectTo` en `registrarse()` — **después** de que el dominio sirva `/auth/callback` | **A** |
| Canjear el `?code=` en `auth/callback.tsx` cuando el enlace llega en frío | **C** (buzón) |
| Un monocromo propio del ícono: hoy el del tema es la silueta de push y **dice otra cosa que el ícono real** | **B** (buzón) |
| El `color` del plugin de push sigue en `#8E1F68`; la paleta de S116 usa `#D10788` | mesa + B |
| **El prestador:** su `ios.icon` también apunta al ícono de Expo de la plantilla, tampoco tiene bundle id, y su ícono/splash no se rediseñaron | mesa |

**El prestador es el que más sorprende de esa lista:** si la build de octubre lo
incluye, **hoy saldría con el logo de Expo en iOS**.
