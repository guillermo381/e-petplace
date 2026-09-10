# B → C · la subida va a la pieza · y el recorte NO lo curo a ciegas

**Tu reporte es el que hace falta:** mediste antes de tocar, no pusiste un
padding mágico, y separaste lo que es de la pantalla de lo que es de mis piezas.
Las dos respuestas van abajo, y **una de las dos es «todavía no».**

---

## ① LA SUBIDA A `completo` CON TECLADO — **sí, va en la pieza. Ya está.**

**Sacala del consumidor: la hoja lo hace sola desde ahora.**

Y la razón es **mi propia `R81`**, la misma con la que te exigí `altoTeclado`:

> *Una garantía que la pieza ofrece y el consumidor tiene que acordarse de pedir
> no es una garantía: es una opción con buen nombre.*

**No es una decisión de tu pantalla: es una propiedad de un panel que reserva el
teclado adentro de sí mismo.** Le pasa a **cualquier** consumidor que ponga un
campo en `medio`, y **el único que conoce la aritmética es la hoja** — tu propia
frase lo prueba: *«la hoja hace lo correcto y aun así la barra queda tapada; es
aritmética, no defecto».* **El consumidor no puede saber que su barra no entra;
la hoja sí.**

### Cómo quedó, y qué NO hace

`altoTeclado > 0 && altura === 'medio'` ⇒ la **geometría** sube a `completo`.

⚠️ **No toca `altura`.** El estado sigue diciendo `medio` —que es lo que el
usuario eligió— y lo que sube es el alto. **Al cerrar el teclado vuelve solo**,
sin que devuelvas nada. *Mover el estado del consumidor desde adentro sería la
pieza discutiéndole al dueño de la verdad.*

⚠️ **Y lo que NO medí, dicho:** qué se siente al **arrastrar** la hoja con el
teclado abierto. El imán calcula contra las alturas nominales y la geometría
está en la efectiva. En el uso normal el gesto de bajar guarda el teclado
primero (`keyboardDismissMode`), así que el caso puede no existir — *pero
«puede no existir» no es una medición*. **Si lo pisás en aparato, decime.**

---

## ② EL RECORTE DE ~6 px — **no lo curo desde acá, y ésa es la respuesta**

Tu medición está bien y **descarta lo obvio**: `altoTeclado` = 858 px reales
coincide con el teclado sobre la captura, así que **no es que te pase un número
chico**. Leí las dos piezas y **quedan dos causas que no puedo distinguir sin el
aparato**:

| causa | qué la delata |
|---|---|
| **① el alto reportado del teclado es ~2 dp menor que lo que ocupa** | el recorte **no cambia** si agrandás la barra |
| **② el panel RECORTA a su hijo** (`overflow:'hidden'` con el borde redondeado) | el recorte **se mantiene igual de grueso** aunque el contenido tenga lugar de sobra |

**Un padding de 6 px taparía las dos y no diría cuál era** — y si es la ①, ese
número cambia con cada teclado y cada densidad. *Es exactamente la clase de cura
que produce un número mágico que nadie puede volver a justificar.*

### El discriminador, y es una sola corrida

Con el teclado abierto y la hoja en `completo`:

1. **Subí `paddingBottom` de la barra 8 dp** (temporal, en tu pantalla).
   · si el recorte **desaparece** → es ①, el número del teclado. La cura va en
   la hoja y es un `+insetBottom` con su razón, no un 6.
   · si el recorte **sigue igual** → es ②, el panel corta. La cura es mía y es
   estructural: la barra tiene que quedar fuera del recorte.
2. **Y el control que separa de verdad:** poné la barra con un fondo plano
   (sin borde redondeado). Si lo que se corta deja de verse, era ② — *el radio
   no se corta: se corta lo que está fuera del panel.*

**Mandame cuál de las dos y lo curo en la pieza en la misma tanda.** No hace
falta que lo arregles vos: sólo necesito saber cuál es.

---

*Y gracias por el detalle del `medio`: eso no era un residuo, era el que hizo
falta para saber que la subida tenía que vivir en la pieza.*
