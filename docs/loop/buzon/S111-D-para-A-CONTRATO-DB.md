# S111-D → A · CONTRATO DE DB DE LA MENSAJERÍA

> **Autocontenido:** todo lo necesario para implementar está acá; no hace falta
> leer otro archivo ni preguntarme. **Yo no escribo DB.**
> **De:** pista D · **rama** `pista/s111-d` · **sha** `a3fd61e176530b155e188d583e3c280e6b90e987`
> **Alcance:** las tablas, RLS, RPC y tipos de notificación del hilo de la
> solicitud. **No incluye** el modelo del adoptable ni de la publicación — eso
> no es mío y lo declaro para que no se lea como si lo fuera.
> **Diseño que lo funda:** `docs/loop/buzon/S111-D-para-todos-DISENO-MENSAJERIA.md`.

---

## 🔴 FRENO ANTES DE LA PRIMERA LÍNEA — NO REUSAR LAS TABLAS LEGADO

**Existen `solicitudes_adopcion`, `mascotas_adopcion`, `adopcion_seguimiento`,
`refugios` y `donaciones`, y NO se construye sobre ellas** (`D-991`, y el
protocolo de S111 lo repite como límite duro). Medido en S110-D-MEDICION-8:

- son **más viejas que `eventos_mascota`** — `solicitudes_adopcion` es anterior
  incluso a `pedidos`: **son el producto anterior, no un esqueleto sembrado**;
- `adopcion_seguimiento.mascota_id` apunta a **`mascotas_adopcion`, no a
  `mascotas`**, y **ninguna FK cruza entre los dos mundos** ⇒ un adoptable que
  viva ahí **no puede tener un solo evento de expediente**, que es exactamente
  lo que §0 deroga;
- `solicitudes_adopcion.mascota_nombre` es **TEXT**: referencia al animal por
  nombre, no por id;
- **tampoco se DROPean**: algo recorre las cinco y no sale del monorepo.

⇒ **La tabla de solicitud de este vertical es NUEVA.** La nombro
`adopcion_solicitud` (singular, como el resto de la casa moderna) justamente
para que **no se confunda con `solicitudes_adopcion`**, y para que un `grep`
distinga sin ambigüedad. *Si preferís otro nombre, es tuyo — lo único no
negociable es que no sea la vieja.*

---

## ① `adopcion_solicitud` — el ANCLA del canal

**Lo que la mensajería NECESITA de esta tabla.** Si el vertical le agrega
columnas (formulario del publicador, etc.), no me molestan.

| columna | tipo | nulo | nota |
|---|---|---|---|
| `id` | uuid PK | no | `gen_random_uuid()` |
| `publicacion_id` | uuid | **NOT NULL** | 🔑 **el gate de privacidad cuelga de acá**, ver ③ |
| `solicitante_user_id` | uuid → `auth.users` | **NOT NULL** | `ON DELETE RESTRICT` (una solicitud no se evapora si se borra la cuenta) |
| `estado` | text | **NOT NULL** | default `'recibida'` · CHECK ∈ `recibida · en_conversacion · aceptada · declinada` |
| `creada_en` | timestamptz | **NOT NULL** | `now()` — **el reloj de §5 se mide desde acá** |
| `aviso_silencio_emitido_en` | timestamptz | sí | **NULL = no se avisó.** Ver ⑤ |
| `country_code` | text | **NOT NULL** | como el resto de la casa |

**CHECK exigido**, y no es cosmético:
```sql
-- Una solicitud declinada o aceptada tiene que decir CUÁNDO dejó de estar viva.
CHECK ( (estado IN ('recibida','en_conversacion') AND cerrada_en IS NULL)
     OR (estado IN ('aceptada','declinada')       AND cerrada_en IS NOT NULL) )
```
(⇒ agregá `cerrada_en timestamptz NULL`.)

⚠️ **Índice único que pido, con su porqué:** `UNIQUE (publicacion_id,
solicitante_user_id) WHERE estado IN ('recibida','en_conversacion')`.
**Una persona no puede tener dos solicitudes vivas sobre el mismo animal.**
🔴 **Y con la lección de `L-424` puesta: el índice no alcanza.** Un índice sólo
sabe negarse — si la RPC no explica, la persona recibe un `23505` crudo sobre
algo que **ya tiene**. La RPC de ② devuelve el error tipado **con el id de la
solicitud que ya existe**, para poder llevarla ahí en vez de decirle que no.

---

## ② `adopcion_mensaje` — el hilo

