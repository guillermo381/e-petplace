# RECETA DE FORMA — LA FICHA DEL REPARTIDOR (L2)

**Estatuto:** Toque 1 de la Dirección de Diseño. **Va ANTES de que C
escriba.** No aprueba una pantalla: la pantalla se aprueba en la app.

**La vara que gobierna, firma del founder (verbatim):** *«no es poner
piezas por poner, cada cosa que hagamos debe tener un sentido… busquemos
crear las cosas bien. Que sea elegante, que sea eficiente, que sea seguro
y que se vea espectacular, luxury.»* ⇒ **FUNCIONA · SEGURO · EFICIENTE ·
ELEGANTE · ESPECTACULAR**, en ese orden. *El founder autorizó ir más
lento; esta receta gasta ese permiso en decidir antes, no en decorar
después.*

**Y la frase que ordena la anatomía entera:** *no es un formulario — es
la ficha de la persona que toca el timbre de una familia.*

---

## §1 · LO MEDIDO, antes de proponer nada

La ficha **no nace en tierra virgen**: el repartidor ya vive hoy como una
`Hoja` de alta dentro de `ventas/configuracion.tsx` (líneas 1074–1247).
Medido sobre esa fuente:

| Qué | Hoy | Qué implica para L2 |
|---|---|---|
| Forma | **`Hoja altura="media"`** con 12 controles en UNA columna plana | la ficha **deja de ser Hoja** (§3) |
| Fotos | **DOS bloques `FotoDelRepartidor` IDÉNTICOS** (documento · persona) | 🔴 **el defecto de forma más caro que hay ahí** (§4.1) |
| Teléfono | `ControlTelefono` **con** selector de indicativo | ⚠️ **es el campo que MUERE** |
| WhatsApp | `Campo` desnudo, `phone-pad`, **sin indicativo** | ⚠️ **es el campo que SOBREVIVE** — §4.2 |
| Documento | `keyboardType="number-pad"` **fijo**, con tipo CEDULA/PASAPORTE/RUC | 🔴 un pasaporte lleva letras (N12.2 roto hoy) |
| Placa | `autoCapitalize="characters"` y **nada más** | 🔴 cero máscara, cero validación (N12.1/N12.3) |
| Tope de vehículos | `repVehiculos.length < 2 &&` — la puerta ya deja de ofrecer | ✅ **N12.5 ya cumplida en la superficie**; su mitad dura es de A |

### 🔴 EL HALLAZGO QUE SE PIERDE SILENCIOSO SI NADIE LO ESCRIBE

La spec dice *«muere el teléfono convencional»*. **El campo que muere es
el ÚNICO que hoy tiene el selector de indicativo de país**, y el que
sobrevive es el que no lo tiene.

> **Al borrar el teléfono, el selector de país se MUEVE a WhatsApp — no
> se va con él.** Un borrado prolijo deja exactamente la pantalla que la
> firma prohíbe: un WhatsApp obligatorio sin indicativo, componiendo un
> E.164 que la fuente rebota.

*Nadie lo iba a ver: el diff de un borrado se lee como una resta.*

---

## §2 · LA ANATOMÍA — cómo se compone una PERSONA en esta casa

**La ley que se hereda, y no la invento acá:** el alta de mascota (lámina
firmada S91) dice *«se agrupa por lo que la persona ya tiene en la
cabeza, no por campo»*. Un repartidor se compone igual — y el
agrupamiento sale de una pregunta que ya tiene respuesta firmada:

> **¿Qué ve la familia del repartidor?** Firma del founder, punto 11 del
> PLAN: *«Estándar Rappi Uber, sí»* ⇒ **foto · nombre · vehículo ·
> placa.**

⇒ **Esos cuatro datos NO son cuatro campos del formulario: son LA
CABECERA de la ficha**, y el resto es lo que solo ve el vendedor.

