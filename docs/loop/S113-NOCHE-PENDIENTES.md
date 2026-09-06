# S113 · noche — lo que espera al founder

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

---

### E-8 · 🔴 La raíz del cliente no abre cuando la app se abre por un deep link

**Qué.** `PantallaCaidaRaiz` —la pantalla de caída **del producto**, no un overlay de dev— con
`cannot add postgres_changes callbacks for realtime:mis-hilos after subscribe()`.
**Cuando ocurre, la app no abre.**

**Medido, con discriminador:** arranque limpio **0 de 6** · arranque **con una segunda
navegación durante el arranque 3 de 4** · entrar a un perfil y volver **0 de 3**.

**Causa, leída del código:** `adopcion-hilo-vivo.ts` crea el canal con **nombre fijo**
(`'mis-hilos'`) y `supabase-js` devuelve el canal existente si ya hay uno. La limpieza está
bien escrita, pero **`removeChannel` es asíncrono y se llama con `void`**: si el shell re-monta
antes de que termine, `channel()` devuelve el canal **ya suscrito** y el `.on()` lanza.

**Por qué no espera a mañana.** *«Una segunda navegación durante el arranque» es exactamente lo
que hace abrir la app desde un QR* — y **el pasaporte con deep link y la placa con activación
por escaneo nacieron esta misma sesión.** La superficie que estrena el disparo es la más nueva
que hay.

**Opciones.** (a) `await` en el `removeChannel` · (b) nombre de canal **único por montaje**, que
vuelve el estado **inexpresable** · (c) dejarlo. **Voto: (b)** — la casa prefiere lo
inexpresable a lo vigilado (L-439), y (a) sigue dependiendo de que nadie vuelva a poner el
`void`. **No es decisión de founder: es una cura de dos líneas con dueño en `packages/api`.**
Se anota acá para que no se pierda entre dos pistas.

---

### E-9 · 🟡 Dos pesos verdaderos de la misma mascota en la misma pantalla, y preside el peor

**Qué.** En el perfil de Thor: encabezado **`11.4 kg`**, campo Peso **`24 kg · 04 sept 2026`**.
Medido: `peso_clinico_kg = 11.4` del **21-jul** y `peso_reportado_kg = 24` del **4-sep**
(`bascula_casa`). **Los dos son ciertos.**

**El problema.** El encabezado **no dice cuál de los dos es ni de cuándo**, **gana en jerarquía**
—va bajo el nombre, en grande— y es **el más viejo por mes y medio**. *Un bulldog inglés adulto
de 11,4 kg es la mitad de lo normal: el número que preside es el que más se parece a un error.*

**Y no es sólo cosmético: es de qué habla Nexo.** Si el contexto destilado toma el clínico, el
asistente va a decir «Thor pesa 11,4 kg» cuando la familia anotó 24 anteayer. *Pierde la
credibilidad entera en una frase, y la recupera nunca.*

**Opciones.** (a) el encabezado muestra **el más reciente de los dos**, con su fecha ·
(b) muestra el clínico y **lo dice** («11,4 kg · medido en la clínica, 21 jul») ·
(c) no muestra peso en el encabezado. **Voto: (a) con su fecha** — la familia quiere saber
cuánto pesa hoy, y el que lo sabe es el que midió último. **Pero es firma**, porque elegir entre
«lo que dijo el vet» y «lo que dijo la familia» es una decisión de producto, no de UI.
