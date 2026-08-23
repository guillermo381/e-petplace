# S104-B · EL LOGIN — estado medido y dirección propuesta

**Turno de MEDICIÓN. Cero cambios.** Medido sobre el código y **sobre el objeto**
(teléfono `R5CY201ZDVL`, cliente `1.0.4` · prestador `1.0.5`, capturas en scratchpad).
Contrastado contra `DIRECCION_ARTE` y `DIRECCION_DISENO_S99`.

> ⚠️ **Corrección a lo que reporté antes:** el APK instalado **no es 1.0.3**.
> Medido con `dumpsys`: cliente `versionName=1.0.4` (instalado hoy 11:59) y
> prestador `1.0.5`. **Coinciden con `main`** ⇒ los dos SÍ pueden recibir OTA.
> Mi respuesta anterior razonó sobre el «10.0.3» del founder y no sobre el objeto.

---

## 1 · ESPACIADO — los dos botones están pegados

| dónde | valor | token |
|---|---|---|
| entre bloques del ScrollView (cliente) | `gap: spacing[2]` = **8 px** | `spacing[2]` |
| **entre «Entrar» y «¿Olvidaste…?»** | **0 px** | ninguno — son hermanos dentro del mismo `<Entrada orden={1}>`, que no aporta gap |
| **prestador, entre bloques** | `gap: spacing[6]` = **24 px** | `spacing[6]` |
| prestador, dentro de cada bloque | `gap: spacing[2]` = 8 px | `spacing[2]` |

**El que corresponde es `spacing[6]` (24) entre el formulario y la acción**, y `spacing[2]` (8) dentro de cada bloque. No hay que inventarlo: **el prestador ya lo tiene**, y su comentario (S81-C, `login.tsx:64-68`) dice literalmente por qué:

> «antes todo iba a gap uniforme [2] y el CTA quedaba pegado al último campo: nada mandaba. El aire entre bloques es la jerarquía (Ley 18).»

🔴 **El cliente es la versión ANTERIOR a esa cura.** La cura se hizo, se firmó y **nunca cruzó el espejo.**

---

## 2 · JERARQUÍA — cómo está resuelto en las dos apps

| | cliente | prestador |
|---|---|---|
| primario | `<Boton>` sin variante ⇒ **`primario`** → `accent.cta` | igual |
| secundario | **`variante="apoyada"`** → `accent.apoyada` = **superficie tonal llena + elevación** | **`variante="ghost"`** → `fondo: 'transparent'` |
| resultado en pantalla | caja lavanda llena que **compite** | **enlace de texto** |
| segunda salida | no hay | `ghost` «¿Primera vez? Crear tu cuenta» |

**La variante de enlace que existe hoy es `ghost`.** No hay que construir nada.

⚠️ **La ironía está escrita en el propio archivo:** el comentario de `login.tsx:91-94` del cliente invoca la 19.7 («el resto baja a label») **y monta `apoyada`, que es una caja llena.** El comentario dice la ley y el código la desobedece cuatro líneas abajo.

---

## 3 · EL «Ver» DEL CAMPO

Vive **dentro de `Campo`** (`components/Campo.tsx:344-355`), prop `secure`. Es un `Pressable` con `accessibilityRole="button"`, etiqueta accesible que **cambia** («Mostrar/Ocultar contraseña»), y **`hitSlop={8}`**.

- **No es texto suelto** — es control con rol y nombre.
- **Área de toque:** el texto «Ver» a `size.sm` mide ~28×18 px; con `hitSlop 8` queda ~44×34. **Ancho ok, alto por debajo de 44.** No es un fallo de a11y grave, pero no llega al target de la casa.
- **No hay glifo de ojo:** censado el registry de `Icono` — **52 glifos, ninguno es un ojo.**

---

## 4 · COMPOSICIÓN — por qué difieren

| | bienvenida | login / registro |
|---|---|---|
| contenedor | `View flex:1` con tres bloques; el del medio `flex:1 justifyContent:'center'` | `ScrollView` con `contentContainerStyle` |
| efecto | **las acciones quedan ancladas al pie** por el flex | el contenido cae desde arriba y **flota en el tercio superior** |
| pie del sistema | `paddingBottom: insets.bottom + spacing[6]` | idem, pero irrelevante: nada llega abajo |

**No es layout distinto por decisión: es falta de contenedor común.** Y el contenedor **ya existe y ninguna de las tres lo usa: `PantallaConPie`** (S100b-B) — contenido que scrollea + pie fijo que **reserva su propio alto midiéndose a sí mismo**.

---

## 5 · 🔴 TÉRMINOS Y CONSENTIMIENTO

**Confirmado navegando** (capturas 02 y 05):

| pantalla | ¿muestra términos? |
|---|---|
| bienvenida | **sí** — línea `bienvenida.legales`, texto plano, **sin links** (D-336: los documentos no existen) |
| «Crear cuenta» (cliente) | **NO** |
| «Crear cuenta» (prestador) | **NO** |

**¿Queda registrado el consentimiento?** **No, en ningún lado.**

