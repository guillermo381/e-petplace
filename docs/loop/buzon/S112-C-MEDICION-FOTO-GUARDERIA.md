# S112-C · LA FOTO DEL DURANTE DE GUARDERÍA — medición, sin curar

> **Contra el ANCLA del lote**, no contra mi árbol: `fde8494d`
> (*«merge: S112-A — L-479, el generado viejo acusa en falso»*, **1-sep 21:51 -05**),
> y contra la **base viva** el **2-sep**. Todo lo de acá se leyó del objeto.
> Groups del lote: `6aedf349` / `51a263b2`.

---

## §0 · DÓNDE MUERE, EN UNA LÍNEA

**Muere en la CAPA 0 —la que nadie listó— y después otra vez en la CAPA 8.**

> **① El botón «Sacar foto» NO SE DIBUJA**, porque exige animales `en_guarderia`
> y **hoy hay CERO**. El founder no está viendo fallar la cámara: **está viendo
> que no hay botón.**
>
> **② Y si lo hubiera, la familia igual no vería la foto:** el hilo del cliente
> pinta el **path de Storage como si fuera una URI**, y el bucket es privado.

**Las capas 1 a 6 —permiso, captura, redimensionado, subida, fila, etiquetas—
están sanas y EJERCIDAS: hay 3 fotos reales en el bucket y 3 filas con su
etiqueta.** El problema no está donde el reporte lo sugiere.

---

## §1 · CAPA POR CAPA, con evidencia

| # | capa | veredicto | evidencia |
|---|---|---|---|
| 0 | **la puerta** | 🔴 **MUERE** | `dia.tsx:600` — `viaje === null && adentro.length > 0`; `adentro` = estado `en_guarderia` (`:304`). **Base: 0.** |
| 1 | permiso de cámara | 🟢 sano | `capturaFoto.tsx:177` `requestCameraPermissionsAsync`; sin permiso devuelve `permiso_denegado` y la hoja lo dice (`hoja-media:167`) |
| 2 | captura | 🟢 sano | `launchCameraAsync` — cámara del SISTEMA, sin preview embebido (es la decisión de la casa, no un defecto) |
| 3 | redimensionado | 🟢 sano | `normalizar` → `redimensionar(1600, 0.7)`; el hook pasa `LADO_MAXIMO_FOTO`/`CALIDAD_FOTO` |
| 4 | subida | 🟢 **sano y ejercido** | bucket `guarderia-media` (privado), path `{prestadorId}/guarderia-foto-{idLocal}.jpg`, `upsert:false`. **3 objetos en el bucket.** |
| 5 | fila de evidencia | 🟢 **sano y ejercido** | `guarderia_media` = **3 filas**, `guarderia_media_etiquetas` = **1 por foto** |
| 6 | idempotencia | 🟢 sano | colisión de path ⇒ se lee como «ya estaba» y sigue al registro (`motor-media:155`) |
| 7 | **pantalla del prestador** | 🔴 **MOTOR SIN PUERTA** | `obtenerMediaDelDia` existe con wrapper y **CERO consumidores en `apps/`** |
| 8 | **en vivo de la familia** | 🔴 **MUERE** | `guarderia/[estadiaId].tsx:517` y `:571` pasan `m.archivoUrl` **crudo** a `<Image>` / `VisorFoto` |

### Las tres fotos que sí existen — y **ninguna es de este bundle**

| capturada (Guayaquil) | subida | etiquetas |
|---|---|---|
| 2026-09-01 10:42 | 10:43 | 1 |
| 2026-09-01 10:42 | 10:42 | 1 |
| 2026-09-01 10:40 | 10:40 | 1 |

⚠️ **El ancla del lote es de las 21:51 del 1-sep — once horas DESPUÉS.**
⇒ **Con el bundle que el founder está usando se sacaron CERO fotos.** Lo que
funcionó, funcionó con el bundle anterior. *Sin esta fecha, las 3 filas se leen
como «anda» y son de otro binario.*

---

## §2 · ① LA CAPA 0 — el botón que no está

```
dia.tsx:600   {viaje === null && adentro.length > 0 ? <Boton «Sacar foto» …
dia.tsx:304   const adentro = listo?.estadias.filter(e => e.estado === 'en_guarderia') ?? []
```

**Estado de las estadías, medido en la base el 2-sep:**

| estado | n |
|---|---|
| `reservada` | **91** |
| `no_recogida` | 3 |
| `retorno_en_curso` | 2 |
| **`en_guarderia`** | **0** |

⇒ `adentro = []` ⇒ **el botón no se monta**, y con él no se monta nada de la
cadena. La hoja tampoco tendría a quién etiquetar: `presentes` es el mismo
arreglo, así que el selector *«quiénes salen»* saldría **vacío** y «Enviar»
quedaría apagado con su razón.

**🟢 Y esto NO es un defecto de la pantalla: es Ley 23 funcionando.** El
comentario de esa línea lo dice: *«sólo con animales ADENTRO — ofrecerlo durante
un viaje invitaría a sacarlas en la calle»*. **La pantalla frenó bien.**

> ### 🔴 Lo que sí es defecto es que **frenar bien y no existir se ven igual**
> No hay ninguna línea que diga *«la foto aparece cuando haya animales
> adentro»*. Un control ausente y una función rota **son indistinguibles desde
> el asiento del founder**, y por eso el reporte llegó como *«sigue sin
> funcionar»*.

