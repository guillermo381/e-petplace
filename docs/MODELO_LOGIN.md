# MODELO_LOGIN.md — e-PetPlace · «la puerta de la casa»

> **Versión: propuesta v1.0 — Mesa 105 (23-ago-2026), para firma del founder.**
> Contrastes obligatorios: `DIRECCION_ARTE` · `DIRECCION_DISENO_S99` ·
> `POLITICAS` (P1 · P5 · P15 · P23) · `MODELO_PRODUCTO` §4 · firmas de esta mesa
> (invitación = familiar autorizado · biométrico = candado de sesión · custom auth
> domain antes de Google · nombre = **e-PetPlace**).
> Regla de unicidad: este documento es EL modelo de entrada. Ninguna pantalla de
> auth se construye contra otra fuente.

---

## 1. El principio

**La puerta es la primera promesa.** Antes de que la app pueda demostrar nada,
la pantalla de entrada ya dijo quiénes somos: o dice «esto está hecho con amor»
o dice «esto es una plantilla». Todo lo demás de este documento baja de ahí.

Tres leyes de la puerta:

1. **Cero fricción que no proteja algo.** Cada campo, cada paso y cada segundo
   se justifica o se elimina. Confirmar contraseña dos veces no protege nada que
   el ojo de visibilidad no proteja mejor: no existe en esta casa.
2. **La puerta nunca deja a nadie afuera de su propia cuenta.** Todo camino de
   entrada tiene su camino de vuelta: clave → recuperación por código; Google →
   recuperación crea clave (medido S104); biométrico falla → cae a login normal.
3. **La voz honesta también vive acá.** Los errores dicen la verdad sin regalar
   información («si el correo existe, te mandamos un código» — jamás «ese correo
   no está registrado», que le confirma a un extraño quién es cliente).

## 2. El mapa de flujos (v1 = esta mesa)

### 2.1 Bienvenida — el momento de marca
- Isotipo + wordmark **e-PetPlace** (firma 23-ago; muere `e.petplace`).
- El manifiesto: *«Tu mascota no tiene un expediente. Tiene una vida.»*
- Primario degradé de marca: **Crear cuenta**. Secundario: **Ya tengo cuenta**.
- Términos y privacidad al pie, como hoy.
- Movimiento: UNO, sutil, de marca (§6). Jamás un canvas de partículas.

### 2.2 Crear cuenta
- **Tres campos: nombre · email · contraseña.** Ni uno más.
- Email: trim + minúsculas antes de enviar (la divergencia de 17 filas de
  `profiles.email` nació de no hacerlo — la cura empieza en el campo).
- Contraseña: un solo campo · ojo de ver/ocultar (ícono, no texto) · mínimo 8 ·
  medidor de fuerza sutil (barra, sin sermón) · **pegar permitido siempre**
  (gestores de contraseñas son aliados, no amenazas) · sin reglas de composición
  arbitrarias ni vencimiento periódico (NIST 800-63B).
- 🔴 **Consentimiento visible y registrado**: la línea de términos/privacidad va
  EN esta pantalla, no solo en bienvenida (hallazgo 23-ago: hoy falta). El
  registro del consentimiento queda en el sedimento — P23 promete poder
  demostrar qué aceptó cada quien.
- Verificación de correo: se enciende según firma 5.5 (después del gate del
  SMTP en Gmail). El flujo: crear → código de 8 dígitos → adentro.
- Autofill declarado: `textContentType`/`autoComplete` en los tres campos, para
  que iOS/Android ofrezcan guardar la clave.

### 2.3 Iniciar sesión
- Email + contraseña, mismo lenguaje visual que crear cuenta.
- Primario **ocre pleno** (N26/N26.1: ocre = lo que acciona; bienvenida usa la
  variante `marca` como excepción propia de esa pantalla). El defecto medido no
  era el color: era el estado deshabilitado leyéndose con formulario vacío, el
  **gap 0 entre botones** y la ausencia de `MarcaDeAgua`.
- **«¿Olvidaste tu contraseña?» es un enlace** (variante `ghost`, ya existe).
- Error de credenciales: genérico y humano («correo o contraseña incorrectos»),
  sin distinguir cuál falló.
- Rate limiting: el de Supabase, ya activo. No se construye uno propio.
- La sesión persiste — entrar es un evento raro, no un ritual diario. El
  biométrico (§2.5) protege lo persistido.

### 2.4 Recuperar — el flujo de dos pasos (construido y medido)
- Pedir código → correo con los 8 dígitos grandes (ya sale así) → pantalla de
  código con **botón Pegar** + autofill de teclado (`oneTimeCode` /
  `sms-otp`) → clave nueva (un campo + ojo) → adentro.
- Reenviar con cuenta regresiva de 60s (el mínimo del SMTP ya lo impone; la UI
  lo muestra en vez de dejar que el segundo toque falle en silencio).
- El correo dice cuánto vive el código; la pantalla también.
- Medido 23-ago: establece clave sobre cuentas Google-only sin romper la
  identidad de Google. Es también el camino de las 8 cuentas históricas.

### 2.5 Biométrico — el candado (firma 23-ago)
- Huella / Face ID como **candado sobre la sesión existente**, jamás como factor
  contra Supabase. Interruptor en Seguridad, chequeo al volver a primer plano,
  fallback SIEMPRE al login normal. Sin biométrico enrolado, el interruptor ni
  aparece.

### 2.6 La invitación de familia (tanda 2)
- El enlace/correo de invitación aterriza en una **bienvenida propia**: quién te
  invitó y a cuidar a quién — con nombre y foto de la mascota. Es la única
  puerta personalizada de la casa, y es la que más tiene que enamorar.
