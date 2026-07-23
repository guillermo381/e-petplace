# S75-B · BOCETO M1 — EL HANDSHAKE DE PRODUCTO (D-514 (a))

> **ESTADO: BORRADOR A VARA DE A.** Depositado ANTES de construir (M1).
> La construcción NO empezó y no empieza hasta que la mesa adjudique el
> hallazgo del §0 — porque corrige una premisa del pedido de arranque.

---

## 0. EL HALLAZGO QUE CAMBIA LA PREMISA (verificado con literal, no de memoria)

El arranque dice: *"Wrapper + superficie sobre `aceptar_invitacion_pendiente_login`
+ `existe_invitacion_pendiente` (sonda). Cero motor nuevo."*

**`existe_invitacion_pendiente` NO SIRVE COMO SONDA DEL INVITADO — por DOS
razones independientes, cada una fatal.** Literal de `pg_get_functiondef`:

```sql
CREATE OR REPLACE FUNCTION public.existe_invitacion_pendiente(p_prestador_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM empleado_invitaciones
    WHERE prestador_id = p_prestador_id AND estado = 'pendiente' AND expira_en > now());
$function$
```

1. **Toma `p_prestador_id`, no el user.** Responde *"¿este NEGOCIO tiene
   invitaciones colgadas?"* — es sonda del DUEÑO. El invitado no conoce
   ningún `prestador_id` (ese es justamente su problema).
2. **Filtra `estado = 'pendiente'` — un estado que la invitación de la app
   NUNCA tiene.** `crear_empleado_directo` escribe, literal:
   `... 'pendiente_aceptacion_login', v_dueño_user_id)`. Y
   `aceptar_invitacion_pendiente_login` busca ese mismo
   `'pendiente_aceptacion_login'`. **La sonda y el aceptador miran conjuntos
   disjuntos.** `existe_invitacion_pendiente` pertenece al flujo de
   token/link del portal legado, no a este.

**Censo que lo confirma (DB viva):** `empleado_invitaciones` tiene 5 filas,
estados vivos = `aceptada | pendiente_aceptacion_login`. **Cero filas en
`'pendiente'`.** La sonda del arranque devolvería `false` siempre.

### La sonda que SÍ existe — y sigue siendo CERO MOTOR NUEVO

No hace falta motor: **la RLS ya la da.** Policy viva sobre
`prestador_empleados`:

```
empleados_self · SELECT · {authenticated} · qual: (user_id = auth.uid())
```

El invitado **puede leer su propia fila inactiva**. De ahí sale el
`empleado_id` que `aceptar_invitacion_pendiente_login(p_empleado_id)` exige
y que hoy nadie sabe de dónde sacar. El nombre del negocio sale de
`prestadores` por `prestadores_public` (`estado='activo' OR user_id=auth.uid()`).

> **Corolario de fuente de verdad (dato duro):** hay **5 filas de empleado
> inactivas** y solo **2 invitaciones** en `pendiente_aceptacion_login`.
> No son 1:1. **La verdad del handshake es la FILA DE EMPLEADO, no la
> invitación** — la invitación es un registro paralelo desalineado. El
> wrapper sondea `prestador_empleados` y jamás `empleado_invitaciones`.

### Lo que NO se toca (declarado)

Las tres funciones tienen `anon=X` en `proacl` (clase L-140/D-495/D-503).
`existe_invitacion_pendiente` filtra existencia de invitaciones a anónimos.
**NO se cura acá:** es motor, es de A, y no está en este frente. Se declara.

---

## 1. LAS 7 PREGUNTAS DEL PROTOCOLO (§1c de la skill)

1. **¿Qué TRABAJO hace?** Confirmar una pertenencia y ejecutar UNA acción
   irreversible-hacia-adelante. Trabajo de diccionario: **acción primaria
   de pantalla (19.2)** + salida secundaria (22c). No es lista, no es
   navegación, no es formulario.
2. **¿Ya existe en la casa?** Sí, todo: `LogoNegocio` (S74, gate pendiente),
   `Texto`, `Boton`, `Esqueleto`, `useAviso`. **Cero componente nuevo — Ley 11
   no se dispara.**
3. **¿Recorriste la casa?** Vecinas: `BienvenidaPrestador` (sin sesión) y la
   rama `sin_rol` del guard. Esta pantalla se mete EXACTAMENTE entre las dos:
   hoy el invitado cae en `sin_rol` — *"Tu cuenta no tiene un negocio
   asociado"* — que para él **es mentira**: sí tiene, lo invitaron.
4. **TESIS:** *"Un negocio real te está esperando, y con un toque quedas
   adentro."*
5. **Capa y dosis:** dosis PRESTADOR (baja). CTA en `accent.cta` = tealDark
   (Ley 21, el raíz ya pasa `cta="oficio"`). Cero gradiente. Un solo acento.
