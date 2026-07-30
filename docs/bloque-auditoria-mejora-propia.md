# BLOQUE PERMANENTE — AUDITORÍA Y MEJORA PROPIA

> Va **al principio de toda directiva de UI**, las dos apps, todas las pistas.
> Antes de los ítems concretos, nunca después.
>
> Origen: S82, 29-jul-2026, orden del founder. Nace por evidencia: en esta
> sesión las pistas corrigieron al arquitecto cuatro veces por cuenta propia y
> las cuatro tenían razón. Esto convierte esa capacidad en mandato.
>
> **No es ley todavía.** Se deposita en `CONTRATO_TRABAJO` cuando haya pagado
> una vez y el founder lo firme en pantalla (regla 80: la ley se escribe DESPUÉS
> del resultado firmado).

---

## ANTES DE TOCAR LA PANTALLA — la auditoría

Su salida **se reporta**. No es trabajo interno.

1. **Leé la pantalla y nombrá en una línea qué preside hoy.** Si nada preside,
   decilo. "Todo pesa igual" es un hallazgo válido y es el más común en este
   producto.

2. **Auditá contra las fuentes**, en este orden: `DIRECCION_ARTE` (la ley) · la
   LETRA de la pantalla si tiene · la lámina si hay · `DISEÑO_EXPERIENCIA` ·
   `MODELO_PRODUCTO`. Si la fuente contradice a la directiva, **GANA LA FUENTE**
   (§2.6) y me lo decís.

3. **Listá los defectos, numerados**, cada uno con la ley o el criterio que
   viola. Separalos en dos grupos: **(a)** los que la orden ya te pidió arreglar
   y **(b)** los que encontraste vos.

4. **Declará qué vas a cambiar de (b) y qué dejás**, con el porqué de cada
   decisión.

## LOS SIETE EJES

Son los que la ley NO mide. El cumplimiento de reglas de acabado llegó a 99 de
102 y las pantallas seguían leyéndose planas: el hueco está exactamente acá.

- **JERARQUÍA** — ¿qué preside? ¿hay un elemento que gane, o compiten todos?
- **ORDEN** — ¿la información está en el orden en que se necesita? La identidad
  antes del historial, el estado antes del archivo.
- **AGRUPACIÓN** — ¿lo que pertenece junto está junto y rotulado? Ocho vacunas
  en fila plana no son un grupo, son una lista.
- **DENSIDAD** — ¿hay listas largas que deberían colapsar con un CTA que
  despliega?
- **VACÍO** — ¿cuántas celdas dicen "sin dato"? **Más de dos juntas es una
  pantalla que dice "no sabemos nada de tu mascota".** Se colapsan en UNA línea
  honesta. L-139 exige decir que falta; no exige dedicarle cuatro tarjetas a la
  ausencia.
- **VOZ** — ¿el dato verificable está en mono, la interfaz en sans, la voz del
  producto en su registro? Un solo registro para todo es por qué nada pesa.
- **LOS DOS TEMAS** — ¿se lee en oscuro? Este producto no mira el modo oscuro
  nunca, y ahí se rompen las cosas.

## PODÉS DECIDIR SOLO — sin preguntar, sin esperar gate

- Jerarquía, orden, agrupación, densidad, espaciado, qué colapsa y qué se abre
- Qué componente existente usar; absorber un clon local en su primitiva
- Qué token existente aplica
- **Mejorar la orden que te di**, si la fuente la contradice o si tu criterio es
  mejor — con el porqué escrito. La directiva no es sagrada; la fuente sí.

## TENÉS QUE PARAR Y DECLARAR — no decidir

- Un hex, un tamaño de fuente o un radio que no exista en tokens
- Cualquier cosa que contradiga **letra FIRMADA** (se declara, jamás se rompe en
  silencio ni se difiere callado)
- Contenido que el dato no sostiene: se dice que falta, no se rellena (L-139)
- Enmienda de primitiva en `packages/ui` si no es tu territorio (76(d))
- **Una ley nueva.** La ley se escribe después del gate, nunca antes (regla 80)

## CÓMO SE REPORTA — esto es lo que lo hace útil

**Reportás HALLAZGOS, nunca veredictos.**

Sirve: *"Encontré seis problemas de jerarquía, curé cuatro, estos dos los dejé
porque tocan territorio ajeno."*

No sirve y viola L-153: *"la pantalla quedó bien."* La vara no la declara quien
construye. El gate en dispositivo es la única firma, y no se declara pasado
desde una captura.

Y el corolario que hace que esto no se degrade: **si tu auditoría no encuentra
nada, decilo explícitamente.** Una auditoría que nunca halla defectos no es una
auditoría — es la misma clase de falla que L-192 (una verificación cuyo modo de
falla es el silencio no es una verificación).
