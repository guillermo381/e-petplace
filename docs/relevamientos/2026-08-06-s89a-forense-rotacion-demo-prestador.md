# S89-A · ORDEN 2 — FORENSE: la rotación "sin rastro" de `demo-prestador`

**Fecha:** 2026-08-06 · **Pista:** A · **Fuente:** `auth.users`,
`auth.audit_log_entries`, `auth.sessions`, `auth.refresh_tokens`, `pg_proc`,
`pg_trigger`, `cron.job` — todo del objeto vivo. **Horas en UTC** (local =
UTC-5). Lo MEDIDO va separado de la LECTURA.

---

## 0. Lo que cambia respecto del acta S88, en una línea

> **El audit log NUNCA estuvo vacío.** La ventana de 3 h del acta no alcanzaba
> hacia atrás: los cambios de clave existen, están fechados, y el último lo
> hizo **una sesión Android viva en la red de la casa**.

---

## 1. MEDIDO — las certezas

### 1.1 Todos los cambios de clave de la historia de la cuenta son por FLUJO

`user_updated_password` para `c5d54e3a` (todas, actor = la propia cuenta,
patrón `login → update` con su par `user_modified` 1 ms después):

```
2026-08-03  01:20:50  y  01:21:24     (par S84 — gate de Seguridad)
2026-08-05  19:43:02                  user_recovery_requested (recuperar por código)
2026-08-06  02:03:15                  login 02:03:14 → cambio → logout 02:03:21   (7 s: script)
2026-08-06  04:37:55                  login 04:37:54 → cambio → logout 04:38:10   (script)
2026-08-06  06:19:57  ← LA ÚLTIMA    login 06:19:57.17 → cambio 06:19:57.84 (0.67 s)
```

**Después de las 06:19:57 nadie volvió a escribir la clave** (medido hasta las
14:30 UTC de hoy).

### 1.2 El actor de la última escritura es un runtime ANDROID, y su sesión sigue viva

| dato | valor |
|---|---|
| sesión | `9d39f9a4-d1d8-4ce3-9c4e-061bbd2e41aa` |
| user_agent | **`okhttp/4.12.0`** (runtime Android: app en emulador o teléfono — los scripts de la mesa salen como `node`) |
| IP | `157.100.134.157` — **la red de la casa**: la misma IP corrió scripts `node` a las 06:17:45 (sesión de `s88rolpuro`) |
| nacimiento | 06:19:57.177 — el MISMO segundo del login que cambió la clave |
| vida posterior | `token_refreshed` cada hora: 07:19 · 08:18 · 09:17 · 10:15 · 11:15 · 12:14 · **13:13:21** — y ahí se apagó |
| hoy | **jamás hizo logout; su refresh token NO está revocado** — si el aparato despierta, vuelve a operar como `demo-prestador` |

Login→cambio en **0.67 s** es velocidad de máquina, no de dedo humano: el
flujo estuvo **automatizado o pre-cargado** en ese aparato.

### 1.3 Lo que queda DESCARTADO por medición

- **Nadie escribe directo en `auth.users`:** cero funciones en schemas propios
  con `UPDATE/INSERT/DELETE auth.users`; el único trigger es
  `on_auth_user_created` (INSERT). Ningún job de `cron.job` toca auth.
- **Cero actores admin en TODO el historial** de la cuenta: no hay ni una
  entrada `user_modified` suelta (solo los pares del flujo). La service key no
  rotó esta clave.
- **`updated_at` NO es marcador de rotación:** lo toca el login (el valor
  actual, 14:26:35, es un login) y la actividad de sesión. **El `13:13` que el
  acta leyó como "MI rotación" coincide al segundo con el token_refresh de la
  sesión okhttp (13:13:21).**

### 1.4 El método de rotación de la mesa SÍ deja rastro

Censo de 4 días, todas las cuentas: cada `user_updated_password` del proyecto
es actor=la-propia-cuenta por flujo — incluidas las rotaciones de la mesa S88
sobre `s87prof` (racha de 4 en 2 segundos = reintentos de script) y `s87recep`
(02:04:28). **⇒ Si la rotación de "las 13:13" del acta hubiera corrido, habría
dejado login + `user_updated_password`. No hay NI UNO de los dos: esa rotación
no ocurrió en esta DB.** (Clase L-192: falla silenciosa del script, no actor
fantasma.)

### 1.5 El estado de ahora

