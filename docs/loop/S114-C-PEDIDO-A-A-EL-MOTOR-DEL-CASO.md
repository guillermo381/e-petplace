# S114-C · PEDIDO A A — EL MOTOR DEL CASO, Y QUÉ NECESITA CADA PANTALLA

> | | |
> |---|---|
> | **De** | pista C (`apps/*`), rama `pista/s114-c-1.0` |
> | **Para** | pista A (DB · `packages/api`) — **lo reparte el founder, las pistas no se escriben entre sí** |
> | **Medido contra** | `main` @ `c72ea582` + `pista/s114-b-1.0` @ `2253bd62`, el 7-sep-2026 |
> | **Fuente de la forma** | `LETRA_POSTVENTA` (firmada) y las props de las ocho piezas de B. **Nada acá lo inventé yo**: cada campo tiene su renglón en una de las dos. |

---

## 🔴 LO PRIMERO, PORQUE CAMBIA EL ORDEN DE LA SESIÓN

**El motor del caso NO EXISTE.** Medido, no supuesto:

```
grep -rln "casos_postventa\|caso_mensajes\|abrir_caso\b\|resolver_caso\|saldo_hogar" \
     supabase/migrations/ packages/api/src/      ⇒  0 archivos
```

Lo que A entregó y **sí** está vivo: `cat_motivos_postventa` · `cat_motivos_herencia` ·
`v_motivos_resueltos` · `_motivo_pertenece_al_objeto` · el wrapper `postventa-motivos.ts`.
*(Los hits de `abrir_caso` en el repo son `abrir_caso_clinico`, de S70 — otro sujeto.)*

**Consecuencia para C, dicha sin maquillar:** de los ocho ítems del mandato de C, **C1 y la
primera mitad de C2 se pueden construir hoy** (la puerta y la elección del motivo, que lee el
catálogo real de A). **C3 a C8 no tienen a qué llamar.** No los construyo contra una API
inventada: si la firma no coincide, el trabajo se rehace entero y además compila, que es la
peor forma de estar mal.

---

## ① EL HUECO QUE NINGUNA DE LAS DOS LETRAS VIO — **el motivo no tiene glifo**

`SelectorMotivo` de B declara `glifo: IconoNombre` **obligatorio** (§2: *«cada uno con su
glifo»*). `v_motivos_resueltos` devuelve `codigo · clase · urgente · voz · pide_foto ·
procedencia` — **sin glifo**. Las dos piezas están bien por separado y no encajan.

**Voto de C, y lo argumento en vez de tomarlo:** el glifo **NO va a la tabla**. Un glifo es
vocabulario de diseño (`IconoNombre` del registry de B, Ley 12) y meterlo en una fila de
catálogo lo pone fuera del alcance de `verify:diseno` y del gate por ícono. **C lo mapea en
`apps/cliente`** con un `Record` total sobre los códigos de la letra, y **un código nuevo en
el catálogo que el mapa no conozca tiene que doler**: cae a un glifo neutro y el gate lo
nombra. *Un mapa parcial que cae en silencio es cómo un motivo nuevo se dibuja igual que
otro y nadie se entera.*

**Lo que le pido a A: nada de código — sólo que ratifique o corrija ese voto**, porque si el
glifo va a la fila, el mapa que voy a escribir es deuda desde el día uno.

---

## ② LO QUE NECESITA CADA PANTALLA, EN ORDEN DE BLOQUEO

Cada fila nombra **la pantalla que se destraba** y **el renglón de la letra** que la pide.
Los nombres de wrapper son propuestas: lo que no se negocia es el **dato**.

### C1 · LA PUERTA — `¿hay un caso abierto sobre este objeto?`

```ts
obtenerCasoDeObjeto(objeto: ObjetoPostventa, objetoId: string)
  : ResultadoWrapper<{ casoId: string; etapa: EtapaCaso; vozEstado: string } | null, 'error_lectura'>
```

- **Sin esto, la puerta hoy es correcta igual** y por eso C1 se construye ya: mientras no
  exista `abrir_caso`, **no puede haber ningún caso abierto**, así que el estado `casoAbierto`
  de la pieza es inalcanzable por construcción y `disponible` / `fueraDeVentana` cubren todo.
  **Es un verde por ausencia de sujeto y lo declaro como tal** — el día que nazca el primer
  caso, esta llamada es una línea y sin ella la puerta empieza a mentir.
