# S80-B1 · M1 — LA PANTALLA DE REGISTRO DEL PRESTADOR (D-509 ①)

> Boceto obligatorio ANTES de composición (mecanismo M1–M5, S71).
> Territorio: apps/prestador. Cero motor nuevo: consume `registrarse`
> (wrapper S45 de packages/api, ya exportado — el MISMO auth que el
> cliente; la cuenta nace VACÍA, curaduría intacta).

## 0. La medición previa (regla 77 — D-514, el handshake, VERIFICADO)

`aceptarInvitacionEquipo` (equipo.ts:831-852) llama al RPC vivo
`aceptar_invitacion_pendiente_login` y **LEE el jsonb** (`fila.ok !== true`
→ rebote tipificado por literal, clase D-511): los tres literales
('Sin sesión' / 'Empleado no encontrado o ya activado' / 'No tenés
permiso…') viven en `REBOTES_ACEPTAR` con su código. `/invitacion`
distingue `ya_activado` como NO-falla (entra igual) y `no_es_tuya` con
voz propia. **El eslabón que D-509 agrega es el ANTERIOR al handshake:
que la cuenta exista.** La cadena completa queda:
registro (nuevo) → `crear_empleado_directo` (titular) → `/invitacion`
(vivo) → `activo=true` → R1 resuelve → tabs.

## 1. Las 7 preguntas (§1c)

1. **¿Qué trabajo hace?** Alta de cuenta email+password. Formulario:
   `Campo`×3 + `Boton` primario. El trabajo ya tiene patrón resuelto en
   la casa: `registro.tsx` del cliente (S45). Se PORTA, no se re-diseña.
2. **¿Ya existe en la casa?** Sí — en la otra app. Reusar > adaptar >
   crear: port con DOS cambios (rutas de salida + diccionario propio).
3. **¿Recorriste la casa?** Vecinas: ANTES viene `/login` (mismo par
   Campo/Boton, mismos errores inline) — el link de entrada vive ahí,
   espejo del par primario+ghost de la bienvenida del prestador. DESPUÉS
   viene el guard raíz (tercera voz) y, cuando el titular invite,
   `/invitacion`. La voz encadena: "Crear tu cuenta" → "Tu cuenta está
   lista" → "{{negocio}} te sumó a su equipo" (Ley 17.3).
4. **TESIS:** *"Tu cuenta se crea acá, en un paso — y el negocio te suma
   después."* La pantalla comunica que registrarse NO pide permiso a
   nadie (muere el paso founder-en-Studio) y que la cuenta sola no abre
   nada (curaduría intacta — la línea de contexto lo dice).
5. **¿Capa y dosis?** Dosis prestador (baja): CTA ancla al oficio vía
   `cta="oficio"` del raíz (gratis, cero override), cero gradiente, cero
   acento extra. Sin capa de color: es un formulario de identidad.
6. **¿3 temas / es-en / estados?** Componentes del sistema (Campo/Boton/
   Encabezado) — los 3 temas gratis. Keys es+en (Espejo exigible).
   Estados: reposo · enviando (`cargando` del Boton, anti doble-tap) ·
   error por campo (email tomado/inválido → Campo email; password débil
   → Campo password; resto → Aviso) · éxito sin sesión (proyecto con
   confirmación de email) → Aviso + `/login` · éxito con sesión → `/`.
7. **CHANEL:** se quitó el placeholder de nombre y email que traía el
   cliente ('ej: Ana' / 'ej: ana@correo.com') — el label ya rotula
   (Ley 17.6: nada hace doble turno); el cliente los conserva porque su
   pantalla es de otra sesión (D-318: migra al tocarse, no acá).

## 2. Composición (port, cero componente nuevo)

```
┌─────────────────────────────────────┐
│ ‹  Crear cuenta                     │  Encabezado navegacion
├─────────────────────────────────────┤
│ Con tu cuenta, el negocio donde     │  Texto apoyo (contexto —
│ trabajas puede sumarte a su equipo. │  sirve la tesis)
│                                     │
│ Tu nombre                           │  Campo
│ Email                               │  Campo (errores inline)
│ Contraseña                          │  Campo secure
│ Al menos 6 caracteres               │  (ayuda del Campo)
│                                     │
│ [        Crear mi cuenta        ]   │  Boton primario (oficio)
└─────────────────────────────────────┘
```

**Las DOS rutas de salida (lo único que cambia del port):**
- éxito con `sesion_activa` → `marcarRegistroReciente(email)` +
  `router.replace('/')` — el guard raíz re-decide y cae en la rama
  `sin_rol` con la TERCERA VOZ (abajo). **Jamás `/onboarding/mascota`.**
- éxito sin sesión (confirmación de email exigida) → Aviso
  `correoConfirmacion` + `router.replace('/login')` (misma mecánica que
  el cliente; el destino es EL login del prestador).

**Entrada:** `/login` gana un `Boton ghost` bajo "Entrar":
"¿Primera vez? Crear tu cuenta" → `push('/registro')`. La bienvenida
(letra founder S61) NO se toca — sus dos CTAs son composición firmada;
si el founder quiere el tercer camino ahí, es enmienda suya con gate.
El empleado al que le dijeron "registrate" tiene un solo botón vivo
("Ingresar") y encuentra el link a un toque.

## 3. La TERCERA VOZ de la rama sin_rol (el estado vacío del registrado)

**Mecánica:** `src/lib/registro-reciente.ts` — módulo con
`marcarRegistroReciente(email)` / `esRegistroReciente(email)` (compara
por email normalizado; patrón `ceremoniaResuelta` del propio guard:
estado de sesión de JS, cero AsyncStorage — la lección del puente S79
no se repite). El guard NO cambia de shape: la voz se elige en render.

- `negocioEmpleado !== null` → `empleadoTitulo/Detalle` (intacta).
- `esRegistroReciente(email)` → **registradoTitulo/Detalle**: "Tu cuenta
  está lista" + el camino (que el negocio te invite con este correo; la
  invitación aparece acá).
