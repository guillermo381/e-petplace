# BUZÓN · S112-E → A · ④ EL PRIMER TRASPASO REAL: ESTADO, Y LOS CUATRO ROJOS QUE HOY NO TIENEN GUARD

> **CONTRA QUÉ Y CUÁNDO.** Contra el **OBJETO** (DB linkeada) y contra `main`
> = **`978666bd`**, el **1-sep-2026, 21:50 -05**.
>
> **No corrí el traspaso.** Abajo está por qué, qué SÍ ejercí, y **qué le falta
> a cada uno de los cuatro rojos para poder existir** — con el instrumento ya
> validado para cuando se pueda.

---

## ① LAS DOS PRECONDICIONES QUE PEDÍ, MEDIDAS HOY

| precondición | estado medido |
|---|---|
| **documentos cargados** | ✅ **CUMPLIDA hoy 21:26.** `adopcion_documentos` tiene 5 filas: `acta_adopcion v1` (5 350 chars, `sha256 f788d883…`, vigente) · `terminos_refugio` v1 jubilada / **v2 vigente** · `condiciones_adopcion` v1 jubilada / **v2 vigente**. |
| **firma construida** | 🔴 **NO CUMPLIDA.** Cero columnas de firma en 299 tablas (las 3 que pega el patrón `%firma%` son `con-FIRMA-do`, abiertas una por una). Cero tabla de actas emitidas. `traspasar_mascota_a_familia` sigue con **4 parámetros** y ninguno es firma, código ni re-autenticación. |

⇒ **El recorrido completo que me pediste no se puede correr: le falta la mitad
que lo vuelve una firma y no un UPDATE.**

---

## ② LO QUE SÍ EJERCÍ POR CAMINO REAL, HOY

**① La vidriera SIN sesión** — `POST /rest/v1/rpc/obtener_adoptables` con la
anon key del bundle → **HTTP 200 `[]`**. **Control negativo en la misma
corrida**: `obtener_mis_solicitudes_adopcion` con esa clave → **HTTP 401
`permission denied for function`**. *El `[]` solo no prueba nada —podría ser un
error tragado—; el 401 al lado prueba que la clave es anónima y que el
instrumento distingue.* El `[]` es correcto: **0 publicaciones vivas**.

**② El instrumento del traspaso, validado antes de necesitarlo** — con sesión
real de `guillo381+8` (clave del keychain, la de siembra), dos llamadas a
`traspasar_mascota_a_familia`:

```
A · mascota inexistente                      -> ROJO: mascota_no_existe
B · mascota REAL, familia destino inexistente -> ROJO: familia_destino_no_existe
```

**Dos rojos DISTINTOS sobre la misma función.** Eso es lo que valida el
instrumento: puedo llamar la RPC, leer su código, y **distinguir qué guard
contestó**. Sin eso, cualquier rojo del ejercicio se leería como «la puerta
funciona».

🔴 **Y es exactamente la trampa que este caso tiene.** La función tiene **siete
guards en fila** y el acta es **el séptimo**:

```
auth → mascota existe → destino≠origen → familia destino existe
     → publicación viva → sos el publicador → ACTA
```

⇒ **cualquier prueba que no llegue a los siete produce un rojo que se parece al
del acta y no lo es.** Los dos de arriba murieron en el 2.º y el 4.º.

**③ La puerta del refugio, ejercida** — con la misma sesión, sobre una cuenta
comercial real que **no** tiene rol de refugio:

```
publicar_adoptable(cuenta no-refugio)   -> ROJO: no_sos_cuenta_de_refugio
traspaso (familia destino = origen)     -> ROJO: familia_destino_igual_al_origen   (3.er guard)
obtener_mis_solicitudes_adopcion        -> VERDE, 0 filas                          ← control positivo
```

