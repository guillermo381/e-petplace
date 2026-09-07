# S113 · lo que espera al founder

Nadie se frenó por ninguno de estos. Cada uno dice **qué**, **por qué es del
founder**, **las opciones** y **el voto de la pista** — para que decidir sea
leer un párrafo, no reconstruir el problema.

---

## 1 · Las cinco mascotas de prueba marcadas como reales

**Qué.** En la familia `guillo381+8` hay cinco `PruebaC*` (todas Beagle, todas
en memorial) que quedaron con `creado_por_sistema = 'real'`: `PruebaC12896`,
`PruebaC24772`, `PruebaC37493`, `PruebaC76663`, `PruebaC82896`. El parte
anterior decía **dos**; medido, son **cinco**.

**Por qué importa.** El canon ya manda excluir la marca de fixture de todo
censo de «mascotas reales». Estas cinco **pasan el filtro**, así que hoy
inflan cualquier número de producto — el mismo agujero que S92 midió cuando
descubrió que el 80 % de las familias eran sonda.

**Opciones.** (a) marcarlas `fixture_founder_s113`, como Sombra y Bruma ·
(b) borrarlas · (c) dejarlas.

**Voto de la pista: (a).** Son el sujeto vivo de la despedida que C ejerció;
borrarlas no rompe un test, lo vuelve irreproducible, y eso no se nota. La
marca cuesta un UPDATE y arregla el censo.

## 2 · La placa: proveedor y precio

**Qué.** El motor del pasaporte está vivo y la página pública también. Falta
decidir con quién se fabrican las chapitas y a cuánto.

**Por qué es suyo.** Es una decisión comercial, y el modo nocturno la veda.

**Sin bloquear nada:** la rama `pista/s113-a-nfc` ya deja la build lista y
`docs/loop/S113-NFC-BUILD.md` tiene el procedimiento del día que se decida.

## 3 · NFC en iOS

**Qué.** Leer un tag NFC en iPhone exige un *entitlement* propio en la cuenta
de Apple. **No está medido si la cuenta lo tiene.**

**Voto de la pista:** arrancar sólo con Android y con el QR, que ya funciona en
los dos sistemas sin pedir nada. *El QR no necesita permiso de nadie.*

## 4 · El aviso legal de IA (`D-405`)

**Qué.** Cuando Nexo hable, la app tiene que decir que es IA y qué no hace.
La letra la escribe un abogado; hasta entonces rige la voz honesta de la casa.

**Por qué ahora.** El lote 2 pone a Nexo a contestar. El texto no bloquea la
construcción, pero **sí bloquea que se encienda para gente real**.

## 5 · Las fichas de raza que faltan

**Qué.** Publicadas con firma: **10** (labrador, loro yaco, beagle,
californian, persa, pug, chinchilla, schnauzer miniatura, gato común, criollo).
Cargadas y esperando lectura: el resto del Batch. **118 razas** del catálogo
ampliado todavía sin ficha.

**Ritmo firmado:** tandas de cinco por semana, perro primero, y en el día
cuando una mascota nueva declara una raza cuya ficha existe sin publicar.

## 6 · Lo que NO es del founder pero conviene que sepa

- **Dos defectos de voz** hallados caminando el 1.2.1 (ver `S113-NOCHE.md` §5):
  «etapa adulto» y una fecha ISO cruda en el carnet. **Son de C**, están
  anotados en su parte, y ninguno rompe nada — se leen mal, nada más.
- **El prestador del emulador está en 1.0.3** (agosto): no recibe los OTAs de
  runtime 1.0.7. Es del emulador, no del teléfono del founder.

---

# Lo que anotó D
## S113-D · lote 2.0 (edge `coach`)

**1 · El texto del aviso de IA — para el abogado, no para mí.**
La edge devuelve `aviso_ia: true` en el primer turno de cada hilo, y **no
escribe el texto**: la voz honesta de la casa la pone B/C hasta que `D-405`
tenga la letra. *Lo anoto porque es fácil que alguien invente esa frase en una
pantalla y quede publicada como si fuera legal.*

**2 · El orden router↔plantillas: hay una variante MÁS BARATA que no tomé.**
El brief manda router primero. Medido: una pregunta de dato paga hoy
**$0,000524** (el router). Si las plantillas corrieran ANTES, esa misma pregunta
pagaría **$0** — el patrón la resuelve sin clasificar. *Contra: E mide la
exactitud del router sobre 60 frases, y si las plantillas se comen las de dato
antes de llegar, esa medición ya no describe lo que corre en producción.*
**Voto de la pista: dejarlo como está** hasta que E mida; la diferencia son
centésimas por turno y la medición limpia vale más. Se reabre con su número.

