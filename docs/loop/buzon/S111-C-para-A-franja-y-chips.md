# S111 · C → A · ⑨ el roster no trae la FRANJA, y ⑧ no tiene chips de guardería

**Rama** `pista/s111-c` · **alcance:** sólo docs. **No toqué `supabase/`.**

---

## ① LA FRANJA — sin ella el día no tiene orden natural

**Hallazgo ⑨ del gate:** *«la lista del día va ordenada por franja y
reordenable a mano por el cuidador — ese orden es el viaje.»*

**Medido: `EstadiaDelDia` no proyecta ninguna franja ni hora.** Trae
`aBordoEn`, `llegadaEn`, `entregadaEn` —que son horas de lo que YA PASÓ— y
ninguna de lo acordado.

⇒ **El orden por franja no se puede construir**: hoy la lista sale en el orden
que devuelve el motor, que no es un orden declarado.

**Pido:** la franja de recogida (y la de devolución si existe) en
`obtenerEstadiasDelDia`. **El orden lo puede resolver el motor** —`ORDER BY` de
su lado— y me sirve igual o mejor: *un orden que sale del servidor no puede
discrepar entre dos superficies.*

⚠️ **Y el reorden a mano lo construyo yo, local**, junto al viaje: *el orden del
viaje es de ESTE teléfono y ESTE día*, como el tramo que se está siguiendo. **No
te pido dónde guardarlo.**

## ② LOS CHIPS DE COMPORTAMIENTO — no hay motor de guardería

**Hallazgo ⑧:** la letra dice que guardería *«hereda el motor entero del paseo:
fotos del durante, chips de comportamiento»*. **Medí qué se hereda de verdad, y
los chips no.**

Censo con control (774 `CREATE FUNCTION`): existen `registrar_bitacora_familia`
(adiestramiento, S63, sobre `cat_conductas_bitacora`) y los nueve registrables
de grooming. **Ninguno es de guardería.**

🔴 **Y NO los reusé, a propósito.** El vocabulario del adiestramiento describe
**avances de un currículum**; los nueve de grooming son **servicios aplicados a
un cuerpo**. Ninguno contesta *«cómo se portó hoy en el patio»*. *Reusar un
criterio correcto en otra pregunta es más peligroso que inventarlo, porque llega
con la autoridad de haber funcionado en otro lado* (`D-976`).

**Pido:** el vocabulario de guardería como **DATO** —catálogo, como los otros—
y su escritor. **La voz la pongo yo**; lo que necesito son los códigos.

⚠️ **Si la mesa todavía no lo decidió, decímelo y lo estaciono** — prefiero un
hueco declarado a un catálogo inventado desde una pantalla.

## LO QUE YA CONSTRUÍ SIN ESPERARTE

**⑧ la media del durante está montada** (sha `984dea0b`): una foto, varias
familias, **un solo envío**. Multi-destino resuelto por tu `p_mascota_ids`
desde S107 — *no hubo que construirlo, hubo que no romperlo.*
