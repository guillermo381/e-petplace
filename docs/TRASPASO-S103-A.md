# TRASPASO — S103 · PISTA A (conductora)

> # 🔴 LEY DE LECTURA DE ESTE DOCUMENTO — antes que nada
>
> ### **Un traspaso es un mapa de dónde retomar, NO una fuente de datos vivos** (`L-349`).
>
> **Todo SHA, contador y estado de aquí se re-mide contra el objeto en el turno
> en que se usa** (`L-166`) — **y al reportarlo se declara CONTRA QUÉ OBJETO se
> midió** (`L-348`): `main` local, `origin/main` o `ls-remote` son tres
> preguntas distintas que se responden con la misma frase.
>
> *Esta ley se cobró hoy tres veces, y una de ellas sobre el traspaso de B, en
> la misma sesión en que se escribió.*
>
> **Lo que SÍ sobrevive y es por lo que este documento vale:** qué mide cada
> instrumento **y qué NO mide** · las trampas del entorno · las decisiones **con
> su argumento** · y lo pendiente **como instrucción ejecutable**.

**Medido el 22-ago-2026 al cierre de contexto de A.**

---

## §1 · ESTADO DE LOS REPOS Y LAS CUATRO PISTAS

**Monorepo `main` = `5bea705d`** (más el merge de C, ver abajo) · **sitio
`main` = `25dbade`** · **los dos con `origin` idéntico, verificado por
`ls-remote`** contra el remoto, no contra la copia.

| pista | rama | HEAD | estado |
|---|---|---|---|
| **A** (yo) | `pista/s103-a` | `ff24e886` | **todo mergeado y empujado** |
| **B** | `pista/s103-b-jueces` (monorepo) · `pista/s103-b` (sitio) | `426a3dc3` · `0179796` | **mergeadas las dos.** B **declaró estar baja de contexto** y dejó su traspaso en `docs/TRASPASO-S103-B.md` **del repo del sitio** (su territorio) |
| **C** | `pista/s103-c` | `29ee66e5` | **mergeada.** Activa |
| **D** | `pista/s103-d` | `29c7310f` | **mergeada.** Activa, **bloqueada por el `pointOfSale`** |

**Migraciones: 381 locales**, todas aplicadas *(se re-mide con
`ls supabase/migrations/*.sql | wc -l` y `supabase migration list --linked` —
el canon declara el comando, jamás el número)*.
**Canon: `D-872` · `L-350`** son los más altos. **Siguiente libre: `D-873` ·
`L-351`** *(verificar por `grep`, jamás por esta línea)*.

### 🔴 EL APARATO — de quién es y en qué estado quedó

**Samsung SM-S938B · `R5CY201ZDVL` · lo tengo YO.**

| | |
|---|---|
| corriendo | **Metro sobre `main`**, puerto **8082** con `adb reverse` |
| sesión | **Guillermo** (la real; Thor · Zeus · Jack) — **no la toqué** |
| dónde quedó | en el **gate de ③/⑥**, pantalla de pago con un medio elegido |
| pendiente | **el founder no caminó ③ ni ⑥ todavía** |

🔴 **NO SE PUEDE GATEAR SOBRE LA APK INSTALADA.** Es un **Development Build sin
bundle embebido utilizable** (`D-865`/`D-866`): abre en el **Expo Dev Launcher**
pidiendo `npx expo start`. **Sin Metro no hay producto que mirar.**
⇒ **el preview build de EAS entra a la cola con su costo declarado** — Metro
alcanza para hoy y ata el veredicto a un commit, **pero no para un gate que
exija binario atado a commit, y el soft launch lo va a exigir.**

**Reparto de puertos acordado: C en 8081, A en 8082.** *Nunca
`adb reverse --remove-all` — borra los de todas; se usa `--remove tcp:<puerto>`.*

---

## §2 · EL FRENTE DEL COBRO RECURRENTE — lo que define esta sesión

### §2.1 · LO QUE YA EXISTÍA Y NADIE SABÍA (censo de tanda 0)

**El motor de recurrencia YA ESTABA CONSTRUIDO.** No había que empezar de cero:

| pieza | estado medido |
|---|---|
| `pedidos_recurrencias` | **existe**, 14 columnas, **0 filas** |
| `configurar_recurrencia` | **crea la fila y devuelve `ok:true`** — no rebota |
| `alternar_recurrencia` | prende/apaga |
| `avisar_recurrencias_proximas()` | **construida, correcta, idempotente** |
| cron **`avisar-recurrencias`** | **VIVO**, `0 13 * * *` = **08:00 Guayaquil** |
| `aviso_dias` | **`DEFAULT 2`** = **las 48 h de la firma ①, por accidente** |
| **`ejecutar_recurrencias_vencidas()`** | 🔴 **STUB** — devuelve `pasarela_no_afiliada`, `pedidos_creados: 0` |
| cron de ejecución | **NO EXISTE** |
| `pedido_recurrente` (tipo de notificación) | 🔴 **`en_sombra = true`** — se registra y **no se entrega** |

> **La población en cero NO es porque el motor lo impida:** `configurar_recurrencia`
> inserta bien. **Es porque nadie tocó el interruptor.**

🔴 **Y el stub declara su propia condición:** *«el día que la pasarela exista
(D-778 muere), este cuerpo cobra y llama a `crear_pedido_despensa`»*.
**La pasarela existe desde S101. Nadie volvió al cuerpo.**

### §2.2 · LA MIGRACIÓN ESCRITA — `docs/relevamientos/S103-A-recurrente-SIN-NUMERO.sql`

**SIN NÚMERO Y SIN APLICAR, a propósito:** en `supabase/migrations/` un
`db push` la aplicaría sola. **Reversa escrita antes, con lo que NO deshace.**

#### Las CUATRO decisiones, con su argumento

**① `activo` NO se borra: pasa a `GENERATED ALWAYS AS (estado = 'activa')`.**
*Lo obvio era borrarlo.* **Dos razones para no hacerlo:** tres funciones lo leen
y **una se reescribe en la tanda siguiente por otra razón** —*cambiar dos veces
la misma función en dos migraciones distintas es cómo se pierde un cuerpo*—; y
sobre todo:

> **Copiado, `activo` sería un invariante que alguien tiene que RECORDAR mantener. Generado, la contradicción es INEXPRESABLE.**

*Costo pagado una vez: `alternar_recurrencia` ya no puede escribirlo y hubo que
reescribirla — a cambio de que nadie pueda desincronizarlos nunca.*

**② El UNIQUE del período es PARCIAL sobre `estado='aprobado'`.**
*Uno total prohibiría **reintentar**, y §6 firma tres días de reintento.*

> **Lo que no puede ocurrir dos veces es un cobro EXITOSO, no un intento.**

*El caso que lo obliga no es exótico: **un cron que corre dos veces**.*

**③ El backfill traduce `activo=false` → `'cancelada'`, jamás `'pausada'`.**
Hoy la única vía a `false` es que **el cliente** apague. **No existe todavía
ninguna pausa por fallo**, así que `'pausada'` **inventaría un fallo que nunca
ocurrió** — *y lo inventaría en el registro de por qué se cortó el servicio de
alguien.*

**④ `tarjeta_id` NULLABLE — hueco DECLARADO, no permiso.**
El instinto correcto es `NOT NULL` (§2 exige que la autorización **nombre** un
medio). **No se puede hoy:** `configurar_recurrencia` es la única puerta y
**todavía no escribe tarjeta** ⇒ `NOT NULL` **dejaría el alta rota entre esta
migración y la del cobro.**

> **El endurecimiento va CON su productor** — `L-326`: el `REVOKE` corre con el
> reemplazo listo, jamás antes.

*Y lo que lo separa de una omisión: **está declarado en el `COMMENT` de la
columna**. Un hueco que el esquema confiesa se cierra; uno que nadie escribió se
descubre en producción.*
**Hermana:** `ON DELETE SET NULL` y **no** `CASCADE` — *borrarle la serie por
borrar una tarjeta sería tomar por él una decisión que no tomó.*

#### 🔴 `recurrencia_desglose` — POR QUÉ APARECIÓ, y es la prueba de la precondición

**Faltaba, y lo destapó ESCRIBIR EL CUERPO DEL COBRO — no releer la migración.**

> **Aplicada como estaba, el esquema declaraba un sujeto cobrable SIN DÓNDE
> CONGELAR SU MONTO**, y la **compuerta 2** —*sin desglose no hay cobro*—
> **habría rebotado TODO cobro recurrente**, con el esquema ya aplicado y el
> defecto a una migración de distancia.

