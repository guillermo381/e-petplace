# S79-A · Tanda 5 — LAS TRES MEDICIONES Y EL TAMAÑO (27 Jul 2026)

**FRENO EJECUTADO en T5.1, como manda el mandato: cero construcción.**
Este reporte es el tamaño en la mano; la mesa decide si T5.2–T5.3
cierran S79 o abren S80. T5.4 (los dos pedidos a B) quedó registrado —
es documentación, no construcción. T5.5: el freno del CONTRATO sigue en
pie, nada de esta tanda lo toca.

---

## T5.1a — El mecanismo de empleados TIENE EL MISMO AGUJERO: es problema de PLATAFORMA, segunda aparición

Body ENTERO de `crear_empleado_directo` leído (el productor de las
invitaciones de equipo — `aceptar_invitacion_pendiente_login` es solo la
aceptación). **Defensa 2, literal:**

```sql
SELECT id INTO v_user_id FROM auth.users WHERE email = v_email_normalizado;
IF v_user_id IS NULL THEN
  RETURN jsonb_build_object('ok', false,
    'mensaje', 'El email no existe en la plataforma');
```

**Veredicto: el empleado TAMBIÉN tiene que registrarse por su cuenta
primero.** `invitar_prestador` no copió un mecanismo invertido — copió
el agujero tal cual estaba. Evidencia empírica que lo remata: las **9
filas históricas de `empleado_invitaciones`** son TODAS de emails que ya
existían en `auth.users` al medir (9/9 `user_existia=true`) — nunca una
invitación a un no-registrado prosperó, porque no puede.

**Es la SEGUNDA aparición del mismo hueco de plataforma** — la primera
está registrada: **D-509** ("el link para usuario nuevo", decisión
founder S74, sin construir). ⇒ La cura de T5.2 (Edge Function con
`generateLink`) no es un parche del alta: **es EL mecanismo de
plataforma que D-509 también necesita** — cuando se construya, el link
de empleados de D-509 lo reusa (mismo patrón, otro type/aterrizaje).
Cruce declarado en D-509 el día que T5.2 corra.

## T5.1b — Deep links: HAY DÓNDE ATERRIZAR, y ya está horneado

Medido en `app.json` de las dos apps (no supuesto):

| App | scheme | android.intentFilters | ios.associatedDomains |
|---|---|---|---|
| prestador | **`prestador`** ✓ | ninguno | ninguno |
| cliente | `cliente` ✓ | ninguno | ninguno |

- **El custom scheme EXISTE y viene del template** ⇒ **ya está horneado
  en las APK vivas (1.0.3 y anteriores)** — un link `prestador://…`
  abre la app instalada HOY, **cero build nativa nueva**.
- Lo que NO hay: App Links de Android ni Universal Links de iOS (los
  links `https://` que abren la app). No hacen falta para este diseño.
- Lo que falta es solo la RUTA de aterrizaje (pantalla de B — expo-router
  resuelve `prestador://alta` a `app/alta.tsx` solo).
- **El diseño barato que esto habilita** (para cuando la mesa dé OK):
  `generateLink` devuelve `properties.hashed_token` — la función arma
  NUESTRO deep link `prestador://alta?token=<hashed_token>` y B lo canjea
  con `auth.verifyOtp({ type: 'invite', token_hash })` → sesión. **Eso
  evita entero el `action_link` de Supabase**: cero allowlist de
  redirect URLs (cero consola del founder), cero redirect de navegador a
  scheme (el paso frágil). Limitación DECLARADA: un link de scheme no
  hace nada si la app no está instalada — la carta/WhatsApp dice
  "instalá la app, después tocá el link", que es la realidad pre-tiendas
  de todos modos (el founder reparte APKs hoy).

## T5.1c — El mailer: prácticamente VIRGEN, y el diseño no lo necesita

Evidencia empírica en `auth.users` (140 usuarios en la historia del
proyecto):

| Señal | Conteo |
|---|---|
| `confirmation_sent_at` NOT NULL | **0** (D-299 confirmada empírica: la confirmación está apagada) |
| `email_confirmed_at` NOT NULL | 140/140 (todos auto-confirmados) |
| `invited_at` NOT NULL | **0** (jamás se usó invite-por-email de Auth) |
| `recovery_sent_at` NOT NULL | **1** (UN reset de clave en toda la historia — el único email que este proyecto mandó) |

Si hay SMTP custom configurado no es medible desde el repo (vive en el
dashboard) — pero es irrelevante para el plan (a): **la firma del
founder eligió `generateLink` justamente porque genera y DEVUELVE el
link sin depender del SMTP** — el founder lo distribuye por su canal
(WhatsApp / la carta física de §2.2, donde el link vive naturalmente).

---

## EL TAMAÑO (lo que la mesa decide con esto)

**Veredicto del arquitecto: CHICO — cabe en S79.** Las tres mediciones
despejaron los tres riesgos que podían agrandarlo:

| Pieza | Costo | Por qué |
|---|---|---|
| Edge Function `invitaciones` (patrón `lugares`, que ya corre) | 1 función | `SUPABASE_SERVICE_ROLE_KEY` ya vive inyectada en el runtime de functions — **cero secret nuevo, cero consola del founder**. Valida admin (JWT contra `admin_users`), pre-valida los rebotes de `invitar_prestador` ANTES de crear el usuario (la compensación primero por diseño), `generateLink(type: invite)`, llama `invitar_prestador` (que NO se toca — regla dura), devuelve `prestador://alta?token=…` |
| Compensación del huérfano | adentro de la función | Pre-validar `ya_es_prestador`/`ya_tiene_cuenta`/`identificacion_en_uso` con SELECTs ANTES de crear; si `invitar_prestador` igual rebota (carrera), `admin.deleteUser` del recién creado — declarado, jamás basura |
| Enmienda LETRA_ALTA v1.1 | doc | Fase 1 = invitación REAL + el ensanche `proposito`/`direccion_envio` pendiente de T4 entra en la misma enmienda |
| Aterrizaje | **PEDIDO A B con shape** (territorio suyo) | 1 pantalla `alta` que canjea `token_hash` con `verifyOtp` + pide clave nueva → cae a la sala de espera. Cero build nativa (scheme horneado) |
| Build nativa | **CERO** | el scheme `prestador` está en las APK vivas |
| DDL | **CERO** | nada de esta pieza toca el schema |

Riesgo remanente y su tamaño: el canje `verifyOtp(type invite)` en RN se
verifica con sonda antes del pedido a B (una llamada; si el type diera
guerra, `magiclink` es el fallback con el mismo shape). No cambia el
tamaño.

## T5.4 — Los dos pedidos a B, REGISTRADOS

- **D-559**: `sector` está en la whitelist T4.1 y el shape R1, y la sede
  v1 no lo captura — un Campo más, cero motor.
- **D-560**: la sala gatea por `estado === 'pendiente'` y el CHECK tiene
  CINCO estados — `en_revision`/`suspendido`/`rechazado` caen al portal
  por omisión. **LA REGLA (mesa, va a la letra en v1.1): al portal entra
  `activo`; TODO lo demás va a la sala. Lista BLANCA, no lista negra** —
  un sexto estado futuro cae en la sala por default en vez de colarse.

## T5.5 — Declarado

El CONTRATO de LETRA_PERFIL sigue esperando el gate en dispositivo del
founder (T4.6). Nada de esta tanda lo adelanta.

---

**FRENO.** T5.2 (la función) y T5.3 (la enmienda de letra) esperan el OK
de la mesa sobre este tamaño.
