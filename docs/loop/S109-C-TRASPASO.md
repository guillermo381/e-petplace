# S109-C · TRASPASO — la superficie del cobro, de guardería a los cinco sujetos

> **Se lee ANTES de tocar nada de `apps/cliente`.** Escrito para sobrevivir a una
> compactación: todo lo que acá no esté, se pierde.
>
> **Identidad:** pista **C** — territorio `apps/cliente` (+ `packages/ui` NO;
> `packages/api` sólo bajo la regla de ensanche, ver §⑥).
> **Worktree:** `/Users/…/e-petplace-s108-c` · **rama `pista/s108-c`**
> (el nombre quedó de S108 y se conservó a propósito: la rama es continua).
> **Se mergea junto con la de A, nunca después.**

---

## ① EL ESTADO, en una línea por sujeto

| sujeto | superficie | ¿cobra de verdad? |
|---|---|---|
| cita (4 oficios) | `checkout-reserva.tsx` | ✅ desde S101 |
| compra de despensa | su checkout | ✅ desde S101 |
| **bono de guardería** | `explorar/guarderia/checkout.tsx` | ✅ |
| **mensualidad de guardería** | ídem, rama `esMensual` | ✅ |
| **paquete de paseo** | `explorar/paseo/checkout-paquete.tsx` | ✅ (motor listo; edge sin desplegar) |
| **programa de adiestramiento** | `explorar/adiestramiento/confirmar-programa.tsx` | ✅ |
| **plan mensual de paseo** | `explorar/paseo/checkout-plan.tsx` | ✅ **desde el 31-ago** |

> ## 🟢 EL ARCO CERRÓ: **LOS SIETE SUJETOS EN `false`. NINGÚN COBRO SIMULA.**
>
> `apps/cliente/src/lib/pagos/simulado.ts` — el mapa entero apagado. El último
> fue `plan_paseo`, el 31-ago, **después** de que B desplegara (`pagos-cobro`
> v33 ACTIVE) y lo ejerciera de punta a punta (`DF-2108362` · $138 · intento
> `aprobado` · `acto2=true` · el plan quedó `activa · pagado`), y **avisara en el
> acto** — la secuencia que el founder firmó.
>
> ⭐ **Cambió UNA palabra y se movieron cuatro superficies** (banda del checkout,
> sufijo del CTA, y las dos del hogar). *Ésa es la razón entera por la que el
> mapa existe en vez de un booleano por pantalla: la alternativa era una
> cacería, y una cacería siempre deja uno vivo* — a mí ya me había pasado con el
> CTA del programa, que decía «simulado» dos commits después de cobrar de verdad.
>
> **⚠️ EL MAPA NO SE RETIRA AUNQUE ESTÉ TODO EN `false`.** No es letra muerta:
> es **dónde se declara** que un sujeto nuevo todavía no cobra, y el próximo va a
> nacer así. *Retirarlo obligaría a reconstruirlo, y el que lo reconstruya va a
> volver a escribir el booleano en la pantalla.*
>
> **⚠️ Dato de B para quien pinte el detalle del plan:** en el PRIMER cobro el
> comprobante viaja con `subtotal` e `impuesto` en **`NULL`, no en cero** —
> `suscripcion_desglose` lo escribe el lazo de renovación, así que en el estreno
> no hay desglose que leer. *Un cero fabricado en un comprobante es una
> afirmación fiscal que nadie firmó.* **Si la pantalla lo muestra sin impuesto,
> es esto y no un defecto.** Está en la cola del contador.