6. **3 temas + es/en:** tokens puros; memorial degrada dentro de
   `LogoNegocio`/`Boton`. Strings es+en, **tuteo neutro**.
7. **CHANEL — qué se quita:** la fecha de invitación (`invitado_en` existe y
   **NO se renderiza**: no cambia la decisión) · el email (ya lo sabe: acaba
   de entrar con él) · el rol (**no hay**: la invitación v1 es SIN rol, E4) ·
   el chip de estado (la pantalla entera ES el estado — Chanel directa).

---

## 2. ⚠️ ENMIENDA DE VOZ AL LITERAL DEL ARRANQUE (L-148)

El arranque dicta el final honesto con estas palabras: **"Ya sos parte de
{negocio}"**. Eso es **voseo**, y la casa habla **tuteo neutro** (regla 27,
L-148: *los dictados viajan en tuteo — la voz de producto no hereda el
acento de la mesa*). Verificado contra `es.ts` vivo: *"Ábrelo y arma tu
oferta"*, *"Configura tu oferta"*, *"¿Cierras tu sesión?"*.

**Literal propuesto: "Ya eres parte de {{negocio}}."** El SENTIDO del
dictado se conserva intacto — solo cambia el acento. A firma de la mesa.

---

## 3. LA UBICACIÓN (la regla de oro de este boceto)

**Ruta raíz `/invitacion`, hermana de `/login` — FUERA de `(tabs)`.**

El guard de `(tabs)/_layout.tsx`, en su rama `sin_prestador` (donde el
invitado cae HOY), sondea; si hay invitación, `<Redirect href="/invitacion" />`;
si no, el `EstadoVacio` de hoy queda **intacto**.

**Por qué no adentro de `(tabs)`:** el invitado no resuelve prestador
(`obtenerMiPrestador` → `sin_prestador`), así que toda superficie bajo la
puerta le nace **inalcanzable** — L-161 en su forma exacta. Precedente de la
casa: `login.tsx` ya vive en el raíz por esta misma razón.

**Ley 23 (la puerta) aplicada dos veces:** no se ofrece la pantalla si no hay
invitación (la sonda decide antes de dibujar), y no se ofrece "Aceptar" sobre
una fila ya activa (el RPC la rebotaría con *"ya activada"*).

---

## 4. LA COMPOSICIÓN

```
        ┌─────────────────────────────┐
        │                             │
        │      [ LogoNegocio 72 ]     │  ← LA FIRMA
        │                             │
        │   Satori Latam sas          │  Texto titulo (DM Sans 300)
        │   te sumó a su equipo.      │  Texto cuerpo
        │                             │
        │   Te invitaron como Diana.  │  Texto apoyo
        │                             │
        │  ┌───────────────────────┐  │
        │  │  Entrar al equipo     │  │  Boton primario bloque (tealDark)
        │  └───────────────────────┘  │
        │                             │
        │      Cerrar sesión          │  Boton compacto (22c) — salida
        └─────────────────────────────┘
```

**FIRMA (Ley 15): `LogoNegocio`.** Es firma de COMPOSICIÓN, no de color
(dosis baja, DIRECCION_ARTE §2.7): la cara del negocio real preside la
pantalla. Test anti-genérico: sin el logo esto es cualquier "accept
invitation" de cualquier SaaS; **con la cara del negocio que te invitó, es
e-PetPlace.** Beneficio lateral: `LogoNegocio` nació en S74 con **gate
founder pendiente** — esta es su primera pantalla consumidora real y lo
cierra.

**Sin logo:** el monograma de iniciales que el componente ya trae (jamás
huella — Ley 12: la huella es de MASCOTA).

---

## 5. EL FINAL HONESTO (L-139, la parte que no se negocia)

Al aceptar con la puerta cerrada (B3 sin abrir), **la persona sigue sin
entrar a `(tabs)`.** La pantalla dice la verdad **verificable** y nada más:

```
        [ LogoNegocio ]

        Ya eres parte de Satori Latam sas.        ← VERDAD: la fila quedó activo=true

        Tu acceso al día a día del negocio
        todavía no está disponible en la app.     ← VERDAD, sin excusa ni promesa
        Te avisamos cuando lo esté.

        [ Cerrar sesión ]                          ← salida digna, jamás trampa
```

**Lo que la pantalla NO dice, a propósito:** ni *"ya puedes entrar"*, ni
*"actualiza la app"*, ni *"vuelve a iniciar sesión"* — las tres serían
promesas que la puerta niega. El estado se DICE, no se maquilla (Ley 13 +
L-139: el dictado dice la verdad y solo la verdad).

**Al reabrir la app:** la fila ya está `activo=true`, la sonda no la
encuentra (busca `activo=false`) → el invitado vuelve a caer en la rama
`sin_rol`. **Eso es un roce declarado, no un descuido:** la cura correcta
es la puerta (B3), no un parche de voz acá. Si la mesa quiere taparlo
antes de B3, la sonda tendría que mirar también filas activas — decisión de
mesa, **no la tomo yo**.

