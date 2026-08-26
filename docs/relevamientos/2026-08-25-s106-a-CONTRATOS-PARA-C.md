# S106-A → C · LOS CUATRO CONTRATOS, AUTOCONTENIDOS

> **De:** pista A · **Para:** pista C (y B donde toque) · 25-ago-2026.
> **Todo lo de acá está APLICADO y VERIFICADO CONTRA EL OBJETO**, no
> planeado. Cada contrato dice su firma exacta, sus rechazos tipados y lo
> que **NO** hace.
> **Regla de lectura:** si algo de este documento no coincide con lo que la
> DB devuelve, gana la DB y me avisás — no lo acomodes.

---

## ① LA VENTANA COMO VALOR LEÍBLE

**Migración `20260826200000`.**

```
tipos_servicio.ventana_cancelacion_minutos  integer NOT NULL DEFAULT 1440
  · telemedicina = 30
  · TODO lo demás = 1440 (24 h) — el default ES la conducta de hoy
```

**Lector, para que la superficie no hardcodee el 30:**

```sql
public._ventana_cancelacion_minutos(p_tipo_servicio text) RETURNS integer
-- STABLE · SECURITY DEFINER · GRANT a authenticated
-- fail-safe: un tipo desconocido devuelve 1440, jamás "sin ventana"
```

⚠️ **Lo que NO hace:** no gobierna la **reagenda** (P18(b), 2 h) ni el
**salto de plan** (P14) ni la **cancelación de paquete** (P16, 2 h). Esas
cuatro funciones **conservan su literal a propósito** — cablearlas contra un
default de 1440 les habría cambiado la conducta. Está declarado en la
cabecera de la migración.

**Para la pantalla:** el texto de la ventana se arma del valor leído, no de
un `30` escrito en la app. *Si mañana el founder mueve la ventana, la
pantalla no se entera y sigue diciendo la verdad.*

---

## ② EL CONSENTIMIENTO VIAJA EN EL HOLD — atómico

**Migración `20260826210000`.** La firma del hold **CAMBIÓ** (L-119: la vieja
de 7 args está DROPeada, no conviven).

```sql
public.crear_bloqueo_agenda(
  p_prestador_id uuid,
  p_servicio_id uuid,
  p_mascota_id uuid,
  p_fecha date,
  p_hora time,
  p_modalidad text DEFAULT NULL,
  p_empleado_id uuid DEFAULT NULL,
  p_acepta_teleconsulta boolean DEFAULT NULL   -- ← NUEVO, último
) RETURNS jsonb
```

**Cómo se usa desde el cliente:**

- **Para teleconsulta:** mandás `p_acepta_teleconsulta: true` **en la misma
  llamada del hold**. No hay una segunda llamada para el consentimiento, y
  no debe haberla.
- **Para todo lo demás:** no lo mandás. El parámetro es opcional y el resto
  del motor no cambió.

**Rechazo tipado nuevo:** `consentimiento_requerido` (ERRCODE `22023`) — se
levanta **antes** de tomar el lock, así que rebota barato.

**Lo que el servidor hace y la pantalla NO debe hacer:**

- **La VERSIÓN del texto la pone el servidor** (`letra-telemedicina-v1.1`).
  La pantalla **no la manda** — misma ley que `documentosVigentes`: *la casa
  tiene UNA respuesta a «qué texto vio», y no la decide la pantalla.*
- La fila de `consentimientos` nace en la **misma transacción** que la cita.
  ⇒ **una teleconsulta con hold y sin consentimiento es inexpresable.**

**El retorno gana un campo:** `modalidad` (para teleconsulta siempre
`'telemedicina'`).

🔴 **La modalidad ya NO se manda desde el cliente para teleconsulta.** Se
**deriva del tipo de servicio, server-side**. Si mandás `p_modalidad` con
otra cosa, rebota `modalidad_invalida`; y si mandás `'telemedicina'` sobre un
servicio que no lo es, **también rebota**. *La marca del expediente no puede
depender de lo que declare quien reserva.*

⚠️ **El abandono del hold deja la fila de consentimiento viva, y es
INOFENSIVO:** dice que esa persona vio y aceptó el aviso ese día. *La
evidencia de haber informado no caduca porque la reserva no se haya
completado.* No lo trates como basura a limpiar.

---

## ③ LOS MÍNIMOS §6 — y cómo se lee «prendido sin aceptación»

**Migración `20260826220000`.**

```sql
-- El prestador acepta (idempotente: aceptar dos veces no es error)
public.aceptar_minimos_servicio(p_prestador_id uuid, p_servicio_codigo text)
  RETURNS jsonb { ok, prestador_id, servicio, version, aceptado_en }
  · rechazos: auth_required (42501) · no_access_to_prestador (42501)
              · servicio_invalido (22023)

-- El lector, para que la pantalla sepa qué mostrar
public.prestador_acepto_minimos(p_prestador_id uuid, p_servicio_codigo text)
  RETURNS boolean
```

### 🔴 «Prendido sin aceptación» — cómo se lee, que es tu pregunta exacta

**No hay un estado nuevo que leer: el estado ya se lee de las piezas que
existen, y son DOS preguntas distintas.**

