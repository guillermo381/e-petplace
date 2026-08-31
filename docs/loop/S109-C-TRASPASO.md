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
| **plan mensual de paseo** | `explorar/paseo/checkout-plan.tsx` | 🔴 **NO — el único que simula** |

**Los tres hogares tienen los MISMOS tres grupos**: pagado con saldo · falta
completar el pago · no se pagó a tiempo. Guardería (`hogar/guarderia.tsx`),
paseo (`hogar/paseos.tsx` + su gemela `serviciosHogar.ts`) y adiestramiento
(`hogar/adiestramiento.tsx`). Los tres con **expiración perezosa en la
superficie** y su reloj, salvo donde el motor no publica ventana.

---

## ② LO QUE ESTÁ BLOQUEADO, con su medición y su dueño

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