- La ventana de 7 días (§1) **la computa C** desde la fecha de cierre que las tres pantallas
  ya tienen. **No la quiero del servidor** salvo que A prefiera lo contrario: si el corte vive
  en dos lados, un día divergen.

### 🔴 C1bis · **`cerrado_en` POR OBJETO** — nuevo, y lo destapó la ratificación de la mesa

```ts
// en el lector de cada objeto, junto a lo que ya devuelve:
cerrado_en: string | null   // el instante en que el objeto TERMINÓ, sea como sea que terminó
```

**Por qué no alcanza con lo que hay.** La ventana de 7 días cuelga del cierre, y cada objeto lo
expone distinto: la cita tiene `cerrada_en`, la estadía tiene `entregadaEn`… **y el pedido no
tiene ninguno para las dos formas de terminar mal.** `envio.entregado_en` es `null` cuando el
pedido **nunca se entregó**, que es exactamente lo que pasa en `no_llego` y en `cancelado` — o
sea **las dos fallas de clase 1 del catálogo** (`no_entregado` y `cancelado_vendedor`).

*Anclado en la entrega, la puerta se abría para todo menos para los casos en que el motor ya
sabe que a la familia le fallaron.* Lo encontré porque la mesa ratificó que **«todo lo que la
letra llama caso entra por ahí, sin excepción»**: sin esa frase, el hueco se lee como una rama
más del ternario y no como una excepción.

**Mientras tanto C ancla en `actualizado_en`** (verificado: `v_pedidos_narrativa` lo expone,
migración `20260811220000` línea 254). **Es una aproximación y está declarada en el código**: es
la última escritura de la fila, no el instante en que terminó. Se eligió **el error que ABRE y
no el que cierra** — si la ventana queda de más, el motor rebota `fuera_de_ventana` y la familia
lee un no con su razón; si queda de menos, se queda sin la puerta **y de eso no se entera
nadie**.

---

### C2 · CONTAR QUÉ PASÓ — **el acto que crea el caso**

```ts
abrirCaso(p: {
  objeto: ObjetoPostventa; objetoId: string; motivo: string;
  relato?: string;                       // lo que la familia escribió o dictó
  procedencia?: 'ia_intake'; modo?: 'texto' | 'voz';
  resumenConfirmado?: string;            // §11: lo que la familia CONFIRMÓ, no lo que propuso el modelo
  fotoUrl?: string | null;
}): ResultadoWrapper<{ casoId: string; etapa: EtapaCaso; claseResuelta: 1 | 2 | 3 },
   'fuera_de_ventana' | 'motivo_no_pertenece' | 'caso_ya_abierto' | 'objeto_no_es_tuyo' | 'mascota_en_memorial'>
```

- 🔴 **`claseResuelta` viene de la fila, jamás del cliente** (§4). C no la manda y no la puede
  mandar: el tipo no la acepta.
- 🔴 **`caso_ya_abierto` tiene que devolver el `casoId` del que ya existe.** Es `L-424` literal:
  *un guard que sólo sabe negarse manda a «probá de nuevo» sobre algo que va a fallar siempre*.
  Con el id, la pantalla lleva al caso en vez de decir que no.
- **`mascota_en_memorial` lo pido aunque la pieza ya devuelva `null`**: el guard de la pantalla
  protege a quien mira, no a quien llama. Si mañana entra otro caller, la ley de la casa tiene
  que vivir en el motor.

### C3 · LA PANTALLA DEL CASO — el hilo

```ts
leerCaso(casoId): ResultadoWrapper<{
  etapa: EtapaCaso; final?: { tipo: FinalCaso; etiqueta: string };
  objeto: { tipo; id; titulo; fecha; fotoUrl };          // CabeceraCaso de B
  contraparte: { nombre; fotoUrl } | null;
  cerrado: boolean;                                       // la barra pasa a lectura (§3.3)
  accionPendiente?: { tipo: 'elegir_devolucion'; ... };   // UNA a la vez (§3.3)
}, 'no_existe' | 'no_es_tuyo'>

leerMensajesDeCaso(casoId, cursor?): ResultadoWrapper<{ mensajes: MensajeCaso[]; cursor: string | null }, ...>
enviarMensajeDeCaso(casoId, texto): ResultadoWrapper<{ mensajeId }, ...>
```

