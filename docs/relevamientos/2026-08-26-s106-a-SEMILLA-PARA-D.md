# LA SEMILLA DE TELECONSULTA — para que D ejerza `video-token` de verdad

> **A → D · 26-ago-2026 · S106 tanda 2.** Texto autocontenido (76b): todo lo
> que hace falta está acá, no hay que ir a buscar nada a otro reporte.
>
> **Qué destraba:** `video-token` está desplegada y **jamás emitió un token
> para una cita real** — era la única pieza del circuito nunca ejercida.
> Ahora hay seis citas de telemedicina **pagadas, creadas por las puertas
> reales**.

---

## §1 · POR QUÉ NO EXISTÍAN ANTES (no fue olvido, y la mesa ya lo corrigió)

La puerta real estaba **cerrada por el switch de plataforma**
`tipos_servicio.telemedicina.reservable = false`, que es la llave del founder.
`crear_bloqueo_agenda` lo lee — verificado contra el cuerpo vivo de la función,
no contra el recuerdo — así que sin abrirlo **no había forma de crear una cita
de telemedicina por ningún camino legítimo**.

**Firma del founder del 26-ago:** el switch se abre y se cierra **dentro de una
sola transacción**. Por MVCC ninguna otra sesión ve jamás `true`; el único
estado que se compromete es `false`. *El invariante «nadie puede reservar
telemedicina» queda demostrable por el motor, en vez de depender de que nadie
entre en una ventana de minutos.*

**Verificado DESPUÉS del commit, contra el objeto:**
`tipos_servicio.telemedicina.reservable = false`. ✅

---

## §2 · LAS SEIS CITAS — todas `pagada`, todas de hoy 26-ago-2026

Prestador: **Clínica Aurora** `de680000-0000-4000-8000-0000000000e5` ·
oferta telemedicina 20 min $30 · empleado resuelto por el motor:
`de680000-0000-4000-8000-0000000000ee`.

**La ventana de entrada es ±15 min alrededor de la hora**, en `America/Guayaquil`.

| hora | ventana | `cita_id` | mascota | dueño |
|---|---|---|---|---|
| 12:00 | 11:45–12:15 | `6968c6c3-c473-4693-834f-a8debe78a4a2` | Thor | `guillo381+8@gmail.com` |
| 12:30 | 12:15–12:45 | `c7a10459-3379-4165-8aaf-8de8c7dbaed3` | Thor | `guillo381+8@gmail.com` |
| **13:00** | **12:45–13:15** | `68cb15a2-a3c3-4a16-a58b-2bae096b7d02` | Zeus | **`demo-prestador@epetplace.dev`** |
| **13:30** | **13:15–13:45** | `33800148-5049-450e-bafd-61ebaec9535d` | Zeus | **`demo-prestador@epetplace.dev`** |
| 20:00 | 19:45–20:15 | `911c80c3-9c31-468b-8ace-0d58d01a1143` | Thor | `guillo381+8@gmail.com` |
| **20:30** | **20:15–20:45** | `55e035d8-8d0f-4ec0-bd26-95cd4c2e4180` | Zeus | **`demo-prestador@epetplace.dev`** |

**Las de `demo-prestador@epetplace.dev` están en negrita a propósito: son las
únicas cuya sesión podés acuñar vos solo**, porque su clave vive en
`apps/<app>/.env.local` como `EXPO_PUBLIC_DEMO_PASSWORD`. Ver §4.

---

## §3 · CÓMO SE HICIERON — cero INSERT directo

Las tres puertas, en orden, dentro de la transacción:

1. `aceptar_minimos_servicio(prestador, 'telemedicina')` — **con la sesión de
   Aurora**. Sin esto la oferta no es cobrable: el gate vive en la LECTURA
   (`_vet_ofertas_cobrables`), no en un trigger.
2. `crear_bloqueo_agenda(..., p_acepta_teleconsulta => true)` — **con la sesión
   del dueño**. La `modalidad` **NO se dicta: se deriva server-side** de la
   categoría del servicio (se pasó `NULL` y volvió `"telemedicina"`). El
   consentimiento se registra en la misma transacción ⇒ *una teleconsulta con
   hold y sin consentimiento es inexpresable.*
3. `confirmar_cita_pagada(cita_id)` — **con el rol del servidor**.

### 🔴 Un hallazgo del ensayo que te sirve para tus casos

El paso 3 **rebotó `42501` cuando se intentó como `authenticated`**. No es un
defecto: es la revocación de `D-855` (S101) — *un cliente no puede declarar
pagada su propia cita*. **La defensa se probó, no se leyó.** En producción la
llama el motor de pagos con `service_role` tras el webhook; acá la llamó el rol
de origen, que es el mismo lado del mostrador. **Lo que se saltea es el
proveedor, no el gate.**

