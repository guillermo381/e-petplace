# S112-C · CENSO — LA APP CON LA FAMILIA VACÍA

> **Ítem 15 de la directiva.** *«Censá las pantallas que cuelgan de la familia
> contra la familia vacía: cada una dice qué muestra sin mascota. Un guard con
> voz falsa se reporta como defecto aparte.»*
>
> **Medido contra el objeto** el 1-sep-2026, por LECTOR y no por nombre de
> archivo. **Todo lo que dice «curado» tiene su commit; lo que dice «abierto»
> no se tocó y se declara.**

## §0 · EL NÚMERO, Y POR QUÉ NO ES 24

La directiva dice «las 24 pantallas». **Medido: son 42 archivos** los que leen
mascota o familia (`grep` por los siete lectores reales, no por nombre).
**Pero el número que importa no es ninguno de los dos**, y es el hallazgo de
método de este censo:

> ### De los 42, la mayoría son **INALCANZABLES** con la familia vacía — reciben `mascotaId` por parámetro, y sin mascota no hay de dónde tocarlas.

**Lo que se censa es lo ALCANZABLE**: las raíces de tab y las de oficio. *Un
censo que cuenta pantallas que nadie puede abrir mide el repo, no el
producto.* **Alcanzables: 13.**

## §1 · LA TABLA

| pantalla | qué muestra hoy sin mascota | veredicto |
|---|---|---|
| `hogar/index` | **antes:** `EstadoVacio` centrado + un botón. **ahora:** dos cartas — los que esperan, y la invitación con su «i» | ✅ **curado** (`4e4f5302`) |
| `explorar/index` | **antes:** *«todavía no hay refugios publicados»*, sin navegar. **ahora:** pregunta y ofrece la vidriera | ✅ **curado** (`4e4f5302`) |
| `explorar/paseo` | *«El paseo es para perros»* — **voz del otro caso** | ✅ **curado** (`b6f60a0f`) |
| `explorar/adiestramiento` | *«El adiestramiento es para perros»* — **ídem** | ✅ **curado** (`b6f60a0f`) |
| `explorar/veterinaria` | *«Tu hogar todavía no tiene mascotas»* — correcta con cero, **falsa con mascotas no elegibles** | ✅ **curado** (`b6f60a0f`) |
| `explorar/grooming` | *«Todavía no hay a quién bañar»* — el título aguanta los dos casos; el detalle nombra especie | ✅ **curado** (`b6f60a0f`) |
| `explorar/guarderia` | **no tiene guard de elegibles.** Llega con `mascotaId` por parámetro | 🟠 **abierto** — ver §3 |
| `adoptar` | la vidriera, y **funciona sin sesión** | 🟢 correcto |
| `adoptar/solicitudes` | vacío digno con salida a la vidriera | 🟢 correcto |
| `despensa/*` | **muestra el catálogo entero** — `MODELO_DESPENSA`: *sin mascota elegida se muestra todo* | 🟢 correcto **por letra** |
| `pedidos/*` | no lee mascota | 🟢 no aplica |
| `cuenta/*` | no depende de mascota (salvo `documentos`, que es del titular) | 🟢 correcto |
| `hogar/{paseos,grooming,…}` (hubs) | vacío de servicio, no de mascota | 🟢 correcto |

## §2 · 🔴 EL DEFECTO APARTE — UN GUARD CON DOS HECHOS ADENTRO

Las cinco raíces de oficio decidían con **`elegibles.length === 0`**, verdadero
en dos situaciones que no se parecen:

1. **el hogar está VACÍO** — no hay ninguna mascota;
2. **hay mascotas y ninguna aplica** — el hogar tiene un ave y el paseo es para
   perros.

**Con una sola voz, tres de cinco mentían**, y en las dos direcciones:

- **paseo y adiestramiento** le decían *«tu hogar todavía no tiene un perro
  registrado»* a alguien **sin ninguna mascota** ⇒ se lee como *«tenés mascotas
  pero ninguna es perro»*.
- **veterinaria** decía *«tu hogar todavía no tiene mascotas»* a **quien sí las
  tiene** (su guard cubre también la especie no elegible).

> ### Ninguna de las dos frases es falsa por descuido: **cada una es la verdad del otro caso.** El defecto no era el texto — era que **un guard con dos hechos adentro sólo puede decir uno**.

**Y el tercero estaba escondido en el botón:** las cuatro mandaban
`paquete.sinPerrosAccion` —*«Agregar a mi perro»*— **incluida veterinaria, que
atiende a todas las especies**. Con el hogar vacío eso le dice a alguien que
para ver al veterinario tiene que conseguirse un perro. *El botón es parte del
guard: si el título se parte y la etiqueta no, la mitad del mensaje sigue siendo
del otro caso.*

**Cura:** nace `SinQuienReservar` (`components/reserva-piezas.tsx`) y **recibe el
HECHO, no la voz ya elegida** — *si el llamador eligiera el texto, cada pantalla
podría volver a equivocarse de caso, que es el defecto que la pieza cierra.*

## §3 · 🟠 LO ABIERTO, CON SU RAZÓN

**① `guarderia.sinElegiblesTitulo` y `…Detalle` existen y NADIE las monta.**
Medido: **cero consumidores**. Es una **voz sin pantalla** — la contracara del
motor sin puerta. No se curó porque **guardería llega con `mascotaId` por
parámetro** desde el hogar, así que su caso cero se resuelve antes de esa
pantalla; montar el guard ahí sería construir contra un camino que no existe.
**Se declara para que no se lea como que ya está cubierto.**

**② La bifurcación del onboarding NO se construyó**, y es la decisión
consciente de este censo. El founder la pidió con dos tarjetas: *«¿tenés una
mascota o querés adoptar?»*. **La segunda salida exige crear la familia SIN
mascota, y ese productor no existe** (el único constructor es
`crearFamiliaConPrimeraMascota`). ⇒ **Una pregunta con una sola respuesta viva
no es una pregunta.** Pedido a A como `crear_familia_sin_mascota`
(`S112-C-para-A-PEDIDO-1` §①); el estado ya es expresable —
`getEstadoOnboardingDueno` devuelve `mascotas_count`—, **le falta productor, no
modelo**.

## §4 · LO QUE EL CENSO CONFIRMÓ EN VERDE (y evitó construir)

| se creía que faltaba | medición | consecuencia |
|---|---|---|
| el guard tras el alta manda a login o a un home vacío | `registro.tsx:111` · `verificar-correo.tsx:111` · `index.tsx:64` — **los tres a `/onboarding`** | **nada que curar** |
| recuperar contraseña deja al usuario en login | `recuperar.tsx` → `router.replace('/')`, con la sesión de `verifyOtp` viva | **nada que curar** |
| hace falta rutear un deep link de recuperación | el correo manda **código**, no link (confirmado por A) | **superficie que no se construye** |

> *Tres construcciones evitadas por medir en vez de suponer.* **El censo no
> sólo encontró trabajo: sacó trabajo de la lista.**
