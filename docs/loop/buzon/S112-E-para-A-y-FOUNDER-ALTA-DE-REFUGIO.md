# BUZÓN · S112-E → A y FOUNDER · ⑤ CÓMO SE CREA HOY UNA CUENTA DE REFUGIO

> **CONTRA QUÉ Y CUÁNDO.** Contra el **OBJETO** (DB linkeada) y contra `main`
> = **`978666bd`**, el **1-sep-2026, 22:10 -05**. Cero escritura: no creé
> ninguna cuenta, sólo leí puertas y cuerpos completos de funciones.

---

## ⓪ LA RESPUESTA EN TRES LÍNEAS

- **Pedir** ser refugio: **hay puerta** (`solicitar_naturaleza_comercial`
  acepta el enum entero, `refugio` incluido).
- **Conceder** ser refugio: **NO hay puerta.** Ninguna función escribe
  `cuenta_roles` con `tipo_actor='refugio'`. **Sólo un INSERT a mano.**
- **Entrar** a la app de negocios siendo refugio: **no se puede.** El gate del
  arranque tiene tres llaves —prestador activo · vendedora · repartidor— y
  **ninguna es refugio**.

---

## ① LOS TRES ACTOS DEL ALTA, Y QUÉ PUERTA TIENE CADA UNO

| acto | puerta | quién |
|---|---|---|
| **1. La persona** (usuario `auth` + `profiles`) | ✅ `registrarse({contexto:'registro_profesional'})` desde `/registro` de la app de negocios | la persona sola |
| **2. La cuenta comercial** (`cuentas_comerciales`) | ✅ `crear_cuenta_comercial_inicial` — pantalla `/cuenta-comercial/nueva` | el dueño, **pero ver ④: no puede llegar a esa pantalla** |
| **3. El rol `refugio`** (`cuenta_roles`) | 🔴 **NINGUNA.** Censadas **las 4 funciones que insertan en `cuenta_roles`**: `crear_prestador_inicial` · `invitar_prestador` · `otorgar_rol_vendedor` · (`crear_cuenta_comercial_inicial` sólo escribe la cuenta). **Las tres primeras escriben `prestador_servicios`; la tercera tiene `'seller_productos'` literal en su INSERT.** Cero funciones escriben `'refugio'` | **nadie — INSERT a mano** |

**Lo que sí existe y conviene no confundir con una puerta:**
`solicitar_naturaleza_comercial(cuenta, tipo_actor)` **acepta `refugio`** — su
vocabulario es el enum (`p_tipo_actor::tipo_actor_enum`), no una lista blanca.
Pero **sólo escribe `cuentas_comerciales.naturalezas_solicitadas`**: es un
pedido, no una concesión. Su gemela que concede existe **para vendedor y para
nadie más** (`otorgar_rol_vendedor`, `is_admin()` obligatorio).

⚠️ **Y del lado de la app, la naturaleza `refugio` es inexpresable aunque el
motor la acepte:** el tipo del wrapper es
`export type NaturalezaComercial = 'prestador_servicios' | 'seller_productos'`
(`packages/api/.../cuentaComercial.ts`), así que **pedir `refugio` desde una
pantalla no compila**.

---

## ② QUÉ CAMPOS EXIGE — y cuáles NO pide nadie

`crear_cuenta_comercial_inicial` valida, en este orden (cuerpo completo leído):

| campo | regla medida |
|---|---|
| `country_code` | debe existir en `cat_paises` y estar `activo`. **EC: activo, moneda USD** |
| `tipo_fiscal` | debe estar en `cat_paises.tipos_fiscales_soportados`. **EC soporta los cuatro**: `persona_natural · persona_natural_obligada · persona_juridica · entidad_sin_fines_lucro` |
| `identificacion_fiscal` | debe pasar la **máscara del país por tipo**: EC → `persona_natural` `^\d{10}$` (cédula) · **`entidad_sin_fines_lucro` `^\d{13}$`** (RUC). Y no puede estar repetida en el país |
| `razon_social` | obligatoria, no vacía |
| `nombre_comercial` | obligatorio, no vacío |

**Lo que NO pide, y son cinco de las variables del acta:** representante legal ·
su cédula · **acuerdo de personalidad jurídica** · REMETFU · y **ninguna
distinción organización/rescatista más allá del `tipo_fiscal`**.

✅ **La buena noticia medida: el eje organización/rescatista YA es expresable
sin construir nada** — `entidad_sin_fines_lucro` (RUC 13) para la organización
del `[[si refugio es organización]]` del acta, `persona_natural` (cédula 10)
para el rescatista independiente. **El `{{refugio_acuerdo}}` sigue sin lugar**
(censo ① del acta).

La cuenta **nace `pendiente_validacion`** con `datos_bancarios {}` y
`metadata {"created_via":"wizard"}`. **El wizard jamás activa** — activar es
acto de admin.

