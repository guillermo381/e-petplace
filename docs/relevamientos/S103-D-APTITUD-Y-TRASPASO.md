# DeUna · TRASPASO — leer esto primero

> **De:** pista D (S103) · **actualizado 23-ago-2026** · **Para:** quien corra
> el guion el lunes — **puede no ser yo, y este documento está escrito para eso.**
> **Rama:** `pista/s103-d` (en `origin`) · **Nada mergeado a `main`.**
>
> 🔴 **Todo lo de acá se midió al escribirlo, no se recordó.** Y aun así:
> **re-medí antes de creerle a este documento.** *Un traspaso es un mapa de
> dónde retomar, jamás una fuente de datos vivos.*

---

## §0 · EN TREINTA SEGUNDOS

```bash
git fetch origin && git log --oneline origin/pista/s103-d -1
bash scripts/deuna/correr-tests.sh          # 55/55 · y verifica que no ensucia el repo
```

| | |
|---|---|
| **Escrito** | 3 edge functions · 2 migraciones **sin número** · 9 documentos |
| **Probado** | **55 tests** + E2E contra simulador + **12/12 códigos ejercidos** |
| **Contra el proveedor real** | sólo `payment/info` y `refund` — lo único que no exige POS |
| **Desplegado** | 🔴 **NADA.** Medido: cero funciones `pagos-deuna` desplegadas |
| **Migraciones mías aplicadas** | M1·M2·M3 y N1·N2·N4 **las aplicó A**. **N3 sigue retenida** |

---

## §1 · EL RIEL, PIEZA POR PIEZA (medido 23-ago)

| # | pieza | estado |
|---|---|---|
| 1 | **puerta** `pagos-deuna-solicitud` | escrita · **sin desplegar** · 12/12 códigos ejercidos |
| 2 | **buzón** `pagos-deuna-webhook` | escrito · **sin desplegar** · escribe `verificado` y `origen` |
| 3 | **consulta activa** | dentro del buzón · **la pieza mejor medida del riel** |
| 4 | **barrido** `pagos-deuna-barrido` | escrito · sin desplegar · **sin cron (correcto)** |
| 5 | **actuador** | ✅ **vivo**, multiproveedor, `info` fail-closed, guard `{}` curado |
| 6 | **comprobante** | ✅ cableado (depende de 5) |
| 7 | **reverso** | 🔴 **no existe — §5.2** |
| 8 | **wrapper + contrato** | ✅ en `main` |
| 9 | **pantalla de C** | ✅ enchufada · **los dos flips en `false`** |

**Gate de DeUna vigente:** `coalesce(stoken_valido,false) AND verificado IS TRUE`.
*(Era un `ILIKE` sobre texto libre y se podía falsear con un mensaje de error —
curado por A sobre mi hallazgo.)*

---

## §2 · 🔴 EL PASO 1 DEL GUION, REPETIDO ENTERO — puede parar todo

Guion completo: **`S103-D-GUION-DIA-1-DEUNA.md`**. Su paso 1 va acá porque
**si sale rojo, el resto no se corre.**

### La pregunta

**¿Una solicitud REAL recién creada devuelve su `amount`, o devuelve `0`?**

### Por qué puede parar todo

El clasificador de fantasmas reconoce «el proveedor no sabe de esto» por **tres
marcas juntas**: `PENDING` + `amount 0` + `date ""`. Eso se midió sobre una
transacción **inexistente**.

**Nunca pudimos ver el otro lado** — cómo se ve una que SÍ existe y aún no se
pagó — porque crearla exige el `pointOfSale`.

**Si se vieran iguales, las tres marcas no discriminan nada**, y un pago legítimo
consultado en su primer segundo **se clasificaría fantasma y se cerraría como
huérfano**.

### Qué correr

Crear una solicitud real, **consultarla inmediatamente sin pagarla**, mirar
`amount`. Control: compararla contra `fantasma_idType_0` de
`fixtures-qa-deuna.json` — *sabemos exactamente cómo se ve lo que no existe.*

### Criterio

| resultado | qué hacer |
|---|---|
| `amount` > 0 | ✅ seguir al paso 2 |
| `amount = 0` **y** `date = ""` | 🔴 **PARAR** — no correr los pasos 3-7 |
| `amount = 0`, `date ≠ ""` | 🟡 el discriminador se apoya en `date`; reordenar y **re-correr `_reloj.test.ts`** |

**Si sale rojo:** el fantasma pasa a reconocerse **por tiempo** en vez de por
forma. **Eso mueve una orden de mesa firmada** ⇒ **no se aplica sin la mesa**: se
mide, se reporta con el número, y la mesa decide el umbral.

---

## §3 · LAS TRES REGLAS DE ENCENDIDO

**①** 🔴 *Un pago **cobrado y nunca confirmado** —con la plata ya movida del lado
del cliente— es **peor** que un pago que no se puede iniciar.*
⇒ **La puerta del cliente se enciende última, y jamás antes de que exista quien
confirme.**

