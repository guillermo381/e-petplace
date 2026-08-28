# S107 · CONTRATO — LA MEDIA DEL DURANTE (pista A → D, B, C)

> **Publicado:** 28-ago-2026, antes de la migración (regla S106). **D arranca contra esto.**
> **Fuente:** plan §4.8 + `CRITERIO_LEGAL_GUARDERIA` §5 (las cuatro capas de imagen) + firmas ① y ② (foto grupal y clip ≤30 s con selección de animales).

---

> **Nombres RATIFICADOS por A (28-ago) y CONGELADOS:** `guarderia_media` + `guarderia_media_etiquetas`. El porqué —y la lápida de la tabla legacy `estadias`— viven en `s107-contrato-cupo-franja-estadia.md` §⓪bis.

## ① LA REGLA MADRE — **una media = un archivo; las etiquetas son muchas**

🔴 **El binario JAMÁS se duplica por animal.** Una foto con cuatro perros es **un archivo** y **cuatro etiquetas**.

```
guarderia_media
  id            uuid pk
  prestador_id  uuid not null
  fecha         date not null          -- el día de la estadía (local del lugar)
  tipo          text not null CHECK IN ('foto','clip')
  archivo_url   text not null
  miniatura_url text
  duracion_s    numeric
      CHECK (tipo = 'foto' AND duracion_s IS NULL)
         OR (tipo = 'clip' AND duracion_s > 0 AND duracion_s <= 30.9)
  capturada_en  timestamptz not null
  autor_user_id uuid not null

guarderia_media_etiquetas
  media_id    uuid not null
  mascota_id  uuid not null
  estadia_id  uuid not null            -- ancla a la estadía-día de ESE animal
  UNIQUE (media_id, mascota_id)
```

🔴 **El tope de 30 s se verifica en el SERVIDOR, no sólo en la captura** — un archivo de 31 s **no entra**. La tolerancia de contenedor (**+0,9 s**) va **en el CHECK, declarada**, no en un comentario: es la diferencia entre una ley que frena y una promesa de diseño.

**Mínimo una etiqueta:** una media sin etiquetas no se publica — se rechaza tipado (`media_sin_etiquetas`). *Etiquetar de más rompe más que etiquetar de menos, pero etiquetar de cero es una foto que no llega a nadie.*

---

## ② LA LECTURA — y la línea de privacidad, que es lo delicado

- **El prestador** lee la media de **sus** estadías.
- **El dueño** lee la media etiquetada con **su** animal.
- 🔴 **En la lectura del dueño, los nombres de los otros animales de la foto NO VIAJAN.** Ni el id, ni el nombre, ni el conteo por nombre. **Se resuelve en el SELECT del server, jamás filtrando en la pantalla** — lo que no viaja no se filtra mal.

**Wrappers:**
`obtenerMediaDelDia(prestadorId, fecha)` → para el prestador, con sus etiquetas completas.
`obtenerMediaDeMiMascota(mascotaId, fecha?)` → para el dueño, **sin las otras etiquetas**.
`publicarMedia({ claveIdempotencia, archivoUrl, tipo, duracionS?, mascotaIds[], fecha })` → crea la media **y sus N etiquetas y sus N eventos en una sola transacción**.

### 🔴 `publicarMedia` ES IDEMPOTENTE, Y ESO VA EN EL TIPO — corrección de D, adoptada

**El defecto que cierra, y es de la clase que no da error:** la cola de D
**reintenta por diseño** (sin señal, la media espera y vuelve a intentar). Un
**timeout ambiguo** —la subida llegó, la respuesta no— hace que el reintento
registre **la misma foto dos veces**. Eso no aparece como un fallo: aparece
como **eventos duplicados en el expediente de un animal**, meses después, sin
nada que los explique.

> *Un expediente append-only que viaja con la mascota no perdona un duplicado:
> no hay a quién preguntarle cuál de los dos pasó.*

**La forma, y la casa ya la tiene:** `claveIdempotencia` la genera **el
cliente** (D) **antes del primer intento** y la **reusa en cada reintento** —
igual que `nuevaClaveIdempotencia` en el pedido de despensa y que
`clave_idempotencia` en `pagos_intentos`.

```
guarderia_media
  + clave_idempotencia  text NOT NULL
  UNIQUE (prestador_id, clave_idempotencia)
```

🔴 **Y el segundo intento NO es un error: es un ÉXITO que devuelve la media que
ya existe** (`ya_existia: true`). *Un reintento que rebota obliga a la cola a
distinguir «falló» de «ya estaba», y esa distinción es justo la que no puede
hacer con un timeout ambiguo* — mismo criterio que el molde S91 fijó para
`ya_existia`.

