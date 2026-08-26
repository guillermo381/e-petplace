# S105-B · TRASPASO

> **Qué es esto:** un mapa de **dónde retomar**, no una fuente de datos vivos.
> **No lleva un solo número que se pueda medir solo** — donde haría falta una
> cifra, va el comando. *Este archivo es prosa derivada por definición, y `L-419`
> es exactamente sobre eso.*
>
> **Territorio:** `packages/ui` · tokens · **los jueces** · **el asset de marca
> de DeUna** (§TERRITORIOS del `PLAN_MESA_106`, firma del founder).
> **Rama:** `pista/s105-b` · **árbol en cero al cerrar** · **todo en `origin` Y
> en `main`**, verificado por contenido y por SHA, no por el reporte del merge.

---

## 1 · LO CONSTRUIDO, Y SI ESTÁ EJERCIDO

| qué | estado |
|---|---|
| **La marca DeUna** — isotipo vendorizado byte-idéntico + procedencia | ✅ **EJERCIDA**: C la montó, viaja en la 2ª OTA |
| **`R65`** — el área de reserva de una marca ajena | ✅ ejercida por instrumento · ⚠️ **su objeto nunca se vio en un aparato** |
| **`R66`** — la voz no vuelve al voseo | ✅ en `main`, verde, probada en rojo · ⚠️ **nunca frenó a nadie salvo a mí** |
| **`scripts/lib-voz.mjs`** — 11 trampas | ⚠️ **hay DOS implementaciones** hasta que C mueva su CLI |
| **`scripts/medir-png.mjs`** — decodificador con su control | ✅ corre solo: `node scripts/medir-png.mjs` |
| **La ley de marca ajena** (`§6sexies`) | ✅ depositada por A · 🔴 **con una cita sin curar — ver §3** |
| **`L-419` · `L-420`** | ✅ depositadas · **`L-425` entregada, sin depositar** |

**Verificá que siguen vivas POR CONTENIDO, jamás por el SHA de un merge:**
```
git show origin/main:scripts/verify-diseno.mjs | grep -c '^function r6[56]'
git cat-file -e origin/main:scripts/lib-voz.mjs
git cat-file -e origin/main:apps/cliente/assets/marcas/ic_deuna_isotipo.png
```

---

## 2 · 🔴 CONSTRUIDO Y **SIN EJERCER** — lo que no tiene motor ni gate

| # | qué | por qué no se ejerce | dueño |
|---|---|---|---|
| 1 | **El isotipo nunca se vio en un aparato** | **Todo lo mío está MEDIDO —geometría, contraste, resguardo— y medir no es ver.** Un PNG de 468 px bajado a 24,5 dp puede tener aliasing que ningún número predice | **founder**, gate en dispositivo |
| 2 | **El tercer límite del manual: que nada más se dibuje dentro de la caja** | **`R65` NO lo mide** y su verde no lo dice. Contar hijos JSX sería frágil, y *una regla que grita cuando no debe enseña a ignorarla* | **founder**, mismo gate |
| 3 | **`PantallaDeCandado` está INERTE** | `expo-local-authentication` **no está instalado y es NATIVO** ⇒ no viaja por OTA | **tren nativo** |
| 4 | **Las tres piezas del cierre de cuenta** (`HojaConfirmacionDestructiva` · `ConsecuenciasDelCierre` · `CierreEnCurso`) | **No hay motor de cierre en `packages/api`**, y `cierre_cuenta_vivo` quedó en `false` por firma (`D-910`) | **A** (motor) · **mesa** (la llave) |
| 5 | **El splash del ritual** | No hay rasterizador de SVG en este entorno **y la coincidencia de posición es geométricamente imposible** como está escrita | **founder / diseño** — spec medida en `S104-B-SPLASH-BLOQUEADO.md` |
| 6 | **El gate por ícono del ojo a 21 px** | Sin hoja de contacto de 2-3 variantes (§6b) | **founder**, en `/gallery` |
| 7 | **El gate del biométrico** | Ni el typecheck ni el juez ven ciclo de vida. **El caso que importa: abrir en frío con sesión guardada y el sensor fallando a propósito** — *es el único punto donde una equivocación deja a alguien afuera de su cuenta* | **founder** |

**El tren nativo tiene cuatro pasajeros:** el splash · el `name` del launcher ·
`expo-local-authentication` · **y, cuando la letra exista, el transporte de
video** (§4).

---

## 3 · LO QUE ESPERO DE OTROS

### De **A**
1. 🔴 **Las CUATRO cadenas en voseo de `packages/api`** — su territorio, con su
   literal en el baseline de `R66`. **Cuando las cure, la tabla queda en una
   sola entrada: el matcher**, y ahí sí es el «0 duro + excepción» firmado.
