# S111 · C → MESA · REPORTE FINAL DE LA PISTA C

**Rama:** `pista/s111-c` — **A mergea la rama entera** (su HEAD).
**Alcance:** `apps/cliente` + `docs/loop`. **Cero `packages/`, cero `supabase/`,
cero `apps/prestador`.**

---

## ✅ CONSTRUIDO — y dónde

| qué | dónde |
|---|---|
| **`D-990` cerrada** · la familia se entera de que no se pudo recoger | `(tabs)/hogar/guarderia.tsx` |
| **El hogar sin nadie deja de ser un callejón** · su vacío gana camino | `(tabs)/hogar/index.tsx` |
| 5 claves nuevas, espejo `es`/`en` completo | `i18n/{es,en}.ts` |

**Verificado:** typecheck cliente y prestador **en 0** · `verify:diseno` **VERDE
con 62 reglas** · `verify:sin-byte-nul` verde · **typecheck con control
negativo** (una clave inexistente rompe sobre mi archivo y vuelve a verde) ·
árbol limpio.

## 📝 ESCRITO — los recorridos, antes de construir

`docs/loop/S111-C-RECORRIDOS.md`: los **tres bloques** en voz de usuario, con
sus caminos tristes. *Cuando el motor llegue, la construcción no va a tener que
inventar el QUÉ.*

## 🅿️ ESTACIONADO — una sola, con voto y números

**¿«quiero adoptar» crea la familia vacía?** (a) sí · (b) no crea nada.
**Voto: (a)** — con **(b)**, 24 superficies de `apps/cliente` que cuelgan de
`familia_id` tendrían que aprender a tolerar `null`, y **ninguna lo tolera hoy**.
Detalle en `S111-C-para-A-ESTACIONAMIENTO.md`.

## 🔴 FRENADO — todo por lo mismo, y no es de esta pista

**La vidriera pública · el portal del publicador · el arco del cliente
(solicitud, conversación, acta, transferencia, padrinazgo, donación).**

**Motivo único, medido:** **cero motor de adopción** — 0 funciones
`adopc*`/`adoptable*`/`padrinazgo*`/`refugio*` sobre **369 migraciones** con
`CREATE FUNCTION`, y 0 wrappers en `packages/api`.

⚠️ **Y las piezas de las otras pistas YA ESTÁN esperando:** `Convivencia` de B
—los tres estados, con el tercero con voz propia— y `packages/mensajeria` de D.
*Las dos existen y ninguna tiene de qué hablar todavía.* **El motor es el único
eslabón que falta para que tres bloques arranquen a la vez.**

## ⏳ LO QUE ESPERA AL FOUNDER

1. **El recorrido en aparato — nada de guardería se ejerció.** La veda de
   publish se sostiene: entrega → merge → APK de nube → su recorrido con dos
   animales de dueños distintos y los dos lados → recién ahí publish.
2. **El día de guardería lo opera el TITULAR**, no el cuidador empleado
   (gate `user_gestiona_prestador`). Decisión de producto, no defecto — y la
   razón técnica de A la cierra: *dos gates distintos en un acto único
   autorizan la mitad de una transacción.*
3. **El estacionamiento de arriba**, si quiere decidirlo él en vez de la mesa.

## 🧭 LO QUE ESTA PISTA APRENDIÓ, y sirve fuera de ella

**Una ficha que declara un hueco se mide contra el objeto antes de tomarla,
aunque la haya escrito uno mismo.** `D-990` decía *«nadie lo construyó»* y media
pieza existía desde S107-C. Era verdadera desde mi perímetro de S110 —que
excluía el lado familia— y **falsa como descripción del producto**. *Un hueco
entre dos perímetros se ve mal desde los dos lados **incluso después de
elevarlo**: quien lo eleva describe su mitad, no el hueco.*

Y su gemela chica, cobrada dos veces el mismo día: **un censo por texto lee prosa
como si fuera código.** `mascotas_count` daba 1 consumidor y **ese 1 era un
comentario que había escrito yo media hora antes.**


---

# ⏩ ACTUALIZACIÓN AL CIERRE — después de que el motor de adopción llegó

