# PEDIDO DE C → B · Dos primitivas para la configuración de la despensa (§8.6bis)

> **Regla S54/76(b):** texto autocontenido. Origen: `MODELO_DESPENSA`
> §8.6bis (v2.4, 13-ago-2026). C no clona ni envuelve piezas de ui
> (Ley 11); estos son los contratos exactos de consumo. La forma final es
> de B y el gate visual del founder.

## B-1 · `Insignia` familia `estado` gana `onPress` (ensanche, no pieza nueva)

**El caso:** §8.6bis ⑥ — el estado del negocio (`en revisión` → `activa`)
*«se muestra con un chip chico arriba, y el chip abre un modal que explica
qué significa»*.

**El precedente es de B y calza exacto:** S85-B24 le dio `onPress` a la
familia `distincion` con este argumento — *«el emblema no acciona: ABRE SU
PROPIA EXPLICACIÓN… la diferencia entre un control y una nota al pie
tocable»* — y dejó el ensanche **acotado a `distincion` a propósito**
(«una prop sin consumidor decora»). **El consumidor de la familia `estado`
acaba de nacer**: el chip de estado de `/ventas/configuracion`.

**Contrato pedido:** `onPress?: () => void` opcional en la familia
`estado`, con la misma letra que el de `distincion`: sin `onPress` sigue
siendo `View` con `role="text"`; con él, target táctil mínimo y rol
adentro de la pieza (no en el consumidor). Nada más — etiqueta, tamaños y
variantes quedan como están.

**Interim declarado en C (muere al llegar el ensanche):** `Insignia
estado` sin press + `Boton sinCaja` «¿Qué significa?» al lado, abriendo
la misma Hoja. El swap es una línea.

## B-2 · El deslizador de RADIO en km (¿pieza nueva o ensanche de `SliderPrecio`?)

**El caso:** §8.6bis ③ — cobertura **por radio**: km desde la ubicación
del negocio, **default 15 · máximo 50**. Regla del teclado (§15b.4, rige
en ambas apps): esto se DESLIZA, no se digita.

**Lo que hay y por qué no alcanza:** `SliderPrecio` es de plata — pasos
de $0.25, valor en mono con signo de moneda. Un radio no es un precio y
forzarlo sería un dato vestido de otro.

**Contrato pedido (nombre y forma final de B — si B prefiere generalizar
`SliderPrecio` a un slider con unidad, L-175 manda y C consume igual):**

- `valor: number` · `onCambio: (v: number) => void`
- `minimo: 1` · `maximo: 50` · `paso: 1` (los tres por prop — el CHECK
  1..50 vive en el motor, la pieza solo no ofrece más)
- `sufijo: 'km'` — el valor se muestra en mono con su unidad
- `registro`/acento como `SliderPrecio` lo resuelva hoy (oficio en el
  prestador)
- deshabilitado mientras guarda, como toda pieza de formulario de la casa

**Cuándo lo consumo:** el cuarto ③ se monta cuando A entregue
`coberturaVendedor`/`definirRadioCobertura` (pedido a A del mismo día) —
la pieza puede llegar antes o después; no se bloquean entre sí.

## Lo que C NO pide (medido, para que no parezca hueco)

`SelectorOpcion` cubre el método de entrega (②: envío / retiro / las
dos) · `Interruptor` cubre activar familias (①) y la marca «reparte» del
equipo (⑤) · `Hoja` + `Texto` cubren el modal del estado (⑥) ·
`BuscadorDeLugar`/`PinMovible` ya existen si la cobertura necesitara
corregir el centro (no lo pide §8.6bis — la ubicación es la de la bodega).
