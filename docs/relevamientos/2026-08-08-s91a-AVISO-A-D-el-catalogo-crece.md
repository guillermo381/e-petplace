# S91 · AVISO DE A A D — EL CATÁLOGO DE LA BITÁCORA CRECIÓ

> **Firma en bloque del founder (8-ago-2026), ya APLICADA** (migración
> `20260808060000`). El bundle publicado **ya ve los chips nuevos sin
> re-publicar**, porque la pantalla pide el catálogo VIVO.

## LOS CONTEOS NUEVOS, medidos por cinturón dentro de la migración

| lo que la mascota es | antes | **ahora** |
|---|:-:|:-:|
| **gato** | 15 | **20** |
| **acuario** | 3 | **4** |
| perro | 15 | **15 — sin cambio** |
| conejo · roedor · ave | 14 | **14 — sin cambio** |

## ⚠️ DOS COSAS QUE TE AFECTAN DIRECTO

### ① NO HARDCODEES CONTEOS — y hay un motivo concreto además del obvio

Si tu fixture o tu pantalla afirman «el gato ve 15», **hoy están rojos**. Y
el número va a volver a moverse: **D-692 quedó registrada** (conejo, roedor y
perro sin chips propios) para mesa futura.

**El assert que sobrevive a los cambios no es el conteo: es que los conjuntos
sean DISTINTOS entre sí.** Eso es lo que prueba que el filtro filtra —
«perro ≠ gato ≠ ave ≠ acuario»— y no cambia cuando el catálogo crece.
*Un fixture que afirma 15 tiene que editarse cada vez que la mesa firma un
chip; uno que afirma «distintos» no.*

### ② ⚠️ CORRECCIÓN DE UN NÚMERO QUE YO MISMO TE PASÉ MAL

**Mi letra de diseño anterior decía «perro 16». Es FALSO: perro era 15 y
sigue siendo 15.** Lo medí recién contra el objeto —
`perro 15 · gato 15 · conejo 14 · roedor 14 · ave 14` — y el 16 nunca
existió: fue un cálculo mío de cabeza que no verifiqué. Si tu fixture lo
tomó de mi carta, **el rojo es mío, no tuyo.** *Y es la razón práctica del
punto ①: el conteo que te pasan puede estar mal; el «distintos» no se puede
equivocar.*

## LOS CAMBIOS, uno por uno

**Nace la cuarta del acuario:** `agua_cambiada` — «Le cambié parte del agua»
/ «Changed some of the water».

**Nacen cinco del gato** (todas `especies_aplicables = {gato}`):
`bola_de_pelo` («Vomitó una bola de pelo») · `bandeja_normal` («Usó la
bandeja con normalidad») · `arano_muebles` («Arañó muebles o paredes») ·
`marco_con_orina` («Marcó con orina») · `maullo_de_noche` («Maulló de
noche»).

**El vómito quedó PARTIDO para el gato, y la partición se lee en el ORDEN:**
`vomito` (25) y `bola_de_pelo` (26) van pegados a propósito — en un gato una
bola de pelo es casi rutina y un vómito es señal, y si la elección no se ve
adyacente la distinción se pierde. **`vomito` sigue aplicando a perro Y
gato**: angostarlo a perro habría dejado al gato sin poder reportar un vómito
de verdad.

**🔴 DOS CÓDIGOS CAMBIARON DE NOMBRE** — si los tenés escritos en algún lado,
esto te rompe:

| antes | ahora |
|---|---|
| `ladridos_excesivos` | **`hizo_mas_ruido`** |
| `hizo_adentro` | **`hizo_fuera_de_lugar`** |

Sus textos ya eran universales; el código seguía diciendo perro. *No se ve en
pantalla, se ve en cada consulta y en el próximo censo — que es cómo un sesgo
vuelve.* **El chip vivo que existía con `hizo_adentro` viajó con el rename**
(1 fila, censada antes y verificada después: la tabla de chips guarda el
código como TEXTO LIBRE, sin FK, así que nada lo habría avisado).

**Y el inglés de `destrozo_objetos`** pasó de «**Chewed** something up at
home» a «**Damaged** something at home»: *chew* es masticar, y **un gato no
mastica los muebles, los araña**. Era el único texto con sesgo demostrable de
especie, y sobrevivió porque el gate de strings se hizo sobre el castellano.

## LO QUE NO CAMBIÓ

El contrato del lector es el mismo: `obtenerVocabularioBitacora({ especie,
sujeto })`. **Cero cambios de forma** — solo hay más filas, y el motor sigue
rechazando tipado lo que no aplica.
