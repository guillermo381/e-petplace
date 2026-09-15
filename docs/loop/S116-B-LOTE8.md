# S116-B · LOTE 8 — `CampoFecha` adentro, `CampoCodigo` exento, y los 26 clasificados

**Rama `pista/s116-b-05`.** Gates: `verify:etiqueta-dentro` VERDE con **④ en 0** · `verify:diseno` VERDE (80) · `verify:contrast` 504/0 · `verify:catalogo-v5` VERDE (49) · `tsc` 0 en las cuatro.

**La ley ya está depositada** y el gate se refundó en ella: `DIRECCION_DISENO_S99` §N11″ (`pista/s116-a-08` @ `abab9ad8`). *El gate había nacido citando el lote 6 porque ese día la letra no estaba en ninguno de los tres lugares medidos; hoy cuelga de donde tiene que colgar.*

---

## ① UN CHOQUE ABIERTO CON LA LETRA — declarado, no resuelto por mí

N11″ hereda de N11′ la cláusula **«≥24 px entre un campo y el siguiente»**… y **la orden del lote 6 fue bajar ese aire a 10-12**, que es lo que construí y medí (12 exactos, 40,3 dp → 12).

*La cláusula conserva el número pero perdió su razón*: existía **para que la etiqueta de AFUERA no se leyera como el pie del campo de arriba**, y con N11″ ya no hay etiqueta afuera. **Rige lo ordenado y medido; la letra necesita la enmienda.** → buzón de A. *Dos letras firmadas que se contradicen son peores que una equivocada.*

## ② `CampoFecha` — la mitad que faltaba

La ley entró en `Campo` y esta pieza se quedó afuera, así que **convivían en seis pantallas**. Ahora flota igual.

⏪ **Y la razón que S100 había escrito acá se DA VUELTA, no se tira:** decía que *«la caja de una fecha muestra un valor LARGO, así que era justo donde el rótulo encogido peor se leía»*. **Flotando, el valor largo deja de compartir renglón con el rótulo** — *el caso que peor se llevaba con N11 es el que más gana con N11″.*

🔴 **Flota con valor *o* con la hoja abierta.** En `Campo` el disparo es el foco; acá no hay foco —es un botón— y su equivalente es la hoja abierta. ✅ Y lo que S99 escribió sigue en pie: **la etiqueta vive dentro del `Pressable`**, así que tocar el rótulo abre el selector.

**`EtiquetaFlotante` nace al aparecer el SEGUNDO consumidor, no antes.** *Dos inline que coinciden hoy coinciden por copia.*

## ③ 🔴 UN DEFECTO QUE LA CAPTURA DESTAPÓ, Y ERA DEL LOTE 6

**La caja del producto de `antiparasitario` salía VACÍA — sin rótulo y sin campo.** Y sólo pasaba **cuando el campo no tiene glifo** (sin `autoComplete` ni `secure`).

**Causa medida:** la columna que el lote 6 creó para alojar etiqueta y valor es `flex: 1` + `justifyContent: 'center'`, y **sin el disco de 32 a la izquierda la fila no tiene ningún hijo con alto propio**: la columna se centra sobre cero y el input no se dibuja.

⚠️ **Aislado en dos corridas, y mi primera hipótesis era la equivocada:** con `minWidth: 0` solo, el input seguía sin dibujarse. *El `minWidth` es el reflejo de flexbox que uno escribe de memoria; lo que faltaba era el alto.*

⚠️ **Y antes de eso perdí dos mediciones con instrumentos mal usados, que vale anotar:** `grep -c` sobre el XML del volcado cuenta **líneas**, y el volcado es **una sola línea** — me dio «1 EditText» en una pantalla que tenía 3, y casi concluyo que `Campo` estaba roto en todos lados. *El instrumento decía un número perfectamente creíble.*

## ④ `CampoCodigo` — excepción declarada, y es la tercera vez que cambia de estatus

> **Ocho casillas de un dígito no tienen dónde poner una etiqueta flotante; su rótulo vive arriba del grupo.**

🔴 **Flotar significa subir al borde superior DE LA CAJA, y acá hay ocho: ¿en cuál flota?** El rótulo no es de una caja: es del GRUPO. *La ley se escribió para un control con un cuerpo; éste tiene ocho.*

⏪ **S99 la escribió como excepción · N11′ la celebró como «la excepción de ayer es la norma de hoy» · N11″ la vuelve excepción.** **La forma nunca cambió; lo que cambió tres veces es si era la norma.** *Por eso ahora está firmada y no heredada: una excepción que sobrevive por inercia es indistinguible de un olvido.* Escrita en la pieza y en `PIEZAS_EXENTAS` del gate, que **imprime las exentas en cada corrida**.

## ⑤ EL GATE, corregido — y el defecto era mío

