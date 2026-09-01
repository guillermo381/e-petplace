# S110-A · EL CENSO Y EL MAPA DEL VOCABULARIO — publicado antes de escribir una RPC

> **Nace:** 1-sep-2026, pista A de S110.
> **Qué es:** lo que MEDÍ contra el objeto antes de construir el durante de
> guardería, y el mapa de los cinco actos contra los siete estados del CHECK.
> **Se publica ahora, aunque no esté para main**, porque C monta contra esto.
> **Contra qué medí, declarado por línea:** `objeto` = la base remota
> (`npx supabase db query --linked`, `pg_get_functiondef` / `pg_constraint` /
> `information_schema`) · `repo` = grep sobre el árbol · `bundle` = nada de
> este documento se midió en un bundle.
> 🔴 **El repo no es el objeto:** un cero de grep prueba que no hay código en
> TS, jamás que la pieza no existe.

---

## ⓪ EL CONTROL DE CADA INSTRUMENTO — corrido ANTES de creerle

*Un instrumento que no puede producir su rojo no está midiendo (S109: seis
fallaron así, en las cuatro pistas, el mismo día).*

| instrumento | control positivo (resultado conocido) | control negativo | veredicto |
|---|---|---|---|
| **regex de ESCRITURA sobre `pg_proc.prosrc`** (`insert into\|update\|delete from guarderia_estadias`) | `reservar_dia_guarderia` → `ins=true` (crea la estadía: se sabe) | `obtener_estadias_del_dia` y `obtener_mis_estadias_guarderia` **mencionan** la tabla y dan `ins=false upd=false` | ✅ **discrimina mención de escritura** |
| **grep de wrappers TS** (`rpc\('<nombre>'` en `packages/api/src/`) | `levantar_acta_guarderia` aparece (tiene wrapper: se sabe) | `abrir_tramo_guarderia` **no** aparece en `packages/api`, y **sí** aparece en `database.types.ts` (o sea: el grep no está ciego al nombre) | ✅ **la ausencia es del wrapper, no del grep** |
| **conteo de estado sobre datos vivos** | `count(*)` por `estado` da 95, que es el número que S109-D reportó | los tres timestamps dan **0**, coherentes con «ningún escritor» | ✅ **dos lecturas independientes coinciden** |

⚠️ El tercer control es el más débil de los tres y lo digo: coincidir con una
medición anterior **no prueba que las dos no compartan el mismo error**. Lo
que lo sostiene es que la causa (cero escritores) la medí por otro camino —
el instrumento ①.

---

## ① EL CHECK DE ESTADO — los SIETE valores, copiados del objeto

Fuente: `pg_get_constraintdef` sobre `guarderia_estadias_estado_check` (**objeto**).

```
CHECK ((estado = ANY (ARRAY[
  'reservada'::text,
  'recogida_en_curso'::text,
  'en_guarderia'::text,
  'retorno_en_curso'::text,
  'entregada'::text,
  'cancelada'::text,
  'no_recogida'::text
])))
```

`DEFAULT 'reservada'`. **Siete valores, sin excepción y sin sinónimos.**

⚠️ **Deriva de vocabulario, medida y NO curada en silencio:**
`mover_sujeto_por_reverso` escribe `WHERE e.estado NOT IN ('cancelada','cerrada')`
— **`'cerrada'` no existe en el CHECK**. Hoy es inerte (nunca coincide), pero es
un literal que sugiere un octavo estado que no hay. *Se declara; no se toca en
esta tanda porque tocar el reverso de pagos no es el objetivo.*

---

## ② QUIÉN ESCRIBE HOY ESE CAMPO — cinco escritores de la tabla, UNO del estado

Fuente: instrumento ① (**objeto**), con su control corrido arriba.