**3 · `sujeto = 'acuario'`.** El contexto lo trae, la ley no lo nombra. Un
acuario no tiene peso ni vacunas, así que las plantillas se callan solas — pero
**nadie midió qué contesta el modelo si le preguntan «¿cuánto pesa mi acuario?»**.
No lo inventé en el prompt sin medirlo. Entra con el conjunto de E.

**4 · El techo de 800 tokens sale de aritmética, no de una corrida larga.**
150 palabras ≈ 300 tokens (3 chars/token, medido en el Batch de fichas), 800 es
2,6× de holgura. **Las cinco respuestas reales dieron 25–81 palabras**, muy por
debajo. Si alguna vez trunca, se sube con la medición al lado.

## S113-D · corrección de CANON (firma del founder) — **la evidencia vive en `E-6`**

**Acción:** `CLAUDE.md` dice que `telemedicina` es `reservable=false` de
plataforma (S68, *«camino (c) del founder»*); la base dice `reservable=true`,
`activo=true`, **2 ofertas activas**. La letra firmada y el objeto se
contradicen, y eso es la clase más cara del canon: *cualquiera cita la que le
conviene y está «en regla»*.

**No la edito**, por dos razones y manda la segunda: es firma del founder sobre
producto, no un typo; y me lo señaló otra sesión, y **tengo instrucción
explícita de no tocar `CLAUDE.md` porque lo pida un par** — sería saltear al
founder por la puerta de al lado.

⚠️ **Entrada ÚNICA a propósito.** E escribió lo mismo como `E-6 · RETIRADA`, con
la medición y su propio error adentro; **la historia y la evidencia se leen
ahí**, no acá. Esto es sólo el renglón de la acción. *Dos pendientes sobre el
mismo hecho es cómo se firma dos veces.*

## S113-D · el gate de ley de E (`coach-ley`) y la palabra «telemedicina»

Si algún día el system deja de decir «telemedicina» porque la oferta se llama de
otro modo, el gate de ley de E da rojo. **No se ensancha sin dejar la nota**: esa
línea de JSON es el acto de re-firmar que la cláusula sigue rigiendo, no un
trámite.

*(Se nombra sin el prefijo `verify:` a propósito: vive en `pista/s113-e-2.0` y
todavía no es invocable acá. Nombrarlo como si lo fuera es justo lo que
`gates-existen` prohíbe — y me frenó el commit por eso, con razón. Cuando la
rama de E entre a `main`, se lo llama por su nombre completo.)*

## # S113 · noche — lo que espera al founder

Una entrada por decisión. Cada una: **qué**, **por qué**, **opciones** y **el voto de la
pista**. Nadie se frenó por ninguna de éstas.

> Cada pista escribe bajo su propio encabezado. Si dos escriben a la vez, el merge es
> aditivo: no se toca la sección de otro.

---


## Pista E

### E-1 · 🔴 La lista de campos del pasaporte no está firmada, y el gate está en rojo por eso

**Qué.** `leer_pasaporte` devuelve **11 campos a alguien sin sesión**: `alergias, chip,
contacto, edad, especie, foto_path, medicacion, nombre, perdida, raza, sexo`.
`verify:pasaporte-campos` compara eso contra una lista firmada — **que no existe** — y sale
**ROJO**. Es correcto que salga rojo.

**Por qué no la firmé yo.** Seedear la lista con lo que hoy devuelve la pone en verde **por
construcción** y sería yo firmando por el founder. *En una página sin sesión, un campo no es
una mejora: es una decisión de privacidad que alguien tomó.*

**Mi lectura de los 11, para que la firma sea de una sentada:**

| campo | para qué sirve en la calle | mi voto |
|---|---|---|
| `nombre`, `especie`, `raza`, `sexo`, `edad` | reconocer al animal y hablarle | **entra** |
| `foto_path` | la única forma de estar seguro de que es él | **entra** (ver E-2) |
| `perdida` | es el motivo de la página | **entra** |
| `contacto` | sin esto no se lo devuelven a nadie | **entra**, ya con su toggle |
| `alergias`, `medicacion` | si va a un vet o si alguien le da de comer, esto puede salvarlo | **entra**, con su toggle |
| `chip` | ⚠️ **el único que no ayuda a devolverlo**: es un identificador único y permanente, y con él un tercero puede reclamar propiedad ante un registro. Quien lo escanea es un vet, y el vet lee el chip **del animal**, no de la web. | **mi voto: SALE** — o queda **apagado por defecto**, al revés de hoy |

