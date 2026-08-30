# S107-C · **AUDITORÍA ÍTEM POR ÍTEM** — en qué estado real está cada reporte del founder

> Pedida por el founder: *«sin esa lista los dos estamos adivinando»*. Medida el 29-ago contra
> `origin/main` con `git merge-base --is-ancestor`, **no contra mi rama**.

## 🔴 EL LÍMITE DE ESTA AUDITORÍA, primero

**No pude leer el ancla del bundle `d8e9c922`.** `eas update:view` desde este worktree rebota
por flags/versión del CLI. ⇒ **la columna «en el teléfono» NO la puedo llenar yo**, y no la
invento.

**Lo que sí sé con certeza:** *«en main» es condición NECESARIA para estar en el teléfono.*
Todo lo que diga **RAMA** abajo **con seguridad NO está** en tu bundle. Lo que diga **MAIN**
está en el teléfono **si y sólo si A publicó después de ese merge** — y eso lo sabe A.

---

## LA LISTA

| # | lo que reportaste | estado | dónde |
|---|---|---|---|
| 1 | chips de mascota sin foto en el hub | ✅ **MAIN** | la foto tenía **dos** mitades rotas: faltaba `fotoUri` y `rutaImagen` recibía el path privado |
| 2 | falta el log en el hub | ✅ **MAIN** | lista + pestañas + vacío firmado |
| 3 | el vacío del log | ✅ **MAIN** | y con su hermano honesto para «no pudimos preguntar» |
| 4 | especie sin oferta | ✅ **MAIN** | causa del server; el pez y el gato son **casos distintos** y el motor los separa |
| 5 | **paquete con saldo en el hub** | 🔴 **NO EXISTE** | **bloqueado en A**: no hay lector de bonos de guardería |
| 6 | pantalla 2 mostraba lugares antes de elegir | ✅ **MAIN** | secuencia partida en dos |
| 7 | falta la vitrina del prestador | ✅ **MAIN** | `PreviewPrestador`, la pieza de sus cuatro hermanas |
| 8 | el carnet no se entiende como tocable | ✅ **MAIN** (`52fcef05`) | el chevron era de B (curado) + el fondo blanco, mío |
| 9 | **no se puede pagar en el detalle** | 🟡 **EN MI RAMA** ⏪ *decía MAIN y estaba vencido* | **lo rompí yo, y la cura se PERDIÓ EN UN MERGE**: la prop `onAbrir` sobrevivió en la pieza y su paso en el consumidor no. **Re-hecha el 29-ago** y verificada con el camino del dedo |
| 10 | día viene seleccionado por defecto / pantalla vacía | ✅ **MAIN** (`237120f1`) | la modalidad arranca en «día» |
| 11 | **el precio del paquete no cambia por chip** | 🟡 **EN MI RAMA** (`4ec42da1`) | **verificado contra el render**: `5 · from $40.00` · `10 · from $70.00` |
| 12 | el botón de antirrábica muy ancho | 🟡 **EN MI RAMA** (`1e77e215`) | **medido, no razonado**: ~92 px contra los ~60 de la fila canónica de la casa (`parte/[eventoId]`) — 53 % más alta para la misma información. La causa era **mía** (el relleno de la `Tarjeta`), no de la pieza. Queda un `paddingHorizontal` **declarado como andamio** ⇒ pedido a B |
| 16 | **nadie puede comprar ni reservar** | ⚪ **ESTADO NORMAL DEL FRENTE — no es un bug** | **`guarderia_documentos` = 0**: faltan los seis textos legales, que **redacta la mesa** (`D-977`). El gate rebota `documentos_no_disponibles` para toda familia, *y eso es el perímetro funcionando*. **No falta motor ni pantalla: falta el texto** |
| 17 | el paquete salteaba el gate de documentos | ✅ **CURADO POR A** (`20260831020000`) | cobraba y frenaba a la familia recién en la reserva, **con la plata ya tomada**. Hoy las tres puertas gatean igual. ⚠️ Lo sanitario sigue en la puerta del DÍA a propósito: el paquete es del hogar y nace sin mascota |
| 13 | el mapa en el detalle | 🟡 **EN MI RAMA** | `MapaZona`, la pieza de todas las vitrinas: **rango de sector, jamás el punto exacto** |
| 14 | los seis documentos | 🟡 **EN MI RAMA** (`04d88578`) | ✏️ el censo corrigió el encuadre y **la migración destapó algo peor**: mi pantalla **no tenía acto de aceptación** — mandaba las seis versiones hiciera lo que hiciera la familia. *Sin acto no hay prueba* (P23). Hoy `AceptacionDeDocumentos` con seis casillas, el enlace abre sin marcar, y el botón exige las seis |
| 18 | **el prestador no podía elegir sus días** | 🟡 **EN MI RAMA** (`80fee549`) | estaba cerrado por MOTOR y A lo abrió. Al medirlo apareció lo de fondo: los días viven en **dos lugares** y **el taller no escribía ninguno**. Probado en subtransacción, **residuo 0** |
| 19 | **las sondas tomaban la clave por su posición** | 🟡 **EN MI RAMA** (`5dca8888`) | correctas **por orden, no por diseño**. Su modo de falla no es un error: es un **verde** — con `service_role` todo gate de RLS pasa. Hoy se elige por el claim |
| 15 | «Mensual» ausente del selector | ✅ **CORRECTO** | dos segmentos exactos, **sin chip apagado ni «próximamente»** |

---

## 🔴 LA LECTURA QUE IMPORTA

**Nueve están en main; seis viven en mi rama** (`1e77e215` · `04d88578` · `80fee549` · `5dca8888` y los dos previos).
**Correlo, no lo leas: `bash scripts/s107/estado-de-mis-curas.sh`.**

⏪ *Vieja lectura, conservada porque su advertencia sigue valiendo:* Si tu bundle `d8e9c922` es anterior al merge `5582aa38`,
**los ítems 8, 9 y 10 no están en tu teléfono** — y son exactamente los que reportaste dos veces.

> ### La pregunta que cierra esto no es mía ni tuya: **¿cuándo fue el último publish?** Lo sabe A.

**Y de los que faltan, sólo tres son míos** (12, 13, 14). **Uno está bloqueado en A** (5) y
**uno acaba de terminar y espera merge** (11).

*Esta tabla se re-mide con `scripts/s107/estado-de-mis-curas.sh` — no se lee de acá dos días
después.*
