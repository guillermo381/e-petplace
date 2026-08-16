# RECETA DE FORMA — EL ESTADO EN EL ESPEJO (receta 7 de 7)

**Estatuto:** Toque 1, sobre el contrato de C (§XII de su parte), anclado
a datos que **ya viajan**: `estado` · `motivo_rechazo` · `oferta_estado`
· `razonesDeAlcance`. **Cero motor nuevo.**

**Con ésta, las siete recetas de L5b quedan completas.**

---

## §1 · 🔴 LOS CINCO ESTADOS NO SON CINCO DE LA MISMA CLASE — y la frontera ya estaba trazada

C listó cinco: *publicado · en revisión de e-PetPlace · rechazado · sin
precio · con precio sin publicar*. **Puestos como cinco chips iguales, la
pantalla le enseña al vendedor que las cinco cosas son la misma. No lo
son:**

| | **VEREDICTO de e-PetPlace** | **HUECO del vendedor** |
|---|---|---|
| cuáles | en revisión · **rechazado** | sin precio · con precio sin publicar |
| quién lo resuelve | **nosotros** | **él** |
| ¿tiene paso? | **NO** — solo esperar | **SÍ, uno** |
| ¿entra al contador? | **JAMÁS** | **SÍ** |

> **La frontera no la inventé: la trazó el contador.** *«el contador es
> SOLO lo suyo; lo de e-PetPlace viaja con su dueño dicho y jamás suma»*.
> ⇒ **si el contador ya distingue, la forma tiene que distinguir igual** —
> si no, el vendedor ve cinco cosas parejas y un contador que solo cuenta
> dos, y esa incoherencia se lee como que el contador está roto.

**Y el quinto —`publicado`— no es ninguna de las dos: ⛔ NO SE DIBUJA.**
Es el estado normal, y la casa ya tiene esa ley escrita en este mismo
lote: *cero huecos no dibuja nada*. **El premio por estar publicado es
que la app deje de hablar del tema.**

---

## §2 · LA FORMA, por clase

### ① VEREDICTO — se informa, no se empuja

- **En revisión:** línea neutra, **con el dueño dicho** —
  *«e-PetPlace lo está revisando.»* Sin CTA, **sin contador, sin
  progreso**. *Un «faltan 2 días» que no podemos cumplir es peor que no
  decir nada.*
- **Rechazado:** **la ÚNICA que usa `danger`** en toda la ficha, y
  **`motivo_rechazo` va LITERAL, jamás parafraseado.**

> **Parafrasear un rechazo es reescribir lo que decidió otro.** Si el
> motivo dice *«la foto no muestra el producto»*, eso es lo que se
> muestra — una versión «más amable» le saca al vendedor la única
> información con la que puede arreglarlo.

  Y por ser el único `danger`: **el rojo tiene que seguir significando
  «esto está mal y es tuyo»**. Un `en revisión` en rojo enseñaría que
  esperar es un error.

### ② HUECO — se cuenta y tiene UN paso

**Voz de N18: narrativa + un paso.** *«No aparece en búsqueda porque no
tiene precio.»* Nada de `sin_precio` como etiqueta, nada de chip.

**Y va donde N18 ya mandó** (`…-RECETAS-ADELANTADAS-L5b.md` §3): en la
ficha, el hueco de **ese** producto; en la vitrina, **una línea**, la del
hueco más grande.

---

## §3 · EL ÚNICO CASO EN QUE EL ESPEJO HABLA EN MODO CLIENTE

**El contrato:** un producto no publicado **NO APARECE** en «Ver como
cliente», **y el espejo lo explica ahí mismo** — *sin esa frase, «no
está» se leería como «se perdió»*.

**LA FORMA, y cada decisión cuida la fidelidad del espejo:**

- **AL PIE de la grilla, después de todo** — jamás una tarjeta fantasma
  ni un hueco en la grilla. **Una familia nunca vería un placeholder**, y
  el espejo deja de ser espejo en el momento en que inventa una casilla.
- **CON SU NÚMERO** — *«3 de tus productos no se ven acá: no están
  publicados.»* Sin número, «no está» no dice **cuánto** falta, y el
  vendedor no sabe si es un descuido o media tienda.
- **Visualmente marcada como VOZ DEL ESPEJO**, no como contenido: fondo
  del sistema, ancho completo, fuera del ritmo de la grilla. *Tiene que
  ser imposible confundirla con algo que la familia ve — que es
  exactamente lo que el modo entero existe para enseñar.*
- **Y CON CERO no publicados, la línea NO EXISTE.** Misma ley. *En modo
  cliente, el silencio del espejo es la señal de que estás viendo lo que
  ve la familia — y esa es la única forma de que ese modo sirva.*

---

## §4 · LA REGLA QUE GOBIERNA LAS TRES SUPERFICIES DEL LOTE

Escrita una vez, porque ya apareció tres veces en L5b:

> ## **CERO HUECOS NO DIBUJA NADA.**
> Ni «todo completo», ni un ✅, ni una barra llena.

Rige en: la completitud de la vitrina · el contador de la ficha · **y la
línea del espejo en modo cliente**. *Felicitar por lo normal es la
mecánica que `MODELO_LOYALTY` §2 prohíbe, y además entrena a ignorar: si
la app habla cuando todo está bien, hablar deja de significar algo.*

---

## §5 · LO QUE ESTA RECETA **NO** DECIDE

1. **Los literales.** La voz de cada estado se escribe en el riel y va al
   lote de strings del founder. Acá está **la forma y la clase**, no el
   texto final.
2. **Qué motivos de rechazo existen** — es del proceso de curaduría, no
   de la forma. La forma solo exige que **lleguen literales**.
3. **El ojo**, con su pregunta para el gate:

> *En «Ver como cliente», con un producto sin publicar: ¿te queda claro
> que la familia NO lo ve, sin que parezca que la app lo perdió?*