**Y otro, del mismo ensayo:** una cita a las `11:40` fue rechazada con
`fuera_de_horario`. La grilla de Aurora es de **30 minutos**, así que los
inicios válidos son `:00` y `:30`. *La puerta hizo su trabajo.*

### El script queda en el repo y es repetible

`supabase/dev/semilla-telemedicina-s106.sql` — se editan `k_fecha`, `k_hora`,
`k_mascota` y `k_dueno` y se corre:

```
npx supabase --experimental db query --linked --file supabase/dev/semilla-telemedicina-s106.sql
```

⚠️ **Tal cual está en el repo NO commitea** — hay que agregarle `COMMIT;` al
final (o `ROLLBACK;` para ensayar). Está así a propósito: *un archivo que
escribe en producción con sólo abrirlo es un accidente esperando.*

**Si tu ventana se cerró mientras trabajabas, acuñá una cita nueva con esto en
vez de esperar a mañana.**

---

## §4 · LAS TRES SESIONES — dos las tenés, una necesita al founder

### ✅ ① El DUEÑO — la podés acuñar ahora

`demo-prestador@epetplace.dev` **tiene mascota propia (Zeus)** y es el dueño de
las cuatro citas en negrita. Patrón de la casa, ya usado en
`scripts/verify-r1-resolvedor-s75.mts`:

```ts
const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const c = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const { data } = await c.auth.signInWithPassword({
  email: env.EXPO_PUBLIC_DEMO_EMAIL,        // demo-prestador@epetplace.dev
  password: env.EXPO_PUBLIC_DEMO_PASSWORD,
});
// data.session.access_token  ← el Bearer para llamar a video-token
```

⚠️ **`apps/<app>/.env.local` NO está en el repo y está bien que no esté.** Si tu
worktree no lo tiene, copialo del worktree primario. **La anon key sale de ahí
—`EXPO_PUBLIC_SUPABASE_ANON_KEY`—: es pública (viaja en el bundle), pero se lee
del env, jamás se pega en un reporte.**

### ✅ ② El TERCERO AJENO — sale gratis, y es la misma sesión

Con esa **misma** sesión, pedí el token de **una cita de Thor** (las de
`guillo381+8`): esa persona no es parte de esa cita ⇒ tiene que salir
`ajeno_a_la_cita`. *No hace falta una tercera cuenta: «ajeno» es una relación,
no una identidad.*

### ✅ ③ El PROFESIONAL — ~~no la tengo~~ **RESUELTO, ver la ADENDA del final**

> ⚠️ **ESTA SECCIÓN QUEDÓ SUPERADA EL MISMO DÍA.** La credencial apareció: es
> la clave compartida del keychain (`-s epetplace-siembra-s97 -a siembra`), y
> **se verificó por login real**. El camino feliz del profesional **ya está
> ejercido**. *Se tacha en vez de borrarse para que se vea que el bloqueo
> existió y cómo se levantó — pero lo que rige es la adenda.*

~~Lo que decía antes:~~

El profesional de estas citas es un empleado de **Clínica Aurora**, cuyo titular
es `guillo381+demovet@gmail.com`. **Esa clave la tiene el founder y no está en
ningún `.env.local` ni en el keychain** (lo verifiqué: no hay `service_role`
guardada, así que tampoco puedo acuñarla por la vía admin).

> **Pedido al founder, concreto:** la clave de `guillo381+demovet@gmail.com`
> **o** de `guillo381+9@gmail.com` (empleado activo de Aurora), **entregada
> directamente a D por el canal que use para credenciales — no por acá y no al
> repo.**

**Mientras tanto, el camino feliz del PROFESIONAL queda NO CONCLUYENTE, y se
declara así.** *No se dibuja verde por analogía con el del dueño: son dos ramas
distintas de `puede_entrar_a_videollamada` y una probada no prueba la otra.*

---

## §5 · TUS OCHO CASOS, con qué dato los corrés

| # | caso | con qué |
|---|---|---|
| 1 | **feliz · dueño** | sesión ① + cita de Zeus **con ventana abierta** |
| 2 | **feliz · profesional** | ✅ **YA EJERCIDO** — cita `23d215bd…`, ver ADENDA |
| 3 | `ajeno_a_la_cita` | sesión ① + cita de **Thor** |
| 4 | `fuera_de_ventana` | sesión ① + cita de Zeus de las **20:30** ⇒ verificá que **traiga `abre_en`** |
| 5 | `cita_inexistente` | sesión ① + un uuid cualquiera |
| 6 | `no_es_teleconsulta` | sesión ① + una cita presencial de Zeus |
| 7 | `cita_cancelada` | cancelá una de las de Zeus con `cancelar_teleconsulta` y repetí |
| 8 | `cita_no_pagada` | corré la semilla **sin el paso 3** (borrá esa línea) y usá esa cita |

