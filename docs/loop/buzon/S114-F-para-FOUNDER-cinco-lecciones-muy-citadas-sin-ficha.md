# Aviso de F al founder — **cinco lecciones muy citadas no tienen su ficha en `DEUDAS_CANONICAS.md`**

> ## 🔴 Si vas a copiar UNA frase de acá, que sea ésta
>
> **`L-166` se cita 39 veces en el repo y su texto NO está en `DEUDAS_CANONICAS.md`.**
> Con ella hay cuatro más en el mismo estado. **No es de esta sesión ni de la
> renumeración de S114: es preexistente.**
>
> *Se verifica con el censo del final de este archivo (Python, sin red, ~2 s).*

**8-sep-2026 · S114-F.** Apareció verificando la renumeración del candidato. **No lo curé:**
es del canon y decide el founder.

---

## Lo medido

| lección | menciones | dónde vive su texto |
|---|---|---|
| **`L-166`** | **39** | 🔴 **ningún encabezado propio en `DEUDAS_CANONICAS.md`** |
| `L-198` | 12 | `docs/relevamientos/2026-08-04-s85a-acta-de-traspaso.md` |
| `L-158` | 11 | `docs/LETRA_SELECTOR_ELEGIBILIDAD_S73.md` (§7, «L-158 en acto») |
| **`L-193`** | 10 | 🔴 **sin encabezado en NINGÚN `.md` del repo** — sólo menciones |
| `L-197` | 10 | `docs/relevamientos/2026-08-04-s85a-acta-de-traspaso.md` |

**Las tres formas son distintas y conviene no mezclarlas:**

- **`L-193`** es la más grave: **diez sesiones la citan y su texto no existe en ningún
  lado del repo.** Quien la busque para saber qué dice, no la encuentra.
- **`L-197`/`L-198`** existen, pero **en un acta de relevamiento** — un documento de
  sesión, no el canon. *Un acta se lee una vez; el canon se consulta.*
- **`L-158`/`L-166`** se citan como ley y su texto vive **disperso en prosa** de otros
  documentos, sin ficha propia.

⚠️ **`L-166` es el caso que más cuesta:** es *«todo dato vivo se lee al momento de usarlo,
jamás de un reporte anterior»* — una de las leyes que más se invoca en la casa, **39
veces**, y **no tiene ficha donde el canon dice que viven las lecciones.**

---

## Por qué no lo curo yo

**No es trabajo de escritura: es una decisión sobre qué es el canon.** Tres salidas y
ninguna es obvia:

1. **Depositar las cinco fichas** en `DEUDAS_CANONICAS.md`, reconstruyendo su texto de
   donde esté. *Riesgo: reconstruir de memoria una ley que ya se aplicó diez veces — y
   `L-193` no tiene de dónde reconstruirse.*
2. **Declarar que el canon de lecciones vive en varios archivos** y que las menciones
   apuntan ahí. *Honesto, pero vuelve inútil cualquier censo de lecciones.*
3. **Dejarlo como está y anotarlo.** *Es lo que hago hoy.*

---

## Cómo lo encontré, y el falso positivo que hubo en el medio

Censando wikilinks colgados en el candidato. **Mi primer censo dio 7 y era falso**: buscaba
encabezados con el formato `### \`L-NNN\`` y **el canon usa DIEZ formatos distintos** —

```
## 🔴 `L-NNN   43      ### `L-NNN     35      #### L-NNN     21
### L-NNN       4      ## L-NNN        3      ## ☠️ `L-NNN    2
## 🟠 `L-NNN    2      ## 📜 L-NNN     1      ## 🟡 `L-NNN    1
#### D-686 — 🟠 L-NNN  1
```

— así que **veía 35 de 110**. Re-medido con todos, bajó de 7 a 5.

🔴 **Es `L-514` en carne propia** *(un instrumento que pregunta por la FORMA en que la ley
suele escribirse no mide la ley)*, y **la diversidad de formatos es en sí un hallazgo**:
*cualquier censo de lecciones de esta casa subcuenta si no los contempla los diez.*

---

## El censo, para correrlo cuando se decida

```python
import re
t = open('docs/DEUDAS_CANONICAS.md', encoding='utf-8').read()
existen = set(re.findall(r'^#{2,4}\s+(?:[^\n`]*?)`?(L-\d+)`?\s*(?:—|·|-)', t, re.M))
citados = set(re.findall(r'\[\[(L-\d+)\]\]', t))
print(sorted(citados - existen, key=lambda s: int(s[2:])))
```

⚠️ **Mide sólo los `[[wikilinks]]`.** Las citas en texto plano (`` `L-166` ``) son muchas
más y no las cubre — *el número real de referencias a fichas ausentes es mayor que 5.*
