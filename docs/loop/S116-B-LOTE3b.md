# S116-B · LOTE 3b — la pasada mecánica: **el censo primero**

**Rama `pista/s116-b-05`.** El censo completo, archivo por archivo con su línea: **`docs/loop/S116-B-LOTE3b-CENSO.txt`** (78 filas).

**Gates:** `verify:diseno` VERDE (81) · `verify:contrast` 479/0 · `verify:catalogo-v5` VERDE · **`verify:techos-locales` NUEVO, VERDE con su rojo probado** · `tsc` 0 en las cuatro.

---

## ① EL CENSO — medido contra el objeto

**106 rutas `.tsx` en `apps/cliente/src/app`.**

| qué monta | cuántas |
|---|--:|
| **`Cabecera`** (la nueva) | **6** |
| **`Encabezado`** (la vieja) | **78** |
| **techo propio** (`LinearGradient` a mano) | **4** |
| ninguna cabecera | ~18 |

### Las 78 de `Encabezado`, agrupadas por lo que llevan ADEMÁS del título

| contenido | cuántas | ejemplo |
|---|--:|---|
| **título pelado** (`navegacion`, nada más) | **71** | `(tabs)/cuenta/ayuda.tsx:102` |
| `portada` + saludo + acción derecha | 3 | `(tabs)/cuenta/index.tsx:262` · `explorar/index.tsx:202` · `pedidos/index.tsx:369` |
| `portada` + saludo + **isotipo** | 1 | `(tabs)/despensa/index.tsx:830` |
| `navegacion` + `tituloVisible` | 1 | `despensa/producto/[productoId].tsx:750` |
| `navegacion` + `subtitulo` | 1 | `explorar/adiestramiento/confirmar-programa.tsx:254` |
| `navegacion` + `busqueda` | 1 | `buscar.tsx:105` |

> 🔴 **El 91 % es título pelado, y eso es lo que decide el lote:** la migración de 71 pantallas **no necesita ningún slot nuevo** — es `Cabecera variante="empujada" titulo onVolver` y nada más. *El censo no vino a pedir piezas: vino a decir que casi todo ya estaba cubierto.*

### Los 4 techos propios, y qué llevan

| archivo | contenido de la banda |
|---|---|
| `(tabs)/hogar/index.tsx:1793` | fecha en mono · saludo · **fila de mascotas** · campana con contador |
| `(tabs)/hogar/mascota/[mascotaId].tsx:1456` | hero de la mascota · flecha de volver **dibujada con un `Path` a mano** · acciones |
| `bienvenida.tsx` · `index.tsx` | **no son cabeceras: son láminas de marca a sangre** |

🔴 **Y el techo del Hogar trae su propia confesión escrita**, que es la razón de todo el lote:

> *«HeroMarca no tiene slots para fecha-antes-del-saludo ni para la fila de mascotas: se compone local **COPIANDO NIVEL de la primitiva** (gradiente firma + curva 44/26 + safe area absorbida + memorial plano)»*

**Un techo local no nace por descuido: nace porque la pieza no llegaba.**

---

## ② LOS SLOTS — dos, y los dos salen de un caso real

**`contenido` (`D-1106`)** — contenido propio **dentro** de la banda, debajo del título. Lo piden los **dos** techos vivos. Hereda el degradado, la curva y el inset que cada pantalla venía copiando. ⚠️ **Es un slot, no una pieza:** *el contenido lo arma la pantalla porque es suyo —una fila de mascotas no es de la cabecera—; lo que deja de ser suyo es el techo.*

**`avisos`** — la campana con contador, hermana de `carrito` **en el mismo slot derecho**. El censo encontró **dos** acciones-con-contador en raíz y hasta hoy cabía una: *la campana estaba dibujada a mano en el techo que este lote borra.* Prop propia y no un `accionDerecha` genérico — *un `ReactNode` suelto deja que cada pantalla arme su disco, y ahí vuelve la copia que `DiscoVidrio` acaba de terminar.*

**Lo que el censo pidió y NO se agregó, con su razón** (*un slot por caso real*):
- **`isotipo` en portada** — muere al migrar: el lote 10 firmó que **las cabeceras raíz del cliente no llevan isotipo**.
- **`busqueda`** — medido: en `buscar.tsx` el campo vive **fuera** de la banda. No hace falta slot.
- **`tituloVisible`** — es **comportamiento de scroll de una pantalla**, no contenido de la banda. Un caso, y es de C.
- **`saludo` / `subtitulo` / `accionDer`** — ya cubiertos por `titulo` / `apoyo` / `accionDerecha`.

---

## ③ LA REGLA, Y EL GATE QUE LA SOSTIENE

**Desde este lote: ninguna pantalla del cliente dibuja su propia cabecera.**

**`verify:techos-locales`** — trinquete **solo-baja** sobre los `.tsx` de `apps/cliente/src/app` que montan `LinearGradient`, con el molde de `piezas-locales`. **Baseline: 2** (los dos techos de las tabs). Cableado al pre-commit y a `package.json`.

**Rojo probado**, sembrando un techo nuevo:

```
✗ EL NÚMERO SUBIÓ: 2 → 3. El trinquete NO deja subir.
  Techo(s) nuevo(s):
   · __sonda-techo.tsx
```

**Dos decisiones del gate, declaradas:**
- **El marcador es `LinearGradient`** porque la banda de la casa **es** un degradado, y quien usa `Cabecera` no lo importa nunca. ⚠️ **Su verde dice «nadie compuso un degradado nuevo», jamás «ninguna pantalla se dibuja un techo»**: un fondo plano no lo ve. *Se eligió el marcador que cubre los cuatro casos reales y no uno más ancho que marcaría cualquier `View` con color — un gate ruidoso se apaga.*
- **Dos exenciones por nombre**, `index.tsx` y `bienvenida.tsx`: son láminas de marca a sangre, donde el degradado **es** la pantalla. *Una exención nombrada se discute; una regla más laxa se olvida.*

⚠️ **Y el gate va JUNTO con los slots, no antes:** *un trinquete sin la pieza que lo hace innecesario no frena el techo — frena la pantalla.*

---

## ④ LO QUE QUEDA, con dueño

- **El montaje es de C:** 78 migraciones de `Encabezado` → `Cabecera` (71 mecánicas) y los **dos** techos locales a `contenido` + `avisos`. **El baseline baja a 0 en el commit que los absorba** — y el gate lo pide en su propia salida.
- ☠️ **`Encabezado` no lleva lápida todavía**: tiene **173 consumidores** entre las dos apps y el prestador lo va a seguir montando. *Una pieza muere cuando su último consumidor migró, no cuando nace su reemplazo.*
