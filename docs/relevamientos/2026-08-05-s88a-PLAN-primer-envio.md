# S88-A · EL PLAN DEL PRIMER ENVÍO — con su par y su rojo antes

> **Estado al escribirse:** el circuito entero late — cron cada minuto,
> `despachar-correo` en `modo: transporte_vivo` (la llave cargada por el
> founder, 18:00), **cero para entregar: los 37 tipos siguen en sombra.**
> **El primer tipo que sale es decisión del founder mirando su sombra (§10.2).**
> Este plan es la secuencia de ese gate — se ejecuta CON el founder, no antes.

---

## 0bis. NOTA DE ACTA — la infraestructura, del lado del founder (5-ago)

- **`avisos.epetplace.com` → VERIFIED en Resend (región `sa-east-1`)**, los 4
  registros vivos en Hostinger.
- **El hallazgo del DNS, que merece su línea:** los nameservers de
  `epetplace.com` estaban delegados a **Vercel, que tenía la delegación y
  NINGUNA zona** — por eso el dominio **nunca resolvió**. Se movieron a
  Hostinger. *Un dominio delegado a quien no tiene la zona es un dominio que
  parece configurado y no existe — la clase L-192 en DNS.*
- **Tarea declarada, sin dueño todavía:** el **censo de la zona vieja de
  Vercel** si algún día el registro se transfiere a Namecheap.
- **`RESEND_API_KEY`** cargada por el founder como secret — **jamás viajó por
  chat** (L-130 sostenida).

## 1. QUÉ TIPO — `plan_renovado`, y por qué él

- **Es CONSTANCIA (§7):** *"el plan se renovó y se cobró"* — el tráfico exacto
  para el que el canal de email existe. Candidato natural ya nombrado dos veces
  por la mesa.
- **Tiene productor VIVO:** `cerrar_y_renovar_planes` lo registra en cada
  renovación. **No hay que fabricar el productor — solo el momento.**
- **Y tiene un primer envío REAL con fecha propia:** el plan de Thor renueva el
  **13-ago** (cron de las 08:00). *Si el gate pasa, el primer correo real de la
  historia sale solo, ocho días después, a un buzón que el founder controla*
  (la familia de prueba `+8` — todas las familias hoy son suyas).

## 2. A QUIÉN — el envío de prueba, al FOUNDER

**Destinatario: `guillo381@gmail.com`** — el buzón real del founder. La
intención de prueba se fabrica **declarada** (`clave_dedup = 'gate:primer-envio'`,
`datos` diciendo que es la prueba del gate). *El primer correo que el producto
manda en su historia le llega a quien lo firma.*

## 3. LA SECUENCIA DEL GATE — el rojo ANTES del verde (L-199)

```
PASO 0 · LA SOMBRA MIRADA
  El founder corre leer_sombra_notificaciones() y ve qué habría salido.
  (Ya lo hizo una vez — se repite sobre el estado del día.)

PASO 1 · EL ROJO: el kill switch corta EL PROPIO ENVÍO DE PRUEBA
  a) UPDATE notificacion_config SET despacho_activo=false,
       motivo='gate del primer envío: el freno se prueba antes que la voz',
       apagado_por=<uid founder>, apagado_en=now() WHERE alcance='global';
  b) UPDATE cat_notificacion_tipos SET en_sombra=false WHERE codigo='plan_renovado';
  c) registrar_intencion_notificacion('plan_renovado', <uid founder>, NULL, NULL,
       '{"titulo":"Prueba del gate del primer envío",
         "mensaje":"Si leés esto en tu correo, el gate del kill switch FALLÓ: este envío debía quedar retenido."}',
       'gate:primer-envio');
  d) tick (o esperar el minuto del cron)
  ✗ ESPERADO: el lector dice «RETENIDA — el despacho está frenado».
     CERO correos en Resend. El mensaje de (c) está escrito para que un
     verde falso SE DELATE SOLO: si llega, su propio texto dice que falló.

PASO 2 · EL VERDE: se levanta el freno y la voz nace
  a) UPDATE notificacion_config SET despacho_activo=true, motivo=NULL
     WHERE alcance='global';
  b) tick → la intención retenida SE RE-EVALÚA (la firma del re-encendido:
     la cola vuelve a pasar por la puerta; saldo_pagado/operacion… plan_renovado
     es operacion, vigencia 24 h — la prueba tiene minutos: VIGENTE, sale).
  ✓ ESPERADO: estado='entregada', proveedor_id de Resend en resuelto_como,
     y EL CORREO EN EL INBOX DEL FOUNDER — remitente avisos.epetplace.com.

PASO 3 · LO QUE QUEDA VIVO, dicho antes de ejecutar
  · `plan_renovado` queda FUERA de sombra: la renovación del 13-ago manda
    el primer correo REAL sola. Eso es lo que este gate autoriza — se firma
    sabiéndolo, no se descubre el 13.
  · Los otros 36 tipos SIGUEN en sombra. Cada uno saldrá con su propio gate.
  · La intención 'gate:primer-envio' queda en el registro como acta.
```

**El par completo:** el MISMO envío, retenido con el freno bajado y entregado
con el freno alzado. *No son dos pruebas: es una, con las dos caras — y prueba
la vara de S88 al pie: el modo de pararlo existió y funcionó ANTES de que la
primera voz saliera.*

## 4. EL SEGUNDO ACTO DEL «PRIMER LOTE HABLADO» — el correo de reset

**La fuga más vieja de la lista** (§10bis ④): el correo de recuperación es de
Supabase Auth —no del motor— y hoy llega en inglés, de remitente ajeno, con
Site URL apuntando al portal viejo. **Su cura son TRES piezas, dos del founder
y una de código:**

| pieza | de quién | qué |
|---|---|---|
| **Site URL** del proyecto | founder (dashboard → Auth → URL Configuration) | deja de apuntar al portal viejo |
| **Template ES** de "Reset password" | founder (dashboard → Auth → Templates) | voz nuestra, **con `{{ .Token }}` visible** — la app canjea el CÓDIGO (`verifyOtp`, S84): el correo debe mostrar el código, no un link |
| **SMTP custom → Resend** | founder (dashboard → Auth → SMTP) | el reset sale por `avisos.epetplace.com` — la MISMA identidad que el motor; muere el remitente ajeno (D-628) |

**Propuesta de orden:** el gate del §3 primero (prueba el motor entero); el
reset inmediatamente después en la misma sesión — **son 10 minutos de dashboard
del founder y cierran D-628 y la fuga del portal viejo en el mismo acto.**

## 5. Lo que este plan NO hace

- No saca nada de sombra hoy: **los pasos 1b-2 son actos DEL GATE**, con el
  founder mirando.
- No toca el techo duro (500/24 h queda).
- No decide los otros 36 tipos: **un gate por tipo**, §10.2 al pie.
