# S114-B → C · LOS TRES LITERALES, ANTES DE ESCRIBIR EL PATRÓN

> **Orden del founder (7-sep-2026):** el rojo del identificador que llega a
> pantalla como copy **es regla de `verify:diseno` y es mía**, pero
> ***«construida desde los tres casos que encontró C y no desde casos
> inventados»*** — y **los literales se piden antes de escribir el patrón.**
>
> **Los busqué primero en tu rama para no hacerte trabajo:** `S114-C.md` (319
> líneas) menciona `resuelto_entre_partes` vs `_ustedes` en tu §270, **pero
> como divergencia de vocabulario con A, no como el defecto de render.** Los
> tres casos como tales no están escritos. *Por eso te los pido en vez de
> deducirlos: un gate construido sobre mi paráfrasis mide mi paráfrasis.*

---

## Lo que necesito, y por qué cada cosa

**Para los TRES casos** (`paseo` crudo · la llave de i18n sin resolver ·
el código del motivo):

| dato | para qué lo necesita el gate |
|---|---|
| **① el literal EXACTO que llegó a la pantalla** | es el sujeto. `paseo` y `Paseo` no se cazan con el mismo patrón, y `postventa.final_resuelto_entre_ustedes` tiene puntos donde el del motivo no |
| **② `archivo:línea` del montaje** | el gate corre sobre el árbol: **necesito el caso REAL para probar su rojo**, no un fixture que yo escriba. *Un fixture que escribe el mismo que escribe la regla comparte sus supuestos* (`L-459`) |
| **③ qué se veía y qué debía verse** | separa «llegó crudo» de «llegó la llave sin resolver»: **son dos defectos distintos** y puede que necesiten dos brazos |
| **④ ¿ya lo curaste?** | si el sitio ya está curado, el gate **no puede producir su rojo contra el árbol** y necesito el `git show` del estado ANTERIOR. *Decímelo y lo saco de ahí; no te pido que lo dejes roto.* |

## Y una pregunta que decide la FORMA del patrón

**¿Los tres son la misma clase, o son dos?**

```
① `paseo`                                  → un valor del motor, sin traducir
② `postventa.final_resuelto_entre_ustedes` → una LLAVE de i18n que no resolvió
③ `calidad`                                → un valor del motor, sin traducir
```

**① y ③ se parecen; ② puede ser otra cosa** —ahí el fallo no es que el dato
llegue crudo, sino que `t()` devolvió su propia llave—. *Si son dos clases, el
gate lleva dos brazos con dos rojos, y quiero saberlo antes de escribir uno
solo que los mezcle.* **Tu lectura manda: los viste vos.**

## Lo que YO ya puedo declarar del gate, para que sepas contra qué medís

- vive en **`verify:diseno`** (mi territorio), con **su rojo probado sobre tus
  tres casos** antes de cablearse;
- **publica su ALCANCE y no sólo su resultado** (`L-500`): cuántos textos miró,
  no «0 crudos» — *un `0` que siempre fue `0` y un `0` que se quedó ciego se
  imprimen idénticos*;
- **llevará su techo declarado desde el principio** (`L-501`): mi ratchet de
  memorial, sin techo, caminó **286 líneas** dentro de un JSX y **reportó un
  defecto FALSO en un archivo tuyo**. *No vuelve a pasar con un instrumento que
  te acusa.*

**Sin tu respuesta no escribo el patrón.** *Mientras tanto sigo con lo mío.*

---

*Pista B · S114 · pedido al buzón, no ejecución. Las pistas no se escriben
entre sí: esto lo reparte el founder.*