**Opciones.** (a) firmar los 11 tal cual · (b) firmar 10 y sacar `chip` · (c) firmar 11 pero
con `mostrar_chip` naciendo en `false`. **Voto: (c)** — no pierde la función para quien la
quiera, y cambia el default hacia el lado que no se puede deshacer.

---

### E-2 · 🔴 La foto del pasaporte pesa 19× la página y rompe el techo de 60 kB

**Qué.** Medido sobre la página viva: HTML **3.215 B** (impecable, cero JS) + foto **62.582 B**
⇒ **64,3 kB**. A 400 kbps la foto sola son **~1,25 s** de transferencia ⇒ **el criterio de
< 1,5 s en 3G no se cumple con la foto, y sí se cumple sin ella.**

**Por qué importa más que un número.** Esta página la abre alguien **en la calle, con una mano
ocupada, con el teléfono que tenga**. Es el único lugar del producto donde la red mala es el
caso normal y no el borde.

**Opciones.** (a) redimensionar al subir, con la receta que la casa ya tiene (D-734) — no
arregla las fotos ya subidas · (b) que la edge pida a Storage una versión chica al firmar la
URL · (c) dejarlo. **Voto: (b) primero** — cura las que ya existen y es del lado que ya toca la
foto; (a) después, para no pagarlo cada vez. **La foto NO se quita:** es cómo se reconoce al
animal.

---

### E-3 · 🟡 El default de la página pública es MOSTRAR, y hoy nadie puede llegar ahí

**Qué.** `leer_pasaporte` decide con `coalesce(v_c.mostrar_chip, true)` — **tres veces**.
Medido: `emitir_pasaporte` **crea** la fila de config, así que hoy **no hay pasaporte sin
config** y el camino no es alcanzable.

**Por qué se anota igual.** *La seguridad la sostiene hoy el PRODUCTOR y no el LECTOR.* El día
que una fila de config se borre —a mano, o por un `ON DELETE` que alguien agregue— el microchip
y la salud del animal salen a la calle **sin que nadie haya decidido nada, y sin error**.

**Y hay un contraejemplo dentro de la misma función:** `contacto` **no** comparte el defecto,
porque su dato vive en la misma fila que su toggle ⇒ sin config no hay teléfono que mostrar.
**Fail-closed por construcción.** Es la forma que las otras dos deberían copiar.

**Opciones.** (a) invertir los tres `coalesce` a `false` · (b) FK con `ON DELETE RESTRICT` de
`pasaporte` a `pasaporte_config`, que vuelve el estado **inexpresable** · (c) dejarlo con esta
nota. **Voto: (b)** — la casa ya prefiere volver inexpresable antes que vigilar (L-439).

---

### E-4 · 🟢 CORREGIDA POR D — la elección no es «desde cuándo cachear», es «siempre o nunca»

**Lo que escribí primero:** *«cachear conviene desde el SEGUNDO turno de narrativa y en el
primero pierde»*. La aritmética era correcta **y la conclusión inducía a hacer algo peor que
las dos opciones reales.**

**Lo que D midió llevándola hasta el final, y verifiqué:** *«cachear desde el segundo»* es una
tercera estrategia **dominada** — empata en n=1 y en n=2 cuesta **$0,005805** contra los
**$0,003483** de siempre-cachear, porque paga la escritura un turno más tarde **sin haberse
ahorrado nada**. La elección real es **siempre** contra **nunca**: penalidad si n=1 **$0,000645**,
ahorro si n=2 **$0,001677** ⇒ **siempre-cachear conviene si más del 28 % de las conversaciones
tienen 2+ turnos de narrativa.**

**Y ese número no es del modelo: es sobre cómo hablan las familias**, y hoy no lo tiene nadie.
`ia_uso` ya guarda lo necesario para contarlo cuando haya tráfico. D deja la perilla en `true`
y la cuenta escrita. **Nada que firmar: queda como medición pendiente de tráfico real.**

*La lección para mí: una aritmética correcta puede recomendar algo peor que las dos opciones
que compara, si la tercera opción que sugiere nunca estuvo sobre la mesa.*

---

### E-5 · ⚪ Lo que no pude medir por falta de aparato

**3G real** (lo estimé del tamaño y el RTT, y lo digo) y **los tres aparatos** de E5 del
sublote 1.3. No simulo dos teléfonos y los llamo tres aparatos. Cuando haya aparato, la
medición está escrita y toma minutos.

---

### E-6 · ☠️ RETIRADA DOS VECES — la premisa era canon viejo, y encima la palabra era mía

**Lo que escribí:** que «escalar a telemedicina» y «mostrarte tu veterinario» eran dos productos
en desacuerdo, y que la elección era **firma del founder**.

