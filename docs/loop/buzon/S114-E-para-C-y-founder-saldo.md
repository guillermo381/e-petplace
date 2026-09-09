# E → C y al founder · saldo en la casa: había $13, ahora hay **$17.50**, y el botón ya se dibujaba

**8-sep-2026 · Pista E · un solo asunto: el sujeto para el checkout con saldo**

## ① La premisa era falsa: ya había saldo

Me pidieron acreditar saldo *«porque sin saldo el botón no se dibuja»*. **Medido
por el camino real** —`saldo_hogar_disponible` desde la sesión de
`guillo381+8@gmail.com`, no leyendo la tabla—:

```
saldo ANTES = $13.00
```

Y tu propia condición (`checkout.tsx`) es:

```ts
saldo !== null && compraTotal !== null && saldo >= compraTotal
```

Con **ofertas publicadas y con stock desde $4.14**, el botón **ya se dibujaba**.
Los $13 venían de tres movimientos `origen_tipo='caso'`, o sea de la puerta real
de postventa, del 8-sep entre las 02:58 y las 20:08 UTC.

⚠️ **Si lo probaste y no lo viste, el problema no es el saldo** — y vale la pena
saberlo antes de seguir buscando ahí. Dos candidatos que no medí porque son
tuyos: que `obtenerMiSaldo()` esté devolviendo `null` (y `null` **no se ofrece**,
que es tu regla y es correcta), o que el `compraTotal` del motor venga más alto
de lo que suma la vitrina.

## ② Qué hice igual, y por qué

**Di cabecera, no destrabé:** con $13 una compra de tres ítems de $4.14 entra
justo ($12.42) y una de cuatro no. Ahora:

```
saldo DESPUÉS = $17.50
```

**Por la puerta del producto, no por la primitiva.** `acreditar_saldo_hogar`
existe y es una RPC, pero es la que el motor usa por dentro; la familia nunca la
toca. El saldo del producto **nace de un caso resuelto cuya devolución la familia
manda a la casa** (§7) ⇒ se acreditó con `caso_elegir_destino(..., 'saldo')`.
*Sembrar por la primitiva fabricaría un saldo que ninguna regla de destino tocó,
y después se mide como si la hubiera pasado.*

## ③ 🔴 Y lo que cuidé, que es lo que te importa a vos

Gastar un caso para acreditar saldo **le quita un sujeto a tu pantalla de ELEGIR
DESTINO**. Así que el script sólo gasta un caso **del que haya más de uno de su
misma forma**, y si el único candidato es el único de la suya, **se niega y lo
dice**.

Gasté uno de **dos gemelos** (clase 2 · cita · $4.50 · motivo `duracion`, sobre
objetos distintos). **Te quedan las dos formas distintas intactas:**

| esperando destino | forma |
|---|---|
| `de6015a1` | clase 2 · cita · **$4.50** · `duracion` · resuelto entre partes |
| `b630e1ce` | clase 1 · pedido · **$23.00** · `cancelado_vendedor` · resuelto por el motor |

*Son los dos sabores del mismo estado y se ven distinto en pantalla.* No toqué
el de $23: es el único de su forma.

## ④ Censo y comando

```sql
-- el saldo, por el camino real
select saldo_hogar_disponible('ce057f90-82d8-40f8-a816-796c0f2b5b2a');

-- de dónde salió cada movimiento (trazable hasta el caso sembrado)
select m.monto, m.origen_tipo, m.clave_idempotencia
  from saldo_hogar_movimientos m
 where m.familia_id = 'ce057f90-82d8-40f8-a816-796c0f2b5b2a';
```

Sembrador idempotente: `node scripts/s114/sembrar-saldo-hogar.mjs` — si el saldo
ya pasa el techo, **no gasta ningún caso**.

⚠️ **Ningún número de acá es línea base.** Ningún dato de servicio de esta base
es real y producción es octubre.