**Sobre el 4, y es lo que más le importa a C:** `abre_en` viaja
**incondicionalmente** en ese brazo de la RPC — lo medí en el cuerpo. El wrapper
`pedirTokenVideollamada` (ya en `main`) lo declara **obligatorio por tipo**, así
que *«fuera de ventana sin decir cuándo abre» es inexpresable desde la puerta*.
**Si tu corrida encuentra un `fuera_de_ventana` sin `abre_en`, eso es un
hallazgo y hay que avisarlo** — no es un caso normal.

---

## §6 · LO QUE ESTA SEMILLA **NO** PRUEBA

*Se escribe para que nadie la cite como si lo probara.*

- **No prueba que el video ande.** Eso lo probó el gate del cable del 26-ago,
  aparte. Esto prueba que hay **cita** contra la cual pedir un token.
- **No prueba el cobro real.** El pago es sandbox y está declarado: no pasó por
  Nuvei ni por DeUna, y no hay evento económico de proveedor.
- **No abre el servicio.** `reservable` sigue en `false`, medido después del
  commit. **La llave es del founder y va última.**

---

# ✅ ADENDA · EL CAMINO FELIZ YA NO ES FE — ejercido el 26-ago a las 14:45 GYE

**`video-token` dejó de ser NO CONCLUYENTE.** Se ejerció **por el camino real**
—sesión de verdad, edge de verdad, cita de verdad— y **los dos roles sobre la
misma sala**:

```
✅ ② PROFESIONAL asignado : TOKEN · rol=profesional · sala=23d215bd · 480 chars
✅ ① DUEÑO (+8)           : TOKEN · rol=dueño       · sala=23d215bd · 493 chars
```

### 🔴 EL BORDE DE §4, QUE ERA EL QUE MÁS IMPORTABA, QUEDÓ EJERCIDO

**El token del veterinario se emitió cuando el dueño todavía NO había entrado.**
El profesional pidió el suyo primero y lo recibió; la llamada del dueño vino
después, en otro proceso.

*Esto no es un detalle de orden: es la letra. Si algún día alguien «arregla» la
sala para exigir dos participantes, le saca al veterinario el derecho a cobrar
que la letra le dio — porque el vet cobra aunque el dueño no aparezca. **Ahora
hay una corrida que lo prueba, y romperlo va a tener que romper esta prueba.***

### Y los otros tres, ejercidos en la misma pasada

| caso | resultado |
|---|---|
| `ajeno_a_la_cita` | ⛔ correcto (sesión de +8 contra cita de otro) |
| `fuera_de_ventana` | ⛔ correcto, **y trajo `abre_en=2026-08-27T00:45:00+00:00`** |
| dueño camino feliz | ✅ `rol=dueño` |

**`abre_en` viajó de verdad**, que es lo que el wrapper exige **por tipo** y lo
que C necesita para decir *«abre a las HH:MM»* en vez de un «todavía no» mudo.

### ⚠️ UNA CORRECCIÓN MÍA, ANOTADA PORQUE ES LA LECCIÓN DE LA PASADA

**La primera corrida reportó al veterinario como `ajeno_a_la_cita`, y estuve a
un paso de escribirlo como defecto de la RPC.** No lo era: **el motor había
asignado esa cita a OTRO empleado** (`afdc7fb9` = `guillo381+7`), no al titular.
*La RPC contestó bien; mi prueba preguntaba por la persona equivocada.*

⇒ Las citas nuevas se sembraron **con el profesional fijado explícitamente**
(`crear_bloqueo_agenda` acepta `p_empleado_id`, así que sigue siendo la puerta
real y no un atajo).

**Las dos citas con profesional conocido:**

| hora | ventana | `cita_id` | profesional | dueño |
|---|---|---|---|---|
| 15:00 | 14:45–15:15 | `23d215bd-b688-484c-98c9-a527e12bbe88` | `guillo381+demovet` | `guillo381+8` |
| 15:30 | 15:15–15:45 | `21da5acf-b36d-4ded-bea4-4008a8968aef` | `guillo381+demovet` | `guillo381+8` |

### LA CREDENCIAL — dónde está, y cómo se lee sin que pase por ningún lado

`docs/relevamientos/2026-08-13-s97a-matriz-cuentas-prueba.md`. **La clave es una
sola para las cuentas `guillo381+…` y vive en el keychain**, jamás en el repo:

```bash
security find-generic-password -a siembra -s epetplace-siembra-s97 -w
```

**Se lee AL MOMENTO de usarla, dentro del script, y no se imprime nunca.**

⚠️ **`guillo381+7@gmail.com` NO entra con esa clave** — medido. La unificación
de S97 no cubrió todas las cuentas y el documento no lo dice. Ver `D-937`.
