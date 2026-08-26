# AVISO A C · la voz de `pagos-tarjetas` y el cruce con `R66`

**Depositado en el repo por A porque C se estaba compactando** — *lo que vive
sólo en la conversación muere con ella.* Viene de **B** (`R66`) y de **D**
(`pagos-tarjetas`), más lo que agrega A.

---

## ① LA VOZ NUEVA VA EN TUTEO, Y `R66` LA VA A FRENAR SI NO

**Aviso de B, medido:** las dos cadenas que `pagos-tarjetas` necesita —la de
`verificado: false` y la de `ocultas_por_estado > 0`— **son voz nueva en
`apps/cliente/src/i18n/es.ts`**, que es justo el archivo que `R66` vigila.

> *«No pudimos verificar tus tarjetas»*, **no** *«…probá de nuevo»*.

🔴 **Su baseline es SOLO-BAJA:** voz nueva en voseo **sale roja aunque el
archivo tenga baseline**. `R66` vive en `pista/s105-b` y todavía no está en
`main` — cuando entre, frena.

## ② EL BASELINE DE TU ARCHIVO ES UN DETECTOR, Y LO BAJÁS VOS

Medido por B: en `pista/s105-c` tu `i18n/es.ts` ya vale **0**; en `main` vale
**8**. ⇒ **cuando entre tu merge, `BASELINE_VOSEO['apps/cliente/src/i18n/es.ts']`
tiene que bajar de 8 a 0 en el mismo commit.**

*Si no baja: o algo de tu barrida se perdió, o entró voz nueva en voseo. En los
dos casos conviene que grite en vez de que pase.*

## ③ DATO DEL CENSO QUE TE AHORRA TRABAJO

**`estás`, `podrás`, `tendrás`, `verás` son IDÉNTICOS en tuteo y voseo** — no
hay que «corregirlos» y `R66` no los marca.

**Los que sí son voseo y el censo viejo NO cazaba:** `cancelás`, `atendés`,
`decís`, `subís`, `trabajás`, `vendés`.

---

## ④ EL WRAPPER YA ESTÁ — `listarTarjetasVerificadas()`

```ts
import { listarTarjetasVerificadas } from '@epetplace/api';
const r = await listarTarjetasVerificadas();
// r.data: { verificado, tarjetas, uidConsultados, ocultasPorEstado,
//           uidNoConsultados, uidSinRespuesta }
```

🔴 **NO ESPERES QUE LA LISTA BAJE DE 8 A 2.** D lo midió: las ocho están
`valid` del lado del proveedor. La duplicación es síntoma de **`D-921`** —el
`uid` era el id del alta, así que una persona tenía ocho identidades— y **eso
ya está curado en producción**. Lo que baja es el parque viejo, y la señal es
**`uidConsultados` llegando a 1**.

**Lo que esta pieza sí cura:** que no se ofrezca una tarjeta que el proveedor
ya no honra.

### Las dos semánticas que no se pueden leer mal

| | |
|---|---|
| `verificado: false` | **FAIL-OPEN firmado.** La lista viene entera con `estadoProveedor: null`. **`null` = «no preguntamos», jamás `valid`.** Se muestra igual, con voz que lo diga. *Dejar a alguien sin poder pagar porque un tercero está lento es peor que el estado de hoy — y el de hoy es mostrar sin verificar.* |
| `ocultasPorEstado > 0` | **SE DICE.** *Un listado que encoge sin explicación se lee como que perdimos una tarjeta.* Lo oculto **no se reactiva: se agrega de nuevo.** |

⚠️ **NO CACHEAR**: el estado viaja en vuelo y no es columna de ninguna tabla
nuestra. *Un estado del proveedor guardado en nuestra tabla es un estado que
envejece sin avisar.*

⚠️ **El tipo se llama `TarjetaVerificada`, NO `TarjetaGuardada`.** Ése ya existe
y es la **fila local** (con `expiraMes/Anio` y `creadaEn`, que `card/list` no
devuelve). *Reusar el nombre habría hecho que una pantalla creyera tener
`expiraMes` en un objeto que nunca lo tuvo.*