| pregunta | cómo se contesta | qué significa |
|---|---|---|
| ¿la oferta está prendida? | `prestador_servicios.activo` y `.reservable` | lo que el prestador quiso |
| ¿está habilitada? | `prestador_acepto_minimos(id,'telemedicina')` | si puede publicarse |

⇒ **«prendido sin aceptación» = `ps.reservable = true` Y
`prestador_acepto_minimos(...) = false`.** Es el estado de **Clínica Aurora
hoy** — su oferta nació encendida el 18-jul-2026, antes de que los mínimos
existieran.

**Lo que el motor hace con eso: NO LA PUBLICA.** El gate vive en
`_vet_ofertas_cobrables`, o sea **en la lectura**, no en un trigger — un
trigger solo mira escrituras futuras y habría dejado a Aurora publicando
para siempre. **Fail-closed y retroactivo por construcción.**

**Lo que la pantalla del prestador debería decir**, y es decisión tuya de
superficie: la oferta se ve prendida **y con una condición pendiente**, no
apagada. *Apagarla en pantalla mentiría sobre lo que él configuró; decir
«pendiente de aceptar los mínimos» dice la verdad y da el camino.*

⚠️ **L-176: esta migración no concedió nada.** Telemedicina es hoy
`reservable=false` a nivel plataforma, así que la vitrina no cambió para
nadie (medido: 10 ofertas vet antes y después).

---

## ④ NO REALIZABLE Y CANCELACIÓN — con sus rechazos

**Migración `20260826230000`.**

```sql
-- §5 · el PRESTADOR marca que no se pudo
public.marcar_teleconsulta_no_realizable(p_cita_id uuid, p_detalle text DEFAULT NULL)
  RETURNS jsonb { ok, cita_id, estado:'no_realizable',
                  devolucion_registrada boolean, monto }
  · auth_required                    (42501)
  · no_es_el_prestador_de_la_cita    (42501)  ← actor equivocado
  · cita_no_es_teleconsulta          (22023)
  · cita_estado_invalido: <estado>   (22023)  ← ya completada/cancelada/etc.

-- §4 · el DUEÑO cancela dentro de la ventana
public.cancelar_teleconsulta(p_cita_id uuid)
  RETURNS jsonb { ok, cita_id, estado:'cancelada', ventana_minutos,
                  devolucion_registrada boolean,
                  via_devolucion:'medio_de_pago_por_soporte' | null }
  · auth_required                    (42501)
  · cita_no_encontrada               (22023)  ← también si es de otro
  · cita_no_es_teleconsulta          (22023)
  · cita_estado_invalido: <estado>   (22023)
  · ventana_cancelacion_vencida      (22023)  ← fuera de los 30 min
```

🔴 **`cancelar_cita_suelta` YA NO acepta teleconsultas** — rebota
`usar_cancelar_teleconsulta` (22023). *Dos puertas para el mismo acto es una
puerta que nadie vigila.* Si tu pantalla llamaba a la genérica, ruteá.

### La voz, que es lo que más importa acá

**El campo `via_devolucion` existe para que la pantalla NO invente.** La
promesa firmada es **«a tu medio de pago»** con **plazo honesto**, y **JAMÁS
«al instante»** ni **«como saldo»**.

> **EL SISTEMA REGISTRA. NO PROMETE, NO DEVUELVE, NO JUZGA.**
> `estado='pendiente'` en `solicitudes_devolucion` significa *«alguien tiene
> que devolver esta plata»*, **jamás** *«ya se devolvió»*. La ejecuta una
> persona en el panel del proveedor.

**El dueño puede LEER su propia solicitud** (`solicitudes_devolucion`, policy
`devolucion_select_propia`) — para que la pantalla pueda decir «está en
trámite» sin inventarlo. **No puede escribirla ni resolverla.**

⚠️ **§5 es explícito: no se investiga la culpa.** El campo `atribucion` de la
metadata dice literalmente `'no_se_investiga'`. *No pongas en pantalla nada
que sugiera que el sistema sabe de quién fue la falla — no lo sabe y no
puede saberlo.*

---

## ⑤ REGALO — lo que NO tenés que construir (censo corrido a pedido)

**El recordatorio de cita al dueño YA EXISTE Y CORRE.** Medido contra el
objeto:

- función `notificar_recordatorios_cita` · tipo `cita_recordatorio` en
  `cat_notificacion_tipos`
- cron **`recordatorios-cita`, activo, cada 15 min, 1877 ticks exitosos**
  (L-402 satisfecha: **corrió de verdad**, no solo existe)
- **va al DUEÑO** (`c.user_id`, quien reservó) y **NO filtra por
  `tipo_servicio`** ⇒ **telemedicina lo hereda sin tocar nada**
- se dispara el día de la cita: `LEAST(fecha + 08:00, hora_cita − 1 h)`

⇒ **No hay 🔴 acá.** Cobrarle a un ausente al que nadie le avisó **no es el
caso**: le avisamos.

⚠️ **Un matiz honesto para la mesa, no un bloqueo:** con recordatorio a **1 h
antes** y ventana de cancelación de **30 min**, a la familia le quedan 30
minutos para cancelar sin costo. **Funciona, pero es ajustado** — si el
founder quisiera más aire, se mueve el recordatorio, no la ventana.