**El verde de la tercera línea es el que hace válidas a las otras dos:** prueba
que mi sonda alcanza las RPC de adopción y recibe respuestas normales, así que
los rojos son de los guards y no de que todo rebote. *Sin ese verde, cuatro
rojos seguidos también se explicarían con «la sonda está rota».*

---

## ③ LOS CUATRO ROJOS, UNO POR UNO — y ninguno tiene guard hoy

| rojo pedido | ¿hay guard que lo produzca? | qué le falta |
|---|---|---|
| **firmar con código vencido** | 🔴 **No existe.** No hay código, no hay vencimiento, no hay firma. | el mecanismo entero |
| **firmar con una sola firma** | 🔴 **No existe.** El traspaso ocurre con **cero** firmas: quien lo llama es el publicador y nadie más participa. | ídem |
| **firmar con cédula vacía** | 🔴 **No existe** — y peor: **la cédula está vacía en el 100 % de las filas** (`profiles.identificacion_fiscal`: **0 de 172**, con `tipo_identificacion='cedula'` en las 172 por default). *Hoy «cédula vacía» no es el caso raro que se prueba: es el único caso que hay.* | el dato, la puerta que lo pide, y el guard |
| **el acta sin cargar** | ⚠️ **Existía esta mañana y dejó de existir a las 21:26.** El guard **sí está** y **sí es fail-closed** (ahora por `vigente`, tu cura de hoy), pero **su condición desapareció**: `acta_adopcion v1 vigente=true`. Para producirlo hay que **jubilar el acta** (`vigente=false`) — **escritura de DB, y eso es tuyo, no mío.** | una escritura que no me corresponde |

**El hallazgo de este punto, dicho como es: de los cuatro rojos que el ejercicio
pedía, tres no se pueden producir porque el guard nunca se construyó, y el
cuarto no se puede producir porque su condición se curó hace media hora.** *Un
ejercicio de rojos sobre guards que no existen daría cuatro «no pasó nada» que
se leen igual que cuatro verdes.*

---

## ④ EL VERDE TIENE UNA FALLA PREDICHA, CON NOMBRE Y FICHA — `D-485`

El verde pedido es: *«la vacuna y la conducta aparecen en la familia del
adoptante, con el refugio como procedencia»*. **Medido, hoy eso no puede pasar,
y la causa ya tiene ficha abierta desde S73.**

**La cadena, con su literal:**

1. `traspasar_mascota_a_familia` cambia **`mascotas.familia_id`** (y
   `estado_adopcion`). **No toca `mascotas.user_id` ni crea fila en
   `mascota_codueño`.**
2. `mascotas` tiene **exactamente tres policies de SELECT**:
   `mascotas_select_admin` (`is_admin()`) · `mascotas_select_codueño`
   (`_user_es_codueño_mascota` → lee **`mascota_codueño`**) ·
   `mascotas_select_prestador_con_acceso` (`user_tiene_acceso_a_mascota`).
3. `user_tiene_acceso_a_mascota_como` **completa, 2 179 caracteres**, concede
   por: admin · **`mascotas.user_id = vos`** · prestador con
   `mascota_acceso_prestador`. **Cero menciones de `familia_id` y cero de
   `familia_miembro`** (medido con `ilike` sobre el `functiondef` entero, no
   leyendo por arriba).
4. La pantalla del hogar lista con
   `from('mascotas').select(...).eq('familia_id', familiaId)`
   (`packages/api/.../onboarding.ts:289`) — **lectura de tabla cruda, sujeta a
   esa RLS**.

⇒ **`familia_id` no es un camino de lectura sobre `mascotas`.** Hoy la app
funciona porque **coincide**: de 83 mascotas, 32 tienen `user_id` y **en las 32
ese `user_id` es miembro de su propia familia** (medido: divergencias = **0**).
**El traspaso rompe la coincidencia exactamente en el acto de la adopción**:
mueve la familia y deja la llave por la que se lee apuntando al refugio.

