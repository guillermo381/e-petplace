# S86 · ACTA DE CIERRE — el resultado

> **Ancla: `9e83b6d`.** Tres pistas (A: DB · `packages/api` · `docs` ·
> merge y publish · B: `packages/ui` · tokens · lint · C: `apps/prestador`).
> **El método y su costo viven aparte:** `2026-08-04-s86-acta-del-metodo.md`
> — *se referencia, no se copia.*

---

## 1 · QUÉ QUEDÓ CONSTRUIDO

**EL MOSTRADOR SALIÓ DE `veterinaria/`** — la ventanilla dejó de ser
clínica. **El camino entero desde un paseador llega limpio hasta la
puerta** (entrada · búsqueda · alta · handshake), sin una sola pantalla
vet. *Lo que NO abre es el registro: ver `D-654`.*

**LA PIZARRA** — la cita puede nacer **sin tratante**, y **tomarla
rellena un `NULL`**. *Reasignar es **inexpresable por esa puerta**: el
`WHERE empleado_id IS NULL` del `UPDATE` lo vuelve imposible por
construcción, no por disciplina.* **Cuando alguien llega primero, la fila
SE QUEDA y lo dice** — jamás desaparece en silencio.

**EL DASHBOARD DE DATOS** — la tab que tenía nombre y no tenía adentro:
los tres números, día por día, mix, trayectoria y plata. **La plata se
modula EN EL SERVIDOR** (`{visible:false}` **sin las otras claves**): un
no-titular **no recibe ni la clave**. *Una autorización que decide el
cliente es decorativa.*

**LA MUDANZA** — `equipo`, `estadísticas`, `reseñas` y `casos-heredados`
a **DATOS**; **«El movimiento» a CUENTA** con **sus dos gates**
(el de gestor **y** el oficio vet). **`Cobros` NO se mudó** — firma
previa que se sostiene.

**LA LÍNEA DE TIEMPO DEL HOY** — el HOY **deja de contar el día dos
veces**: arriba **solo lo vivo**, el día **abajo y en orden**. Muere «Lo
siguiente» como bloque, y **el label del día SIEMPRE se monta**.

**D-649 VIVE** — buscar actualizaciones a mano, en Cuenta, al lado del
pie del `updateId`. *Con su ironía intacta: viaja dentro de una
actualización.*

---

## 2 · LAS LEYES NUEVAS — **cada una con su caso**

> **Ninguna se guarda como frase.** *Un enunciado sin su caso se cita
> mal — S85 lo probó seis veces.*

### `L-200` — **«está corriendo» es una MEDICIÓN, no una intención**

**Caso (de A):** le dijo al founder *«la captura está corriendo, abrí la
app»*. Había usado `timeout`, **que no existe en macOS**: el proceso
murió al instante y el archivo quedó con una línea de error. **El founder
gastó una ventana con el teléfono en la mano contra un instrumento que no
existía.** *Hermana de `L-191`: confiar en la FORMA del comando en vez de
en su RESULTADO. El atenuante —la evidencia se recuperó del buffer— fue
suerte del instrumento, no diseño del reporte.*

### `L-201` — **un cero MEDIDO no se dibuja como ausencia**

**Caso:** el techo de los tres números **se desmontaba** en días sin
citas; al pasar la rueda, el layout saltaba. **Hermana de `L-197` en
dirección CONTRARIA:** *L-197 dice que un fallo degrada a **ausencia**;
ésta dice que un cero **medido** se **muestra**.* Desmontar convierte
«hoy no hubo» en «acá no hay nada». **Su mitad de método está en el acta
del método §3** — la regresión que no existía.

### `L-161` — su **forma exacta**: un censo declara el **CAMINO DE GATE**, no el path

**Caso: cuatro superficies con path correcto y CERO camino para el dedo
del founder** — la rama `administrador` (**cero portadores**) · el diseño
de la barra de tres (**él es titular: no puede verla nunca**) ·
`AgendaRecepcion` (exige otro rol) · `GateRoto` (exige datos
contradictorios). **Tres están BIEN construidas: el problema no es su
código, es que nadie con un dedo puede confirmarlo.**
> **⇒ «construido» y «verificado» se separan en el ROL, no en el
> archivo.** *Un censo de paths las habría contado como cobertura.*

### La ley de los guards — **falla en las DOS direcciones**

> ### **UN GUARD QUE DECLARA MAL SU ALCANCE ES TAN MALO COMO EL QUE NO LO DECLARA.**

**Caso doble, el mismo día:** `M2` decía **5** midiendo **una carpeta**
contra una ley que dice *«NINGÚN campo»* (**decir de menos, y sale
verde**) · y al ensanchar, **3 de 12 eran falsos positivos** (**decir de
más — y un guard que grita donde no pasa nada se desactiva solo**).
**+ el tercero, de A contra sí misma:** `verify-fuentes-legibles` dio
**VERDE sobre CERO archivos** en su primer fixture. *Por eso el rojo se
produce ANTES: el fixture cazó al guard.*

