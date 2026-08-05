# S86 · ACTA DEL MÉTODO — lo que produjo el resultado y lo que costó

> **Para que S87 no lo re-descubra.** Molde de S85. **Ancla del cierre: `9e83b6d`.**
> Todo lo de acá está **medido**, no recordado.

---

## 1 · EL HALLAZGO DE LA SESIÓN — `D-650`

> ### **LA FUNCIÓN QUE HACE QUE EL PASEO SE REGISTRE ES LA MISMA QUE IMPIDE QUE LAS ACTUALIZACIONES LLEGUEN — Y OCURRE EN EL USO NORMAL, NO EN UN BORDE.**

**Empezó como «el founder publicó un OTA y no vio nada» y terminó siendo
estructural.** Son **DOS MITADES**, y **cada una sola produce una
hipótesis cierta e incompleta** — así murieron las dos primeras vueltas.

**① EL PROCESO NO MUERE, NI CERRANDO DESDE RECIENTES.**

| medido | valor |
|---|---|
| PID antes de los dos cierres del founder | **19224** |
| PID después | **19224** — *idéntico, mismo `starttime` (18364 jiffies)* |
| antigüedad | **≈ 5 h 45 min** (arrancó a 183 s del boot) |
| `epetplace-track-paseo` | **105 disparos en ~2 min**, cada ~5 s |
| memoria | **222 MB → 469 MB** |

**La memoria subió ⇒ la Activity SÍ se recreó. Y ahí está la trampa:
recrear la Activity NO es relanzar el proceso**, y `expo-updates`
chequea en el arranque del **PROCESO**. *Cerrar desde recientes se
siente como reiniciar y no lo es.*

**② EL PRIMER COLD START **SOLO DESCARGA**.** Proceso nuevo `14665`,
`14:50:42 → 14:50:57` (quince segundos):

```
StartStartup → Check → CheckCompleteAvailable(TRUE) → Download
→ 65/65 assets, failedAssetCount=0 → DownloadComplete → EndStartup
ErrorRecovery: NEW_UPDATE_LOADED
```

**El chequeo nunca estuvo roto.** Y aun así el marcador de ESE arranque
seguía diciendo el bundle viejo: expo-updates lanza el anterior mientras
baja el nuevo. **Hace falta OTRO arranque.**

**⇒ el prestador necesita Ajustes de Android → Forzar detención, DOS
VECES.** **Y NO era un estado raro: el founder confirmó PASEOS EN
CURSO** — cero tarea huérfana, cero segundo defecto. **Terminar los
paseos fue lo que liberó el proceso y aplicó el update.**

**POR QUÉ NADIE LO VIO ANTES, y es lo que lo vuelve caro: NO ROMPE
NADA.** Publish verde, `update:view` con su group, `verify-ota` VERDE el
mismo día, el servidor sirviendo el update correcto — **y el aparato con
el bundle viejo sin un solo error en ningún lado.**

**LA RECONCILIACIÓN CON EL EMULADOR, donde se cayó la primera
hipótesis:** allá el mismo APK tomó el update en dos reinicios porque se
corrió `am force-stop` —mata garantizado—; el founder cerró desde
recientes, que con el GPS activo **no mata**. *Mismo binario, misma
config, mismo canal.*

---

## 2 · LA IRONÍA DE `D-649`, que es una lección de diseño y no un chiste

> ### **EL BOTÓN QUE CURA «NO ME LLEGAN LAS ACTUALIZACIONES» VIAJA DENTRO DE UNA ACTUALIZACIÓN.**

El founder necesita **forzar detención dos veces** para recibir el botón
que existe **para no tener que forzar detención**.

**Y su segunda vuelta lo empeora:** por `D-650`, mientras haya un paseo
en curso el proceso no muere ⇒ **el usuario que más necesita el botón es
exactamente el que menos probablemente lo reciba.**

> **La única llave que abre la puerta está adentro del cuarto.**

**LO QUE DEJA COMO MÉTODO:** *toda cura que viaje por el mismo canal que
está rota necesita, además, un camino que NO dependa de ese canal.*

---

## 3 · LA REGRESIÓN QUE NO EXISTÍA — el descarte que evitó cirugía sobre lo sano

**El founder reportó: *«lo vivo desaparece al cambiar de día»*.** La mesa
dedicó una ronda entera a buscarlo en la Zona 1. **No estaba ahí.**

**Tres hipótesis, las tres falsas:** ① el escape del NUL *(exonerado con
prueba: `'\0' === '\x00'` → `true`)* · ② `vistaEsHoy ? … : []` · ③ el
desacuerdo entre el comentario `:1575` y los gates que todavía leían
`vistaEsHoy`.

