# S88-A · MEDICIÓN — ¿cuánto espacio queda en cada techo para la campana?

> **Pedido de la mesa: medir, NO construir.** Todo lo de acá sale del objeto
> (los dos archivos de composición + los tokens), no de la prosa.

---

## ⚠️ PRIMER HALLAZGO: **R12 no mide lo que la pregunta supone**

```
RESPIRO_BANDA = spacing[14] = 56dp   // el aire al pie del degradado
SOLAPE_RECO   = spacing[8]  = 32dp   // cuánto SUBE la tarjeta sobre la banda
```

**R12 es un presupuesto VERTICAL** — vigila que la tarjeta de recomendaciones
no suba más de lo que el techo deja libre abajo. **La esquina superior derecha
no entra en ese presupuesto ni lo consume.** *La pregunta «¿un ícono más entra
en ese presupuesto?» no tiene respuesta porque el presupuesto es de otro eje.*

**Lo que sí gobierna la esquina no tiene guard.** Ese es el dato.

---

## ① CLIENTE — el Hogar (composición local, sin `Encabezado`)

**El techo:** `paddingTop: insets.top + 20` · `paddingHorizontal: 20` ·
curva 44/26.

**El único tocable, medido:**

```
Coach   position: absolute
        top: insets.top + 12   ·   right: 12
        44 × 44                ·   hitSlop: 10
        (el disco visible adentro es 42×42)
```

**Ocupa** el borde derecho de **12 a 56**. **Su zona táctil**, con hitSlop, va
de **2 a 66**.

### 🔴 El choque de zonas táctiles — el número que decide

Una campana a su izquierda con separación `spacing[2]` (8dp) iría a `right: 64`
(ocupa 64–108) y **su zona táctil arrancaría en 54**.

```
Coach   táctil:  2 ─────────── 66
campana táctil:            54 ─────────── 118
                           └── 12dp SOLAPADOS ──┘
```

**Un toque en esa banda de 12dp es ambiguo** — React Native lo resuelve por
orden de render, no por intención. **La separación mínima para que las dos
zonas no se pisen es 20dp** (hitSlop 10 + hitSlop 10), lo que pone la campana
en `right: 76`, ocupando **76–120**.

### 🔴 El segundo hallazgo: **los íconos absolutos no reservan espacio**

El texto del techo —fecha en mono (sm) **sobre** saludo (lg)— vive en el flujo
normal con `paddingHorizontal: 20`, y **el saludo NO tiene `numberOfLines`**:
envuelve.

> **Los tocables son `position: absolute`: el texto no sabe que están ahí.**
> Hoy un ícono de 44 se tolera porque los saludos son cortos; **dos íconos
> convierten 120dp del borde derecho en zona muerta**, y que el texto la
> invada pasa a depender del **largo del nombre y del idioma** (`en` es más
> largo: *"Good morning, Guillermo"*).

**Esto NO se puede cerrar sin dispositivo:** qué cadena exacta desborda es
medición de pantalla real, no de código. **Lo que sí está medido es que hoy no
hay nada que lo impida** — ni `numberOfLines`, ni padding derecho reservado,
ni guard.

---

## ② PRESTADOR — `TechoOficio`

**El techo:** `paddingTop: insets.top + 16` · `paddingHorizontal: 20` ·
`gap: 16` entre bloques.

**La fila superior, medida:**

```
flexDirection: 'row' · alignItems: 'center' · gap: 12
   ├── <Isotipo size={26}>          26dp fijos
   └── <View style={{flex: 1}}>     TODO lo que queda
          ├── título (saludo)   xl · numberOfLines={1}
          └── fila: nombre del negocio (flexShrink:1) + Insignia de cohorte
```

### 🔴 **No hay slot derecho. La columna `flex: 1` consume hasta el padding.**

Meter la campana en esa fila **le quita ancho al título**, que ya tiene
`numberOfLines={1}` y ya comparte línea con una insignia que el propio código
declara prioritaria (*«entre truncar el nombre propio y truncar una insignia de
dos palabras, se trunca el que el prestador ya conoce de memoria»*).

**El costo, en dp, sobre anchos reales:**

| pantalla | ancho útil hoy | con campana (44+12) | pérdida |
|---|---|---|---|
| 360dp (chico) | 282 | **226** | −20% |
| 393dp (Pixel) | 315 | **259** | −18% |
| 412dp | 334 | **278** | −17% |

*Y la pérdida cae entera sobre el título, porque el Isotipo es fijo.*

**La otra vía —absoluta, como en el cliente— es posible**, pero entonces el
techo del prestador **hereda el problema del cliente**: un tocable que el texto
no sabe que existe, sobre un título que **sí** trunca a una línea.

---

## ③ LO QUE LA MEDICIÓN DEJA SOBRE LA MESA

**Las tres opciones que nombraste, con su costo medido:**

| opción | cliente | prestador |
|---|---|---|
| **fila de dos** (campana a la izquierda del Coach) | exige `right: 76` y **20dp de separación**, no 8 — y estira la zona muerta a 120dp | no aplica: no hay fila absoluta, habría que crearla |
| **campana a la izquierda** (misma esquina) | idem arriba | −18% del título en la fila `flex` |
| **mudanza del Coach** | libera la esquina entera; el Coach es «el único tocable artesanal del Hogar» (D-401) y tiene `usePresionado` propio | no aplica |

**Y una cuarta que la medición sugiere y la mesa no nombró:** en el prestador,
**la fila superior ya tiene un tocable inline** —la `Insignia` de cohorte— que
convive con el texto **sin ser absoluto**. *Si la campana entrara por ahí, el
layout la contaría en vez de ignorarla.* No la propongo: la traigo porque es
la única forma medida en que un segundo tocable YA convive en ese techo.

> **Lo que ninguna opción resuelve sola, y conviene decidir con ella:** hoy
> **ningún guard vigila la esquina**. R12 mira el eje vertical. Si la mesa
> elige una fila de dos, el número que hay que congelar en un guard es la
> **separación ≥ 20dp** — es la única de todas estas que produce un defecto
> *silencioso* (un toque que abre lo que no era).