```
┌─────────────────────────────────────────┐
│  ① LO QUE VE LA FAMILIA                 │   ← la cabecera ES el espejo
│     [foto grande]  Nombre               │
│                    Moto · AB 123 C      │
├─────────────────────────────────────────┤
│  ② CÓMO SE LO ALCANZA                   │
│     WhatsApp (con indicativo)           │
│     Correo — con este entra a la app    │
├─────────────────────────────────────────┤
│  ③ QUIÉN RESPONDE POR ÉL                │
│     Tipo + número de documento          │
│     [miniatura del documento]           │
├─────────────────────────────────────────┤
│  ④ CON QUÉ LLEGA                        │
│     fila vehículo 1                     │
│     fila vehículo 2                     │
│     + Agregar vehículo   (muere en 2)   │
├─────────────────────────────────────────┤
│  ⑤ SUS VIAJES        (derivado, lectura)│
└─────────────────────────────────────────┘
```

**Por qué la cabecera es el espejo y no una decoración:** es **N17
aplicada a una persona** — *un vendedor que administra su vitrina sobre
la vitrina no puede no saber cómo se ve*. Acá igual: **el vendedor da de
alta a alguien VIENDO la tarjeta que va a ver la familia**, y por eso
sabe —sin que nadie se lo explique— si esa foto sirve para reconocer a
quien toca el timbre. *Una foto contra un fondo negro se descubre en la
puerta de una casa, o se descubre acá.*

**Aire entre bloques: `spacing[8]` = 32 (N2).** Máximo **3 separadores**
en la pantalla (N3) ⇒ los bloques se separan por AIRE y por
`Texto variante="seccion"`, no por líneas.

---

## §3 · LA FICHA ES PANTALLA, NO HOJA — y el alta y la edición son LA MISMA

**Se sale de la `Hoja`, con dos razones y ninguna es de tamaño:**

1. **Una Hoja es para una DECISIÓN; una pantalla es para un SUJETO.** Lo
   que hay acá es una persona con identidad, papeles, vehículos e
   historia. El precedente de la casa es literal: el alta de mascota son
   **cuatro pantallas**, no una Hoja.
2. **La Hoja monta un `Modal` nativo** y su desmontaje se lleva el foco y
   el teclado — con 12 controles y dos capturas de cámara encima, es la
   superficie equivocada.

**Y una sola pantalla para las dos entradas** (`nuevo` y `[id]`), porque
D-791 lo dice con todas las letras: *«reconstruir la sección sin caminos
de edición sería reconstruir el defecto»*. Es la misma orden que el alta
de mascota ya cumplió: **MATA EL CLON — una pieza, dos entradas.**

**Lo que cambia entre las dos entradas es UNA cosa:** con `[id]`, ⑤
existe y la cabecera ya tiene cara. Nada más. *Si aparece un segundo
`if (esNuevo)`, el clon está volviendo por la ventana.*

---

## §4 · LAS SEIS DECISIONES DE FORMA

### 4.1 🔴 LAS DOS FOTOS NO SON LA MISMA COSA — y hoy pesan igual

Medido: dos bloques `FotoDelRepartidor` idénticos, uno debajo del otro.
**Son dos naturalezas distintas y por eso no pueden verse iguales:**

| | La foto de la PERSONA | La foto del DOCUMENTO |
|---|---|---|
| Qué es | **identidad** — la cara que ve la familia | **evidencia** — respalda un número |
| Dónde vive | **① la cabecera**, grande, presidiendo | **③**, al lado de su número |
| Cómo se ve | avatar grande | **miniatura** |
| Se abre entera | no hace falta | **sí, y por acto deliberado** (`VisorFoto`) |

**Y la asimetría tiene mitad de SEGURIDAD, que es la vara ②:** el
documento es dato de identidad de un tercero y vive en bucket privado.
**Mostrarlo a tamaño completo por default es exponerlo cada vez que
alguien abre la ficha en un mostrador con gente al lado.** Miniatura por
default no es una preferencia estética: es la dosis correcta de un dato
que solo hay que poder *verificar*, no *contemplar*.

**La captura entra por `HojaCaptura`** (la pieza de B) — es REEMPLAZAR,
no construir: el censo midió **8 de 10 puertas de foto sin cerrojo contra
el doble toque, y ésta es una de ellas**.