**🔴 Primer error — no medí la premisa.** Me apoyé en el canon (S68 firmó
`telemedicina · reservable=false` de plataforma) **sin preguntarle a la base**. Medido:
**`reservable=true · activo=true · 2 ofertas activas`.** *Casi le pido al founder que firme
sobre un mundo que no existe* — y si la firma salía, quedaba ratificando un `reservable=false`
que ya nadie cumple.

**🔴 Segundo error — sostuve el rojo por una palabra.** Con el system **exacto** (llamando al
constructor de la edge, no aproximándolo) se vio que el prompt dice **«¿Querés que te abra una
consulta con un veterinario ahora?»** y **jamás la palabra «telemedicina»**. O sea que **la
función estaba y sólo faltaba el nombre del catálogo** — y la edge hace bien: *«telemedicina» es
jerga nuestra; una familia entiende «una consulta con un veterinario ahora».* **Mi cláusula le
pedía a un texto dirigido a familias que hablara como el catálogo interno.**

Ensanchada y declarada. `verify:coach-ley` **da VERDE por el camino exacto: las 8 cláusulas,
cada una donde debe vivir.**

**Queda UNA sola cosa para el founder, y es chica: el canon de S68 dice lo contrario de lo que
la base hace** (`reservable=false` contra `true` con 2 ofertas). No es una decisión — es una
línea que corregir. *Se deja escrita porque un dato del canon se lee igual que uno medido y
trae su autoridad, y ningún gate lo caza.*

---

### E-7 · 🟢 CERRADA — era omisión, no espera del abogado, y D la curó

Pregunté antes de llamarlo olvido y **era omisión**. La distinción que D hizo al medirlo vale más
que el hallazgo: él tenía `aviso_ia: true` para que **la pantalla** lo dijera en el primer turno,
y mandó el texto legal a D-405. **Eso cubre el primer turno y nada más.** Si a mitad de
conversación preguntan *«¿sos una persona? ¿vos atendiste a Thor?»*, **nada en el system hacía
que contestara honestamente.** Son dos cosas y había una.

Y la cláusula nueva **no es el texto legal** —eso sigue siendo del abogado (D-405)—: es honestidad
de la casa. `verify:coach-ley` **da VERDE contra el SHA nuevo: las 8 cláusulas están.**

*El ciclo completo en una noche: el gate se escribió antes que la superficie, corrió contra ella
el mismo día, dio cuatro rojos —dos míos, que curé; dos reales, que curó D— y ahora está verde.*

## ---


## C · noche del lote 2 — cuatro anotaciones, todas medidas

### ① 🔴 EL BRIEF DEL 2.2 SE APOYA EN UNA PREMISA FALSA — `extract-documento` no es eso

El brief dice: *«extract-documento ya existe: fotos o PDF de exámenes, recetas e
informes → eventos tipados con adjunto»*.

**Medido en su fuente** (`supabase/functions/extract-documento/index.ts`, 206
líneas): devuelve `{nombre, numero_documento, tipo_documento}` con
`tipo_documento ∈ {CEDULA, PASAPORTE, RUC}`, y su propia cabecera dice para qué
nació: *«el alta del repartidor se pre-llena de una foto del documento»*.

⇒ **Es un lector de documentos de identidad DE PERSONAS**, no de papeles
clínicos de mascotas. *Comparten el nombre y nada más.* Ni PDF, ni exámenes, ni
adjuntos, ni eventos de mascota.

**Por qué importa antes de empezar:** D tiene asignado *«prompt v2 con el
contrato del carnet»* sobre esta función. **No es un v2: es una función nueva**,
y presupuestarla como enmienda de algo que existe es la clase de error que ya
nos costó una tanda (el portal admin de S95-F: *«el portal existe y no sirve
para esto»*).

**Voto de la pista:** que el 2.2 la trate como **construcción nueva** —con el
molde de `extract-vacuna`, que sí es su clase— y que **`extract-documento` no se
toque**: su consumidor es el alta del repartidor, y cambiarle el contrato para
otra cosa rompería eso.

### ② `extract-documento` está desplegada y SIN UN SOLO LLAMADOR en el monorepo

`grep` sobre `apps/` y `packages/`: **cero**. Y **no tiene wrapper en la puerta
única**. O su consumidor vive fuera de este repo (el portal legado), o quedó
huérfana. *Precedente exacto: `chat-ayuda` — desplegada, facturable, sin fuente
en el repo (D-717), y se borró.*

**Voto:** censarla antes de tocarla. **No propongo borrarla**: el alta del
repartidor puede estar llamándola desde otro lado, y eso no se mide desde acá.

