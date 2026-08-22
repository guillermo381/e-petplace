# DeUna · inventario de aptitud y traspaso

> **De:** pista D (S103) · **22-ago-2026** · **Para:** el lunes — y para quien
> lo retome, que puede no ser yo.
> **Objetivo declarado del founder:** *que el lunes sea conectar y probar, no
> construir.* Este documento existe para que **nada se descubra el lunes**.
> **Rama:** `pista/s103-d` · **cero deploys, cero migraciones aplicadas.**

---

# PARTE 1 · INVENTARIO DE APTITUD

Tres estados, sin adornos:
**✅ lista para conectar** · **⚠️ escrita, nunca probada contra el proveedor
real** · **❌ falta construir**.

| # | pieza | estado | dueño |
|---|---|---|---|
| 1 | Selección del medio (fila «Deuna») | ❌ | **C** |
| 2 | **Puerta** `pagos-deuna-solicitud` | ⚠️ | D |
| 3 | Pantalla del código | ❌ | **C** |
| 4 | **Buzón** `pagos-deuna-webhook` | ⚠️ | D |
| 5 | **Consulta activa** (dentro del buzón) | ⚠️ | D |
| 6 | **Barrido** `pagos-deuna-barrido` | ⚠️ | D |
| 7 | **Actuador** — que vea un proveedor | ❌ | **A** |
| 8 | Comprobante | ⚠️ | A (deriva de 7) |
| 9 | **Reverso / refund** | ❌ | **sin dueño — §1.4** |
| 10 | **Wrapper** para que C llame la puerta | ❌ | **A** |
| 11 | Migraciones del riel | ⚠️ | D escribe · **A deposita** |

**Nada es ✅.** El riel entero está a una medición o a una construcción de
distancia, y ninguna pieza tocó todavía al proveedor real.

---

## §1.1 · LAS ⚠️ — qué medición exacta las vuelve ✅

### ⚠️ 2 · La puerta `pagos-deuna-solicitud`

**Probada de punta a punta contra el simulador**, con los caminos tristes
(`sin_sesion`, `monto_no_se_recibe` ×3, `datos_invalidos` ×3, sin POS, POS
equivocado) y verificado que **no manda `currency`**.

**La vuelve ✅:** una llamada real con el POS que devuelva `ok:true` **con un
`numericCode` presente**.

🔴 **Y su riesgo concreto, no genérico:** el campo `numericCode` está escrito
contra **la doc**, no contra una respuesta. Si el proveedor lo llama distinto,
la puerta devuelve `no_se_pudo_completar` con motivo *«sin numericCode»* —
**falla honesta y con nombre, no en silencio** — pero es **una línea a
corregir** y la pantalla de C se queda sin dato hasta entonces.
⇒ **Guion día 1, paso 2.**

### ⚠️ 4 · El buzón `pagos-deuna-webhook`

Las dos capas de §7 cableadas: secreto propio (comparación en tiempo constante,
acepta actual + siguiente para rotar) y **consulta activa obligatoria**.
El predicado de verdad tiene **7/7 tests** sobre la respuesta real grabada.

**La vuelve ✅:** un webhook real de DeUna que llegue, valide el secreto,
dispare la consulta y quede `verificado=si`.

🔴 **Riesgo concreto: la FORMA del payload del webhook no está medida.** El
buzón lee `payload.transactionId` **y** `payload.transaction.id`, y cae a
`internalTransactionReference`. Si viniera en un tercer lugar, el evento queda
`desconocido` **con su crudo entero a salvo** (persiste antes de analizar) ⇒ se
re-analiza sin perder nada. *El diseño ya absorbe este riesgo: por eso no es
❌.*

### ⚠️ 5 · La consulta activa

Es la pieza **mejor medida del riel**: rutas, `idType` string,
`idTransacionReference`, el fantasma y el rate limit salieron de acá.

**La vuelve ✅:** una consulta sobre transacción **propia y aprobada** — hoy
sólo la corrimos sobre inexistentes.

### ⚠️ 6 · El barrido `pagos-deuna-barrido` — **construido en esta tanda**

Reloj (14/14) + ritmo (10/10) + **la función que faltaba** (§2 abajo).

**La vuelve ✅:** una corrida con candidatos reales, **después** de que A aplique
N3 (la firma con `p_proveedor`) y N4 (la columna `hallazgo`).

