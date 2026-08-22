# S103 · C → A — el motivo del corrimiento en `calcularPromesaDespensa`

> **Pedido de motor, autorizado por el founder** (23-ago) al ratificar la cura
> del checkout. **C no lo escribe: `packages/api` es territorio de A.**
> **Prioridad: baja.** *La mentira ya está curada; esto recupera precisión.*

---

## ① El caso, medido

`calcularPromesaDespensa` (`packages/api/src/wrappers/despensa-pedido.ts:176`)
devuelve **`saltos_por_cupo`** y **no** `motivoCorrimiento`. El campo existe
**solo** en `promesaPorVendedor` (`despensa-catalogo.ts`) — verificado por grep:
tres apariciones, las tres en ese archivo.

**La consecuencia que se cobró:** `checkout.tsx:1012` pintaba
`despensa.saltoPorCupo` —*«El día más cercano estaba **completo**»*— con
`saltos_por_cupo > 0` **a secas**. Es el rojo del 18-ago que la propia cabecera
de `PromesaDeVendedor` documenta:

> *«prometía con `saltos: 1` y el cupo VACÍO, porque era domingo y nadie
> reparte los domingos»*

⇒ **un domingo, el checkout afirmaba una escasez que no existe**, y eso hace
perder una venta por un inventario imaginario.

## ② Lo que C ya hizo, para que el pedido se dimensione bien

**La línea está curada y no espera a nadie:** pasa a `despensa.saltoSinCausa`,
que dice **que la entrega corrió sin afirmar por qué**. *Perder precisión es
barato; afirmar falso no.*

**Esto NO es un bloqueante.** Es una pérdida de precisión aceptada a
propósito: hoy el checkout dice menos de lo que el motor sabe.

## ③ El pedido

**Que `calcularPromesaDespensa` exponga `motivoCorrimiento`**, con el mismo
vocabulario cerrado y el mismo guard fail-closed que ya tiene
`promesaPorVendedor`:

```
'sin_operacion' | 'cupo_lleno' | 'mixto' | null
```

🔴 **La condición que importa más que el campo: el `null` tiene que seguir
significando «no sé por qué se corrió», JAMÁS caer en `cupo_lleno`.** Ese
fail-closed **de significado** es lo que evita que el defecto vuelva por la
puerta de la cura — un default «razonable» hacia `cupo_lleno` reintroduce
exactamente la afirmación falsa que este pedido viene a eliminar.

## ④ Qué hace C cuando llegue

Una línea en `checkout.tsx`: el mismo trío que ya corre en la ficha —
`cupo_lleno` → `saltoPorCupo` · `sin_operacion` → `saltoPorSinOperacion` ·
`mixto`/`null` → `saltoSinCausa`. **Las tres voces ya existen en `es`/`en`**
(nacieron con el enchufe de `D-872` b). **Cero voz nueva, cero pieza nueva.**

## ⑤ La alternativa que C descartó, y por qué

**Mover el checkout entero a `promesaPorVendedor`** habría dado el campo sin
tocar motor. Se descartó por dos razones, y la segunda es la fuerte:

1. **Alcance:** el founder cerró la autorización *«a esa línea»*.
2. 🔴 **Los dos lectores no reportan el fallo de la misma forma, y el checkout
   está construido sobre esa diferencia.**

   · `calcularPromesaDespensa` → `ResultadoWrapper<PromesaEntrega>`: **el fallo
   sale por `r.codigo`, FUERA del dato**, y el checkout lo guarda como
   `{ fallo: r.codigo }`.
   · `promesaPorVendedor` → `ResultadoWrapper<PromesaDeVendedor[]>`: **`r.ok`
   es `true` aunque el vendedor no pueda entregar** — el error viaja
   **ADENTRO de la fila** (`p.error`), y `fecha`/`desde`/`hasta` son
   *nullables*.

   **Medido: el checkout depende de la primera forma en seis lugares** —
   `checkout.tsx` líneas 165 · 288 · 355 · 385 · 992 · 1222—, y **dos de ellos
   no son voz**: la 385 es `falta`, o sea **el gate del botón de pagar**, y la
   355 arma el selector de ventanas.

   ⇒ *Cambiar de lector para conseguir un campo habría tocado el gate del
   botón de pagar como efecto colateral de una cura de voz.* **Y esa clase ya
   tiene ficha en esta pista:** el default de DeUna dejó `BotonPagar`
   habilitado sin poder cobrar por mirar el símbolo equivocado. *Un botón que
   se deja tocar y rebota es peor que uno apagado.*

   ⏪ **Corrección de una afirmación propia:** el primer borrador de este
   pedido decía que la diferencia era que `promesaPorVendedor` **no acepta
   fecha programada**. **Es FALSO** — la acepta (`promesaPorVendedor(cuentas,
   fechaProgramada?)`). *Lo escribí sin medirlo y lo corrijo acá en vez de
   dejarlo: un pedido con una premisa falsa adentro es peor que no mandarlo,
   porque su lector la hereda.* La diferencia real es la de arriba, y es más
   fuerte. (Lo que `calcularPromesaDespensa` sí tiene y la otra no es un tercer
   parámetro, `servicio_envio`.)
