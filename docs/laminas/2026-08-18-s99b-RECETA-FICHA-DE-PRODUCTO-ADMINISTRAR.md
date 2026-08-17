# RECETA — LA FICHA DE PRODUCTO EN MODO ADMINISTRAR

**Estatuto:** Toque 1. Bloquea a C. Nace del hallazgo del founder:

> *«si entro a un producto, me deja verlo, pero NO IDENTIFICO FÁCILMENTE
> CÓMO LO EDITO. Me gusta cómo está la vitrina, pero le falta administrar
> el stock.»*

Y de la ley que la mesa sacó de ahí: **administrar tiene que administrar
de verdad, o el interruptor miente.**

---

## §1 · 🔴 LO MEDIDO — Y NO FALTA UNA PANTALLA NI FALTAN CONTROLES

Contra `origin/main`, la ficha **ya existe con sus dos modos**
(`InterruptorEspejo`), **ya tiene ajuste de stock** (`HojaAjusteStock`) y
su anatomía está declarada bajo N17. **No falta nada de eso.**

Lo que sí está medido, y es la causa:

```
{/* ═══ LO QUE ADMINISTRAR AGREGA — ARRIBA, sin tocar lo de abajo ═══ */}
{modo === 'administrar' && <CapaAdministrar sku={pantalla.sku} />}
```

> ## **LOS CONTROLES VIVEN EN UN BLOQUE APARTE, ARRIBA DEL PRODUCTO.**
> El vendedor mira el precio y el stock **abajo**, en la ficha, y los
> controles que los cambian están **en otro lado de la pantalla**. *Por
> eso «lo ve y no encuentra cómo editarlo»: no es que el control falte —
> es que no está donde está el dato.*

**Y la decisión de C que lo produjo es CORRECTA y no se toca:** *«si
administrar cambia la anatomía, el vendedor deja de ver lo que ve la
familia»*. **Las dos cosas son ciertas a la vez, y por eso la salida no
es elegir una.**

---

## §2 · LA LEY, en una línea

> ## **ADMINISTRAR NO AGREGA UN BLOQUE: ENCIENDE EL CONTROL SOBRE EL DATO.**
> El dato se sigue viendo **exactamente** como lo ve la familia. Lo que
> cambia es que **se puede tocar**.

**Y así el espejo se cumple MEJOR que hoy, no peor:** la regla que rige
—*cambiar de modo cambia CÓMO se ve, jamás QUÉ se ve*— **hoy se rompe en
la dirección que nadie miró**, porque un bloque nuevo arriba **sí** es
«qué se ve». *Poner el control encima del dato es la única forma de que
las dos caras tengan la misma anatomía de verdad.*

### La prueba de que es la lectura correcta

Poné las dos caras una al lado de la otra:

| | Ver como cliente | Administrar |
|---|---|---|
| foto · nombre · presentación | igual | **igual** |
| **precio** | `$48,90` | `$48,90` **+ afordance** |
| **stock** | «12 disponibles» | «12 disponibles» **+ afordance** |
| composición · alérgenos | igual | igual |

**Ni una fila de más, ni una de menos.** *Si tapás la columna de la
derecha, no podés saber en qué modo estás — y eso es exactamente lo que
un espejo tiene que lograr.*

---

## §3 · DÓNDE VIVE EL CONTROL, sin romper el renderer único

**El renderer es UNO.** Cada dato administrable se envuelve en la misma
pieza, que **en modo cliente es transparente**:

- **Modo cliente** → el dato, tal cual. Sin caja, sin chevron, sin nada.
- **Modo administrar** → el mismo dato, **tocable, con chevron** (19.7:
  *acción lleva*), y su edición abre donde ya abre hoy (`HojaAjusteStock`
  y su hermana de precio).

**⚠️ Chevron y no lápiz, y es medido contra la casa:** el lápiz existe en
el registry (`lapiz`) pero **la fila que lleva a algún lado usa chevron**
en toda la casa (19.7, `CeldaNavegacion`, la fila del repartidor). *Meter
un segundo vocabulario para «editar» obligaría a aprender dos señales
para el mismo gesto.*

**⛔ Lo que NO se hace:** volver el precio un `Campo` de texto inline. Un
campo abierto en la ficha **cambia la anatomía** (crece, gana borde, gana
teclado) y rompe el espejo por la misma puerta que este documento vino a
cerrar. **La edición vive en su Hoja; la ficha solo abre la puerta.**

