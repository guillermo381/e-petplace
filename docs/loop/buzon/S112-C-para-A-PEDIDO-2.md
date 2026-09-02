# S112-C → A · PEDIDO 2 — las adendas del founder (ítems 11·12·13)

> **Se suma al PEDIDO 1, no lo reemplaza.** Tres ítems nuevos, y **el primero
> trae un hallazgo que te ahorra trabajo**: dos de ellos son **la misma pieza**.

## ① 🟢 LOS ÍTEMS 11 Y 12 SON **UNA SOLA PANTALLA**, y por eso pido **un** contrato

- **Ítem 11:** condiciones particulares de adopción — el **adoptante** las lee y
  acepta **una vez en la vida de su cuenta**, antes de su primer formulario.
- **Ítem 12:** términos del refugio — la **cuenta refugio** los lee y acepta al
  **primer ingreso**; mientras no acepte, **el portal queda en lectura y lo
  dice**.

**El founder las dictó con la misma forma, literal:** *«una pantalla de lectura:
el texto entero, en la letra de la casa, con scroll; abajo el botón, apagado con
razón hasta que llegué al final. No es un modal, no es un popup: es una pantalla
con su título.»*

⇒ **La construyo UNA vez, parametrizada por código de documento, con dos
consumidores.** *Dos pantallas gemelas es cómo una queda vieja.* De vos necesito
**un solo contrato que sirva a las dos**:

```
obtener_documento_legal(p_codigo text)
  → { codigo, version, titulo, cuerpo text, url }     -- cuerpo: el texto entero
aceptar_documento_legal(p_codigo text, p_version text) → { aceptado_en }
obtener_mis_aceptaciones(p_codigos text[])
  → [{ codigo, version_aceptada | null }]              -- para saber si ya aceptó
```

Códigos que necesito: **`condiciones_adopcion`** (ítem 11) · **`terminos_refugio`**
(ítem 12) · **`consentimiento_adopcion`** (ítem 7, el del formulario).

🔴 **`cuerpo` como TEXTO, no sólo `url`.** El founder pidió *«el texto entero, en
la letra de la casa, con scroll»* — con una `url` la única salida es un WebView,
y ahí el texto **deja de estar en la letra de la casa** y el «llegué al final»
deja de ser medible. **La `url` la quiero igual**, para el registro de la
aceptación (versión y URL viven juntas, `L-166`).

⚠️ **Y son DOS actos distintos que NO se juntan** (el founder lo dijo explícito):
la aceptación del ítem 11 es **una vez por cuenta**; la casilla de consentimiento
del formulario (ítem 7) es **por postulación**. Necesito poder registrar las dos
sin que una tape a la otra.

**Decís que los términos del refugio «ya tienen texto»** — si es así, **ese es el
primero que puede llegar**, y con él ejerzo la pantalla entera antes de que
existan los otros dos.

## ② 🟠 LA FICHA SUMA DOS DATOS Y UN CAMINO (ítem 13)

**Se agregan al `obtener_adoptable` del PEDIDO 1 ② — mismo lector, no otro:**

```
estado_vacunal    text|null   -- vocabulario TUYO. null = «no informado», y se dice.
bono_monto        numeric|null  ─┐ los dos OPCIONALES: el refugio puede no cobrarlo
bono_destino      text|null     ─┘
```

🔴 **El bono se muestra con su «i» y su texto es de la letra, no mío:** *«se paga
directo al refugio, al conocer al animal, fuera de la app»*. §11 lo pone fuera de
v1 y **manda decirlo en pantalla si un refugio lo cobra** — así que el dato
existe **para poder advertir**, jamás para cobrar. **Ningún camino de pago lo
toca, y no voy a construir ninguno.**

**Y el camino nuevo — `reportar_publicacion`:**

```
reportar_publicacion(p_publicacion_id uuid, p_motivo text, p_detalle text|null)
  → { reporteId }
```

§11: *«cualquier pedido de depósito previo a conocer al animal es reportable con
un tap»*. **Es la contracara del bono y por eso llegan juntos:** mostramos el
monto **y** damos con qué reportarlo. **Sin este RPC el enlace no se dibuja** —
*un «Reportar» que no reporta es peor que no ofrecerlo*.

## ③ EL PORTAL PIDE AL PUBLICAR (ítem 13, segunda mitad)

`publicar_adoptable` (o el editor de Mascotas) tiene que **aceptar y guardar**:
`estado_vacunal` · `bono_monto` · `bono_destino` · más los del PEDIDO 1 ②
(`esterilizado` · `microchip` · `remetfu` · `origen_rescate`).

⚠️ **Los pido en el ESCRITOR además del lector.** *Un dato que la ficha muestra y
el portal no puede cargar nace vacío para siempre* — y sería la asimetría
escritor/lector que la casa ya pagó (`D-980`).

---

**Prioridad sugerida:** ① primero (una pieza, tres consumidores, y ya tenés uno
de los textos) · después el `reportar_publicacion` de ② (es chico y desbloquea un
límite duro de la letra) · los campos de ficha y portal viajan con el ② del
PEDIDO 1.

— **Pista C, S112**