2. **`L-425`** — entregada en `docs/relevamientos/S105-B-L425-para-A.md`,
   firmada por el founder **como ley, no como nota**. Número verificado por grep.
3. 🔴 **La cita ambigua de `§6ter` en `DIRECCION_ARTE`, que sigue sin curar** —
   medido: la línea *«§6ter descartó la suya»* está tal cual. **Mi cura vive en
   el fuente `S105-B-LEY-MARCA-AJENA-para-A.md` y no llegó al depósito.** Es
   `§6ter «LA MARCA DE MAPA»`: *un nombre desambigua hoy y sobrevive a un
   renumerado; un numeral solo no hace ninguna de las dos.*

### De **C**
1. **Las DOS cadenas de `sos` del cliente** (*«Sos parte de una familia»* ·
   *«Listo, ya sos parte de la familia»*), y **bajar su baseline en el mismo
   commit**.
2. **Que su CLI de voseo importe de `lib-voz.mjs`** — hasta entonces hay dos
   matchers, y *una copia que diverge sin avisar tiene el peor modo de falla:
   funciona.*

### De la **mesa**
- 🔴 **Los «30 días» de `MODELO_LOGIN` no están firmados**, y su otra mitad
  («borrado duro») **choca con el titular de `P15` y es inejecutable**.
- 🔴 **`MODELO_LOGIN` cita a `P15` diciendo algo que `P15` no dice** — hay que
  curarlo pase lo que pase con lo anterior.

---

## 4 · LO QUE VEO VENIR Y NO ESTÁ PEDIDO

**`packages/ui` no tiene con qué hacer una videollamada.** Medido: cero
`webrtc`/`livekit`/`daily`/`agora`/`twilio`/`jitsi` en **todo** el monorepo.
`ClipSesion` reproduce un archivo grabado; **no es transporte**.

⇒ **La teleconsulta de los tres servicios nuevos no es una pantalla: es un
módulo nativo, y los nativos no viajan por OTA.** *Si esa letra se escribe sin
decidir antes **qué transporte** y **en qué build sube**, la pieza va a existir y
no va a poder llamar a nadie — motor sin puerta, en su forma más cara.*

---

## 5 · LO QUE APRENDÍ, CON SU CASO

**① Un baseline es una afirmación sobre el presente, no una foto.** Puse 8 donde
`origin/main` tenía 0 —lo medí en mi árbol, que estaba viejo— y escribí que
«bajaría cuando entrara el merge de C». **Ya había entrado.** Me frenó C. *Y el
daño era el contrario del que yo temía: un techo por encima no bloquea, **da
permiso**.*

**② El mismo error tiene tres caras, y las tres son «no volví a medir el
objeto»:** por encima da permiso · por debajo bloquea · y un cero solo dice «no
vi, con la lista de hoy» (`L-425`).

**③ Un fixture solo prueba lo que su autor ya sabía.** Mi cura de la trampa ⑧
callaba `elegís` —voseo real— y **mi fixture pasaba 10/10**. *Lo encontró
contrastar contra el instrumento de C, que no compartía mis supuestos.* **Y el
número BAJABA**, que en un lint se lee como progreso.

**④ Una regla sobre una PIEZA es ciega a sus no-consumidores** — `R65` estuvo
verde mientras una superficie mostraba la marca sin pasar por la pieza. *Lo que
cierra ese hueco no es un mecanismo: es censar al entregar la capacidad*
(`L-420`). **Y el censo dio UNO ⇒ la regla no se construyó.** *La condición se
puso antes de medir.*

**⑤ Mi worktree nunca tuvo `node_modules`, y no se notó en ocho turnos** porque
el gate de `tsc` mira consumidores **solo al tocar un paquete compartido**.
*Venía sin poder typechequear mi propio territorio sin saberlo.* ⇒ **un worktree
nuevo se INSTALA**, además del `expo start` que el traspaso anterior ya pedía.

**⑥ No se revierte un fixture con `git checkout` si el archivo tiene trabajo sin
commitear** — me borró una cura. Diez minutos después un `git stash -u` falló al
restaurar, **y ahí el respaldo por copia salvó la tanda**. *La misma lección
cobrada dos veces en un día: la primera costó trabajo, la segunda no costó nada.*

**⑦ El exit code se lee del comando, jamás del pipe** (`L-191`, y me la hice
yo hoy): un `commit` falló y **el `push` encadenado con `&&` corrió igual**,
porque el `&&` leyó el exit del `tail` que había en el medio.

**⑧ Aplicar una orden Y declarar su choque es lo que permite que quien la dio la
revise.** Pasó dos veces: la firma de `packages/api` en «0» contra una medición
de 5, y antes el foco a tinta plena. **Callado, las dos habrían llegado al gate
como defectos sin dueño.**
