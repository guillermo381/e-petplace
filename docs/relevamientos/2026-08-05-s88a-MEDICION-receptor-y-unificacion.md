# S88-A · DOS MEDICIONES: el receptor de `registro_completado_*` · y la unificación de las voces

> **Pedido de la mesa: medir. Lo segundo, con el freno explícito de traerlo si
> resulta más grande de lo que parece.**

---

# ① EL RECEPTOR REAL de `registro_completado_*`

## El hecho, leído del trigger entero

`_trg_completar_pendiente_registro` dispara cuando **el cliente completa su
registro** y el sistema lo empata con un pendiente que **un negocio creó por
él** (alta asistida). En ese momento hay **TRES personas** en escena:

| quién | en el código |
|---|---|
| **el cliente** que acaba de registrarse | `NEW.id` |
| **el dueño** del negocio | `v_prestador_dueno_user_id` |
| **quien creó el pendiente** (puede ser un empleado) | `v_pendiente.creado_por_user_id` |

## La lectura del diseño original — y es A, no la que el NOMBRE sugiere

**El guard lo delata:**

```sql
IF v_pendiente.creado_por_user_id IS NOT NULL
   AND v_pendiente.creado_por_user_id <> v_prestador_dueno_user_id THEN
```

> **Ese `<>` solo tiene sentido si el destinatario ES `creado_por_user_id`.**
> Se escribió para **no notificar dos veces a la misma persona** cuando el
> dueño hizo el alta él mismo. *Quien escribió el bloque sabía exactamente
> quiénes eran las dos audiencias — y las dos son del NEGOCIO.*

**Y el segundo literal lo confirma:** `datos` lleva `cliente_nombre`.
**A nadie se le dice su propio nombre.** El receptor es alguien a quien se le
habla **sobre** el cliente, no el cliente.

## 🔴 ⇒ EL NOMBRE MIENTE, Y ES LO ÚNICO QUE HAY QUE ARREGLAR

`registro_completado_cliente` **no va al cliente**: va **al operador que hizo
el alta**. *El tipo se llama por el sujeto del hecho y se lee como el
destinatario del aviso.*

**Tres salidas para la mesa:**

| | qué | costo |
|---|---|---|
| **1** | **Renombrarlo** (`registro_completado_operador`) y firmar las dos voces | migración de catálogo + el productor. **Voto de A** |
| **2** | **Matarlo**: que el aviso al dueño alcance | pierde al operador, que es quien esperaba la confirmación |
| **3** | **Reapuntarlo al cliente** de verdad | choca con `cliente_nombre` en `datos` y deja al operador sin aviso |

## Y el dato que ordena la urgencia

```
pendientes totales .................. 3
creados por el DUEÑO ................ 3
creados por OTRA persona ............ 0
```

> **`registro_completado_cliente` NUNCA SE HA DISPARADO** — el guard exige que
> sean distintos. **Se enciende el día que una recepcionista haga el alta**, que
> es exactamente para lo que existe el mostrador. *Hoy no sangra: es «no hay»,
> no «no puede».*

## 🟠 Y un hueco que la medición destapa, para no perderlo

**Al CLIENTE no se le avisa nada** — y su situación es peculiar: **se registra y
aparecen mascotas que él no cargó**. *Eso ya tiene nombre en esta casa: es el
hallazgo #4 de S70, «EL MOMENTO DE ENAMORAMIENTO» del reclamo fantasma — el
usuario llega del vet sin contexto.* **No propongo un tipo nuevo: apunto a que
la necesidad ya está reconocida y su lugar no es un correo.**

---

# ② LA UNIFICACIÓN DE LOS DOS MECANISMOS DE VOZ

## Lo que la medición encontró primero: **no son dos mecanismos, son dos DOCTRINAS**

En el cuerpo de `_notificar_dueño_prestador`, escrito:

> *«La voz viaja en `datos` — **el motor no compone texto, lo hace la
> superficie**.»*

Y `_voz_notificacion` **compone texto en el motor**.

> ### **DOS POSICIONES DE DISEÑO, LAS DOS ESCRITAS, LAS DOS VIVAS.**
> *Es la forma exacta de las dos letras firmadas que se contradicen — pero en
> código, donde ni siquiera hay un documento que citar.*

**Y la contradicción ya está resuelta por medición, no por gusto: D-667 probó
que el correo NO TIENE SUPERFICIE.** Si el motor no compone, el correo sale con
el genérico. **La doctrina del wrapper perdió contra un hecho.**

## El costo, medido

```
_notificar_dueño_prestador   1 función · 6 parámetros · 26 líneas
callers                      2 triggers · 6 call sites   ← el censo completo
otros consumidores           0
escribe en la tabla legacy   NO (0 escritores)
```

**Es CHICO.** No es más grande de lo que parece.

## Dos diseños — y el barato es también el más seguro

### (a) BIG BANG — cambiar la firma
Sacar `p_titulo`/`p_mensaje`, mover las 6 voces al helper, actualizar los 2
triggers. **Una migración, tres funciones.** Exige `DROP FUNCTION` de la firma
vieja (L-119) y que los dos triggers se reemplacen **en el mismo acto**.

### (b) ⭐ EL HELPER GANA, EL INLINE ES EL PISO — **voto de A**

**La firma NO cambia.** El wrapper consulta el helper y usa el inline solo si
el helper no tiene voz:

```sql
v_voz := public._voz_notificacion(p_tipo, v_user_id, NULL, coalesce(p_datos,'{}'));
… p_datos => coalesce(p_datos,'{}')
             || jsonb_build_object('url_accion', p_url_accion)
             || CASE WHEN v_voz <> '{}'::jsonb
                     THEN v_voz                                   -- el helper manda
                     ELSE jsonb_build_object('titulo', p_titulo,  -- el piso
                                             'mensaje', p_mensaje) END
```

**Por qué gana:**

- **Cero callers tocados.** Los 6 call sites siguen compilando.
- **Las voces migran DE A UNA**, cuando la mesa firme cada una — que es como
  esta casa firma voces.
- **El fallback muere por medición, no por decreto:** el día que los 6 tipos
  tengan voz en el helper, ningún camino llega al `ELSE` **y recién ahí** se
  sacan los parámetros. *Un guard puede contarlo.*
- **Reversible en una línea.**

> **Y la doctrina queda UNA, escrita donde se lee:** el motor compone; la
> superficie presenta. El comentario del wrapper se corrige en el mismo acto —
> *dejarlo sería conservar la letra que perdió.*

## El par que lo verifica

```
① los SEIS avisos siguen existiendo y con su voz          (ninguno cae al genérico)
② un tipo CON voz en el helper → gana el helper           (discriminador: texto distinto)
③ un tipo SIN voz en el helper → cae al inline, intacto   (no-regresión)
④ `url_accion` sobrevive en los cuatro                    (lo que nadie mira y se pierde)
```

**Y el bilingüe entra con las voces al helper** — el inline es solo español, y
por eso ninguno de los seis puede salir de sombra hasta migrar.