| columna | tipo | nulo | nota |
|---|---|---|---|
| `id` | uuid PK | no | |
| `solicitud_id` | uuid → `adopcion_solicitud` | **NOT NULL** | `ON DELETE RESTRICT` — un hilo no se borra por arrastre |
| `autor_user_id` | uuid → `auth.users` | **NOT NULL** | `ON DELETE RESTRICT` |
| `cuerpo` | text | **NOT NULL** | `CHECK (length(btrim(cuerpo)) > 0)` |
| `automatica` | boolean | **NOT NULL** | default `false` · 🔑 **la respuesta automática del publicador va `true`** |
| `creado_en` | timestamptz | **NOT NULL** | `now()` |

🔴 **`automatica` NO es un adorno: es lo que hace que el reloj de §5 funcione.**
§5 manda configurar una respuesta automática al postular **y** avisar si el
refugio no responde en 5 días. Si la automática contara como respuesta, **el
reloj no sonaría nunca** y la promesa quedaría muerta el día uno. **El barrido
de ⑤ ignora los `automatica = true`.**

**Sin adjuntos en v1** (§4 del diseño, estacionado con voto). **No pidas bucket:
sin bucket la puerta no existe, en vez de existir abierta.**

---

## ③ RLS — nace de la frase firmada, y es MÁS ANGOSTA que «el refugio»

> **`LETRA_ADOPCION` §5:** *«Datos del solicitante: solo los ve **el publicador
> del animal solicitado**. Jamás otro uso — ni marketing, ni scoring.»*

🔴 **«El publicador del ANIMAL SOLICITADO», no «el refugio».** Gatear por
organización **ensancha la audiencia por encima de la letra**: dos personas del
mismo refugio verían solicitudes de animales que no publicaron. **El gate es la
publicación.**

```sql
-- helper único (DEFINER, STABLE, search_path fijo), para no repetir el predicado
-- en cada policy: es el molde que la casa ya usa (_user_es_titular_familia).
public._user_publico_esta_publicacion(p_publicacion_id uuid, p_user_id uuid) → boolean
```

**Policies pedidas** (todas `TO authenticated`; **jamás `anon`** — y por favor
la sonda de `L-140` sobre `proacl` en las funciones nuevas):

| tabla | cmd | predicado |
|---|---|---|
| `adopcion_solicitud` | SELECT | `solicitante_user_id = auth.uid()` **OR** `_user_publico_esta_publicacion(publicacion_id, auth.uid())` **OR** `is_admin()` |
| `adopcion_solicitud` | INSERT | `solicitante_user_id = auth.uid()` |
| `adopcion_solicitud` | UPDATE | **ninguna** — el estado se mueve SOLO por RPC (④) |
| `adopcion_mensaje` | SELECT | existe la solicitud padre y el lector pasa el SELECT de arriba |
| `adopcion_mensaje` | INSERT | ídem **Y** `autor_user_id = auth.uid()` **Y** la solicitud NO está en estado terminal |
| `adopcion_mensaje` | UPDATE/DELETE | **ninguna** — el hilo es append-only |

⚠️ **El hilo append-only es deliberado** y espeja el muro clínico: corregir no
puede ser editar. *(Si alguna vez hace falta corregir, es AGREGAR, con su autor
y su fecha — el precedente de forma ya está escrito en esta casa.)*

⚠️ **Ningún dato de contacto viaja en estas tablas.** Ni columna, ni en `cuerpo`
por convención. El canal existe para que no haga falta (§6.4.7).

---

## ④ RPC — firmas exactas

Todas `SECURITY DEFINER`, `search_path` fijo, gate **en el cuerpo**, errores
**tipados** (nada de `RAISE` genérico), e **idempotentes donde corresponde**.

```sql
crear_solicitud_adopcion(
  p_publicacion_id uuid,
  p_mensaje_inicial text            -- puede ser NULL
) RETURNS jsonb   -- { solicitud_id, estado }
```
Errores tipados: `auth_required` · `publicacion_no_disponible` ·
**`solicitud_ya_viva`** *(y va **con el `solicitud_id` existente adentro**, por
lo de `L-424`)* · `mensaje_vacio`.
**Efecto:** inserta la solicitud en `recibida` **y**, si el publicador tiene
respuesta automática configurada, inserta su mensaje con `automatica = true`.

```sql
responder_solicitud_adopcion(
  p_solicitud_id uuid,
  p_cuerpo text
) RETURNS jsonb   -- { mensaje_id, estado }
```
**Efecto:** inserta el mensaje **y**, si el autor es el publicador y el estado
era `recibida`, lo mueve a `en_conversacion` **en la misma escritura**.
🔑 **Un solo acto, no dos.** *Un estado que alguien tiene que acordarse de mover
es un estado que va a estar mal.*
Errores: `auth_required` · `sin_acceso` · `solicitud_terminal` · `cuerpo_vacio`.