---

## 3 · LAS DEUDAS — muertas y vivas

**☠️ PAGADAS HOY:** **`D-645`** *(`diaSemanaCorto` a `packages/i18n`; los
`paseo_Nmin`… ver abajo)* · **`D-498`** en sus 6 rutas *(las tres
`durante`, equipo, vacaciones, sala-espera)* · **`D-546`/`D-645`** de B
*(el `Icono` con sus dos ejes; mueren tres clones)* · **el marcador
`[bundle]`** en **las dos apps** *(Ley 37 — rotulaba mal hacía siete y
trece sesiones)*.

**🔴 VIVAS, con rumbo:**

| ficha | estado |
|---|---|
| **`D-651`** 🔴 | **la barra de tres que nadie diseñó** — **cinco personas la ven hoy** y el código declara por escrito que es imposible. **PRIMERA ORDEN DE S87**, con su guard propuesto |
| **`D-654`** 🔴 | **el mostrador de todos los oficios — CON RUMBO FIRMADO, no freno.** El gate `es_medico` se abre · la vía es **(b) la duración** · el `LIMIT 1` **en el mismo lote**. Su orden de construcción ya está escrito |
| **`D-653`** 🟡 | **dos puertas del mismo acto con predicados distintos** — 8 filas `cita_automatica` vivas, **0 caducadas**. *Bomba de reloj: su disparo es el paso del tiempo* |
| **`D-652`** 🟠 | **«administrador» sin un solo portador** — la rama existe, **nunca corrió**. NO se borra; se declara **NO PROBADA** |
| **`D-649`** 🔴 | construida y viva — **y su cura viaja por el canal que está roto** |
| **`D-539`** 🟠 | gana su **consecuencia de pantalla**: los wrappers hablan **voseo**, la app **tuteo**. *Pintar `r.mensaje` cambia el acento y nada lo impide* |
| **`D-650`** 🔴 | **el hallazgo de la sesión** — su desarrollo entero en el acta del método §1 |

---

## 4 · LO FIRMADO POR EL FOUNDER — lo que ahora RIGE

- **El mostrador es de TODOS los oficios.** *`VETERINARIA` §7 no los
  prohibía: no los contempló, y **una omisión no es una prohibición**.*
- **Cobro por OFICIO:** **vet al TERMINAR**, los demás **al INICIAR**.
- **Lo clínico NO VIAJA** fuera de su oficio.
- **Dejar una cita sin tratante es una ELECCIÓN, y elegir es OBLIGATORIO
  cuando se ofrece** — «A la pizarra» dejó de ser un accidente y es un
  chip.
- **La regla Chanel gana su CONDICIÓN:** *borde + sombra = decirlo dos
  veces* **rige CUANDO LA SOMBRA LO DICE**; **el límite lo pone el
  CONTRASTE**. En claro la tarjeta **recupera su hairline** (card
  `#FFFFFF` vs base `#FAF9F7` = **1.052**: una sombra que no se ve no
  dice nada).
- **`border.presente`** — jerarquía **entre dos bordes** para la
  gramática ESTÁ/ESPERA: **1.693** sobre papel algodón y **1.663** sobre
  tapiz, contra **1.234/1.212** de `light4` (≈1.4×). *Se descartó
  `#B8B2CE` (1.938) porque empezaba a leerse como MARCO — y la Ley 20
  mata el marco.*
- **«Pide tu ojo» RECORTADA** de la lámina: **sin lectores no se
  dibuja**, y se declara pendiente **con su letra** — no se hereda como
  construida.

---

## 5 · OPERATIVO

- **Commits en `main` (sin merges): A 23 · B 6 · C 16** · **11 merges
  `--no-ff`**. *⚠️ El conteo de C se corrigió contra el objeto: la mesa
  dijo «once», el `git log` dice **16**.*
- **CERO migraciones.** Toda la DB de hoy fue **lectura** — *se declara
  para que nadie busque una veda que no existió.*
- **Tres guards nuevos**, los tres con **rojo producido ANTES** (L-199):
  `verify-ota` · `verify-fuentes-legibles` · `verify-promociones`.
- **`verify-ota` ENGANCHADO al paso ⓪** (CONTRATO **v1.28**, eslabón ③ de
  la regla 84) y corrido **real en los cuatro publishes**, siempre verde.
- **OTA FINAL:** **prestador `7ec156ea-0fd5-4963-afe1-36b0762ea4b5`** ·
  **cliente `38e99a4e-062e-44c7-a327-11aa20b8f64a`** — ancla `9e83b6d`,
  **los dos VERDES por `verify-ota`**.

*Depositada por A, S86.*