⚠️ **Va en el TIPO, no en una nota:** `claveIdempotencia` es **obligatoria** en
la firma. *Una idempotencia opcional la olvida el primer consumidor apurado, y
el modo de falla es silencioso.*

---

## ③ EL EXPEDIENTE — un evento por animal, apuntando al MISMO archivo

Cada animal etiquetado recibe **su** evento de expediente **apuntando a la misma media**. No se copia el archivo ni se crea una media por animal.

⚠️ **D mide primero cómo lo hace HOY el paseo grupal** (su medición 1: P19 rige desde S59 y el paseo ya es grupal por norma). **Si el paseo ya tiene la forma, se reusa; no se inventa una segunda.** Ese resultado vuelve a A y este contrato se enmienda si hace falta.

---

## ④ EL ENCUADRE ES LEY DE CAPTURA — vive en D, se declara acá

De `CRITERIO_LEGAL_GUARDERIA` §5, y es **obligación del prestador por contrato**, no lógica de app:
- el animal en cuadro; **personas no** — lo incidental **se recorta o se descarta antes de enviar**;
- **menores: descarte sin excepción**;
- en el domicilio (fotos de acta) **primer plano — la fachada y la numeración no se fotografían**;
- las fotos de estadía se toman **en las instalaciones**.

**La app guía y da la tijera.** 🔴 **Ningún texto de este bloque se redacta en pantalla como cláusula** — el contrato del prestador lo dice; la pantalla sólo guía el encuadre.

**La casilla de redes** es un **dato del expediente** (opcional · independiente · **apagada por defecto** · revocable) y viaja con la aceptación de documentos — contrato aparte. **La prohibición por defecto es texto del contrato del prestador, no lógica de app.**

---

## ④pre · EL PUNTO VIVO — **UNA FILA POR TRAMO, `UPDATE` JAMÁS `INSERT`** *(pedido de D, adoptado)*

```
guarderia_tramo_punto
  tramo_id  uuid PRIMARY KEY     -- 🔴 LA PK ES EL TRAMO: una fila, y sólo una
  lat       double precision NOT NULL
  lon       double precision NOT NULL
  visto_en  timestamptz NOT NULL
```

> ### 🔴 **CON `INSERT` LA TRAZA VUELVE POR LA PUERTA DE ATRÁS.**
>
> **Y no es una traza cualquiera: las paradas de una recogida son las CASAS de las otras familias.** *Un histórico de puntos con timestamps es un mapa de dónde vive cada cliente del prestador, reconstruible por cualquiera que pueda leer la tabla.* Guardar sólo el último punto no es una optimización: **es lo que hace inexpresable el dato que no queremos tener** (L-222).

**El lector devuelve UN punto o `null`** — nunca una lista.

> ### 🔴 **Y EL RECORTE VIVE EN EL SERVIDOR.** *Si el servidor manda la traza y la app pinta un punto, **la traza ya salió**.* Lo que no viaja no se filtra mal.

**Wrapper:** `obtenerPuntoVivo(tramoId) → { lat, lon, vistoEn } | null` · `registrarPuntoVivo({ tramoId, lat, lon, vistoEn })` (upsert por `tramo_id`).

**Cuándo hay punto:** sólo mientras el animal de ese dueño está **pendiente o a bordo** de ese tramo. Fuera de eso, `null` — y la pantalla lo dice, no muestra un punto viejo.

---

## ④bis · LOS AVISOS SE AGRUPAN EN EL SERVIDOR — *(medición de D, ratificada por la mesa el 28-ago)*

> ### **La agrupación es del SERVIDOR. Un digest local no existe.**
>
> **La razón es de hecho, no de preferencia: dos teléfonos subiendo media del mismo animal no pueden coordinar un digest entre ellos.** *Cada aparato sabe lo que él subió y nada más* — agrupar en el cliente produce «1 foto nueva» tres veces, que es exactamente el *«una push por foto»* que la firma prohíbe.

- **Agrupadas** («3 fotos nuevas de Thor»), **jamás una push por media** — y el que agrupa es el server, sobre lo que ya llegó.
- 🔴 **Fuera del digest, operativas e inmediatas:** las del **acta** y las de **tramo** («subió», «está en casa»). *Un aviso que dice que el animal ya está en casa no espera a juntarse con otro.*
- Rigen las reglas de silencio del modelo (memorial · atención en curso).

### ✏️ LA CATEGORÍA, RESUELTA CON SU NÚMERO *(medición de D, adoptada por la mesa)*

**El molde ya existe y le falta el productor:** la categoría **`resumen` está en el catálogo con CERO tipos que la usen.** ⇒ **no se inventa una categoría: se estrena la que estaba esperando.**

🔴 **Y el número que lo vuelve urgente, no estético: `operacion` tiene techo de 20 avisos cada 24 h.** Si la media del durante entrara por ahí, **veinte fotos consumen el techo del día y el aviso del RETORNO se pierde — CALLADO.**

