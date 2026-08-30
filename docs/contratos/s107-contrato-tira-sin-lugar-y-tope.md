# CONTRATO · LA TIRA SIN LUGAR, EL TOPE FUERA DEL FLUJO, Y «LO QUE INCLUYE»

> **Nace:** 31-ago-2026, de tres pedidos de C. **Migración:**
> `20260831120000_s107a_dias_sin_lugar_y_tope_del_texto.sql` — aplicada,
> cinturón **4/4**.

---

## ① LA TIRA SIN LUGAR ELEGIDO

```ts
obtenerDiasGuarderiaDisponibles({ mascotaId, desde, hasta, modalidad?, lat?, lon? })
  → DiaGuarderiaAgregado[]   // { fecha, lugares, yaReservado, reservable, motivo }
```

**Un día es reservable si ALGÚN lugar puede.** `lugares` dice cuántos.

`motivo ∈ 'fecha_pasada' | 'ningun_lugar_abre' | 'mascota_ya_reservada_ese_dia' | 'sin_cupo'`

🔴 **`ningun_lugar_abre` y `sin_cupo` son códigos distintos a propósito:** ante
el primero la familia elige otro día, ante el segundo puede esperar.
*Deducir cualquiera de los dos de `lugares === 0` los confunde* — y el primero
es exactamente el caso del fin de semana en un lugar que abre L-V.

⚠️ **Corre sobre la MISMA cadena que la lista de lugares** —ofertas cobrables,
cupo, día operativo, geo— para que **la tira y la lista no puedan discrepar**.
*Reimplementar el criterio habría fabricado una segunda verdad sobre qué día
sirve.*

**Medido, 14 días:** `14 filas · 7 reservables · 3 ningun_lugar_abre`.

**`obtenerDiasGuarderia` (por prestador) sigue viva y sin tocar** — es la de
después de elegir lugar, y ahí sí hay capacidad y cupo de ESE lugar.

---

## ② EL TOPE SALIÓ DEL FLUJO — el acto único ya no rebota

**El bloqueo era real:** `aceptar_documentos_guarderia` exigía el tope y la
pantalla ya no lo pide ⇒ rebotaba `tope_de_urgencia_invalido` y **ninguna
familia nueva podía aceptar**.

```ts
// el acto único, completo:
aceptarDocumentosGuarderia({ familiaId })
```

**Todo lo demás es opcional.** `aceptaciones` omitido = el servidor resuelve los
vigentes. `urgenciaTopeMonto` omitido = **el del documento vigente**.

🔴 **Omitir el tope NO es «sin tope»: es «el que dice el documento que aceptó»**
— hoy USD 150. Y es lo correcto, porque *cualquier número que mandara la
pantalla sería una autorización que la familia no dio.*

⚠️ **Mandar un número explícito es la familia editándolo**, y se guarda.
**Volver a aceptar sin número NO se lo borra** (medido: explícito 400 → acto sin
tope → sigue en 400). *Volver a aceptar los documentos no es motivo para borrar
una decisión que tomó aparte.*

**El retorno cambió:** `{ aceptadas, alDia, faltantes }`.
🔴 **La pantalla lee `alDia`, no `aceptadas`** — *un contador no es un
veredicto.*

📌 El número vive como dato en `app_config.guarderia_tope_urgencia_usd = 150`
para la pantalla del prestador, **y el cinturón exige que el documento vigente
lo contenga**: cambiar la clave sin publicar una versión nueva del texto **aborta
la migración que lo intente**. *Dos lugares que dicen el mismo número se separan
en silencio; dos lugares con un guard que los compara, no.*

---

## ③ «LO QUE INCLUYE» — NO EXISTE. Se cae del flujo.

**Censado, y no hay fuente:**

| dónde busqué | resultado |
|---|---|
| columnas con `incluye` en todo el schema | `criadero_camadas.incluye` y `entrega_turnos.incluye_festivos` — **de otros dominios** |
| las 14 tablas `guarderia_*` | **ninguna** tiene nada parecido |
| `LETRA_GUARDERIA` · `BRIEF` · `PLAN` | **cero menciones** de «lo que incluye» |
| `prestador_servicios.descripcion` | existe, es **texto libre genérico** — y está **vacío en la única oferta de guardería viva (0 de 1)** |

⇒ **No hay fuente estructurada, la letra nunca la pidió, y el único campo
parecido no lo llena nadie.** *Poner ahí un texto de la casa sería e-PetPlace
prometiendo en nombre del prestador lo que ese prestador no declaró.*

**Se cae del flujo y queda declarado.** Si el founder lo quiere, es letra nueva:
qué ítems, quién los declara, y si son catálogo o texto libre — **no es un campo
que falte, es una decisión que no se tomó.**
