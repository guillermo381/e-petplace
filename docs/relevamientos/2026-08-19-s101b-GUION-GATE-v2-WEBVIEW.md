# S101-B · GUION DEL GATE v2 — EL ALTA DE TARJETA, EMBEBIDA

> **Reemplaza al guion v1** (`2026-08-19-s101b-GUION-GATE-ALTA-TARJETA.md`), que gateaba el
> custom tab. **Ese mecanismo murió** por firma del founder: el retorno por `cliente://`
> falló dos veces en el aparato.
>
> 🔴 **PROTOCOLO NUEVO, y este guion es su primera aplicación:** ningún caso se le pide al
> founder sin que **la pista lo haya corrido antes en el dispositivo**. La tabla de §3 dice,
> caso por caso, **qué corrí yo y con qué resultado**.

---

## §1 · 🔴 ES BUILD NUEVA — SE REINSTALA, NO ES OTA

`react-native-webview` es **dependencia nativa** ⇒ `version 1.0.3 → 1.0.4` ⇒ **runtime
nuevo** (política `appVersion`). **Ningún OTA sobre 1.0.3 trae esta pantalla** (L-134).

**Pasos para el founder:**

1. **Descargar e instalar la APK 1.0.4** — link en §5.
2. **Abrir la app y confirmar en Cuenta → el pie** que dice **`1.0.4`** *(y que el
   `update …` corresponde al canal `preview`)*.
   🔴 *Si el pie dice **1.0.3**, la instalación no reemplazó nada y todo lo que se mida
   después mide la app vieja — que **no tiene esta pantalla**.*
3. La celda sigue siendo **Cuenta → «Gate S101-B · agregar tarjeta»**.

> ⚠️ **La app vieja no se desinstala**: Android reemplaza sobre el mismo paquete. Si pidiera
> desinstalar, es señal de firma distinta y **eso se reporta, no se fuerza**.

---

## §2 · QUÉ CAMBIÓ EN LA EXPERIENCIA

| | v1 (murió) | v2 |
|---|---|---|
| Dónde se tipea | navegador del sistema | **dentro de la app**, en un WebView |
| Cómo vuelve | `cliente://…` — **falló 2 veces** | **la vista se cierra sola** |
| Quién dice el desenlace | el servidor | **el servidor** *(no cambió, y es la mitad importante)* |

**Lo que se pierde y se declara:** en el custom tab la familia veía **la URL real** del
formulario. Embebido, no. **Se compensa con el sello «Procesado por Nuvei» dentro de la
pantalla** — *no es lo mismo que ver el dominio, y por eso se dice acá en vez de darlo por
resuelto.*

---

## §3 · LA MATRIZ — con lo que corrió la pista en el aparato

*(Se completa con la corrida de la pista ANTES de convocar. Cada fila dice qué se midió.)*

**Corrido por la pista en el teléfono del founder (`SM-S938B`, Android 16, APK 1.0.4),
por el rig USB, con captura y verificación contra la base en cada caso:**

| # | Caso | **Lo que corrió la pista, y su evidencia** | Qué mira el founder |
|---|---|---|---|
| ① | **Diners `3641…`** · OTP **`012345`** | ✅ **VERDE.** El OTP montó **dentro de la app** (banda del SDK «Esta operación requiere verificación» + campo + Validar) **y debajo la voz nuestra**: «Te enviamos un código…». Validado ⇒ **la vista se cerró sola** y volvió a Cuenta. **En la base: `894c01c6 · guardada · di · 0808`** | que la voz aparezca cuando pide el código, y el aviso final |
| ① | **Visa `4111…`** *(discriminador)* | ✅ **VERDE, sin OTP.** **En la base: `bc6e9869 · guardada · vi · 1111`** | que guarde directo |
| ② | Diners · OTP **`543210`** | ⚠️ **CORRIDO — y guardó igual.** **En la base: `7c942bb8 · guardada · di · 0808`**. *El hallazgo abierto queda confirmado EN EL APARATO, no solo por instrumento* | — *(va a Erick, no al founder)* |
| ③ | Abrir y **cerrar sin tocar nada** + esperar el TTL | 🟡 **PARCIAL.** La derivación del servidor **sí está verificada**: un alta vencida lee `abandonada` **mientras su fila sigue `pendiente`**. Lo que **NO** corrí es la lectura en pantalla después de los 15 min | **este es el que más aporta el founder**: que al volver diga «sigue abierta», y **recién a los 15 min** «venció» |
| ④ | **Atrás de Android a mitad del alta** | ✅ **VERDE.** Volvió a Cuenta y **la fila quedó `ad1e1736 · pendiente · cerrada_en NULL · sin tarjeta`** ⇒ **la app no inventó ningún desenlace por haber salido** | — |
| ⑤ | **Cierre único** | ✅ **Observado en los tres cierres**: una sola vuelta, sin doble aviso ni pantalla que rebota | — |

**El Origin del WebView, medido por consecuencia:** los POST al endpoint **pasaron el
guard** (si no, habrían dado 403 y ninguna tarjeta habría nacido) ⇒ **el WebView presenta
el dominio estable**, que ya estaba en la lista. **No hizo falta ensancharla.**

---

## §4 · LO QUE SIGUE SIENDO FRENO

1. **El PAN aparece en cualquier campo que no sea del SDK** → se frena todo.
2. **La app declara un desenlace que la fila no dice.**
3. **La vista no se cierra** o cierra a una pantalla equivocada.

*Voces, composición y dónde vive el botón son **hallazgos anotados**, no frenos: el botón
es andamio de gate y muere con él.*

---

## §5 · DATOS DEL BUILD

| | |
|---|---|
| **Build** | `bce45bec-857e-4306-a76c-41448306d064` · **FINISHED** · Android · perfil `preview` |
| **Versión** | **1.0.4** (runtime nuevo) |
| **APK** | https://expo.dev/artifacts/eas/BMopAntevKwCUcZNq1Gu6Bml78Z6xv-TZ0diqJKBU_4.apk |
| **Tamaño** | **124 553 469 bytes** — 🔴 **verificá el tamaño al bajarla**: mi primera descarga quedó **truncada en 3,4 MB** y Android la rechazó con `INSTALL_PARSE_FAILED_NOT_APK`. *Un APK truncado no dice «incompleto»: dice «no es un APK».* |
| **Ya instalada** | ✅ en el teléfono conectado, por el rig — el founder **no necesita instalarla si usa ese mismo teléfono** |

> 🔴 **CORRECCIÓN AL PASO 2 DE §1, medida en el aparato:** el pie de Cuenta **NO muestra la
> versión** — dice `bundle embebido / dev`. **Mi guion pedía confirmar algo que el pie no
> dice.** La confirmación de que corre la 1.0.4 es **que la celda del gate abra una pantalla
> DENTRO de la app** (con encabezado propio y chevron), en vez de saltar al navegador.

---

## §6 · LO QUE ESTE GATE **NO** CIERRA

- **El host productivo** (`pagos.epetplace.com`) — pendiente declarado; el CNAME está
  firmado y lo ejecuta el founder cuando toque.
- **La rotación de `NUVEI_APP_KEY_SERVER`** — higiene con Erick, sin reloj.
- **El `543210`** — a la lista de Erick.
- **Producción abre con credenciales nuevas.** La expuesta no llega ahí.
