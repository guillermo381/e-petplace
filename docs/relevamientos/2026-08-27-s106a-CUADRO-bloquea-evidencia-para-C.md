# EL CUADRO CAPTURA Y BLOQUEA — la evidencia que ya estaba en el log

**A · 27-ago-2026, 22:58.** Del log de la captura ejercida (`/tmp/c5.log`,
Samsung `R5CY201ZDVL`, OTA `01a04680`). **Nadie tiene que reproducir nada para
tener esto**: la ventana de escucha cubrió los 21 segundos posteriores.

## 🟢 Lo que sí funcionó, y queda medido

```
pcId:resuelto   { via: 'pc', id: 0 }
toque           { hayPista: true, pcId: 0, muteada: false, enabled: true }
aviso:despachado
puerta:entra    { trackId: '856e510a…', pcId: 0, hayModulo: true }
puerta:ok       /…/cache/cuadro-1787889492058.png
resultado       { ok: true, ruta: … }
```

**Cero excepciones, cero `no_resuelto`, cero `sin_pcManager`.** El PNG existe.

## 🔴 EL DISCRIMINADOR, y es lo que le sirve a C

```
08-27 22:58:12.092   [CUADRO_C] pcId:resuelto  { via: 'pc', id: 0 }
08-27 22:58:25.368   [CUADRO_C] pcId:resuelto  { via: 'pc', id: 0 }   ← +13 s
```

`pcId:resuelto` **sólo se imprime cuando el componente se evalúa de nuevo.**
Trece segundos después de la captura, con la pantalla ya bloqueada para el
founder, **React seguía re-renderizando y el hilo de JS seguía vivo.**

⇒ **La app NO estaba colgada ni crasheada: estaba dibujando.**

> *Eso separa dos causas que se ven idénticas desde afuera —«JS trabado» y «algo
> encima que se come los toques»— y descarta la primera con dato.* **Sostiene la
> hipótesis de C**, y explica los tres síntomas de una vez: la imagen no se va,
> el video no vuelve, y colgar no responde **porque ningún toque llega a
> ninguno de los tres controles.**

## ⚠️ Lo que NO es causa, para que nadie lo persiga

```
08-27 22:58:33   'local connection quality lost while publishing, triggering full reconnect'
                 'connection state changed: connected -> reconnecting'
                 rn-webrtc:pc:DEBUG 0 removeTrack +36s
```

Es de **21 segundos DESPUÉS** de la captura, con el bloqueo ya instalado.
**Llega tarde para explicarlo**: es consecuencia o coincidencia, no causa. *Un
evento posterior al síntoma no lo produce, por vistoso que sea el mensaje.*

El log corta ahí porque **el founder mató la app** — lo esperable cuando colgar
no responde. No es una caída.

## 🔴 Y una corrección al diagnóstico de la propia cura (`9ef08240`)

C atribuyó la falla de la v1 al eje **`pc` vs `_pc`** (el getter que se pierde
al minificar). **El aparato dice `via: 'pc'`** — resolvió por la forma que la v1
**ya usaba** ⇒ ese eje no puede ser la causa. Y tampoco fue el `0` como falsy:
la v1 ya validaba con `typeof id === 'number'`.

Lo que cambió de verdad: la v1 leía **una sola** ruta
(`pcManager.subscriber.pc`), la v2 recorre **cuatro**
(`subscriber · publisher · _subscriber · _publisher`).

⇒ **Curó recorrer los transportes, no las dos formas del `pc`.** El candidato
más probable es `_subscriber` —el guión bajo está en el *manager*, no en el
transporte— **pero no se afirma: el marcador no lo dice.**

**Y ahí está el defecto del instrumento, que cuesta una línea:**
`marca('resuelto', { via: … })` **informa el eje que no discrimina y calla el
que decide.** *Un instrumento que reporta el eje equivocado no miente: te deja
concluir con confianza sobre lo que no midió* (`L-429`, ahora en el
instrumento en vez de en el mensaje). **Agregar el nombre del transporte a esa
marca** evita que la próxima mano proteja la forma equivocada y borre la que lo
sostiene.

## Nota de método — la receta del cable, porque me costó dos intentos

```bash
adb logcat -c
adb logcat -s 'ReactNativeJS:V' > /tmp/captura.log    # en background
```

**Las dos trampas, las dos con el mismo modo de falla —silencio idéntico al de
«no pasó nada»—:**

- `ReactNativeJS:*` **sin comillas**: zsh lo expande como glob, no encuentra
  archivos y **aborta el comando**. La redirección ya creó el archivo vacío.
- **`timeout` no existe en macOS.**

**Y el control positivo que cierra la duda gratis:** pedir el reinicio de la app
antes de tocar. Al arrancar imprime `[update] id=… · embedded=false`, que
**prueba el cable y el bundle en un solo acto**. Sin él, un toque sin log deja
sin saber si el defecto es del dedo, del bundle o del instrumento.