⚠️ **Depende de migraciones que no están aplicadas.** Si corre antes, devuelve
`sin_candidatos` **diciendo cuál falta** — está cableado a propósito para no
parecerse a «no encontró nada».

### ⚠️ 8 · El comprobante

Existe y funciona para Nuvei. **Para DeUna deriva por completo de la pieza 7:**
si el actuador no ve el evento, no hay comprobante. No es trabajo aparte.

**La vuelve ✅:** un pago DeUna confirmado que dispare el correo con
`transactionId` + `transferNumber`.

### ⚠️ 11 · Las migraciones

Dos archivos, con reversa escrita antes y cinturones con contra-caso.
**La vuelve ✅:** que A las numere y el founder las aplique.

---

## §1.2 · LAS ❌ MÍAS

**Una, y se construyó en esta tanda.** Ver PARTE 2.

Después de eso: **no queda ningún ❌ mío que no dependa del `pointOfSale`.** No
invento trabajo.

---

## §1.3 · LAS ❌ QUE NO SON MÍAS — cuánto y de quién

### ❌ 7 · El actuador — **A** · 🔴 la más importante del inventario

Hoy `aplicar_evento_de_pago` autentica con `detalle ILIKE '%credencial=SERVER%'`,
que es **el stoken de Nuvei**. DeUna no tiene stoken.

⇒ **Un evento DeUna sale por `evento_no_autenticado_o_no_server` y el sujeto no
se mueve. Sin error, sin log, sin síntoma** — `L-318` con un proveedor en lugar
de un sujeto.

**Cuánto:** el diff conceptual está escrito (N2: tres cambios puntuales — la
puerta a `_evento_autenticado`, el sujeto por tabla, `p_proveedor` variable).
**A lo escribe contra el cuerpo vivo**, no contra mi texto.
🔴 **Sin esto, el lunes el pago se cobra y el pedido no avanza.**

### ❌ 10 · El wrapper — **A** · 🔴 y **nadie lo había nombrado hasta hoy**

`packages/api/src/wrappers/` tiene `pagos-cobro.ts`, `pagos-alta-tarjeta.ts`,
`pagos-espera.ts`… **y nada de DeUna.** C no tiene por dónde llamar la puerta.

**Cuánto:** chico — el molde es `pagos-cobro.ts` (104 líneas) y el contrato ya
está declarado en `S103-D-CONTRATO-PUERTA-DEUNA-para-C.md`.
**Sugerencia, no decisión:** que sea **el mismo wrapper con un `medio`**, no uno
nuevo. *Un segundo wrapper para el segundo medio es el primer día de la
divergencia — y lo que el founder gatea es que se sienta igual.*

### ❌ 1 y 3 · Fila del medio y pantalla del código — **C**

Tiene el contrato desde ayer. **Su bloqueante real es el `numericCode`**: hasta
que se mida, construye contra la letra y marca el enchufe pendiente.

### ❌ 9 · El reverso — **🔴 SIN DUEÑO ASIGNADO, y por eso lo nombro**

**Nada del refund está construido.** Cero código, en ningún territorio.

Y **no está claro que sea alcance de esta mesa**: `LETRA_DEUNA` §8 dice que *la
vía automática es el saldo* y que el reverso al medio original es **vía
manual**; `LETRA_MOTOR` §9 excluye el reembolso del alcance. Pero ninguna de las
dos dice **quién construye el refund por API cuando sí corresponde** (mismo día,
monto total).

⇒ **Es decisión de mesa, no hueco de pista.** Lo declaro para que no se
descubra el lunes cuando alguien pregunte cómo se devuelve un cobro.
**Nota:** el `transactionReverseId` ya tiene columna esperándolo (M2), así que
el día que se construya no pide migración.

---

## §1.4 · LO QUE EL LUNES **NO** VA A PASAR, y conviene saberlo hoy

Aun con el POS y todo medido, **el lunes no se cobra de punta a punta**, porque
faltan las ❌ de A y C. El orden mínimo para que un pago DeUna llegue a mover un
pedido:

