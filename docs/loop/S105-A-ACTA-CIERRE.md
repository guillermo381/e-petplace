# ACTA DE CIERRE · S105-A (25-ago-2026)

**`main` al cerrar: `bbc2710c`.** Historial: **442 migraciones, local = remoto,
cero desemparejadas.** Árboles de las pistas en 0 salvo el de D (trabajo vivo).

---

## ① LO QUE CORRIÓ — verificado contra el objeto, no contra el ledger

**24 migraciones de A, auditadas una por una contra la marca que debían dejar
en el objeto: `TODAS_OK | total=24 ok=24`.** Se hizo por el aviso de D —a quien
`db push` le registró una migración con la función sin cambiar y después dijo
*«up to date»*—. **A mí esa trampa no me tocó**, y ahora está medido en vez de
supuesto.

### El motor de pagos

| | |
|---|---|
| **El reverso, de punta a punta** | reconocido por `status_detail` (no por `status`: un reverso y un rechazo traen el mismo `2` — *no fallaba, los CONFUNDÍA*), registrado, y **el sujeto se mueve en LOS DOS RIELES** |
| **`D-923` cerrada** | por **trigger sobre la transición del intento**, no cableado por riel — *cablear dentro de cada registrador es cómo el segundo riel se olvida, y DeUna ya se había olvidado* |
| **Los cuatro sujetos** | cita (libera el horario + aviso al prestador) · compra y pedido (por la puerta, que **libera el inventario**) · suscripción · recurrencia |
| **Divergencia de plata** | 🟢 **CERO** compras diciendo `pagada` con la plata devuelta (eran dos) |
| **`D-913`** | la compuerta 0 dejó de contar los vencidos. **Medido: de 37 compras abandonadas, 36 cortaban por `reserva_vencida` y NINGUNA por el intento** |
| **La compuerta del token, por riel** | `p_exige_token`; DeUna deja de morir en una pregunta que en su riel no existe |
| **La conciliación aprende el riel** | `p_proveedor` + `referencia_corta` + `intento_id` en la salida |
| **El comprobante dice el impuesto** | medido antes: **0 de 27 lo llevaban** — *no faltaba el dato, faltaba el CAMPO* |
| **El fee de servicios** | 15 → 10 con base `subtotal`; Colombia cerrada |

### Identidad y tarjetas

- **`D-921` completa**: `usuario_proveedor_uid` + `crear_alta_tarjeta` lo devuelve
  + `crearAltaTarjeta` lo expone + **`resolver_alta_tarjeta` lo GUARDA** —
  🔴 *esta última era la mitad que faltaba y casi la dejo abierta.*
- `listarTarjetasVerificadas()` — la puerta de la edge de D.

### Compras, citas, invitaciones

- **`retomar_compra`** con su wrapper: retoma sin re-armar, **el menor de los dos
  precios**, y no se retoma a medias.
- **`obtener_cita_resuelta`** + `leerCitaResuelta` — el detalle puede distinguir
  «no existe» de «existe y está cancelada».
- **`ya_invitada`** con fecha, id y token: el guard que vivía en un índice
  aprendió a hablar.
- **El email se valida de verdad** + `estado_correo_invitacion`.

### Voz e higiene

- **160 voseos de `packages/api` curados** (167 cambios) + las 4 que el
  instrumento viejo no podía ver. **`R66` los vigila con baseline 0.**
- `verify:diseno` **VERDE con 57 reglas**.
- **OTA del cliente**: group `a12f6314`, ancla `bde35600`, **`dirty: None`**.
- **Deploy de `pagos-web`**: uno hecho; el segundo **bloqueado por Vercel**.

---

## ② 🔴 CONSTRUIDO Y **NO EJERCIDO** — la lista honesta

*Hoy costó dos veces dar por bueno un camino que nunca corrió. Va con número.*

| pieza | qué falta para ejercerla |
|---|---|
| **El brazo `pago_reversado`** del lector de cita | **cero citas canceladas por reverso** — el cinturón midió contra `cierre_periodo_plan` |
| **`retomar_compra`** | **ninguna de las 37 se retomó de verdad** · y **falta la puerta**: el checkout no acepta una compra por parámetro |
| **El aplicador del barrido de DeUna** | su camino feliz **no se ejerce en una migración a propósito**: mueve una compra real y manda un comprobante a una familia |
| **El cron del barrido** | encendido a las **03:00**, primer tick mañana |
| **El aviso `pago_reversado`** | encendido, **cero enviados** |
| **El uid estable** | `usuario_proveedor_uid` tiene **1 fila**; el parque viejo son **9 uid** — la señal de extinción es `uidConsultados` llegando a 1 |
| **El brazo de las 17:00** de la ventana del reverso | la sonda corrió 15:59 local; **no se forzó moviendo el reloj de la base** |