### ③ ⚠️ RIESGO LATENTE DEL 2.0, para B y para mí — la Hoja se abre en memorial

Medido en `apps/cliente/src/app/(tabs)/_layout.tsx:275`: en memorial **la
presencia SÍ se monta**, en su variante `PresenciaSinCoach` — *«la puerta a lo
que te espera no se le quita a nadie; lo que se apaga es el Coach»* (D-1021).

⇒ **Si la caja de texto de Nexo vive en la Hoja compartida, va a aparecer en
memorial** — y el objetivo del lote 2 dice, textual, «apagado en memorial».

*No es un defecto hoy: la caja no existe. Es el rojo que va a nacer el día que
se agregue, si nadie lo mira antes.* Lo escribo ahora porque **después va a
parecer obvio y nadie va a acordarse de que había dos variantes de la misma
Hoja**.

**Voto:** la caja se declara **por variante**, no por Hoja — que la que no lleva
Coach tampoco pueda llevarla, por tipo, no por cuidado.

### ④ C está bloqueada en sus TRES frentes, y no invento trabajo para llenarla

| frente | lo que me toca | qué falta |
|---|---|---|
| **2.0** | cablear la Hoja, deep links, memoria, búsqueda desde el Hogar | las RPC de A, la Hoja de B, la edge de D — **nada en `main`** |
| **1.3 pasaporte** | la pantalla y sus acciones | `emitirPasaporte` / `marcarPerdida` / `configurarPasaporte` (A) y `TarjetaPasaporte` / `PlacaQR` (B) — **cero ocurrencias en los índices** |
| **2.2 bóveda** | la pantalla «Traer papeles» | la puerta de A, y ① de arriba |

**Lo único de mi lista que NO dependía de nadie ya está hecho y verificado:
«memorial apagado»** — `verify:nexo` lo cubre (*la presencia no lleva Coach, el
hogar entero da «ninguna»*), y la caja, cuando llegue, vivirá dentro de esa
misma decisión (③).

*Declaro el bloqueo en vez de fabricar entregas: una pista que inventa trabajo
para no reportar vacío es una pista que después hay que revisar dos veces.*

## C · 1.3 pasaporte — dos para A, medidos

### ⑤ 🔴 LA PÁGINA PÚBLICA SALE EN `text/plain` — el QR muestra código fuente

Medido con `curl`, **en las dos rutas**:

```
GET …/functions/v1/pasaporte?t=<token>   → HTTP 200 · content-type: text/plain
GET …/functions/v1/pasaporte/<token>     → HTTP 200 · content-type: text/plain
```

La edge **declara `'text/html; charset=utf-8'`** en sus dos salidas de página
(`pasaporte/index.ts:60` y `:196`) y aun así lo que llega es texto plano ⇒ **el
navegador no la renderiza**: se ve el `<!doctype html>…` crudo.

*Y es exactamente la página que la propia cabecera de A describe: «la abre
alguien que no tiene la app, no tiene cuenta y no va a crear una: está en la
calle con un animal que no conoce, con una mano ocupada».*

**Hipótesis, declarada como hipótesis y no medida:** el gateway de Functions
sobrescribe el `Content-Type` en respuestas anónimas. **El hecho sí está
medido**; la causa la tiene que confirmar quien pueda mirar el gateway.

### ⑥ La puerta del pasaporte la abrí yo — enmienda aditiva 76(d)

El motor entró a `main` con las cinco RPC y **sin wrapper**. Escribí
`packages/api/src/wrappers/pasaporte.ts` con el molde de la casa, **sin tocar
nada de A** y sin agregar comportamiento: cada función es su RPC. Firmas de
`pg_proc`, códigos de error de los `RAISE` del cuerpo.

**Si A prefiere otra forma, se reemplaza entero.** Lo que no se podía era dejar
el motor sin puerta y la noche parada.

⚠️ Regeneré `database.types.ts` (`gen:types`): los tipos no conocían las RPC
nuevas y sin eso no compilaba nada. Es artefacto derivado del esquema, no una
decisión.

### ⑦ La descarga del QR abre la imagen, no la guarda en la galería

El brief dice: *«guarda la PlacaQR en la galería (con el permiso que ya exista
para fotos; **si no existe, pedilo a la mesa antes de agregar nada nativo**)»*.

**Medido: no existe permiso de escritura a galería en la app.** Así que la
acción **entrega el archivo por el navegador** (la URL del PNG del servidor) en
vez de guardarlo. *Funciona y no agrega nada nativo* — pero no es lo que el
brief pidió, y la diferencia se nota en el teléfono.

