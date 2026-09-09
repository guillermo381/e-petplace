# 🔴 S114-A · El devengo de guardería iba a rebotar, y no por el string

> **A, 7-sep-2026.** Sale de la adenda 3 y **la da vuelta**. Se deposita acá
> porque la mesa reordenó la cola (A3 primero) y esto **no puede perderse**:
> bloquea A6.

## Lo que la adenda decía, y lo que el objeto dice

La adenda: *«`origen_tipo` no tiene CHECK y su único valor vivo es `cita`; cada
productor va a elegir su string por su cuenta.»*

**Las dos mitades son ciertas y la conclusión no.** `origen_tipo` **ya tiene
vocabulario cerrado** — nueve valores, y con algo mejor que un CHECK: un trigger
que además valida **integridad referencial por tipo**.

```
trg_validar_origen_evento → validar_origen_evento()
  pedido · cita · donacion · producto_comercial · suscripcion ·
  bono · estadia · ajuste_manual · evento_diferido
```

⚠️ **Mi censo no lo vio** porque preguntó por `pg_constraint` con
`contype='c'`, y esto **no es un CHECK: es un trigger**. Misma clase que el
ciego de los productores por fila. *Un censo por una forma no ve la otra forma.*

## 🔴 El defecto real, que es peor que el enunciado

```sql
WHEN 'estadia' THEN
  SELECT EXISTS(SELECT 1 FROM estadias WHERE id = NEW.origen_id) INTO v_existe;
```

| tabla | filas | qué es |
|---|---|---|
| `estadias` | **0** | ☠️ **LÁPIDA (S107-A, 28-ago-2026)** — «tabla del legado, semántica de NOCHES» |
| `guarderia_estadias` | **96** | «S107 · Una estadía = UN animal, UN día» — **la que la letra firma** |
| ids en común | **0** | — |

> ### **El validador apunta a una tabla muerta. Un evento de guardería con `origen_tipo='estadia'` y el id de una `guarderia_estadias` REBOTA con «no existe en la tabla correspondiente».**

**Probado, no leído.** Sonda escribiendo de verdad, en subtransacción que se
deshace:

| `origen_tipo` | veredicto |
|---|---|
| `guarderia_estadia` | rebota — *«no es un tipo válido»* |
| `cualquier_cosa_xyz` | rebota — *«no es un tipo válido»* |
| `estadia` · `cita` · `pedido` | rebotan — *«con origen_id=… no existe en la tabla correspondiente»* (ids sintéticos) |

⚠️ **Y el primer intento de esta sonda dio un rojo por la razón equivocada:**
con `tipo_evento='venta'` los cinco casos «rebotaron», pero por el enum de
`tipo_evento`, no por `origen_tipo`. **Lo delató el discriminador**: `cita`, que
es legítimo, también rebotaba. *Un arnés donde el caso bueno también falla no
está midiendo lo que cree.* (Es `L-513` cobrándose el mismo día que se escribió.)

## Por qué esto habría costado caro

Los cuatro productores de A6 escriben con `crear_evento_economico()`. El de
guardería **habría fallado en ejecución**, no en compilación ni en gate — y su
modo de falla es el que §6 de la letra existe para cerrar: **sin evento
económico, la pregunta «¿este objeto tiene devengo?» contesta NO**, y la
devolución se va por la rama declarada mientras el prestador conserva su
devengo. *Falla silenciosa con plata de por medio.*

## La cura, que NO es la que la adenda pedía

**No hace falta `cat_origen_evento`:** el vocabulario ya existe y es más fuerte
que un CHECK (valida existencia, no sólo el string). Lo que hace falta es:

1. **`validar_origen_evento` apunta a `guarderia_estadias`**, con lápida en el
   `WHEN 'estadia'` explicando que `estadias` está muerta desde S107.
2. **Rojo probado antes del verde:** hoy un id real de `guarderia_estadias`
   rebota; después tiene que entrar. Y el contra-caso: un uuid inventado sigue
   rebotando (si no, la cura sería «sacar la validación»).
3. **§8 de la letra ya nombra el ancla en su columna** (enmienda ②, reparada
   hoy — estaba partiendo la tabla y dejando `despensa` afuera).

**Los 36 eventos vivos son `cita` y quedan como están.** Migrar no aplica: no
hay una sola fila con `estadia`.

## ⑤ Para E — la tolerancia de vocabulario

**Puede cerrarse, pero por otra razón que la que la adenda daba.** No es que el
vocabulario vaya a existir: **ya existía**. Lo que hay que vigilar no es el
string sino **a qué tabla resuelve cada uno** — y ese es el rojo que vale:

> **Un `origen_tipo` cuyo `WHEN` apunte a una tabla con 0 filas y lápida en su
> comentario.** Ése es el defecto que estaba vivo, y ningún gate de vocabulario
> lo habría encontrado.
