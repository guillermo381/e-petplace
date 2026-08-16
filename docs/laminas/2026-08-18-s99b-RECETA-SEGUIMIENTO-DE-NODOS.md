# RECETA — EL SEGUIMIENTO: NODOS, RANGO Y MAPA

**Estatuto:** Toque 1. **Las piezas ya existen** (`EscaleraEstados` migró a
nodos, `PinEnMapa` tiene su variante `destino`, `cuandoLlega` ya oculta
con desvío). Lo que faltaba es **la composición y sus fronteras**.

**El mecanismo, firmado por el founder sobre las capturas:** *círculos
unidos por una línea que se rellena, y un círculo puede llevar un ÍCONO
adentro, así que cada etapa dice QUÉ ES sin texto.* Y mi diagnóstico que
lo sostiene: **una barra solo puede decir cuántas van, porque no tiene
adentro.**

---

## §1 · 🔴 LA FRONTERA SON LAS 7 NARRATIVAS — Y SON 4 NODOS, NO 7

**Medido, no supuesto** (`_despensa-comun.ts:313`): las narrativas son
`pagando · confirmado · preparando · en_camino · entregado · no_llego ·
cancelado`.

> ## **UNA NARRATIVA NO ES AUTOMÁTICAMENTE UN ESCALÓN.**
> La frontera de la escalera son las 7 —jamás los 30 estados internos—,
> pero **tres de las 7 no son pasos de un camino.**

| narrativa | ¿nodo? | por qué |
|---|---|---|
| `pagando` | **NO** | es **antes** de que exista una promesa. Dibujar la escalera ahí **prometería un recorrido que todavía no arrancó** |
| `confirmado` · `preparando` · `en_camino` · `entregado` | **SÍ** | son el camino |
| `no_llego` · `cancelado` | **NO** | son **DESVÍO**, y la pieza ya los trata como banda que **SUSTITUYE** la escalera |

**⇒ CUATRO nodos.** *Y el desvío no es un quinto nodo por una razón que
ya está escrita en la pieza: un camino que se cortó no avanzó un
escalón — pintarlo como paso diría que algo se completó.*

---

## §2 · LOS ÍCONOS: EL MECANISMO ESTÁ CONSTRUIDO, EL ARTE NO EXISTE

**Censo del registry, por las DOS vías con el mismo conjunto: 46 glifos**
(la unión del tipo da 49 e incluye `capa`/`aa`/`tinta`, que son
`registro` y no glifos — por eso las dos vías se cotejan, no se suman).

> 🔴 **Ninguno de los 46 sirve para los cuatro nodos.** No hay caja ni
> paquete, no hay visto, y la **moto no es un glifo del registry** — es
> **marca de mapa**, clase aparte por §6ter.

**Lo que NO se hace:** torcer un glifo existente. `despensa` es la
tienda, `hogar` es la casa del dueño en la app, `ubicacion` es un lugar.
*Un glifo que se usa para lo que no es enseña mal dos veces: en el nodo y
en su casa original.*

**Lo que sí:** los cuatro entran por **§6b (hoja de contacto, gate POR
ÍCONO)**, y el pedido ya se puede escribir con su clase declarada —que es
el paso 6 de §6b:

> **SON GLIFOS DE CONTROL** (Ley 9, alcance S98: *«en un glifo de control
> no hay mascota, hay interfaz; la huella se reserva para donde
> significa»*). **Y acá no es una preferencia: es lo único que sobrevive.**
> El nodo mide 20 y sostiene un glifo de **12** — a 12 px la huella no es
> ruido, es una mancha. *Ley 9 mide a 21 y ya ahí «sobrevive o es ruido».*

**Los cuatro conceptos, con su riesgo declarado:**

| nodo | concepto | riesgo |
|---|---|---|
| confirmado | el pedido tomado | se confunde con «entregado» si es un visto |
| preparando | la bolsa armándose | se confunde con «despensa» (la tienda) |
| en_camino | el movimiento | **no puede ser una moto** — ésa es marca de mapa |
| entregado | la puerta | se confunde con `hogar` |

**⚠️ Y v1 NO se bloquea por esto:** `icono` es SLOT **opcional** en la
pieza. **Sin ícono la escalera funciona entera** —nodos, conector que se
rellena, paso nombrado, rango—; los íconos son el enriquecimiento que
hace que cada etapa diga qué es *sin texto*. *Construir el mecanismo y
esperar el arte es el orden correcto; el revés sería arte sin dónde
montarse.*

### ✅ ⏪ LOS CUATRO YA ESTÁN DIBUJADOS (S99-B) — el slot dejó de estar vacío

`nodoConfirmado` · `nodoPreparando` · `nodoEnCamino` · `nodoEntregado`,
en el registry, **sin huella** (control) y **GATE POR ÍCONO PENDIENTE**.
R30 pasó a vigilar **64 paths** (eran 57).

