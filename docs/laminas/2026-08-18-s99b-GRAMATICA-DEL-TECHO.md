# LA GRAMÁTICA DEL TECHO — pieza, no cura de dos pantallas

**Estatuto:** Toque 1. **Se escribe como GRAMÁTICA porque el mismo
defecto ya salió en DOS lugares distintos**, y un defecto que repite no
se cura donde aparece: se cura donde nace.

**Los dos verbatim del founder:**
> *«en el header, lo que hagamos muy parecido a lo que tenemos en DATOS:
> el isotipo y la palabra Datos, y después sí viene "tu semana". Así
> mismo en la vitrina, para que se vea coherente.»*
>
> *«entro a vender por e-PetPlace y la primera pantalla arriba SIGUE
> LLAMÁNDOSE PEDIDOS; ese header debería llamarse CONFIGURACIÓN, con el
> isotipo arriba igual que en Datos.»*

---

## §1 · LA LEY, en una línea

> ## **EL TECHO DICE DÓNDE ESTÁS ANTES DE DECIR QUÉ HAY.**
> **isotipo + nombre de la pantalla · y recién después, el contenido.**

**Los dos hallazgos son el MISMO defecto**, y por eso no son dos curas:

| dónde | qué pasa | qué falta |
|---|---|---|
| **Vitrina** | arranca en «tu semana» | **el nombre de la pantalla** |
| **Configuración** | dice **«Pedidos»** | **el nombre CORRECTO** de la pantalla |

⇒ En los dos casos **el techo está contando el contenido antes de decir
en qué pantalla estás**. *Un techo que empieza por el contenido obliga a
deducir dónde estás mirando lo que hay — y el segundo caso muestra el
costo: una pantalla que se llama como la anterior.*

---

## §2 · LA ANATOMÍA — tres pisos, en este orden

```
┌──────────────────────────────┐
│  ◌  Configuración            │  ① identidad + LUGAR
├──────────────────────────────┤
│  Tu semana                   │  ② el titular del contenido
│  …                           │  ③ el contenido
└──────────────────────────────┘
```

**① EL PISO DE IDENTIDAD — isotipo + nombre de la pantalla.**
- El isotipo es **la pieza de la casa** (`Isotipo`), jamás un dibujo
  local. La casa ya lo resolvió y `Encabezado` en registro `portada` ya
  monta el lockup — **esto no inventa: unifica**.
- El nombre es **DÓNDE ESTÁS**, no qué hay. *«Configuración», no
  «Pedidos»; «Vitrina», no «tu semana».*

**② EL TITULAR DEL CONTENIDO** — *«Tu semana»* es esto, y está bien: lo
único que estaba mal es que ocupara el lugar de ①.

**③ EL CONTENIDO.**

> **La prueba de que la anatomía es correcta: ① no cambia cuando cambia
> el contenido.** Si «tu semana» pasa a «tu mes», ① sigue diciendo
> Configuración. *Eso es exactamente lo que un techo tiene que hacer.*

---

## §3 · POR QUÉ ES PIEZA Y NO REGLA ESCRITA

**Ya existe `Encabezado` con su registro `portada`** (lockup isotipo +
voz). ⇒ **la gramática no necesita una pieza nueva: necesita que las dos
pantallas la CONSUMAN**, que es distinto y más barato.

**Lo que sí falta y es mío:** que el registro `portada` **exija el nombre
de la pantalla**, en vez de aceptar cualquier voz. *Hoy la pieza permite
montar un techo sin decir dónde estás — y las dos pantallas del hallazgo
lo demuestran: no lo hicieron mal, hicieron algo que la pieza permitía.*

**⇒ Enmienda propuesta:** en `portada`, el nombre de pantalla es
**obligatorio**; el titular de contenido es **otro slot**. *Mismo
mecanismo que `sinVer` en `PuertaHermana`: lo que no puede faltar se hace
requerido, y el defecto deja de ser expresable.*

⚠️ **No la ejecuto en esta tanda y digo por qué:** tocar `Encabezado`
—que montan las dos apps enteras— **exige censar sus consumidores
primero**, y ese censo es una tanda propia. *Prometer la enmienda y no
medir su alcance sería exactamente lo que la casa no hace.*

---

### 🔴 ⏪ EL CENSO SE CORRIÓ, Y **LA ENMIENDA SE CAE** (S99-B)

**A midió 110 montajes / 84 con `titulo=` ⇒ «~26 sitios donde el techo
puede mentir».** Al bajar el censo a la variante correcta, el número
real es **otro y mucho más chico**, y con él se cae la enmienda entera:

| medición | número |
|---|---|
| montan `variante="navegacion"` | **100** — y ahí `titulo` **ya es requerido por el tipo** |
| montan `variante="portada"` | **7** |
| portadas que **ya pasan el nombre de la pantalla** | **7 de 7** |

**Los siete, con su literal:** `explorar.titulo` · `cuenta.titulo` ·
`despensa.titulo` · `alta.paso1Titulo` · `atender.titulo` (×4) ·
`mascotas.titulo` · `ventas.hoy.titulo`.

> ⇒ **`Encabezado` NO tiene el hueco que le atribuí.** El slot existe y
> los siete consumidores lo usan bien. *Lo único cierto de mi §3 es que
> el slot se LLAMA `saludo` —nació en S52 para «Buenas tardes,
> Guillermo»— y hoy ninguno de los siete lo usa así: **el nombre miente
> sobre su trabajo, pero el trabajo se está haciendo.***

### Y ENTONCES, ¿DÓNDE VIVE EL DEFECTO QUE EL FOUNDER VIO? EN UN STRING

Medido en el diccionario, no deducido:
- **`ventas.config.titulo` = `'Configuración'`** ✅ — y `configuracion.tsx:774`
  lo monta. **Esa pantalla dice bien su nombre.**
- **`ventas.hoy.titulo` = `'Pedidos'`**, y es lo que monta el techo de la
  tab HOY (`(tabs)/index.tsx:2087`).

⇒ El founder entra a vender, cae en **HOY**, y el techo dice **«Pedidos»**
mientras el cuerpo le muestra lo que tiene que configurar. **No es que
falte el nombre de la pantalla: es que la pantalla muestra un contenido
que no es el que su nombre anuncia.**

> ***Estuve a punto de cambiar una pieza que montan 107 pantallas para
> curar un defecto que vive en una tab y su string.*** La enmienda queda
> **RETIRADA**; el arreglo es de composición y es de C, con el literal
> arriba. *Tercera vez en esta tanda que medir primero evitó la cura
> equivocada — y la más cara de las tres.*

---

## §4 · Y EL TERCER HALLAZGO DEL GATE, que es de aire

> *«Administrar y Ver como cliente están MUY PEGADOS arriba de Vitrina,
> pero se ven.»*

**El interruptor del espejo vive en el techo (mi receta §2), y con la
gramática de §2 ahora tiene su lugar: entre ① y ②** — debajo de la
identidad, arriba del contenido. **Ese es su piso, y el aire sale de N2
(32 entre bloques), no de un ajuste local.**

*«Se ven» no es «están bien»: se ven porque el founder los buscó.*

---

## §5 · LO QUE NO DECIDE

1. **Los nombres de cada pantalla** — «Configuración» lo dictó el
   founder; los demás son de producto.
2. **El ojo**, con su pregunta: *entrando de cero, ¿sabés en qué pantalla
   estás antes de leer el contenido?*