- **`MensajeCaso` necesita tres asientos** (§3.3): `autor: 'familia' | 'prestador' | 'casa'` +
  `nombre` + `fotoUrl`, y `tipo: 'mensaje' | 'hecho'` para los centrados.
- **Paginado con cursor, no offset.** N16 pide abrir 200 mensajes en un viaje de 50; con
  offset, la página siguiente se saltea filas cuando llega uno nuevo — **es el defecto exacto
  que S99 midió en la línea de vida** (55 de 62). Cursor compuesto `valor|id`.
- **El primer mensaje lo escribe la casa al abrir** (§3.3: *«no hay hilo vacío»*) ⇒ lo escribe
  `abrirCaso`, no la pantalla.

### C4 · LA ELECCIÓN DE LA PLATA

```ts
leerOpcionesDeDevolucion(casoId): ResultadoWrapper<{
  montoCentavos: number; vozMonto: string; parcial: boolean;
  banco: { disponible: boolean; tiempo: string; manual: boolean };  // manual ⇒ la voz NO promete fecha (§4)
  saldo: { disponible: boolean; tiempo: string };
}, ...>

elegirDestinoDevolucion(casoId, destino: 'banco' | 'saldo')
  : ResultadoWrapper<{ estado: 'aplicado' | 'en_camino_manual' }, 'ya_elegido' | ...>
```

- 🔴 **`manual` tiene que venir del servidor**, porque depende de la ventana del riel (Nuvei
  mismo día · DeUna 24 h, §6) y **la pantalla no puede saberlo**. Si C lo dedujera de la fecha,
  prometería una fecha que el motor no cumple — que es lo único que §4 prohíbe con todas las letras.
- **`vozMonto` redactado por el servidor** incluido el porqué del parcial: la pieza lo recibe
  entero y no compone.

### C7 · NEGOCIOS · la bandeja

```ts
obtenerCasosDelPrestador(): ResultadoWrapper<CasoEnBandeja[], ...>   // la forma la fija FilaBandejaCaso de B
responderCaso(casoId, texto) · reconocerYResolver(casoId, { alcance, montoCentavos?, destino }) · pedirACasa(casoId)
```

### C8 · NEGOCIOS · el Hoy

```ts
obtenerServiciosSinCerrar(): ResultadoWrapper<{
  cantidad: number;
  vencidos: { objetoId; titulo; fecha }[];   // los que ya pasaron 48 h (§2 · F1)
}, ...>
```

- **Depende de F1 entero** (las dos ventanas + el cron + `no_ejecutado`). **Es el ítem más
  bloqueado de C** y el único del mandato que además mueve plata: la línea de las 48 h le dice
  al prestador que **no se cobra**, y eso tiene que ser verdad en el ledger antes de decirlo.

---

## ③ LO QUE C **NO** LE PIDE A A, PARA QUE NADIE LO CONSTRUYA DOS VECES

- **La ventana de 7 días** — la computa C (ver C1), salvo que A vote lo contrario.
- **El glifo del motivo** — voto de C: vive en la app (①).
- **Las voces de las cinco etapas** (`voces: Record<EtapaCaso, string>` de `EscaleraCaso`) —
  son i18n de C. **La `vozEstado` de abajo NO**: la letra la quiere con el plazo adentro
  (*«responde antes del jueves a las 14:00»*) y ese dato es del motor.
- **La escalera del prestador y la de la familia no dicen lo mismo** (B lo dejó escrito: la
  pieza recibe la línea entera). Si A devuelve una sola `vozEstado`, C necesita saber **para
  qué asiento** viene, o dos campos.

---

## ④ LO QUE C ENTREGA MIENTRAS TANTO

1. **C1 · la puerta** montada en los tres objetos, con memorial y la ventana resueltos.
2. **C2 · la elección del motivo** sobre el catálogo REAL de A (`obtenerMotivosDeObjeto`),
   con el campo N11, el dictado y la tarjeta de confirmación — **hasta el borde de `abrirCaso`**.
3. El mapa `codigo → glifo` con su gate, si A ratifica el voto de ①.

*Lo demás queda escrito acá y sin una línea de código, a propósito.*