> ## 🔴 LO ÚNICO QUE QUEDA ABIERTO EN ESTE FRENTE: DEUNA NO COBRA PLANES
>
> **Medido:** `SujetoDeuna` (`packages/api/src/wrappers/pagos-deuna.ts:66-79`)
> tiene compra · cita · bono · mensualidad · programa — **y no `plan`**.
>
> Al morir la condición `!recurrente` del `onPress` de `FilaDeUna`, su fila quedó
> **tocable en una pantalla que no puede honrarla** (Ley 23 al revés) — *lo
> destapó mi propia cura, no un gate.* Apagada con **`deunaCobraEsteSujeto`**
> (default `true`, **para que apagarla cueste una frase**).
>
> 🔴 **Y la razón se declara por SUJETO, jamás por categoría:** la mensualidad de
> guardería también es recurrente y **sí** se paga por DeUna. *«Recurrente»
> sonaba a explicación y no lo era — ése fue exactamente el defecto de la
> condición que acabo de enterrar, y por eso la prop nueva no lo repite.*
>
> ✅ **El destino del link ya existe:** `cobro_link_mensual` tiene
> `suscripcion_servicio_id` **y** `guarderia_suscripcion_id` con XOR
> (`20260906200000:42-56`) — *lo medí antes de suponer que faltaba, y no
> faltaba.*
>
> ⚠️ **PERO NO ES «BORRAR UNA PROP», Y ESO LO CORRIGIÓ B MIDIENDO** — mi lectura
> desde el wrapper subestimaba el trabajo:
>
> | pieza | estado (medido por B) |
> |---|---|
> | `SujetoDeuna` nombra `plan` | **no** (y tiene `never` ⇒ agregarlo obliga la rama) |
> | `pagos-deuna-solicitud` acepta `suscripcion_servicio_id` | **0 ocurrencias — la edge no lo conoce** |
> | destino en `cobro_link_mensual` | ✅ existe |
>
> ⇒ **Es la rama entera**: pertenencia fail-closed por `user_id`, la compuerta
> `verificar_compuerta_plan` **antes** de emitir, monto de `precio_mensual` sin
> exigir desglose en el primer cobro, **y el período** —
> `chk_suscripcion_viaja_con_su_periodo` hace inexpresable un intento de
> suscripción sin su mes.
>
> **B lo dejó declarado y NO lo empieza sin firma**, por tres razones que se
> sostienen juntas: ① el riel DeUna **nunca corrió** (`por_deuna = 0`) ⇒ nada
> roto en producción · ② el apagado por sujeto ya cerró la exposición viva ·
> ③ **las dos piezas tienen que viajar juntas** — su rama y esta pantalla del
> link. *Arrancar sola dejaría un sujeto emitible sin destino, que es justo lo
> que el apagado frenó.*
> ⚠️ **Pero antes de encenderla hay que medir una cosa más:**
> `apps/cliente/src/app/pagos/mensualidad.tsx` hoy resuelve **sólo guardería**
> (`obtenerMesPendienteGuarderia`). *Un link de plan de paseo llegaría a una
> pantalla que no sabe leerlo* — es la misma clase de brecha, un paso más allá.

> ### ⚠️ ENMIENDA DEL 31-AGO — RE-MEDIDO CONTRA `main` = `30bf1eeb`
>
> **La tabla de arriba se escribió contra `b495db5b` y tres de sus bloqueos ya no
> existen.** Se deja el texto viejo tachado abajo, no borrado: *quien retome tiene
> que poder ver qué cambió y contra qué se midió cada cosa.*
>
> **☠️ MURIERON TRES BLOQUEOS:**
> - ~~«`p_tarjeta_id` sin DEFAULT ⇒ el mandato por DeUna es inexpresable»~~ →
>   **A lo puso** (`20260907260000`). ⇒ **murió el «muy pronto»** de DeUna en
>   recurrente, nació `MedioDelMandato` (unión discriminada) y el checkout de
>   guardería lleva el riel congelado al toque, con sus dos cuerpos de espera.
> - ~~«falta `leerEstadoPlan`»~~ → **existe.** La máquina de espera tiene su
>   **sexto sujeto** (`plan`), con vocabulario propio: *la mensualidad es un
>   MANDATO sin `estado_pago`, el plan sí lo tiene.*
> - ~~«falta un lector de mes pendiente»~~ → `obtener_mes_pendiente_guarderia`
>   **existía sin wrapper** (L-318, tercera vez en este frente). Nace
>   `obtenerMesPendienteGuarderia` + su tarjeta en Cuenta.
>
> **✅ Y EL ÍNDICE DE IDEMPOTENCIA YA ES PARCIAL** (`20260907240000`,
> `ON CONFLICT … WHERE estado IN ('iniciado','pendiente')`) ⇒ el muerto deja
> pasar, así que **frenar en la puerta ya no condena a nadie sin reintento** y el
> botón `regenerar` del link **se queda**.
>
> **🔴 LO ÚNICO QUE SIGUE ESPERANDO: el deploy de B.**
> `simula('plan_paseo')` sigue en `true` **por firma** — la banda se retira
> *después* de que B despliegue y ejerza el plan. **El código ya está entero
> detrás de ese interruptor** (cobro + espera + sección de medio): el día del
> deploy se cambia **una palabra** en `apps/cliente/src/lib/pagos/simulado.ts` y
> las cuatro superficies se mueven solas.
> ⚠️ *No se enciende el cobro antes de apagar la banda: sería la misma mentira al
> revés, y peor, porque nadie la busca.*
>
> **🔴 Y UNA DEUDA QUE NO ES MÍA Y HAY QUE MIRAR:** `contratarPlanPaseo`
> (`packages/api/src/wrappers/planes.ts`) **no manda `p_riel` ni `p_tarjeta_id`**
> ⇒ rebota `plan_de_tarjeta_sin_tarjeta` **siempre**. Medido y reportado; **la
> tomó A** (territorio suyo) con la misma unión. Cuando publique, `medio` pasa a
> ser requerido en `ContratarPlanInput` y **el compilador trae solo** a la línea
> de `checkout-plan.tsx` que la espera — por eso no queda ficha.
> ⇒ **La lección, con nombre:** *un parámetro con `DEFAULT` vuelve invisible al
> compilador que su ausencia rompe el cuerpo.* En la mensualidad el MISMO defecto
> sí lo cazó el tipo, porque ahí el parámetro era obligatorio. **La forma que
> protege es la unión, no el campo suelto.**