---

## ③ 🔴 VERDADES VENCIDAS — el barrido que pidió el founder

**Censadas 9 clases de afirmación en el motor.** Resultado:

- ✅ **`resolver_alta_tarjeta`** ya no dice *«el handle del alta ES el uid»* — curado hoy.
- ✅ `aplicar_consulta_activa_deuna` dice `sujeto_movido: false` **y sigue siendo cierto**: ese camino confirma un pago, no lo reversa.
- 🔴 **`registrar_reverso_nuvei` y `registrar_reverso_deuna` (pista D) devuelven `sujeto_movido: false` CABLEADO, con la nota `'el sujeto no se mueve: D-923'`.**

**Hoy eso es FALSO.** El trigger mueve el sujeto exactamente cuando esas
funciones ponen el estado en `reversado`. ⇒ **le dicen a soporte que mueva a
mano algo que ya se movió.** D curó **sus edges**; **las funciones SQL siguen
cableadas** — es su territorio y queda reportado.

> *Una constante que afirma sobre el mundo se vuelve falsa el día que el mundo
> cambia, y no lo avisa: no hay typecheck para una verdad vencida.*

---

## ④ LO QUE ESPERA A TERCEROS

| quién | qué |
|---|---|
| **Erick (jueves)** | qué espera Nuvei en `vat`, `tax_percentage`, `taxable_amount`. **Sin eso, ⑤ no puede salir a producción** |
| **El contador** | el IVA de servicios · **redondeo por línea vs sobre el total** (afecta la factura, no el guard) · `D-924` |
| **Vercel** | 🔴 el segundo deploy de `pagos-web`. **Rebotado a las 21:30:43 -05** con `more than 100 per day`. **Es ventana móvil de 24 h, no reset a medianoche**: el primer rechazo fue ~20:10 y a las 21:30 seguía — o sea que **no se libera por cambiar de día**, sino cuando caduquen los deployments viejos. La cura de familia ① **sigue sin llegar a producción** |
| **El founder** | firma del reproceso de los 4 de `D-912` (emite comprobante) · la prueba de tarjeta para que Erick vea dos bajo un uid |
| **C** | la pantalla de retomar · la voz de tarjetas · el baseline de sus 2 voseos nuevos |
| **D** | ⑤ el guard del IVA · el cable de `p_exige_token` · **las dos funciones que quedaron mintiendo** |

---

## ⑤ LO QUE ME COBRÉ HOY, sin maquillar

1. **Motor sin puerta, DOS veces** (el uid y el lector de cita) — *el contrato de una pieza de motor incluye su wrapper.*
2. **`L-402` en carne propia**: cerré `D-887` declarando que su camino feliz no se había probado… y se cayó en la sesión con Carlos. **Declarar que algo no se probó no es probarlo.**
3. **Medí en `pg_constraint` y concluí «no hay UNIQUE»** — un índice único parcial no es un constraint. **Descarté la hipótesis correcta del founder con un dato incompleto.**
4. **Mi barrido de voseo rompió un mapeo** — `REBOTES_ACEPTAR` compara contra la frase del motor, y **ningún typecheck lo ve porque un string que deja de coincidir compila perfecto.**
5. **Mi cinturón dejó un intento fantasma** de $75,86 en `aprobado`: `confirmar_pago_compra` crea un intento propio y mi limpieza no lo previó. *Un cinturón que limpia lo que él escribió puede dejar lo que escribió la función que llamó.*
6. **`retomar_compra` apartaba stock duplicando al checkout** — y era alcanzable.
7. **Mi propio cinturón me frenó con `L-170`**: buscaba una palabra y **la encontraba en el comentario que explica por qué ya no se llama.**
8. **Colisión de número con D**: las dos corrieron, **pero el ledger sólo pudo nombrar una.** Verificar contra `schema_migrations` **no alcanza**: hay que mirar el directorio después de traer las ramas.
