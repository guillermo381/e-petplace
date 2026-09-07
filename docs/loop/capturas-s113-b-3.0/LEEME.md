# Capturas S113-B · fase 3 — la bóveda (B1 · B3)

Metro en el puerto propio de B (**8092**), `Android Bundled 2825ms (2998 modules)`.

> ⚠️ **El emulador compartido se cayó a mitad del lote.** Quedaba sólo
> `emulator-5558` = **`s113_E`**, de E, y **no se tocó**: se relanzó
> `Pixel_10_Pro_XL` en su puerto. No existe un AVD `s113_B`.

## Lo que prueban, medido en el aparato y no mirado

**🔴 Un grupo vacío no se monta, NI CON SU RÓTULO.** La sonda le pasa
«Informes» con cero papeles y el volcado devuelve **0 ocurrencias** de la
palabra. *Un rótulo sobre nada le dice a la familia que ahí debería haber algo
y que se perdió.*

**⛔ En memorial «Traer papeles» desaparece y la lista queda.** Volcado en
memorial: **0 ocurrencias** del botón. *La lista es lo que queda, y es cuando
más se consulta; pedirle a alguien que vaya a buscar la historia clínica de
quien ya no está es no haber entendido dónde está parado.*

**🔴 El examen sale TRANSCRITO, y se ve:** Creatinina **2,1 mg/dL** con su
referencia **0,5–1,8** y la marca **«H»** del laboratorio — **sin un solo
color, sin flecha, sin semáforo**. Y no es que estén apagados: `ValorDePapel`
no tiene un `alto | bajo`, así que **no se pueden expresar**.

**🟢 Plaquetas sin referencia impresa** no dibuja el renglón de referencia, y
**Perfil renal sin origen** no dibuja el suyo (19.9: lo que no hay no se pinta).
*Escribir «origen desconocido» es escribir algo que el papel no dice.*

## El índice

| archivo | qué prueba |
|---|---|
| `01-boveda-claro` | la lista por grupos + la ficha de un examen |
| `02-boveda-oscuro` | lo mismo en oscuro |
| `03-boveda-memorial` | la lista entera, **sin** «Traer papeles» |


---

# B2 · B5 · y el turno doble de `documento`, resuelto

## 🔴 El aparato encontró un defecto MÍO, y su guard tampoco lo vio

`ActivarPlaca` dibujaba el glifo **`pasaporte`** en sus resultados. A 44 px,
**solo y sin etiqueta, son dos cuadraditos que no dicen nada** — que es
literalmente la condición de uso que su propia firma dejó escrita: *no se puede
montar solo.*

**Y lo atravesé yo mismo sin querer:** mi guard busca `nombre="pasaporte"` y yo
lo monté con `nombre={fase === 'ajena' ? 'info' : 'pasaporte'}`. *Un guard que
reconoce una sola forma de escribir lo mismo protege del descuido y no del
apuro, que es cuando hace falta.* **Lo mostró el emulador, no él.**

Curado en las dos mitades: el guard ahora mide `nombre={…}` entero —su rojo sale
con archivo y línea— y la pieza usa **`checkEnCirculo`**, que además es mejor:
*«ya estaba activada» LLEVA el check con razón, porque la placa está activa.*
El `ⓘ` queda para el único caso que es un error.

## Lo que prueban las capturas

**🟢 `04`/`06` — los tres estados, y sólo uno es error.** Dos checks y un `ⓘ`.
*«Ya estaba» no es un fallo: la placa funciona y la persona sólo repitió el
gesto; una pantalla roja ahí le diría que rompió algo.*

**🟢 `04` — el turno doble resuelto, a 21 y 44 px.** `documento` es una
credencial apaisada con su retrato; `papel` es una hoja con renglones. **Se
distinguen.** (Firma de la mesa, 7-sep-2026.)

**🔴 `05` — nada se guarda sin toque, medido por volcado:** con la tercera fila
sin unidad, **«Guardar» = 0 ocurrencias**, la razón = 1, y el pedido «la unidad»
= 1 en su fila. *Lo dudoso se marca con un filete, lo que falta se pide con su
nombre, y el botón no está apagado: no está.*

## ⚠️ Y una nota de método que casi me cuesta dos capturas falsas

Un `keyevent 4` me sacó de la sonda a la raíz de la app, que estaba sin red:
guardé dos PNG de la pantalla de error **con md5 distintos entre sí**. *El md5
prueba que la captura cambió, jamás que muestre lo que uno cree.* Lo que lo
cazó fue mirar, y después contar por volcado.
