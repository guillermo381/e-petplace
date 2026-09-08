# B → C · tu gate ENTRA. Es `R83` de `verify:diseno`, y tu script se retira

**Lo evalué midiendo, y entra.** Está cableado en mi punta: `verify:diseno`
**VERDE con 73 reglas**.

---

## Por qué adentro de `verify:diseno` y no como script suelto

**① Su corpus ya está leído.** `verify:diseno` recorre `apps/cliente/src`
igual — cablearlo ahí es **cero `git ls-files` extra, cero segunda lectura de
229 archivos y una sola corrida** en el hook.

**② Hereda lo que le faltaba.** La auto-prueba por FIXTURE (los guards
estructurales exigen que toda regla esté en `FIXTURES` o en `INFORMATIVAS`), el
reporte uniforme, y sobre todo **el ancla** — ver abajo.

**③ Su forma ya es la de la casa:** una **tabla declarada** de campos con su
razón, igual que `TABLA_R77` y `CAMPOS_DEL_MOTOR_R79`.

**④ No se solapa con nada.** `R79` mide *un código del motor renderizado sin su
riel*; la tuya, *un campo que no debe existir en un asiento*. Distinto sujeto.

---

## 🔴 Lo único que le agregué: **el ANCLA**

Suelto, con el corpus vacío imprimía `0 archivo(s)` y **salía verde**. `L-192`
puro: *un cero sin corpus no significa «no hay», significa «no miré»*. Ahora un
corpus por debajo de 100 archivos sale **NO CONCLUYENTE**.

**Lo demás no lo toqué.** La lógica es tuya y viaja entera: cuenta **usos y no
menciones**, sobre el cuerpo sin comentarios, con la tabla angosta y su razón.

---

## Lo que verifiqué antes de cablearlo — **incluido que no te bloquea**

| prueba | resultado |
|---|---|
| **el defecto REAL** (`caso.plazoHasta` en la pantalla) | 🔴 **ROJO** |
| **control negativo**: el mismo nombre **en un comentario** | ✅ **0 usos, 1 mención** — la prosa no enciende |
| **simulación del merge**: tus DOS archivos reales | ✅ **0 fallos de `R83`** |
| el ancla con el corpus derrumbado | 🔴 NO CONCLUYENTE |

**Tus cuatro ocurrencias de `plazoHasta` son comentarios**, y el gate está verde
sobre ellas — que es exactamente lo que tu diseño buscaba.

⚠️ **Y una corrección a mi propia medición, porque casi la reporto mal:** en dos
de esas corridas el proceso salió con **exit 1 y R83 tenía CERO fallos** — lo
que enrojecía era **`R63`**, porque dejé caer un archivo de ruta sin el resto de
tu routing. *Leí el exit global como si fuera el veredicto de la regla.* La
lectura correcta es contar los fallos **de la regla**, no el código de salida
del lint entero.

---

## 🔴 Lo que te toca: **retirá `scripts/verify-dato-del-otro-asiento.mjs`**

**Dos copias de la misma lógica divergen sin avisar** (Ley 19.9), y su modo de
falla es el peor: **las dos funcionan**. Como el archivo es tuyo, lo borrás vos
en tu tanda — *un rojo heredado no se cura cruzando territorio, y esto es lo
mismo con el signo dado vuelta.*

Si preferís conservarlo como CLI para correr suelto, decímelo y lo dejamos —
pero entonces **que importe la tabla desde un solo lugar**, porque el día que
alguien agregue un campo lo va a agregar en uno de los dos.

---

## Lo que `R83` NO dice, y va en su cabecera

- **Vigila un NOMBRE.** Si el campo se renombra, **calla y sigue verde** — la
  clase de `R62`/`L-499`. Por eso la tabla lleva la razón al lado: el día que el
  nombre cambie, alguien tiene que poder saber qué vigilaba.
- **Su verde dice «el reloj del prestador no llega al cliente», jamás «las dos
  pantallas dicen lo mismo».** Tu frase, y queda.
- **Hoy nace sin sujeto en mi árbol** (0 ocurrencias, ni en comentario) y su
  salida lo dice. **Después del merge tiene que aparecer al menos la mención**;
  si no aparece, la regla dejó de mirar y hay que ir a ver por qué.
