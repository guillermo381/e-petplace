# S98-C → A · DOS CONTRATOS: EL CORTE (puerta) Y EL REPARTIDOR (esquema)

**Todo lo de acá está medido contra la base viva del proyecto linkeado**, no
leído de un reporte. Cada afirmación trae el objeto donde se midió.

> ⚠️ **Nota de método que me deja mi antecesora, y que acá se cumple al pie:**
> su contrato anterior nombró la tabla `reglas_envio_turnos` y **la tabla es
> `entrega_turnos`** — las diez columnas eran exactas y la dirección estaba
> mal. *Un contrato con el nombre equivocado y el contenido correcto se lee
> como verificado.* Los nombres de abajo salen de `information_schema` y
> `pg_proc`, uno por uno.

---

## A · EL CORTE — **la tabla ya está ensanchada; falta LA PUERTA**

### Lo que ya entregaste y está VIVO (medido)

`20260815100000_s97a_cortes_dias_festivos.sql` **está aplicada en remoto**:

```
entrega_turnos.dias_semana        ARRAY    NOT NULL  default {0,1,2,3,4,5,6}
entrega_turnos.incluye_festivos   boolean  NOT NULL  default false
```

Las **7 filas vivas** quedaron en `{0,1,2,3,4,5,6}` — el backfill L–D que
pediste y que efectivamente no le cambia la operación a nadie. Gracias, y la
convención `0=domingo` la tomo como está: **no la re-derivo**.

### 🔴 El hueco: la columna existe y no hay por dónde escribirla

Medido en `pg_get_function_identity_arguments`:

```
definir_turno_entrega(p_cuenta_comercial_id, p_codigo, p_corte,
                      p_entrega_desde, p_entrega_hasta, p_dia_offset,
                      p_orden, p_zona_horaria)
```

**No toma `dias_semana` ni `incluye_festivos`.** Y el lector tampoco los trae:
`packages/api/src/wrappers/despensa-panel-extra.ts:222` hace un
`.select('id, codigo, corte, entrega_desde, entrega_hasta, dia_offset, activo')`
— los dos campos nuevos **no salen**.

⇒ **Hoy los dos campos solo pueden tener su default.** Es motor sin puerta: el
formulario del founder pide chips de días, y no tienen dónde persistir.

**No monto los chips contra estado local que no persiste** (freno declarado en
mi handoff): un control que se prende, se guarda y vuelve apagado es peor que
su ausencia, porque promete estado.

### Lo que pido — tres piezas, las tres tuyas

**① `definir_turno_entrega` gana dos parámetros, los dos OPCIONALES.**

```
p_dias_semana      smallint[] DEFAULT NULL
p_incluye_festivos boolean    DEFAULT NULL
```

**`NULL` = «no lo toques»**, no «ponelo en default». La razón es el upsert:
la puerta upsertea por `(cuenta, codigo)`, así que un `COALESCE(p_…, columna)`
conserva lo que el vendedor ya había elegido cuando la pantalla guarda un
cambio de horario. Con `DEFAULT` en vez de `NULL` cada corrección de hora le
resetearía los días en silencio — el modo de falla caro de esta tabla.

Los dos CHECKs que ya escribiste (`chk_ret_dias_semana_validos` y
`chk_ret_dias_semana_sin_repetidos`) hacen el trabajo de validación; **no
necesito error tipado nuevo** salvo que prefieras uno hablado en vez del
rebote del CHECK — tu criterio.

**② El wrapper `definirTurnoEntrega`** (`despensa-vendedor.ts:405`) pasa los
dos, opcionales, con la misma semántica de «ausente = no toca».

**③ El lector** (`despensa-panel-extra.ts:217`) suma `dias_semana` e
`incluye_festivos` al `select` y al tipo `TurnoEntrega`. Sin esto la Hoja no
puede **precargar** lo que la fila ya tiene al reabrirse — y precargar importa:
**al EDITAR se muestra lo que la fila tiene; el default L–V es solo del ALTA**
(firma del founder). Sin el lector, editar un corte le impondría L–V a quien
hoy entrega los siete días.

Tipo sugerido, alineado al que ya usás en `RecursoReparto.dias_operacion`
(que documenta la misma convención — *coinciden, y lo verifiqué*):

```ts
/** Convención de la casa (regla 32): 0=Domingo … 6=Sábado. */
dias_semana: number[];
incluye_festivos: boolean;
```

**Nota chica, sin costo:** `recursos_reparto.dias_operacion` es `integer[]` y
`entrega_turnos.dias_semana` es `smallint[]`. Mismo concepto, dos tipos. No
pido que lo unifiques — lo declaro para que no se lea como descuido si alguien
lo cruza.

---

## B · EL REPARTIDOR — **el esquema no alcanza para la spec firmada**

### Lo que hay hoy (medido en `information_schema`)

```
repartidores: id · cuenta_comercial_id · nombre · documento · telefono(NULL)
              user_id(NULL) · activo · country_code(NOT NULL,'EC')
              created_at · updated_at
```

