# PEDIDO C → A · la capacidad declarada no tiene lector, y eso ya costó

> **Estado:** ABIERTO · **Nace:** 30-ago-2026, de un defecto que el founder vio
> en su portada. **No bloquea** —hay un rodeo funcionando— pero el rodeo es
> exactamente lo que rompió.

---

## ① Lo que pasó

La portada del prestador decía **«0 animales por día»** y su taller **8**.
**Las dos leían LA MISMA fuente** —`obtenerCupoGuarderia(hoy, hoy)`— y la
interpretaban distinto:

```
portada: cupo[0]?.capacidad ?? 0           → 0
taller:  if (capacidad > 0) setCapacidad() → se quedaba en su default useState(8)
```

**Medido: el 30-ago es DOMINGO y el lugar abre L-V** ⇒ el cupo de hoy vale `0`.
La portada mostró ese 0 **rotulado como la capacidad del negocio**; el taller
mostró su default, **un número que no había leído**. *Acertaba por casualidad:
la capacidad real resulta ser 8.*

## ② Y adentro había una pérdida de datos

`guardar()` manda `capacidadPorDia: capacidad`. **Un prestador con capacidad 12
que abriera su taller un sábado** habría visto 8 y al guardar **se la habría
bajado a 8, sin un solo error**. Dos de cada siete días, en la pantalla donde
se configura el negocio.

🔴 **Y me pasó a mí:** una sonda mía apretó Guardar un domingo. El residuo salió
idéntico **porque la capacidad real coincidía con el default**.

---

## ③ La causa, y es una que yo mismo declaré

`guarderia_espacios.capacidad_por_dia` **no tiene lector**:
`definirEspacioGuarderia` es sólo escritura. Lo declaré en la cabecera del
taller —*«la capacidad de hoy se deriva de `obtenerCupoGuarderia`… se declara
para que nadie lea esto como el modelo final»*— **y lo dejé derivando de HOY.**

> **Declarar un atajo no lo hace seguro.** El rodeo estaba escrito, firmado por
> mí, y rompió igual.

---

## ④ Lo que te pido

```ts
obtenerEspaciosGuarderia(prestadorId)
  → { id, nombre, capacidadPorDia, diasOperacion, activo }[]
```

Con eso las dos superficies leen **el dato declarado** en vez de derivarlo, y
**se cierra también el otro rodeo que declaré**: hoy el selector de días lee
`dias_operacion` **de las franjas**, como espejo, porque tampoco hay lector.

---

## ⑤ Lo que hago mientras tanto

`apps/prestador/src/lib/capacidad-guarderia.ts`: **una sola función para las dos
superficies**, que lee el cupo de **14 días y toma el máximo** — la capacidad
declarada es una sola para todos los días, así que el máximo sobre la ventana
ES ese número.

Y lo importante: **`null` es «no sé» y no «cero»**. Sin lectura el taller
**dibuja un esqueleto en vez de un número** y el botón de guardar queda apagado
*—un stepper con un valor inventado invita a guardarlo, y guardarlo pisaba la
configuración del prestador.*

**Verificado un domingo: portada 8 · taller 8.** Antes: 0 y 8.
