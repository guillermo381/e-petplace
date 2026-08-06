# S89-B · LA CARA DEL CORREO — espec de identidad para las plantillas (foco ③)

> **Orden de apertura S89-B, orden 5.** Especificación + demo estática que
> **A consume al armar las plantillas vivas** (territorio A — acá no se toca
> ninguna edge function ni plantilla real). Matemática de contraste: la misma
> de `verify-contrast.ts`, autovalidada contra pares firmados antes de medir
> (papel/tealDark 5.51 reproducido). Demo:
> `scripts/capturas/s89-b-correo-demo.html` — **criterio para el ojo del
> founder, no evidencia** (la regla de las láminas: el acuerdo se mira antes
> de construir; la lámina muere con su trabajo hecho).
>
> **Remitente firmado: `hola@epetplace.com`** — va en el pie de toda
> plantilla, literal.

---

## ① La traducción de tokens a correo

Los clientes de correo **no corren la app**: ni temas, ni tokens vivos, ni
fuentes propias garantizadas. La identidad viaja en TRES canales que sí
sobreviven: **color (hex planos de `palette.ts`) · proporción · voz.**

### Los hex (fuente única `palette.ts` — jamás inline inventado)

| rol | token | hex | contraste medido | veredicto |
|---|---|---|---|---|
| fondo del correo | `light0` (papel algodón) | `#FAF9F7` | — | la superficie de la casa en claro |
| texto cuerpo/título | `tinta` | `#221E19` | **15.74** sobre papel | AAA |
| texto secundario (pie) | tinta al 65% (`text.secondary` claro) | `rgba(34,30,25,.65)` | **≈5.0** (el slot ya gatea 4.99 en la app) | AA |
| **acento — EL QUE MANDA en papel** | `magentaDark` | `#8E1F68` | **7.84** sobre papel | AA+ hasta para texto |
| caja del código (fondo) | `papelTapiz` | `#FAF2F5` | tinta sobre él: **15.05** | AAA (la caja se separa por BORDE, no por contraste de fondo — 1.0 vs papel, declarado) |
| borde de la caja | tinta al 18% | `rgba(34,30,25,.18)` | — | hairline, no informativo |

### Por qué magentaDark y no otro — medido, no opinado

| candidato | sobre papel | por qué no |
|---|---|---|
| **`magentaDark #8E1F68`** | **7.84** | **✓ ES ÉSTE** — el «registro trabajador del magenta» que la casa ya firmó para claro (S58c: `accent.control`); la marca presente sin gritar, y aguanta TEXTO |
| `ctaOro #FCBC1D` | **1.62** | ✗ **el correo es fondo claro = superficie PAPEL, donde el oro NO rige** (alcance firmado S89 orden 4: el oro es del muro y del degradado; el correo no tiene muro) |
| `pink #FF00AF` | 3.40 | gráfica sí, texto no — y el puro conserva su reserva de marca |
| `pinkDark #C4008A` | 5.37 | pasa AA, pero la casa ya eligió: en claro el magenta trabajador es magentaDark — dos registros del mismo rol se desincronizan |
| `tealDark #0A7268` | 5.51 | es el acento del OFICIO; el correo es voz de PLATAFORMA a las dos casas |

**Regla dura del acento:** el acento **jamás es el único canal de una
información** — los links van magentaDark **Y subrayados**, siempre. (La
razón medida está en ②: la inversión forzada puede matar el color, el
subrayado no muere nunca.)

### Tipografía — fallbacks declarados

Los clientes mayoritarios ignoran webfonts (Gmail no soporta `@font-face`);
**la identidad no se apoya en la fuente: se apoya en proporción, color y
voz.** Stacks:

- **Sans (todo el texto):** `'DM Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` — DM Sans llega donde llegue; el fallback es el sistema, digno.
- **Mono (SOLO el código — la voz de máquina de la casa):** `'JetBrains Mono', 'SF Mono', 'Roboto Mono', Consolas, Menlo, monospace`.

### Jerarquía (proporciones de la casa, en px de correo)

| pieza | tamaño/peso | color |
|---|---|---|
| cabecera: wordmark «e-PetPlace» | 18px · 600 | tinta (la marca habla bajito; si A quiere el isotipo, es IMAGEN hosted — decisión suya, no de esta espec) |
| hairline bajo cabecera | 1px | `rgba(34,30,25,.18)` |
| título/saludo | 22px · 500 | tinta |
| cuerpo | 16px / interlínea 24px | tinta |
| **el código** | **32px · 600 · tracking 0.12em · mono** | tinta sobre tapiz |
| indicación bajo el código | 14px | tinta .65 |
| pie | 13px / 20px | tinta .65 · remitente `hola@epetplace.com` literal |