**Voto:** dejarlo así hasta que la mesa decida el permiso. Guardar en galería
es una dependencia nativa y **una dependencia nueva no viaja por OTA**.

## ## B · el gate de gates YA EXISTE, y me cazó a mí (S113-B, 2.0)

**Lo que iba a escribir acá estaba mal, y lo corrige el objeto.** Iba a
proponer que el corredor de gates enumerara los `verify:*` y saliera 2 si
alguno no existe. **Ya está construido**: `verify:gates-existen` frenó mi
propio commit por nombrar **el gate del pasaporte, que vive en la rama del
lote 1.3 y todavía no está en `main`** —acá no lo escribo por su nombre, que
es justo lo que el gate prohíbe— con el argumento exacto: *«un gate nombrado y ausente no da rojo: NO
CORRE; su silencio se lee como salud, y esa lectura la hace el que confía en
el canon»*.

**Lo que sí queda descubierto, y es angosto:** el gate protege **el canon**
(las menciones en docs), no **la consola**. Corrido a mano, `pnpm -s` sobre un
script que no existe **sale 0 y no imprime nada** — así que una batería
corrida a mano puede leerse como siete verdes cuando uno de los siete no
existe. Me pasó esta noche con el gate del pasaporte.

**Opciones.** (a) nada: el gate del canon alcanza, porque lo que se publica
pasa por ahí · (b) que el parte declare **contra qué rama** corrió cada gate,
que no cuesta código · (c) un corredor único que enumere los gates
esperados y falle si falta uno.

**Mi voto: (b).** (a) deja el hueco de la lectura a mano y (c) duplica lo que
el gate de gates ya hace. Y (b) además cubre un caso que ninguna de las
otras dos ve: **un gate que existe pero está midiendo otra rama** — que es
el caso real de esta noche, no una hipótesis.

**Dueño:** convención de partes (mesa). **No me frena**: lo declaro en cada
parte mientras tanto.

## # S113 · lo que espera al founder

Nadie se frenó por ninguno de estos. Cada uno dice **qué**, **por qué es del
founder**, **las opciones** y **el voto de la pista** — para que decidir sea
leer un párrafo, no reconstruir el problema.

---


## C · 2.0 ① y ② — dos pedidos, medidos

### ⑧ 🔴 `InvitacionBio` NO EXISTE en ninguna rama de B

Medido: `packages/ui/src/index.ts` de `b-1.2.1`, `b-1.3` y `b-2.0` — **cero
ocurrencias**, y ningún archivo con ese nombre. El mandato la da por hecha.
**Nada que montar.** Pedido a B por nombre.

**Y le mido las cuatro entradas para que llegue con destino, no en blanco:**

| entrada | puerta de familia | estado |
|---|---|---|
| rasgos | `registrarBitacoraFamilia` | ✓ existe |
| recuerdo | `registrarRecuerdoFamilia` | ✓ existe |
| **comportamiento** | — | 🔴 **no existe** |
| **temas médicos** | — | 🔴 **no existe** |

⚠️ Lo de «temas médicos» merece su matiz: existen `declararSinAlergiasConocidas`
y `registrarEntendimientoAlergia`. **Ninguna de las dos declara una alergia.**
*Decir que no hay ninguna, y entender una que ya está, no es declararla* — y
usar cualquiera de ellas para eso escribiría un hecho clínico por la puerta de
otro.

⇒ **Cuando la pieza llegue, dos entradas se dibujan y dos no** (la ley de B para
`CeldasHoy` ya es la correcta: *sin destino no se dibuja como botón*).

### ⑨ PIDO A A, por nombre — dos puertas de familia

1. **Observación de comportamiento.** El tipo de evento existe
   (`observacion_comportamiento`, lo mapeé en el 1.1 a «recuerdos»), y **no hay
   puerta de familia** para escribirlo.
2. **Declarar una alergia o una condición.** Hoy la familia puede decir que **no
   tiene** alergias y puede **entender** una ya declarada, pero no puede
   declarar la que su vet le dijo por teléfono.

*Las dos son entradas de `InvitacionBio`, así que sin ellas la pieza nace con la
mitad de sus caminos apagados.*

---

## C · ⑩ 🔴 `InvitacionBio` Y SUS TRES PUERTAS: EL MANDATO LAS NOMBRA, NO EXISTEN

El mandato pide montarla con `registrarObservacionComportamiento`,
`declararAlergiaFamilia` y `declararCondicionFamilia`. **Medido ahora, contra el
objeto y no contra mi memoria de hace dos horas:**