### Qué queda del bloque de arriba

**Lo que la familia NO ve en ninguna forma**: estado de publicación,
alcance, propuestas pendientes. *Eso no tiene dato espejado sobre el cual
apoyarse, así que necesita su lugar* — y ahí el bloque es correcto. **Lo
que sí tiene espejo (precio, stock) baja a su dato y el bloque adelgaza.**

---

## §4 · 🔴 LA BANDA DE PRECIO — DOS ESTADOS DEL MISMO CONTROL

Firmado por mesa: **libre dentro de ±15 % de la referencia · fuera de la
banda, propone y espera.**

> **Es UN control con DOS resultados, jamás dos controles.** Si el
> vendedor tuviera que elegir entre «cambiar» y «proponer», le estaríamos
> pidiendo que sepa de antemano de qué lado de la banda cae — que es
> justo la cuenta que la app tiene que hacer por él.

### Los tres estados, y ninguno puede verse igual que otro

| estado | qué pasa al confirmar | qué DICE el control |
|---|---|---|
| **dentro de la banda** | cambia **ya** | el rango disponible, antes de tocar: *«podés moverte entre $X y $Y»* |
| **fuera de la banda** | queda **PROPUESTO** | lo dice **ANTES** de confirmar (Ley 23: la puerta no ofrece lo que va a rechazar) — *no rechaza: cambia de resultado, y eso se avisa* |
| **sin referencia (`NULL`)** | todo va a aprobación | *«todavía no calibramos este producto»* |

### 🔴 Y LO QUE ROMPE LA CONFIANZA HOY: LO PROPUESTO TIENE QUE QUEDAR VISIBLE

*El vendedor pide otro precio y no pasa nada visible.* Un cambio que se
acepta y desaparece **se lee como que se perdió** — y la segunda vez, el
vendedor deja de pedir.

⇒ **la propuesta pendiente vive EN LA FICHA, sobre el precio**, con su
propia voz: *«Propusiste $Z · en revisión»*. **No es un aviso que pasa:
es un estado del dato**, y se va cuando el veredicto llega.

### ⚠️ El `NULL` no puede leerse como «no hay límite»

**Es la trampa exacta de `AvisoAlergia`**: el silencio se lee como
permiso. Sin referencia el control **no muestra rango** —no hay— pero
**dice que no lo hay y qué implica**: *todo cambio pasa por aprobación.*
*Un control que se ve «libre» y después manda todo a revisión miente dos
veces: al ofrecer y al confirmar.*

---

## §5 · TU TIENDA — sus dos secciones bajo la gramática ya escrita

La gramática de sección (S99-B) aplica sin enmienda: **cada sección
declara su estado en su encabezado, y las filas no cambian.**

```
◌  Tu tienda                          ← isotipo + NOMBRE DE LA PANTALLA
   [ Administrar ⇄ Ver como cliente ]  ← el interruptor, entre ① y ②

   TU VITRINA               6 productos · 2 sin precio
   …

   TU LOCAL                 3 cortes · 2 repartidores · sin dirección
   …
```

- **El isotipo vuelve al techo** — *«el techo de Tu vitrina no tiene
  isotipo»*: es §1 de la gramática del techo, que ya estaba escrita y no
  se había aplicado acá.
- **El interruptor vive entre la identidad y el contenido**, su piso ya
  declarado (§4 de esa misma gramática).
- ☠️ **Venta de mostrador sale**: vive en ATENDER como capacidad.

---

## §6 · LO QUE ESTA RECETA NO DECIDE

1. **El ±15 % y el flujo de aprobación** — son de motor y de producto.
2. **Las voces exactas** — del riel.
3. ✅ ⏪ **El portador del fundido de modo — YA ESTÁ CONSTRUIDO** (S99-B,
   posterior a esta receta): nace **`Fundido`**, y **reemplaza al
   `<View key={modo}>` del consumidor**, porque hace las dos cosas
   —remonta y funde— y así C deja de tener que acordarse de la primera.
   *150 ms, cero desplazamiento: nada viajó, la misma superficie pasó a
   decir otra cosa; moverla sugeriría que llegó de algún lado.* C frenó
   bien al no improvisarlo — esta era la pieza que faltaba, y era mía.
4. **El ojo**, con su pregunta: *en Administrar, ¿te das cuenta de que el
   precio se toca sin que nadie te lo diga?* **Si hace falta buscarlo, el
   control sigue sin estar donde está el dato.**
