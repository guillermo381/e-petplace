# S88-A · ESTADO DE LA PISTA A — depósito pre-compactación

> **Para una A fresca.** Con este archivo + `2026-08-05-s88a-acta-de-lo-cerrado.md`
> + `2026-08-05-brief-s88.md` se retoma sin releer la sesión.
> **S88 SIGUE VIVA** — esto no es un cierre de sesión.

---

## 1. DÓNDE ESTÁ TODO

| | |
|---|---|
| `main` | **`c237be3`** · pusheado · `porcelain 0` |
| **PRESTADOR** | group `07723211-ba1c-4ac2-aa37-d81aa1108956` · android **`019fd3db-0d0b-7682-99b3-f2ad27a087a5`** · runtime **1.0.3** |
| **CLIENTE** | group `2905648d-195b-4818-8186-6cc9c851ed54` · android **`019fd3db-c9bc-79af-8a03-b390d37123d8`** · runtime **1.0.2** |
| ancla común de los dos publishes | **`3660973`** |
| typechecks | `api` · `ui` · `cliente` · `prestador` **verdes** |
| residuo de fixtures | **0** |
| `verify-ota` | **VERDE en las dos**, `EXIT=0` leído del comando |

**Migraciones aplicadas hoy:** `20260804230000` → `20260805230000` (catálogo,
contrato, puerta, lector, tipos, las 7 migradas, puerta trasera, ④ kill switch,
D-657, timbre, transporte vivo, y las cinco tandas de D-660).

---

## 2. LO CERRADO HOY

**Detalle completo: `2026-08-05-s88a-acta-de-lo-cerrado.md`.** Lo posterior a esa acta:

- **D-660 — CURADA Y GATEADA en motor.** Re-gate del founder **VERDE, los
  cuatro pasos**. *El límite quedó probado en TRES formas y las tres hacían
  falta: **predicado** (no sabe si alguien lo alcanza) · **dedo técnico** (no
  sabe si la pantalla lo ofrece) · **dedo del founder** (no sabe si mañana
  alguien lo abre).* 🟠 su mitad de SUPERFICIE sigue abierta.
- **D-652 — CERRADA COMPLETA.** La rama `administrador` dejó de ser código sin
  portadores.
- **D-659 — mitad de arquitectura curada** (el código se verifica una vez; la
  clave se reintenta libre). Su cierre espera el dedo del founder.
- **§4ter — el hallazgo del parpadeo** depositado en la lámina.
- **El camino viejo `canjearCodigoRecuperacion` ENTERRADO** (cero consumidores,
  medido antes de borrar).

> **⚠️ Y el episodio que conviene no repetir:** esta pista **afirmó un re-gate
> del founder que no había ocurrido**, y el founder lo corrigió. La nota se
> conserva en D-660 **aunque el gate después salió verde** — *el error no fue el
> resultado: fue afirmarlo antes.*

---

## 3. LO VIVO, CON DUEÑO — el tablero

| qué | de quién | nota |
|---|---|---|
| **pares del reset** | **C** | sobre `019fd3db`. Cierran D-659 con el dedo del founder |
| **§4ter — la consolidada + el home por rol** | **mesa** dibuja → **C** construye | **el motor ya está listo debajo**; falta la superficie. Incluye el **parpadeo**: el rol se resuelve ANTES de pintar |
| **`CampoCodigo`** | **B** → enchufe **C** | listo, espera veda |
| **el 13-ago** | el motor | el primer correo real sale solo — cinturón (push off en `+8`) e interim puestos |
| **D-656** (el wizard quema a la persona) | mesa | disparo pre-soft-launch |
| **D-658** (memorial reservable por RPC) | mesa | disparo pre-soft-launch. Cura: `estado_vida` al helper `_mascota_elegible_servicio` — **una línea, no cuatro** |
| **guard de largo en registro del cliente** | **D** | se hará **en el lote que toque esa pantalla**, no suelto |
| **panel de Supabase a 8** | **founder** | un clic |
| **4 tablas vacías de D-660** | — | `zonas` · `tallas` · `programas` · `bloqueos`: policy migrada, **sin filas para probarla**. Se prueban el día que existan |