- `registrarse()` (`wrappers/auth.ts:91`) llama `auth.signUp` y **no escribe nada más**.
- La tabla **`consentimientos` existe** (`user_id`, `tipo`, `version`, `aceptado`, `ip_hash`, `created_at`) y tiene **CERO escritores en todo el monorepo** — medido por grep.
- ⇒ **nadie aceptó nunca nada de forma registrable**, y quien entra por `/registro` ni siquiera vio la línea.

*La tabla está construida y desconectada: motor sin puerta.* Es decisión de producto/legales, no de diseño — se declara y no se cura acá.

---

## 6 · SIMETRÍA — en qué difiere el prestador

| eje | cliente | prestador | quién está bien |
|---|---|---|---|
| aire entre bloques | 8 px | **24 px** | prestador |
| secundario | `apoyada` (caja llena) | **`ghost`** (enlace) | prestador |
| marca en la pantalla | **ninguna** | **`MarcaDeAgua`** (isotipo al 4 %) | prestador |
| camino a registro desde login | **no existe** | `ghost` «¿Primera vez? Crear tu cuenta» | prestador |
| color del CTA | ocre (`accent.cta` cliente) | teal (`accent.cta` prestador) | los dos, por `§15b.1` |
| términos en registro | no | no | ninguno |

🔴 **`MarcaDeAgua` tiene 70 consumidores en prestador y UNO solo en cliente** (`recuperar.tsx`). **Ésa es la causa medida de «parecen de otro producto»** — no el color del botón.

---

## 7 · EL AMARILLO — respuesta exacta

**No son dos componentes ni un token distinto. Es el MISMO `Boton` con dos variantes, y lo que el founder vio primero era el estado APAGADO.**

| pantalla | variante | fondo |
|---|---|---|
| bienvenida · «Crear cuenta» | `marca` | gradiente de marca |
| login · «Entrar» | *(sin declarar)* ⇒ **`primario`** | `accent.cta` = `palette.ctaOro` |

Con los campos vacíos, `Boton` aplica `opacity.disabled = 0.45` ⇒ **el ocre saturado se lava y se lee como «amarillo pálido»**. Llené los campos en el aparato y el CTA pasó a **ocre pleno con letra tinta** (captura 04).

⚠️ **Y el ocre es LA LEY, no un desvío:** `N26` firma *ocre = lo que ACCIONA*, y `N26.1` firma su forma — **relleno ocre + letra tinta (contraste 9,96)**, prohibiendo el ocre como tinta. **La propuesta NO debe cambiar el CTA a gradiente**: eso rompería N26 y la dosis de Ley 4.

---

## 8 · LAS CINCO INTENCIONES DE LA REFERENCIA

| # | intención | ¿existe? | veredicto |
|---|---|---|---|
| 1 | **label flotante animado al enfocar** | — | 🔴 **CHOCA CON LETRA FIRMADA.** `N11′` (17-ago, firma del founder) manda: *la etiqueta va AFUERA Y ARRIBA, siempre visible, **jamás cambia de tamaño ni de color por foco***. Se reabrió una vez con evidencia y se sostuvo. **No se construye sin reabrir N11′** |
| 2 | **ojo en vez de «Ver»** | **no** | Construir. `Campo` ya tiene el slot y la a11y; falta el glifo — y `DIRECCION_ARTE §6b` exige hoja de contacto (2-3 variantes) + **gate POR ÍCONO del founder a 21 px** |
| 3 | **primario lleno / secundario enlace** | **sí** | `primario` + `ghost`. **Cero construcción** — el prestador ya lo hace |
| 4 | **movimiento sutil de fondo** | **parcial** | `Atmosfera` existe (RadialGradient de `react-native-svg`, cero deps nuevas) pero es **DARK-ONLY por firma del founder (S83)** y estas pantallas se ven en claro. Ver costo abajo |
| 5 | **validación en vivo del email, mensaje bajo el campo** | **sí** | `Campo.error` + `PieDeCampo` (alto reservado, `liveRegion`). ⚠️ `N12.3` firma **validar al SALIR del campo, jamás al enviar** — no en cada tecla |

### El movimiento, con su costo medido antes de proponerlo

**Propongo lo más barato que ya existe y NO es un canvas de partículas:**

1. **`MarcaDeAgua`** — isotipo estático al 4 %. **Costo: 0 frames.** Es un SVG quieto. Es lo que el prestador ya usa en sus 70 pantallas.
2. **`Entrada`** escalonada, ya montada en las dos pantallas. **Costo: 2 valores animados por bloque, 300 ms, una sola vez.**
3. *(opcional, si el founder quiere movimiento continuo)* una deriva **muy lenta** del isotipo de fondo: **UN `withRepeat(withTiming(...))` sobre UN `translateY` de ±6 px, ~12 s, en el hilo de UI.** Costo ≈ el de `EsperaDeMarca`, que ya corre en el carnet.

🔴 **Lo que NO propongo y por qué:** gradiente animado de fondo. `LinearGradient` **no interpola en el hilo de UI** — animarlo obliga a re-render por frame en JS. Es exactamente el costo que `N15`/`N16` prohíben.

