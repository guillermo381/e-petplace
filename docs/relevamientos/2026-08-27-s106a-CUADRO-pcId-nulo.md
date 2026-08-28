# ☠️ RESUELTO — LEER ESTA CABECERA ANTES QUE EL CUERPO

> 🔴 **ESTE DOCUMENTO YA NO DESCRIBE EL ESTADO. Se conserva por su método, no
> por su conclusión.**
>
> Su título decía *«el cuadro no captura: `pcId` nulo»*. **Hoy captura**: con la
> cura `9ef08240` el `pcId` resuelve —`{ transporte: 'publisher', via: 'pc',
> id: 0 }`— y la cadena entera corre con `resultado ok:true`, ejercida dos veces
> en cita real.
>
> **Y la causa que este documento no podía ver:** la v1 leía **un solo**
> transporte (`subscriber`); resolvió por **`publisher`**. *Lo que curó fue
> recorrer los transportes, no las dos formas del `pc`* — cosa que este
> documento pidió medir y quedó medida.
>
> **Dónde está el estado real:** `docs/loop/S106-A-CIERRE.md` (el cuadro entero
> **diferido a la V2**) y `…-CUADRO-bloquea-evidencia-para-C.md` con **su
> enmienda**.

---

# ⏪ Texto original (27-ago, 23:0x) — conservado, NO vigente

**A · 27-ago-2026, 23:0x.** Capturado por logcat con el founder tocando el
botón. **Tres de tres idéntico** (Samsung `R5CY201ZDVL`, OTA `01a04660`).

```
[CUADRO_C] toque   { hayPista: true, pcId: null, muteada: false, enabled: true }
[CUADRO_C] sale:sin_pista_o_sin_pc
```

## Lo que dice, campo por campo

| campo | valor | lectura |
|---|---|---|
| `hayPista` | `true` | la pista remota **está** |
| `enabled` | `true` | y está **activa** |
| `muteada` | **`false`** | 🟢 **la hipótesis de la pista silenciada queda DESCARTADA con dato** |
| **`pcId`** | **`null`** | 🔴 **falta el `peerConnection`, y es lo único que falta** |

⚠️ **El pronóstico de la mesa no se sostuvo.** Decía: *«si el log confirma que
está muteada, no hay defecto: era el criterio funcionando sin voz»*. **Está
medido que NO lo está** ⇒ es un hueco real.

## Por qué el mensaje confunde, y es cura de una línea

La guarda **`sin_pista_o_sin_pc` cubre dos casos y acá sólo falla uno.**

> *Tres lectores distintos habrían dicho «no hay pista» leyendo ese log.*

**Separar los dos brazos evita el diagnóstico equivocado**, y es lo mismo que ya
costó hoy con `applyConstraints` (`L-429`): **un mensaje verdadero sobre la
condición equivocada manda a arreglar lo que no está roto.**

## Y no es timing

`hayPista` se resuelve por un camino y `pc` por otro; **sólo el segundo viene
vacío.** *Si fuera timing de la llamada, al tercer toque —con la sala ya
establecida— habría cambiado. Los tres son idénticos.*

## Dueño: C

De dónde debe salir `pcId` —el `RTCPeerConnection` del fork, el participante
remoto, o la sala— **es lo que ella midió al escribir la spec de la vía
nativa**. *Adivinar cuál de los tres es inventar la intención.*

## Nota de método

No se pudo leer `[update]` (la app ya estaba abierta al limpiar el buffer), **y
no hace falta**: `[CUADRO_C]` **sólo existe en `01a04660`**, así que su
presencia **prueba** el bundle. *El marcador que faltaba lo suple la propia
instrumentación.*