- resto → `sinRol/sinRolDetalle` **CURADA**: gana el mismo camino
  (pídele a quien administra que te invite con este correo) — el
  callejón "escríbenos" muere TAMBIÉN para quien reabre la app mañana.

**Límite declarado:** el flag vive la sesión de JS. Tras reiniciar la
app, el registrado cae a la voz genérica curada — que dice EL MISMO
camino con menos ceremonia. Degradación honesta, no pérdida de verdad.
NO se ensancha `sala-espera.tsx` (su contrato de datos ES `MiPrestador`;
sin fila, sus checks y navegaciones rebotan en cadena — L-178).

## 4. Contrato de datos (M4)

| Dato | Fuente | Se renderiza |
|---|---|---|
| nombre/email/password | input local | campos |
| `r.data.sesion_activa` | `registrarse` (S45) | decide la ruta de salida, no se dibuja |
| `r.codigo` de auth | `mapeoErrorAuth` | error inline por campo / Aviso |
| `r.data.user_id`/`nombre` | `registrarse` | **descartados a propósito** (el guard re-lee sesión) |
| email en tercera voz | `obtenerSesion` del guard | `{{email}}` del detalle |

## 5. Los strings (LOTE S80, GATE PENDIENTE — L-142)

**Conteo declarado (L-141):** el mandato decía 7 keys `registro.*`; el
port medido usa **8** (titulo · contexto · nombreLabel · emailLabel ·
passwordLabel · passwordAyuda · crearMiCuenta · correoConfirmacion) —
los 2 placeholders del cliente murieron en la pasada Chanel, y
`contexto` nace para la tesis. + `login.crearCuenta` (la entrada) +
`sesion.registradoTitulo/Detalle` (tercera voz) + las DOS curas
(`sinRolDetalle` · `equipo.invitarAyuda` · `equipo.rebSinCuenta`).
Todo en TUTEO NEUTRO, es+en.

**Curas de string (ítem 3 del mandato):**
- `invitarAyuda` deja de sub-prometer: la entrada al próximo ingreso SÍ
  ocurre desde S75 (`/invitacion`); lo que NO existe es el aviso.
- `rebSinCuenta` gana el camino: "que cree su cuenta desde esta app, en
  'Crear tu cuenta'" (nombra el label verbatim — Ley 17.3), y muere el
  "invítalo de nuevo" a secas.

## 6. TESIS/FIRMA/CHANEL/TESTS (protocolo del gate)

1. **TESIS:** arriba (§1.4).
2. **FIRMA:** de COMPORTAMIENTO (dosis prestador): la CADENA de voz que
   no se corta — el registro desemboca en "Tu cuenta está lista" con el
   paso siguiente dicho, y el rebote del titular (`rebSinCuenta`) nombra
   esta pantalla. Ninguna superficie del circuito queda muda.
3. **CHANEL:** placeholders fuera (§1.7); cero subtítulo en el header;
   la línea de contexto es UNA.
4. **TESTS §15:** dosis baja (CTA oficio del tema, un acento, cero
   gradiente) · voz tuteo neutro · error jamás disfrazado (inline por
   campo + Aviso) · scroll-cola con `insets.bottom` · teclado:
   `keyboardShouldPersistTaps="handled"` (patrón login vecino).

## 7. Qué NO hace (declarado)

- No crea fila de `prestadores` ni de `prestador_empleados` — la cuenta
  nace VACÍA (D-509 ①: la curaduría es del titular al invitar).
- No toca packages/api ni DB (territorio A). El RPC `crear_empleado_directo`
  sigue sin campo `codigo` (pedido a A registrado en equipo.ts, viaja
  con D-509).
- No resuelve el link/App Links (D-509 ② — build nativa, otro arco).
- No toca la bienvenida firmada ni `sala-espera.tsx`.