---

## ③ QUÉ LA HACE «REFUGIO» A LOS OJOS DE CADA LECTOR

**`publicar_adoptable`** → llama `_user_gestiona_cuenta_refugio(cuenta)`, que
es **exactamente dos condiciones**:

```
_user_opera_cuenta_comercial(cuenta, auth.uid())          -- owner de la cuenta
                                                           -- O empleado activo de un
                                                           --   prestador de esa cuenta
AND EXISTS (cuenta_roles WHERE tipo_actor='refugio' AND estado='activo')
```

⚠️ **Dos cosas que NO mira, medidas leyendo el cuerpo:**
① **no mira `cuentas_comerciales.estado`** — una cuenta `pendiente_validacion`
con el rol activo **publica igual**; ② no mira ningún documento aceptado.

**`obtener_mi_cuenta_refugio`** (la que C espera) → 🔴 **NO EXISTE.** Censadas
las funciones con `cuenta_refugio`/`mi_cuenta`/`cuenta_comercial` en el nombre:
las seis que hay son `_cuenta_comercial_tiene_uso`,
`_user_gestiona_cuenta_refugio`, `_user_opera_cuenta_comercial`,
`_validar_ownership_cuenta_comercial`, `actualizar_nombre_cuenta_comercial` y
`crear_cuenta_comercial_inicial`.

⚠️ **Y el lector que C podría querer usar en su lugar tampoco sirve:**
`obtener_naturalezas_de_cuenta` hace `CROSS JOIN unnest(ARRAY['prestador_servicios','seller_productos'])`
— **un array literal de dos**. Aunque el rol `refugio` exista y esté activo,
**ese lector devuelve dos filas y ninguna lo nombra.** *No diría «ninguna» por
error: diría dos naturalezas y el refugio no sería una de ellas.*

---

## ④ EL LOGIN Y LAS TABS: QUÉ VE HOY

**Login:** `/login` de la app de negocios, `iniciarSesion({email, password})`.
**No gatea por rol** — cualquier usuario `auth` entra. El gate vive **después**,
en `(tabs)/_layout.tsx`, y lo resuelve **una sola RPC**:
`obtener_contexto_arranque`.

**Medido sobre el cuerpo completo (4 757 caracteres): la palabra `refugio` no
aparece ni una vez.** Lo que devuelve es `prestador · es_gestor · posicion ·
oficios_locales · cuenta_comercial · es_vendedora · ha_vendido ·
venta_mostrador_activa · moneda · repartidor_de`. **No hay `es_refugio`.**

Las ramas del gate, en orden:

1. `prestador !== null` **y** `prestador.estado === 'activo'` → **entra a las
   tabs**.
2. invitación de equipo pendiente → `/invitacion`.
3. `es_vendedora` (rol `seller_productos` activo, **literal en la RPC**) →
   `/ventas`.
4. **todo lo demás → `sin_rol`.**

⇒ **Una cuenta de refugio cae en la rama 4** (no tiene fila en `prestadores`,
no es vendedora). Y lo que lee, literal del diccionario:

> **«Tu cuenta no tiene un negocio asociado»**
> *«Entraste como {email}. Si trabajas en un negocio que usa e-PetPlace, pídele
> a quien lo administra que te invite con ese correo — la invitación te aparece
> acá.»*

**La única acción de esa pantalla es «Cerrar sesión».** *El primer refugio real
entraría con su cuenta creada, su rol activo y su animal publicable, y la app
le diría que no tiene negocio y le ofrecería irse.*

⚠️ **Y ahí está el lazo que cierra el círculo:** la pantalla que crea la cuenta
comercial (`/cuenta-comercial/nueva`) la linkean **sólo dos** —
`/cuenta-comercial` (index) y `/verificacion/alta`— y **las cinco entradas a
esas dos, censadas una por una**, son: la tab **Cuenta** (`cuenta/index.tsx:435`),
la tab **Negocio** (`negocio.tsx:720`), **Liquidaciones**, **ventas/tienda** y
**la sala de espera** (`sala-espera.tsx:220`). Las cuatro primeras viven detrás
de las tabs; **la quinta exige una fila en `prestadores` en estado no-activo**,
que un refugio tampoco tiene. ⇒ **para llegar a la pantalla que te da negocio
hay que tener negocio** — y la sala de espera, que es la única puerta pensada
para el que todavía no entró, **tampoco alcanza a un refugio.**
*(Nota honesta: la ruta vive FUERA del grupo `(tabs)`, así que en web es
alcanzable escribiendo la URL. Ningún botón lleva.)*

---

## ⑤ EL DOCUMENTO QUE ACEPTARÍA, Y NO ES EL SUYO

