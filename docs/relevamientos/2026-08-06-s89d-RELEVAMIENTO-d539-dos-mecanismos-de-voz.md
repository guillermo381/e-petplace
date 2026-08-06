# S89-D · RELEVAMIENTO D-539 — los dos mecanismos de voz y las seis inline

> **Territorio D (apps/cliente) · SOLO MEDICIÓN.** La adjudicación del
> mecanismo es de mesa; acá no se propone cura ni se toca nada. Todo lo
> citado se leyó del OBJETO VIVO (`pg_get_functiondef` contra la DB
> linkeada, 6-ago-2026), jamás de migraciones ni de fichas — donde una
> ficha decía otra cosa, se re-midió antes de contradecirla (L-166).
>
> **Método:** consultas por `--file` desde el repo principal (el worktree
> no hereda el link — S88-D §3). Firmas localizadas por `pg_proc`;
> bodies por `pg_get_functiondef`; callers por `prosrc LIKE`; catálogo
> por `SELECT` directo a `cat_notificacion_tipos`.

---

## 1 · LOS DOS MECANISMOS, con su literal

### Mecanismo Ⓐ — `_voz_notificacion(text, uuid, uuid, jsonb)`

- **Resuelve idioma**: lee `user_preferencias.idioma` del destinatario;
  `NULL` o fuera de `('es','en')` cae a `'es'`.
- **9 tipos con voz firmada** (WHEN medidos en el body vivo — la ficha
  D-667 decía «7 tienen voz»: quedó atrás tras el lote del alta
  asistida; el número vivo es **9**):
  `plan_renovado` · `plan_renovacion_proxima` · `paquete_vence` ·
  `programa_vence` · `programa_vencido_reembolso` ·
  `plan_vencido_reembolso` · `procedimiento_agendado` ·
  `registro_completado_prestador` · `registro_completado_operador`.
- **`ELSE RETURN '{}'`** — un tipo sin voz NO inventa.
- **Nombra a la mascota sin inventar**: con nombre lo usa, sin nombre
  cae al genérico firmado.
- **Callers vivos (6)**: `cerrar_y_renovar_planes` ·
  `vencer_paquetes_salidas` · `vencer_programas_adiestramiento` ·
  `fijar_fecha_procedimiento` · `_trg_completar_pendiente_registro` ·
  **`_notificar_dueño_prestador`** (la costura de D-670).

### Mecanismo Ⓑ — `_notificar_dueño_prestador(uuid, text, text, text, text, jsonb)`

- Recibe `p_titulo`/`p_mensaje` **inline del trigger que lo llama** —
  español fijo, cero idioma.
- **Desde S88 (D-670, opción (b) firmada) ya consulta Ⓐ primero**: si
  `_voz_notificacion` devuelve voz, GANA; el inline quedó como PISO.
  `url_accion` se compone aparte y siempre (no es voz, es destino).
- Hoy **ninguno de sus 6 tipos tiene WHEN en Ⓐ** ⇒ el fallback inline
  está VIVO EN 6 DE 6 (coincide con el cinturón de D-670).

---

## 2 · DÓNDE VIVEN LAS SEIS INLINE (literal vivo, post-cura S88)

**Productores: DOS triggers** — los únicos callers de Ⓑ medidos.

### `trg_prestador_documentos_notif_cambio_estado` (2 voces)

| tipo | título inline | mensaje inline |
|---|---|---|
| `documento_aprobado` | «Documento aprobado» | «Tu {tipo_legible} fue aprobado.» |
| `documento_rechazado` | «Documento rechazado» | «Tu {tipo_legible} necesita revisión.» |

### `trg_prestadores_notif_cambio_estado` (4 voces)

| tipo | título inline | mensaje inline |
|---|---|---|
| `prestador_aprobado` | «¡Tu cuenta fue aprobada!» | «Ya puedes operar en e-PetPlace.» |
| `prestador_rechazado` | «Tu cuenta fue rechazada» | «Revisa el motivo en tu perfil.» |
| `prestador_en_revision` | «Necesitamos cambios» | «Hay observaciones sobre tu cuenta. Revísalas en tu perfil.» |
| `prestador_suspendido` | «Tu cuenta fue suspendida» | «Contacta a soporte para más información.» |

**Estado verificado en el vivo:** las seis en **tuteo** (la cura
`20260805340000` rige — «Ya puedes» · «Revisa» · «Revísalas» ·
«Contacta»; las dos de `documento_*` ya estaban bien, como la
corrección de A a su propio reporte lo dijo) · las seis **SOLO
español** · los seis tipos **en sombra** · audiencia `prestador`.

---

## 3 · QUÉ MECANISMO USA CADA TIPO (los 37 del catálogo vivo)

```
TOTAL 37 · fuera de sombra: 1 (plan_renovado) · activo=true: 37/37
```

