# S107 · CONTRATO — LA MEDIA DEL DURANTE (pista A → D, B, C)

> **Publicado:** 28-ago-2026, antes de la migración (regla S106). **D arranca contra esto.**
> **Fuente:** plan §4.8 + `CRITERIO_LEGAL_GUARDERIA` §5 (las cuatro capas de imagen) + firmas ① y ② (foto grupal y clip ≤30 s con selección de animales).

---

## ① LA REGLA MADRE — **una media = un archivo; las etiquetas son muchas**

🔴 **El binario JAMÁS se duplica por animal.** Una foto con cuatro perros es **un archivo** y **cuatro etiquetas**.

```
guarderia_media
  id            uuid pk
  prestador_id  uuid not null
  fecha         date not null          -- el día de la estadía (local del lugar)
  tipo          text not null CHECK IN ('foto','clip')
  archivo_url   text not null
  miniatura_url text
  duracion_s    numeric
      CHECK (tipo = 'foto' AND duracion_s IS NULL)
         OR (tipo = 'clip' AND duracion_s > 0 AND duracion_s <= 30.9)
  capturada_en  timestamptz not null
  autor_user_id uuid not null

guarderia_media_etiquetas
  media_id    uuid not null
  mascota_id  uuid not null
  estadia_id  uuid not null            -- ancla a la estadía-día de ESE animal
  UNIQUE (media_id, mascota_id)
```

🔴 **El tope de 30 s se verifica en el SERVIDOR, no sólo en la captura** — un archivo de 31 s **no entra**. La tolerancia de contenedor (**+0,9 s**) va **en el CHECK, declarada**, no en un comentario: es la diferencia entre una ley que frena y una promesa de diseño.

**Mínimo una etiqueta:** una media sin etiquetas no se publica — se rechaza tipado (`media_sin_etiquetas`). *Etiquetar de más rompe más que etiquetar de menos, pero etiquetar de cero es una foto que no llega a nadie.*

---

## ② LA LECTURA — y la línea de privacidad, que es lo delicado

- **El prestador** lee la media de **sus** estadías.
- **El dueño** lee la media etiquetada con **su** animal.
- 🔴 **En la lectura del dueño, los nombres de los otros animales de la foto NO VIAJAN.** Ni el id, ni el nombre, ni el conteo por nombre. **Se resuelve en el SELECT del server, jamás filtrando en la pantalla** — lo que no viaja no se filtra mal.

**Wrappers:**
`obtenerMediaDelDia(prestadorId, fecha)` → para el prestador, con sus etiquetas completas.
`obtenerMediaDeMiMascota(mascotaId, fecha?)` → para el dueño, **sin las otras etiquetas**.
`publicarMedia({ archivoUrl, tipo, duracionS?, mascotaIds[], fecha })` → crea la media **y sus N etiquetas y sus N eventos en una sola transacción**.

---

## ③ EL EXPEDIENTE — un evento por animal, apuntando al MISMO archivo

Cada animal etiquetado recibe **su** evento de expediente **apuntando a la misma media**. No se copia el archivo ni se crea una media por animal.

⚠️ **D mide primero cómo lo hace HOY el paseo grupal** (su medición 1: P19 rige desde S59 y el paseo ya es grupal por norma). **Si el paseo ya tiene la forma, se reusa; no se inventa una segunda.** Ese resultado vuelve a A y este contrato se enmienda si hace falta.

---

## ④ EL ENCUADRE ES LEY DE CAPTURA — vive en D, se declara acá

De `CRITERIO_LEGAL_GUARDERIA` §5, y es **obligación del prestador por contrato**, no lógica de app:
- el animal en cuadro; **personas no** — lo incidental **se recorta o se descarta antes de enviar**;
- **menores: descarte sin excepción**;
- en el domicilio (fotos de acta) **primer plano — la fachada y la numeración no se fotografían**;
- las fotos de estadía se toman **en las instalaciones**.

**La app guía y da la tijera.** 🔴 **Ningún texto de este bloque se redacta en pantalla como cláusula** — el contrato del prestador lo dice; la pantalla sólo guía el encuadre.

**La casilla de redes** es un **dato del expediente** (opcional · independiente · **apagada por defecto** · revocable) y viaja con la aceptación de documentos — contrato aparte. **La prohibición por defecto es texto del contrato del prestador, no lógica de app.**

---

## ⑤ LO QUE ESTE CONTRATO NO DECIDE

- **Compresión, cola offline, reintentos, miniaturas generadas** — son de **D**, que elige parámetros **y los declara**. La miniatura es **un dato del esquema, no una promesa**: si D no la genera, la columna queda nula y la pieza lo maneja.
- **Retención** — v1 guarda todo; **ninguna política de retención se inventa acá** (la fila de la §18 de la Política de Privacidad ya la cubre: cierre de cuenta + 30 días).
- **El permiso de micrófono** — es de D, y 🔴 **es binario nuevo: no viaja por OTA.**