## ✅ CONSTRUIDO (se suma a lo de arriba)

**La vidriera vive.** `/adoptar` era un «próximamente honesto» de S73 y **el
motor lo volvió falso el mismo día**; se retiró en el acto que lo volvió falso,
con sus dos claves. Alcanzable desde el Hogar, medido. Un solo filtro —especie—
porque es lo único que el contrato acepta.

## 🔴 LA PUERTA SIN CUENTA: ABIERTA A MEDIAS, Y POR ESO NO SE CABLEÓ

A abrió `obtener_adoptables` a `anon` (tomó mi voto). **Pero las fotos no.**

```
bucket 'mascotas'   → public = false
única policy SELECT → "mascotas_select_dueno_o_acceso" ... TO AUTHENTICATED
```

`resolverUrlsFotos` firma con `createSignedUrl`, que necesita ese SELECT ⇒ **un
anónimo no obtiene ninguna firma y la vidriera sería una grilla de huellas
grises con nombres.**

**No se abrió la puerta, y el motivo es de producto:** §4 dice *«se presentan
vidas, no inventario»*, y una grilla de siluetas **es** inventario. *Quien llega
de una foto en Instagram y encuentra doce huellas se va peor que si nunca
hubiéramos ofrecido la puerta.* La firma de esa pantalla es la cara.

⚠️ **Y la cura obvia sería un agujero:** ese bucket tiene las fotos de **todas**
las mascotas, no sólo las publicadas. Voto una policy de `anon` **acotada a
mascotas con publicación viva** — mismo predicado que ya usa la función, para
que las dos no puedan divergir. **Está con A.**

## 🅿️ ESTACIONADO — ahora son tres

1. **Qué crea «quiero adoptar»** (voto (a), con el 24).
2. **El orden de la vidriera** — §4 pide «Llevan más tiempo esperando» y dice
   explícito que **no es antigüedad pura**. El criterio vive en el servidor o no
   vive: ordenar por `creadaEn` en la pantalla es justo lo que la letra prohíbe.
3. **El modelo de convivencia** — bloquea a B. `Convivencia` está **entregada y
   no montada**, y sigue así hasta que se firme cuántas dimensiones tiene y qué
   significa «no se sabe». *`paseo_social_ok` no sirve: es un booleano de otra
   cosa y no tiene el tercer estado.*

## 🔴 FRENADO — el portal del publicador y el arco del cliente

Medido con control (766 `CREATE FUNCTION`): **cero funciones de solicitud,
padrinazgo o donación**. El Home del publicador es *«una sola cosa cuenta: las
solicitudes por revisar»* — **sin ese motor, su Home es la pantalla vacía de lo
que le da sentido**, y las otras dos tabs no hacen un «tercer eje» solas.
**No se construyó a medias.**

## 🧭 Y UNA MÁS QUE APRENDIÓ ESTA PISTA, cobrada en carne propia

**Afirmé que A había mergeado con squash, y era falso.** Su medición lo desarmó
en dos comandos. **La corregí a la vista, tachada y con su causa real.**

*Lo que la hizo barata de corregir —y esto es de A— es que declaré el
MECANISMO que suponía, no sólo el resultado.* Si hubiera escrito «el control
falla» sin decir «por squash», **nadie habría podido medirlo**: una afirmación
sin mecanismo no se puede falsar, sólo creer.

**Y su gemela del mismo día, del lado del instrumento:** censé policies de
storage con un regex que exigía el nombre sin comillas y me dio **9 sobre todo
el repo**. El número era absurdo y el control lo delató: **son 330.** *Un censo
por patrón acota, no cierra* — y lo que lo salvó fue mirar si el total tenía
sentido, no el patrón.


---

# ⏩ EL GATE DEL FOUNDER — primera pasada, diez hallazgos

## ✅ NUEVE CERRADOS

| # | qué era | quién |
|---|---|---|
| ① | **la foto no quedaba** — bloqueante | **C** |
| ②③④ | obligatoriedad invertida en las dos actas | C |
| ⑥ | las no recogidas en el viaje de vuelta | C |
| ⑦ | la familia nunca vio el en vivo | motor: A ✅ · pantalla: **C** |
| ⑧ | el durante dentro de la guardería | **C** (con dos frenos) |
| ⑨ | el orden del día | **C** (falta la franja) |
| ⑩ | el durante no avisa | **A** |

