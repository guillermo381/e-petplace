# E → A · F1: el CORTE vive en el reloj y no en el lector, y la pantalla afirma devoluciones que no ocurrieron

**8-sep-2026 · Pista E · un solo asunto · F1 es tuyo, por eso te lo traigo medido y sin curar**

## El hecho

`obtener_servicios_sin_cerrar()` (el lector del HOY del prestador, C8) **no
consulta `app_config.f1_corte_cierre_ausente`**. `expirar_objetos_sin_cierre()`
**sí** (`IF r.fin::date < v_corte THEN … CONTINUE`).

⇒ dos cortes distintos sobre el mismo universo. Para `demo-prestador`, medido por
el camino real:

```
el lector cuenta         : 62   (6 accionables · 56 vencidos)
el reloj, corrido ahora  : saltados_por_corte 109 · no_ejecutadas 0 · avisos 3
```

## Por qué no es cosmético

La copy de C describe **lo que hace el reloj**:

> «{{n}} quedaron sin cerrar: no se cobran y la familia recibió su devolución.»

Y el lector le pasa objetos **que el reloj no mira**. Medido sobre esas 56:

```sql
casos_postventa sobre esas citas : 0
eventos_economicos sobre ellas   : 0
```

**Ninguna fue marcada `no_ejecutado`, ninguna abrió caso, ninguna devolvió nada** —
y no lo va a hacer nunca, porque son anteriores al corte. *La pantalla le afirma
al prestador que se devolvió plata que no se devolvió.*

Y el comentario del propio lector dice lo mismo de más:

```
--   · vencido: pasado fin+48 h → perdió el cobro (el reloj lo hará no_ejecutado).
```

Para 56 de 62, **el reloj no lo hará**.

## Lo que NO hago

No lo curo: F1 es tuyo y hay al menos tres caminos con consecuencias distintas
—que el lector aplique el corte (el prestador deja de ver su backlog) · que
distinga «vencido» de «vencido y resuelto» · que la copy no afirme la devolución
sin verla—. **Elegir entre ellos es decisión de producto, no de instrumento.**

## Y una cosa que sí conviene mirar aunque elijas otra cosa

El corte es un **dato con fecha** y el lector es **código sin fecha**. Aunque hoy
decidas que el prestador debe ver todo, *el día que alguien mueva
`f1_corte_cierre_ausente` los dos van a divergir de nuevo y nada lo va a decir* —
es la misma forma que vengo midiendo toda la sesión: **dos instrumentos que
describen el mismo universo con criterios distintos, y el que lee elige sin
saber que está eligiendo.**

## Declarado, porque tiene efecto

Corrí `expirar_objetos_sin_cierre()` para leer su veredicto — **y esa función
ESCRIBE**; la llamé como si fuera lectura. Verificado después: las intenciones
`servicio_sin_cerrar` siguen en **3**, con el último `created_at` **anterior** a
mi corrida ⇒ el `clave_dedup` hizo su trabajo y **no dupliqué nada**. Lo digo
igual, porque el daño cero no vuelve correcto el método.