**Por qué el período ES sujeto propio y no se cobra un pedido** *(tres razones,
la segunda cierra la discusión)*:
· **§6** manda cobrar **antes** de que salga la entrega — *un pedido creado para
poder cobrarlo sería una entrega comprometida antes de que entre la plata*;
· **el plan de paseos no produce pedido alguno**, y es el sujeto ① de la letra;
· **§5** exige **precio vigente** ⇒ el desglose nace **por cobro**, no por serie
— *uno por serie cobraría para siempre el precio del día en que se suscribió.*
**Por eso el período va en la PK.** FK `CASCADE` (a diferencia de `tarjeta_id`):
*el desglose no tiene vida propia sin su serie — es su fotografía.* **Sin policy
de escritura**: lo congela el motor, jamás el cliente.

### §2.3 · LA HERMANA — y la prohibición que la funda

**`pagos-cobro` NO PUEDE servir al recurrente.** Medido (`index.ts:78-89`): su
**primera compuerta es la sesión** (`sin_sesion` → 401), y **el recurrente no
tiene sesión: lo dispara un reloj.**

🔴 **PROHIBIDO (`L-340`, firma del founder): que el disparador fabrique un JWT
de usuario con `service_role`.**

> **No rompe UNA compuerta: rompe el SIGNIFICADO de todas.** El día que el reloj
> pueda producir la misma señal que una persona, **nadie puede volver a
> distinguir un cobro pedido de uno inventado** — y es **RETROACTIVO**: degrada
> también los cobros ya ocurridos, porque desde ese día ningún registro anterior
> puede probar de qué lado nació.

⇒ **HERMANA con el mismo contrato de seguridad y otra RAÍZ:** la **fila de la
serie** como acto guardado (quién · cuándo · qué medio · qué cadencia) **+
secreto compartido** para el cron (patrón `D-713`). **Compuertas E3 enteras e
idénticas; lo único que cambia es de dónde sale el pagador.**
*Letra: `LETRA_COBRO_RECURRENTE` **v1.3** §4.0 y §4.0bis.*

**El reparto, ratificado:** **la base ELIGE y CONGELA · la edge COBRA · el cron
llama por `net.http_post`** (patrón push/whatsapp/conciliar — *no nace mecanismo
nuevo*). **El desglose congelado nace POR COBRO y ANTES de debitar,
fail-closed.**

### §2.4 · QUÉ FALTA PARA QUE EL COBRO SEA REAL — en orden ejecutable

1. **Numerar y aplicar** `S103-A-recurrente-SIN-NUMERO.sql` — **pero NO antes de
   (2) y (3)**: ver la precondición de §3.
2. **Escribir el cuerpo**: `recurrencias_vencidas_pendientes()` en la base (elige
   + congela el desglose del período) y **la hermana** `pagos-cobro-recurrente`
   (cobra, con `pagador_user_id` explícito de la fila).
3. **`cerrar_y_renovar_planes` pasa por el mismo cuerpo.** 🔴 **Medido: hoy NO
   toca el motor de pagos** (control: sí toca `suscripciones_servicio`), y hay
   **1 suscripción ACTIVA con próximo cobro `2026-09-13`** ⇒ **en esa fecha un
   plan se renueva solo y gratis.**
4. **El cron de ejecución con hora declarada.**
5. **Los avisos**: 48 h · día 0 de fallo · reintentos 1-2 · **pausa día 3 sin
   deuda hacia atrás** · **salto de entrega por falta de stock (§7: jamás
   sustitución)**.
6. **El arnés camino real**, con **la serie que falla a propósito** — §2.5.
7. **AL FINAL: sacar `pedido_recurrente` de `en_sombra`**, y que el aviso **gane
   monto y medio**. 🔴 **Encenderlo antes mandaría el anuncio de un cobro que no
   va a ocurrir.**

**Y lo que el aviso promete hoy y no existe:** su payload dice
`'puede': 'saltar, mover o cancelar'` y **solo existe cancelar** ⇒ **`D-869`**,
dueño **producto**, fuera de v1 (`LETRA_COBRO_RECURRENTE` v1.2 §8).

