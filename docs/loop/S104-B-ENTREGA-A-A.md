# S104-B · ENTREGA A LA PISTA A — tanda 1, lista para merge

**Rama:** `pista/s104-b` · **commit:** `4b7147c2` · **nace de** `main` @ `bb215dfc`
**Verificado por SHA** (L-239): local == `origin/pista/s104-b` == `4b7147c2…`

---

## Gates corridos

| gate | resultado |
|---|---|
| `verify:diseno` | **VERDE con 54 reglas** (nace **R63**) · auto-prueba 54 encendieron · informativas: R9 |
| typecheck `packages/ui` | VERDE |
| typecheck `packages/api` | VERDE |
| typecheck `apps/cliente` | VERDE |
| typecheck `apps/prestador` | VERDE |
| hook de pre-commit | verde (corrió solo al commitear) |

⚠️ **Los typechecks de las apps ahora SÍ miden rutas.** Antes de esta tanda, en un
worktree nuevo `.expo/types/router.d.ts` no existe y `Href` degrada a `string` —
mi primer typecheck del cliente salió verde **sin medir una sola ruta**. Lo cazó
R63 (brazo C), no yo.

## 13 archivos

| territorio | archivos |
|---|---|
| **B (mío)** | `packages/ui/src/components/{Icono,Campo}.tsx` · `caja-de-campo.ts` · `brand/{PaseoDeHuellas,RitualDeEntrada}.tsx` · `index.ts` · `gallery/TokenGallery.tsx` · `scripts/verify-diseno.mjs` |
| 🔴 **C (cruzado con orden explícita)** | `apps/cliente/src/app/{login,registro,recuperar}.tsx` |
| docs | `docs/loop/S104-B.md` · `S104-B-LOGIN.md` · este archivo |

🔴 **EL CRUCE DE TERRITORIO, DECLARADO:** `apps/cliente` es de **C**, no de B. El
founder me lo ordenó explícitamente («la cura del cliente al lenguaje del
prestador»). **Lo hice y lo declaro en vez de disimularlo** — C tiene que saber
que sus tres pantallas del arco de entrada cambiaron de mano por una tanda.
Ninguna toca lógica: solo composición, variante de botón e import.

---

## ✅ La letra llegó DESPUÉS del build — contraste hecho

`RITUAL_DE_ENTRADA.md` (depositado por A) **confirma las tres piezas casi al
detalle**: §2.1 el respiro 1.0→1.03→1.0 en 520 · §2.2 el paseo tinta 8-10 %,
escalón 120, diagonal, queda como textura familia `MarcaDeAgua`, opacity, hilo
de UI · §4 tapiz + `MarcaDeAgua` + N11′ + foco tinta plena +1pt 150ms + ojo +
`ghost` + `spacing[6]` · §6 reduce-motion con el paseo YA TRAZADO. *Construir
contra el literal de la orden mientras la letra no viajaba resultó ser lo
correcto — pero eso se supo después, no antes.*

**Aplicado al leerla:** §2.4 dicta *«Ya tengo cuenta en `ghost`»* ⇒ se bajó en
`bienvenida.tsx`. **Eso cierra por letra el gate pendiente de `sinCaja` desde
S82-B r5** (esa pantalla era su única consumidora) y **baja el trinquete de
`R48` de 5 a 4**, que es solo-baja.

### 🔴 UNA CONTRADICCIÓN REAL, sin resolver por mí

**§5 pide «~400ms» para la huella de llegada, y §7 afirma que *«cada número de
este documento ya estaba firmado en el canon»*. Esa afirmación es FALSA para
ese número:** 400 no pertenece al vocabulario cerrado de N10 (150 · 300 · 520)
— es un `legacy_` congelado por **R51**, que rechazó mi primer intento.