**El camino para que aparezca** (los tres actos existen y están cableados):
`reservada` → acta en la puerta ⇒ `recogida_en_curso` → `marcarLlegada` (cierra
el viaje) ⇒ **`en_guarderia`** ⇒ **aparece el botón**.
*Que haya 2 en `retorno_en_curso` prueba que alguien ya recorrió ese camino
entero: el arco funciona, hoy no hay nadie parado en ese escalón.*

---

## §3 · ② LA CAPA 8 — la familia no puede ver la foto, por DOS razones apiladas

**Lo que el lector devuelve** (`obtener_media_de_mi_mascota`, cuerpo leído):

```sql
RETURNS TABLE(media_id uuid, tipo text, archivo_url text, …)
  SELECT m.id, m.tipo, m.archivo_url, …          -- ← el PATH, no una URL firmada
```

**Lo que la pantalla hace con él:**

```
guarderia/[estadiaId].tsx:517   source={{ uri: m.archivoUrl }}
guarderia/[estadiaId].tsx:571   fotos={fotos.map(m => m.archivoUrl)}
```

`de680000-…/guarderia-foto-foto-1788277379157-s8sc7s.jpg` **no es una URI**.
⇒ **hueco, siempre, aunque la foto exista.**

**🔴 Y la segunda razón, que sobrevive aunque se firme:** la policy de SELECT del
bucket exige `user_puede_acceder_prestador(split_part(name,'/',1)::uuid)`.
**Una familia no la cumple** ⇒ ni firmando podría bajarla.
*Son dos defectos apilados con el mismo síntoma: curar sólo el primero deja el
hueco igual, y va a parecer que la cura no sirvió.*

---

## §4 · CAPA 7 — el prestador no tiene dónde ver lo que subió

`obtenerMediaDelDia(prestadorId, fecha)` existe **con wrapper** y tiene **cero
consumidores en `apps/`** (censado sobre el ancla).

La miniatura que el cuidador ve vive en `enviadas`, **estado local de la hoja**
(`hoja-media:104`). **Al cerrar la hoja desaparece y no vuelve por ningún
camino.** *Sacó la foto, la vio un segundo, y no hay pantalla que la muestre de
nuevo — desde su asiento eso se lee exactamente como «no se guardó».*

---

## §5 · CONTROLES

| control | resultado |
|---|---|
| 🟢 **POSITIVO · el patrón correcto existe** | **6 pantallas del cliente** firman con `resolverUrlsFotos` antes de pintar (hogar, paseos, grooming, veterinaria, adiestramiento, guardería-hub). **`guarderia/[estadiaId]` es la ÚNICA que pinta el path crudo.** |
| 🟢 **NEGATIVO · path inválido rebota** | policy INSERT: `user_puede_acceder_prestador(split_part(name,'/',1)::uuid)`. Un primer segmento ajeno **rebota**; uno que no sea uuid **falla en el cast**. |
| 🟢 **NEGATIVO · el guard del lector produce su rojo** | los dos lectores rebotan `auth_required` (42501) sin sesión — **medido, no supuesto** |
| ⚠️ **NO MEDIDO, y no se inventa** | el **control positivo de los dos lectores** exige un JWT real. Sin sesión no pude correrlos. *Lo que sé es que los datos están y que el guard cierra; NO sé que el lector devuelva las 3 filas al usuario correcto.* Es de E. |
| ⚠️ **NO MEDIDO** | nada de esto se ejerció **en aparato**. Todo es lectura del objeto. |

---

## §6 · LA FICHA ANTERIOR — «sigue» dice que hubo una cura

**Busqué y NO ENCONTRÉ ficha previa de este defecto.** Censado: `DEUDAS_CANONICAS`
por `guarderia`+`foto|captura|media|cámara`, los partes de S110/S111, y el
historial de los cuatro archivos de la cadena (`hoja-media-guarderia`,
`use-captura-media`, `motor-media`, `cola-media`). **El último commit sobre la
hoja es de S111-C** — *después del ancla no hubo ninguna cura de esto*.

**⇒ La palabra «sigue» no corresponde a una cura anterior de esta cadena.**
Lo más parecido son dos fichas, y las dos advierten justo lo contrario de lo que
uno esperaría:

- **`D-983`** — *«las fotos del durante son PRIVADAS y van al hilo de la familia.
  Eso NO necesita la autorización de imagen y NO está bloqueado»*, con su aviso
  literal: *«quien retome esto sin la distinción va a leer que la autorización
  está en false y va a concluir que la media está trabada. **No lo está.**»*
  **Confirmado: la autorización no es la causa.**
- **`D-308`** — el precedente de la casa: una foto privada se muestra **con
  VisorFoto FIRMADO**. *La forma correcta ya estaba resuelta desde S47.*

---

## §7 · QUÉ FRENÓ LA PANTALLA vs QUÉ FRENÓ EL CÓDIGO

**Frenó la pantalla, y frenó BIEN:** sin animales adentro no ofrece la foto
(Ley 23). El costo es que **frenar bien y no existir se ven igual**, y no hay una
línea que diga cuándo aparece.

**El código no frenó NADA donde más importaba:** pasar un path de Storage a
`<Image>` **no falla, no tira error y no deja rastro** — dibuja un hueco. Ningún
typecheck lo ve, porque `archivoUrl` es un `string` y `uri` pide un `string`.
*Es la clase de la casa: un tipo correcto sobre dos significados distintos.*

---

## §8 · LO QUE NO HICE

**No curé nada.** Esto es medición.
Y **no probé en aparato**: todo se leyó del ancla y de la base.
