# S86-A · PROPUESTA — las paredes del taller (configuración de horarios)

> **ESTO NO ESTÁ CONSTRUIDO NI FIRMADO.** Es la propuesta que la orden
> pidió **antes** de mover una línea de composición (regla de la casa: las
> láminas se firman antes de construir).
>
> **Ancla:** `pista/s86-a` sobre `2ccc050` · medido 2026-08-04 -05.
> **Archivo:** `apps/prestador/src/components/seccion-horarios.tsx` — **1.526 líneas.**

---

## 1 · EL DIAGNÓSTICO, con el número

El founder dijo: *«sin todas las paredes y algunas transparencias que se
pierden en el fondo»*. **Las dos mitades se midieron y son cosas
distintas.**

### La transparencia NO existe — ya está curada en otro lado

Medido: **ningún componente del taller aporta vidrio ni opacidad de
fábrica.** `vidrioOficio` tiene dos consumidores en toda la casa
(`TresNumeros`, `LogoNegocio`) y ninguno es de esta pantalla; las únicas
opacidades son de spinner.

**Lo que se leía como transparencia era una tarjeta blanca sobre papel
casi blanco, contraste `1.052`, cuyo único límite era una sombra.** Eso
se curó en la primitiva (enmienda de la regla Chanel, S86) y **no
pertenece a esta propuesta.**

### Las paredes SÍ faltan, y el conteo lo dice

| | |
|---|---|
| líneas de la pantalla | **1.526** |
| `<Tarjeta>` en todo el archivo | **6** |
| de esas, **en el scroll principal** | **1** — y es el estado vacío (`tinte="warning"`) |
| las otras 5 | viven **dentro de Hojas** (3 con `relleno="ninguno"`) |

> **El cuerpo del taller no tiene UNA superficie.** Es una cadena de
> `<View>` + `<Texto>` sobre el fondo: encabezado, hint, la lista de
> personas, el modo de horarios, la lista de franjas — todo flotando.
> *No es que las paredes sean tenues: no están.*

---

## 2 · LA PROPUESTA — qué merece superficie y qué NO

**El criterio que se propone, y es lo único que hay que firmar:**

> **Merece superficie lo que el prestador puede TOCAR como una unidad.**
> Lo que solo explica —encabezado de sección, hint, ayuda— queda suelto
> sobre el fondo, porque encerrar prosa la disfraza de control.

Es el mismo eje que la casa ya usa en el chevron (E14: *información
despliega, acción lleva*), aplicado a la superficie en vez de al gesto.

### El agrupamiento propuesto

| # | bloque | ¿superficie? | por qué |
|---|---|---|---|
| **①** | «Jornadas» — título + hint | **NO** | Es rótulo de sección. Encerrarlo lo vuelve una tarjeta que no se puede tocar |
| **②** | **La lista de personas** (una fila por persona con su subtítulo) | **SÍ — UNA tarjeta que contiene las N filas**, con `Separador` entre ellas | Es una unidad: «tu gente». Cada fila ya es tocable. Precedente literal en esta misma casa: `Tarjeta relleno="ninguno"` + `Celda` + `Separador`, que la pantalla YA usa dentro de sus Hojas |
| **③** | El estado vacío «no hay nadie» | **SÍ — ya la tiene** (`tinte="warning"`) | Sin cambio. Es la única pared que hoy existe y está bien puesta |
| **④** | **El modo de horarios** (universal vs por servicio) + su explicación | **SÍ — una tarjeta** | Es UNA decisión con consecuencias (convierte franjas). Merece su caja porque es una unidad de decisión, no prosa |
| **⑤** | **La lista de franjas** (hora, cupo, días) | **SÍ — UNA tarjeta por GRUPO de días**, filas adentro | Es el corazón del taller. Hoy cada franja flota; agrupada por día se lee como «mi semana» y no como una lista infinita |
| **⑥** | Textos de ayuda (`taller.horariosExplica`, `cupoExclusivo`, `vozCupoAyuda`, techo) | **NO** | Explican. Suelto sobre el fondo, con su `variante="apoyo"` |
| **⑦** | Lo que vive dentro de Hojas | **SIN CAMBIO** | Ya tiene sus tres `Tarjeta relleno="ninguno"`. Una Hoja ya ES una superficie: meterle otra pared adentro es la caja dentro de la caja |

**Resultado esperado: de 1 superficie en el scroll principal a 4** (②, ③,
④, ⑤). No 20 — **la propuesta no es "poner tarjetas": es agrupar lo que ya
es una unidad y dejar suelto lo que solo habla.**

---

## 3 · LO QUE ESTA PROPUESTA **NO** DECIDE, declarado

- **No toca el ORDEN de los bloques.** Mover jerarquía es otra decisión y
  el founder no la pidió.
- **No toca la Hoja del miembro ni la barra del prestador.** Están fuera
  del alcance y **deben verse idénticas** — va en la checklist del gate.
- **No propone tokens nuevos.** Todo sale de `Tarjeta` + `Celda` +
  `Separador`, que la pantalla ya importa. Si algo pidiera un token nuevo,
  eso sería señal de que el agrupamiento está mal pensado.
- **No decide qué pasa con las otras 84 pantallas** que montan `Tarjeta`.
  La cura de la primitiva ya las alcanza a todas; el **agrupamiento** es
  de esta pantalla y solo de esta.

---

## 4 · EL RIESGO QUE HAY QUE MIRAR EN EL GATE

**La cura de la primitiva y este agrupamiento se suman.** Con el hairline
recuperado, **cuatro tarjetas nuevas es cuatro bordes nuevos** — y el
riesgo simétrico del que arrancamos es una pantalla **rayada**.

> *El defecto de hoy es «no hay paredes». El defecto de mañana sería
> «hay una pared alrededor de cada frase».*

Por eso la propuesta agrupa en **4** y no en 12, y por eso ⑥ queda suelto
a propósito. **El ojo del founder sobre píxeles es la firma (L-153)** — y
si en dispositivo se ve rayado, lo que sobra son tarjetas, no borde.

---

*Depositada por A, S86. Espera firma. Nada de esto está construido.*
