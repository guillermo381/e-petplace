# El terreno del rediseño · qué se puede medir y qué no

> **Medido el 7-sep-2026 contra la base viva** (`zyltipqscdsdsxnjclhp`), `main @ 9ac55848`.
> Cada número trae su comando; los que no se pueden medir se dicen como lo que son.

## 🔴 LO PRIMERO, PORQUE CAMBIA EL MÉTODO: NO HAY TELEMETRÍA DE NAVEGACIÓN

**No se puede saber qué pantallas se abren más. No existe el dato.**

Las tablas **existen y están vacías**, que es el peor de los estados —parecen
una fuente:

| tabla | filas | rango |
|---|---:|---|
| `analytics_events` | **0** | — |
| `analytics_aggregated` | **0** | — |
| eventos distintos registrados | **0** | — |

Y **no hay emisor**: en el monorepo, cero llamadas a `logEvent`, `trackScreen`,
`analytics`, `posthog`, `amplitude` o `mixpanel`. La única aparición está en
`database.types.ts`, que es **generado** — o sea que la tabla existe en el
esquema y nadie la escribe nunca.

*Es **L-402** en su forma exacta: no basta «¿está alcanzable?», hace falta
«¿CORRIÓ ALGUNA VEZ?».* Un esquema con tablas de analytics se lee como «tenemos
telemetría» hasta que alguien pide un número.

**Consecuencia para el rediseño, dicha antes de que alguien la asuma:** el orden
por impacto **no se puede derivar del uso**. Se puede derivar de **dónde hay
datos reales**, que es un proxy distinto y hay que tratarlo como proxy.

⚠️ **Y si se decide instrumentar: es NATIVO** (SDK de analytics) ⇒ va a la lista
viva de `S113-NFC-BUILD.md`, no se instala suelto. Sin eso, el rediseño de
S116/117 se ordena igual a ciegas — *y el siguiente también.*

---

## EL TERRENO REAL — lo que hay hoy, sin fixtures

### La trampa de contar por la marca

`mascotas.creado_por_sistema` **nació en S113 y sólo marcó las 14 de la familia
del founder**. Contar por esa columna da **86 «reales»**, y ese número **no es
de fiar**: las sondas anteriores a S113 no están marcadas. *Es el mismo agujero
que S92 midió cuando descubrió que el 80 % de las familias eran sonda y toda
métrica anterior estaba inflada tres veces.*

**Por eso abajo se mide por ACTIVIDAD, que no se puede fingir.**

### Familias

| medida | número | qué significa |
|---|---:|---|
| filas en `familia` | **87** | registradas — el número que infla |
| con ≥1 mascota | **67** | |
| **con un miembro que entró en 90 días** | **20** | ← gente que vuelve |
| **con una mascota CON FOTO** | **7** | ← el núcleo duro |

🔴 **El rango honesto de familias reales está entre 7 y 20, no en 87.**
La foto es el mejor discriminador que hay: *nadie le sube una foto a una mascota
de prueba.*

### Mascotas

| medida | número |
|---|---:|
| total | **100** (86 sin marca + 14 fixture del founder) |
| con ≥1 evento | **91** |
| con evento en 90 días | **89** |
| **con foto** | **16** |
| **en familias con login reciente** | **49** |

⚠️ **89 con evento reciente contra 16 con foto**: los eventos los siembran las
pistas, la foto la sube una persona. *Cuando dos medidas del mismo sujeto dan
órdenes distintos, la que se puede fabricar en una migración no es la que hay
que creer.*

### Prestadores

| medida | número |
|---|---:|
| total · activos | **12 · 11** |
| **con ≥1 cita** | **6** |
| **con cita en 90 días** | **4** |
| con nombre demo/prueba/test | **2** |

**No existe `es_seed_preliminar`** (medido: la columna no está) — la marca que
el canon menciona desde S59 **no vive en esta tabla**. Se cuenta por citas.

### Actividad del expediente

| medida | número |
|---|---:|
| eventos vivos | **633** |
| citas | **374** |
| declarados por la familia | **161** |
| declarados por un prestador | **20** |
| **sin procedencia declarada** | **452** |

🔴 **452 de 633 eventos no dicen de dónde vienen** (71 %). *No es un dato
faltante cualquiera: la procedencia es lo que distingue lo que dijo la familia
de lo que verificó un profesional*, y toda pantalla que quiera mostrar esa
diferencia hoy la muestra sobre un tercio del expediente.

---

## LO QUE ESTO ORDENA, y su límite

**El proxy de impacto que sí existe:** las **7 familias con foto** y los **4
prestadores con cita reciente** son el terreno donde un rediseño se nota. Todo
lo demás es esquema con datos sembrados.

**Su límite, dicho:** *dónde hay datos ≠ dónde se mira.* Una pantalla puede
tener cero datos y abrirse todos los días (una vacía que la gente visita porque
espera algo), y ninguna consulta a la base va a decirlo. **Eso sólo lo dice la
telemetría, y no existe.**

### Los comandos, para que los números se puedan rehacer

```sql
-- familias reales, por actividad
select count(distinct m.familia_id) from mascotas m where m.foto_url is not null;
select count(distinct fm.familia_id) from familia_miembro fm
  join auth.users u on u.id = fm.user_id
 where u.last_sign_in_at > now() - interval '90 days';

-- prestadores con actividad
select count(distinct ecs.prestador_id) from evento_cita_servicio ecs
  join eventos_mascota e on e.id = ecs.evento_id
 where e.fecha_evento > now() - interval '90 days';

-- telemetría (hoy: 0 y 0)
select count(*) from analytics_events;
select count(*) from analytics_aggregated;
```
