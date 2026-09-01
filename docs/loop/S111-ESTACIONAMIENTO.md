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
>
> ---
>
> ### 🔴 DOS VOTOS DE PISTA NO SON UNA FIRMA — y con cinco pistas votando, hay que decirlo
>
> **Lo levantó B, y sobre una entrada donde su voto y el de A coincidían** (§5.2,
> la salud del adoptable). Su literal: *«tu voto coincide con el mío, y eso NO
> la destraba. Si construyera la pieza apoyado en que somos dos, estaría
> eligiendo la respuesta con código — que es justo lo que el estacionamiento
> existe para evitar.»*
>
> **La coincidencia entre pistas es INFORMACIÓN para el founder, jamás un
> sustituto de su firma.** *El riesgo es sutil y crece con el número de pistas:
> cuatro votos alineados se sienten como una decisión tomada, y no lo son —
> nadie con autoridad para firmarla participó.*
>
> ⇒ **Una entrada sale del estacionamiento SÓLO por firma del founder.** Que las
> pistas coincidan cambia lo rápido que él decide, no si hace falta que decida.

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

## §3 · ~~EL CENSO DE E~~ — ☠️ **RESUELTO, y no por donde se esperaba**

> **Esta entrada nació y murió en la misma jornada.** Se conserva tachada, no
> borrada, porque **la forma en que se resolvió corrige el supuesto con el que
> se escribió.**

**Lo que decía:** que el lote de E se había anunciado dos veces y nunca llegado,
y que **no se reconstruye de un resumen**.

**Lo que pasó:** el texto no llegó del founder — **lo depositó E misma**, en
`docs/loop/S110-E-MEDICIONES-3-A-6.md` (366 líneas, commit `47bbb6dd`),
**re-verificando sus cuatro veredictos contra `9443da56` antes de depositarlos**
porque en el medio se habían movido tres migraciones y `packages/api`.

🔴 **Y el supuesto que corrige es mío:** yo lo estacioné como *«un texto que
tiene que traer el founder»*. **La autora del censo estaba viva y podía
depositarlo ella.** *Estacionar algo esperando a una persona cuando otra ya lo
tiene es dejar quieto un trabajo que no estaba bloqueado.*

**De ese depósito salieron cuatro fichas y una lección** (`D-992` · `D-993` ·
`D-994` · `L-464`), más una tercera medición independiente de `D-988`. **Nada de
eso existiría si el ítem se hubiera quedado esperando.**

---

## §4 · EL 5 % A LA FUNDACIÓN — estacionado por orden del loop

**① QUÉ FALTA.** La respuesta del contador. **② / ③** No se vota acá.
**④ CONSTRUIDO ALREDEDOR:** nada — **no se construye**, por orden explícita.
**⑤** Modelarlo antes de saber su figura fiscal es fabricar un motor que
después hay que desarmar.

---

## §5 · ENTRADAS DE LAS DEMÁS PISTAS

*A transcribe acá lo que llega por buzón, con su atribución.*

---

### §5.1 · ¿QUÉ ACTIVA EL CANAL DE CONVERSACIÓN CUANDO NO HAY SERVICIO? — *de E*

**① QUÉ FALTA.** §5 pide una conversación entre publicador y solicitante, con
estados. Pero **§6.4.7 —decisión cerrada en S20— dice literal *«Sin servicio
activo, no hay canal»***, y refugio y adoptante **no comparten cita**. Medido por
E: no existe mensajería entre dos cuentas (única tabla `ticket_mensajes`,
usuario↔admin, 0 filas, 0 wrappers de 110, 0 rutas de 174).

> ### ⇒ La regla vigente, aplicada al pie, deja la conversación de §5 sin poder existir. **No es que falte construirla: está excluida por diseño.**

**② LAS OPCIONES.**
- **(a)** la solicitud de adopción es un **activador de pleno derecho**, igual
  que una cita: el canal se abre al postular y se cierra con el desenlace.
- **(b)** **canal propio de adopción**, superficie separada, con su propia regla
  de vida.

**③ EL VOTO DE E: (a) — y su argumento es textual.** §6.4.7 **no dice «cita»**:
dice *«cita / servicio / **contrato** activo»*, y una solicitud de adopción es
exactamente eso: un vínculo acotado entre dos cuentas, con principio y con fin.
**(a) ensancha el activador sin tocar el principio**; (b) crea un segundo canal
cuya divergencia hay que sostener para siempre.
**A coincide con (a)**, y agrega una razón de conducción: *un segundo canal
duplica las reglas de privacidad, y una regla duplicada por copia se cura dos
veces o no se cura.*

**④ CONSTRUIDO ALREDEDOR — fail-closed.** D construyó **el módulo de mensajería
con la ley del hilo en TS** (`packages/mensajeria`, `verify:mensajeria` 26/26) y
publicó su contrato de DB. **Nada está cableado a una superficie**, y el motor no
existe todavía. *Si la mesa elige (b), lo que se mueve es dónde vive el canal, no
la ley del hilo.*