**②** *Las tres de motor van **en la misma ventana***: `N3` + **redeploy de
`pagos-conciliar`** + la línea del `info: {}`.
🔴 **`N3` cambia una firma que `pagos-conciliar` todavía llama** — aplicarla sola
**deja roto el barrido de Nuvei**, que es el que hoy cobra plata real.
*(El `info: {}` ya está curado; queda `N3` + su redeploy.)*

**③** *El cron del barrido va **último**, después de que el aplicador exista **y**
haya corrido a mano una vez.*
**Agendar un barrido es empezar a tocar plata en un horario** — y *uno que escala
lo mismo en cada pasada entrena a ignorarlo.*

**Secuencia completa con dueños:** guion **§15**.

---

## §4 · 🔴 EL RIESGO DE LOS DOS FLIPS

**Encender DeUna son DOS actos, no uno:**

| # | flip | enciende |
|---|---|---|
| ① | `DEUNA_ELEGIBLE = true` (`fila-medio-de-pago.tsx:272`) | **la fila** |
| ② | el cuerpo de `useEstadoDeUna` deja de ser `ENSAYO` | **la conexión real** |

**Con sólo el ①, la fila aparece y la pantalla sigue simulando** — y **se ve
exactamente igual que si funcionara**: hay fila, hay código de 6 dígitos, hay
cuenta regresiva. *Se lee «DeUna anda» hasta que alguien mire la base.*

### El discriminador — se mira la BASE, no la pantalla

```sql
select id, proveedor, forma, estado, codigo_numerico, referencia_corta, creado_en
  from pagos_intentos where proveedor = 'deuna'
 order by creado_en desc limit 3;
```

| resultado | veredicto |
|---|---|
| **fila NUEVA** con `forma='codigo_push'` y **el mismo código que muestra la app** | ✅ conectada |
| **cero filas** | 🔴 **sólo el flip ①** — la fila encendida está mintiendo |

**Control positivo:** correr la consulta **antes** de pedir el código. *Si ya
había filas, «hay fila» no prueba nada — hace falta una con `creado_en` de hace
segundos.*

🔴 **Si es sólo el ①: apagarlo de inmediato.** *Una fila que promete un medio que
no existe es peor que no ofrecerlo — la persona elige Deuna, paga en su app, y
del lado nuestro no hay intento que confirmar.*

**Los dos flips son de C.** Su condición **no es una firma: es que exista el
aplicador (§5.1).**

---

## §5 · LOS DOS CABLES FALTANTES — **el POS no los destraba**

### 5.1 · 🔴 El aplicador del barrido — **cura de A, contrato depositado**

**Medido hoy: no existe.** El barrido detecta un pago confirmado y **nadie lo
aplica** — el actuador exige una fila de `webhook_events`, y el caso que el
barrido resuelve es **el webhook que nunca llegó**.

⇒ **El caso ④ de la letra madre** —*«no llega ninguno»*— **queda sin resolución
para DeUna.**

**Contrato completo:** `docs/CONTRATO_APLICADOR_BARRIDO_DEUNA.md` — con las tres
diferencias respecto de `resolver_consulta_activa`, el fantasma, y el
discriminador de tres filas. **`origen='barrido'` ya existe** como columna para
que autentique honestamente.

**Bloquea:** el paso 8 del guion y **los dos flips (§4)**.

### 5.2 · 🔴 El reverso — **SIN DUEÑO ASIGNADO**

**Cero código en cualquier territorio.** Y las dos letras no coinciden en quién
lo construye: `LETRA_DEUNA` §8 dice que la vía automática es el saldo y el
reverso al medio original es **manual**; `LETRA_MOTOR_PAGOS` §9 excluye el
reembolso del alcance.

**Es decisión de mesa, no hueco de pista.** *Dato bueno: `proveedor_reverso_id`
ya tiene columna, así que el día que se construya no pide migración.*

---

## §6 · LO QUE ESPERA ALGO LEGÍTIMO — **no son defectos**

| pieza | espera |
|---|---|
| el wrapper sin llamador | los dos flips (`DEUNA_ELEGIBLE=false` es **deliberado**, con voz honesta) |
| el buzón | **el alta de la URL** — pregunta #3 a soporte · paquete listo en `S103-D-PAQUETE-ALTA-WEBHOOK.md` |
| el cron del barrido | firma **y** el aplicador |
| `N3` | su ventana con el redeploy (regla ②) |

✅ **La fila del fixture: A ya ejecutó el `DELETE`.** Verificado hoy —
`clave_idempotencia LIKE 'cinturon-m1-%'` → **cero filas**. *Era mi residuo, en
`reverso_fallido`, y fabricaba un caso de soporte falso.*

---

## §7 · LLAVES EXTERNAS PENDIENTES