### 4.2 EL CONTACTO — un solo canal, sin disculpas

- **WhatsApp = `ControlTelefono`** (el par selector+campo con UN solo
  pie, porque lo que se valida es el E.164 que forman JUNTOS). **El
  selector se muda desde el teléfono que muere** (§1).
- **Muere la palabra «opcional»** — *si es el único canal, no es
  opcional*.
- **El correo pide sin justificarse.** La firma es explícita: el correo
  es **garantía del vendedor**, no problema del sistema ⇒ **cero camino
  de escape, cero ayuda para crearlo, MENOS superficie**. Su `ayuda` dice
  **para qué sirve**, jamás por qué lo necesitamos: *«Con este correo
  entra a la app.»* `keyboardType="email-address"` ·
  `autoCapitalize="none"` (N12.2).

### 4.3 EL VEHÍCULO COMO SUB-OBJETO — FILA, no tarjeta

**La ley de la casa decide sola:** *tarjetas para elegir, filas para
leer* (S97, Acto II de `Baldosa`). Un vehículo acá **se lee y se edita,
no se elige entre opciones** ⇒ **fila**.

Su anatomía: **tipo como palabra · placa en MONO · tocable para editar.**

- **La placa va en mono, y no es gusto:** es un código que **se dicta y
  se transcribe** — el mismo argumento con el que nació `CodigoAEscala`
  en S96. En sans se confunden `0/O` y `1/l/I`, y una placa mal leída es
  una moto que nadie encuentra.
- **«Agregar vehículo» al PIE de su lista** (gramática §3③) y
  **desaparece en 2** — la regla **jamás se escribe en pantalla** (N12.5).
- **⛔ CERO GLIFO DE VEHÍCULO EN v1, y es decisión, no olvido.** Un glifo
  nuevo exige §6b entero (hoja de contacto, 2-3 variantes, montaje a
  21px, gate POR ÍCONO del founder). **Pedir un dibujo firmado para decir
  una palabra de cinco letras es exactamente la economía que §6b
  prohíbe.** *(Y ojo con el vecino: el `moto` que está en gate es **marca
  de mapa** —`DIRECCION_ARTE` §6ter, otra clase, otra física—; no sirve
  acá y usarlo mezclaría dos idiomas.)*

### 4.4 N12 ENTERA — la máscara la manda el TIPO

**Nada de esto existe hoy.** El orden ya es correcto en el código (tipo
antes que placa): se conserva, porque **la máscara y lo que sigue SE
DERIVAN del tipo elegido** (N12.1).

| Tipo | Forma | Ejemplo del error |
|---|---|---|
| **Moto** | 2 letras + 3 números + 1 letra | *«Una placa de moto lleva 2 letras, 3 números y una letra — por ejemplo, AB 123 C.»* |
| **Carro** | 3 letras + 3–4 números | *«Una placa de carro lleva 3 letras y 3 o 4 números — por ejemplo, ABC 1234.»* |

- **Se valida AL SALIR del campo, jamás al enviar** (N12.3). *Un
  formulario que reprocha al final hace escribir dos veces.*
- **El error dice QUÉ y CÓMO, con ejemplo real** (N12.4). «Campo
  inválido» está prohibido en toda la casa — y **`verify:diseno` R44 lo
  caza** (baseline solo-baja: esta pantalla no puede sumarle uno).
- **El teclado del documento SE DERIVA del tipo** (N12.2): `number-pad`
  con cédula, **alfanumérico con pasaporte**. Hoy está fijo en numérico y
  un pasaporte no se puede tipear.

### 4.5 N13 — EL CAMPO QUE LLENÓ LA IA SE VE DISTINTO HASTA QUE ALGUIEN LO FIRMA

**La marca vive en `ayuda`, y la razón es N11:** el contorno del campo
tiene **exactamente tres estados** (reposo · foco · error) y su piso de
contraste está medido y gateado (R43). **Un cuarto color de borde para
«esto lo escribió la IA» rompería la ley que acabamos de firmar** —*dos
estilos de campo jamás conviven en la misma región*— y encima competiría
con el error, que es el estado que sí tiene que gritar.

