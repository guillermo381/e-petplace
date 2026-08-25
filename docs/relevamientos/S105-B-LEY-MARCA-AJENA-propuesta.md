# S105-B → MESA · LA LEY DE LA MARCA AJENA (propuesta para `DIRECCION_ARTE`)

> ## ⚠️ **ESTO NO RIGE. NO ESTÁ FIRMADO.**
> Es un texto propuesto por la pista B para que la mesa lo firme, lo enmiende o
> lo tire. **Hasta que el founder lo firme, la doctrina sigue viviendo donde
> vive hoy: en comentarios de una pieza de `apps/cliente`.**
>
> **Por qué se propone:** medido en S105-B, `DIRECCION_ARTE` **no tiene una sola
> ley sobre marcas de terceros** — sus quince secciones son todas sobre la marca
> propia. Y la casa ya vendorizó cinco marcas registradas (S101-D) y está por
> vendorizar la sexta. *La ley que gobierna el logo de Deuna hoy se sostiene en
> un comentario que nadie está obligado a leer.*
>
> **Molde:** §6ter (la marca de mapa), que es el precedente exacto — algo que no
> pertenece al set de la casa y por eso gana clase propia en vez de forzarse
> adentro.
>
> **Territorio:** `docs/` es de A. Por eso esto se deposita como propuesta en un
> archivo aparte y **no se edita `DIRECCION_ARTE`**. Si la mesa firma, la
> transposición es de A.
>
> **Numeral sugerido: §6sexies.** ⚠️ *Al medir para elegirlo apareció un
> defecto que no es mío y que declaro: el numeral `6ter` está usado por DOS
> secciones distintas* — el historial de la v1.6 lo asigna a «EL GLOW» y el
> cuerpo del documento (línea 556) lo asigna a «LA MARCA DE MAPA». **`6sexies`
> está inequívocamente libre.** El choque de `6ter` es de A.

---

## §6sexies · LA MARCA AJENA — CLASE APARTE

> **Estatuto: PROPUESTA (S105-B, 24-ago-2026). Sin firma.**
> **La regla madre del trazo NO se enmienda. Las leyes del ícono NO se tocan.**

**LA FRONTERA, en una línea: una marca ajena no es un glifo — es una CITA.**

Las leyes del ícono (§2, Ley 12: *objeto del oficio en trazo 1.9 + UNA huella
rellena*) gobiernan **lo que la casa dibuja**: piezas cuya forma, color, peso y
significado elegimos nosotros. **Una marca registrada de un tercero no cumple
ninguna de esas condiciones** — su forma la fijó otro, su color es su
propiedad, y **su significado es su identidad, no nuestra semántica.**

Cuando la app pinta el logo de Visa, de Mastercard o de Deuna **no está
diseñando: está citando**. Y una cita se reproduce, no se interpreta.

⇒ **Nace la clase «marca ajena», con sus cinco reglas:**

### ① NO SE REDIBUJA. NUNCA.

El archivo del proveedor es la fuente de verdad. **No se calca, no se
"limpia", no se adapta al trazo de la casa, no se le agrega huella.**
*Un logo redibujado a ojo no se lee como marca: se lee como error.*

Corolario que ya nos tocó: **un wordmark ajeno tipografiado con las fuentes de
la casa es un redibujo.** Es el uso que todo manual de marca prohíbe primero, y
es exactamente lo que la casa estuvo haciendo con Deuna hasta S105.

### ② VENDORED, JAMÁS HOTLINK

El archivo vive en el repo. **Tres razones, ninguna es preferencia:** un CDN
ajeno puede cambiar o borrar un archivo sin avisarnos · **pedir la imagen al
servidor del proveedor cada vez que se dibuja una fila le cuenta a un tercero
cuándo y cuánto abre la app cada familia** · y una superficie que depende de
una red externa muestra huecos justo cuando la familia está mirando su plata.

### ③ TODA MARCA VENDORIZADA DECLARA SU PROCEDENCIA

Fuente, URL original, quién la indicó, fecha, y **el hash del archivo**.
*Una marca registrada sin registro de dónde salió es un problema legal esperando
turno, y el que lo va a tener que contestar no va a ser quien la bajó.*

### ④ SE ESCALA CONTENIENDO, CON SU ASPECTO REAL

Medido del `viewBox` del vector o del **cuerpo** del raster —jamás del lienzo—,
y **sin redondear las dimensiones por separado**. *Deformar una marca registrada
no da error: se ve «casi bien», que es peor.*