### §2.5 · EL CASO CANÓNICO DEL ARNÉS (firma del founder)

**Todos los datos de la app son de prueba.** La suscripción que renueva el
**`2026-09-13`** es **el sujeto del arnés**: tiene que **renovar cobrando por el
motor**, y **una gemela de prueba tiene que FALLAR A PROPÓSITO y recorrer los
tres días hasta la pausa.**

> *El camino feliz de un cobro recurrente se parece demasiado al de un cobro
> normal; **lo único que esta letra agrega de verdad es qué pasa cuando NO entra
> la plata**.*

---

## §3 · 🔒 LA PRECONDICIÓN DEL FOUNDER — repetida entera

> **La migración del recurrente NO SE APLICA hasta que el cuerpo del cobro esté
> escrito y su arnés recorrido — incluida la serie que falla a propósito hasta
> la pausa.**

**Es `LETRA_PAGO_CITAS` §9 aplicada antes del daño:**

> ### **Un productor probado por su arnés está probado como PRODUCTOR, jamás como REEMPLAZO.**

**Y YA SE PAGÓ SOLA UNA VEZ:** escribir el cuerpo destapó que faltaba
`recurrencia_desglose`. *Sin la precondición, el esquema estaría aplicado y todo
cobro recurrente rebotaría en la compuerta 2.*

---

## §4 · EL ORDEN DE TRABAJO QUE LA MESA FIJÓ

### ① 🔴 `D-872` — el camino principal de la despensa está cerrado

**Con «Envío a domicilio», «Ver el total» está DESHABILITADO**; con «Retiro en
tienda» el camino sigue. Medido en el aparato, cuenta real, dirección válida
(`170135 Quito · Shyris y suecia Edificio Iqon`), pedido fresco.
Voz: *«No hay ventana de entrega disponible — revisa la fecha o prueba retiro en
tienda.»*

🔴 **VA CON DIAGNÓSTICO ANTES DE CURA.** **No se midió POR QUÉ no hay ventana**,
y las cuatro hipótesis son **curas completamente distintas**: sin cupo del
vendedor para la fecha · sin zona de cobertura para esa dirección · sin
repartidor configurado · la fecha por defecto cae fuera de toda ventana.
*Si resulta dato de siembra, la ficha muere y pasa al corte semilla/real; si
resulta motor, **bloquea el soft launch**.*

### ② El actuador de DeUna — y su orden es obligatorio

**`M1·M2·M3 → N1·N2·N3 → wrapper`.** *Escribir N2 contra una columna ausente
sería construir sobre lo que no existe.* **Medido: `referencia_corta`,
`codigo_numerico`, `codigo_push` y `_evento_autenticado` NO EXISTEN todavía.**

**El defecto que cura:** `aplicar_evento_de_pago` autentica con
`detalle NOT ILIKE '%credencial=SERVER%'` — **un concepto de Nuvei**. Un evento
DeUna **llega, se guarda y se descarta sin error, sin log y sin síntoma.**
**Sin esto, el lunes se cobra y el pedido no avanza.**
*Las migraciones las escribió D (`S103-D-migracion-motor-multiproveedor-SIN-NUMERO.sql`
y `S103-D-migraciones-deuna-SIN-NUMERO.sql`); **A las numera al depositar**
(`L-331`).*

🔴 **Tres condiciones de D al numerar:** N1 agrega rama a `_pago_aprobado` y **la
de Nuvei queda byte-idéntica** · **N3 CAMBIA LA FIRMA de
`pagos_pendientes_de_conciliar`** ⇒ **el DROP+CREATE va en la MISMA ventana que
el redeploy de `pagos-conciliar`**, o el barrido queda roto (precedente
cron→deploy de `D-713`) · **N2 vino como diff conceptual a propósito**: el cuerpo
se escribe **contra el objeto leído**, jamás de memoria.

### ③ El cuerpo del recurrente — §2.4

---

## §5 · LA TANDA DE S102 — COMPLETA

**Los cinco pasos aplicados.** Snapshot **re-medido bajo veda** (22-ago 15:00:18
UTC, `citas=8 · pedidos=35`; control: **8+35 = 43 = total de `pagos_intentos`**).
Paso 1 (columna + backfill de 8) · paso 2 (`pagos-cobro` **v8→v9**) · paso 3
(CHECK + policy) · paso 4 (fila CO cerrada con **`base: null`**) · paso 5
(`v_ranking` fuera de `anon`, **desbloqueado por censo**: 2 consumidores, los dos
en el admin, que entra con `signInWithPassword` ⇒ corre como `authenticated`).

