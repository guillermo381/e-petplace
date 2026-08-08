# S91-D · PROPUESTA DE VOZ — EL HITO DEL ALTA

> **ESTO NO RIGE.** Es una propuesta para el gate de pantalla del founder.
> El motor de A la deja lista y **el hito no se emite hasta la firma**: la
> tabla `evento_hito_narrativo` está vacía, medido.
>
> Y el porqué de tanto cuidado con una frase: **es la única pieza del alta que
> no se deshace barato.** Todo lo demás se corrige editando el perfil; un hito
> mal escrito ya quedó en la vida de esa mascota, y en esta casa «corregir es
> AGREGAR» (D-544). Un hito equivocado no se borra: se le suma otro que lo
> explica, y eso es peor que no haberlo escrito.

---

## LO QUE YA ESTÁ FIRMADO Y NO SE TOCA

- **La frase base la escribió el founder** en la lámina: **«Una vida nueva
  empieza»**. Lo que sigue no la reemplaza — la modula.
- **La clave no es la voz.** El propio comentario de A lo deja escrito: *«la
  voz vive en i18n de la pantalla y la firma el founder por gate»*. Las dos
  claves de motor son `vida_nueva_empieza` y `mundo_nuevo_empieza`.
- **`MODELO_LOYALTY` §2/§3:** ni score, ni barra, ni checklist, ni «primer
  paso completado». Un hito CELEBRA; jamás mide.

---

## ① EL HITO DEL INDIVIDUO — `vida_nueva_empieza`

**Voz base (la de la lámina, sin tocar):**

> **Una vida nueva empieza**

**Y la propuesta: que el ORIGEN la module.** El paso 3 ya lo captura, y son
cinco historias distintas contadas con la misma frase. Un «lo encontré» y un
«vino de un criadero» no son el mismo día para esa familia.

| origen | voz propuesta |
|---|---|
| *(sin declarar)* | Una vida nueva empieza |
| `adoptado` | Una vida nueva empieza — el día que {{nombre}} eligió casa |
| `refugio` | Una vida nueva empieza — {{nombre}} encontró su familia |
| `nacido_en_casa` | Una vida nueva empieza — y empieza en casa |
| `encontrado` | Una vida nueva empieza — el día que {{nombre}} apareció |
| `criadero` | Una vida nueva empieza — {{nombre}} llegó a casa |

**Los tres criterios con los que se escribieron, para que se puedan discutir
uno por uno:**

1. **La primera mitad NO cambia nunca.** Es la frase firmada, y repetirla en
   los seis casos hace que el hito se lea como UNO y no como seis features.
2. **Ninguna variante nombra al humano como protagonista.** «eligió casa»,
   «encontró su familia», «apareció» — el sujeto es la mascota. Es EL NORTE
   literal: *el sujeto del producto es la MASCOTA, no la transacción.*
3. **`encontrado` es la que más se cuidó, y hay que mirarla dos veces.**
   «Apareció» esquiva a propósito el relato del abandono: quien encontró a un
   animal en la calle no necesita que su app se lo recuerde cada vez que abre
   el expediente. **Si el founder la lee fría, cae y queda la base.**

⚠️ **Lo que esta propuesta NO puede resolver sola, y es del founder:** el
origen se declara al alta, pero el hito es del PASADO del animal. Con
`adoptado` el hito es honesto. Con `nacido_en_casa`, la fecha del hito es la
del alta y no la del nacimiento — **el hito dice «empieza» un día que puede
estar años después del que cuenta.** Dos salidas, y las dos son decisión:
**(a)** el hito se ancla a la fecha de nacimiento cuando existe y es exacta ·
**(b)** el hito es del día del alta y su voz lo asume («desde hoy lo
seguimos»). *Sin decidir esto, la variante `nacido_en_casa` puede leerse como
un error de fecha.*

---

## ② EL HITO DEL ACUARIO — `mundo_nuevo_empieza`

La clave de A ya trae la distinción, y es la buena: **un acuario no nace, se
monta.** «Una vida nueva empieza» sobre un sistema sería una frase prestada.

> **Un mundo nuevo empieza**

Sin variantes: el acuario no declara origen (el paso 3 no se lo pregunta —
está construido así, y el smoke lo verifica). Y «mundo» hace el trabajo que la
mesa firmó: **el sujeto es el SISTEMA** — el agua, las plantas y quienes viven
en ella —, no un pez.

---

## ③ DÓNDE SE LEE, Y POR QUÉ IMPORTA PARA JUZGARLA

El hito aterriza en la **Línea de Vida** de la mascota, que hoy ya sabe pintar
eventos con voz de familia. **Va a ser la primera fila del expediente de toda
mascota nueva** — la que un dueño ve el día uno y la que sigue ahí dentro de
tres años.

**⇒ Se juzga leyéndola en su lugar, no en esta tabla.** El gate útil es abrir
la Línea de Vida de una mascota recién dada de alta y ver la frase donde va a
vivir (L-143: las leyes se firman sobre píxeles).

---

## ④ LO QUE HACE FALTA PARA ENCENDERLO

Del lado de esta pista es **una llamada** en `PasoCierre.tsx`, en el punto ya
marcado con su comentario. Lo que falta antes:

1. **La firma de la voz** (esta hoja, o la que el founder dicte encima).
2. **La decisión de la fecha del hito** (el ⚠️ de arriba).
3. **La puerta del motor**: A dejó tabla y catálogo; queda declarar si el hito
   lo emite el cliente o lo estampan las dos RPCs del alta adentro de su
   transacción. **Lo segundo es mejor y es de A**: un hito que depende de una
   segunda llamada del teléfono se pierde con la primera pantalla que se cierre
   a destiempo, y una mascota sin su hito es un agujero que nadie va a notar.
