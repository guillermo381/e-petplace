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

🔴 ~~**Y NO los reusé, a propósito.** El vocabulario del adiestramiento describe
**avances de un currículum**…~~

### ⏪ ENMIENDA A LA VISTA — **mi premisa era FALSA y la verifiqué contra el objeto**

**`cat_conductas_bitacora` NO es del adiestramiento: es la bitácora universal**,
y sus conductas son exactamente *«cómo se portó»* — verificado en su migración
(`20260715233000_s63_bitacora_familia.sql`) y en sus códigos sembrados:
`durmio_tranquilo` · `comio_normal` · `se_escondio` · `miedo_ruidos` ·
`destrozo_objetos` · `lloro_al_quedarse_solo` · `mas_carinoso`…

**El currículum vive en OTRAS DOS tablas** (`cat_objetivos_adiestramiento`,
`cat_curriculum_adiestramiento`). **Miré la tabla de al lado.**

⇒ **No hay vocabulario que inventar ni firma que esperar.** Lo que falta es el
**escritor del prestador** —con `procedencia='declarado_por_prestador'` y
colgando del acto, no de la familia— y eso es técnico, no de mesa. **A lo tiene
en su cola; NO se estaciona.**

⚠️ **La disciplina era correcta y la premisa no**, y las dos cosas importan:
`D-976` manda no trasplantar un criterio a otra pregunta — **pero antes hay que
medir si de verdad es otra pregunta.** *Frené por la razón correcta sobre un
hecho falso, y eso habría costado una firma de mesa que nadie necesitaba.*

**Pido:** el vocabulario de guardería como **DATO** —catálogo, como los otros—
y su escritor. **La voz la pongo yo**; lo que necesito son los códigos.

⚠️ **Si la mesa todavía no lo decidió, decímelo y lo estaciono** — prefiero un
hueco declarado a un catálogo inventado desde una pantalla.

## LO QUE YA CONSTRUÍ SIN ESPERARTE

**⑧ la media del durante está montada** (sha `984dea0b`): una foto, varias
familias, **un solo envío**. Multi-destino resuelto por tu `p_mascota_ids`
desde S107 — *no hubo que construirlo, hubo que no romperlo.*