`/registro` de la app de negocios manda `contexto: 'registro_profesional'`, y
ese contexto resuelve —medido en `packages/api/.../auth.ts:270`— a
**`terminos_professional` v1.0** (`epetplace.com/terminos-profesional/1-0`).

**El refugio quedaría registrado aceptando los Términos de Usuario
Profesional** — el documento que **`terminos_refugio` §1.2 dice expresamente
que NO rige su cuenta** (*«No regulan … la prestación de servicios remunerados,
que se rige por los Términos y Condiciones — Usuario Profesional»*).
Y sus propios términos **no tienen dónde aceptarse**: `consentimientos.tipo`
es un CHECK cerrado de 7 valores sin ninguno de adopción, y no existe tabla de
aceptaciones de `adopcion_documentos` (cero FKs apuntan a ella).

⇒ **acepta el documento equivocado, y el suyo no tiene puerta.** Nombro las dos:
el `CASE` de `auth.ts:270` y el CHECK `consentimientos_tipo_check`.

---

## ⑥ LOS PASOS EXACTOS PARA CREAR LA PRIMERA CUENTA DE PRUEBA MAÑANA

**Lo que se puede hacer por la app, y lo que exige SQL, separado a propósito.**

| # | paso | cómo, hoy |
|---|---|---|
| 1 | **La persona** | 📱 **App de negocios → `/registro`**: nombre, correo, clave. Queda con consentimiento `terminos_professional` (⑤). |
| 2 | **La cuenta comercial** | ⚠️ **La RPC existe y la pantalla también, pero no hay camino hasta ella.** Dos formas reales: (a) 📱 **web de la app** entrando a `/cuenta-comercial/nueva` por URL; (b) 🗄️ **SQL**: `crear_cuenta_comercial_inicial` como ese usuario, o INSERT directo. **Datos mínimos para EC:** `country_code='EC'`, `tipo_fiscal='entidad_sin_fines_lucro'` + RUC de **13 dígitos** (organización) **o** `'persona_natural'` + cédula de **10** (rescatista), `razon_social`, `nombre_comercial`. |
| 3 | **El rol `refugio`** | 🗄️ **SQL a mano, obligatorio — no existe otra puerta.** `INSERT INTO cuenta_roles (cuenta_comercial_id, tipo_actor, estado, activado_en) VALUES (…, 'refugio', 'activo', now())`. Hay UNIQUE `(cuenta_comercial_id, tipo_actor)`, así que es idempotente con `ON CONFLICT`. |
| 4 | **¿Activar la cuenta?** | **No hace falta para publicar** (③: `_user_gestiona_cuenta_refugio` no mira el estado de la cuenta). **Sí conviene decidirlo a propósito**, porque `pendiente_validacion` es el estado que el resto de la casa lee como «todavía no». |
| 5 | **El animal** | 🗄️ La mascota necesita **`familia_id` no nulo** — `publicar_adoptable` rebota `mascota_sin_familia`. §0: el refugio ES la familia hasta la entrega, así que hace falta una `familia` del refugio y la mascota adentro. |
| 6 | **Publicar** | ✅ **Por RPC funciona** con la sesión del dueño de la cuenta: `publicar_adoptable(mascota, cuenta)`. **Verificado hoy en rojo por camino real**: con una cuenta sin el rol, rebota `no_sos_cuenta_de_refugio`. |
| 7 | **Usarlo desde la app** | 🔴 **No se puede.** Rama 4 del gate (④). El recorrido de mañana **es por RPC, y eso mide el motor — no mide que una pantalla lo llame bien.** |

---

## ⑦ LA PUERTA QUE EXISTE Y LA QUE FALTA, EN UNA TABLA

| pieza | estado |
|---|---|
| pedir la naturaleza `refugio` | ✅ motor (`solicitar_naturaleza_comercial`) · 🔴 **inexpresable desde la app** (tipo del wrapper cerrado a dos) |
| **conceder el rol `refugio`** | 🔴 **no existe función** — el gemelo de `otorgar_rol_vendedor` para refugio |
| **`obtener_mi_cuenta_refugio`** (la que C espera) | 🔴 **no existe** — y `obtener_naturalezas_de_cuenta` no la reemplaza: su array es literal de dos |
| **rama de refugio en el arranque** | 🔴 **no existe** — `obtener_contexto_arranque` no nombra `refugio` en 4 757 caracteres |
| **tabs del refugio** | 🔴 no existen — y las cuatro RPC del refugio siguen con **cero consumidores** en `apps/` |
| identidad organización/rescatista | ✅ **ya expresable** con `tipo_fiscal` (EC soporta los cuatro) |
| representante · cédula · acuerdo · REMETFU | 🔴 ningún campo los pide (censo ① del acta) |
| documento que el refugio acepta | 🔴 hoy sería `terminos_professional`; `terminos_refugio` no tiene registro de aceptación |
