# S84 · ACTA DEL MÉTODO — BORRADOR (no cerrada)

> **Molde: el acta de S83.** Su compañera de censo (`…-s84-censo-de-enmiendas.md`)
> y la de estado (`…-s84-estado-medido.md`) se escriben aparte.
>
> **⚠️ BORRADOR: falta el último lote de C y su gate.** Lo que está acá es lo que
> ya ocurrió; lo que falte se suma, no se reescribe.
>
> **Esto NO es la lista de lo construido.** Es lo que produjo el resultado y lo
> que costó, destilado para que la sesión siguiente no lo re-descubra.

---

## 1 · LAS DOS ENMIENDAS DE MÉTODO, las dos con evidencia

### 1.1 LO NUEVO VIAJA DIRECTO A SU LUGAR *(firma founder, 2-ago)*

La **cláusula 1** de la regla 80 se reduce a su alcance real. **No se deroga: se
acota.** La ruta de verificación queda para **dos casos** — cuando **no está
claro qué va a ser** la pieza, o cuando **pone en riesgo algo que ya funciona**.

**El porqué del founder:** *una pieza NUEVA no puede romper lo que ya está bien,
así que aislarla solo cuesta dos pasos — y encima se ve peor: fuera de su
contexto no se nota cómo va a quedar.*

**Y el argumento que la cierra: el aislamiento no ahorraba nada.** *La galería
viaja en el OTA igual; el preview nunca fue más barato, solo más lejos.* La
cláusula se había escrito creyendo proteger un riesgo de despliegue **que no
existe**: lo que está en el bundle está en el bundle.

> **SU PRIMERA APLICACIÓN REAL FUE UN FRENO CORRECTO DE C** — la portada a
> sangre reemplazando un muro **ya gateado**. **Es el caso (2) de la enmienda
> funcionando el primer día:** la regla nueva no dice *"nunca aísles"*, dice
> *"aislá cuando haya algo que romper"*. **Y lo había.** *Una enmienda que
> estrena con su excepción vale más que una que estrena con su regla: prueba que
> la excepción es operable y no decorativa.*

**LO QUE NO CAMBIA, y se repite porque es lo que más se confunde:** la **cláusula
3 sigue viva entera** — *no se cablea hasta la firma en dispositivo*. **Que la
pieza viaje a su lugar no significa que llegue conectada.**

### 1.2 ☠️ LA LÁMINA MUERE ENTERA *(firma founder, S84)*

S83 la había matado **como instrumento de pantalla** y le había dejado un
último trabajo: **comparar variantes de un token barato** (el agua, el glow, la
huella). **S84 le retira también eso.**

**La razón, y es medida, no de gusto:** **la galería viaja en el OTA igual**, así
que la lámina **nunca fue más barata — solo más lejos**. Y el dato que lo cierra:
**el founder no llega a ella.**

> **UN INSTRUMENTO DE GATE AL QUE EL GATE NO LLEGA NO ES UN INSTRUMENTO.**

**Evidencia de la propia sesión:** las **cuatro variantes del destello** se
montaron en lámina (S84-B15) **y el founder no las reportó** — el destello sigue
en tinta y sin disparar. *La lámina hizo su trabajo y nadie la miró: exactamente
el modo de falla que la enmienda nombra.*

*(El destello no se firmó y **sigue esperando su gate**: eso no es un fallo de la
enmienda, es su prueba.)*

---

## 2 · LOS FRENOS — el hallazgo central de la sesión

**S84 fue una sesión de frenos.** Y su lección no es *"frenamos bien"*, sino algo
más incómodo:

> ### **LOS FRENOS SON EL INSTRUMENTO MÁS CARO DE AUDITAR.**
> Un dato viejo que dice **"sí"** se descubre al chocar.
> Uno que dice **"no se puede"** **no se descubre nunca**, porque **nadie
> verifica por qué algo NO se hizo**.
> **La cura no es frenar menos — es que todo freno declare CONTRA QUÉ MIDIÓ.**

### El conteo, con su criterio declarado

**⚠️ Antes del número, el criterio — porque sin él "once" es una opinión:** se
cuenta como **freno** el momento en que una pista **para antes de construir** y
trae el hallazgo, con o sin condición de freno explícita en la orden.

**Los de esta pista (A), censados uno por uno:**

| # | dónde | veredicto |
|---|---|---|
| 1 | la regla 28 cableada como guard (A1) | ✅ correcto — la migración salió de `migrations/` |
| 2 | la galería: bucket sin DELETE + pipeline no extensible (A2) | ✅ correcto — las dos condiciones se cumplían |
| 3 | `fotos_galeria` nombrada en dos migraciones (A4) | ✅ **correcto Y levantado**: el grep la encontraba, **el objeto vivo no** |
| 4 | (b) no se aplica — D-622 (A9b) | ❌ **EL ÚNICO FALSO** — ver abajo |
| 5 | los hechos casi vacíos sin el radio (A14 ①) | ✅ correcto — quedaba UNO |
| 6 | ¿se puede distinguir verificado? (A16) | ✅ correcto **y NO se cumplió**: sí se podía, con el predicado completo |
| 7 | `lat`/`lon` exactas en la vista pública (A18) | ✅ correcto — hueco vivo |
| 8 | el deep link sin App Links (A21) | ✅ correcto — el enlace cae a S85 |
| 9 | leer la vista para el id propio (A26) | ✅ correcto **y no bloqueó**: el borde existe (no-activo ⇒ NULL) y es la verdad |

