# S73-A · CENSO DEL TECLADO — lado CLIENTE (D-498)

> **Método y límite, declarados:** censo ESTÁTICO por pantalla (dónde vive
> cada `Campo`, quién maneja el teclado, config nativa) + veredicto de
> riesgo. **El veredicto final es de DISPOSITIVO**: el render web no tiene
> teclado blando — no puedo producir la captura CON teclado (ley candidata
> #2) desde este harness, y **curar a ciegas fabricaría verosímil-falso**
> (un KAV mal puesto rompe layouts que hoy funcionan). Por eso este censo
> clasifica y propone el patrón; ejecuta CERO curas. B compara patrón por
> mano del founder.

## 0 · La config nativa (ambas apps, literal)

**Ninguna app fija `android.softwareKeyboardLayoutMode`** (`app.json` de
cliente y prestador relevados) → rige el default de Expo: **`resize`** (la
ventana se achica con el teclado). Con resize, el OS suele auto-scrollear
el TextInput enfocado — pero el bug del founder (prestador, dosis) prueba
que NO alcanza en pantallas largas con CTA fijo. Si el patrón de la casa
exigiera `pan` u otro modo, **es config nativa = tren de build** (el
riesgo que D-498 declara).

## 1 · La infraestructura que YA cubre

- **`Hoja` maneja el teclado EN EL COMPONENTE** (`Hoja.tsx:274-278`:
  `KeyboardAvoidingView` behavior padding/height envolviendo el sheet).
  **Todo `Campo` dentro de una Hoja está cubierto de fábrica.**
- **KAV explícito vivo en 4 pantallas:** los 3 checkouts
  (`paseo/checkout:114` · `grooming/checkout:159` · `veterinaria/checkout:132`)
  y `cuenta/direccion:88`.
- `keyboardShouldPersistTaps` (presente en varias) **NO evita el tapado**
  — solo deja tapear con teclado abierto. No cuenta como cobertura.

## 2 · El censo por pantalla (10 pantallas con `Campo`)

| Pantalla | Dónde vive el Campo | Cobertura | Veredicto estático |
|---|---|---|---|
| `login` | 2 campos en el tercio superior | ninguna (KSPT solo) | 🟢 BAJO — el teclado no llega al campo |
| `registro` | campos en tercio superior | ninguna | 🟢 BAJO |
| `onboarding/mascota` | nombre arriba; especie/fecha abajo NO son texto | ninguna | 🟢 BAJO |
| `onboarding/fecha` | `CampoFecha` → abre **Hoja** | Hoja (KAV) | ✅ CUBIERTO por componente |
| `hogar/agregar/index` | nombre + campos a mitad de scroll | ninguna | 🟠 MEDIO — campo bajo el fold con teclado |
| `hogar/agregar/fecha` | `CampoFecha` → **Hoja** | Hoja | ✅ CUBIERTO |
| `carnet` | Campo de edición dentro de **Hoja** | Hoja | ✅ CUBIERTO |
| `hogar/adiestramiento` | bitácora en **Hoja**; filtro autocompletado arriba de pantalla | Hoja / posición | ✅/🟢 |
| `cuenta/perfil` | nombre/teléfono arriba-medio | ninguna | 🟡 MEDIO-BAJO |
| `cuenta/familia` | rename = PRIMER elemento del scroll (`:115`) | ninguna | 🟢 BAJO |
| *(checkouts + direccion)* | cupón/dirección | **KAV explícito** | ✅ CUBIERTO (verificar behavior en device) |

**Cero curas ejecutadas** — el porqué está en el método: sin dispositivo
no hay veredicto real ni captura-con-teclado que lo pruebe.

## 3 · EL PATRÓN ÚNICO PROPUESTO (a comparar con el de B)

**"Todo `Campo` vive en una de DOS casas: (a) dentro de una `Hoja` — que
ya maneja el teclado en el componente —, o (b) en pantalla bajo un
`KeyboardAvoidingView` (behavior `padding` iOS / `height` Android, el
patrón literal ya vivo en los checkouts) + ScrollView con
`keyboardShouldPersistTaps`. Una pantalla con Campo fuera de las dos
casas es un bug de D-498."** Corolario: la cura preferida es MUDAR el
campo a una Hoja (cobertura por componente, cero código por pantalla)
antes que sembrar KAVs artesanales. Si el dispositivo prueba que ni el
KAV alcanza (el caso dosis), la decisión sube a config nativa
(`softwareKeyboardLayoutMode`) = tren de build, decisión de mesa.

## 4 · Qué sigue (S74, con el disparo de D-498)

1. Verificación EN DISPOSITIVO pantalla por pantalla (la captura doble de
   la ley candidata #2) — empieza por los 🟠/🟡 de la tabla.
2. Comparar este patrón con el censo de B (prestador) por mano del
   founder → UN patrón de casa.
3. Curar por el patrón; si hace falta config nativa, viaja en el próximo
   tren de build (L-134).
