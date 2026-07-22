# S73-B · VARA CRUZADA (M2) sobre el ENTITY CHIP de A
### (`2026-07-21-s73a-boceto-selector-entity-chip.md` + `s73-a-boceto-entity-chip.png` — método L-158, la fuente de cada dato)

> **Veredicto: APTO para construir cuando el founder firme V1/V2 —
> voto V2 del boceto RATIFICADO — con DOS enmiendas de vara (una de
> plataforma, una de construcción) y una ratificación explícita.**

## Censo del boceto contra fuente (todo coincide, con los números)

- `RADIO_SQUIRCLE = 0.32` + `radioSquircle(lado)` (`AvatarMascota.tsx:73-76`) ✓ · tallas xs 28 · sm 40 · md 64 (`:78-84`, con el comentario S61-A4: xs nació EXACTAMENTE para el chip de 44) ✓ · `borderCurve:'continuous'` en foto (`:148-149`) y huella (`:179`) ✓.
- Chip: `BORDE = 1.5` (`SelectorOpcion.tsx:40`) · `ALTO = 44` (`:41`) · `borderRadius: radius.suave` = 10 (`:223`) · `paddingHorizontal: spacing[4]` = 16 (`:220`) · el `adorno` hoy flota DENTRO del padding (`:233-234`) ✓ — el boceto §0.2 es exacto.
- `prestadores.foto_url` existe ✓ (y su exclusión del boceto está declarada).

## Las tres preguntas, con número

**1 · ¿El inset respeta el squircle o la curva se empasta?** Radios REALES del avatar (`radioSquircle`): 28→9 · 32→10 · 36→12 · 40→13. La regla de anillos concéntricos pide radio interno = radio del chip − inset: V1 ideal 4 (real 10) · V2 ideal 6 (real 12) · V3 ideal 8 (real 13) — **en las tres el avatar es MÁS curvo que su ideal concéntrico**, y el desajuste crece con la talla. Con inset 6 (V1) el aire absorbe la disparidad; con 4 (V2) todavía; con 2 (V3) los dos arcos corren casi pegados con curvaturas dispares — **el "empaste" es real solo en V3, que el boceto ya montó como vara negativa**. A 28px (xs actual) no aplica: hoy flota con 16 de padding. **RATIFICACIÓN EXPLÍCITA de la vara:** la concentricidad perfecta exigiría un radio artesanal (chip−inset) para el avatar-en-chip — y eso rompería "UNA definición" del squircle (`:71-72`, regla 37 del clon). No se toca la primitiva: V1/V2 conviven con el desajuste porque el inset lo disimula.

**2 · ¿El path de selección (borde 1.5 + tint) convive con el avatar al borde?** El aire visual avatar↔borde = inset − 1.5 (el borde RN pinta hacia adentro): **V1 = 4.5px ✓ · V2 = 2.5px — justo pero legible · V3 = 0.5px — PELEAN** (el squircle toca el borde; es el "escapando" del dictado, visible en el PNG). En **oscuro** el margen percibido de V2 baja (borde brillante sobre elevated — el propio boceto §1 lo declara): si el founder firma V2, que lo firme mirando la fila DARK de la lámina, no la clara.

**3 · ¿Target 44 en las tres variantes?** Sí — `ALTO = 44` es constante del componente (`:41`) y las tres geometrías cierran exactas a 44 (32+6·2 · 36+4·2 · 40+2·2); el ancho crece con el contenido. **Target sostenido en las tres.**

## Las dos enmiendas de vara

**E1 (plataforma — la que el boceto no declara):** `borderCurve:'continuous'` es **SOLO iOS**; Android/web degradan a redondeo estándar (`AvatarMascota.tsx:70-72`, degradación declarada de la primitiva). El argumento del boceto §0.1 ("dos curvaturas de la misma familia") **rige en iOS; en el Android del founder son dos borderRadius simples** — se ve BIEN (los números de las preguntas 1-2 no cambian), pero la lámina web/las capturas no son la verdad del gate: **la firma V1/V2 es EN DISPOSITIVO (D-284), y el boceto debe decir que el squircle continuo no viaja a Android.**

**E2 (construcción):** el slot `entidad` tiene que romper el padding SOLO a la izquierda (inset propio izquierdo + conservar `paddingHorizontal` derecho para el texto) y el spinner de carga S62 (`:231-234` — adorno montado invisible durante la espera) tiene que seguir funcionando sobre el slot nuevo: la enmienda hereda esa mecánica, no la re-implementa.

## Nota menor

El PNG monta la vecindad §6b.4 (selectores de VALOR sin cara) y el nombre largo real ("Maximiliano") — la vara del boceto §3 está bien armada; nada que pedir ahí.
