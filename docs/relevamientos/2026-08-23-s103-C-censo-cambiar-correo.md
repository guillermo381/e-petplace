# S103-C · CENSO: CAMBIAR EL CORREO — medición, sin construir

> **Orden de mesa:** *«el correo es la llave de la cuenta y su cambio es
> materia de seguridad, no de perfil»*. **La forma la decide la mesa con el
> founder.** Acá solo se mide.

---

## 🔴 EL HALLAZGO QUE CAMBIA LA NATURALEZA DEL PEDIDO

**No es «falta una pantalla». Hay DOS fuentes de verdad para el correo, y la
copia GANA.**

`packages/api/src/wrappers/miPerfil.ts:29-37` — literal:

```ts
.from('profiles').select('nombre, email, telefono, foto_url')
…
email: data?.email ?? sesion.session?.user.email ?? null,
```

**`profiles.email` se lee PRIMERO** y `auth.users.email` es solo el fallback.

⇒ **Si alguien cambiara el correo por Supabase Auth hoy, seis pantallas
seguirían mostrando el viejo** — porque la copia gana. Medido, los seis
consumidores de `obtenerMiPerfil`:

| app | pantalla |
|---|---|
| cliente | `hogar/index` · `cuenta/perfil` · `despensa/checkout` |
| prestador | `bienvenida-dia1` · `(tabs)/index` · `cuenta/seguridad` |

**Y nadie escribe `profiles.email` desde la app** (medido: cero `update`/
`upsert` sobre esa columna en todo `packages/api`). *O sea que la copia se
puebla en el alta y después nadie la vuelve a tocar: hoy no diverge porque
nada la puede cambiar. **El día que exista el cambio, diverge.***

> ⚠️ **Esto convierte el pedido de «pantalla» a «motor + pantalla», y es lo
> primero que la mesa tiene que saber:** una pantalla que llame a
> `updateUser({ email })` y nada más **dejaría la app mostrando el correo
> viejo con el login funcionando con el nuevo.** *Los dos correctos por
> separado, el conjunto mintiendo.*

---

## ① QUÉ HAY HOY

**Nada, en ninguna de las dos apps.** Medido: cero `cambiarEmail`,
`cambiarCorreo`, `updateUser({ email })` o equivalente en `apps/` y en
`packages/api/src`.

**Lo que hay es la voz que lo dice:** `emailAyuda` = *«El email no se cambia
desde acá todavía.»*, **en las dos apps** (`cliente/i18n/es.ts:1376` ·
`prestador/i18n/es.ts:847`), sobre un campo deshabilitado en Tu perfil.
*La ausencia está declarada, no escondida — el «todavía» es una promesa
abierta desde S55.*

## ② EL MOTOR — ¿lo cubre Supabase Auth?

**Sí: `auth.updateUser({ email })` existe y es el mismo método que el wrapper
ya usa para `password`** (`seguridad.ts:220` y `:373`). **No hay que construir
motor de Auth.**

### 🔴 La confirmación: la pregunta de la mesa tiene respuesta MEDIDA A MEDIAS

`supabase/config.toml:224` → **`double_confirm_changes = true`**, que significa
*«se confirma en el correo VIEJO y en el NUEVO»*.

⚠️ **Pero ese valor NO prueba nada sobre producción**, y el canon ya se
cobró esta confusión: **`config.toml` es del entorno LOCAL, no del proyecto
remoto** (límite escrito en S84, re-medido en S92-BIS con `D-716`, donde las
perillas reales resultaron ser del dashboard).

⇒ **Qué falta medir, y es de A o del founder:** el valor **real** de
`Secure email change` en el dashboard del proyecto `zyltipqscdsdsxnjclhp`.
*Con doble confirmación el cambio es seguro por construcción; sin ella, quien
tome un teléfono desbloqueado se lleva la cuenta entera cambiando el correo y
pidiendo recuperación.*

## ③ LA CUENTA SOLO-GOOGLE — la pregunta que la mesa hizo bien

**Sin medición propia, y se declara:** no probé `updateUser({ email })` sobre
una identidad OAuth. **Lo que sí está medido en el canon:** hay **ocho cuentas
solo-Google** y su rasgo es que **no tienen contraseña** (`sin_contrasena`, el
código que `cambiarContrasena` devuelve y que esta pista ya cablea).

**La pregunta abierta que hay que contestar antes de diseñar:** si a una
cuenta cuyo login es Google se le cambia el correo, **¿sigue pudiendo entrar
por Google?** El proveedor identifica por su propio `sub`, no por el correo —
así que *plausiblemente sí*, pero **plausible no es medido**, y equivocarse
acá deja a alguien afuera de su cuenta. **Es un ensayo de A contra una cuenta
de prueba, no una lectura de documentación.**

## ④ QUÉ PANTALLA HARÍA FALTA

**Ninguna nueva: es una sección de `cuenta/seguridad`**, por la razón que la
mesa ya dio — *el correo es la llave, no un dato de perfil*. Y hay precedente
en la casa: **la de seguridad del prestador ya tiene el correo ahí**, aunque
hoy solo-lectura.

**La anatomía que el patrón vigente ya dicta**, sin inventar nada:
① pedir la **contraseña actual** (re-autenticar, igual que el cambio de clave
— *un teléfono desbloqueado no debería alcanzar para llevarse la cuenta*) ·
② el correo nuevo · ③ **decir que hay que confirmar en los DOS correos** si
④ resulta cierto · ④ un estado **«cambio pendiente de confirmación»**, que hoy
no existe en ninguna pantalla.

⚠️ **El estado pendiente es el que no tiene molde:** entre que se pide el
cambio y se confirma, **el correo mostrado sigue siendo el viejo y es
correcto**. *Sin ese estado dibujado, la persona toca «cambiar», ve el correo
de siempre y cree que falló.*

## ⑤ EL REPARTO — qué es de A y qué es mío

| | |
|---|---|
| **A (motor)** | ⓐ **medir el valor real de `Secure email change` en el dashboard** · ⓑ **decidir qué pasa con `profiles.email`** (¿trigger que sincroniza? ¿se retira la columna y todo lee de Auth?) · ⓒ el wrapper `cambiarEmail` con sus códigos tipados · ⓓ **el ensayo con una cuenta solo-Google** |
| **C (superficie)** | la sección en `cuenta/seguridad`, sus voces es/en, **el estado pendiente**, y la muerte de `emailAyuda` en las dos apps |
| **La mesa** | si el cambio exige contraseña actual · qué pasa con las cuentas solo-Google (¿se les ofrece? ¿se les pide crear clave primero?) · si el correo viejo conserva algún derecho tras el cambio |

🔴 **Y el orden importa: ⓑ va ANTES que la pantalla.** *Construir la
superficie sobre dos fuentes de verdad produce el defecto peor de todos —
uno que solo aparece después de que alguien real cambió su correo.*

---

## LO QUE ESTE CENSO NO MIDIÓ, declarado

- **El comportamiento real de Auth**: no se llamó `updateUser({ email })` ni
  una vez. *Todo lo de ② y ③ es lectura de código y de config, no ensayo.*
- **Qué correo reciben los avisos** (push/WhatsApp/email transaccional) y si
  alguno lee `profiles.email` en vez de Auth. **Es de A** y **puede agregar
  consumidores a la lista de seis.**
- **El dashboard**: no tengo acceso y no lo inventé.