**Los tres hogares tienen los MISMOS tres grupos**: pagado con saldo · falta
completar el pago · no se pagó a tiempo. Guardería (`hogar/guarderia.tsx`),
paseo (`hogar/paseos.tsx` + su gemela `serviciosHogar.ts`) y adiestramiento
(`hogar/adiestramiento.tsx`). Los tres con **expiración perezosa en la
superficie** y su reloj, salvo donde el motor no publica ventana.

---

## ② LO QUE ESTÁ BLOQUEADO, con su medición y su dueño

> ### 🔴 ENMIENDA DEL 31-AGO — TRES DE LOS CINCO BLOQUEOS DE ESTA SECCIÓN MURIERON
>
> **NO se lee (a), (c) ni (d) como pendientes.** Se conservan enteros abajo
> porque cada uno guarda la MEDICIÓN que lo justificaba, y esa medición es lo que
> permite entender por qué la cura tomó la forma que tomó. *Un bloqueo borrado se
> vuelve a descubrir; uno tachado enseña.*
>
> | | estado hoy | qué lo destrabó |
> |---|---|---|
> | **(a)** el «muy pronto» de DeUna | ☠️ **MUERTO** | `p_tarjeta_id uuid DEFAULT NULL` (A, `20260907260000`) |
> | **(b)** la banda de simulación | 🔴 **SIGUE** — es lo ÚNICO vivo | espera el **deploy de B**, no código |
> | **(c)** el reintento del código | ☠️ **RESUELTO, el botón se queda** | el guard de intento-en-vuelo para los seis (B) **+ el índice PARCIAL** (A, `20260907240000`) |
> | **(d)** la tarjeta de mes pendiente | ✅ **HECHA** | `obtener_mes_pendiente_guarderia` (A) + su wrapper (C) |
>
> **Y por qué (c) necesitaba las DOS piezas, que es la parte que no se puede
> perder:** con el índice **TOTAL**, frenar en la puerta habría dejado **sin
> reintento para siempre** a quien tuvo un rechazo — *justo la persona que está
> mirando el botón de regenerar.* **Las dos viajan juntas o ninguna sirve.**
>
> ⭐ **La firma que rige en (c) revocó «devolver el código vivo»**, con mejor
> razón que la mía: *devolverlo obliga a la PANTALLA a saber si ese código
> todavía sirve, y ese reloj es de DeUna, no nuestro.* Por eso frena con voz, y
> la voz **no afirma que el de pantalla sirva**.


### 🔴 (a) EL «MUY PRONTO» DE DEUNA EN LO RECURRENTE — bloqueado por UNA palabra
`seccion-medio-de-pago.tsx`: con `recurrente`, la fila de DeUna **muestra su
promesa y no se puede tocar**. Su fecha de muerte está escrita en el código.

**Intenté matarlo y no se pudo.** Medido:
`contratar_mensualidad_guarderia(p_prestador_id uuid, p_tarjeta_id uuid, …)` —
**`p_tarjeta_id` NO tiene `DEFAULT`**, así que el tipo generado lo marca
requerido (`database.types.ts`: `p_tarjeta_id: string`), **y el cuerpo rebota
`deuna_no_lleva_tarjeta` si llega con valor.** ⇒ *para contratar por DeUna hay
que mandar `NULL`, y el tipo no deja mandarlo.*