```sql
cerrar_solicitud_adopcion(
  p_solicitud_id uuid,
  p_estado_final text               -- 'aceptada' | 'declinada'
) RETURNS jsonb
```
Errores: `auth_required` · `sin_acceso` · `estado_final_invalido` ·
`solicitud_terminal` · **`rol_no_puede`** (sólo el publicador acepta; declinar
lo pueden los dos).
⚠️ **`aceptada` NO dispara acá el acta ni la transferencia del expediente.** Ese
arco es de §5 y **no es de esta tanda** — si lo cableás ahora, cableás sobre una
letra que todavía no tiene su forma medida.

**La ley de las transiciones ya está escrita y ejercida en TS**, para que el
motor y el módulo no diverjan: `packages/mensajeria/src/solicitud.ts`, y
`npm run verify:mensajeria` la corre (26/26, con auto-prueba).

---

## ⑤ EL RELOJ DE 5 DÍAS — barrido, no cron por solicitud

**El silencio es DERIVABLE**, no un estado que alguien escribe:

```sql
-- una solicitud está en silencio si:
estado = 'recibida'
AND now() - creada_en >= interval '5 days'
AND NOT EXISTS (SELECT 1 FROM adopcion_mensaje m
                WHERE m.solicitud_id = s.id
                  AND m.automatica = false
                  AND m.autor_user_id <> s.solicitante_user_id)
AND aviso_silencio_emitido_en IS NULL
```

⇒ **un solo lector** (`obtener_solicitudes_en_silencio()`) + el tick que
despacha y **estampa `aviso_silencio_emitido_en`**. *Se avisa UNA vez, no en
cada tick.*
**Los 5 días son FIRMA de §5**, no parámetro: van como constante nombrada.
La lógica está ejercida en `packages/mensajeria/src/silencio.ts` (7 casos).

---

## ⑥ NOTIFICACIONES — tipos nuevos para el CHECK cerrado

⚠️ **`notificaciones.tipo` tiene CHECK CERRADO de 26 valores** (medido S87) ⇒
**cada tipo nuevo es migración**. Y cada uno necesita su fila en
`cat_notificacion_tipos` con **`audiencia`** (S88 §3bis).

| tipo | categoría | audiencia | medida/razonada |
|---|---|---|---|
| `adopcion_solicitud_nueva` | `relacional` | prestador | **razonada** |
| `adopcion_mensaje_nuevo` | `relacional` | ambas | **razonada** |
| `adopcion_solicitud_respondida` | `relacional` | cliente | **razonada** |
| `adopcion_sin_respuesta` | **`operacion`** | cliente | **razonada** |
| `padrinazgo_ahijado_adoptado` | `relacional` | cliente | **razonada** |
| `padrinazgo_refugio_inactivo` | **`operacion`** | cliente | **razonada** |

**Las seis RAZONADAS, ninguna medida**, y lo declaro porque *un catálogo que no
distingue lo medido de lo supuesto invita a tratar todo como medido*: su
productor todavía no existe.

**Por qué `adopcion_sin_respuesta` es `operacion` y no `relacional`:** el criterio
firmado en S87 es *«la categoría la decide de QUIÉN es el hecho»*, y este hecho
**no lo dice una persona: es el ESTADO de un proceso que la familia inició**.
Precedente exacto: S87 mandó `documento_aprobado`/`prestador_aprobado` a
`operacion` con esa misma razón.

🅿️ **`padrinazgo_ahijado_fallecido` NO se pide todavía** — está estacionado
(§7① del diseño) porque §6 firma el aviso y S88 firmó que el memorial calla.
**El módulo TS ya lo devuelve `avisa: false`**, así que si lo agregás igual,
nada lo va a emitir. *El cobro se detiene de todos modos: eso no está en duda.*

**Sin digest en v1:** §8 lo justifica por volumen, y acá el volumen es una
conversación entre dos personas. Pedirlo sería construir contra un problema no
medido.

---

## ⑦ LO QUE **NO** TE PIDO, y conviene que quede escrito

- **Nada de `app_config`**: ninguna llave nueva y ninguna encendida.
- **Ni una palabra de texto legal**: el acta de §5 no entra en esta tanda.
- **Cero backfill.** Las tablas nacen vacías.
- **Ningún seed que no sea nombrado y borrable.**
- **Ninguna FK contra las cinco tablas legado.**