1. **A aplica N2** (el actuador) ← sin esto no avanza nada
2. **A escribe el wrapper** ← sin esto C no puede llamar
3. **C dibuja fila + pantalla** ← con el `numericCode` ya medido
4. **Se da de alta el webhook** ← depende de soporte (pregunta #3)

*Lo mío queda listo antes que eso, y por eso no es lo que manda el calendario.*

---

# PARTE 2 · LO CONSTRUIDO EN ESTA TANDA

## 🔴 El barrido tenía motor y no tenía puerta

**Hallazgo del propio inventario:** `pagos-deuna-barrido/` tenía `_reloj.ts` y
`_ritmo.ts` con sus 24 tests… **y ningún `index.ts`.** Es decir: la lógica del
barrido probada, y **ninguna función desplegable que la use.**

> *Es `L-318` otra vez, y esta vez me la cobré a mí mismo. Escribí el motor,
> lo probé, lo di por hecho — y la pieza que lo conecta con el mundo no
> existía. **Lo encontró hacer el inventario, no mirar el código:** los tests
> pasaban, el gate daba verde, y nada de eso podía notar que faltaba la puerta.*

**Construido:** `supabase/functions/pagos-deuna-barrido/index.ts`.

Lo que le importa a quien lo revise:

- **Fuera de ventana: ni se pregunta.** Pasados 7 días el proveedor no responde
  de esa transacción; consultarla gastaría una llamada del rate limit para
  recibir un fantasma indistinguible de uno real.
- **Un solo `estado` de ritmo compartido** entre todas las llamadas ⇒ el
  espaciado es real. *Con uno por iteración, N candidatos serían N ráfagas y el
  429 volvería.*
- **`no pude preguntar` ≠ `no se cobró`.** `rate_limit`/`red`/`http` no tocan el
  intento: queda para la próxima pasada.
- **El veredicto lo da `clasificar()`, no el `status`** — porque `PENDING`
  significa dos cosas y sólo la forma completa más nuestros relojes las separan.
- **No confirma nada.** Deja el hallazgo; el actuador es el único que mueve
  sujetos. *Dos piezas que confirman pagos es cómo se confirma dos veces.*
- Si falta la migración N3, **lo dice con su nombre** en vez de parecerse a «no
  encontró nada».

**Gate: 40/40 verdes, `TS2304` limpio, repo intacto.**

---

# PARTE 3 · TRASPASO — para quien retome el lunes

## §3.1 · Estado del riel, en cuatro líneas

- **Rama** `pista/s103-d`, en `origin`. **Nada mergeado a `main`.**
- **Escrito:** 3 edge functions (puerta · buzón · barrido) · 2 migraciones
  **sin número** · 5 documentos.
- **Probado:** **40 tests** + E2E contra simulador. **Contra el proveedor real:
  sólo `payment/info` y `refund`** (lo único que no exige POS).
- **Desplegado: NADA.** Migraciones aplicadas: **NINGUNA.**

```bash
git fetch origin && git log --oneline origin/pista/s103-d -1
bash scripts/deuna/correr-tests.sh     # 40/40, y verifica que no ensucia el repo
```

## §3.2 · Los dos documentos que hay que leer, en orden

1. **`S103-D-MEDIDO-CONTRA-QA.md`** — lo que el ambiente real contestó.
   *`LETRA_DEUNA` dice qué queremos; esto dice qué hay. Cuando difieran, gana
   esto.* Su valor está en que **§1-§6 es medido y §7 es supuesto**: no mezclar.
2. **`S103-D-GUION-DIA-1-DEUNA.md`** — el orden exacto de mediciones.

### 🔴 EL PASO 1 DEL GUION, REPETIDO ACÁ PORQUE PUEDE PARAR TODO

**¿Una solicitud REAL recién creada devuelve su `amount`, o devuelve `0`?**

El clasificador de fantasmas reconoce «el proveedor no sabe de esto» por **tres
marcas juntas**: `PENDING` + `amount 0` + `date ""`. Eso se midió sobre una
transacción **inexistente**. **Nunca pudimos ver el otro lado** — cómo se ve una
que SÍ existe y aún no se pagó — porque crearla exige el POS.

**Si se vieran iguales, las tres marcas no discriminan nada** y un pago legítimo
consultado en su primer segundo se clasificaría fantasma y se cerraría como
huérfano.

⇒ **Se mide PRIMERO.** Crear una solicitud, consultarla inmediatamente sin
pagarla, mirar `amount`.
- `amount > 0` → ✅ seguir.
- `amount = 0` y `date = ""` → 🔴 **PARAR.** No seguir con los pasos 2-5: se
  interpretarían con un discriminador que ya sabemos falso. La regla de
  reemplazo (fantasma por **tiempo** en vez de por **forma**) **mueve la orden
  de la mesa y no se aplica sin la mesa.**

## §3.3 · Llaves externas pendientes — y qué destraba cada una

| llave | quién | qué destraba |
|---|---|---|
| 🔴 **`pointOfSale`** de SATORI INOV LATAM en QA | founder / soporte #2 | **TODO lo del proveedor.** Los 7 ⚪, el guion entero, el `numericCode` de C. Va al keychain como `DEUNA_POINT_OF_SALE`, cuenta `epetplace` |
| **Cómo se registra el webhook** (#3) | soporte | el alta del buzón ⇒ las piezas 4 y 5 pasan a ✅ |
| ¿QA simula `REVERSED`? (#5) | soporte | el paso 5 del guion; si no, esas fixtures **quedan sintéticas y se declaran** |
| ¿3 min fijos o `expiredTime`? (#10) | soporte | que C no hardcodee un reloj que miente |
| Rutas canónicas (#8) | soporte | confirmar que `/merchant/v1/*` no va a cambiar |

**Ya en el keychain (cuenta `epetplace`), no hace falta pedirlas:**
`DEUNA_API_KEY` · `DEUNA_API_SECRET` · `DEUNA_WEBHOOK_SECRET`.

## §3.4 · 🔴 LAS TRAMPAS QUE NO VIVEN EN NINGÚN CÓDIGO

*Cada una costó una medición. Ninguna se deduce leyendo el repo.*

1. **`deno` CORROMPE `package.json` si se corre dentro del monorepo.** Le mete
   una clave `workspaces` estilo npm en una casa **pnpm** y le come el salto de
   línea final. **Usá siempre `scripts/deuna/correr-tests.sh`**, que copia
   afuera y verifica que el repo quedó intacto. *Un gate que corrompe el repo
   cada vez que corre es peor que no tener gate.*

2. **El campo se llama `idTransacionReference` — con el typo del proveedor.**
   *Transacion*, no *Transaction*. **Quien lo "corrija" rompe todas las
   consultas.** Es lo que un linter o un revisor bienintencionado toca sin
   preguntar.

3. **`idType` es TEXTO** (`"0"` / `"1"`), máx 1 carácter. Un `0` numérico
   rebota. **Y `expiredTime` es NÚMERO.** *El mismo API usa las dos
   convenciones: no hay regla general, cada campo se mide.*

4. **Las rutas son `/merchant/v1/payment/*` — sin `api/`.** La doc del proveedor
   dice `/merchant/api/v1/...` y eso da **404**. *Peor que un error: un 404 en la
   consulta activa es indistinguible del caso de negocio «la transacción no
   existe».*

5. **🔴 `NOT_FOUND` NO EXISTE.** Una transacción inexistente devuelve
   `HTTP 200 · PENDING · amount 0 · date ""` con «please check back in a
   moment». **Nadie va a avisar nunca que algo no existe.** El fantasma son
   **las tres marcas juntas**; con sólo `PENDING` estarías llamando fantasma al
   caso más frecuente del sistema.

6. **`currency` NO DEBE EXISTIR en el request** — rebota el request entero. Es
   el campo que cualquiera agrega por analogía con Nuvei, que sí lo lleva.

7. **Rate limit ~1 req/s** (`429 · "Try again in 1 seconds"`), y la regla dura:
   **un 429 JAMÁS se lee como fallo del pago y JAMÁS transiciona nada.**
   Significa «no pude preguntar». *Confundirlos marcaría huérfano un cobro
   perfecto por haber consultado rápido — y el barrido corre solo, de noche.*

## §3.5 · Lo que NO se hace, aunque tiente

- **No se despliega** sin autorización del founder **por tanda**.
- **No se aplican migraciones** — las numera y deposita A.
- **No se agenda el cron del barrido solo** — *agendar un barrido es empezar a
  tocar plata en un horario.*
- **No se toca `aplicar_evento_de_pago` con la mano** — es N2, y A lo escribe
  contra el cuerpo vivo.
- **No se promueven fixtures sintéticas a medidas por parecerse.** El guion §7
  dice cuáles se reemplazan y cuándo.
