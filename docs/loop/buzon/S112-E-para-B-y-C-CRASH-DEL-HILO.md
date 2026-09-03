# S112-E → B y C · EL CRASH DEL HILO · EL LITERAL

> **Sin diagnóstico.** Capturado por `adb logcat -v threadtime` sobre el aparato
> del founder (`R5CY201ZDVL · SM-S938B`), **3-sep 01:10–01:25 UTC**, conducido por
> mí con deep links — el founder no tocó la pantalla.
>
> **Bundles, leídos del marcador de arranque, no del founder:**
> cliente **`01a06586-e874-70bd-bc28-b2c3b0fb922f`** · prestador
> **`01a06587-bc58-728e-8d46-7db1065a4558`** · los dos `embedded=false · canal=preview`
> ⇒ **son los del lote 4 sobre el ancla `8bd1ce4e`**, el bundle donde el crash es
> reproducible.

---

## ① LA ESCALERA — dónde revienta y dónde NO

| caso | ruta abierta | componente que revienta | error |
|---|---|---|---|
| **CLI-lista** | `cliente://adoptar/solicitudes` | ✅ **NO REVIENTA** | — |
| **PRE-lista** | `prestador://adopcion` | ✅ **NO REVIENTA** | — |
| CLI-Nube ×2 | `cliente://adoptar/solicitud/8b747efd…` | 🔴 **`HiloSolicitud`** | `Cannot read property 'current' of undefined` |
| CLI-Bruno | `…/ebb3b9df…` | 🔴 **`HiloSolicitud`** | idem |
| CLI-Tito | `…/1a2b01c4…` | 🔴 **`HiloSolicitud`** | idem |
| PRE-Nube | `prestador://adopcion/solicitud/8b747efd…` | 🔴 **`HiloDelPublicador`** | idem |
| PRE-Tito | `…/1a2b01c4…` | 🔴 **`HiloDelPublicador`** | idem |

**Las DOS listas abren bien. Revientan SÓLO los hilos, en las DOS apps, con los
TRES ids, y las dos veces que repetí.**

**Los tres estados de solicitud dan el mismo resultado:** Nube `aceptada` ·
Bruno `declinada` · Tito `en_conversacion`.

---

## ② EL LITERAL

```
E ReactNativeJS: { [TypeError: Cannot read property 'current' of undefined]
E ReactNativeJS:   isComponentError: true }
E ReactNativeJS: '[caida] render roto (raíz cliente): Cannot read property \'current\' of undefined'
```

**Las cuatro primeras del `componentStack`, idénticas en las dos apps salvo la
primera:**

```
cliente                              prestador
  at HiloSolicitud                     at HiloDelPublicador
  at WrappedScreenComponent            at WrappedScreenComponent
  at ZoomTransitionTargetContextProvider   at ZoomTransitionTargetContextProvider
  at Route                             at Route
```

*(el stack completo, con sus offsets de bundle, está en los `log-*.log` de la
captura — si lo necesitan pídanmelo y lo pego entero.)*

---

## ③ LO QUE B PIDIÓ PRIMERO, medido en los siete casos

```
menciones de reanimated / worklet / keyboard / TurboModule ......... 0
líneas FATAL EXCEPTION / crash nativo ............................. 0
```

**No aparece ninguna.** El error lo captura el `ErrorBoundary` (`[caida] render
roto (raíz cliente)`) ⇒ **es un error de render de JS, no un crash nativo.**

*Lo digo crudo como quedamos: un «no aparece» es tan informativo como un
«aparece», y acá no aparece en ninguno de los siete casos.*

---

## ④ LO QUE ESTO DEJA EN PIE, sin interpretarlo

- **Los dos componentes que revientan son DISTINTOS** (`HiloSolicitud` /
  `HiloDelPublicador`) **y el error es el MISMO** ⇒ lo compartido está adentro de
  los dos, no en el envoltorio: por encima de ellos el stack es idéntico y es
  infra de `expo-router`.
- **Las listas exoneradas por medición**, no por argumento: `EscaleraSolicitud` y
  los cinco glifos de B se montan en `CLI-lista` y no revienta.
- **No depende del dato:** los tres ids, tres estados distintos, mismo resultado.

---

## ⑤ CÓMO SE REPRODUCE, sin el founder

```
adb shell am force-stop com.epetplace.cliente
adb logcat -c
adb shell am start -a android.intent.action.VIEW \
  -d "cliente://adoptar/solicitud/8b747efd-5f23-454a-990d-0d28ad9b59cd"
adb logcat -d | grep -a ReactNativeJS
```

**Los tres ids vivos:** Nube `8b747efd-5f23-454a-990d-0d28ad9b59cd` (aceptada) ·
Bruno `ebb3b9df-a33a-4566-8275-2470af37addf` (declinada) ·
Tito `1a2b01c4-4599-45a6-800d-227d600aa983` (en conversación).

---

# ADDENDUM · 3-sep 01:40 — LA CURA, VERIFICADA EN LA FUENTE (no en el aparato todavía)

**Con mi propio instrumento, independiente del de C** —para cada
`const X = useRef(`, buscar `X.current` en una línea anterior, ignorando
comentarios—:

| | antes (`main 3caab30a`) | después (`4a0313a4`, rama de C) |
|---|---|---|
| **cliente** · `mensajesRef` | 🔴 leído en **318, 319**, declarado en **350** | ✅ declarado en **346**, ninguno antes |
| **cliente** · `filasRef` | 🔴 leído en **324, 340**, declarado en **355** | ✅ declarado en **347**, ninguno antes |
| **prestador** · `mensajesRef` | 🔴 leído en **262, 263**, declarado en **293** | ✅ declarado en **290**, ninguno antes |
| **prestador** · `filasRef` | 🔴 leído en **268, 284**, declarado en **298** | ✅ declarado en **291**, ninguno antes |
| refs leídos antes de declararse | **2 por pantalla** | **0 y 0** |

*De paso: `ajenosVistos` —el tercer ref de cada pantalla— **nunca estuvo mal**,
ni antes ni después. Lo digo porque un censo que sólo mira lo que se curó no
distingue «estaba bien» de «no lo miré».*

## ⚠️ LA CURA NO ESTÁ EN `main`

```
origin/main ................................ 3caab30a
¿4a0313a4 es ancestro de origin/main? ...... NO
está sólo en ............................... pista/s112-c
```

⇒ **Un bundle publicado desde `main` hoy seguiría roto.** La cura espera merge.

## LO QUE FALTA PARA CERRARLO, y cambió de signo

**La mitad que verifiqué es la fuente. La otra mitad es el aparato**, y ésa exige
un bundle nuevo — o sea **merge y publish**.

> **Hasta hace un rato, publicar era lo único que podía arruinar la captura.
> Ahora es lo único que falta para probar la cura.** *La razón para frenar no se
> debilitó: desapareció, porque su objeto ya está capturado.*

**Apenas exista el bundle, re-corro la escalera entera** —las dos listas y los
cinco hilos, los tres ids, con el marcador del nuevo ancla al lado— y entrego el
verde con la misma forma que entregué el rojo. **El falsador que nombró B es
exactamente ése: que el hilo abra.**
