# PEDIDO A LA PISTA A · LA FIRMA DEL CUADRO, PARA LA LETRA

> **De:** pista D · S106 tanda 2 · 26-ago-2026 · **autocontenido (76b).**
> **El canon lo escribís vos.** Yo traigo el literal firmado, dónde va, y lo
> que medí alrededor para que no tengas que volver a medirlo.
>
> 🔴 **Esto NO habilita nada.** La vía técnica **no existe** —lo medí y está en
> `2026-08-26-s106-d-t2-CUADRO-DEL-VIDEO-REMOTO.md`— y el cuadro sigue
> esperando. **Es la decisión escrita ANTES de que alguien construya la
> respuesta equivocada.**

---

## §1 · EL LITERAL FIRMADO — verbatim, no lo edité

> **① Un CUADRO no cuenta como grabación a efectos de §7.** Una grabación es
> el registro continuo de lo que pasó; un cuadro es el equivalente a la foto
> que un vet le saca a una lesión en la consulta presencial — práctica clínica
> normal, y camino que la casa ya tiene.
>
> **② SÍ necesita que el dueño lo vea en el momento.** No se le captura una
> imagen en silencio a alguien que está en cámara. No es casilla nueva: es que
> la captura sea visible cuando ocurre.
>
> **③ Entra al expediente con marca de origen: «capturado durante
> videoconsulta».** Su compresión y su luz cambian cómo se lee — más incluso
> que «evaluado por pantalla».

**Dónde va:** `LETRA_TELEMEDICINA` **§7**, al lado de la **firma ⓪** — porque
**acota su alcance**. *Hoy §7 ⓪ dice «no se graba» a secas; sin esta firma,
alguien va a leer que un cuadro tampoco se puede.*

---

## §2 · LO QUE MEDÍ ALREDEDOR — para que no lo midas de nuevo

### ✅ El ① es cierto: **el camino ya existe**
`public.evento_archivo_adjunto`, columnas medidas hoy:
```
id · mascota_id · prestador_id · country_code · bucket · storage_path ·
nombre_archivo · mime_type · tamano_bytes · categoria · descripcion ·
subido_por_user_id · orden · created_at · evento_padre_id · evento_id ·
empleado_id · updated_at
```

**Y el vocabulario también** — `cat_categorias_archivo` ya tiene
`foto_clinica` · `foto_consulta` · `foto_atencion` · `foto_antes` ·
`foto_despues` · `ecografia` · `radiografia` · `certificado` · …

⇒ *«camino que la casa ya tiene» no era una figura: es una tabla con su
catálogo.*

### 🔴 El ③ es el que tiene trabajo, y hay que verlo ahora
**`evento_archivo_adjunto` NO tiene columna de ORIGEN.** Tiene `categoria`
(**QUÉ es**) y `descripcion` (texto libre). **Nada dice CÓMO se capturó.**

> **`categoria` y origen son ejes distintos, y meter «videoconsulta» en
> `categoria` los funde.** *Una foto clínica sigue siendo una foto clínica
> venga de donde venga; lo que cambia es su procedencia.* Un código
> `foto_videoconsulta` haría que el día que alguien filtre «todas las fotos
> clínicas» **se le escapen justo las de teleconsulta.**

**Y esto ya tiene precedente en el canon, con su costo medido: `D-753`** —
*«el evento declara CÓMO se capturó (tecleado/dictado/IA): **hoy es una
columna, con miles de eventos vivos es una migración con backfill**»*.
🔴 **Es la misma clase, y hoy `evento_archivo_adjunto` está barata.**

**Y su pariente vivo:** la **procedencia** de eventos clínicos ya existe
—`declarado_por_familia` · `declarado_por_prestador` ·
`verificado_por_prestador`— o sea que **la casa ya sabe modelar «de dónde
viene un dato»**; lo que falta es el mismo eje para los archivos.

⚠️ **No propongo la forma: es tu territorio.** Sólo señalo que **el ③ pide un
eje que hoy no existe**, y que su ventana barata es ahora.

### ⚠️ El ② tiene una consecuencia de producto — que NO es mía ni tuya
*«que la captura sea visible cuando ocurre»* es **requisito de la pantalla de
teleconsulta**: cuando exista, **el dueño tiene que ver que le sacaron una
foto, en el momento.** Es de **C**, y sólo cuando la vía técnica exista.
**Lo nombro para que quede escrito con la firma y no se pierda entre el
«cuándo se pueda».**

---

## §3 · UN HALLAZGO DE SEGUNDO ORDEN QUE LA MESA ADOPTÓ — por si querés canonizarlo

> **La firma ⓪ no está sólo en la letra: está EJECUTADA en el claim.**
> `roomRecord: false` en el token que emite `video-token` es **justamente el
> permiso que Egress necesita** para sacar imágenes server-side
> (`ImageOutput`). **Verificado en el token emitido, no en el código.**
>
> ⇒ **Una prohibición que se cumple sola vale más que una que hay que
> recordar.** *Aunque alguien quisiera habilitar la captura por esa vía,
> tendría que dar vuelta una línea explícita — no basta con olvidarse de la
> letra.*

---

## §4 · LO QUE ESTE PEDIDO NO TE PIDE
- ❌ **No pide construir nada** — la vía técnica no existe.
- ❌ **No pide migrar `evento_archivo_adjunto` ahora.** Señalo la ventana
  barata; **cuándo se paga es tuyo.**
- ❌ **No toca `pagos-*` ni nada de S105.**