- De ahí: crear cuenta (mismos tres campos) → onboarding corto (3 láminas: qué
  es esto, qué podés ver, qué podés hacer) → adentro como familiar autorizado.
- Menores: no entran por invitación en v1 (sin `fecha_nacimiento` no hay P5).

## 3. Lo que la cuenta ofrece una vez adentro (estado tras esta mesa)

| pieza | estado |
|---|---|
| Cambiar clave | existe (re-autentica) |
| Recuperar | existe, dos pasos, medido |
| Cambiar correo | se construye — tanda 1, sobre la copia curada + double confirm |
| Cerrar sesión | existe |
| Cerrar sesión en todos los dispositivos | se construye — firma 5.6 |
| Biométrico | se construye — tanda 2 |
| Invitar a la familia | se construye — tanda 2 |
| Exportar datos | se construye — tanda 3 (P15) |
| Cerrar cuenta | se construye — tanda 3 (P15: exportar → decir la verdad → inalcanzable → 30 días) |

## 4. Los proveedores — hoja de ruta honesta

| proveedor | cuándo | condición |
|---|---|---|
| **Email + clave** | v1, único | — |
| **Google** | v2 | 🔴 custom auth domain ANTES (`auth.epetplace.com`) — la pantalla de consentimiento jamás muestra `*.supabase.co`. Las 8 cuentas históricas ya quedaron bi-camino. |
| **Apple** | v2 | cuenta de Apple Developer (D-U-N-S). Obligatorio recién cuando haya OAuth de terceros en iOS. |
| **Código por correo (sin clave)** | v2, evaluar | el motor OTP ya existe; sería «entrar sin contraseña» gratis. Decisión de producto, no técnica. |
| Teléfono/SMS | no | costo y fraude; el correo es el ancla de esta casa. |

## 5. Mejores prácticas — checklist de construcción

1. Normalizar email en TODA puerta (trim + lower) — cliente y wrapper.
2. Un campo de clave + ojo; pegar permitido; autofill declarado.
3. Errores sin enumeración de cuentas.
4. Código de un solo uso: Pegar + autofill + reenvío con cuenta regresiva +
   vencimiento dicho.
5. Área de toque mínima 44pt en ojo, enlaces y botones.
6. Contraste AA en todos los estados (el amarillo actual falla).
7. Teclados correctos por campo (`email-address`, etc.) y `returnKeyType` que
   avanza campo a campo; el último dispara la acción.
8. Estados de carga en el botón (spinner en el primario, jamás pantalla
   congelada) y deshabilitado real solo mientras la llamada vuela.
9. i18n completo ES/EN desde el día uno — la puerta es bilingüe como la casa.
10. Todo por wrappers de `packages/api` — cero llamadas a Supabase desde
    pantallas (puerta única, como siempre).

## 6. La dirección de diseño — «que se enamore en la puerta»

Lo que se hereda de la referencia del founder (traducido a React Native):

- ~~Campos con label flotante~~ **NO entra**: choca con N11′ (etiqueta afuera,
  jamás cambia por foco; firmada 17-ago y sostenida en re-litigio). El campo
  «respira» por foco de borde y color, no moviendo la etiqueta.
- **Ojo** para ver/ocultar, con área de toque generosa — es el ÚNICO componente
  nuevo (no hay glifo de ojo en el registry de 52; gate de ícono).
- **Jerarquía limpia**: UN primario ocre por pantalla (N26); lo secundario es
  `ghost`.
- **Validación en vivo** del email al salir del campo (N12.3), mensaje corto
  bajo el campo con `Campo.error + PieDeCampo`, que ya existen.
- **Movimiento de marca, no de feria**: `MarcaDeAgua` detrás (0 frames de
  costo) + `Entrada`; opcional un `translateY` de ±6px con `withRepeat` en hilo
  de UI. **Prohibido**: canvas de partículas, confetti, gradiente animado
  (`LinearGradient` no interpola en UI thread).

Lo que es nuestro y la referencia no tiene:

- **La voz.** El microcopy es de la casa: cálido, honesto, sin jerga. «Entrá»
  mejor que «Iniciar sesión» donde el tono lo permita.
- **El momento de llegada**: al entrar, la app te recibe con TU mundo — el
  nombre, las mascotas — no con un dashboard frío. El enamoramiento no es la
  animación del login: es que la puerta se abra a algo vivo.
- **Composición móvil**: acciones ancladas al pie, formulario que sube con el
  teclado, nada flotando en medio de un vacío.
- Modo oscuro: v2, decisión de producto aparte (hoy la app no lo tiene; el
  login no lo estrena solo).

## 7. Lo que este modelo NO hace

No construye SMS · no construye 2FA (v2+, cuando haya algo que un segundo
factor proteja mejor que el biométrico + sesión) · no estrena modo oscuro · no
decide el copy final (voz firmada pieza por pieza, como siempre) · no toca el
lado prestador más allá de la simetría de patrones (su rediseño de marca es
otra conversación).

## Historial
- v1.0 propuesta (Mesa 105, 23-ago-2026): redactada sobre las mediciones de las
  cuatro pistas, las firmas de la mesa y la referencia visual del founder.
- **Depositada por A en S104 (23-ago-2026), verbatim.** Nota de depósito: su §2.2
  («email: trim + minúsculas antes de enviar») y su §5.1 quedaron **ejecutadas en
  la tanda 1** — `normalizarEmail()` vive en `packages/api/src/wrappers/auth.ts`
  y rige registro **e** inicio de sesión. El consentimiento de §2.2 también:
  `registrarConsentimiento()`, con la policy de la tabla curada el mismo día
  (admitía escritura anónima a nombre de terceros).