**⑤ SI SE ELIGE MAL.** Con (a) mal elegida: se ensancha un activador que la
privacidad de S20 acotó a propósito. Con (b) mal elegida: dos canales que
divergen, y el día que una regla de privacidad cambie, se cura uno solo.

---

### §5.2 · ¿EL ADOPTANTE VE LO QUE LE FALTA DE SALUD AL ANIMAL? — *de B*

**① QUÉ FALTA.** §3 dice *«salud con honestidad de semáforo»* y **no define sus
estados ni su audiencia**. ¿El adoptante ve los pendientes sanitarios —vacuna que
falta, castración pendiente— o sólo lo que ya está hecho?

**No es una pregunta de estilo:** en guardería la respuesta está firmada y el
pendiente es **accionable** para quien lo lee. Acá **el lector no puede resolver
nada** —la vacuna la pone el refugio—, así que mostrar el faltante o es
**información para decidir** o es **una marca en contra del animal**. *De eso
depende si la pieza existe.*

**② LAS OPCIONES.** **(a)** se muestra, como información **sin acción** ·
**(b)** sólo se muestra lo que ya está hecho.

**③ EL VOTO DE A, sobre el análisis de B: (a).** §3 pide honestidad y §10
prohíbe esconder — *«necesidades especiales» existe sólo para incluir*. Y el
argumento decisivo es el de B: **un adoptante que se entera después de la
castración pendiente tiene una sorpresa, no una decisión.** El riesgo que (b)
evita —que la lista se lea como defecto— es un problema de **cómo se dice**, y
ése sí lo puede resolver el diseño; el de (a) mal elegida no.

**④ CONSTRUIDO ALREDEDOR.** B **no construyó la pieza**, y midió por qué no
podía reusar la de guardería: `SemaforoSanitario` obliga por TIPO a un
`onResolver` que en adopción no lleva a ningún lado ⇒ **el trasplante no
compila** (`D-995`). *La puerta no existe, en vez de existir abierta.*

**⑤ SI SE ELIGE MAL.** Con (b): la sorpresa llega después de la adopción, que es
donde §3 midió que un dato mal contado **le cuesta el hogar** al animal.

---

### §5.3 · EL AVISO AL PADRINO CUANDO EL AHIJADO FALLECE — *de D*

**① QUÉ FALTA.** §6 firma que si el ahijado *«es adoptado, fallece o el refugio
se va»* el padrino recibe aviso — **y da el texto sólo para «adoptado»**. Para
*fallece* **choca con una firma anterior**: S88 firmó que la liberación por
memorial **CALLA**, y está en el body de `_trg_mascotas_memorial_planes`: *«el
memorial calla, también acá… lo que muere es el AVISO»*.

**② LAS OPCIONES.** **(a)** el padrino recibe aviso también en fallecimiento ·
**(b)** no lo recibe; sólo ve que su recurrencia se detuvo, sin causa.

**③ EL VOTO DE D: (a)**, con voz de duelo y **sin** invitación a apadrinar otro
en el mismo mensaje. Su razón, que es la que decide: **el silencio de S88 protege
a LA FAMILIA; el padrino es un TERCERO que está pagando**, y *un cobro que se
detiene sin explicación es peor que la noticia.*
**A coincide**, y agrega que (b) produce un caso de soporte sin respuesta —
exactamente lo que `D-988` existe para evitar.

**④ CONSTRUIDO ALREDEDOR — fail-closed y verificado.** Las tres causas existen en
`padrinazgo.ts`; **`fallecido` nace con `avisa: false` y su `motivoSinAviso`
escrito**, y `verify:mensajeria` lo ejerce (*«🅿️ fallecido NO avisa (estacionado,
fail-closed)»*). **D no pidió el tipo de notificación correspondiente**, así que
la puerta no existe. 🔴 **El cobro se detiene igual: eso no está en duda y no
depende del aviso.**

**⑤ SI SE ELIGE MAL.** Con (b): alguien paga por un animal que murió y su cobro
se apaga sin decir nada. Con (a) mal dicha: se automatiza un duelo, que es lo que
la letra prohíbe — por eso el voto lleva «voz de duelo y sin invitación».

---

### §5.4 · ¿EL PUBLICADOR CONSERVA LA VISTA DEL HILO TRAS `declinada`? — *de D*

**①** §5 no lo dice. **②** (a) sí, en lectura, por trazabilidad de disputa ·
(b) no. **③ Voto de D: (a). A coincide** — *un hilo que desaparece al declinar
deja sin material justo el caso en que alguien reclama.*
**④ CONSTRUIDO ALREDEDOR:** el módulo lo expone como **parámetro explícito, sin
default**, así que **nadie hereda una respuesta que nadie dio.**
**⑤** Con (b): la disputa se resuelve sin registro.

---

### §5.5 · ADJUNTOS EN EL HILO — *de D*