| función | INSERT | UPDATE | ¿toca `estado`? |
|---|---|---|---|
| `reservar_dia_guarderia` | ✅ | — | sólo el **default** `reservada` |
| `reservar_dia_de_paquete_guarderia` | ✅ | — | sólo el **default** |
| `cobrar_periodo_mensualidad_guarderia` | ✅ | — | sólo el **default** |
| `abrir_tramo_guarderia` | — | ✅ | **NO** — escribe `tramo_recogida_id` / `tramo_devolucion_id` y `updated_at` |
| `mover_sujeto_por_reverso` | — | ✅ | **SÍ** — `estado = 'cancelada'` sobre las futuras del bono revertido |

> ### ⇒ De los siete estados, **`reservada` la escribe un default y `cancelada` la escribe el reverso de pagos. Los otros CINCO no tienen escritor.**

**Datos vivos al momento de medir (objeto):** `guarderia_estadias` = **95 filas,
las 95 en `reservada`** · `a_bordo_en`, `llegada_en`, `entregada_en`,
`tramo_recogida_id` = **0 no nulos** · `guarderia_tramos` = **0 filas** ·
`guarderia_actas` = **0 filas** · `guarderia_media` = **0 filas** ·
`espacio_id` no nulo en **6 de 95**.

🔴 **La consecuencia que nadie había escrito, y la trajo C midiendo por su
lado:** `abrir_tramo_guarderia` ata la estadía al tramo y **no** mueve el
estado; `obtener_tramo_vivo_de_mi_mascota` y `obtener_punto_vivo` filtran por
`estado IN ('recogida_en_curso','retorno_en_curso')`. ⇒ **el cuidador emite
puntos y la familia no ve ninguno. No falla: DESCARTA.** *Es `L-456` otra vez —
un mapa cerrado no falla, omite.* **El escritor de transición es lo que le da
sentido a las dos piezas que ya existen.**

---

## ③ LAS DOS RPC DE TRAMO — firma, gate, y su wrapper

Fuente: `pg_get_functiondef` (**objeto**) + grep en `packages/api/src` (**repo**).

| | `abrir_tramo_guarderia` | `cerrar_tramo_guarderia` |
|---|---|---|
| **firma** | `(p_prestador_id uuid, p_fecha date, p_direccion text, p_estadias uuid[] DEFAULT NULL) → jsonb` | `(p_tramo_id uuid) → jsonb` |
| **seguridad** | DEFINER · `SET search_path = public, pg_temp` | ídem |
| **gate** | `auth.uid()` + `user_gestiona_prestador(prestador) OR is_admin()` | ídem, resuelto desde el tramo |
| **idempotencia** | **sí** — el segundo intento devuelve `ya_existia:true` (no un 23505 pelado). Piso: `UNIQUE (prestador_id, fecha, direccion)` | **sí** — `ya_estaba:true` |
| **retorno** | `{ok, tramo_id, ya_existia, estadias_atadas}` | `{ok, tramo_id, ya_estaba}` |
| **efecto lateral** | ata estadías **sólo** de ese prestador y esa fecha; un id ajeno se ignora en silencio | `DELETE` del punto vivo — *lo que ya no se mueve no se sigue mostrando* |
| **rebotes** | `auth_required` · `no_gestionas_este_prestador` · `direccion_invalida` | `auth_required` · `tramo_no_existe` · `no_gestionas_este_prestador` |
| **WRAPPER TS** | 🔴 **NO EXISTE** | 🔴 **NO EXISTE** |

**Consumidores TS de las dos, en todo el repo:** cero. Sólo aparecen en
`database.types.ts` (generado) y en un comentario de
`apps/prestador/src/app/guarderia/dia.tsx:267`. **Dos RPC vivas sin puerta.**

---

## ④ LAS ACTAS — firma, payload, media, wrapper

Fuente: `pg_get_functiondef` + `pg_constraint` (**objeto**).

**`levantar_acta_guarderia(p_estadia_id uuid, p_direccion text, p_carnet_verificado boolean, p_objetos text DEFAULT NULL, p_observaciones text DEFAULT NULL, p_cerrada_en timestamptz DEFAULT now(), p_clave_idempotencia text DEFAULT NULL) → jsonb`**
· DEFINER, gate `user_gestiona_prestador(prestador) OR is_admin()`
· **idempotente**: si ya hay acta para `(estadia, direccion)` devuelve `ya_existia:true`. Piso: `UNIQUE (estadia_id, direccion)`
· devuelve `{ok, acta_id, ya_existia}`
· 🔴 **acepta un parámetro de HORA** (`p_cerrada_en`), y con razón: `cerrada_en` es *la hora de la puerta* (el acta se cierra en la casa, quizá sin señal) y `recibida_en` es la del servidor. **Son dos hechos distintos y el lector muestra los dos.**

