# S114-E → C · YA HAY UNA COMBINACIÓN QUE DA CERO

> **UN SOLO ASUNTO.** **Rama:** `pista/s114-e-1.0` · **script:**
> `scripts/s114/sembrar-casos-postventa.mjs` (paso ⑥) · **por RPCs, cero
> `INSERT`.** Sembrado el 8-sep-2026 ~05:40 Guayaquil.

---

## EL CASO

```
b630e1ce-113b-453d-9c4a-d21a5a4828c9
```

| | |
|---|---|
| **`objeto_fecha`** | **2026-08-17** — tres semanas atrás |
| clase · etapa | 1 · `resuelto` |
| servicio | `despensa` (pedido) |
| familia | `guillo381+8@gmail.com` |

**Es el ÚNICO fuera de «esta semana».** Los otros nueve caen dentro o son de
fecha futura, así que ahora **sí existen combinaciones vacías** — verificadas
sobre la salida real de `obtener_mis_casos`:

| combinación | resultado |
|---|---|
| «anterior a esta semana» + servicio **paseo** | **0** |
| «anterior a esta semana» + etapa **abierta** | **0** |
| (y la familia sigue teniendo 10 casos) | ⇒ **no es** «no tuviste que reclamar nada» |

*Eso es exactamente el par que tu rama separa: hay casos, pero no con esos
filtros.*

---

## 🔴 LO QUE NO PUDE HACER VIEJO, Y ES UN DATO QUE TE SIRVE

**`creado_en` no lo puede retroceder NINGUNA RPC** — lo pone `abrir_caso` con
`now()`. Si tu filtro de período mira `creado_en`, **este caso no te sirve** y no
hay forma de sembrarlo por la puerta: habría que backdatear por `UPDATE`, que es
justo lo que no se hace.

**Lo que sí se puede hacer viejo es `objeto_fecha`**, que es la otra fecha que
devuelve `obtener_mis_casos` — y es la que una familia piensa como «la fecha»:
la del servicio, no la del reclamo. **Sembré sobre esa.** *Si tu pantalla filtra
por la otra, decímelo y lo hablamos con la mesa: no es un ajuste de siembra, es
una decisión.*

---

## CÓMO SE CONSIGUIÓ, porque el camino tiene dos guards que vas a ver

La ventana de 7 días de `abrir_caso` cuelga **del CIERRE del objeto, no de su
fecha** — así que un pedido de agosto parado no sirve: su cierre también es de
agosto y la puerta rebota `fuera_de_ventana`.

1. **La familia NO puede cerrarlo.** Probado: `cancelar_pedido_despensa` con
   actor `cliente` desde `liberado_preparacion` rebota
   **`transicion_no_permitida`**. *El catálogo declara que desde ahí el único
   terminal es `cancelado_vendedor`, con actor `vendedor`.*
2. **Lo cerró el VENDEDOR**, por su puerta y con su sesión
   (`guillo381+…`, cuenta de prueba) ⇒ cierre = hoy, `entrega_fecha_objetivo`
   sigue siendo **2026-08-17**.
3. Recién entonces la familia abrió el caso, con motivo **`cancelado_vendedor`**
   (clase 1) — *coherente con la historia en vez de contradecirla: el pedido lo
   canceló el vendedor y la familia reclama la plata.*

⚠️ **Efecto declarado:** cancelar el pedido **libera su inventario**. Era uno de
agosto, **sin envío**, $23,00, y se eligió **el más barato de los disponibles**
para que el impacto fuera el mínimo.

---

## ES SIEMBRA, NO TRÁFICO

Marca `[SIEMBRA S114-E]` en `relato`:

```sql
select count(*) from casos_postventa where relato like '[SIEMBRA S114-E]%';
```

**Ningún número que salga de estas filas es línea base** — ningún dato de
servicio de esta base es real y producción es octubre.

## Y si se agota

```
node scripts/s114/sembrar-casos-postventa.mjs
```

Es **idempotente**: si ya hay un caso con objeto viejo, no crea otro. Si hiciera
falta uno nuevo, busca otro pedido viejo sin envío; **si no quedan, lo dice**
(`no hay pedido viejo sin envío al que darle cierre`) en vez de fallar.

---

*Y una cosa que hiciste bien y conviene que quede escrita: **no fabricaste el
dato para ver tu rama en verde.** Ese verde habría probado que la pantalla
dibuja, no que el caso existe — y el vacío honesto es justamente la rama donde
esa diferencia importa.*
