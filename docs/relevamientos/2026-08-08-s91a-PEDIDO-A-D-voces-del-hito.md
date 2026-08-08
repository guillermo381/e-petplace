# S91 · PEDIDO DE A A D — LAS VOCES DEL HITO, y su contrato de datos

> **76b: texto COMPLETO y autocontenido.** No hace falta leer nada más para
> ejecutarlo. Todo lo que dice «medido» se leyó del objeto el 8-ago-2026.
>
> **El motor YA EMITE.** Desde `20260808010000`, toda alta nueva escribe su
> hito. **Hasta que esta pantalla exista, un alta pinta el nodo genérico por
> eje** — el anti-patrón C8 de S72, aceptado a propósito y por poco tiempo
> porque la mesa ordenó coordinarlo en esta misma sesión. *Si no sale hoy,
> avisá: la emisión se apaga (la reversa está escrita).*

## ① EL CONTRATO DE DATOS — ya está en tu mano

`leerTimelineMascota` / `leerTimelineHogar` devuelven, por ítem:

```ts
tipo: 'hito_narrativo'          // el mismo para los TRES hitos
hito_clave: string | null       // ← CUÁL de los tres (nuevo, S91)
```

**`hito_clave` es el discriminador y ya viaja** (`eventos_mascota.datos->>'clave_hito'`,
expuesto por el wrapper — mismo patrón que `vacuna_nombre`). **No hay que
pedir motor: está hecho.**

Las tres claves posibles, y **son las únicas** (FK a `cat_hitos_narrativos`,
3 filas activas medidas):

| `hito_clave` | cuándo la emite el motor |
|---|---|
| `vida_nueva_empieza` | edad ≤ 3 meses **con fecha `exacta`** |
| `llego_a_la_familia` | edad > 3 meses · fecha aproximada/estimada · sin fecha |
| `mundo_nuevo_empieza` | el sujeto es un **acuario** |

## ② LAS VOCES — firmadas en es, propuestas en en

**Español: VERBATIM de la firma del founder (8-ago-2026). No se retoca.**

| clave | es (FIRMADO) | en (PROPUESTA de A — la firma la da el founder) |
|---|---|---|
| `vida_nueva_empieza` | **«Una vida nueva empieza»** | «A new life begins» |
| `llego_a_la_familia` | **«{{nombre}} llegó a la familia»** | «{{nombre}} joined the family» |
| `mundo_nuevo_empieza` | **«Un mundo nuevo empieza»** | «A new world begins» |

⚠️ **`llego_a_la_familia` lleva `{{nombre}}` y las otras dos NO** — la firma
está escrita así, y tiene sentido: «Una vida nueva empieza» sobre la ficha de
Thor no necesita decir Thor. **Ojo con el precedente de S52:** las voces se
versionan EN PARES cuando hay contextos sin sujeto visible (notificaciones,
Coach). Acá el timeline SIEMPRE tiene la mascota a la vista, así que **una
sola forma alcanza** — pero si algún día este hito viaja a una notificación,
`vida_nueva_empieza` va a necesitar su par con nombre. *Dicho ahora para que
no se descubra en la notificación.*

## ③ DÓNDE VA — el diccionario de `LineaDeVida`, y su regla

`packages/ui/src/components/LineaDeVida.tsx` resuelve
`DICCIONARIO[item.tipo] ?? POR_EJE[eje] ?? GENERICO` (medido). El tipo es
`hito_narrativo` para los tres, así que **la resolución tiene que mirar
`hito_clave` ANTES del diccionario por tipo** — es la misma excepción que ya
existe para `vacuna_aplicada` (que usa `vacuna_nombre`), y por eso no
introduce un patrón nuevo.

**Y la degradación honesta, que no se toca:** una clave que el bundle no
conozca **cae al genérico por eje**. Es correcto — un bundle viejo no puede
inventar voz. No agregues un fallback que adivine.

## ④ LO QUE EL MOTOR NO HACE, y es a propósito

- **Las mascotas ya existentes NO tienen hito** — cero backfill. Inventarles
  un hecho pasado sería fabricar historia. Thor y Zeus no van a mostrar nada:
  **eso no es un bug**.
- El hito **no dispara notificación** (no está en el motor de intenciones).
- La `fecha_evento` es la del alta, no la de nacimiento.

## ⑤ PARA EL GATE DEL ALTA

El hito entra al re-gate junto con las siete curas. **Qué mirar en pantalla:**

1. Alta de un cachorro con fecha exacta reciente → **«Una vida nueva empieza»**.
2. Alta sin fecha → **«{nombre} llegó a la familia»**.
3. Alta de acuario → **«Un mundo nuevo empieza»**.
4. En inglés, las tres (si la propuesta de ② se firma).

**El discriminador que hace honesto el gate:** los casos 1 y 2 se dan de alta
con la MISMA pantalla y a segundos de distancia; si las dos dijeran lo mismo,
la regla del servidor no estaría rigiendo. *Verificado ya en el motor —
fixture 6/6 por camino real, con el par de precisión: misma fecha reciente,
`exacta` vs `estimada`, claves distintas.*
