# ENCARGO A B · ¿se puede vigilar que dos glifos vecinos no se parezcan?

> # ✅ CONTESTADO — B entregó el mismo día (`92f70183`, en `main`)
>
> **Respuesta: `docs/relevamientos/2026-08-27-s106b-RESPUESTA-colision-de-siluetas.md`**
> · **Instrumento: `scripts/medir-siluetas.mjs`** (2,5 s, con su guard probado
> en rojo).
>
> **Veredicto (b) — se puede a medias**, y la mitad que no se puede es
> **exactamente la pregunta ② de abajo**: *«convivir en una fila» no es
> derivable del JSX — se declara.*
>
> 🔴 **Y corrige un número de este encargo:** la vara **no es 0,306 sino
> `0,361`** — el par sano más alto de esa fila es **cámara·altavoz**, no
> micrófono·cámara. *Una vara tiene que ser el par sano MÁS ALTO: puesta en el
> segundo, marcaría como colisión un par que está bien.* El glifo enfermo daba
> **0,647**, así que **la separación es amplia con cualquiera de los dos — lo
> que se rompe es el umbral, no el diagnóstico.**
>
> ⚠️ **B lo entregó ANTES de leer este encargo.** Lo que sigue abajo se conserva
> como el planteo original, no como trabajo pendiente. *Un encargo cumplido que
> queda escrito como abierto manda a la próxima sesión a hacerlo dos veces.*


**De A · 27-ago-2026 · S106 tanda 3.**
🔴 **Es un pedido de MEDICIÓN, no una obra.** Puede que la respuesta sea que no
se puede — **y «no se puede» también se deposita, con su razón.**

---

## Por qué existe este pedido

El defecto de «girar cámara» **no era un control ausente: era una colisión de
silueta entre dos glifos vecinos.** Y lo que lo vuelve un caso de método es
cómo se buscó:

> **Cuatro pistas midieron CINCO veces que el control estaba montado, y las
> cinco veces tenían razón.** El literal del path en `main` ✓ · el literal en el
> bundle del APK ✓ · la prop obligatoria ✓ · el render sin condicional ✓ · las
> claves de voz en las dos apps ✓.

**Ninguna podía verlo**, porque **ninguna medición estática mira si dos glifos
se parecen entre sí**. Cada instrumento contestó bien la pregunta que sabía
hacer; la pregunta que faltaba no la sabía hacer ninguno.

*El founder lo vio en dos segundos mirando la pantalla. Es el mismo patrón que
`R68` y que el criterio de C —«una pieza entregada y una montada son dos hechos
distintos»—: los tres son lo que los gates de la casa no pueden ver.*

**Vos lo mediste con superposición de tinta: 64,7 % contra el vecino.** Eso es
exactamente lo que convierte esto en pedido: **ya existe un número**, y un
número que se puede calcular una vez a veces se puede calcular siempre.

---

## Lo que se pide medir

**¿Se puede vigilar automáticamente que dos glifos que conviven en una misma
fila no se parezcan por encima de un umbral?**

No hace falta que la respuesta sea sí. Hace falta que sea **medida**. Las
preguntas que la componen, y cada una puede matar la idea sola:

1. **¿Se pueden extraer las siluetas desde el código?** Los glifos viven como
   `<Path d="…">` dentro de las piezas. *Rasterizar un path arbitrario sin
   montar React es el primer muro, y si no se puede pasar, se dice y se
   termina.*
2. **¿Qué es «convivir en una fila»?** El defecto vivía entre dos controles del
   mismo `<View>`. **Ese conjunto hay que poder derivarlo del código**, y puede
   que no sea derivable — *un guard que compara todos los glifos contra todos
   mide algo que a nadie le importa: dos íconos que nunca se ven juntos pueden
   parecerse todo lo que quieran.*
3. **¿El 64,7 % es un umbral o es un dato?** Un número solo no es una vara.
   *Hace falta saber cuánto dan los pares que están BIEN* — si los sanos dan
   60 %, el umbral no existe y la regla nace decorativa (`L-192`).
4. **¿Cuánto cuesta correrlo?** Si tarda como `verify-edge-deno`, no puede vivir
   en el hook de pre-commit y hay que decir dónde sí.

---

## Cómo se cierra este encargo

**Con un depósito, gane o pierda.** Tres salidas y las tres son entrega:

- **(a) Se puede** ⇒ la regla nace, con su número, su umbral medido contra
  pares sanos, y su auto-prueba. *El número lo tomás vos: R68 fue tuya.*
- **(b) Se puede a medias** ⇒ qué mitad, y qué queda para el ojo. *Una regla que
  declara lo que NO mira vale más que una que calla* — como `R67` con la
  tipografía.
- **(c) No se puede** ⇒ **cuál de las cuatro preguntas lo mata, con su
  medición.** *Un «no se puede» medido evita que la próxima sesión gaste una
  tarde en lo mismo; uno supuesto no evita nada.*

⚠️ **Y si es (c), el hallazgo no se pierde igual:** queda que la casa tiene una
clase de defecto —**parecido visual entre piezas vecinas**— que **sólo el ojo
del founder puede cazar**, y eso es información de proceso, no un fracaso.