**Salieron falsas por la mejor razón posible: NO HABÍA DEFECTO QUE
EXPLICAR AHÍ.** El defecto real era otro —el techo de los tres números se
desmontaba en días sin citas y el layout saltaba— y lo curó C
(`309a1ef`).

> ### **EL SÍNTOMA REPORTADO Y EL DEFECTO REAL ERAN DOS PANTALLAS DEL MISMO SCROLL.**
> **LA MEDICIÓN NO FALLÓ. FALLÓ LA PREMISA DE DÓNDE MIRAR.**

**Y por eso el descarte valió lo que costó:** sin él, **la cura habría
caído sobre código sano** — se habría "arreglado" la Zona 1, el salto
habría seguido, y el HOY quedaría con una cicatriz sobre un defecto que
nunca tuvo. *Hoy es `L-201`.*

**Autocrítica de A, que la lección se lleva bien:** las hipótesis ② y ③
las ofreció A como *«sospechosos por forma»* mirando código que resultó
sano. **Estaban etiquetadas como hallazgos y no como veredictos —y eso
las salvó de volverse orden— pero igual orientaron una ronda hacia la
zona equivocada.**

---

## 4 · LOS FRENOS QUE CAMBIARON UNA DECISIÓN — cuatro, contados

*El freno es el instrumento más barato del método y el que más ahorró
esta sesión. **Ninguno de estos cuatro era «no puedo»: los cuatro eran
«medí y el cuadro cambió».***

| freno | de quién | qué habría pasado sin él |
|---|---|---|
| **`TarjetaEstado`** — las listas YA eran superficie | **B** | **la caja dentro de la caja**: se habría construido una pieza para envolver algo que ya estaba envuelto |
| **los wrappers** — el motor y su puerta son el mismo contrato | **C** | dos formas del mismo dato, separándose el día que una cambie |
| **«Agendar»** — no construir la grilla sobre un lector no medido | **C** | una grilla que ofrece horarios que el motor iba a rechazar (Ley 23 al revés) |
| **el mostrador de paseos** — ni (a) ni (b) abrían nada | **A** | **se habría transcrito un wrapper contra una puerta cerrada**: el gate `es_medico` estaba ANTES del problema de contrato |

**El cuarto merece su línea porque es el caso puro:** la mesa pidió
**elegir entre dos vías**, y **la medición descartó las dos**. *La
pregunta estaba bien hecha; la premisa —que el bloqueo era de wrapper—
no.* **Frenar ahí convirtió una transcripción imposible en `D-654` con
rumbo firmado.**

---

## 5 · LOS ERRORES DE LA MESA, sin maquillar

**Se listan porque el mecanismo mirándose a sí mismo es la mitad del
método** — y porque los cuatro tienen cura barata.

1. **LA INTERFAZ DE C, REENVIADA *DESCRITA* EN VEZ DE PEGADA.** Dos veces
   se anunció *«te la pasa la mesa / el founder»* y **lo que viajó fueron
   las REGLAS DE DISEÑO, no la interfaz.** **Es `L-198` en su tercera
   dirección, y la cobra la mesa, no la pista.** *La cura salió por otro
   lado —A leyó los bodies vivos con `pg_get_functiondef`— y **eso
   funcionó mejor que la spec**, pero por accidente: si el motor no
   hubiera sido la fuente de verdad, el wrapper habría nacido inventado.*
2. **EL PUBLISH ORDENADO SIN PEDIR VEDA.** Se ordenó publicar directo; A
   verificó árbol limpio y ancla, pero **la congelación es de la mesa y
   no se pidió** (regla 82). *Salió bien y eso no lo vuelve correcto.*
3. **LOS MERGES RUTEADOS A LA MESA.** Varias veces la orden fue *«mergeá
   cuando yo diga»*, cuando **el deber ① de la conducción es MERGEAR A
   DEMANDA, sin esperar orden** (`METODO` §2). *Costó latencia, no
   corrección.*
4. **LA LÁMINA FIRMADA QUE PROMETIÓ LO QUE NO TENÍA MOTOR.** «Pide tu
   ojo» se firmó **sin sus dos lectores**, y el número del medio del
   dashboard salió con **un destino que no existía**. *La mesa lo corrigió
   ella misma —la franja se recortó por firma— y ésa es la conducta
   correcta; lo que hay que evitar es la primera mitad.*

---

## 6 · LO QUE EL BRIEF PEDÍA Y **NO SE HIZO**