---

## 6. CONTRATO DE DATOS DE PANTALLA (M4)

Wrapper nuevo `obtenerInvitacionPendiente()` en `packages/api` — lectura RLS
pura, cero RPC:

| Campo | De dónde | Se renderiza |
|---|---|---|
| `empleadoId` | `prestador_empleados.id` | **NO** — es el argumento del RPC |
| `negocioNombre` | `prestadores.nombre_comercial` | **SÍ** (título) |
| `negocioLogo` | `prestadores.foto_url` | **SÍ** (LogoNegocio) |
| `nombreInvitado` | `prestador_empleados.nombre` | **SÍ** (línea de apoyo) |
| `invitadoEn` | `prestador_empleados.invitado_en` | **NO — descartado A PROPÓSITO** (Chanel §1.7) |

**`negocioNombre` puede venir null** si el prestador no está `activo`
(policy `prestadores_public`). Entonces la pantalla dice *"Te sumaron a un
equipo"* — **sin inventar un nombre** (L-139). Declarado, no asumido.

**N > 1** (invitado por dos negocios) es legal en el modelo. **Confirmado
contra fuente (adelanto de vara de mesa):** hoy el censo da
`count(DISTINCT prestador_id)=1` para **todos** los users con fila inactiva —
nadie está invitado por dos negocios distintos. v1 declara **orden
determinista: el vínculo MÁS ANTIGUO primero** (`invitado_en ASC`, criterio
de mesa — el primero que te sumó preside), tomando UNA fila; la lista N es
deuda con disparo (el segundo negocio real). El punto: **se DECLARA el orden,
no se descubre después** — el hermano exacto del borde `maybeSingle` de R1,
un piso más abajo.

Wrapper de acción `aceptarInvitacionEquipo(empleadoId)`: llama el RPC y **lee
el jsonb `ok:false`** — clase D-511, precedente exacto `equipo.ts:131`
(cura D-508). Rebotes tipados por literal verificado contra `prosrc`:

| literal del motor | código |
|---|---|
| `Sin sesión` | `sin_sesion` |
| `Empleado no encontrado o ya activado` | `ya_activado` |
| `No tenés permiso para aceptar esta invitación` | `no_es_tuya` |

*(El motor habla en voseo internamente — es voz de MOTOR, jamás llega al
usuario: la pantalla pone voz humana por código, Ley 3.)*

---

## 7. ESTADOS DECLARADOS (M1 los exige todos)

| Estado | Qué se ve |
|---|---|
| cargando | `Esqueleto` **estático** (Ley 13) — logo + 2 líneas + bloque |
| con invitación | la composición del §4 |
| sin invitación | **no se monta** — el guard nunca redirige (Ley 23) |
| aceptando | `Boton cargando`; la salida se apaga (anti doble-disparo) |
| aceptada | el final honesto del §5 |
| error de red | voz honesta + "Probar de nuevo" — **jamás se disfraza de vacío** (Ley 13) |
| memorial | degrada dentro de los componentes; nada que apagar acá |

---

## 8. M5 — PASADA DE DICCIONARIO

- **19.2** acción primaria → `Boton` primario bloque. UNA por pantalla ✅
- **22c** "Cerrar sesión" es comando con consecuencias → `Boton compacto`,
  jamás texto pelado ✅
- **19.7** no aplica: no hay filas ✅
- **19.6 / `PieRevelar`** no aplica: no hay sección truncada ✅
- **`EstadoVacio`** no aplica: la pantalla no se monta sin datos ✅
- **`Encabezado`** **NO se usa**: no hay atrás — no hay a dónde volver, y un
  chevron que no lleva a ningún lado es una promesa falsa (Ley 23)
- **Cola de scroll**: `insets.bottom + spacing[8]` si scrollea; el CTA fijo
  suma su altura (ley chica S70-B5)

---

## 9. LO QUE ESTE BOCETO **NO** HACE (fronteras)

- **No abre la puerta.** `(tabs)/_layout.tsx:63-65` no se toca en B1.
- **No toca motor.** Cero migración, cero RPC nueva, cero policy.
- **No cura el `anon=X`** de las tres funciones (§0) — se declara a A.
- **No cura la desalineación 5 filas / 2 invitaciones** — se declara.
- **No construye la lista N** de invitaciones múltiples — deuda con disparo.

---

## 10. LO QUE FALTA ANTES DE CONSTRUIR

1. **Vara cruzada de A (M2)** sobre este boceto — en especial el §0 (la
   premisa corregida) y el §5 (el roce declarado del reingreso).
2. **Firma de la mesa** sobre la enmienda de voz del §2 (tuteo).
3. Al construir: **M3 captura obligatoria** en el reporte + el protocolo de
   craft de 4 líneas (TESIS/FIRMA/CHANEL/TESTS §15).