**El control que lo respalda, y es el que me hizo dejar de razonar y medir:**
**51 de 83 mascotas no tienen `user_id` ni codueño vigente** — tienen
`familia_id` (0 mascotas sin familia) **y no las puede leer nadie salvo admin**.
*Cincuenta y una filas probando que tener familia no da lectura.*

**Predicción registrada ANTES del ejercicio, para que el ejercicio la falsee o
la confirme:** tras el primer traspaso real, ① el adoptante **no verá al animal
en su hogar** y ② **el refugio lo seguirá viendo** (su `user_id` sigue ahí).
**No lo llamo veredicto: es una predicción con su discriminador escrito** — el
`select` del adoptante sobre `mascotas` inmediatamente después del traspaso.

**Ficha: `D-485`** (S73-A, 🟠, con *caída declarada* en S74 y disparo intacto).
Su texto ya dice literal *«no hay policy SELECT por familia»*. **La novedad no
es la deuda: es que el traspaso es su disparo, y llega con una adopción real de
por medio.** ⚠️ Y la asimetría que la vuelve más rara de lo que la ficha dice:
**la familia SÍ puede escribir** — `mascotas_update_familia` usa
`user_es_familiar_adulto_de_mascota`, que **sí** mira `familia_miembro`. *El
predicado de familia existe en la casa; la puerta de lectura no lo usa.*

---

## ⑤ LA FIXTURE MÍNIMA, PARA CUANDO LA FIRMA EXISTA

Lo que hace falta, en orden, y **de quién es cada cosa**:

1. **Cuenta de refugio** — `cuenta_roles` con `tipo_actor='refugio'` y
   `estado='activo'`. Hoy hay **0** (las 14 filas vivas son 9
   `prestador_servicios` + 5 `seller_productos`). **El enum ya admite
   `refugio`** — no hace falta migración, hace falta la fila. **Es tuyo: el
   alta es manual por firma ② de la letra.**
2. **Un animal del refugio con familia** — `publicar_adoptable` rebota
   `mascota_sin_familia` si `familia_id` es NULL. **El refugio es la familia
   hasta la entrega** (§0).
3. **Su vacuna con lote y su conducta** — las dos piezas existen y son
   escribibles: `evento_vacuna_aplicada` (con `lote`, `nombre_vacuna`,
   `fecha_aplicada`; hoy **32 eventos vivos** en la base) y
   `evento_bitacora_familia` (**2 vivos**). *Son las dos que el verde tiene que
   ver del otro lado.*
4. **Cuenta de adoptante nueva por el alta curada** — la salida *«quiero
   adoptar»* del alta la está construyendo C y **no está en `main`**; me llegó
   por canal de C que su lote deja adopción **apagada con un interruptor**
   (`ADOPCION_ALCANZABLE = false`, precedente `VITRINA_GATE_ABIERTO`).
   **Medido por mí sobre `main` `978666bd`: esa constante no existe todavía
   acá.** ⇒ el paso 4 del recorrido **depende del corte de C**, no del mío.
5. **Y la pantalla que hoy no existe:** aunque estén 1-4, **el traspaso no
   tiene superficie**. `traspasarMascotaAFamilia`, `publicarAdoptable`,
   `despublicarAdoptable` y `cerrarSolicitudAdopcion` tienen **cero
   consumidores en `apps/`** sobre `main`, y **la app del prestador no tiene
   una sola pantalla de refugio**. El ejercicio, hasta que eso exista, sólo
   puede correr **por RPC** — y eso mide el motor, **no mide que el checkout
   lo llame bien** (la distinción es de C en S109 y vale igual acá).

---

## ⑥ EN UNA LÍNEA

**Los documentos llegaron y la puerta del acta se abrió sola, como estaba
diseñada. Lo que falta para el primer traspaso real no es el texto: es la
firma, la cuenta de refugio, la pantalla, y una policy de lectura por familia
que la ficha `D-485` viene nombrando desde hace treinta y nueve sesiones.**
