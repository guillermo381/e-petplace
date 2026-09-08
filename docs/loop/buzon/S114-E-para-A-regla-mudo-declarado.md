# S114-E → A · LA REGLA DEL PASE DE LISTA, para el canon

> **UN SOLO ASUNTO:** el texto de la regla, para que viva en el canon y no sólo
> en mi parte. **Firmada por el founder (7-sep).**
> **Rama:** `pista/s114-e-1.0` · **alcance:** sólo docs de tu lado.

---

## ① DESPUÉS DE UNA CURA AJENA, SE CORREN TODOS

> **Un número medido contra un árbol viejo es un número falso que se lee como
> verdadero.**

**Comando:** `pnpm verify:pase-de-lista --todos`.

**Por qué es regla y no hábito:** el peor defecto de S114 apareció sólo así.
`verify:postventa-plata` se quedó mudo cuando A6 llevó a 0 los objetos sin
devengo — *se apagó justo cuando el sistema se puso sano*, sin rojo y con todo
el tablero en verde. **Mirando sólo el gate que uno tocó, seguía mudo.**

**Cómo sabe que hubo una cura ajena:** `git rev-list --count HEAD..main`.
**Sin archivo de estado**, a propósito: *un archivo que recuerda la última
corrida se queda viejo, y ése es el mismo defecto una capa más arriba.*

**Y todo lo que publica un número lo declara.** `metricas:postventa` **sale 2**
desde un árbol viejo —los números se imprimen, pero **no se declaran
publicables**— y la instantánea de `verify:devengo-por-sujeto` **guarda si el
árbol estaba al día**, porque un «antes» tomado con supuestos viejos mezcla la
cura con el cambio de instrumento.

*Lo que envejece no es la base —que es compartida y está al día— sino el
INSTRUMENTO: sus nombres de columna, sus supuestos y la letra contra la que
compara.* **Se ganó el puesto dos veces hoy**, avisando de 28 y después de 3
commits sin mezclar.

**Lo que NO ve, declarado:** commits que estén en `origin/main` y no en el `main`
local. Quien quiera la foto exacta corre `git fetch` antes; el helper **no hace
red**, para no colgar a un arnés.

---

## ② LOS DOS MUDOS, Y POR QUÉ NO SE TRATAN IGUAL

> **Un gate mudo no es un gate verde — pero un exit 1 permanente por un estado
> conocido entrena a saltear el pase de lista, y entonces deja de avisar del que
> sí importa.**

| | |
|---|---|
| **mudo DECLARADO** — el gate imprime `BLOQUEANTE NOMBRADO` | se **muestra**, **no frena**. Sabe por qué no puede medir y a quién le toca |
| **mudo SIN DECLARAR** — no pudo medir y no sabe por qué | 🔴 **frena** |

**El criterio sale del propio gate, no de una lista en el pase de lista.** *Una
lista de excepciones envejece; la declaración vive al lado del bloqueante.*

⚠️ **Y su costo va dicho, porque es un agujero deliberado:** **un gate puede
acallarse imprimiendo esa frase.** Se acepta a propósito — **obliga a su autor a
NOMBRAR el bloqueante**, que es exactamente la conducta que se quiere, y el pase
de lista **lo sigue mostrando igual** en su tabla. *Lo que no se acepta es el
silencio: eso frena.*

**Las dos ramas están probadas** (un mudo con la frase → exit 0 mostrado; el
mismo sin la frase → 🔴 SIN DECLARAR, exit 1).

**Hoy el único mudo es `verify:cierre-ausente`**, con su bloqueante nombrado:
F1 —la regla del cierre ausente— **es tuya desde hoy**, y el gate la nombra.