| clase | tipos | voz |
|---|---|---|
| **Ⓐ con voz bilingüe (9)** | los 9 WHEN de §1 | es+en, idioma del destinatario |
| **Ⓑ inline (6)** | `documento_*` (2) + `prestador_*` (4) | SOLO es, tuteo |
| **Con productor y SIN voz (4)** | `sistema` (lo registran los dos `vencer_*`) · `alta_asistida_completada_por_cliente` (`_trg_completar_pendiente_registro`) · `alta_asistida_vencida_soporte` (`cleanup_pendientes_vencidos`) · `plan_renovacion_fallida` (`cerrar_y_renovar_planes` — **sin voz A PROPÓSITO**: nace CON la cura de D-669, jamás antes) | caerían al genérico de la Edge Function si salieran de sombra — por eso la regla L-207 los frena |
| **Sin productor (18)** | el resto — incl. los tres de cita de D-673 (`cita_confirmada` · `cita_recordatorio` · `cita_solicitada`) | no pueden salir: falta el HECHO |

**Corrección de ficha confirmada por medición:** D-667 daba
`cita_confirmada` con productor `fijar_fecha_procedimiento`; el body
vivo registra **SOLO `procedimiento_agendado`**. **Gana D-673**
(`cita_confirmada` SIN productor). *Mi primera pasada de regex también
dio corta (no veía `sistema` ni `alta_asistida_completada_por_cliente`
por estilo de llamada) — se re-midió con LIKE antes de afirmar: un
censo que depende del estilo de llamada da corto, L-170 en primo.*

---

## 4 · QUÉ FALTA DEL PAR es/en

- **Las 6 de Ⓑ**: la mitad **es** YA EXISTE, curada a tuteo (§2) — es
  candidata natural a mitad es de la voz firmada. La mitad **en** NO
  EXISTE en ningún lado: son **6 títulos + 6 mensajes en inglés** de
  escritura nueva, a la firma.
- **Las 4 con productor sin voz**: no tienen NI es NI en
  (`plan_renovacion_fallida` a propósito, D-669; las otras tres
  esperan el lote de voces de A).
- **Las 9 de Ⓐ**: par completo.

## 5 · QUÉ COSTARÍA UNIFICAR (medido, no adjudicado)

La unificación ESTRUCTURAL ya está hecha (D-670: una sola entrada, el
helper gana, el inline es piso, cero callers tocados). Lo que queda,
en tres pasos con su costo:

1. **Firma de las 6 voces bilingües** — de mesa/founder. 12 strings
   nuevos (6 títulos + 6 mensajes en en) + ratificar los 12 es vivos.
   *Cero código.*
2. **Una migración aditiva**: 6 WHEN nuevos en `_voz_notificacion`.
   Cero cambio de firma, cero callers tocados; el cinturón de D-670
   pasa de `6/6` a `0/6` **solo**, y con eso muere la condición de
   D-539 («UN mecanismo y las seis hablan los dos idiomas»).
3. **(Opcional — es la muerte de D-670, no de D-539)**: con el
   contador en 0, borrar `p_titulo`/`p_mensaje` de Ⓑ. Es **cambio de
   FIRMA** ⇒ L-119: DROP explícito + recrear, y reescribir los 6 call
   sites — que viven en SOLO 2 triggers (§2), los únicos callers
   medidos. Contenido: mediano, acotado, sin efecto en datos.

**Nota de disparo (ya escrita en D-539/D-670, vigente):** ninguno de
los seis tipos puede salir de sombra ANTES del paso 2 — no salen al
aire en un solo idioma.

---

## 6 · 🔴 HALLAZGO TRANSVERSAL — DOS ACENTOS ENTRE LOS DOS MECANISMOS (adjudicación de mesa)

**Medido en el body vivo de Ⓐ: 5 de sus 9 voces es VOSEAN** —
«Podés ver el detalle» (`plan_renovado`, `procedimiento_agendado`) ·
«Si no querés que siga, podés pausarlo» (`plan_renovacion_proxima`) ·
«Podés reservarlas» (`paquete_vence`) · «Coordiná las sesiones»
(`programa_vence`). **Y esa letra está FIRMADA** — D-667 verificó el
literal de `plan_renovado` con «Podés ver el detalle en la app»
adentro, por el camino real.

**Mientras que las 6 de Ⓑ están en TUTEO** — precisamente porque la
enmienda S88 de D-539 las curó citando L-148 (*la voz de producto es
tuteo neutro*, decisión founder S51).

> **⇒ Hoy el motor habla con DOS ACENTOS según el mecanismo — y los
> dos con firma que citar.** Es la clase exacta que este canon
> persigue: cualquiera cita la letra que le conviene y está «en
> regla». **No toco ninguna: la arbitra el founder** — o L-148 gana y
> las voces de Ⓐ se re-firman a tuteo, o el aviso del cliente vosea a
> propósito y ESO se escribe donde se lea. *(El mismo eje aparece en
> las voces de superficie del cliente — ver el lote de firma S89-D,
> decisión ①.)*

---

## 7 · LA RAMA «AUTORIZACIÓN» — BLOQUEADA Y DECLARADA (orden ③)

Sin cambios respecto de S88-D, re-verificado en el archivo vivo
(`apps/cliente/src/lib/destino-aviso.ts`): la lámina del cliente
nombra el destino `/autorizacion/[solicitudId]`, pero `AvisoDeCampana`
**no porta `solicitudId`** — mapear por otro campo sería adivinar.
**El dato es de A** (contrato del lector). El día que el lector lo
porte, la rama se agrega y su par con ella. La declaración vive como
cabecera del propio archivo — no se construyó nada encima.

---

**Origen: S89-D orden de apertura ① y ③ · medición 6-ago-2026.**