**①** §5 no los nombra; el vertical sí promete fotos del animal (§5, §6).
**②** libre · sólo imagen · ninguno.
**③ Voto de D: imagen, y SÓLO del lado del publicador.** *Del publicador porque
las fotos que el vertical promete son **del animal**, y quien lo tiene es quien
lo tiene; sólo imagen porque un adjunto libre abre subida de documentos entre dos
personas que no se conocen, y eso arrastra retención y contenido que ninguna letra
decidió* (`D-405` sigue abierta). **A coincide.**
**④ CONSTRUIDO ALREDEDOR:** **D no pidió bucket en el contrato de DB.** *Sin
bucket la puerta no existe, en vez de existir abierta.*
**⑤** Con «libre»: se abre un canal de archivos sin política de retención.

---

### §5.6 · ¿«QUIERO ADOPTAR» CREA LA FAMILIA VACÍA? — *de C*

**① QUÉ FALTA.** §4 tiene una puerta *«quiero adoptar»* y no dice si esa persona
queda con familia creada o sin nada.

**② LAS OPCIONES.** **(a)** la crea vacía · **(b)** no crea nada hasta que
adopte.

**③ EL VOTO DE C: (a), con NÚMERO.** Con (b), **24 superficies de
`apps/cliente` que cuelgan de `familia_id` tendrían que aprender a tolerar
`null`, y ninguna lo tolera hoy.** *No es una preferencia de arquitectura: es
el costo medido de la otra opción.*

**④ CONSTRUIDO ALREDEDOR.** C **no cableó esa rama** — *sin saber qué crea, la
salida del alta sería un botón que no sabe dónde deja al usuario.* Y midió que
el guard de entrada **no cambia** con (a): `tiene_familia ? '/hogar' :
'/onboarding'` sigue siendo correcto, porque quien eligió adoptar tiene familia.
Lo único que cambia es **poder salir del onboarding sin mascota**.
🔴 **A NO construyó el RPC**, a pedido de C: hoy sólo existe
`crear_familia_con_primera_mascota`, que exige mascota. *Un RPC construido sobre
una decisión no firmada es motor que puede nacer para nada.*

**⑤ SI SE ELIGE MAL.** Con (b) sin preparar las 24 pantallas: la app entra en
estados que ninguna tolera, y el síntoma aparece lejos del alta.

---

### §5.7 · EL BLOQUE «LLEVAN MÁS TIEMPO ESPERANDO» — *de C*

**① QUÉ FALTA.** §4 pide ese bloque encabezando la vidriera **y dice explícito
que NO es orden por antigüedad**: *«los que más esperan suelen ser los más
difíciles, y una primera pantalla de casos duros hace rebotar al que entró a
mirar»*. **El criterio real no está escrito.**

**② LAS OPCIONES.** **(a)** el criterio se define y vive en el servidor ·
**(b)** el bloque no existe en v1.

**③ EL VOTO DE A: (a), pero es tuyo el criterio.** *Lo único que no se puede es
que lo invente una pantalla.*

**④ CONSTRUIDO ALREDEDOR.** C **no construyó el bloque**: la vidriera sale
ordenada como venga del motor. Y lo dijo bien — **tenía `creadaEn` a mano, que
es exactamente lo que la letra prohíbe usar.** *Tener el dato para hacerlo mal y
no hacerlo es la parte difícil.*

**⑤ SI SE ELIGE MAL.** Con antigüedad pura: la primera pantalla es de casos
duros y **hace rebotar a quien entró a mirar** — el daño que §4 nombra.

---

### §5.8 · EL MODELO DE CONVIVENCIA — *de A, con la pieza de B esperando*

**① QUÉ FALTA.** §3 pide *«convive con perros / gatos / niños»* con **tres
estados** (sí · no · **no se sabe**), y §4 pide filtrar sin borrar al que no se
midió. **No hay dónde leer eso.** Lo único parecido es
`mascotas.paseo_social_ok` (booleano, de la socialización de paseo), que **no es
lo mismo y no tiene el tercer estado**.

**② LAS OPCIONES.** **(a)** tres dimensiones con tres estados cada una ·
**(b)** una sola señal de convivencia · **(c)** texto libre del refugio.

**③ EL VOTO DE A: (a).** §4 pide **filtrar** por convivencia, y un filtro
necesita valores, no prosa. *Y el tercer estado no es un detalle: la letra dice
que con el filtro activo van arriba los confirmados y abajo, con su título, los
que todavía no se saben — sin «no se sabe» esa regla no se puede escribir.*

**④ CONSTRUIDO ALREDEDOR — y acá hay una pieza esperando.** B construyó
**`Convivencia`**, con los tres estados y **el tercero con voz propia**, y está
**entregada y NO montada**: no tiene de qué hablar. A **no inventó el modelo de
datos** y `Adoptable` **no trae convivencia** — *modelarlo es decidir cuántas
dimensiones hay y qué significa «no se sabe», que es producto y no esquema.*

**⑤ SI SE ELIGE MAL.** Con (b) o (c): el filtro de §4 no se puede construir, y
la pieza de B queda sin uso. *Con (c) además, la información que decide si una
familia con chicos adopta a ese animal queda en un párrafo que nadie puede
filtrar.*