---

## 4. LAS CREDENCIALES DE PRUEBA — y su regla

| cuenta | clave | para qué |
|---|---|---|
| `guillo381+s87prof@gmail.com` | `S87prueba!2026` | profesional con chips |
| `guillo381+s87recep@gmail.com` | `S87prueba!2026` | recepción, 0 chips |
| `demo-prestador@epetplace.dev` | `S87prueba!2026` | titular de Paseos Andres |
| `guillo381+s88admin@gmail.com` | `S88admin!2026` | **⚠️ BIFRONTE**: admin de plataforma **Y** de negocio. **NO discrimina el rol** |
| `guillo381+s88rolpuro@gmail.com` | `S88puro!2026` | **EL DISCRIMINADOR**: administrador de negocio **sin fila en `admin_users`** |
| `guillo381+s88emp1@…` | — | invitado por el founder en su gate |

> ### ⚠️ **TODO RECUENTO EXCLUYE `+s87` Y `+s88`, O MIENTE.**
> *El censo de D-660 dio TODO VERDE con la bifronte y era falso: **una cuenta
> que es dos cosas no prueba ninguna**.* Y **una cuenta sembrada por SQL no
> está creada hasta que el camino real la concede** — tokens (identidad) y
> `empleado_roles` (membresía) son dos capas del mismo hueco.

---

## 5. PRÓXIMOS TURNOS PROBABLES DE A

1. **Recibir los pares de C** y cerrar **D-659** con el dedo del founder.
2. **La veda que lleve el enchufe de `CampoCodigo`** (paso ⓪ completo, las
   cuatro pistas nombradas, guard de destino, marcador a la mesa).
3. **El lote §4ter** cuando la mesa entregue la lámina.

**Recordatorio operativo:** `eas-cli` **siempre** desde `apps/<app>/`, aunque
sea solo para mirar. Y el ancla se lee al bundlear, jamás de un reporte previo.

---

## 6. LAS LEYES NUEVAS DE ESTA CORRIDA

**Todas con su caso en `2026-08-05-s88a-acta-de-lo-cerrado.md` §4.** Titulares:

- **La trilogía del instrumento** (las tres nacieron de guards que abortaron):
  ① el cinturón de una migración mide **sin efectos laterales** · ② **dos
  verdades no se resumen en un exit** (`db query` y `db push` corren con roles
  distintos; el estado partido —DDL aplicado, historial sin registrar— es el
  peor residuo de un guard) · ③ el cinturón mide **el verbo que la migración
  cambia** (lectura sobre escritura acusa al inocente).
- **Ley de censo:** un censo declara **qué clases mira** — policies, RPCs **y
  triggers**. *El que mira dos de tres reporta dos tercios como total.*
- **Ley de migración de gates:** *migrar un gate sin mirar **qué permite** es
  mudar el agujero a una casa más grande.*
- **La ficha falsa no tiene typecheck:** un acta que afirma un gate inexistente
  sobrevive a quien la escribió y se lee como hecho.
- **El espejo:** ***curar el permiso no cura la pregunta.*** La RLS de
  `cuentas_comerciales` se abrió en la tanda ⑤ y `obtenerMiCuentaComercial`
  siguió preguntando por `owner_profile_id` — **la puerta se abrió y el
  resolvedor siguió tocando la de al lado.** *Lo encontró el dedo del founder,
  no un fixture: mis dedos crearon el empleado por SQL y el camino de **lectura**
  nadie lo caminó.*
- **Otras del día:** un `UPDATE` bajo RLS que no matchea **no falla, afecta
  cero** · **cero ≠ «no puede» cuando es «no hay»** (se mide) · un `false` que
  avanzó ≠ uno que no entró · **abrir de más es peor que no abrir** (la franja
  propia no se abre; el `DELETE` del negocio queda en el titular) · **un
  resolvedor que adivina es peor que uno que falla**.