**De B y C hubo más** —el freno de la portada a sangre, el del modo `alternativa`
(C18-2), los dos bloques de C8bis, y dos de B que **no dispararon por razón
medida** (B14, B16)—. **No los censé uno por uno: son de su territorio.** *Se
dice así en vez de sumar un total que no medí.*

> **⚠️ EL "ONCE" NO ERA UNA MEDICIÓN — lo declara la propia mesa (S84-A30):** era
> su número, no un censo. **Se le pidió el suyo a C y a B.** *Si llegan, el total
> del acta es medido; si no llegan, **el acta dice NUEVE —los censados— y lo
> declara**, en vez de heredar un número que nadie contó.* **Ésta es la línea que
> hay que actualizar al cerrar.**

### ⚠️ Y UN CASO GEMELO EN LA OTRA DIRECCIÓN: LA LISTA DE CIERRE

**Frase de B (S84), y va al acta por pedido de la mesa:**

> **UNA LISTA DE CIERRE QUE DICE "TODO ADENTRO" CUANDO FALTA ALGO ES EL DATO QUE
> DESPUÉS NADIE VUELVE A VERIFICAR.**

**El caso, y lo pagué yo:** el pedido de congelación del bundle de cierre decía
*"lo de B ya en main"*. **Era falso** — el glifo `documento` estaba afuera, cero
ocurrencias en el ancla. **Lo verificó B por contenido; yo lo había afirmado sin
medirlo.**

**Y es la contracara exacta del hallazgo de los frenos.** Los frenos dicen *"no
se puede"* y **nadie verifica por qué algo NO se hizo**. Una lista de cierre dice
*"está todo"* y **nadie vuelve a verificar un inventario que ya se dio por
completo**. *Las dos se archivan como resueltas — una como prudencia, la otra
como cierre— y las dos dejan de mirarse.*

**Lo que lo vuelve peor que un error de conteo:** un cierre es **el momento en
que la sesión deja de mirar**. Un ítem que se declaró adentro y no lo está **no
tiene una segunda oportunidad de ser notado**: la sesión siguiente lee el acta,
no el árbol.

*Es la candidata #17 aplicada a mi propio inventario: afirmé sin medir, y lo que
afirmé era justo lo que nadie iba a re-chequear.*

---

### 🔴 EL ÚNICO FALSO — y lo fabricó una verificación que funcionaba

**D-622.** Un cinturón preguntaba `count(*) WHERE whatsapp = '3208408790'` y
exigía `= 1`, con el mensaje ***"la fila sin indicativo FUE TOCADA"***.
**Verificaba la existencia de un valor; decía que verificaba un cambio.**

El founder curó esa fila desde la app —legítimo—, el literal dejó de existir, **el
guard saltó**, y su mensaje me hizo concluir que la migración había escrito ahí.
**Nunca la tocó.**

**Costo:** una ficha 🔴 contra una causa inexistente, un turno de forense, y **una
migración retirada de `migrations/` por miedo a un fantasma que fabricó el propio
guard**.

> **Y esto es lo que lo vuelve el caso más instructivo de la sesión: de todos los
> frenos, el único falso NO vino de medir de menos. Vino de un instrumento que
> FUNCIONÓ —dio rojo— y mintió sobre por qué.** *El rojo compra credibilidad:
> nadie audita un guard que acaba de saltar.*

**Cerró con medición, no con hipótesis:** cuando (b) corrió con la traza en tabla
real, la fila quedó `alcanzada=false` y `antes == después`. **El predicado nunca
la alcanzó, ni antes ni ahora.**

---

## 3 · LAS CANDIDATAS — y su eje común, que es lo que vale

