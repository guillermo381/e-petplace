# ☠️ FICHA `D-953` + LECCIÓN `L-431` — S107 (27-ago-2026)

> Números verificados libres **por grep** (tope real `D-952` · `L-430`).
> ⚠️ `D-945` sigue tomado y sin depositar (`docs/loop/S106-C-CIERRE.md:200`).

---

# `D-953` — EL DEDUP DE TARJETAS SE APOYA EN UNA PREMISA QUE EL PROVEEDOR DESMINTIÓ

## 🔴 LA PREMISA FALSADA — va arriba de todo

> ### «Mismo uid + misma tarjeta ⇒ mismo token.»

**Ese supuesto sostenía el dedup entero**, y el proveedor lo desmintió el 27-ago
**con dos tokens distintos en 40 segundos**:

```
dd8258ea · vi …1111 · token 73844175494540… · 21:36:58
2ba85936 · vi …1111 · token 48514361645560… · 21:37:28
        distintos = 2 sobre 2
```

La misma tarjeta, la misma cuenta, **el mismo uid estable** (`d5d42b92` en las
dos), y **Nuvei tokenizó dos veces de forma independiente.**

## El guard NO falló: nunca fue consultado

El mecanismo existe y está **bien construido**:

- índice `uq_tarjeta_token ON tarjetas_guardadas (proveedor, token)`
- `resolver_alta_tarjeta` con su `ON CONFLICT` y su código `ya_agregada`
- y la voz de C ya escrita: *«Esa tarjeta ya está agregada»*

**Deduplica por `token`. El proveedor emitió dos tokens distintos ⇒ para el
índice son dos tarjetas diferentes.** *Un guard correcto sobre una premisa falsa
no se rompe: se vuelve inalcanzable, y su voz no sale nunca.*

⚠️ **Y por eso el acto A no es el culpable, aunque el síntoma apareciera
después:** el uid quedó bien —las dos tarjetas cuelgan del estable, que era el
objetivo— y **② decide bajo qué uid quedan en Nuvei, no decide el dedup.**

## Estado de `④` — desplegada e INERTE, y no por defecto nuestro

```
stoken_detalle = "stoken_de=ninguno"   (en las DOS altas)
```

El stoken **nunca llega**, así que la fórmula ni entra a su `if`. Es la respuesta
de Erick del 27-ago: **el callback no envía el token de tarjeta** — se obtiene
del API de listado o del response del SDK. *La pieza está bien y espera un
insumo que hoy no viaja.*

## LO FIRMADO: **B primero** (founder, 27-ago)

> **Preguntarle a Erick si hay forma de que el proveedor devuelva el MISMO token
> para el mismo uid + la misma tarjeta.**

*Antes de construir un dedup con un falso positivo posible, va la pregunta: su
respuesta ya cambió el diseño dos veces en un día.*

### Si Erick dice que no hay forma → camino **A**, y su riesgo va DECLARADO ANTES de construir

Dedup por `(user_id, proveedor, bin, ultimos4, expira_mes, expira_anio)`.

> 🔴 **EL FALSO POSITIVO, escrito antes de la primera línea de código: dos
> tarjetas DISTINTAS pueden compartir los seis campos** — mismo BIN (mismo banco
> y producto) y mismos últimos cuatro. Es raro, **no es imposible**.
>
> **Y su asimetría es la que decide el diseño: rechazar una tarjeta legítima es
> peor que dejar entrar una repetida.** Una repetida es desprolijidad; una
> rechazada es una familia que no puede pagar y no entiende por qué.

⇒ Si se construye A, **el rebote no puede ser final**: tiene que ofrecer seguir
igual, o el guard causa más daño del que evita.

**Camino C, registrado sin elegir:** dedupear contra `card/list` del proveedor
antes de guardar. Usa la verdad del otro lado; cuesta un viaje más en el alta y
depende de su disponibilidad.

---

# `L-431` — UN INSTRUMENTO CUYOS VALORES PRESUPONEN LA CONDICIÓN QUE VIENE A MEDIR

> ## Un instrumento cuyos valores presuponen la condición que viene a medir tiene un punto ciego **en el único caso que importa**.

## El caso, y lo pagó en su primer uso

Al construir la pieza ④ diseñé el discriminador con **tres valores**, y le dije
al founder que servían para saber qué había pasado:

| valor | qué significaría |
|---|---|
| `formula=candidata_transaccion_uid` | ④ corrió |
| `formula=no_evaluada:sin_uid_estable` | la edge no encontró el uid |
| `formula=candidata_transaccion` | ④ no llegó |

**Los tres presuponen que hay stoken.** El mundo real devolvió un cuarto valor
que yo no había previsto —**`stoken_de=ninguno`**— y con él **el instrumento no
podía distinguir «④ corrió mal» de «④ no tuvo nada que evaluar»**, que son
diagnósticos opuestos: uno manda a revisar código, el otro a hablar con el
proveedor.

## Por qué es distinta de «un instrumento que no imprime no midió nada»

Aquélla es sobre el **silencio**. Ésta es peor: **el instrumento HABLA**, y su
respuesta se lee como un dato sobre lo que vino a medir cuando en realidad es un
dato sobre su propia precondición. *Un valor inesperado en una enumeración
cerrada no se lee como «no sé»: se lee como ruido, y quien lo mira sigue de
largo.*

## La regla que deja

**Todo discriminador declara qué pasa cuando su PRECONDICIÓN no se cumple**, y
ese caso es un valor de primera clase, no un `else`. *La pregunta al diseñarlo no
es «¿qué valores puede tomar lo que mido?» — es «¿qué veo si lo que mido nunca
ocurrió?».*

⚠️ Y su corolario operativo, que es lo que hay que hacer con ella: **al leer un
discriminador propio por primera vez, el primer chequeo no es qué valor trajo —
es si su precondición se cumplió.**
