# TRASPASO · S107-CERT — el frente de tarjetas
### Escrito el 30-ago-2026, **ANTES de construir lo que falta** (orden del founder)

> **Se lee ENTERO antes de tocar una línea.** La rama viva es
> **`pista/s107-rastro`**; `main` NO tiene nada de esta pista.
> Todo lo de acá está **medido contra el objeto**, no contra fichas.

---

## ① ESTADO — qué está hecho y desplegado

### 🟢 El motor de `D-922`, completo y en producción

| pieza | dónde | qué hace |
|---|---|---|
| **fuente invertida** | `supabase/functions/pagos-tarjetas/index.ts` | la lista base es **`card/list`**; nuestra tabla **enriquece**. ☠️ Murió el corte temprano `if (tarjetas.length === 0) return []` — **ése era el defecto de fondo**: con la tabla vacía ni se preguntaba |
| **indexado por token** | ídem | `id` puede venir `null` y **se dice, no se inventa** |
| **alias cruzado** | ídem | sale de nuestra fila, por token; sobrevive aunque la tarjeta no esté |
| **filtro binario** | ídem | **sólo `valid`**, sin excepciones |
| **fail-open** | ídem | sin respuesta del proveedor ⇒ nuestra tabla entera con `verificado:false` |
| **`solo_del_proveedor`** | ídem | contador nuevo. **Con la fuente vieja era CERO por construcción** — es el que prueba que la inversión sirve |
| **borrado por token** | `pagos-borrar-tarjeta/index.ts` | acepta `tarjeta_id` **o** `token` |
| **pertenencia probada** | ídem | si viene `token`, se consulta `card/list` del uid estable y **sólo se sigue si aparece ahí**. Si no se pudo preguntar, **NO se borra** |
| **freno A′** | ídem | `tarjeta_con_plan_activo` (409), **antes** de tocar al proveedor |
| **sin fila local** | ídem | el DELETE local se saltea y **eso es éxito**, no `borrado_a_medias` |
| **wrapper** | `packages/api/src/wrappers/pagos-tarjetas.ts` | `TarjetaVerificada.id` pasa a `string \| null`; el filtro exige `token`, ya no `id` |

**Las dos edges están desplegadas.** Typechecks de `packages/api` y `apps/cliente` en **0**.

### 🟢 Cerrado antes, el mismo día

- **`D-961`** — el alta que falla deja rastro. `anotarIncidente` cableada en los dos caminos huérfanos; **verificada en el aparato** con el ejemplar `b955e0c2`.
- **La voz de la acción sin efecto** — matcheo tolerante `/already\s*added/i` con **fallback a la genérica**, y el motivo crudo intacto en el rastro.
- **`anotarIncidente` ya no se traga su fallo** — un reintento y, si falla, lo dice por `reportarSdk` (consola **y** `postMessage` a la app).
- **El gate de edges** — `parseoRoto()`: **error de parseo = ROJO siempre**. Rojo producido y verde restaurado.

---

## ② LO QUE FALTA — con su tamaño medido

### a) `apps/cliente/src/app/(tabs)/cuenta/medios.tsx` — **es la pantalla del gate**

Tres cambios, todos por el mismo motivo (`id` puede ser `null`):

1. **`key={m.id}`** → por `token`. *Con `null`, dos huérfanas colisionarían en la misma key.*
2. **`desempatarMedios(medios).get(m.id)`** → el `Map` se indexa por `token`. **Cambia también esa función.**
3. **`borrarTarjetaGuardada(aBorrar.id)`** → por token.

Y cambiar el lector: `listarTarjetasGuardadas()` → **`listarTarjetasVerificadas()`**.

### b) El wrapper del borrado — **chico**

`borrarTarjetaGuardada` hoy **exige `id`**. La edge ya acepta `token`; **falta la firma del lado del cliente.**

### c) 🔴 `seccion-medio-de-pago.tsx` — **PASO PROPIO, no entra acá**

**Usa `m.tipo`, y `TarjetaVerificada` no tiene ese campo.** Es el **selector del checkout**, o sea camino de plata. Hay que decidir: **¿se ensancha la forma o traduce el selector?** — decisión de mesa, no de quien construye.

⚠️ **Mientras tanto sigue leyendo nuestra tabla, que es lo que hace hoy: no empeora nada.**

---

## ③ 🔴 DECISIONES FIRMADAS — se respetan, no se re-litigan