S84 depositó **cuatro** (#18 · #19 · #20 · #21) sobre las tres de S83
(#15 · #16 · #17).

| # | qué mide mal | quién lo pagó |
|---|---|---|
| 15 | brazos de guard que no pueden salir rojos | B |
| 16 | el grep por la PROP mide quién la pasa, no qué se renderiza | B |
| 17 | razonar el efecto de un token no es medirlo | A + la mesa |
| 18 | `$?` después de un pipe no es el exit de tu comando | **A y B, el mismo día** |
| 19 | un instrumento correcto sobre un árbol viejo | B |
| 20 | una cadena que declara NUESTRO estado envejece sola | C |
| 21 | el mensaje de un guard es parte del guard | A |

> ### **TODAS PRODUCEN SALIDAS CREÍBLES. NINGUNA ROMPE UN BUILD.**
> Un `0` que es verdad de un árbol que ya no existe. Un `exit` vacío que se lee
> como éxito. Un guard que grita la causa equivocada. Un copy que fue cierto.
> **Ningún typecheck, ningún lint y ningún gate ve nada de esto** — porque todos
> están hechos para detectar lo que **falla**, y esto **funciona mal**.

**Y la que las ordena a todas es #21**, porque es la única en la que **el
instrumento funcionó** y aun así llevó a la conclusión falsa. Las otras seis son
instrumentos que miden mal; **ésta mide bien y cuenta mal.**

> **⚠️ HUECO DECLARADO — la candidata del BARRIDO CASE-SENSITIVE NO EXISTE.** La
> mesa la nombró en su lista al pedir esta acta, y **el grep en el archivo da
> cero**. *(**Resuelto S84-A30:** la mesa declara que la nombró sin verificar —
> es de C y se la pidió. **El hueco era de la lista, no del archivo.**)* **No la invento acá:** o la deposita quien la midió (parece de C), o se
> cae. *Es exactamente el caso de L-169 en S77 — una lección citada como
> existente que nunca se escribió—, y por eso se declara en vez de completarse.*

---

## 4 · LO QUE VERIFICAR UNA AUSENCIA ENSEÑÓ

Tres casos, y los tres del mismo eje:

**① `Marker` = 0 en `MapaZona`** (B). **El cero ES la verificación:** un pin en el
centro **anularía la ofuscación entera**, y lo haría *mostrando* justo el punto
que la vista dejó de servir.

**② `lat`/`lon` pasados a la ficha = 0** (C). **No alcanzaba con que las tres
`zona*` estuvieran: hacía falta que la sede NO llegara.** Si viajaran juntas, la
pantalla tendría el dato exacto disponible aunque pintara el círculo — y **todo lo
que llega al teléfono se puede leer**.

**③ Y SU CONTRACARA: D-625**, donde la ausencia era **accidental**. La ficha del
prestador no exponía coordenadas **porque la PIEZA no tenía esa prop**, no porque
alguien lo previera. **El diseño angosto tapó por accidente lo que la vista
exponía de más.**

> **LO QUE LOS TRES JUNTOS ENSEÑAN:** verificar que algo **NO está** es más
> difícil que verificar que está, **porque nada falla cuando sobra**. Y lo que
> separa a ① y ② de ③ es **quién puede repetirlas**: un `grep` que da cero **con
> su porqué escrito** es una defensa; el mismo cero **sin nadie que lo sostenga**
> es una coincidencia esperando que alguien agregue una prop.
>
> *Por eso D-625 se registró aunque no haya nada que arreglar: si no se nombra,
> la próxima vez alguien va a citar el accidente como si fuera un guard.*

---

## 5 · EL BUNDLE DE CIERRE — publicado

**group `e8409694-90b7-4f53-8e68-a830120cad60` · ancla `bef0897` ·
`isGitWorkingTreeDirty = None`.** Runtime 1.0.3.

**OCHO OTAs en S84, los ocho con ancla limpia.** *Ninguno salió con árbol sucio —
la veda con su paso ⓪ funcionó las ocho veces, y las tres pistas la sostuvieron.*

---

## 6 · LO QUE FALTA PARA CERRAR ESTA ACTA

- **El último lote de C y su gate.**
- El **censo de enmiendas** (`…-s84-censo-de-enmiendas.md`) y el **estado
  medido** (`…-s84-estado-medido.md`).
### ⏳ LA PASADA DEL FOUNDER — cuatro firmas pendientes

**El acta NO se cierra hasta esa pasada.** Lo que espera su firma sobre el bundle
`e8409694`:

| | |
|---|---|
| **el glifo `documento`** | dos candidatos, viajan **sin consumidor** para que haya qué elegir |
| **el acento** | |
| **el muro** | |
| **`documentos`** | la pantalla del eje ①, primera vez en dispositivo |

*Hasta esa pasada, lo construido en S84 está **publicado**, no **firmado** — y son
dos estados distintos (regla 84, el cuarto eslabón).*

### ⚠️ EL BURN-DOWN — decidido, no arrastrado

**La mesa decidió en S84: NO se mide acá.** Se declara por **tercera sesión
seguida**, con su agravante escrito y **con condición nueva** — porque la vieja
estaba redactada en la forma que la candidata de B señala como la que nunca se
cumple (*"cuando alguien mida"*), y no se cumplió tres veces.

**Lo que cambia: deja de ser un conteo a mano y nace como SCRIPT**
(`scripts/burn-down.mjs`), con **quién** (la pista A de S85) y **cuándo** (su
PRIMERA tarea, antes de cualquier orden de construcción). *Un conteo manual de 54
pantallas × 2 ejes compite contra construir y pierde siempre; un comando, no.*
**Ficha D-630**, y si S85 cierra sin él **no se re-declara: se escala.**