### ⑤ 🔴 SOBRE LA MARCA AJENA MANDA SU MANUAL, NO NUESTRO MEDIDOR

Donde el manual del tercero y las leyes de la casa se contradigan —fondos,
tamaño mínimo, área de resguardo, color— **gana el manual del tercero.**

**Y esto incluye a WCAG, con un caso medido para que no se discuta cada vez:**
la lámina de usos de Deuna **aprueba su morado sobre su verde (2.45:1) y prohíbe
su blanco sobre su verde (4.77:1)** — aprueba la combinación de menor contraste
y prohíbe la de mayor. **No es un error de su manual: es que no mide lo mismo
que nosotros.** Su criterio es identidad; el nuestro es legibilidad.

**Un logo no es texto funcional**: no se lee, se reconoce. El dato que la
familia necesita leer —«Deuna», «Visa»— lo dice el **título de la fila**, que sí
es nuestro y sí cumple nuestras leyes de contraste.

#### 🔴 Y NO ES INFERENCIA NUESTRA — EL PROVEEDOR LO DICE ÉL MISMO

Preguntado por qué su lámina marca con asterisco la combinación morado+verde,
Deuna contestó (grupo de soporte, **25-ago-2026**) que esa combinación:

> *queda **sujeta a las necesidades del diseño**, exige **verificar la
> legibilidad** antes de aplicar, y **se recomienda no usarla en formatos
> pequeños o reducidos**.*

**Leelo dos veces: el manual delega en «verificar la legibilidad» y NO da un
número de contraste.** Un manual que midiera lo que mide WCAG habría contestado
con un ratio. **Contestó con un juicio y con una condición de tamaño** — porque
su criterio es **reconocimiento**, y el reconocimiento depende del tamaño y del
contexto, no de una razón de luminancias.

*Esta cita convierte la regla ⑤ de argumento en evidencia: no estamos
interpretando su manual, estamos citando su respuesta.*

⇒ **Corolario operativo:** el verificador de contraste de la casa **no evalúa
pares donde uno de los dos lados es una marca ajena**. Si hoy los evalúa, los
exime **declarando por qué**, no bajando un umbral.

---

## 🔴 ESTA CLASE NO SE INVENTA — SE NOMBRA. Y es lo que la hace barata.

**Medido, no argumentado:** las cinco marcas que la casa ya dibuja **ya cumplen
las cinco reglas**, desde antes de que esta sección se escribiera:

- `logo-franquicia.tsx` **ya** monta el SVG del proveedor sin redibujarlo, con
  la orden de mesa escrita en su cabecera.
- `assets/marcas/PROCEDENCIA.md` **ya** registra fuente, URLs, quién las indicó
  y fecha.
- La pieza **ya** escala conteniendo con el aspecto real de cada `viewBox`, y
  **ya** documenta por qué no redondea.
- El vendoring **ya** se eligió contra el hotlink, con las tres razones escritas.

*La casa venía usando esta física sin escribirla. Lo que se firma no es una
excepción nueva: es el nombre de lo que ya regía.* **Lo único que la ley agrega
es la regla ⑤ —que hoy no está escrita en ningún lado— y sacar las otras cuatro
de un comentario para ponerlas donde se buscan.**

---

## POR QUÉ NO SE ENSANCHÓ UNA LEY EXISTENTE (la salida descartada)

La otra salida era ensanchar la Ley 12 con una excepción para «logos de
terceros». **Se descartó por la misma razón que §6ter descartó la suya: la
condición no se acota sola.** «De terceros» incluiría el logo del negocio que
sube un prestador (`LogoNegocio`), el avatar de una clínica, el escudo de un
refugio — piezas que **sí** son contenido de usuario y **no** son marcas
registradas que estemos citando.

**Una regla que no puede decir dónde termina no es una regla.**

**La clase se acota sola, y por construcción: una marca ajena es una que
vendorizamos y registramos en un `PROCEDENCIA.md`.** Si no está en ese archivo,
no es marca ajena — es contenido, y le rigen las leyes de la casa. *Y los
archivos se cuentan.*

---

## LO QUE ESTA LEY NO DICE

- **No dice qué marca va en qué superficie.** Eso es producto.
- **No dice qué variante usar** (wordmark o isotipo) ni de qué tamaño: eso lo
  decide el ojo del founder contra el manual del tercero, caso por caso.
- **No autoriza vendorizar nada.** Vendorizar una marca registrada para usarla
  en producto es una decisión con costado legal y **la toma la mesa**, no una
  pista. Esta ley dice **cómo** se hace cuando ya se decidió que se hace.