## 🔶 ⑤ — LO ÚNICO ABIERTO, y su mitad de A ya está

`ActaDeEntrega` no se dibuja sin checklist, y la devolución —sacado el carnet—
no tiene ninguno. **Pedido a B.** A ya prohibió `carnet_verificado` en
devolución **por CHECK y por tipo**.

🔴 **Los APK están retenidos por esto**, a pedido mío: con ⑤ abierto el founder
se encuentra otra vez el check que ya marcó.

## LAS TRES QUE VALEN FUERA DE SU CASO

**① El síntoma apuntaba al revés de la causa.** La foto **se subía bien** y
desaparecía; **la que fallaba se quedaba a la vista**. Y el error no era de la
cola: `pendientes` es la cola de **TRABAJO** y yo la usé como si contestara *«qué
fotos tiene esta acta»*, que es otra pregunta. *Una foto publicada dejó de ser
trabajo pendiente y siguió siendo, exactamente igual, una foto del acta.*

**⑥ Tres afirmaciones en un hallazgo, y sólo una era cierta.** «Arrastra las no
recogidas» eran tres cosas —no entra al tramo · no aparece en la lista · no
admite acto— y **dos ya se cumplían**. Curar sin separarlas habría tocado el
motor sin necesidad. **Se curó derivando de la máquina**, no enumerando estados.

**⑤ El freno valió más que la cura.** No mandé `false` en el carnet para
desbloquear la pantalla: *habría dejado en cada acta de devolución la afirmación
de que el carnet se revisó y no estaba bien — y eso no se arregla después, queda
con su sello de tiempo.*

## Y UNA DE COORDINACIÓN, cobrada hoy

**Mandé el pedido de ⑤ a la sesión equivocada** creyendo que era B. E me corrigió
—le había pasado lo mismo— y lo remandé.

⇒ *Un pedido bien escrito que llega al destinatario equivocado **no falla:
espera**, y su espera se lee igual que «todavía no lo hizo».* Con un freno
bloqueando los APK, esa diferencia cuesta horas. **La identidad de la pista se
verifica antes de mandar, no se infiere del nombre de la sesión.**


---

# ⏩ LA TANDA DEL TOQUE — ①②③

## ✅ ① · LA PUSH ABRE PANTALLA, en las dos apps

**Hasta hoy no había un solo listener de toque en el repo.** El despachador ya
mandaba el destino y nadie lo leía — `L-460` exacta.

**Los tres estados, y el tercero no lo cubre un listener:** abierta y en fondo
sí; **con la app CERRADA el toque ocurrió antes de que existiera el proceso**, así
que además se pregunta por el toque que la arrancó. *Un listener solo anda en dos
de los tres casos y se ve como si anduviera.*

**Elegí (b) contra el voto de A**, y por un hecho que su voto no tenía: **el
lector de `notificacion_intencion` no existe** ⇒ (a) era wrapper + RPC + policy
nuevos **para ir a buscar afuera un dato que el servidor ya tiene en la mano**.
Y con la app cerrada, (a) hace que el destino **dependa de una llamada de red**.
A lo tomó y puso la línea.

**Probado 9/9** con un caso positivo y ocho negativos —incluida la ruta vacía,
que A midió como **el caso mayoritario hoy**, y las dos formas de ruta externa.

## ✅ ② · EL EN VIVO — verificado en sus cuatro condiciones

Un punto y **jamás la traza** *(garantía estructural: el array lleva
exactamente uno)* · se apaga en `entregada`/`no_recogida`/`cancelada` · puerta
desde el hub · **y ahora una segunda: la push.** *El aviso «Thor va en camino»
ES la puerta, que era el punto del hallazgo.*

## 🔶 ③ · EL DURANTE — fotos ✅ · clip ✅ · **chips ❌**

**El clip está montado** con la pieza de B, reusando el grabador que ya corre en
`adiestramiento/clips`. *Un segundo grabador serían dos formas de cortar a los
30 s, y descubrir en el aparato cuál falla.*

