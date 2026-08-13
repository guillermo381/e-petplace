# PEDIDO DE C → A · El esquema de la configuración de la despensa (§8.6bis)

> **Regla S54/76(b):** texto completo autocontenido — todo lo que A
> necesita está acá, sin referencias a reportes que A no tenga.
> **Origen:** `MODELO_DESPENSA` §8.6bis (v2.4, firmas del founder
> 13-ago-2026). C construye la pantalla `/ventas/configuracion`; estos son
> los lectores/escritores que la pantalla consume y HOY NO EXISTEN
> (medido contra `packages/api/src/database.types.ts` y los wrappers de
> `despensa-vendedor.ts` en `main` al 13-ago).
>
> Los NOMBRES de wrapper son propuesta de consumo — A los bautiza como
> quiera; lo exigido es la FORMA del dato. Todo escritor con guard en la
> FUENTE, jamás en la pantalla.

## Lo que YA existe y NO se pide (para que nadie lo duplique)

- `cat_familias_producto` (codigo · nombre · activo · entra_al_expediente
  · orden_display) — el catálogo canónico de familias.
- `vendedor_bodegas` (lat/lon · direccion · dias_operacion · hora_corte ·
  horas_preparacion · zona_horaria) — la ubicación del negocio vendedor.
- Repartidores/recursos/turnos: `listarRepartidores` ·
  `registrarRepartidor` · `actualizarRepartidor` · `definirRecursoReparto`
  · `listarRecursosReparto` · `definirTurnoEntrega` · `listarTurnosEntrega`.
- El estado de la cuenta (`estado_cuenta_comercial_enum`) ya viaja al
  módulo por `obtenerMiCuentaComercial` → cuarto ⑥ NO pide nada.

## A-1 🔴 · ① QUÉ VENDO — familias activables

**Lector** `listarFamiliasVendedor(cuentaComercialId)` →
`{ codigo: string; nombre: string; activa: boolean }[]`
— las familias **activables por el vendedor**, del catálogo canónico.
**Cuáles son activables lo dice el catálogo/la carga, jamás la pantalla**
(la letra nombra alimento · antiparasitarios y antipulgas · suplementos,
pero C no hardcodea ni los códigos ni los nombres: los pone la carga).

**Escritor** `activarFamiliaVendedor(cuentaComercialId, familiaCodigo, activa)`
→ ok / rebote tipado (familia inexistente · no activable · sin rol).

> 🔴 **EL GUARD DE LA LETRA, EN EL MOTOR:** activar una familia **NO toca
> `vendedor_skus`, no publica, no propone** — solo filtra lo que el
> vendedor VE en su puerta de carga. El cuerpo del RPC no debe tener
> NINGUNA escritura sobre skus/ofertas. *Si activar publica en bloque, la
> vitrina curada deja de existir* (§8.6bis ①, verbatim).

Dónde vive la activación (tabla propia `vendedor_familias` vs columna) es
decisión de A — la pantalla consume la forma de arriba.

## A-2 · ② CÓMO ENTREGO

**Lector** → `{ envio: boolean; retiro: boolean }` ·
**Escritor** `definirMetodoEntrega(cuentaComercialId, { envio, retiro })`
con **CHECK en la fuente: al menos uno true** (rebote `metodo_vacio`).
La pantalla oculta los campos de reparto cuando `envio === false`
(§8.6bis ②) — pero la verdad del método es del motor.

## A-3 · ③ COBERTURA POR RADIO

**Lector** `coberturaVendedor(cuentaComercialId)` →
`{ radioKm: number; lat: number | null; lon: number | null; direccion: string | null }`
(ubicación desde `vendedor_bodegas`; **bodega sin coordenadas = null
honesto** — la pantalla lo dice y ofrece el camino, jamás inventa un
centro).

**Escritor** `definirRadioCobertura(cuentaComercialId, radioKm)` —
**default 15 · CHECK 1..50 EN LA FUENTE** (§8.6bis ③: el máximo es del
motor; la pantalla solo no ofrece más).

## A-4 · ④ HORARIOS DE ATENCIÓN

`vendedor_bodegas.dias_operacion` ya existe. Falta la **franja de
atención** (desde/hasta) si la mesa la quiere aparte de los cortes.
Contrato propuesto: lector → `{ dias: number[]; desde: string; hasta:
string } | null` + su escritor. **Si A/mesa deciden que v1 alcanza con
días + cortes, C monta eso y la franja no nace** — decisión de esquema,
no de pantalla.

## A-5 🔴 · ⑤ LA COSTURA REPARTIDOR ↔ EQUIPO

La letra: *«entra como chip del EQUIPO QUE YA EXISTE, no como padrón
propio de la despensa. Un equipo, un lugar.»* Hoy `registrarRepartidor`
es un padrón propio (nombre/documento libres) — **C lo deja vivo y
declara el choque** hasta que esta costura exista, porque matar la única
alta funcionando antes de su reemplazo deja al vendedor sin repartidores.

**Lo pedido:**
1. La tabla de repartidores gana **`empleado_id`** (FK a
   `prestador_empleados`) — o la costura que A prefiera.
2. **Escritor** `vincularRepartidorDeEquipo(cuentaComercialId, empleadoId)`
   — el servidor resuelve nombre/documento DEL equipo; idempotente.
3. **Lector para la pantalla:** el equipo con la marca por miembro →
   `{ empleadoId: string; nombre: string; reparte: boolean }[]`
   (ensanche de `obtenerEquipoNegocio` o lector propio de ventas — A
   decide).

> 🔴 **LA PREGUNTA QUE C NO PUEDE RESPONDER Y BLOQUEA EL DISEÑO DEL
> CUARTO ⑤: ¿de qué equipo salen los chips para el VENDEDOR PURO sin
> prestador?** `obtenerEquipoNegocio` es del prestador. `nuevo_test2` es
> empleado de Satori Y dueño de su cuenta seller: ¿su equipo es el de
> Satori (ajeno) o su cuenta seller funda equipo propio? «Un equipo, un
> lugar» necesita decir CUÁL lugar cuando hay dos candidatos. Si es
> letra y no esquema, que suba a la mesa.

## A-6 · EL CONTADOR (sin pedido — se declara el cómputo)

Con los lectores de arriba, C computa «lo que te falta» SOLO con lo que
depende del vendedor: ≥1 familia activa · método elegido · (si envío)
radio con ubicación · ≥1 corte · (si envío) ≥1 repartidor y ≥1 recurso.
**La revisión de e-PetPlace y la curaduría por SKU NO entran** (ley del
contador S91: él llega a cero; después esperamos nosotros). Narrativa más
un paso, jamás checklist.

## El orden en que C los consume (por si A entrega por tandas)

**A-5 (la costura y su pregunta) y A-1 (familias) primero** — son los dos
🔴 de la letra. A-2/A-3 después (juntos: los tres viven en la misma
pantalla y A-2 gatea la visibilidad de A-3). A-4 al final o nunca (si
días+cortes alcanzan).
