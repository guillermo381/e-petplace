# S92-BIS · LA LISTA DE GATES EN DISPOSITIVO — para el founder

> **Qué es esto:** lo que hay que tocar con el dedo para que lo de esta sesión
> se declare firme. **Nada de acá está gateado todavía** (regla 77: un gate se
> declara pasado cuando el runbook cierra entero).
>
> **Precondición de casi todo: el OTA.** La cura del paseo está commiteada y
> **no publicada** — medido: el canal sirve el ancla `c4c92933` (S91), que es
> anterior. Sin OTA, el aparato sigue viendo el bundle viejo.

---

## ① EL PUSH — el más importante, porque una cura lo tocó

**Qué cambió:** `despachar-push` ahora exige un secreto que manda el cron.
**Qué probar:** que **una notificación siga llegando al teléfono**.

- [ ] Disparar una notificación real (el camino que usaste en S90: bono o cita)
      y **verla llegar al aparato**.
- [ ] Si NO llega: el rollback es una línea y está escrito en el acta §D-713.

> *Lo que ya está medido y no hace falta que repitas:* el tick del cron corrió
> después de la cura y salió `succeeded`; sin credencial y con la anon key la
> función rebota 401. **Lo único que la medición no puede ver es el teléfono.**

## ② EL PASEO — la cura del P0 (necesita OTA)

- [ ] Agendar un paseo de punta a punta con Thor o Zeus.
- [ ] **Tocar un paseador APENAS abre la pantalla**, sin esperar — ese apuro es
      el que producía el bug.
- [ ] Verificar que **no** aparece «tu hogar todavía no tiene un perro
      registrado».

## ③ LOS 4 STRINGS NUEVOS — son tuyos, sin gate

Nacieron con la cura del paseo y están marcados `GATE PENDIENTE` en el
diccionario. Se ven **solo** si el catálogo tarda o falla:

- [ ] `paquete.catalogoCargandoTitulo` — «Un segundo»
- [ ] `paquete.catalogoCargandoDetalle` — «Estamos terminando de cargar los datos del paseo…»
- [ ] `paquete.catalogoErrorTitulo` — «No pudimos cargar los datos del paseo»
- [ ] `paquete.catalogoErrorDetalle` — «…Tus mascotas están bien: lo que no llegó es la información del servicio.»

## ④ LAS FUNCTIONS FACTURABLES — cuatro flujos que ahora exigen sesión

La cura es invisible si todo anda; se nota **solo si rompió algo**.

- [ ] **Carnet por cámara** (cliente) — que la lectura de vacunas siga funcionando.
- [ ] **Dictado clínico** (prestador) — que la nota siga estructurándose.
- [ ] **Captura de dirección con Places** — en el alta de sede o de hogar.
- [ ] **El escriba de presencia** (prestador).

## ⑤ STORAGE — `avatars` con carpeta propia y límites

- [ ] **Subir un logo de negocio** (PNG, menos de 5 MB) y verlo quedar.
- [ ] Que la **galería del prestador** y las **fotos de mascota** sigan viéndose.

## ⑥ WHATSAPP — solo si lo descongelás

- [ ] El retome documentado **cambió**: ahora el `curl` necesita
      `-H "x-despacho-secret: <valor>"`. Sin eso rebota 401.
      *(El valor está en los secrets del proyecto, nombre `DESPACHO_SECRET`.)*

---

## LO QUE **NO** ES UN GATE — es una perilla que movés vos (D-716)

| perilla | dónde | valor actual (medido) | valor propuesto |
|---|---|---|---|
| **Minimum password length** | Dashboard → Authentication → Providers → Email | **6** | **10** (o 12) |
| **Leaked password protection** | Dashboard → Authentication → Providers → Email (o Security) | **APAGADA** — aceptó `password`, `12345678`, `qwerty123`, `aaaaaaaa` | **ENCENDIDA** |
| **Rate limit de auth** | Dashboard → Authentication → Rate Limits | **sin corte en 12 intentos fallidos seguidos** | que aparezca un `429` **antes del intento 10** |
| *(no tocar)* access token | Authentication → Sessions | **1 hora** ✅ | queda igual |

**Ninguna de las dos primeras invalida las contraseñas existentes:** rigen para
las nuevas y para los cambios. La tercera sí conviene mirarla con cuidado, para
no molestar a alguien que se equivoca dos veces.

**Cuando las muevas, avisame y re-mido los tres por camino real** — es una
corrida de un minuto (`node scripts/seg2/b4-auth.mjs`).