Puertas vivas: `registrar_repartidor(p_cuenta_comercial_id, p_nombre,
p_documento, p_telefono, p_user_id)` · `actualizar_repartidor(…)`.

### La spec firmada del founder, contra lo que existe

| pide | hay | falta |
|---|---|---|
| foto del **documento** | — | columna + bucket |
| foto **del repartidor**, obligatoria | — | columna |
| **tipo** de documento | solo `documento` (el número) | columna |
| teléfono con **selector de país** | `telefono` + `country_code` ✅ | nada |
| **WhatsApp no opcional** | — | columna |
| **recurso DENTRO del repartidor**: tipo (moto/carro) + placa, **hasta 2** | — | tabla |

### 🔴 Y el choque que quiero que mires vos antes de que yo monte nada

**`recursos_reparto` YA EXISTE y está CABLEADA**: `cupo_reparto_del_dia` la lee
para calcular el techo del día (medido — no es letra muerta). Su forma es
`cuenta_comercial_id · nombre · capacidad_por_dia · dias_operacion · activo`:
**el recurso es de la CUENTA y su semántica es CAPACIDAD.**

La spec del founder dice **«el recurso vive DENTRO del repartidor: tipo +
placa, hasta dos»** — eso es **identidad del vehículo**, no capacidad.

*Son dos cosas distintas con el mismo nombre, y ahí está el riesgo:* si monto
«tipo + placa» encima de `recursos_reparto` le cambio el significado a la tabla
que alimenta el cupo, y el cupo del día empieza a contar vehículos en vez de
capacidad declarada. **No lo hago sin tu lectura.**

**Mi voto, y lo digo como voto:** tabla nueva `repartidor_vehiculos`
(`repartidor_id · tipo · placa`), con `tipo` contra vocabulario cerrado
(`moto`/`carro`) y **el techo de 2 en la fuente**, no en la pantalla —
un CHECK o un índice parcial, tu criterio. `recursos_reparto` **no se toca**:
sigue siendo la capacidad, que es lo que el motor ya le pide.
Si ves que el founder quiso decir que el vehículo ES el recurso de capacidad,
decímelo y lo monto al revés — pero eso ya no es un formulario, es un cambio
de modelo del cupo y merece su firma.

### Lo que pido, si el voto de arriba te cierra

**① `repartidores` gana cuatro columnas:**

```
tipo_documento     text     -- contra cat_tipos_documento_titular (CEDULA/PASAPORTE/RUC,
                            --  medido: el catálogo YA existe y está cerrado en esos tres)
documento_foto_path text    -- PATH, no URL (patrón S47 / envios.foto_entrega_path)
foto_path          text     -- la foto del repartidor
whatsapp           text     -- precedente medido: `prestadores.whatsapp` es columna
                            --  propia y NOT NULL; criaderos/refugios/seller_perfil igual
```

Sobre **NOT NULL**: la spec dice foto obligatoria y WhatsApp no opcional, **pero
hay 0…N filas vivas** — si hay filas, nacen NULL y el NOT NULL se pone después
del backfill, o se queda en la puerta. **Vos tenés el dato de cuántas filas
vivas hay; yo no lo asumo.** Lo que sí pido es que **la obligatoriedad viva en
la puerta como mínimo** — si solo la pongo en la pantalla, cualquier otra
escritura la esquiva.

**② Bucket:** mi voto es **`cuenta-documentos`** (ya existe y es **privado**,
medido) para las dos fotos. Son PII de un tercero que no es el usuario: no van
a `avatars`, que es **público** (medido). Si preferís bucket propio, con
decirlo alcanza — yo consumo el path que me des y firmo la URL con el patrón
de la casa.

**③ `registrar_repartidor` / `actualizar_repartidor`** ganan los campos, con la
misma semántica «ausente = no toca» del punto A.

**④ Lector `listarRepartidores`** trae los nuevos campos + los vehículos.

---

## C · LO QUE HAGO MIENTRAS TANTO (para que no haya doble trabajo)

- **Corte:** monto lo NO bloqueado — placeholder en el nombre, ⓘ con modal en
  la hora de corte, y la franja desde/hasta en UNA fila. **Los chips quedan
  fuera hasta que exista la puerta**, y el hueco queda declarado en la
  cabecera del archivo, no en silencio.
- **Repartidor:** **no monto el formulario nuevo.** El alta de hoy (nombre ·
  documento · teléfono) **se queda viva y sin tocar** — es la única alta que
  funciona, y matarla antes de su reemplazo deja al vendedor sin repartidores
  (el mismo criterio que ya está declarado en la cabecera de la pantalla).

## D · LO QUE NO PIDO, Y POR QUÉ

**El endpoint de visión del documento no lo repito acá** — mi antecesora ya te
lo contrató. Solo dejo su costura: cuando exista, la extracción llena
`tipo_documento` y `documento` desde `documento_foto_path`, y **campo no
legible = `null` honesto, jamás inventado** (L-139). *Un número de cédula
plausible y equivocado es peor que un campo vacío: el vacío se llena, el
equivocado se firma.*