**Queda en 300 y se reporta.** *Bajar un juez mecanizado para acomodar un
número que la letra cree canónico y no lo es sería al revés: el instrumento
está bien y la letra tiene un dato que nadie verificó.* **Lo arbitra la mesa:**
o N10 gana su cuarto valor, o §5 baja a 300 / sube a 520.

### Lo que la letra pide y esta tanda NO trae (tanda 2)

§2 y §3 enteros: el travelling splash→bienvenida→puerta, el isotipo que viaja a
la esquina, el paseo que **persiste entre pantallas**. Es composición y llegó
con la letra. · §5 el «Pegar» de `recuperar` — medido: `getStringAsync` tiene
**cero usos en el monorepo**. · §1 el splash nuevo, que es **build y no OTA**.

---

## 🔴 Lo que la mesa tiene que arbitrar (no lo resuelve esta tanda)

1. **El foco del campo choca contra letra firmada.** La orden pide *tinta plena
   +1pt*; hasta hoy el contorno enfocado tomaba `accent.active` por **Ley 5** y
   por el sexto slot de **S83-B13**. **Se aplicó la orden y se declaró la
   enmienda de hecho** en `caja-de-campo.ts`. *Ley 5 queda enmendada sin que
   nadie la haya enmendado* — eso lo firma la mesa.
   **Alcance real:** toca `Campo`, `CampoFecha` y `CampoCodigo` en **las dos
   apps** (una definición, tres piezas). Y en el cliente el magenta del foco era
   **el único `accent.active` de todo el arco de entrada**.
2. **`RITUAL_DE_ENTRADA.md` nunca llegó** (freno L-142). Las tres piezas están
   armadas y **sin cablear**: la FÍSICA salió del literal de la orden, la
   COMPOSICIÓN la dice la letra. Si la letra contradice algo, gana la letra.
3. **El gate por ícono del ojo está PENDIENTE** (§2.9): sin hoja de contacto de
   2-3 variantes, que es lo que `DIRECCION_ARTE` §6b pide. Atajo tomado por
   orden explícita del founder («elegí vos; el founder corrige después»).
4. **El `~400` de la orden quedó en 300.** No lo decidí yo: lo rechazó **R51**
   (vocabulario cerrado de N10). Si al founder le resulta corto, la salida es
   subir a `grande` (520) o enmendar N10 — **jamás teclear 400**.

## Numeración usada

- **R63** — la primera regla libre medida contra el objeto. `R62` era la última.
- **Cero fichas D-NNN nuevas.** Lo que queda abierto son los cuatro puntos de
  arriba, y todos tienen dueño (mesa / founder), no deuda de trabajo.
- **Cero migraciones, cero SQL, cero tipos regenerados.**

## Lo que NO hice, y por qué

- **No toqué `bienvenida.tsx`.** Su `variante="sinCaja"` es **la pantalla del
  gate** de esa variante (S82-B r5, esperando firma). Bajarla a `ghost` habría
  matado un gate pendiente sin que nadie lo pidiera.
- **No agregué «crear cuenta» al login del cliente** (el prestador lo tiene). Es
  navegación nueva, no estaba en la orden.
- **No borré `campo.ver` / `campo.ocultar`** del diccionario de `packages/ui`,
  que quedaron sin consumidor: es una pasada de Ley 37 con su grep, no un
  arrastre de esta tanda.
- **No publiqué OTA.** La veda es de la mesa (regla 82); el ancla la pide quien
  publica.

## Para el gate en dispositivo

Todo lo visual es JS puro ⇒ **viaja por OTA** (L-134: cero dependencias nuevas).
Las tres piezas del ritual se miran en **`/gallery`** — la sección
«S104 · EL RITUAL DE ENTRADA» existe porque **R17 la exigió** con su literal:
*«una pieza que nadie puede mirar no se puede firmar»*.
Y medido hoy sobre el aparato del founder: cliente **1.0.4**, prestador
**1.0.5**, los dos coinciden con `main` ⇒ **reciben OTA sin reinstalar**.