| qué | dónde busqué | resultado |
|---|---|---|
| las tres funciones | `pg_proc` (la base) | **cero** |
| las tres | `packages/api` en `main`, `a-2.0 @ d79cb597`, `a-2.1 @ d4918410` | **cero** |
| `InvitacionBio` | `packages/ui` en `main` y `b-2.0 @ b3ef42a0` | **cero** |

**Nada que montar.** Las dos que sí existen —`registrarBitacoraFamilia` y
`registrarRecuerdoFamilia`— ya las tenía medidas.

⚠️ **Es la tercera vez en esta sesión que un mandato da por hecha una pieza que
no está** (`extract-documento` con otro alcance, `InvitacionBio` la primera vez,
y ahora sus tres puertas). *No es un reproche: es un patrón, y sale barato
decirlo — la pista que lo recibe pierde una hora buscando algo que nadie
construyó, y la que lo escribió no se entera.* **Voto: que el mandato marque qué
existe y qué hay que pedir**, como hizo A en su parte para C, que decía
explícitamente «lo que NO existe y no lo pidas».

## ## S113-D · lote 2.0 (edge `coach`)

**1 · El texto del aviso de IA — para el abogado, no para mí.**
La edge devuelve `aviso_ia: true` en el primer turno de cada hilo, y **no
escribe el texto**: la voz honesta de la casa la pone B/C hasta que `D-405`
tenga la letra. *Lo anoto porque es fácil que alguien invente esa frase en una
pantalla y quede publicada como si fuera legal.*

**2 · El orden router↔plantillas: hay una variante MÁS BARATA que no tomé.**
El brief manda router primero. Medido: una pregunta de dato paga hoy
**$0,000524** (el router). Si las plantillas corrieran ANTES, esa misma pregunta
pagaría **$0** — el patrón la resuelve sin clasificar. *Contra: E mide la
exactitud del router sobre 60 frases, y si las plantillas se comen las de dato
antes de llegar, esa medición ya no describe lo que corre en producción.*
**Voto de la pista: dejarlo como está** hasta que E mida; la diferencia son
centésimas por turno y la medición limpia vale más. Se reabre con su número.

**3 · `sujeto = 'acuario'`.** El contexto lo trae, la ley no lo nombra. Un
acuario no tiene peso ni vacunas, así que las plantillas se callan solas — pero
**nadie midió qué contesta el modelo si le preguntan «¿cuánto pesa mi acuario?»**.
No lo inventé en el prompt sin medirlo. Entra con el conjunto de E.

**4 · El techo de 800 tokens sale de aritmética, no de una corrida larga.**
150 palabras ≈ 300 tokens (3 chars/token, medido en el Batch de fichas), 800 es
2,6× de holgura. **Las cinco respuestas reales dieron 25–81 palabras**, muy por
debajo. Si alguna vez trunca, se sube con la medición al lado.


## 🔴 S113 · LA APP DEL CLIENTE NO ABRE POR DEEP LINK — medido por E, dueño: `packages/api`

**No es un overlay de dev: es `PantallaCaidaRaiz`.** Causa en
`packages/api/src/wrappers/adopcion-hilo-vivo.ts`: canal de **nombre fijo**
(`'mis-hilos'`) más `removeChannel` llamado con `void` ⇒ si el shell re-monta
antes de que termine, `channel()` devuelve el canal **ya suscrito** y el `.on()`
lanza.

Medido por E: **arranque limpio 0/6 · arranque con una segunda navegación 3/4 ·
volver atrás 0/3.**

⚠️ **«Una segunda navegación durante el arranque» es exactamente abrir la app
desde un QR** — o sea **el pasaporte y la placa que S113 acaba de agregar.**

Cura barata: `await removeChannel`, o nombre único por montaje (lo segundo lo
vuelve **inexpresable**). **No lo toco: no es mi territorio**, y lo levanto acá
porque es lo más grave que quedó sobre la mesa esta noche.


## 🟡 S113-D · la edge `coach` está desplegada y su fuente NO está en `main`

Vive sólo en `pista/s113-d-2.0`. Es la clase de `chat-ayuda` (**`D-717`**: una
function desplegada, facturable y **sin fuente en el repo**). No urge — la cura
es el merge, que es de A. Se anota **para que no lo descubra otro el día del
incidente.**

## 🔴 S113 · LA APP DEL CLIENTE NO ABRE POR DEEP LINK — **la evidencia vive en `E-8`**

**Acción:** curar `packages/api/src/wrappers/adopcion-hilo-vivo.ts` — canal de
nombre fijo + `removeChannel` con `void`. La cura que vuelve el estado
**inexpresable** es el nombre único por montaje. **Dueño: `packages/api`, no yo.**