A las 14:24–14:26 corrieron tres rondas de sonda (`node`, `200.115.43.7`) y
`demo-prestador` logueó OK dos veces. **La clave vigente hoy es la que escribió
el aparato okhttp a las 06:19:57** (nadie escribió después). Huella del hash
vigente para la próxima caída: `md5(encrypted_password) = e2495b49d996039a731dc5dbe84fdd3a`
— si la sonda vuelve a fallar y esta huella NO cambió, el problema es de la
sonda, no de la clave.

---

## 2. LECTURA — declarada como lectura, no como hecho

La secuencia que mejor ajusta TODAS las mediciones: un **aparato de la casa con
el bundle del prestador** (emulador de pista, o un teléfono en la wifi) ejecutó
el flujo de **Seguridad → cambiar contraseña** (S84, `seguridad.ts`) como
`demo-prestador` a las 06:19:57 — automatizado o con la clave pre-cargada —
**escribiendo un valor viejo conocido** (*"un aparato repite una escritura
vieja"*, la hipótesis del acta, con rastro encontrado). El barrido de cierre
probó otro valor → `invalid_credentials`; la "tercera rotación" del acta
verificó contra el valor que el aparato ya había dejado. Encaja con que la
sesión se apagó ~13:13 (cierre de S88: regla 87, emuladores abajo) y con que
nadie escribió la clave entre 06:19:57 y la verificación 8/8.

**Lo que esta lectura NO puede decir desde la DB:** qué máquina es
`157.100.134.157` a la 01:19 local, y si el okhttp era emulador de pista o un
teléfono en la wifi. Eso se cierra con la palabra de las pistas B/C/D (¿quién
tenía emulador vivo con la app del prestador entre 06:19 y 13:13 UTC?).

---

## 3. LO OPERATIVO QUE QUEDA EN PIE

1. **La sonda antes de cada dedo SIGUE** (orden de la mesa) — y conviene
   depositarla como script canónico: hoy la práctica existe pero no hay
   `scripts/sonda-credenciales.mjs` con nombre; cada quien la improvisa.
2. **Rotar la clave NO mata sesiones**: la sesión okhttp `9d39f9a4` sigue
   revocable-y-no-revocada. **Recomendación a la mesa (no ejecutado — es
   mutación):** revocarla (`admin signOut` / delete de la sesión) y, si vuelve
   a nacer una sesión okhttp sobre una cuenta demo fuera de un dedo declarado,
   ahí sí hay actor sin dueño.
3. **`updated_at` no se usa más como evidencia de rotación** — la evidencia es
   el par `login + user_updated_password` en el audit, o la huella del hash
   (§1.5).
4. La ventana de búsqueda en el audit se abre **al menos hasta el último
   `user_updated_password` real**, no un ancho fijo de horas — el "audit
   vacío" de S88 fue una ventana corta sobre un audit lleno.

---

*Depositado por la pista A, S89 · ORDEN 2. Cero mutaciones en esa pasada: no
se revocó la sesión, no se rotó nada, no se tocó el teléfono del founder
(regla 87; no se levantó emulador — `ANDROID_SERIAL` sin fijar).*

---

## 4. CIERRE DEL CASO (adenda de mesa, 6-ago-2026) — CASO MUERTO

**Causa NOMBRADA — palabra del founder:** entre la 01:19 y las 08:13 local
estaban vivos **su celular y los emuladores de su computadora**. El actor
`okhttp` de las 06:19:57 (`9d39f9a4`, IP `157.100.134.157`) es **entorno
propio del founder, no intruso**. Encaja con todo lo medido: la clave vigente
al login, el flujo de Seguridad (S84) como camino, y el apagado del refresh a
las ~13:13.

**Ejecutado por orden de mesa:**

1. **Sesión `9d39f9a4` REVOCADA** — `DELETE auth.sessions` con verificación:
   0 sesiones, 0 refresh tokens (FK `ON DELETE CASCADE` medida antes de
   borrar). *La higiene que motivó la orden: una sesión sin logout con refresh
   vivo es un actor sin dueño en potencia, aunque el dueño real haya sido la
   casa.* Nota operativa que queda del caso: **rotar la clave NO mata
   sesiones** — la revocación es un acto aparte, y ahora está hecho.
2. **La sonda es script canónico:** `scripts/sonda-credenciales.mjs` — camino
   real, `error_code` LEÍDO, lista = copia del registro del brief (los dos se
   actualizan en el mismo commit). Corrida post-revocación: **8/8, exit 0** —
   la revocación no tocó la clave (huella md5 intacta).
3. Las lecciones operativas de §3 quedan vigentes (la sonda antes de cada
   dedo · `updated_at` no es marcador de rotación · la ventana del audit se
   abre hasta el último `user_updated_password` real).

**El caso queda MUERTO: causa nombrada, sesión revocada, sonda depositada.**
