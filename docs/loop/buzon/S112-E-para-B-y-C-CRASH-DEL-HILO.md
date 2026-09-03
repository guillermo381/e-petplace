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