⇒ El campo llega **lleno y con su línea de origen debajo**:
*«Leído del documento.»* · **la línea MUERE en cuanto la persona edita el
campo** (N13: la señal muere al tocar) ⇒ cero API nueva: es limpiar la
prop.

**Y el candado que ya rige, con su lección:** si la IA no pudo leer,
**el campo queda VACÍO y lo dice** — *«No se pudo leer. Escribilo.»*
JAMÁS un número plausible (L-139). *Un número de cédula verosímil y
equivocado es peor que un vacío: el vacío se llena, el equivocado se
firma.*

### 4.6 LOS VIAJES — derivados, y sin ranking

Al pie, de lectura, **voz narrativa + un número** (N18): *«12 entregas
este mes.»* **JAMÁS** posición, percentil ni comparación entre personas —
la completitud y el desempeño son de alguien **contra sí mismo**.

**Con cero viajes la sección NO desaparece: dice la verdad serena** —
*«Todavía no hizo entregas.»* Un repartidor recién creado tiene cero y
eso no es una falla; **una sección ausente se lee como un dato que falta**.

---

## §5 · LA REFERENCIA DE INDUSTRIA, y el corte

**Uber / DiDi — el alta de conductor, sección «Vehículo».** Es la
referencia exacta porque resuelve **este** problema y no uno parecido: un
sub-objeto (el vehículo) que cuelga de una persona, con su tipo primero y
su placa enmascarada después.

- **LO QUE SE TOMA:** ① el vehículo como **objeto con fila propia** en
  vez de dos campos sueltos · ② **la máscara derivada del tipo** · ③ **la
  foto del documento como propuesta editable**, jamás como verdad.
- **LO QUE NO SE TOMA, y con su razón:** su **máquina de estados de
  aprobación de documentos** (pendiente/en revisión/aprobado). **Nosotros
  no tenemos flujo de aprobación para el documento del repartidor** —
  dibujar tres estados que nadie verifica sería una pantalla mintiendo
  sobre un proceso inexistente. Y su **barra de progreso del onboarding**:
  `MODELO_LOYALTY` §2 la prohíbe con todas las letras.

*Se copia el principio, jamás el widget.*

---

## §6 · LAS CINCO VARAS, contestadas una por una

| Vara | Qué la cumple acá |
|---|---|
| **FUNCIONA** | el alta **y la edición** en la misma pantalla (§3) — hoy solo hay alta |
| **SEGURO** | el documento es **evidencia en miniatura**, no un póster (§4.1); la foto va a bucket privado como PATH |
| **EFICIENTE** | persona · vehículos · viajes en **lecturas PARALELAS, jamás encadenadas** (N16.1) · **`Esqueleto`, el spinner muere** (N16.2) · la foto con **medidas explícitas** para que la pantalla no salte al cargar (N16.3) |
| **ELEGANTE** | la cabecera dice quién es antes que qué datos tiene; el aire (N2/N3) hace el trabajo que hoy hacen doce cajas apiladas |
| **ESPECTACULAR** | **la cabecera-espejo**: el vendedor ve la tarjeta de la familia mientras la crea. Es el único gesto de la pantalla que nadie va a esperar — y es gratis, porque esa tarjeta hay que dibujarla igual |

**⚠️ Lo que NINGUNA de estas varas puede firmar: el ojo.** Los
instrumentos dicen que la anatomía cierra; **ninguno dice si la ficha se
siente la de una persona o la de un registro**. Esa evaluación es del
founder y va al gate con su pregunta concreta:

> *Mirando la cabecera: ¿reconocerías a quien va a tocar el timbre?*

---

## §7 · DEUDA DE PIEZA QUE ESTA RECETA DESTAPA (declarada, no ejecutada)

**`ControlTelefono` tiene CUATRO consumidores y vive en
`apps/prestador/src/components/perfil-piezas.tsx`** — medido:
`cuenta/perfil.tsx` (×2), `ventas/configuracion.tsx`, `alta/PasoEquipo.tsx`.
La ficha del repartidor sería el quinto.

