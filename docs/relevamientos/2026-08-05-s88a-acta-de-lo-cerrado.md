# S88-A · ACTA DE LO CERRADO — hasta el 5 de agosto de 2026

> **⚠️ ESTO NO ES EL CIERRE DE S88. S88 SIGUE VIVA.** Es la foto de lo que
> quedó cerrado hasta hoy, para que la mesa tenga tablero mientras el arco del
> reset, la consolidada y las cajas por dígito siguen en construcción.
> *Un acta de cierre de sesión afirma que no queda nada; ésta afirma lo
> contrario y por eso se llama distinto.*

---

## 1. EL ARCO DEL CORREO — de cero productores a la primera voz, en un día

**El motor existía, sabía callarse, y nunca había hablado.** Hoy habló una vez,
con permiso, y con el freno probado antes.

| pieza | estado |
|---|---|
| **④ kill switch + techo duro** | ✅ el kill switch vive en el **despacho**, no en la puerta — *el rastro tiene que poder contestar «¿por qué NO me llegó?» el día del apagón* |
| **D-657** | ✅ el plan deja de cobrarse después del memorial |
| **proveedor** | ✅ **Resend** firmado, Postmark como plan B nombrado |
| **timbre** | ✅ `pg_cron` → `pg_net` → Edge Function, corriendo cada minuto |
| **`despachar-correo`** | ✅ desplegada, con modo sombra de transporte declarado |
| **el primer envío** | ✅ **GATEADO POR EL FOUNDER** — llegó a su inbox, 2:18 PM |
| **enmienda §7** | ✅ el canal elegido tiene **transporte vivo** |

### El gate del primer envío — un envío con las dos caras

```
freno BAJADO  →  retenidas=1 · CERO en Resend
                 «RETENIDA — el despacho está frenado.
                  La intención espera: no se perdió.»
freno ALZADO  →  para_transporte=1 · entregada=1
                 proveedor_id 08421bd7 · CONFIRMADO por el founder
```

*No fueron dos pruebas: fue una, con sus dos caras.* Y el mensaje estaba escrito
para que un verde falso se delatara solo.

### D-657 — el «antes» que justifica el arco

Con la oferta renovable fabricada, el motor daba **`renovados=1` y agendaba 29
citas firmes nuevas para una mascota fallecida**. *No solo cobraba: llenaba la
agenda del paseador con paseos que no iban a ocurrir.*

---

## 2. EL LOTE D-660 — la letra de S74, por fin con motor

**El rol `administrador` tenía lectura perfecta y escritura CERO.** Cinco tandas
lo curaron, cada una con su par.

**Los dos ejemplos canónicos:**

- **La partición por verbo.** `prestador_own_profile` era `FOR ALL`;
  `SELECT`/`UPDATE` al helper y **`DELETE` se queda en el titular**. *Migrarlo
  entero le daba a un administrador la capacidad de borrar la empresa.*
- **El resolvedor que no adivina.** `prestador_que_gestiono()` **rebota** si
  alguien gestiona dos negocios (medido: 0 de 8 hoy). *Elegir en silencio sería
  escribir en el negocio equivocado.*

**Estado: curada en MOTOR (predicados + dedos técnicos) · ⏳ re-gate del founder
PENDIENTE · 🟠 SUPERFICIE abierta** (§4ter, lote de C sobre lámina de mesa).

**D-652 CERRADA:** la rama `administrador` dejó de ser código sin portadores.

---

## 3. LO DEMÁS QUE CERRÓ

- **La regla única de clave: 8, en un solo lugar.** Y el censo destapó el caso
  peor: `auth.ts` interpolaba **6 a mano** en el mensaje del **registro**, que
  **no valida largo localmente** — *una promesa sin guard detrás.*
- **D-659, mitad de arquitectura:** el código se verifica una vez y la clave se
  reintenta libre. *El hallazgo de la sesión fantasma, vuelto cura.*
- **Fichas numeradas:** **D-655** (la última milla de los assets) · **D-656**
  (el wizard que quema a la persona) · **D-658** (memorial reservable por RPC) ·
  **D-659** (el reset) · **D-660** (la gestión sin motor).
- **Depósitos:** dos láminas firmadas · el censo de voz del prestador · la
  enmienda v0→v1 del modelo · el acta del gate · los literales del reset.

---

## 4. LAS LEYES DE MÉTODO QUE ESTA CORRIDA DEJÓ

**La trilogía del instrumento** (las tres nacieron de guards que abortaron):

1. **El cinturón de una migración mide SIN efectos laterales.** El par que
   necesita tocar estado vive en fixture con ROLLBACK.
2. **Dos verdades no se resumen en un exit.** `db query` y `db push` corren con
   roles distintos, y `RESET ROLE` no restaura bajo push — su fallo dejó el
   **estado partido**: DDL aplicado, historial sin registrar. *El peor residuo
   posible de un guard, y se detecta midiendo las dos cosas por separado.*
3. **El cinturón mide el VERBO que la migración cambia.** Lectura sobre
   escritura **acusa al inocente**.

**Las de censo y migración:**

- **Un censo declara qué clases mira** — policies, RPCs **y triggers**. *El que
  mira dos de tres reporta dos tercios como total.*
- **Migrar un gate sin mirar qué permite es mudar el agujero a una casa más
  grande.** *Un estado que miente hoy es la evidencia falsa de mañana.*
- **Una cuenta que es dos cosas no prueba ninguna.** El censo de D-660 dio todo
  verde con la cuenta bifronte **y era falso**.
- **Un `UPDATE` bajo RLS que no matchea NO FALLA: afecta CERO.** Se cuenta
  `ROW_COUNT`, jamás la ausencia de excepción.
- **Cero ≠ «no puede» cuando es «no hay»** — y se mide, no se supone.
- **Un `false` que avanzó ≠ un `false` que no entró.** Solo el verde real los
  distingue.
- **Una cuenta sembrada por SQL no está creada hasta que el camino real la
  concede** — tokens (identidad) y `empleado_roles` (membresía), dos capas del
  mismo hueco.

**Y la que esta acta se aplicó a sí misma:** *una ficha que afirma un gate que
no ocurrió es el dato falso que esta casa caza en el código.* **D-660 y D-652
se corrigieron: el dedo era técnico, no el del founder.**

---

## 5. LO VIVO, CON DUEÑO — el tablero

| qué | de quién | cuándo |
|---|---|---|
| **el 13-ago: el primer correo real sale solo** | el motor | ocho días — con cinturón e interim puestos |
| **el arco del reset** | pantalla + lámina de cajas por dígito → **C** | no cierra hasta el cambio de contraseña de punta a punta del founder |
| **§4ter — el home por rol + la consolidada** | lámina → **mesa** · construcción → **C** | el motor ya espera debajo |
| **re-gate de D-660** | **founder** | cuenta `+s88rolpuro` lista |
| **`passwordAyuda` = 6** | **C** (prestador) · **D** (cliente) | con sus lotes |
| **el panel a 8** | **founder** | un clic |
| **push** | build nativa | y después, un `UPDATE` de una fila |
| **D-656 · D-658** | mesa | antes del soft launch |
| **4 tablas vacías de D-660** | — | el día que tengan filas reales |
