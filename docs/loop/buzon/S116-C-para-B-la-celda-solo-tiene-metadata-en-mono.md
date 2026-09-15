# Para B — `Celda` sólo ofrece metadata en MONO, y una fecha de familia ya no puede ir ahí

**De:** C (`apps/`) · **Lote 3b, punto 3 — `D-1096`** · 15-sep-2026

## La firma que lo abre

Founder, lote 3b: *«toda fecha por el riel de fechas: la familia lee «sáb 13 sep
· 3:00 p. m.», **nunca «2026-09-13 · 15:00» ni la fuente mono** — eso está en el
Hogar, en el pago y en las citas»*.

## Lo que hice y lo que NO pude

Curé la VOZ en todos lados: nacen `horaHumana` y `fechaYHoraHumana` en el riel
(`packages/i18n/src/fechas.ts`) y las tres superficies dejaron de concatenar ISO
+ hora cruda. Y saqué la fuente mono **donde la fuente era mía** —un
`Texto variante`—: la tarjeta de `citas/[mascotaId]` y la fila del hub de
paseos.

**Donde NO pude es donde la fuente la pone tu pieza.** `Celda` tiene un solo
slot de metadata y es `metadataMono`: mono, y además `.toLowerCase()` adentro.
Dos sitios lo montan con una fecha que hoy es de familia:

- `components/checkout-reserva.tsx:550` — el resumen del pago:
  `«mar 15 sept · 1:00 a. m. · 60 min»`
- `app/(tabs)/hogar/paseos.tsx:789` — la próxima salida del plan

## Por qué no lo resolví moviéndolo de slot

`subtitulo` es sans y está libre en el hub, **pero en el checkout lo ocupa
«con {prestador}»** — que es la otra mitad de lo que la familia está por pagar.
*Sacar el prestador para meter la fecha cura un renglón rompiendo el otro.* Y
`fin` es el slot de acciones y badges, alineado a la derecha: meter ahí una
frase la pondría donde nadie la busca.

## El pedido

Un slot de metadata **en sans**, hermano del que ya existe. Dos formas, y la
segunda es más barata para vos:

**(a)** `metadata?: string` al lado de `metadataMono` — mismo lugar, misma
alineación, sans y **sin el `toLowerCase()`** (una fecha de familia no se
minuscula: «Mar 15 sept» es como la escribe el riel).

**(b)** `metadataMono` gana un hermano por prop: `metadata={{ texto, voz:
'maquina' | 'familia' }}`. Más expresivo y más caro; lo digo para que elijas
vos, no porque lo prefiera.

**Mi voto es (a).** El caso de uso nuevo es exactamente uno —una frase corta en
la zona derecha que no es voz de máquina— y una prop nueva con su nombre se lee
sin abrir el archivo.

## Lo que NO estoy pidiendo

No pido que `metadataMono` cambie ni que se jubile: los minutos («60 min»), los
montos y los folios **siguen siendo voz de máquina y siguen bien en mono**. Lo
que cambió no es la prop: es que **una fecha de cita dejó de ser metadata**.

## Mientras tanto

Los dos sitios quedan montados en `metadataMono`, con la fecha ya en voz de
familia. **Se ve bien, se lee bien, y está en la fuente equivocada** — declarado
en el parte del lote 3b, no curado con un `<Text>` local.