> **Lo que hace falta es de A y es una palabra: `p_tarjeta_id uuid DEFAULT NULL`**
> (+ `gen:types`). **No lo resolví con un cast a propósito** — un cast habría
> hecho pasar el build y dejado el agujero de forma intacto.

Cuando llegue: el wrapper gana `medio: { riel:'tarjeta'; tarjetaId } | { riel:'deuna' }`
—**unión discriminada para que «DeUna con tarjeta» sea inexpresable**, no
rebotable—, el checkout lo pasa según `medio.elegido`, y **cae la condición
`!recurrente` del `onPress` de `FilaDeUna`**. *Ese trabajo ya lo escribí una vez
y lo revertí; rehacerlo son veinte minutos.*

### 🔴 (b) LA BANDA DE SIMULACIÓN — espera el DESPLIEGUE, no el código
`cobrarPlanDePaseo` ya está en `main`. **Pero las dos edges están escritas y NO
desplegadas** (`pagos-cobro` v30, `pagos-deuna-solicitud` v15).
**B avisa en el acto cuando despliegue y ejerza el plan.**

⇒ Ahí, y sólo ahí: **`plan_paseo` a `false` en `lib/pagos/simulado.ts`**. Con esa
línea se apagan **la banda y el sufijo del CTA a la vez**, sin tocar ninguna
pantalla — y hay que **wirear `cobrarPlanDePaseo` + la espera** en
`checkout-plan.tsx` (el `cobrar()` va ANTES de la fase; la pantalla no se toca).
⚠️ **Falta `leerEstadoPlan`** para la espera: hoy no existe (`pagos-espera.ts`
tiene cinco lectores y ninguno lee `suscripciones_servicio`). **Pedirlo a A.**
⚠️ Y al contratar hay que dejar **`riel='tarjeta'` en el mismo acto** que la
tarjeta (dato de B): el CHECK `chk_susc_riel_valido` lo exige y un `riel` NULL
significa *nadie lo declaró*.

### 🔴 (c) EL REINTENTO DEL CÓDIGO EN EL LINK MENSUAL — **no publicar sin resolver**
`pagos/mensualidad.tsx` ofrece `regenerar` (**firma del founder**). A midió que
**la edge todavía no renueva sobre el mes pendiente**, así que podría crear
**meses duplicados**. Hoy es inocuo porque **no se publica OTA**.
> **Antes de publicar esa ruta: o el deploy de B, o la palabra del founder de
> sacar el botón.** No se resolvió unilateralmente en ninguna de las dos
> direcciones, a propósito.

### 🟡 (d) LA TARJETA DE «MES PENDIENTE» EN CUENTA — falta el lector
Diseño firmado: arriba de la lista, superficie propia, cuánto · de qué · hasta
cuándo (**fecha en palabras, no contador nervioso: vence al fin del mes, no en
quince minutos**), **un solo botón** que abre el link. Y el mes vencido **no
desaparece**: se lee en palabras.
**No existe lector de mes pendiente.** Pedido a A. Lleva al MISMO destino que el
correo: `/pagos/mensualidad?suscripcionId=…` — *un solo destino, dos entradas.*
⚠️ **Esa tarjeta necesita el copy de reactivación, que ya está escrito** (§④).

### 🟡 (e) EL `detalle` DEL 409 — para decir CUÁL sesión no entra
`ResultadoWrapper` ya tiene `detalle?: string | null` en `main`. **Falta la pata
de B** que lo propague en los dos `return` de `pagos-cobro.ts`.
⚠️ **Viene en vocabulario de MOTOR** (`programa_excede_vigencia: 2026-10-12`) —
**no se pinta crudo**: es el dato con el que se arma la frase. Y llega `null` en
todos los códigos que no vienen de una compuerta: **tratarlo como opcional
siempre.**

---

## ③ EL MECANISMO QUE NO HAY QUE DESARMAR

**`lib/pagos/simulado.ts`** — un mapa por sujeto; **la banda Y el sufijo del CTA
derivan de él**. Nació porque *a mí* se me quedó un «(simulado)» viejo en el
programa **doce horas después, en la sesión donde venía cazando esa clase**.
*Si el que mira el defecto lo comete sobre su propio texto, lo que falta no es
cuidado.* **Queda UN `true`: `plan_paseo`.**

