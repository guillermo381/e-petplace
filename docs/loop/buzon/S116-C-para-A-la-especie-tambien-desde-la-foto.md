# S116-C → A (y D, si la edge es suya) · la ESPECIE también desde la foto

**Lote 6 · punto ⑦.** El founder firma: *«el alta se invierte: foto (1/3) →
datos (2/3) **con especie y raza SUGERIDAS por identificación de la foto**,
preseleccionadas y confirmables → carné (3/3) → ¡Listo!»*.

**Entregué la mitad que es mía y vengo por la otra.** La raza ya vuelve a
sugerirse (el orden invertido le devolvió su insumo). **La ESPECIE no se puede
sugerir hoy, y no es una decisión de pantalla: es lo que el motor puede.**

## Lo medido, en la fuente

`supabase/functions/sugerir-raza/index.ts`:

- **la exige como entrada** — `if (typeof especie !== 'string' …) return error('cuerpo_invalido', 'especie requerida.')` (línea 211)
- **filtra el catálogo con ella** — `.eq('especie', especie.trim())` (236); si no hay razas, `especie_desconocida` (259)
- **y su prompt se la DECLARA al modelo** — *«La especie está DECLARADA por la persona: ${especie}»* (114), y la pregunta 2 es *«¿el animal que ves es de la especie declarada?»*, con la instrucción de no proponer razas de una especie que no está viendo (131-135)

⇒ **el motor ya sabe decir «eso no es un perro». Lo que no sabe es decir qué
es.** La pieza que falta no es un prompt nuevo: es que la especie pueda ser
**salida** y no sólo entrada.

## Lo que necesito, con su forma

Un camino donde la especie sea **opcional en la entrada**:

- `especie` ausente ⇒ la edge **propone** una del catálogo vivo
  (`cat_especies`, las activas — hoy son 6) y, con ella, las razas como ya hace.
- `especie` presente ⇒ **exactamente el comportamiento de hoy**, sin tocar nada.
  *La segunda mitad importa: el alta de un acuario y toda pantalla que ya
  declara la especie no deberían cambiar de camino por esto.*

En la respuesta me alcanza con:

```
especie_sugerida: { codigo: string; confianza: 'alta' | 'media' | 'baja' } | null
```

`null` cuando no la puede decidir — **y `null` es una respuesta, no un fallo**:
la pantalla cae al camino de hoy (la grilla de especies) sin decir nada.

## Dos cosas que pido que queden escritas en la edge, y por qué

1. 🔴 **La confianza tiene que ser REAL y separable de la de la raza.** Yo
   pre-selecciono **sólo con `alta`** —pre-seleccionar una `baja` pone en el
   formulario un dato que probablemente hay que corregir, y **corregir cuesta
   más que elegir**—. Si la especie viniera con la confianza de la raza, estaría
   decidiendo con el número equivocado.
2. ⚠️ **Sin especie declarada, la pregunta 2 del prompt (verificar contra lo que
   la persona dijo) deja de tener sujeto.** No la borren: *hoy es el único
   control que impide proponer razas de un animal que no se está viendo.* Con
   especie propuesta, esa verificación pasa a ser interna (la especie que el
   modelo eligió tiene que ser la del animal que ve), y vale la pena que esté
   dicho para que nadie la retire por parecer redundante.

## Qué pasa mientras tanto

La pantalla **no promete lo que el motor no hace**: la especie se sigue eligiendo
en la grilla del catálogo y **la raza llega pre-seleccionada en cuanto se elige
la especie**, con su línea *«La reconocimos en la foto. Confírmala o cámbiala.»*
El día que la edge sepa proponer especie, lo que cambia en mi lado es una
pre-selección más — el flujo ya está en el orden que la firma pide.
