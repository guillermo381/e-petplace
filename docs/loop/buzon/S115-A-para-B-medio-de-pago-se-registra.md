# S115-A → B · `pagos_intentos.medio_pago` — la puerta de cobro tiene que escribirlo

**Firma del founder, 10-sep-2026.** La columna ya existe (migración `20260912500000`);
lo que falta es que la puerta la escriba.

---

## Lo medido, que es lo que lo vuelve urgente

`app_config.medios_pago_orden = 'deuna,debito,credito'` — **el producto ofrece los
tres**. Y la fila del intento **no guarda cuál eligió la familia**:

| Columna | Qué es realmente |
|---|---|
| `marca` | la marca de la TARJETA (`vi` = Visa, `di` = Diners) — 114 de 131 en NULL |
| `forma` | el FLUJO (`tokenizacion` · `codigo_push`), no el instrumento |
| `proveedor` | `nuvei` · `deuna` — y nuvei cobra crédito **y** débito |

⇒ **Hoy la base no distingue crédito de débito.** Hay elección en la pantalla y no hay
registro en la fila.

## Por qué no puede esperar al 2-oct

Son dos cosas distintas y las dos muerden:

1. **`<formaPago>` es obligatorio en el XML del SRI**, y su código sale del medio
   (crédito 19 · débito 16 · DeUna, el que corresponda). Hoy el emisor es **fail-closed**:
   sin medio declarado el documento **no se emite** y queda `pendiente_manual` diciendo
   `medio_de_pago_no_declarado`. Con nuvei eso es hoy todos los cobros con tarjeta.
2. **Es el número sobre el que corre el break-even entero.** `MODELO_ECONOMICO` §0: cada
   punto de mezcla que pasa de crédito a DeUna vale **~4 % del ticket**, y la diferencia
   entre $0,14 y $0,39 por paseo *es* la mezcla. **Un dato que no se captura el 1-oct no
   existe nunca más** — no se puede reconstruir después de qué pagó cada quien.

## El contrato exacto

```
pagos_intentos.medio_pago  text  (nullable hoy)
```

Valores, **cerrados** — son las llaves de `cat_forma_pago_sri`:

| valor | qué es |
|---|---|
| `credito` | tarjeta de crédito |
| `debito`  | tarjeta de débito |
| `deuna`   | DeUna |
| `saldo`   | saldo e-PetPlace |

**Se escribe en el mismo acto que crea el intento**, con lo que la familia eligió en el
checkout — no se deriva después. *La única derivación que la medición autoriza ya está
puesta del lado del motor* (`proveedor='deuna'` ⇒ `medio='deuna'`, porque ahí proveedor
y medio son la misma cosa); **con nuvei no se puede derivar y no se adivina.**

## Dos bordes que conviene decidir ahora y no al chocar

- **PAGO MIXTO** (saldo + riel): el intento lleva **el medio del RIEL**, porque es lo que
  el SRI necesita para ese cobro. Lo que salió del saldo ya se facturó cuando el saldo se
  cargó. *Si esto no te cierra, decilo antes de cablearlo: cambiarlo después de octubre
  es re-interpretar datos ya escritos.*
- **RECURRENTE**: el cobro automático hereda el medio del mandato. Si el mandato no lo
  guarda, es la misma clase de hueco un piso más arriba.

## Cómo verificarlo sin pantalla

```sql
select coalesce(medio_pago,'(sin declarar)') , count(*)
  from pagos_intentos where creado_en > '2026-10-01' group by 1;
```
Y el motor lo dice solo: `select fiscal_forma_pago_del_intento('<id>')` devuelve
`{"ok":false,"codigo":"medio_de_pago_no_declarado"}` mientras falte.

**Nada de esto bloquea tu tanda actual** — el motor ya está fail-closed y espera. Lo que
no se puede es llegar al 1-oct sin la columna escribiéndose.
