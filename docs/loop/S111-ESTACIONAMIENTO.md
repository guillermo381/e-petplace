# S111 · EL ESTACIONAMIENTO — lo que espera al founder

> **Nace:** 1-sep-2026, arranque del loop S111 con el founder ausente.
> **Lo escribe A.** Las demás pistas lo alimentan por buzón
> (`docs/loop/buzon/S111-<pista>-para-A.md`) y A lo transcribe acá.
>
> **Qué es:** el único lugar donde vive una decisión de PRODUCTO que falta.
> **Qué NO es:** una lista de trabajo pendiente. Lo que falta es una FIRMA, no
> una tanda.
>
> **La forma de cada entrada, y las cinco partes son obligatorias:**
> ① **qué falta** · ② **opciones (a)/(b)** · ③ **el voto de la pista** ·
> ④ **qué se construyó alrededor** (fail-closed) · ⑤ **qué se rompe si se
> elige mal**.
> 🔴 *Una entrada sin ④ no está estacionada: está abandonada. El punto de
> estacionar es que el trabajo de alrededor SIGA, con la puerta cerrada.*

---

## §0 · LAS VEDAS — no son decisiones, son órdenes vigentes

*Se listan acá para que nadie las confunda con algo que se pueda votar.*

| veda | hasta cuándo |
|---|---|
| **Publish / OTA / store** | hasta que el founder camine el recorrido en el **aparato** |
| **Ninguna llave de `app_config` se enciende** | orden permanente del loop |
| **Cero texto legal en pantalla** | las aceptaciones van fail-closed contra documentos versionados de A; **sin documento cargado, la puerta no se abre** |
| **Motor de pagos: sólo lo que el plan nombra** | cero cobros reales, cero backfill; seeds nombradas y borrables |
| **Las cinco tablas legado de adopción** | no se construye sobre ellas **y no se DROPean** (`D-991`) |
| **El 5 % a la fundación** | espera al contador — ver §4 |

---

## §1 · ¿PUEDE UN CUIDADOR EMPLEADO OPERAR EL DURANTE DE GUARDERÍA? (`D-986`)

**① QUÉ FALTA.** El gate de las cinco RPC del durante, del acta y del tramo es
`user_gestiona_prestador` = **titular OR administrador OR `is_admin()`**. **El
empleado de a pie no pasa.** El recorrido de C está escrito para **quien maneja
la camioneta**, y esa persona hoy rebota.

**② LAS OPCIONES.**
- **(a) QUEDA COMO ESTÁ.** El día de guardería lo opera el **titular**. Cero
  código. Se documenta en la pantalla.
- **(b) SE ENSANCHA A UN ROL.** Exige decidir **cuál**: ¿el chip del oficio de
  guardería? ¿un rol `transporte` que hoy no existe? ¿`recepcion`?
  ⚠️ Ensanchar no es una línea: `empleado_tiene_rol` necesita un rol nombrado,
  y nombrarlo es decidir quién más puede firmar un acta.

**③ EL VOTO DE A: (a) por ahora, con fecha de revisión.** No por prudencia: por
una razón medida. Los actos únicos **levantan el acta y mueven el estado en la
misma transacción**, y si el gate del acta y el del estado difieren, **la
transacción puede autorizar la mitad**. Cualquier ensanche tiene que mover LOS
DOS a la vez, y eso es una tanda, no un parche.

**④ CONSTRUIDO ALREDEDOR — fail-closed y funcionando.** Las cinco RPC, el acta,
el tramo y el punto vivo usan **el mismo predicado**, así que no hay ventana en
la que uno autorice y el otro no. La pantalla de C lo declara como decisión
pendiente, **no como bug**.

**⑤ SI SE ELIGE MAL.** Con (a) mal elegida: el titular tiene que estar en cada
recogida — insostenible con volumen, pero **visible desde el primer día**. Con
(b) mal elegida: se entrega la firma del acta a un rol que no la debía tener, y
**eso no se ve hasta el litigio**.

---

## §2 · LAS CINCO TABLAS LEGADO DE ADOPCIÓN: ¿SE BORRAN? (`D-991`)

**① QUÉ FALTA.** Están en **0 filas** y con **0 consumidores en el monorepo** —
y sin embargo algo las recorre (`refugios` 322 `idx_scan`;
`solicitudes_adopcion` **996 `seq_scan`**). **Medido dos veces, por A y por D,
coincidiendo dígito por dígito.**

**② LAS OPCIONES.** **(a)** se dejan y se marcan · **(b)** se borran ·
**(c)** alguien con los repos del legado corre el censo ahí primero.

**③ EL VOTO DE A: (c), y no es una opción intermedia — es la única que produce
el dato que las otras dos necesitan.** `pg_stat_user_tables` es acumulativo y
**no dice QUIÉN**: sostiene *«algo las recorre»* y **no** sostiene *«una app las
consulta»*. Precedente caro: **S95-F encontró dos vistas que bloqueaban un
borrado sin que nadie las leyera desde el monorepo.**

**④ CONSTRUIDO ALREDEDOR.** Nada se construye sobre ellas, y por una razón
independiente de esta decisión: `adopcion_seguimiento.mascota_id` apunta a
`mascotas_adopcion`, **ninguna FK cruza a `mascotas`**, y `eventos_mascota`
tiene FK a `mascotas` ⇒ construir ahí daría **un adoptable sin expediente**,
justo lo que el §0 de `LETRA_ADOPCION` v1.0 deroga.

🔴 **Y la separación que hay que sostener: «no construir sobre ellas» y «no
borrarlas» son DOS decisiones distintas.** La primera ya está decidida por el
dato de las FK. La segunda **no**, y ningún documento la decide todavía.

**⑤ SI SE ELIGE MAL.** Borrarlas sin el censo del legado rompe una web viva **en
producción**, y el síntoma aparece lejos del acto.

---

## §3 · EL CENSO DE E — no es una decisión: es un TEXTO QUE NO LLEGÓ

**① QUÉ FALTA.** La mesa ordenó registrar el lote de E verbatim y atribuido en
`docs/loop/S110-E-LOTE2.md`. **El texto se anunció dos veces y nunca llegó.**

**② NO HAY OPCIONES QUE VOTAR.** O llega el literal, o no se registra.

**③ EL VOTO DE A: no se reconstruye de un resumen.** Ya se cobró dos veces en
esta casa: dos pistas midieron citando literales que viajaban en sus mandatos y
no en el repo, y una calibró mal un alcance por leer una letra archivada.

**④ CONSTRUIDO ALREDEDOR.** Nada depende de ese texto para avanzar; lo que se
pierde es **la atribución y el registro**, no una construcción.

---

## §4 · EL 5 % A LA FUNDACIÓN — estacionado por orden del loop

**① QUÉ FALTA.** La respuesta del contador. **② / ③** No se vota acá.
**④ CONSTRUIDO ALREDEDOR:** nada — **no se construye**, por orden explícita.
**⑤** Modelarlo antes de saber su figura fiscal es fabricar un motor que
después hay que desarmar.

---

## §5 · ENTRADAS DE LAS DEMÁS PISTAS

*A transcribe acá lo que llega por buzón, con su atribución. Vacío no significa
que no haya: significa que todavía no llegó nada.*

_(sin entradas)_
