# Marcas ajenas — de dónde salió cada archivo

> **Nada de esta carpeta se redibuja, se re-colorea ni se estira.** Son marcas de otros: lo que entra, entra tal cual salió de su dueño, y lo que falta **no se dibuja a mano** (`LETRA_REDISENO_S116` §1, y el criterio que C sostuvo en su buzón: *un botón de marca ajena que no entra a ningún lado es peor que su ausencia*).

## Google — «Continuar con Google»

| | |
|---|---|
| **archivos** | `google-entrar.png` · `@2x` · `@3x` (180×40 · 360×80 · 540×120) |
| **origen** | `https://developers.google.com/static/identity/images/signin-assets.zip` |
| **bajado** | 13-sep-2026, sin cuenta, desde la página pública de *Sign in with Google · Branding Guidelines* |
| **variante** | `Android + Web` / `Theme=Light` / `Show text=Yes` / `Shape=Pill` |
| **guidelines** | `https://developers.google.com/identity/branding-guidelines` |

### 🔴 LA LICENCIA, DICHA COMO ES — y no es del todo cómoda

**El zip NO trae archivo de licencia.** Medido: cero `LICENSE`, `README` o `TERMS` adentro. Lo que dice la página:

- la **documentación** está bajo *Creative Commons Attribution 4.0*;
- los **assets de marca** se rigen por las *Guidelines for Third Party Use of Google Brand Features*, que para usos fuera de lo que las propias guidelines autorizan **exigen consentimiento escrito de Google**.

**Lo que sí autorizan explícitamente es esto**: usar el botón provisto para ofrecer *Sign in with Google* en un producto que integre Google Identity, siguiendo su spec. **Es exactamente nuestro caso** — el motor de Google ya está cableado (`iniciarSesionConGoogle`, medido por C).

⚠️ **Y por eso el asset se monta ENTERO y sin tocar.** La alternativa —poner sólo su logo dentro de un botón nuestro— **también está permitida, pero exige Google Sans Medium 14/20**, que la casa no tiene. *Un botón «casi» conforme a las guidelines de otro no es un atajo: es un incumplimiento con mejor aspecto.*

### Cómo se monta, y qué NO se puede hacer con él

- ✅ **escalar proporcionalmente** (es lo que hace `BotonMarcaAjena`: alto 52 ⇒ 234×52)
- 🔴 **NO estirar a ancho completo** — deforma la tipografía y el logo
- 🔴 **NO cambiarle el color, el radio ni el texto**
- 🔴 **NO recortarle el logo** para usarlo aparte

## Apple — NO INGRESADO, y es una decisión

**No hay archivo de Apple en esta carpeta, a propósito.** Firma de la mesa (13-sep-2026): *«Apple queda OCULTO en 03 y 05 hasta que el founder tenga cuenta de developer: un botón que no funciona no se muestra.»*

Medido por C: **el motor de Apple no existe** (cero en `packages/api/src/index.ts`). Bajar su asset hoy sería preparar la cara de una puerta que no abre.

⇒ `BotonMarcaAjena` **tiene su lugar previsto** (`marca="apple"`) y **no se puede montar**: sin asset, la pieza no lo dibuja. *El día que haya cuenta de developer, entra el asset acá con su procedencia y el motor lo enciende — y ninguna pantalla cambia.*