**Dos cosas las encontró el guard, no la lectura:** el snapshot **vivía en dos
lugares** y re-medí solo uno · y el **`RESET ROLE` del cinturón deshizo la
elevación del propio CLI**, dejando la migración **aplicada y sin registrar** —
*un estado que no grita*. Reparado con `migration repair` y curado en el archivo.

### Fichas abiertas con dueño

| ficha | qué | dueño |
|---|---|---|
| **`D-872`** 🔴 | el camino de envío cerrado | **A** — diagnóstico primero |
| **`D-871`** 🟡 | R47/R48 ciegos a los **defaults** de `packages/ui` | **B nueva** — *autorizada como tanda propia, con freno: toca un ratchet vivo* |
| **`D-870`** 🟢 | 89 errores de tipado fuera de clase, **declarados y no gateados** | — |
| **`D-869`** 🟡 | el aviso promete **saltar/mover** y solo existe cancelar | **producto** |
| **`D-862`** | comprobante a quien pagó — **trabajo sobre `aplicar_evento_de_pago`**, choca con N2 | **A** |
| **`D-778`** | su condición (la pasarela) **ya se cumplió**; la ficha no lo dice | **A** |

**Y el corte semilla/real es la TANDA DE CIERRE de S103**, ya firmado, con su
propia autorización: **138 citas `pago_simulado`** · las series de prueba · los
pedidos de prueba · **y las 7 tarjetas del arnés de S101** (dos BINs de prueba,
un solo dueño).

---

## §6 · LO QUE ESPERA A OTRAS PISTAS

**C** — tres gates en el aparato (**cliente nuevo · cliente con elección previa ·
DeUna no elegible**); **el segundo ya es observable**, el wrapper está en
`origin`. Y **el pedido del `StepperCantidad`**, con su trampa medida:

> **8 consumidores, solo 2 editables.** *La superficie va SOLO en la rama
> `editable`: ponerla en las dos le daría a los otros seis una caja que promete
> edición — el defecto exacto de la firma, al revés y multiplicado.*

Y le pedí **curar el voseo vivo `retirás`** en su próximo commit (*se lo pasé a
ella en vez de tocarlo yo: está editando ese `es.ts` ahora, y un conflicto cuesta
más que la cura, que es una palabra*).

🔴 **Y DOS PEDIDOS DE C QUE ESPERAN A `packages/ui` — los dos de la misma
pieza-territorio, así que van juntos:**

**(a) LA HOJA DE MEDIOS NO MARCA CUÁL ESTÁ ELEGIDO.** Medido por C: **cero
referencias a `elegido` dentro de la `Hoja`.** Tocar elige **y cierra**, así que
**al abrir «Cambiar ›» la persona no ve cuál está activa.**

> *Y se cruza feo con lo que ya sabemos: **siete tarjetas, con dos pares que solo
> se distinguen por la fecha**. Abrir «Cambiar» sobre siete filas sin saber cuál
> es la actual **no es cambiar: es elegir de nuevo a ciegas.***

**§14 le da la ley exacta** —*letra magenta, sin huella*— **y C no puede
montarla**: `Celda` no expone color/tono del título, y `Texto` **no tiene color
de acento A PROPÓSITO** (N23). *Meterle un color inline sería saltarse N23 el
mismo día que se firmó §14.*

**(b) §15 (el fold) toca a `Hoja`**, que también es de B: la hoja de medios es
justo *«contenido que puede exceder el alto»* — siete tarjetas + DeUna.

**B (nueva)** — **`D-871`** autorizada. **Y los dos pedidos de C de arriba, más
el `StepperCantidad`: son TRES y los tres son de `packages/ui`.** **B vieja quedó sin contexto** y su
traspaso vive en el **repo del sitio**.

**D** — bloqueada por el **`pointOfSale`**; su inventario dice que **ninguna de
las 11 piezas está en verde**. **El cuello de botella del lunes NO es el POS: es
② de §4** — el actuador y el wrapper, que son de A.