**`confirmar_acta_guarderia(p_acta_id uuid, p_conformidad text, p_reserva_texto text DEFAULT NULL) → jsonb`**
· gate del lado **familia**: `user_tiene_acceso_a_mascota` · `conformidad ∈ {conforme, con_reserva}` (`sin_conformidad` es el default y **no se puede escribir por acá**) · CHECK `chk_conformidad_con_fecha` obliga a que `conformidad_en` acompañe.

**`direccion` NO es una dirección postal:** es el discriminador
`CHECK (direccion IN ('recogida','devolucion'))`. Lo mismo en `guarderia_tramos`.

**Cómo referencia la media — y no hay columna puente:** `obtener_acta_guarderia`
la resuelve por `guarderia_media_etiquetas.estadia_id + mascota_id` con un
**corte temporal** sobre dos datos que ya existen (`gm.capturada_en` vs
`a.cerrada_en`): la de recogida toma todo lo anterior a su cierre; la de
devolución empieza donde terminó la de recogida. ⇒ **`cerrada_en` es
semánticamente load-bearing: es el corte que hace que las dos actas no
devuelvan las mismas fotos.**

**Wrappers TS:** ✅ `levantar_acta_guarderia` · ✅ `confirmar_acta_guarderia` ·
✅ `obtener_acta_guarderia` — los tres en
`packages/api/src/wrappers/guarderia-reserva.ts`.
🔴 **Y ninguna pantalla los importa**: `apps/prestador/src/lib/cola-actas.ts`
y `guarderia-cableado.ts` sólo los consume `use-captura-media.ts`, que tampoco
tiene pantalla. *Motor con wrapper y sin puerta.*

---

## ⑤ EL PUNTO VIVO Y EL TRAMO — por dónde entra hoy, y qué columna falta

- **El tramo YA tiene su lugar en el modelo de estadía:** `tramo_recogida_id`
  y `tramo_devolucion_id`, las dos FK a `guarderia_tramos ON DELETE SET NULL`.
  ⇒ **NO hay que crear columna de tramo.**
- **El punto entra por `registrar_punto_vivo(p_tramo_id, lat, lon, visto_en DEFAULT now())`**,
  UPSERT por `tramo_id` (PK) — *nunca acumula*. Se lee con
  `obtener_punto_vivo(p_tramo_id)`, que devuelve **un punto o `null`, jamás una
  lista**, y gatea por (a) quien gestiona el negocio o (b) la familia **sólo
  mientras su animal está en un tramo en curso**.
- 🔴 **HALLAZGO DE SEGURIDAD, declarado y NO curado en esta tanda:**
  `registrar_punto_vivo` **sólo exige `auth.uid()`**. Cualquier usuario
  autenticado con un `tramo_id` puede **escribir la ubicación de un vehículo
  ajeno**. La lectura sí está gateada (S107 la curó); la **escritura no**.
  *No es simétrico y no debería serlo.* → ficha, con dueño.

**LA COLUMNA QUE FALTA, y por qué la agrego:** hay **tres** timestamps
(`a_bordo_en`, `llegada_en`, `entregada_en`) para **cuatro** transiciones del
día. `retorno_en_curso` no tiene ninguna, así que la hora en que el animal
sale de la guardería vive en `updated_at`… **hasta que `entregada` lo
pisa.** *Ese hecho se pierde en silencio.* No es fabricar una columna para que
una fila entre en una lista ajena: es **no perder el hecho que el acto
produce**, y es el espejo exacto de `a_bordo_en`.

---

## ⑥ 🔴 EL MAPA — los cinco actos contra los siete valores

