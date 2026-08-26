# ACTA · EL GATE DEL CABLE — LiveKit Cloud queda FIRMADO SIN CONDICIÓN

> **Fecha:** 26-ago-2026 · **Corrido por:** el founder, en **dos dispositivos
> físicos**, sobre **red real de Quito**.
> **Depositada por:** pista A, el mismo día, a las 10:30 (-05).
> **Qué cierra:** la única condición que la recomendación de transporte había
> dejado abierta — y que **solo una build podía cerrar**.

---

## §1 · LO QUE ESTABA ABIERTO, en su literal

La medición de transporte de la pista D
(`docs/relevamientos/2026-08-25-s106-d-transporte.md` §3) recomendó **LiveKit
Cloud** con cinco razones medidas, y dejó **un riesgo que ella misma declaró
que no podía cerrar**:

> ⚠️ **Y el riesgo que la recomendación NO cierra:** el **config plugin de
> Expo de LiveKit no se toca desde el 17-mar-2026 — tres meses antes de que
> SDK 57 existiera.** No hay issues reportadas de SDK 57 en ningún repo del
> set, pero **ausencia de reportes no es evidencia de compatibilidad**. El
> plugin es config declarativa (permisos, flags), así que el riesgo es
> acotado — **pero sólo una build de prueba lo cierra, y esa build es un acto
> de la mesa.**

*Ese párrafo es el que este acta cierra, y conviene subrayar por qué la pista
tenía razón en no cerrarlo sola: **el hallazgo de forma más importante de toda
su medición fue que NINGÚN SDK de video declara Expo 57.** La elección se hizo
sabiendo que la compatibilidad no estaba declarada por nadie — no se podía
leer, había que ejercerla.*

---

## §2 · EL VEREDICTO — los cinco puntos, como los corrió el founder

| # | Qué | Resultado |
|---|---|---|
| ① | Compila e instala | ✅ **sí, en los dos teléfonos** |
| ② | Entran los dos a `cable-quito` | ✅ **sí** |
| ③ | **Se ven en AMBOS sentidos** | ✅ **sí** |
| ④ | **Se oyen en AMBOS sentidos** | ✅ **sí** |
| ⑤ | Red real de Quito | ✅ **sí** |

### 🔴 Por qué ③ es la forma correcta del verde, y no un detalle

> **Cada aparato vio la cámara del OTRO.** *Nadie se vio a sí mismo y creyó
> que había andado.*

Un preview local funcionando prueba que la cámara del teléfono abre — **no
prueba que haya transporte**. El verde de este gate es bidireccional en las
dos capas, video y audio, y por eso dice lo que dice. *Es la misma disciplina
del discriminador: un verde que también saldría verde con el cable cortado no
mide el cable.*

---

## §3 · LOS BINARIOS QUE SE GATEARON — identidad, para que sea reproducible

Los dos **autónomos**: perfil `preview`, build **local**, bundle embebido
verificado dentro del archivo. **Sin Metro, sin laptop.**

| app | paquete · versión | sha256 |
|---|---|---|
| **cliente** | `com.epetplace.cliente` · 1.0.5 · 167 MB | `3a0a992194b0bbfef1f22a16a6092c5de914800cd12823d55828909b28431ab4` |
| **prestador** | `com.epetplace.prestador` · 1.0.6 · 202 MB | `2b1f6858a3c3bc545a5a05d3c6a0d8148fab9e1c0920aa852e333dc5d598d1e4` |

**Ancla de código:** `fafffefa` (`main`), árbol limpio
(`isGitWorkingTreeDirty: false`, leído del payload de la build, no del texto
del mensaje).

**Verificado DENTRO de cada APK, antes de entregar** — no declarado:

- los cinco permisos: `CAMERA` · `FOREGROUND_SERVICE` ·
  `FOREGROUND_SERVICE_CAMERA` · `FOREGROUND_SERVICE_MICROPHONE` ·
  `FOREGROUND_SERVICE_MEDIA_PLAYBACK`;
- el transporte nativo: **`libjingle_peerconnection_so.so`**;
- **115** (cliente) y **116** (prestador) referencias a LiveKit en bytecode;
- bundle embebido presente ⇒ autónomos.

> ⚠️ **Y las builds NO salieron de EAS**: la cuota del plan gratuito estaba
> agotada (resetea el 1-sep-2026). Salieron con `build --local`, precedente
> S78. *Se anota porque un acta que dice «build de EAS» manda a la próxima
> sesión a buscar un enlace que no existe.*

---

## §4 · LO QUE ESTE VERDE FIRMA, Y LO QUE RETIRA

### ✅ **LiveKit Cloud queda FIRMADO SIN CONDICIÓN.** *(Firma del founder, 26-ago-2026.)*

### ☠️ **Se retira la escalera de caída — y su razón es de forma:**

La escalera era **plugin genérico de Expo
(`@config-plugins/react-native-webrtc`) → y después Agora**. Existía para un
solo caso: *que el plugin de LiveKit no funcionara bajo SDK 57*.

> **Ese caso se midió y no ocurrió** ⇒ **no queda condición que la dispare.**

*Una escalera de caída sin disparo no es una red: es un camino que alguien va
a tomar por las dudas.* Se retira entera.

⚠️ **Lo que la medición de D deja EN PIE y no lo toca este verde** — porque
es de otra naturaleza y sigue siendo cierto:

- **LiveKit es Apache-2.0 y self-hosteable, con TURN embebido.** La salida
  ante un cambio de política o de precio del proveedor **no era la escalera:
  es el self-host**, y sigue disponible. *Esa fue la razón ④ de la
  recomendación y no dependía de esta build.*
- **Agora tiene free tier más que doble** (≈250 consultas contra 50–110), y
  ésa es su única ventaja de plata real — **no es más barato**: su video HD
  sale ≈$0,16/consulta contra ≈$0,11. *(D corrigió su propia cuenta el
  26-ago; el dato queda porque el día que el volumen importe, alguien va a
  volver a preguntar.)*

---

## §5 · LA OBSERVACIÓN MENOR — anotada como tal, no como defecto

**La pantalla del cable no muestra preview propio.**

**No es transporte: es vista local.** La pantalla existía **para probar el
cable**, no para ser completa — y el verde ③ prueba que el video del otro
llega, que es lo que el cable tenía que demostrar.

⇒ **La in-call real de la tanda 2 sí lo lleva.** Queda como ficha, no como
deuda de este gate.

---

## §6 · QUÉ QUEDA HABILITADO POR ESTE VERDE

- **La tanda 2 puede construir la in-call real** sobre LiveKit sin decisión
  pendiente de transporte.
- **`video-token` (pista D) queda validada de punta a punta** por el camino
  real, no solo por su arnés.
- **El encendido sigue sin tocar**: `tipos_servicio.telemedicina.reservable`
  permanece en `false`. *Este verde firma el transporte, no abre el
  servicio* — la llave es del founder y va última.
