# S116-B · LOTE 6 — los formularios: la etiqueta adentro y el aire entre campos

**Rama `pista/s116-b-05`.** Gates: `verify:diseno` VERDE (80) · `verify:contrast` **504 pares / 0** (eran 494) · `verify:catalogo-v5` VERDE (47) · `tsc` 0 en las cuatro.

---

## ① EL CHOQUE, declarado antes que nada — es la TERCERA vuelta de esta ley

| | |
|---|---|
| **N11** (S99-B) | la etiqueta ADENTRO |
| **N11′** (S100-B, **firma del founder**) | AFUERA Y ARRIBA, *«siempre visible y siempre del mismo tamaño»*, **con su evidencia escrita** |
| **N11″** (hoy) | adentro otra vez — **flotando** |

🔴 **No es una reversión a ciegas: contesta el argumento de N11′.** Aquél decía *«la etiqueta adentro tiene que ENCOGERSE PARA DEJAR ENTRAR EL VALOR, y pierde legibilidad justo cuando el campo está lleno»* — y su supuesto escondido es **que encogerse significa volverse ilegible**. Flotando cada uno tiene su renglón y el nombre del campo sigue a la vista, que es literalmente lo que N11′ quería proteger.

⚠️ **LO QUE N11′ DIJO Y ESTA ENMIENDA *NO* CONTESTA — los dos costos quedan vivos:**
1. **«En español el rótulo pesa el doble.»** Los tres del encargo son cortos y entran. **«Instrucciones de entrega» a 11 px sigue siendo una nota al pie**, y ese campo existe. *La pieza no lo puede resolver.*
2. **«El autofill tapa el interior de la caja.»** No lo medí. *Lo que sí se vio*: en la 03 el autofill llenó los dos campos y **la etiqueta quedó a la vista arriba** (📷 `lote6-03-con-texto.png`). Es una observación, no una medición del caso que N11′ temía.

✅ **Y LA REGLA RECTORA QUEDA INTACTA, sin tallarle una excepción.** *«Nada se mueve mientras alguien tipea»* — la etiqueta se mueve **AL ENFOCAR**, o sea ANTES del primer carácter. *Atarlo al primer carácter habría sido exactamente lo que la regla prohíbe, y la diferencia entre las dos formas no se ve leyendo: se ve tipeando.* ⚠️ **No se anima**: animar su tamaño es animar layout (Ley 6); el cambio viaja junto al del borde.

## ② EL GLIFO — lo decidió un censo, no una preferencia

🔴 **`iconoIzq` tiene CERO consumidores en las dos apps.** Ninguna pantalla pasa un glifo y el encargo dice *«sin que C toque pantallas»* ⇒ una prop nueva habría dibujado **nada**.

⚠️ **Se deriva de `autoComplete`, y eso NO es una heurística sobre el rótulo:** es **vocabulario estándar que el campo ya declara de sí mismo** — las tres pantallas lo pasan (`name` · `email` · `new-password`). **Cae a NADA cuando no puede decidir**: un genérico repetido en cinco campos no informa (Ley 12). `iconoIzq` gana sobre la derivación.

⚠️ Y una trampa que cazó el tsc: **`perfil` es un ALIAS del registry** (`Icono.tsx:603` → `cuenta`), no un `IconoNombre`. *A ojo los dos nombres parecen igual de válidos.*

## ③ EL AIRE — y el defecto NO estaba donde parecía

🔴 **Medido antes de tocar nada: 121 px = 40,3 dp** entre una caja y el rótulo siguiente.
⚠️ **Y el `gap` de las pantallas ya era 8** (`registro.tsx:228` · `login.tsx:269`), o sea **MENOS que los 10-12 pedidos**. *Si sólo se hubiera mirado el `gap`, la conclusión habría sido que ya estaba bien y el encargo habría quedado sin cura.*

Los 40 salían del **pie, que reservaba 25 dp siempre**. Tenía dos razones y **una murió con N11″**: garantizar ≥24 para que la etiqueta de afuera no se leyera como el pie del campo de arriba — *la razón se fue con la cosa que protegía*. ⇒ vacío reserva **4**, que con el `gap: 8` de las pantallas da **12 exactos**.

⚠️ **Lo que cuesta, y no se disimula:** al aparecer un error el campo **crece 21 dp y lo de abajo se corre**. Se acepta porque **un error aparece al ENVIAR, no mientras se tipea** — el mismo corte que deja flotar la etiqueta al enfocar. **Un campo con `ayuda` no salta nunca.**

## ④ LA MEDICIÓN, antes y después (emulador de 360 dp, densidad 3)

| | antes | después |
|---|---|---|
| paso entre campos | 301 px · **100,3 dp** | 179 px · **59,7 dp** |
| CTA «Crear mi cuenta» | y = 1849 | y = **1542** — sube 307 px |
| términos | **cortados en el borde de 2400** | completos, 2028–2118 |
| «Ya tengo cuenta» | **no entraba** | 2150–2302 |

**El CTA cierra en 1694 y la onda arranca en ~2015** ⇒ los tres campos y el CTA **entran sin que la onda tape nada**.

## ⑤ CONTRASTE Y LECTOR DE PANTALLA

**El par cambió de fondo y por eso se declara uno nuevo:** la etiqueta de N11′ se medía contra el LIENZO; flotando vive contra el **interior del campo**. *Dejar sólo el par viejo habría dado verde sobre un fondo que la etiqueta ya no pisa.* Medido, con el piso que la orden fija (tinta 65 % = `text.secondary`): **5,26 / 4,86 (claro) · 7,86 / 8,05 (oscuro) · 5,26 / 4,81 (memorial)**.

**El lector sigue anunciando el nombre**, verificado con `uiautomator dump`: el `EditText` conserva `content-desc="Tu nombre"`.
⚠️ **NULL declarado:** el rótulo visual aparece como un nodo más en el volcado, **igual que antes** (2 nodos por campo en las dos mediciones — no es algo que este lote introduzca). Le puse `accessible={false}` + `importantForAccessibility` en el nodo mismo tras medir que en el padre no alcanzaba; **si TalkBack lo lee dos veces no lo pude medir desde acá.**

## ⑥ LAS CAPTURAS
📷 `lote6-05-vacio.png` — los tres campos en reposo · `lote6-05-foco-y-texto.png` — campo 1 con foco y texto (etiqueta arriba) junto a dos en reposo · `lote6-03-con-foco.png` · `lote6-03-con-texto.png`.

## ⑦ AL BUZÓN
- **C** — el `placeholder` de los diccionarios **deja de dibujarse solo** en la casa v5; las llaves quedan sin consumidor y su retiro es una pasada de Ley 37 con su grep.
- **C** — los campos con `ayuda` no saltan; los que sólo tienen `error` **crecen 21 dp al enviar**. Si alguna pantalla no lo tolera, la salida es darle `ayuda` a ese campo, no volver a reservar el pie.
- **mesa** — el costo 1 de N11′ sigue vivo: **un rótulo largo flotado se lee chico**. No hay forma de resolverlo en la pieza.