| # | acto | estado que escribe | timestamp | quién lo ejerce |
|---|---|---|---|---|
| ① | **recoger** (a bordo, en el domicilio) | `recogida_en_curso` | `a_bordo_en` | prestador |
| ② | **llegar** (el vehículo llega al lugar) | `en_guarderia` | `llegada_en` | prestador · **por LOTE** |
| ③ | **devolver** (sale de vuelta al domicilio) | `retorno_en_curso` | `retorno_en` 🆕 | prestador · **por LOTE** |
| ④ | **entregar** (en la puerta de la casa) | `entregada` | `entregada_en` | prestador |
| ⑤ | **no-recogida** (la franja cerró sin animal a bordo) | `no_recogida` | `no_recogida_en` 🆕 + `no_recogida_motivo` 🆕 | prestador |

**Los DOS valores que quedan sin acto — se DECLARAN, no se inventa un sexto
acto ni se borra el valor:**

- **`reservada`** — no es el destino de ningún acto: **es el origen**. Lo
  escribe el `DEFAULT` de la columna en las tres puertas de compra.
- **`cancelada`** — **ya tiene escritor y no es del durante**:
  `mover_sujeto_por_reverso` (reverso de pago). Ninguna de mis cinco RPC la
  escribe ni la lee como destino. *Un estado con escritor ajeno no queda
  huérfano por no estar en mi lista.*

**Ningún acto se queda sin valor donde aterrizar.** ⇒ **no hay que parar.**

### Las transiciones legales, que van como DATO

```
reservada          → recogida_en_curso | no_recogida | cancelada
recogida_en_curso  → en_guarderia
en_guarderia       → retorno_en_curso
retorno_en_curso   → entregada
entregada          → (final)
no_recogida        → (final)
cancelada          → (final)
```

🔴 **`cancelada` NO es destino de ningún acto mío** — figura en el grafo
porque el reverso de pagos la escribe, y una pantalla que lea la máquina tiene
que saber que ese estado existe y es terminal. *Declarar el vecino no es
construirlo.*

**C lee esto del motor, no lo declara:** la máquina se publica con
`obtener_maquina_estadia_guarderia()` — estados, actos, transiciones legales y
el catálogo de motivos de `no_recogida`. *Ninguna pantalla escribe el
vocabulario a mano.*

---

## ⑦ LO QUE EL PERÍMETRO ME PROHÍBE Y NO HAGO

- **De `no_recogida` no cuelga NADA:** ni conteo de días, ni aviso de mora, ni
  camino a refugio, ni estado, ni columna de protocolo. `no_recogida_motivo`
  es **por qué cerró la franja**, no el primer día de la mora. 🔴 **Ningún cron
  la escribe** — la declara una persona en la app, en el momento.
- **Cero texto legal.** Ni contrato, ni cláusula, ni placeholder.
- **Cero backfill:** las 95 filas vivas quedan en `reservada`. El
  comportamiento cambia hacia adelante.
- **Ninguna llave de `app_config` se enciende.** `guarderia_recurrente_vivo`
  sigue en `false`.

---

## ⑧ LO QUE ESTE CENSO CORRIGIÓ DE LO QUE YO SUPONÍA

*Se anota porque una medición que sólo confirma lo que uno creía suele ser una
medición que no discriminó nada.*

1. **Creí que iba a tener que crear la columna de tramo.** Ya existe, y en su
   forma correcta (dos FK, una por viaje).
2. **Creí que el acta no tenía cómo referenciar la media.** La referencia por
   corte temporal ya está escrita y es más fina de lo que habría hecho yo.
3. **Creí que el gate iba a ser «empleado con rol».** El objeto dice que
   `user_gestiona_prestador` = **titular OR administrador OR is_admin** — el
   cuidador de a pie **no entra**. Y es el mismo techo que ya tienen el acta y
   el tramo desde S107. ⇒ **uso el mismo predicado**, porque `recoger` levanta
   el acta en la misma transacción y **dos gates distintos en un acto único
   producen una transacción que puede autorizar la mitad**. El techo se
   declara como ficha; ensancharlo es una decisión de producto, no un default
   de A.