| llave | quién | destraba |
|---|---|---|
| 🔴 **`pointOfSale`** de SATORI INOV LATAM en QA | founder / soporte **#2** | **todo lo del proveedor.** Va al keychain como `DEUNA_POINT_OF_SALE`, cuenta `epetplace` |
| registro del webhook (**#3**) | soporte | el alta del buzón |
| ¿QA simula `REVERSED`? (**#5**) | soporte | el paso 6 del guion |
| ¿3 min fijos o `expiredTime`? (**#10**) | soporte | que C no hardcodee un reloj que miente |
| rutas canónicas (**#8**) | soporte | confirmar que `/merchant/v1/*` no cambia |

**Ya en el keychain, no hace falta pedirlas:** `DEUNA_API_KEY` ·
`DEUNA_API_SECRET` · `DEUNA_WEBHOOK_SECRET`.

---

## §8 · 🔴 LAS SIETE TRAMPAS QUE NO SE DEDUCEN LEYENDO EL REPO

*Cada una costó una medición. **Ninguna se deduce leyendo el código.***

**1 · `deno` CORROMPE `package.json` si se corre dentro del monorepo.**
Le mete una clave `workspaces` estilo npm en una casa **pnpm** y le come el
salto de línea final. **Usá siempre `scripts/deuna/correr-tests.sh`**, que copia
afuera y **verifica que el repo quedó intacto**.
*Un gate que corrompe el repo cada vez que corre es peor que no tener gate.*

**2 · El campo se llama `idTransacionReference` — con el typo del proveedor.**
*Transacion*, no *Transaction*. **Quien lo «corrija» rompe todas las consultas.**
Es lo que un linter o un revisor bienintencionado toca sin preguntar.

**3 · `idType` es TEXTO** (`"0"`/`"1"`, máx 1 char) — un `0` numérico rebota.
**Y `expiredTime` es NÚMERO.** *El mismo API usa las dos convenciones: no hay
regla general, cada campo se mide.*

**4 · Las rutas son `/merchant/v1/payment/*` — SIN `api/`.**
La doc del proveedor dice `/merchant/api/v1/…` y eso da **404**. *Peor que un
error: un 404 en la consulta activa es **indistinguible** del caso de negocio
«la transacción no existe».*

**5 · 🔴 `NOT_FOUND` NO EXISTE.** Una transacción inexistente devuelve
**`HTTP 200 · PENDING · amount 0 · date ""`** con *«please check back in a
moment»*. **Nadie va a avisar nunca que algo no existe.** El fantasma son **las
tres marcas juntas**; con sólo `PENDING` estarías llamando fantasma al caso más
frecuente del sistema.

**6 · `currency` NO DEBE EXISTIR en el request** — **rebota el request entero.**
Es el campo que cualquiera agrega por analogía con Nuvei, que sí lo lleva.

**7 · Rate limit ~1 req/s** (`429 · "Try again in 1 seconds"`).
🔴 **Un 429 JAMÁS se lee como fallo del pago y JAMÁS transiciona nada.**
Significa «no pude preguntar». *Confundirlos marcaría huérfano un cobro perfecto
por haber consultado rápido — y el barrido corre solo, de noche, sin nadie
mirando.*

---

## §9 · LO QUE NO SE HACE, AUNQUE TIENTE

- **No se despliega** sin autorización del founder **por tanda**.
- **No se aplican migraciones** — las numera y deposita A.
- **No se agenda el cron del barrido solo.**
- **No se tocan `aplicar_evento_de_pago` ni el aplicador** — son de A.
- **No se promueven fixtures sintéticas a medidas por parecerse.** El guion §8
  dice cuáles se reemplazan y cuándo.
- **No se corre el paso 8** sin webhook dado de alta **o** sin el aplicador.

---

## §10 · LOS OTROS DOCUMENTOS, EN ORDEN DE LECTURA

| # | documento | para qué |
|---|---|---|
| 1 | **`S103-D-MEDIDO-CONTRA-QA.md`** | **lo que el ambiente real contestó.** `LETRA_DEUNA` dice qué queremos; esto dice qué hay — **cuando difieran, gana esto**. §1-§6 medido · §7 supuesto: **no mezclar** |
| 2 | **`S103-D-GUION-DIA-1-DEUNA.md`** | los 9 pasos, el ensayo en seco, **§15 el orden de encendido** |
| 3 | `CONTRATO_APLICADOR_BARRIDO_DEUNA.md` | para A |
| 4 | `S103-D-CONTRATO-PUERTA-DEUNA-para-C.md` | los 12 códigos con su voz |
| 5 | `S103-D-PAQUETE-ALTA-WEBHOOK.md` | el correo a soporte, copiable |
| 6 | `docs/loop/S103-D.md` | la bitácora — el porqué de cada decisión |

---

> **Y la ley que gobierna todo lo de arriba:** *este documento se escribió
> midiendo, y aun así **envejece**.* El guion ya envejeció tres veces en dos
> días —una de ellas con una precondición que decía «tranquilo, lo agarra el
> barrido» cuando el barrido no podía—. **Re-medí antes de creerle a cualquier
> número de acá.**