1. **La lista se indexa por TOKEN, no por id local.** *El token es lo único que existe en los dos lados; el id es nuestro y puede no haber. Con `id`, una tarjeta que sólo vive en Nuvei es **inexpresable** — y ésa es justo la que hay que mostrar y borrar.*
2. **El borrado acepta token + uid.** La pertenencia **se prueba contra `card/list`**, jamás se le cree al teléfono. **Si no se pudo preguntar, NO se borra** — fail-**closed**, porque el riesgo es borrar algo ajeno. *(Esto convive con la decisión vieja «el token jamás viaja desde el teléfono»: sigue rigiendo para el camino con `tarjeta_id`.)*
3. **El alias se conserva** aunque la tarjeta no esté en `card/list`. La fila pasa de **fuente** a **registro**; si se re-agrega, el token se repite —medido, incluso a través de un borrado— y **el alias se reencuentra solo**.
4. **A′** — el borrado de una tarjeta con plan de guardería **se frena**, con voz que **NO promete el cambio de medio** y **manda a soporte** (`/cuenta/ayuda`, existe). *Prometer una acción que no existe es peor que frenar sin salida.*
5. **Fail-open en los dos lados**, con **voz más discreta en el checkout**: ahí la persona está por pagar y un aviso grande siembra duda antes del botón.
6. **Sólo `valid` se lista.** Y **no hace falta refresco ni webhook**: Erick confirmó que **las tarjetas no cambian de estado automáticamente**.
7. **El `type` de Nuvei se muestra tal cual, no se deriva del BIN.** El ejemplo raro de la doc era un error de la doc; en nuestros 23 cobros el `type` **siempre** coincidió.

---

## ④ EL GATE — lo hace el founder en el aparato

> **La Visa 4111 tiene que APARECER en su lista** —Nuvei la tiene bajo su uid y
> nosotros no— **y tiene que poder BORRARLA desde la app.**
>
> Si eso pasa, **`D-922` está cerrada y la desincronía se repara sola.**

⚠️ **Necesita OTA**, y el OTA es el punto donde esta pista cruza con las otras
(el `runtimeVersion` sale de `apps/cliente/app.json`). **Se pide, no se toma.**

---

## ⑤ PENDIENTES QUE NO SE PIERDEN

| | qué | disparo |
|---|---|---|
| **la voz de A′** | el código `tarjeta_con_plan_activo` existe y **no tiene texto**. De **C**. Literal firmado: *«Esta tarjeta paga tu plan de guardería, por eso no se puede borrar. Escribinos si querés cambiar el medio de pago de tu plan.»* | con el OTA de `medios.tsx` |
| **cambio de medio de una suscripción** | **no existe** — medido: cero pantalla, cero wrapper. Hoy hay **1 suscripción activa** (`debad20f`, del founder, tarjeta `f6fc4ed9`) ⇒ el caso es real, no preventivo | la primera persona real con plan que quiera cambiar su tarjeta |
| **`onError`/`onHttpError` del WebView** | **no existen**: una carga fallida es invisible por diseño. 🔴 **Y no es cablear dos handlers**: la edge rebota sin `Origin` y la RPC `anotar_incidente_alta` **no la puede ejecutar `authenticated`** (medido: `false`). **Hay que abrir una puerta cerrada a propósito de los dos lados** | decisión de mesa sobre cuál puerta |
| **Erick** | ¿`"Card already added"` es identificador **estable** o texto de display? Si es display, la voz cae al genérico sin avisar — **por eso el fallback no es prolijidad, es la cura del día que cambie** | próxima llamada |
| **higiene de filas huérfanas** | la fila local con token que ya no existe en Nuvei. **Su productor principal es el borrado normal**, no un caso raro | que esa tabla crezca sin control |

---

## ⑥ LO QUE APRENDIMOS Y NO HAY QUE VOLVER A PAGAR

- **Estimar contra la ficha en vez del objeto.** `D-922` decía *«card/list como fuente»* y la edge leía nuestra tabla. **Estimé dos veces; la primera estaba mal.**
- **Un territorio no se mide por sus archivos.** Los cinco de `D-922` tenían **0 commits** y la estimación cambió igual: una **FK nueva en `guarderia_suscripciones`** (`NO ACTION`, la única de cuatro) apareció debajo. *Medir el territorio por su diff es medir dónde escribe uno, no dónde lo alcanzan.*
- **Un gate que filtra por clase da verde sobre todo lo que está fuera de su clase** — incluido lo que impide que el archivo exista. **Lo cazó el deploy, y el deploy no siempre está.**
- **Cuando una medición no encuentra nada, el primer sospechoso no es el objeto:** es si el instrumento podía verlo y si el objeto ya tenía la cura. *Dos frenos del founder fueron los dos pasos que faltaban, y ninguno era sobre el defecto.*
- **Una premisa parece falsada cuando la condición que la sostiene no se está cumpliendo.** Medimos dos tokens distintos y concluimos que el proveedor no reusa: **bien medido, mal concluido** — las dos altas iban con uid distinto.
- **Curar contra el CASO y no contra la REGLA deja la cura a medias.** Pasó tres veces en un día: el aviso de reverso sólo en cita, el flag del mapa sólo en la build, la voz sólo en una superficie.

---

## ⑦ OPERATIVO

- **Rama:** `pista/s107-rastro` — **`main` no tiene nada de esta pista.**
- **Sin OTA publicado** por esta pista desde `da790cb1`.
- **`pagos-web`** desplegada a Vercel (alias `epetplace-pagos-stg.vercel.app`), **verificada por contenido**.
- **Parque de tarjetas del founder:** hoy **1** (`f6fc4ed9`, Diners …0808) **con plan de guardería activo enganchado** ⇒ **es el primer caso vivo del freno A′**.
- 🔴 **La Visa …1111 sigue viva del lado de Nuvei y no del nuestro.** Es el sujeto del gate.