**La regla ④ estaba atada al NOMBRE de la pieza.** Al curar `CampoFecha` **siguió contando 6, porque seguía llamándose igual** — *una regla atada a un nombre da un número que dejó de significar lo que dice.* Lo cacé porque **el founder había predicho el número («la regla ④ baja a 0») y no bajó.**

⚠️ **Y el discriminador se corrigió DOS veces más:** *«renderiza `<EtiquetaDeCampo`»* marcaba a las dos piezas curadas —porque las dos la siguen renderizando **para el prestador**—, y *«el archivo menciona `formaV5`»* tampoco, porque `CampoCodigo` lo menciona **para otra cosa**. ⇒ **lo que decide es si ESA LÍNEA lleva el guard de casa.** Ahora la lista se deriva de la fuente y **una pieza nueva con la etiqueta suelta aparece sin que nadie la liste** (rojo probado).

## ⑥ LOS 26 PLACEHOLDERS, clasificados — **26 → 16**

**El corte es el de la letra:** `etiquetaVisible={false}` es la exención de búsqueda, *«el único lugar donde el placeholder sobrevive»*.

**① EXENCIÓN (4) — no bajan nunca, y eso mueve el piso del trinquete a 4, no a 0:**
`despensa/index.tsx:1094` · `buscar.tsx:150` · `nexo.tsx:581` · `postventa/motivo.tsx:351` †

**② EJEMPLO en PIEZAS (10) — CURADOS por B en este lote:**
`alta/PasoDatosBasicos.tsx:252, 301` · `chips-rasgos.tsx:129` · `habitantes-acuario-hoja.tsx:229` · `registrar-medicacion-hoja.tsx:82, 88` · `registrar-peso-hoja.tsx:84` · `seccion-facturacion.tsx:249, 263` · `selector-de-raza.tsx:119`

**③ EJEMPLO en PANTALLAS (12) — buzón para C, con archivo y línea:**

| archivo:línea | llave |
|---|---|
| `app/(tabs)/cuenta/familia.tsx:306` | `cuenta.familiaNombrePlaceholder` |
| `app/(tabs)/despensa/checkout.tsx:1912` | **literal** `"+593 99 123 4567"` |
| `app/(tabs)/despensa/reclamo.tsx:225` | `despensa.reclamoCodigoPlaceholder` |
| `app/(tabs)/hogar/bitacora.tsx:436` | `adiestramiento.bitacoraFiltroPlaceholder` ‡ |
| `app/(tabs)/hogar/bitacora.tsx:463` | `adiestramiento.bitacoraTextoPlaceholder` |
| `app/(tabs)/hogar/mascota/despedida.tsx:122` | `despedida.palabrasPlaceholder` |
| `app/antiparasitario.tsx:207` | `antiparasitario.productoPlaceholder` |
| `app/carnet.tsx:640` | `carnet.fechaPlaceholder` |
| `app/login.tsx:272` | `login.emailPlaceholder` |
| `app/recuerdo.tsx:217` | `recuerdo.textoPlaceholder` |
| `app/registro.tsx:231` | `registro.nombrePlaceholder` |
| `app/registro.tsx:240` | `registro.emailPlaceholder` |

† ⚠️ **`postventa/motivo.tsx` queda exento por casualidad, y se dice:** tiene `etiquetaVisible={false}` **pero no es una búsqueda — es un `multilinea={5}` para un relato.** *Mi regla usa `etiquetaVisible={false}` como proxy de «búsqueda», y este campo apagó su etiqueta por otra razón.* **Ese campo debería llevar la etiqueta flotando, no apagada.**
‡ **`bitacora:436` es un FILTRO con etiqueta visible**, así que su placeholder muere por la regla. Si C quiere darle la exención completa, es apagar la etiqueta y poner la lupa — decisión suya.

**Llaves huérfanas tras la cura de B:** 8 de las 10 quedan sin ningún consumidor (`pesoPlaceholder` · `contaMasEjemplo` · `habitantesOtraPlaceholder` · `cualPlaceholder` · `dosisPlaceholder` · `pesoHojaPlaceholder` · `nombreFormato` · `razaPlaceholder`). `nombrePlaceholder` **sigue viva** por `registro.tsx:231`. Su retiro es una pasada de Ley 37 sobre `es.ts`/`en.ts` con su espejo — **no la hago acá para no tocar el diccionario de C en el mismo commit.**

## ⑦ AL BUZÓN
- **A** — **la cláusula «≥24 px» de N11″ choca con el aire de 12 que el founder ordenó y B midió.** La letra necesita la enmienda; el número heredado perdió su razón.
- **A** — N11″ dice *«no hay gate que lo vigile todavía»*: **ya lo hay** (`verify:etiqueta-dentro`, lote 7, cuatro reglas con su rojo).
- **C** — los 12 placeholders de pantalla (tabla arriba) + los dos casos de borde († y ‡).
- **C** — las 8 llaves huérfanas del diccionario.