- **EL REPARTO DE ROLES — era el foco declarado de la sesión.** *Se
  midió* (el censo de roles existe y produjo `D-651` y `D-652`) **pero no
  se construyó nada de reparto.**
- **NOTIFICACIONES — nunca se abrió.** *Sigue siendo precondición de
  `A3.5bis-b` (la puerta del permiso, letra sin motor) y del correo de
  recuperación que hoy lleva al portal viejo.*

*Se escriben acá y no en el brief para que el brief no los presente como
nuevos: **son heredados, y llevan dos sesiones de arrastre.***

---

## 7 · LAS LEYES NUEVAS, CADA UNA CON SU CASO

> **Ninguna se guarda como frase. S85 probó seis veces que un enunciado
> sin su caso se cita mal.**

| ley | enunciado | su caso |
|---|---|---|
| **L-200** | *«está corriendo» es una MEDICIÓN, no una intención* | A le dijo al founder que una captura de `logcat` corría; había usado `timeout`, **que no existe en macOS** — el proceso murió al instante y el founder gastó una ventana con el teléfono en la mano. Hermana de **L-191**: confiar en la FORMA del comando en vez de en su RESULTADO |
| **L-201** | **un cero MEDIDO no se dibuja como ausencia** | el techo de los tres números se desmontaba en días sin citas y el layout saltaba. **Hermana de L-197 en dirección CONTRARIA**: L-197 dice que un fallo degrada a ausencia; ésta dice que un cero medido **se muestra** |
| **L-161** *(forma exacta)* | un censo de consumidores declara el **CAMINO DE GATE**, no el path | **cuatro superficies con path correcto y CERO camino para el dedo del founder**: la rama `administrador` (cero portadores) · el diseño de la barra de tres (**él es titular: no puede verla nunca**) · `AgendaRecepcion` (otro rol) · `GateRoto` (exige datos contradictorios). **Tres están BIEN construidas** — el problema no es su código |
| **la de los guards** | **un guard que declara mal su alcance es tan malo como el que no lo declara — y falla en las DOS direcciones** | ver §8 |

---

## 8 · LA LEY DE LOS GUARDS, con sus dos direcciones medidas el mismo día

**DIRECCIÓN A — DECIR DE MENOS.** `M2` del burn-down reportaba **5**
`Campo sin EvitaTeclado`; el alcance era **una carpeta**
(`apps/prestador/src/app`). **La letra de D-498 dice *«que eso no pase en
NINGÚN campo»*.** *Un número correcto para lo que mide y más chico que la
ley que dice aplicar — y sale VERDE.*

**DIRECCIÓN B — DECIR DE MÁS.** Al ensanchar, **tres de los doce eran
FALSOS POSITIVOS**: componentes cuyas anfitrionas ya portaban la pieza.
*Un guard que grita donde no pasa nada se desactiva solo* (L-192 por el
otro extremo).

**⇒ B lo resolvió por el eje correcto:** deriva de `packages/ui`
**qué piezas abren teclado** y **resuelve anfitrionas** — y **corrigió a
A**, cuya lista incluía tres archivos sin deuda y priorizaba tres
`durante` que **no están en la medición fina**.

**Y un tercer caso, de A contra sí misma:** `verify-fuentes-legibles`
**dio VERDE sobre CERO archivos** en su primer fixture. *Es L-197 en
carne — «no pude medir» degradado a «todo bien»— y es exactamente el
defecto que ese guard existe para encontrar.* **Por eso el rojo se
produce ANTES (L-199): el fixture cazó al guard, no al revés.**

---

## 9 · LO OPERATIVO — números medidos contra el objeto

- **Commits en `main`, sin merges: A 23 · B 6 · C 16.** **11 merges
  `--no-ff`.** ⚠️ *El conteo de C se corrigió en vivo: la mesa dijo
  «once» y el objeto dice **16** — la regla de esta acta es número
  medido, jamás recordado.*
- **Cero migraciones.** Toda la DB de hoy fue **lectura**
  (`pg_get_functiondef`, censos) — se declara para que nadie busque una
  veda que no existió.
- **Guards nuevos, los dos con rojo producido ANTES (L-199):**
  `verify-ota.mjs` · `verify-fuentes-legibles.mjs` · `verify-promociones.mjs`.
- **`verify-ota` se enganchó al paso ⓪ y corrió REAL 8 veces**, todas
  verdes, en los cuatro publishes de la sesión.
- **Ancla del cierre: `9e83b6d`.**

*Depositada por A, S86.*
