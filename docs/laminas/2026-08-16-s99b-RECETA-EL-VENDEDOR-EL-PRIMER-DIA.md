# RECETA DE FORMA — EL VENDEDOR, EL MISMO DÍA

**Los tres juntos, por orden de mesa:** la gramática de configuración · el
HOY vacío · el arranque del vendedor (§5bis). *Es el mismo vendedor el
mismo día: la gramática nace UNA vez.*

**Estatuto:** Toque 1. Va antes de que C escriba.

---

## §0 · POR QUÉ LOS TRES SON UNO — y no es una agrupación administrativa

Los tres nacieron por caminos distintos y **describen tres momentos de la
misma mañana**:

| llegó como | es, en realidad |
|---|---|
| «la configuración se ve distinta de los servicios» | el vendedor **entra** a poner su tienda en pie |
| «el HOY dice *Todavía no hay pedidos…*» | el vendedor **mira su día** y no pasó nada todavía |
| §5bis: «tres listas vacías sin guía» | el vendedor **no sabe por dónde empezar** |

> **Separados fabrican tres respuestas donde hay una** — y peor: tres
> voces distintas hablándole a la misma persona en la misma hora.

**LA PREGUNTA ÚNICA que los tres contestan:**

> *Un vendedor abre su tienda hoy. ¿Qué ve, y qué sabe hacer después de
> verlo?*

---

## §1 · LA LEY MADRE, que sale de la letra de mesa y gobierna los tres

> ## 🔴 **EL VACÍO ES AUSENCIA DE TRABAJO, JAMÁS AUSENCIA DE NEGOCIO.**

**☠️ Muere *«Todavía no hay pedidos…»***, y con ella toda su familia —
*«Aún no tenés productos»*, *«Sin repartidores»*, *«Nada por acá»*.

**Por qué es ley y no estilo:** esas frases **consuelan en pasivo**. Le
dicen al vendedor *no pasó nada* cuando lo que pasa es que **su negocio
está en pie y todavía no entró trabajo** — que son cosas opuestas. *Un
día sin pedidos con la tienda abierta, el stock cargado y el repartidor
listo NO es un vacío: es una mañana tranquila de un negocio sano.*

**LA REGLA DE FORMA QUE SE DERIVA, y es la que C aplica:**

> **Toda superficie vacía muestra LO QUE SOSTIENE, no lo que falta.**
> El *falta* solo aparece cuando **falta de verdad para poder operar** —
> y entonces no es un lamento: es **un paso**.

---

## §2 · LAS DOS VOCES, con un solo discriminador

**`haVendido`** (ya viaja en el contexto de arranque — cero motor nuevo):

| | **`false` → ARRANQUE** | **`true` → SERENIDAD** |
|---|---|---|
| qué dice | **qué le falta para su primera venta** | **todo está en pie; hoy está tranquilo** |
| tono | conducción | calma |
| tiene camino | **sí, uno** | **no, y es a propósito** |

**🔴 JAMÁS LA MISMA FRASE PARA LOS DOS.** *Al que nunca vendió, «hoy está
tranquilo» lo deja sin saber qué hacer; al que vende hace meses, «te
falta cargar productos» lo trata de novato en su propio negocio.*

**Y la guarda de la casa, que rige en los dos:** ningún contador que no
pueda llegar a cero · **nada que dependa de e-PetPlace entra al contador**
(`MODELO_LOYALTY` §3 · §7.5). *Un contador que nunca cierra es una tarea
que el producto se inventó.*

---

## §3 · EL HOY VACÍO — qué se monta

**Muestra LO QUE SOSTIENE EL DÍA**, en este orden:

1. **Está abierto** — con su horario (`listarTurnosEntrega` /
   `cupoRepartoDelDia`, **ya existen**).
2. **Está en condiciones de recibir** — productos vivos, y **qué queda
   afuera por N18** (`listarSkusDelVendedor`).
3. **Cómo viene contra lo normal** — derivable del rango en memoria.
   **Sin ranking, sin score, sin comparación con nadie** (N18).

**La forma:** *no es un `EstadoVacio`.* Un `EstadoVacio` dice *acá no hay
nada*, y acá **hay**: hay una tienda abierta. Se monta **la misma
composición del HOY con trabajo**, con sus zonas diciendo la verdad de
hoy. *La pantalla no cambia de forma porque el día esté tranquilo — eso
es lo que la vuelve un día tranquilo y no una pantalla rota.*

**⛔ Lo que NO va:** ilustración de vacío · «Todavía…» en ninguna
persona · un CTA grande que empuje a hacer algo que no hace falta.

---

## §4 · LA CONFIGURACIÓN — la gramática ya escrita, con su enganche

**Rige `…-GRAMATICA-PANTALLA-DE-CONFIGURACION.md` entera** (censo, tres
reglas, referencia Shopify, receta para C en orden de retorno). **No se
reescribe acá.** Lo que esta receta agrega es **la costura**:

- Su regla ② —*¿por dónde empiezo?*— **es el mismo hueco que §5bis
  nombró** y la misma pregunta que la voz de ARRANQUE contesta en el HOY.
  ⇒ **una sola respuesta, en el orden de la operación: QUÉ vendo · CUÁNDO
  · QUIÉN/DÓNDE.**
- Su regla ③ —*¿ya está listo?*— **es `haVendido` un momento antes**: lo
  que le falta para su primera venta **es lo mismo** que la configuración
  llama completitud. *Dos contadores para lo mismo divergen el día que
  alguien cure uno.*

> ⇒ **UNA fuente de «qué le falta», leída en dos lugares.** La
> configuración la muestra como inventario; el HOY la muestra como el
> próximo paso. **Nunca dos listas distintas.**

---

## §5 · LA COSTURA COMPLETA — el mismo dato, tres superficies

```
        ¿qué le falta para operar?          ← UNA fuente
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 CONFIGURACIÓN    HOY (haVendido    §5bis · el
 «inventario       = false)          arranque
  de lo que        «tu próximo       (dónde empieza
  falta»            paso»             el primer día)
```

**Y el día que `haVendido` pasa a `true`, las tres cambian juntas** —
porque leen lo mismo. *Ese es el examen de si la gramática nació una vez:
si hay que acordarse de actualizar la segunda, nacieron dos.*

---

## §6 · LO QUE ESTA RECETA **NO** RESUELVE

1. **§5bis sigue siendo pregunta de PRODUCTO, no de forma** — *qué
   necesita ver un vendedor la primera vez que entra a configurar su
   tienda*. Esta receta le da **dónde vive** (la voz de ARRANQUE y la
   zona de completitud) y **con qué voz habla**; **qué le mostramos
   primero es de la mesa.** *Nombrar el hueco fue el trabajo de §5bis;
   llenarlo no se hace de contrabando en una receta de forma.*
2. **El ojo.** Ningún instrumento dice si un día tranquilo se **siente**
   tranquilo o se siente roto. Su pregunta para el gate —**en el
   teléfono, con la tienda abierta y cero pedidos**:

> *¿Esta pantalla te dice que tu negocio está bien, o te dice que la app
> no tiene nada para mostrarte?*