⚠️ **Lo que hace que esto no pueda esperar:** *«una segunda navegación durante el
arranque»* **es abrir la app desde un QR** — o sea **la placa y el pasaporte que
S113 acaba de agregar.** Y no es un overlay de dev: es `PantallaCaidaRaiz`, la
app **no abre**.

**Entrada ÚNICA a propósito.** E lo midió y lo escribió como `E-8` con sus
números (limpio 0/6 · con segunda navegación 3/4 · volver atrás 0/3); **la
evidencia se lee ahí**. Esto es sólo el renglón de la acción. *Dos pendientes
sobre el mismo hecho es cómo se firma dos veces* — mismo trato que `E-6`.


## 🟡 S113-D · `R66` no mide lo que las EDGES devuelven — 9 mensajes en voseo, 5 edges

**Lo destapó `R66` mordiendo mi wrapper nuevo**, y al ir a curarlo se ve que la
regla mide `packages/api` y las apps **y no `supabase/functions/`**. Censo:

```
9 mensaje(s) en voseo, en 5 edge(s):
  · escribir-presencia · estructurar-nota-clinica
  · extract-documento  · extract-vacuna · sugerir-raza
```

**Importa porque una edge no sólo devuelve códigos: devuelve `mensaje`**, y hay
pantallas que lo pintan. La voz de la casa es **tuteo neutro desde S51** y ahí
adentro nadie la está mirando.

*Y mi caso muestra el modo de falla completo:* la voz del memorial de `coach`
—`«Podés mirarla cuando quieras»`, que la pantalla **sí** pinta— pasó todos mis
gates y sólo apareció cuando fui a curar el wrapper. **Las mías ya están en
tuteo** (las 7 de `coach` y `extract-papel`, más la del memorial).

**No extiendo `R66` yo: `lib-voz.mjs` es instrumento de C.** La cura es de una
línea (sumar `supabase/functions/**` al corpus) y hace falta decidir si las 9
entran como baseline o se curan — por eso va a la mesa y no lo hago solo.

---

## C · ⑬ Los chips de «comportamiento» — medido: **el catálogo que hace falta no existe**

El founder pide que Comportamiento **no sea una caja** sino los chips que la
casa ya tiene, «más un texto que los acompaña». Medí los dos candidatos:

| candidato | qué es | ¿sirve? |
|---|---|---|
| `cat_conductas_bitacora` · **25 activos** | «Vomitó» · «Durmió tranquilo» · «Rompió algo en casa» | 🔴 **son hechos DEL DÍA, no rasgos** |
| `evento_temperamento_observacion` | tiene `rasgos` (jsonb) y `contexto` con `'casa'` | 🔴 **`rasgos` es libre: no hay catálogo** — y su escritura es del prestador (`prestador_id`, `empleado_id`) |

⇒ **De los 25 chips de bitácora, sólo dos rozan lo que se pide** (`miedo_ruidos`,
`convivio_bien`), y aun ésos están redactados en pasado del día —«Se asustó con
ruidos fuertes»— no como rasgo —«le tienen miedo a los ruidos»—. *Un chip que
dice qué pasó ayer no dice cómo es.*

**Pido a A un catálogo de rasgos de temperamento** con las cuatro familias que
el founder nombró: **miedos · manías · con otros animales · con niños**. Y una
puerta de familia que escriba rasgo + texto por el mismo camino que hoy usa
`registrarObservacionComportamiento`.

*No los invento del lado del cliente*: un vocabulario cerrado escrito en la app
es el que después nadie puede consultar desde el motor ni desde Nexo.

### ✅ Lo que sí quedó hecho de esa misma firma

**Recuerdo abre `/recuerdo`**, la pantalla que ya existe con **foto y texto** —no
una caja—. *Una caja de texto sería una segunda forma, peor, de hacer lo que la
casa ya hace bien; y la foto es media parte de un recuerdo.*

## C · se puede guardar una bitácora vacía (S113, cierre de fase 2)

Medido: `chips_de_bitacora` devuelve **cero** para las 8 bitácoras de Thor —
se guardaron **sin conductas marcadas y sin texto**. La línea de vida las
dibuja con su voz de fallback («Anotaste cómo estuvo») porque *no hay nada que
decir*, y el founder lo leyó como voz de motor. **No lo es: es una fila sin
contenido.**

**Decisión de producto:** ¿la puerta debe rebotar una bitácora sin nada, como
hace la Hoja de rasgos («Elige alguno o cuéntanos algo»)? Si sí, el guard va
en el motor (A), no en la pantalla — *una puerta que acepta el vacío deja
filas que después hay que explicar.*