> *El dueño no recibiría «Thor está en camino a casa», y no habría error en ningún lado: el techo hizo exactamente lo que le pidieron.* **Es la clase de defecto que este contrato viene cazando toda la sesión: el que no falla, el que omite.**

**El reparto, entonces:**

| qué | categoría | por qué |
|---|---|---|
| **la media del durante** (fotos y clips) | **`resumen`** | se agrupa, y **jamás compite por el techo de las operativas** |
| **los tramos** («subió», «está en casa») | **`operacion`** | inmediatas — *un aviso que dice que el animal ya está en casa no espera a juntarse con otro* |
| **las actas** | **`operacion`** | el dueño tiene que poder confirmar en el momento |

**D dejó su contrato escrito como TIPO en su módulo; A lo cablea al construir media/avisos** — *el tipo es la mitad de D, inerte y sin puerta, y la puerta es de A* (molde S91).

---

## ④ter · LO QUE D MIDIÓ Y **CONFIRMA** ESTE CONTRATO (28-ago-2026)

**El §③ pedía que D midiera cómo hace HOY el paseo la foto de grupo, con esta
condición: *«si el paseo ya tiene la forma, se reusa; no se inventa una
segunda»*. D midió, y la respuesta es que NO la tiene y NO puede tenerla** —
su media cuelga de UNA mascota (`evento_archivo_adjunto.mascota_id`,
`evento_adiestramiento_clips.mascota_id`, las dos singulares).

⇒ **El contrato se confirma sin enmienda: «una media = un archivo + N
etiquetas» es construcción nueva, y ahora está probado en vez de supuesto.**

---

## ④quater · LAS CADENAS DE PERMISO NO VIAJAN POR OTA — *(cierre de D, para el tren de builds)*

> ### 🔴 **SE HORNEAN EN EL MANIFEST Y EN EL `Info.plist`. Curarlas en el repo NO las cura en el teléfono.**

**Estado al cierre de D:** dos curas de tuteo **commiteadas** y una enmienda de la cadena de **ubicación en foreground** en camino — firma de la mesa: **nombra el paseo Y los traslados de guardería**. 🔴 **La cadena de «siempre» NO se toca**, porque el punto vivo corre **en foreground**.

**Las tres llegan al aparato con el tren `1.0.7` / `1.0.6`, no antes.**

### 🔴 LAS TRES CADENAS DEL CHECKLIST DEL BINARIO *(D, `cd1df4d1`) — ABIERTAS hasta leerse en el aparato*

| cadena | dónde |
|---|---|
| `photosPermission` | **prestador** |
| `photosPermission` | **cliente** |
| `locationWhenInUsePermission` | **prestador** — la frase firmada, con **sus dos oficios y sus dos alcances** |

**Ninguna viaja por OTA y ninguna se declara cerrada al commitearla.** Van al checklist del tren **`1.0.7` / `1.0.6`** y **se leen en la pantalla del aparato** antes de darlas por curadas.

⚠️ **Y la instrucción operativa que va con esto, que es la que se pierde:** al armar ese binario, **las cadenas se verifican EN EL APARATO** — no se dan por curadas porque estén bien escritas en el repo. *Es exactamente la clase de `L-432` que este contrato ya pagó con el micrófono: el repo y el teléfono son dos versiones de la verdad, y un commit mueve sólo una.*

---

## ⑤ LO QUE ESTE CONTRATO NO DECIDE

- **Compresión, cola offline, reintentos, miniaturas generadas** — son de **D**, que elige parámetros **y los declara**. La miniatura es **un dato del esquema, no una promesa**: si D no la genera, la columna queda nula y la pieza lo maneja.
- **Retención** — v1 guarda todo; **ninguna política de retención se inventa acá** (la fila de la §18 de la Política de Privacidad ya la cubre: cierre de cuenta + 30 días).
- **El permiso de micrófono** — es de D. ✏️ **CORREGIDO (28-ago, medición de D): el dato de este contrato estaba VENCIDO.** Decía *«es binario nuevo: no viaja por OTA»* y **es falso: el permiso existe desde S63** (el tren del micrófono se preparó ahí) **y las builds del 24-ago ya lo llevan horneado.** ⇒ **el módulo de D viaja por OTA sobre el tren pendiente — no hace falta cortar binario por esto.**

  > **Es `L-432` cobrada dentro de este mismo contrato** (*la verdad vencida deriva, no afirma*): la afirmación fue cierta el día que se escribió y dejó de serlo sin que nada la marcara. **Y lo caro era la consecuencia, no el error:** un contrato que declara «binario nuevo» manda a cortar una build que no hacía falta — *el costo de una verdad vencida no es la línea equivocada, es la decisión que provoca.*