**El `never` de `lib/pagos/cobro.ts`** — el archivo prometía desde S101 que el
typecheck exigía frase para todo código nuevo **y no exigía nada**. Al ponerlo
cobró **quince códigos** sin voz. Ya disparó **dos veces más** (programa, plan) y
las dos veces hizo su trabajo. **No sacarlo nunca.**

---

## ④ LAS FIRMAS VIGENTES (no relitigar)

1. **Pagar es arrancar** (mensualidad de guardería): cobra al contratar; el día
   de inicio elegible está **derogado**.
2. **El bono es SALDO, no un día** ⇒ **no se construye hold sobre el cupo.** Si
   el día se ocupa mientras se cobra, se dice y el saldo queda intacto.
3. **Recurrente con DeUna existe, con link mensual NUESTRO** (DeUna no emite
   links). En un cobro que se repite, **las dos promesas se leen al lado de su
   opción, antes de elegir**.
4. **El plan de paseo SE PAUSA, no se cancela** — y la asimetría con guardería
   **se dice con todas las letras**.
5. **Reactivar:** dentro del período pagado **no cobra y no re-ancla**; fuera, es
   **contratar de nuevo con ancla nueva, el día que la familia vuelve** — dicho
   como hecho, nunca como penalización. **Copy ya escrito.**
6. **La ruta del link exige sesión**, y el login **vuelve a esa misma pantalla**
   con el sujeto. Razón: *el correo se reenvía.*
7. **Dos relojes que no se mezclan:** vence el **CÓDIGO** (ventana DeUna) y vence
   el **MES** (fin del período). *Juntarlos diría que se acabó algo que no se
   acabó.*

---

## ⑤ LAS LECCIONES DEPOSITADAS (con su caso)

- **Un censo de textos se hace por la FRASE y por la PROMESA**, jamás por la
  lista de claves que uno recuerda haber escrito. *El hueco no es lo que se buscó
  y no se encontró: es lo que nunca entró en la búsqueda.*
- **Una regla duplicada por copia se cura dos veces o no se cura** — y el
  comentario que dice «la MISMA regla» es **el localizador de su gemela**.
- **Avisar de una sospecha es barato; afirmar un defecto ajeno sin medirlo, no.**
- **Una garantía declarada en prosa y no mecanizada es peor que no tenerla: se
  confía en ella.**
- **Un código que cubre «no está» y «no es tuyo» no puede hablar como si sólo
  cubriera el primero** (`plan_no_existe`).
- **Un texto honesto se retira cuando cambia lo que describe — y el acto que la
  cambia es el mismo que tiene que retirarla.** También al revés: **no se
  adelanta** (por eso la banda espera el deploy, no el código).
- **Repo ≠ objeto, y repo ≠ repo del otro.** Dos lecturas correctas de dos
  objetos distintos no son una discrepancia. *No hace falta sospechar del otro
  para medir: alcanza con que dos lecturas no coincidan.*

---

## ⑥ OPERATIVO (lo que se olvida y cuesta una hora)

- **Commit:** `TERRITORIO="apps/cliente" git commit -F <archivo> -- <rutas>`
  (forma pathspec **siempre**; `git add -N` primero para archivos nuevos).
  El gate corre `tsc` y **`R66` con baseline 0**: en `packages/api` **el voseo
  frena el commit** — se escribe en TUTEO.
- **Typecheck:** `cd <paquete> && npx tsc --noEmit -p tsconfig.json`. Los cuatro:
  `packages/api`, `packages/ui`, `apps/cliente`, `apps/prestador`.
- **Rebase:** `cd …/ePetPlace && git -C ./e-petplace-s108-c rebase origin/main`.
  Tras rebasar, el push necesita `--force-with-lease`.
- **Verificar cerrado:** local y remoto **por SHA**
  (`git ls-remote origin pista/s108-c`), jamás por código de salida.
- **Regla de ensanche de lector ajeno (firmada):** se puede tocar `packages/api`
  **del lado consumidor** si ① se mide que el dueño no lo tiene, ② se avisa en el
  momento y ③ el commit queda descartable. **Las tres son conjuntas.** **No vale
  para el motor** (RPC, migraciones, edge): ahí se pide y se espera.
- **NO se publica OTA.** La rama se mergea junto con la de A.

## ⑦ CON QUIÉN SE HABLA
**A** (motor/DB/`packages/api`/docs, y quien mergea a `main`) y **B** (edges y
riel de pagos). Se les escribe por `SendMessage`; **el merge a `main` es de A**.