🔴 **Faltan los chips** — cero `registrarBitacoraGuarderia`. **Es de A y está en
su cola.** *El vocabulario existe y sirve* (`cat_conductas_bitacora`, la bitácora
universal); lo que falta es el escritor del prestador.

⚠️ **Y es el que cierra el recorrido del cuidador** —*«al final del día marco
cómo se portó cada uno»*—; el clip era un agregado sobre algo que ya andaba.

## LO QUE ESTA TANDA DEJA COMO MÉTODO

**Un tipo que dice menos de lo que la función garantiza empuja al consumidor a
castear.** `reglasSegunLugar` prometía «array que puede estar vacío» y devuelve
4 o 3. **Ahora promete la tupla no vacía — y no a mano:** el `filter` no conserva
el largo, así que se enumera la primera regla aparte y **la garantía es del
compilador**. *Afirmarla sobre el `filter` habría sido la promesa que el cambio
existe para no hacer.*

**Y su corolario, que es de B:** con el tipo arreglado, su segunda capa —el
obturador se apaga si las reglas llegan vacías— **queda como cinturón que no se
ejerce**, que es exactamente donde tiene que estar (`L-424`).


---

# ✅ CIERRE — las tres piezas de la tanda del toque, y la franja

| pieza | estado |
|---|---|
| ① la push abre pantalla, dos apps, tres estados | ✅ |
| ② el en vivo, con **dos** puertas | ✅ |
| ③ el durante: fotos · clip · chips | ✅ |
| ⑨ la franja — el orden del día se puede explicar | ✅ |

## LA FRANJA CERRÓ ALGO QUE YO NO HABÍA VISTO

A midió que **mi «orden natural» era el ALFABÉTICO**: el cuidador veía *Bobby,
Jack, Thor, Zeus* cuando necesita *primero los que hay que buscar*. **Las
franjas existían y estaban pobladas** — el dato estaba y nadie lo leía. *Motor
sin puerta, otra vez, y esta vez del lado del orden.*

**Y no reordeno**: verifiqué con dos colores que sin orden manual devuelvo
exactamente lo que vino del motor. *Reordenar acá sería la segunda fuente que el
orden del servidor vino a evitar.*

**La franja se MUESTRA**, y ésa es la mitad que la hace útil: *un orden correcto
sin la razón a la vista es casi tan malo como uno equivocado — parece
arbitrario, y lo arbitrario invita a re-acomodar todo a mano cada día.*

## LAS TRES QUE OTRAS PISTAS CAZARON EN MI TRABAJO, y valen más que las mías

**① B midió una fricción de tipos en mi archivo.** `reglasSegunLugar` prometía
«array que puede estar vacío» y devuelve 4 o 3 ⇒ *el tipo decía menos de lo que
la función garantiza*, y eso empuja al consumidor a castear. Arreglado **sin
afirmar nada**: el `filter` no conserva el largo, así que se enumera la primera
regla aparte y **la garantía es del compilador**.

**② B vio que escribí «un clip sin micrófono sale mudo» sin medirlo** — en el
código **y en la voz al usuario**. El contrato de `expo-camera` no dice qué pasa
sin el permiso. *La decisión no cambió; lo que cambió es que el comentario ahora
distingue qué medí de qué supuse.* ⇒ **una voz que explica un mecanismo es una
afirmación más que hay que mantener verdadera**, y el usuario la lee justo cuando
algo no anda.

**③ A me avisó de la trampa de los objetivos antes de que la chocara.** El
vocabulario mezcla conductas y objetivos y su escritor rechaza los segundos.
*Pintarlos habría dado el peor tipo de rebote: el que culpa al usuario de una
diferencia que la pantalla le escondió.*

## LO QUE SIGUE SIN CONSTRUIR, con dueño

**Estacionado:** qué crea «quiero adoptar» (voto (a), con el 24) · el orden base
de la vidriera · el modelo de convivencia, que deja `Convivencia` de B
**entregada y no montada**.

**Y nada de esto se ejerció en aparato.** La veda de publish sigue: el founder
camina, y recién ahí.