---

## 9 · EL NOMBRE — censo

| variante | dónde | cuántas |
|---|---|---|
| **`e.petplace`** | `bienvenida.tsx:59` — **el wordmark en pantalla** | **1** |
| **`e-PetPlace`** | i18n: cliente `es` 12 · `en` 12 · prestador `es` 37 · `en` 34 | **95** |
| **`ePetPlace`** | `apps/cliente/app.json` → `"name"` (**el launcher**) · `proxPrime` es/en | **3** |
| **`e-PetPlace Negocios`** | `apps/prestador/app.json` → `"name"` | 1 |

⇒ **TRES variantes vivas de cara al usuario.** La más rara —`e.petplace` con punto— es **la única que el usuario ve como wordmark**, y aparece **una sola vez**: en la primera pantalla de la app. Las 95 del cuerpo dicen `e-PetPlace`.

*(No entra al censo: `com.epetplace.*` (package, jamás se toca — D-752), `@epetplace/*` (paquetes), `epetplaceFonts`, claves de AsyncStorage, dominios.)*

**Decisión del founder.** Nota de costo: cambiar `app.json → name` **no** toca el bundle id ⇒ es barato. Cambiar el wordmark es una línea.

---

## 10 · LA DIRECCIÓN PROPUESTA (una sola, para las dos pantallas)

> **«Login y registro dejan de ser formularios y pasan a ser la segunda habitación de bienvenida.»**

**El principio:** no se inventa lenguaje nuevo. **Se adopta el del prestador, que ya cumple la ley, y se le suma la marca que bienvenida ya tiene.** Cero componentes nuevos salvo el glifo del ojo.

### Wireframe descrito — «Iniciar sesión»

```
┌─────────────────────────────────────────┐
│  ‹        Iniciar sesión                │   Encabezado navegacion (igual)
│                                         │
│        ·  MarcaDeAgua detrás  ·         │   isotipo 4%, quieto — la marca
│                                         │   entra sin ocupar lugar
│   Email                                 │   etiqueta AFUERA (N11′), tamaño fijo
│   ┌───────────────────────────────────┐ │
│   │ ej: ana@correo.com                │ │   Campo, contorno ≥3:1
│   └───────────────────────────────────┘ │
│   ⌐ mensaje al SALIR del campo (N12.3)  │   PieDeCampo, alto reservado
│                                         │
│              ↕ spacing[6] = 24          │   ← el aire que hoy falta
│   Contraseña                            │
│   ┌───────────────────────────────┬───┐ │
│   │ ••••••••                      │ 👁 │ │   glifo ojo, target 44 (hoy «Ver»)
│   └───────────────────────────────┴───┘ │
│                                         │
│                                         │
│   ═══════ (el contenido scrollea) ═════ │
├─────────────────────────────────────────┤
│   ┌───────────────────────────────────┐ │   ← PantallaConPie: el pie RESERVA
│   │        Entrar        (ocre)       │ │      su alto. Ancla como bienvenida
│   └───────────────────────────────────┘ │      ocre relleno + letra tinta (N26.1)
│         ¿Olvidaste tu contraseña?       │   ghost — enlace, sin caja
│         ¿Primera vez? Crear tu cuenta   │   ghost — la salida que hoy NO existe
└─────────────────────────────────────────┘
```

### «Crear cuenta» — el mismo esqueleto, tres cambios

1. Tres campos con el mismo ritmo (24 entre campos, etiqueta afuera).
2. Pie anclado: «Crear mi cuenta» (ocre) + `ghost` «Ya tengo cuenta».
3. 🔴 **La línea de términos, que hoy no está** — misma voz que bienvenida, bajo el CTA.

### Las siete decisiones, con su ley

| # | decisión | ley |
|---|---|---|
| 1 | aire 24 entre bloques, 8 dentro | Ley 18 · el prestador (S81-C) |
| 2 | secundarios a `ghost` | 19.7 · Ley 22c |
| 3 | acciones ancladas al pie con `PantallaConPie` | espeja bienvenida |
| 4 | `MarcaDeAgua` detrás | lo que hace que se sienta la misma marca |
| 5 | **el CTA SIGUE OCRE** | **N26 + N26.1** — no se toca |
| 6 | etiqueta afuera, tamaño fijo | **N11′ — mata el label flotante de la referencia** |
| 7 | términos en registro | cierra el hueco de §5 |

### Lo que esta dirección NO resuelve y hay que decir

- **El consentimiento sigue sin registrarse.** Poner la línea es diseño; escribir en `consentimientos` es motor y es de otra pista.
- **El glifo del ojo necesita su gate por ícono** (§6.2 de `DIRECCION_ARTE`): si el founder no lo firma, «Ver» se queda y no pasa nada malo.
- **El nombre no se toca** hasta que el founder elija variante.

---

## Frenos

- **No cerré la sesión del founder** para llegar a estas pantallas: deep link.
- Tipeé credenciales falsas para revelar el CTA habilitado. **Nada enviado.** Campos limpiados.
- Cero cambios, cero build, cero deploy. La propuesta espera gate.