La Regla de las Piezas de esta casa promueve **en el segundo consumidor**;
éste es el quinto. **Su lugar es `packages/ui`.** No bloquea a C —hoy
funciona donde está— y **el movimiento es mío, no suyo**: queda declarado
para la mesa, con su número medido, para que no lo descubra el sexto.

---

# §D · LA GRAMÁTICA DE BLOQUE, Y DÓNDE ENTRA ESTA FICHA (S99-B)

**El pedido del founder, verbatim:** *«configuración todavía no tiene la
vista completa, donde muestre el repartidor con toda su ficha. Falta
simplemente que le pongamos la ficha al repartidor.»*

**Y su guarda, que es lo que hace difícil el pedido:** tiene que
resolverse **DENTRO** de la gramática de configuración, no como
excepción — *si el repartidor se muestra con ficha y los cortes con
fila, la pantalla vuelve a tener dos gramáticas.*

## D1 · 🔴 LO MEDIDO PRIMERO: LA FILA YA EXISTE. LO QUE FALTA ES LA PUERTA

`ventas/configuracion.tsx:918-936` — el repartidor **ya se dibuja**, y se
dibuja bien encuadrado:

```tsx
<Tarjeta relleno="ninguno">
  {pantalla.repartidores.map((rep, i) => (
    <View key={rep.repartidor_id}>
      {i > 0 && <Separador />}
      <Celda titulo={rep.nombre}
             metadataMono={rep.documento}
             fin={<Interruptor … />} />   // ← sin onPress
```

> **No hay `onPress`.** ⇒ **la fila no lleva a ningún lado, y por eso la
> ficha «no está»: no es que falte una FORMA, falta un DESTINO.**

*Y eso resuelve la guarda del founder sin negociar nada:* **la gramática
de configuración es UNA —filas dentro de tarjetas— y la ficha es lo que
hay DETRÁS de una fila, no otra forma dentro de la misma pantalla.** Un
repartidor desplegado en bloque al lado de cortes en fila sería
exactamente la pantalla de dos gramáticas que él vino a prohibir.

## D2 · LA LEY, en una línea

> ## **EN CONFIGURACIÓN TODO SE LISTA EN FILAS. EL BLOQUE NO ES UN ÍTEM DE LA LISTA: ES LA PANTALLA A LA QUE LA FILA LLEVA.**
>
> La lista muestra **lo que alcanza para reconocer y decidir**; la ficha
> muestra **todo lo demás**. *Una pantalla no cambia de gramática porque
> un dato sea más rico: cambia de PISO.*

**Su prueba, y por qué no es una preferencia:** el corte y el turno
tampoco «caben» enteros en su fila —tienen días, cupos, ventanas— y sin
embargo nadie propuso desplegarlos en bloque. **El repartidor no es
distinto por ser una persona: es distinto porque su ficha todavía no
existe.**

## D3 · LO QUE ESTO CONVIERTE EN CAMINO (y ya estaba firmado)

Las dos curas de §B eran, sin que se viera, **las dos mitades de esta
puerta**:

| firmado en §B | lo que hace acá |
|---|---|
| **B2** — la fila entera es tocable y **lo dice con chevron** (19.7) | **es la puerta**. Sin chevron, el destino existe y nadie lo encuentra: el único afordance visible seguiría siendo el interruptor |
| **B3** — la fila dice **nombre · vehículo · placa**; el documento **se muda a la ficha** | **es lo que hace que la ficha tenga sentido**: la fila se queda con lo que sirve para reconocer, la ficha recibe lo que sirve para verificar |

⇒ **La ficha no agrega una gramática: completa la que B2 y B3 dejaron a
medias.** *El documento que hoy va en `metadataMono` no «sobra» en la
fila — está esperando el piso que todavía no existía.*

## D4 · LA FICHA, QUÉ MUESTRA

La anatomía entera es §A de este mismo documento (la persona, sus dos
fotos de naturaleza distinta, el vehículo como fila con placa en mono,
N12 y N13). Lo único que §D agrega es **su encuadre**:

- **Es pantalla, no Hoja.** Una Hoja es para decidir algo y volver; esto
  es para **mirar y verificar**, y tiene más contenido que altura de
  hoja. *Además la Hoja ya está ocupada por el alta.*
- **Techo `navegacion` con el NOMBRE de la persona** — es la variante que
  ya exige su título (medido: `titulo` es requerido en `Navegacion`), y
  el nombre es el nombre de la pantalla.
- **El interruptor de activo NO se muda: se DUPLICA.** Queda en la fila
  (decidir sin entrar) y aparece en la ficha (decidir mirando). *No es
  redundancia: son dos momentos distintos, y sacarlo de la fila obligaría
  a entrar para apagar a alguien.*
- **El WhatsApp vive acá, a un toque**, como ya declaró §B3.

## D5 · LO QUE NO DECIDE

1. **La ruta.** Es de C.
2. **Si la ficha permite EDITAR o solo mirar** — hoy la edición vive en
   el alta; abrir edición desde la ficha es decisión de producto.
3. **El ojo**, con su pregunta: *entrando desde la fila, ¿la ficha se
   siente la misma pantalla un piso adentro, o se siente otra app?*

---

# 🔴 ⏪ ENMIENDA A §D — MI PREMISA ERA FALSA, Y LA CAUSA NO ES LA QUE PARECE

**§D1 afirmó: *«no hay `onPress` ⇒ la fila no lleva a ningún lado»*.
Contra `origin/main` eso es FALSO.** C lo corrigió con medición, y
verificado por mí contra el objeto compartido —no contra su reporte—:

```
git show origin/main:…/ventas/configuracion.tsx
  → «🔴 S99-C · L2 — LA FILA ABRE LA FICHA. D-791 …»
```

**La fila abre la ficha, el interruptor sigue en `fin` y no se lo lleva el
tap** — y C además le puso al subtítulo lo que el motor ya sabía
(`repartidor_sin_cuenta`). *O sea que no solo existe el destino: la fila
dice más de lo que mi §B3 pedía.*

## La causa, y es peor que un número de línea envejecido

La mesa depositó la regla —*los números de línea de otra pista se
re-buscan por grep, jamás se usan tal cual*— y es correcta. **Pero mi
error no fue citar `:921`: fue que grepeé y ME DIO `:921` con el código
viejo adentro.**

Medido: `git merge-base --is-ancestor origin/main HEAD` → **NO**. *Mi
worktree está atrás de `main`.*

> ## **UN GREP EN TU PROPIO WORKTREE MIDE TU RAMA, NO EL PRODUCTO.**
> Con cuatro pistas en paralelo, mi árbol es una **foto vieja del
> territorio ajeno** — y no avisa: devuelve un número de línea, un
> fragmento de código y toda la apariencia de una medición.
>
> ⇒ **territorio propio se mide en el worktree; territorio ajeno se mide
> contra `origin/main`.** *Es la hermana exacta de L-217 («en origin» no
> es «en el canon»), del otro lado del espejo: acá lo que está en el
> canon no está en mi árbol, y leerlo igual da un falso NEGATIVO.*

## Qué sobrevive de §D y qué se cae

| | |
|---|---|
| **§D2, la ley** — *en configuración todo se lista en filas; el bloque no es un ítem de la lista, es la pantalla a la que la fila lleva* | ✅ **SOBREVIVE, y C la CONFIRMÓ sin haberla leído**: resolvió el pedido haciendo que la fila fuera una puerta, que es exactamente lo que la ley manda |
| **§D3** — B2 y B3 como las dos mitades de esa puerta | ✅ sobrevive; C las ejecutó |
| **§D1** — *«falta el destino»* | 🔴 **SE CAE.** El destino existe |

## ⇒ Y ENTONCES QUÉ FALTA DE VERDAD

Lo que el founder pidió y sigue sin estar: **VER EL ESTADO SIN ENTRAR.**

*Que la fila abra la ficha resuelve «quiero ver todo de esta persona». No
resuelve «quiero saber cómo está mi operación de un vistazo», que es otra
pregunta y se contesta en la lista, no adentro.* **Eso sí es la gramática
de bloque, y es lo único que queda de este frente.**