**🔴 VAN EN MASA Y NO EN TRAZO, y el número lo decide:** el nodo mide 20
y sostiene 12 ⇒ el `viewBox` de 24 se escala a la mitad y **`TRAZO` 1.9
llega como 0.95 efectivo**. A esa fineza un contorno no dibuja: susurra.
*Es §6ter con otra causa —allá el trazo moría por el FONDO, acá muere por
el TAMAÑO— y por eso la conclusión coincide.* **Precedente y no
invención:** `ia` ya es masa pura.

**La regla que los ordena: a 12 px no sobrevive el detalle interior,
sobrevive la ORIENTACIÓN.** Por eso se separan por eje antes que por
contenido — **bolsa ▮ vertical · caja ■ cuadrada · flecha ▶ horizontal ·
visto ✓ diagonal**.

**Dos decisiones dentro del set:**
- **el visto se RESERVA para `entregado`** — era el candidato obvio de
  «confirmado» (el riesgo que esta receta ya había declarado) y se le
  niega: *`entregado` es el único de los cuatro que COMPLETA algo, y un
  visto en el primer nodo diría que el camino terminó cuando recién
  empieza*;
- **`en_camino` no es una moto** (§6ter): el mapa la usa para decir
  DÓNDE, y acá diría EN QUÉ ETAPA — *el mismo objeto significando dos
  cosas en la misma pantalla.*

**Y se montan DONDE VIVEN:** la galería los pone **adentro de una
`EscaleraEstados` real a 12 px**, con una fila de control a 21 que **no
es donde se juzga**. *Es lo que la moto costó dos veces en esta misma
sesión: un glifo aprobado en lámina limpia se cae al llegar a su tamaño.*
Y por **L-255**: firmada una silueta, lo que cambia después es el
TRATAMIENTO, jamás la silueta.

**⏪ De paso, la demo de la galería mentía y quedó curada:** montaba
SIETE pasos rotulados «las siete narrativas», con `pagado`, `empacado` y
`despachado` —que son **estados internos**— adentro. *Enseñaba un camino
de siete que el producto no tiene.*

---

## §3 · EL RANGO — Y LA PIEZA YA LLEGÓ ANTES QUE ESTA RECETA

`promesa_entrega_desde/hasta` **ya está poblado**, así que esto se
escribe sobre dato real y no sobre una promesa de dato.

- **RANGO, jamás el minuto.** *Un minuto exacto es una promesa que la
  calle no puede sostener; un rango es la verdad que el motor tiene.*
- **Con desvío NO se muestra.** Verificado en la pieza
  (`cuandoLlega !== undefined && desvio === undefined`), con la razón ya
  escrita adentro: **sería prometer una entrega que ya no va a pasar.**
- **La voz es de máquina** (mono, Ley 3) y **la compone la pantalla**: la
  pieza no formatea horas.

---

## §4 · EL MAPA — Y SOBRE TODO LO QUE **NO** SE COPIA

**Lo que se muestra, y nada más:**
- **El pin de DESTINO** (`PinEnMapa variante="destino"`), ya construido
  con la física del mundo (§6ter) y **la luz corregida** de esta misma
  sesión.
- **La moto**, y **solo con `en_camino`**. *Antes de que salga no hay a
  quién seguir, y un pin quieto en el local durante media hora se lee
  como que algo se colgó.*

**Lo que NO se copia de la referencia, con su razón cada uno:**

| ⛔ | por qué |
|---|---|
| el **pin de marca del comercio** | el mapa es el MUNDO (§6ter), no una vitrina. *Poner la marca donde el ojo busca «dónde está mi pedido» es cobrarle atención al cliente por algo que no preguntó* |
| el pin de **«entrega de otro pedido»** | 🔴 **es dato de OTRA PERSONA en la pantalla de alguien.** No es una decisión de diseño: es la línea de privacidad, y no se cruza para decorar un mapa |
| las **tarjetas apiladas** sobre el mapa | compiten con lo único que el mapa tiene que decir. *Si hay que apilar tarjetas encima, el mapa no era la respuesta* |

---

## §5 · LA COMPOSICIÓN, en orden

```
┌──────────────────────────────┐
│                              │
│        EL MAPA               │  ① destino · moto solo en_camino
│                              │
├──────────────────────────────┤
│  ●━━━●━━━○───○   14:00-16:00 │  ② escalera compacta + rango
│  En camino                   │  ③ el paso nombrado
└──────────────────────────────┘
```

**El mapa preside y no se comparte el protagonismo** — de ahí que no haya
tarjetas encima. La escalera vive **debajo**, en su registro `compacta`,
que es el que la pieza hizo para una fila. **Con desvío**, la banda
sustituye a la escalera y el rango desaparece: *la pantalla deja de
contar un viaje y pasa a contar qué pasó.*

---

## §6 · LO QUE ESTA RECETA NO DECIDE

1. **Los cuatro glifos** — se piden por §6b y los firma el ojo, por
   ícono. Hasta entonces, nodos sin ícono.
2. **El zoom y el encuadre del mapa** — depende del track real.
3. **El ojo**, con su pregunta: *mirando la pantalla dos segundos, ¿sabés
   en qué etapa está tu pedido sin leer una palabra?* **Si hace falta
   leer, los íconos dejan de ser enriquecimiento y pasan a ser
   precondición** — y eso cambia su prioridad, no su proceso.