Ancho máximo 600px · tablas + estilos inline (Outlook descarta `<style>`;
el bloque `<style>` queda SOLO para el dark de ②, como mejora progresiva).

---

## ② El código grande y copiable (pedido firmado)

Los clientes de correo **no ejecutan JS**: no hay botón de copiar (descartado
en la lámina). El patrón:

- **Mono 32px · peso 600 · tracking 0.12em**, centrado, en su caja
  (`papelTapiz` + borde hairline, radio 10 — el radio `suave` de la casa).
- **Presentado en grupos de 4** (`8472 1903`) para el ojo — **el espacio es
  presentación, no valor**: `CampoCodigo` sanea todo no-alfanumérico al
  pegar (medido S88-B: pegado sucio → llega entero y exacto).
- Debajo, la indicación: **«Toca el código para copiarlo.»** (14px, tinta
  .65) — el toque largo/selección del cliente de correo hace el trabajo; el
  texto no promete un botón que no existe.
- Contraste del código: **15.05** (tinta/tapiz) en claro · **17.73**
  (textDark0/dark0) en oscuro.

### El par claro/oscuro — elegido, no descubierto

**Capa 1 — clientes que HONRAN `prefers-color-scheme`** (Apple Mail y
familia): el bloque `<style>` sirve el par oscuro de la casa, tokens reales:

| rol | claro | oscuro | contraste oscuro |
|---|---|---|---|
| fondo | `light0 #FAF9F7` | `dark0 #050508` | — |
| texto/código | `tinta #221E19` | `textDark0 #F0EEF8` | **17.73** |
| acento/links | `magentaDark #8E1F68` | `violetText #AE59FF` (el mismo flip que hace `accent.control` en la app) | **5.50** |
| caja del código | `papelTapiz` | `#050508` + borde `rgba(240,238,248,.18)` | texto 17.73 |

**Capa 2 — clientes que FUERZAN la inversión sin preguntar** (Gmail app):
transforman los hex por su cuenta. Peor caso MEDIDO (color sin transformar
sobre fondo forzado ~`#121212`):

| hex | sobre #121212 | lectura |
|---|---|---|
| `tinta` → Gmail lo aclara (eje texto/fondo: la inversión lo PRESERVA por simetría) | — | el cuerpo y el código **sobreviven siempre** |
| `magentaDark` | **2.27** | ✗ el acento PUEDE morir — por eso **ninguna información viaja solo en color**: links subrayados, el código en tinta |
| `pink #FF00AF` | 5.24 | sobrevive — por eso si un elemento decorativo debe vivir en ambos mundos, es del registro puro |
| `violetText #AE59FF` | 5.06 | sobrevive |

> **La regla que esto compra:** el eje tinta/papel carga TODA la
> información (la inversión lo preserva); el acento decora y enlaza con
> subrayado redundante; los medios-tonos oscuros (magentaDark) jamás cargan
> algo que no esté dicho por otro canal. **Los hex que sobreviven la
> inversión se eligen, no se descubren.**

---

## ③ La demo — `scripts/capturas/s89-b-correo-demo.html`

La plantilla madre (cabecera · cuerpo · código · pie) rendida DOS veces con
esta espec: claro, y la simulación del par oscuro (rotulada — el andamiaje
de la demo no es parte de la plantilla; la plantilla es la tabla interna).
**Tuteo neutro en todo texto de muestra**; los textos son MUESTRA — la voz
real de cada tipo la firma el founder en su lote (ningún tipo sale de sombra
sin su voz firmada, L-207).

Qué mira el ojo: ¿la cabecera dice la casa sin gritar? · ¿el código PRESIDE
(la pieza más grande del correo)? · ¿el magenta trabaja sin volverse
alarma? · ¿el pie dice el remitente y el porqué sin burocracia?

---

## Alcance declarado

- **Esto NO construye plantillas** — A las arma consumiendo esta espec (los
  literales de tabla de arriba son copy-paste listos).
- La inversión de Gmail se midió en su **peor caso estático** (color sin
  transformar sobre fondo forzado); el comportamiento real varía por versión
  — la regla del canal redundante existe exactamente para no depender de eso.
- El isotipo como imagen hosted, tracking de apertura, y texto plano
  (`text/plain` alterno) son decisiones de A al armar; la espec no las
  prescribe.
