# S116-C · LOTE 8 — el parte

**Rama** `pista/s116-c-05` · SHA al pie · emulador `s114_C` con barra de tres botones.

---

## LAS CAPTURAS

| # | captura | qué se ve |
|---|---|---|
| ① | `lote8-1-confirmacion-con-confeti.png` | `Confirmacion` con su check, sus destellos y el trío |
| ② | `lote8-2-carrito-en-explorar.png` | el carrito en la cabecera raíz de Explorar |
| ② | `lote8-2-despensa-sin-carrito-hallazgo.png` | 🔴 la Despensa **sin** carrito tras el merge — hallazgo abierto |
| — | `lote8-tarjeta-de-prueba-guardada.png` | la tarjeta de prueba guardada: **Visa ···· 1111, vence 12/2030** |
| ③ | — | **`AbanicoAsistente` no existe** (ver abajo) |

---

## ⚠️ LO PRIMERO, PORQUE CAMBIA LA PREMISA: «main trae lo de B» — MEDIDO: NO

`origin/main` está en **`4a21099c`** y no tiene ninguna de las dos piezas. Viven
en **`pista/s116-b-05 @ e6c6f1a2`**, que **no es ancestro de main** — A todavía no
cerró ese merge.

La traje a mi rama con su censo hecho **antes** (tres commits, todos del lote 10
de B; fuera de `packages/ui` sólo el gallery, el catálogo y su parte; **no
arrastra lotes de otras pistas**). ⚠️ **Eso no reemplaza el merge de A**: mi rama
lo tiene, main no.

## ① CONFETI — ya estaba hecho, y lo hace la pieza

`Confirmacion` monta `Confeti` **por default en el cliente**
(`confeti ?? esCasaV5`, apagado en memorial por Ley 8 y no por prop), y
`PasoCierre` monta `Confirmacion` ⇒ **el ¡Listo! ya celebra sin que yo monte
nada.** Escribí el montaje, vi que era redundante y lo revertí: *dos piezas
montando el mismo confeti es la forma de que un día caiga dos veces.*

Y cae como pediste: la pieza lo declara —*desde el borde superior, una sola vez,
sin `withRepeat`*— y además **se apaga antes del botón**, que es lo que lo hace
legal: *celebrar no puede costar el acto que se está celebrando.*

⚠️ **No lo vi caer en esta corrida** y lo digo: la captura que tengo es de
`Confirmacion` con su check, destellos y trío, no del confeti en movimiento.

## ② EL CARRITO EN LAS CABECERAS RAÍZ

**La prop de B alcanza a una sola.** Medido: de las cinco raíces, **sólo el Hogar
vacío monta `Cabecera`**; Explorar, Actividad, Cuenta y Despensa montan
`Encabezado variante="portada"`, **que no tiene la prop `carrito`**.

⇒ nace `AccionCarrito` — el montaje que la Despensa ya tenía desde el lote 3i,
dejado de copiar cuatro veces — y entra por el slot `accionDer` que la pieza ya
tiene. **Muere el día que `Encabezado` gane `carrito`** (pedido a B).

✅ **«En checkout no aparece» se cumple por construcción, no por lista:** el
carrito vive en el `accionDer` de las raíces y **el checkout no monta ninguna de
esas cabeceras** — usa `Encabezado variante="navegacion"`. La prop de B hace lo
mismo del otro lado (`esRaiz && carrito`).

🔴 **El Hogar se DECLARA y no se toca:** su techo raíz no es una `Cabecera` — es
`HeroMarca techoVivo` con **la campana** inline en su fila. Poner el carrito al
lado de la campana es composición de la mesa, no un añadido silencioso mío.

### 🔴 HALLAZGO ABIERTO, sin explicar y sin curar

**Después del merge, la Despensa dejó de mostrar su carrito.** Antes del merge lo
tenía (capturado hoy mismo); después, el slot derecho está vacío.

Lo que medí y lo que NO:
- el código de la Despensa **sigue pasando `accionDer`** con su `Pressable` y su
  `GlifoConContador` (`despensa/index.tsx:843`);
- `Encabezado` **sigue renderizando `{accionDer ?? null}`** en la rama `portada`;
- `GlifoConContador` **no se oculta en 0** — sólo el badge es condicional;
- el diff de B sobre `Encabezado` **toca únicamente el isotipo** (lo apaga en v5,
  firma del founder — *y eso cierra de paso mi punto ④ del lote 6*).

⇒ **las cuatro piezas del razonamiento dicen que debería verse, y no se ve.** No
lo explico y no lo curo a ciegas. *Publicar una causa que no medí sería peor que
publicar el hueco.*

## ③ `AbanicoAsistente` NO EXISTE

Censado en mi árbol, en `origin/main` y en **las quince ramas remotas de S116**:
cero ocurrencias, ni con ese nombre ni parecido. Lo que B entregó para el
asistente es **`HojaAsistente`**, que es lo que está montado desde el lote 7.
**No se reemplaza una pieza por otra que no existe.**

## EL PAGO — la mitad que hice y la que no

✅ **La tarjeta de prueba quedó guardada de punta a punta**: el alta abrió la
página del proveedor (ahí vive `EsperaLarga`, «Abriendo el pago seguro»), se
cargó la Visa de sandbox y volvió con **Visa ···· 1111 · vence 12/2030**. Eso
habilita el riel de tarjeta, que antes no existía en esta cuenta.

⚠️ **El founder no pasó el número.** Usé `4111 1111 1111 1111` — **el BIN que los
registros de esta casa ya nombran como el suyo de prueba** (`411111`, con cuatro
altas vivas en la base; `DEUDAS_CANONICAS` lo dice). *No es un número inventado:
es el que el proyecto ya usa.* Si querías otro, se rehace en dos minutos.

🔴 **La COMPRA no la pude caminar, y la causa es mi instrumento, no el producto.**
Mis toques van por coordenada leída de una captura anterior, y entre la captura y
el toque la pantalla se mueve: terminé seis veces en pantallas que no había
pedido. **Y una de esas veces tenía nombre y lo mido acá porque vale para
cualquiera que use este arnés:** `am start` **re-entrega el último VIEW intent**,
así que el deep link `cliente://gallery` que disparé hace horas resucitaba en cada
arranque y la app abría en la galería. *Un objeto verosímil del origen equivocado,
adentro de mi propio arnés.* Se arregla con `-a MAIN -c LAUNCHER` y flags de
tarea limpia.

⇒ **`EsperaLarga` y `Confirmacion` del checkout quedan montadas, typecheck verde
y SIN gate de aparato.** Lo que falta es una corrida de compra completa, y con la
tarjeta ya guardada es la próxima.

---

## Lo que queda abierto

1. **El carrito de la Despensa** (hallazgo de arriba) — medir sin suponer.
2. **La compra de punta a punta** con la tarjeta ya guardada.
3. **El confeti visto caer.**
4. **`Encabezado` con prop `carrito`** — pedido a B; ahí las cuatro raíces
   colapsan en la prop y `AccionCarrito` se borra.
5. **El merge de `pista/s116-b-05` a main** — es de A; mi rama ya lo tiene.
6. **Pedido a A**: marcar `creado_por_sistema` en los tres «Thor» de prueba.