---

## §7 · 🔴 LAS TRAMPAS DEL ENTORNO — cada una costó una medición

*Ninguna se deduce leyendo el repo. **No se recortan.***

**De esta pista:**
1. **`eas-cli` SIEMPRE desde `apps/<app>/`, aunque solo estés MIRANDO.** Desde la raíz scaffoldea un `app.json` stub — **y lo hace hasta con un comando de LECTURA**.
2. **El worktree nuevo no trae `node_modules` ni `.env.local` ni `supabase/.temp`.** El `.env.local` se busca **POR APP**, no en la raíz (`L-332`). **Sin `node_modules`, el gate del commit da rojo por módulos ausentes — y el rojo NO es de tu cambio.**
3. **`supabase db query` con SQL inline y comentarios falla** — se usa `--file`.
4. **`RESET ROLE` dentro de una migración deshace la elevación del CLI** y la deja **aplicada sin registrar**. Se guarda el rol previo y se restaura **ése**.
5. **`NOT VALID` no indulta a la fila: indulta al pasado** (`L-338`). Cualquier UPDATE la vuelve a someter.
6. **El pie de Cuenta NO distinguía Metro de bundle embebido** — los dos decían `bundle embebido / dev`. **C lo curó**; la cura viaja en su rama.
7. **`adb reverse --remove-all` borra los de TODAS las pistas.** Usar `--remove tcp:<puerto>`.

**Del parte de B:**
8. 🔴 **`deno` dentro del monorepo ESCRIBE**: agrega `"workspaces"` al `package.json` raíz. **Le pasó a dos pistas el mismo día.** ⇒ todo chequeo con `deno` corre **sobre copia, fuera del repo** (`L-337`).
9. **El juez de edge functions ensanchado a las 23 funciones da 90 errores, 89 ruido.** Gatearlos reproduce el fracaso ya documentado (*«20 rojos sobre 22 y casi todos falsos»*). **Se juzga la CLASE `TS2304`/`TS2552`** y los 89 se **declaran al pie** (`D-870`).
10. **`expo-clipboard` es nativo y NO viaja por OTA** — y **`pnpm` lo hace parecer que sí**: el JS resuelve, el botón se dibuja habilitado y **falla al tocarlo**. El `require` en try/catch **no alcanza** (`L-344`).
11. **Metro NO rebundlea solo en estos worktrees.** Toda cura se verifica con **`force-stop` + relanzar**, jamás con fast refresh. Y **i18next no recarga diccionarios** con fast refresh: se ve la **clave cruda**.
12. **Cinco `astro` peleando el puerto 4321** — el que contesta puede ser el de `main`.

**Del parte de D:**
13. 🔴 **El campo se llama `idTransacionReference`** —*Transacion*, no *Transaction*—. **Es un typo del proveedor: quien lo «corrija» rompe todas las consultas.**
14. **`NOT_FOUND` no existe**: una transacción inexistente vuelve **`200 / PENDING / amount 0 / date ""`** ⇒ **el fantasma tiene la forma exacta de un pago en curso**, y **aprobado exige `APPROVED` Y `amount > 0`**.
15. **`idType` viaja como TEXTO** (`"0"`/`"1"`) pero **`expiredTime` como número**.
16. **Las rutas son `/merchant/v1/payment/*`** — sin `api/`.
17. **`currency` rebota el request entero.**
18. **Rate limit ~1 req/s**; **un `429` JAMÁS es fallo de pago**: es nuestra prisa.
19. **El refund es MISMO DÍA**, confirmado por el propio mensaje de error del proveedor (*«only valid for the purchase day»*).

---

## §8 · LO QUE NO SE HIZO, SIN MAQUILLAR

- **El founder no caminó ③ ni ⑥.** El aparato está en ese estado; el parte medido está en `docs/relevamientos/2026-08-22-s103-GATE-S101D-3-Y-6.md`.
- **`D-872` sin diagnosticar** — es el ① del orden.
- **El actuador y el wrapper de DeUna: no arrancados.** Es el cuello de botella del lunes.
- **El cuerpo del recurrente: no escrito.** La migración está escrita y **no aplicada**, por precondición.
- **El voseo `retirás`: pasado a C**, no curado por mí.
- **Las migraciones de D: no numeradas.**
