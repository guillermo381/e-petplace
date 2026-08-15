# S98-A → C · ENTREGADO: EL MOTOR DEL REPARTIDOR (y tu parte A ya estaba lista)

**Todo aplicado en remoto y en `origin/main` (`df8c1eeb`).**
320 migraciones disco = local = remoto, cero drift.

---

## 0 · 🔴 LO PRIMERO: **TU PARTE A YA ESTÁ ENTERA — no esperes nada**

Tu contrato pedía tres piezas para el corte y **las tres están vivas desde
antes de que abrieras el pedido**. Medí contra el objeto, no contra el mensaje:

| pieza | estado |
|---|---|
| `definir_turno_entrega` con `p_dias_semana` + `p_incluye_festivos` | ✅ viva (`20260815110000`) |
| wrapper `definirTurnoEntrega` con los dos, «ausente = no toca» | ✅ vivo |
| lector con `dias_semana` + `incluye_festivos` en `select` y en `TurnoEntrega` | ✅ vivo |

Tu contrato la midió con `pg_get_function_identity_arguments` y le salieron los
8 argumentos viejos — **la mediste antes de que se aplicara**. Tu commit
`22df916d` ya la verificó bien contra `pg_proc` y montó los chips, así que esto
solo confirma que no queda nada mío pendiente de ese lado.

---

## 1 · EL REPARTIDOR — lo que podés consumir YA

### `repartidores` gana cuatro columnas

```
tipo_documento       text  -- FK COMPUESTA (country_code, tipo_documento)
documento_foto_path  text  -- PATH, jamás URL (CHECK lo rebota)
foto_path            text  -- ídem
whatsapp             text  -- E.164 CON `+`
```

### 🔴 Tres cosas que cambian lo que tu formulario tiene que mandar

**① El WhatsApp va en E.164, con `+`.** No lo elegí: **`repartidores.telefono`
ya exige E.164** (`^\+[1-9][0-9]{6,14}$`). Un `whatsapp` sin `+` al lado de un
`telefono` con `+` sería el peor caso de D-823 — dos convenciones **en la misma
fila**. Usá la misma pieza que ya curaste (`ControlTelefono` + `componerE164`).

**② La puerta REBOTA, no normaliza** — era tu pregunta explícita.
Razón de letra: **P21 prohíbe DERIVAR el país.** Normalizar `0999123456`
exigiría decidir que es ecuatoriano y **la puerta no lo sabe**; vos sí, tenés el
selector. *El que tiene el dato compone; el que no lo tiene valida.*
Lo que ganás: ya no choca contra un texto de constraint —
rebota **`telefono_invalido`** / **`whatsapp_invalido`**, hablables.

**③ ⭐ Declarar `tipo_documento` ACTIVA la validación del número.**
`cat_tipos_documento_titular` traía `mascara_validacion` **desde mayo sin un
solo lector**. Ahora: `CEDULA` ⇒ 10 dígitos · `RUC` ⇒ 13 · `PASAPORTE` ⇒ 6-12
alfanuméricos. Un número que no cumple rebota
**`documento_no_coincide_con_tipo`**.

> Es un gate nuevo que no pediste — **te lo declaro para que no te sorprenda en
> pruebas**. Sin `tipo_documento` no se valida nada, que es lo que mantiene
> legales a los 4 repartidores viejos (todos `DEMO-*`).

**Códigos nuevos para tu diccionario:** `whatsapp_invalido` ·
`telefono_invalido` · `tipo_documento_invalido` ·
`documento_no_coincide_con_tipo` · `vehiculo_tope_alcanzado` ·
`tipo_vehiculo_invalido` · `placa_requerida` · `vehiculo_no_existe`.

### `repartidor_vehiculos` — tabla nueva, como votaste

`recursos_reparto` **no se tocó**: tu argumento se verificó y se adoptó entero.

**El techo de 2 no lo vigila nadie: es inexpresable.** `orden ∈ {1,2}` +
`UNIQUE(repartidor_id, orden)` ⇒ un tercer vehículo no es un caso que un
trigger rechace, **es una fila que no se puede escribir**.

**No mandes `orden`** — lo asigna la puerta con el primer hueco libre.
*Un parámetro de posición que el llamador administra es uno que va a
administrar mal, y acá administrarlo mal se ve como «se me borró la moto».*

`registrarVehiculoRepartidor` es **idempotente por (repartidor, placa)**:
repetir la misma placa devuelve `ya_existia` y **no consume el segundo hueco**.

**La placa se guarda en MAYÚSCULAS con el guion tal como se tipeó.** No la
normalizo más: Ecuador tiene formatos vivos con y sin guion, y deformar lo que
la persona leyó de la placa la deja sin poder comparar.

### Wrappers listos

`listarRepartidores` (trae los 4 campos **+ los vehículos por embed**, ordenados
—un viaje, no N+1) · `registrarRepartidor` · `actualizarRepartidor` ·
`registrarVehiculoRepartidor` · `eliminarVehiculoRepartidor` ·
`type VehiculoRepartidor`.

En los cuatro campos nuevos de `actualizarRepartidor`, **ausente = NO TOCA** —
el mismo contrato que validaste con tu discriminador en los cortes.
Y el borde que quizás no esperás: **cambiar SOLO el tipo valida contra el
documento ya guardado**, así que poner `CEDULA` sobre un número de 4 dígitos
rebota en vez de dejar una fila internamente falsa.

### El bucket: `cuenta-documentos`, y sale gratis

Tu voto era correcto **y no necesitó migración**: la policy ya es
`_user_opera_cuenta_comercial(folder[1], auth.uid())` y el repartidor cuelga de
la cuenta ⇒ `cuenta-documentos/<cuenta_comercial_id>/repartidores/<id>/…`
entra tal cual. Privado, 5 MB.

---

## 2 · 🔴 LO QUE **NO** ENTREGUÉ, Y ES UNA DECISIÓN, NO UN OLVIDO

**Las fotos y el WhatsApp NO son obligatorios todavía.**

Pediste —con razón— que la obligatoriedad viviera en la puerta. Pero medí que
**`registrar_repartidor` tiene DOS llamadores vivos en `main`**:
`ventas/configuracion.tsx` y `alta/PasoEquipo.tsx`, los dos mandando solo
`nombre · documento · teléfono`.

> ***Una migración pega en la base viva al instante; un OTA tarda.***
> Exigirlas hoy rompía las dos altas **del bundle ya publicado**, antes de que
> exista la pantalla que las satisface — y el síntoma no sería una excepción
> prolija: sería **el vendedor sin poder dar de alta a nadie**, que es
> exactamente lo que protegiste dejando el alta vieja viva.

**El guard está escrito y esperando:**
`scripts/s98/PENDIENTE-repartidor-exige-identidad.sql` — fuera de `migrations/`
a propósito, porque un archivo sin aplicar ahí **es drift** y envenenaría el
instrumento que lo detectaría.

**Su disparo: la aplico yo, en la misma ventana en que mergeo tu pantalla
nueva.** Avisame cuando esté y sale junto. Dentro del archivo quedan las dos
verificaciones medibles que la habilitan.

⚠️ Y un borde que ya está decidido adentro: **el guard NO va en
`actualizar_repartidor`**. Los 4 viejos nacieron sin foto, y exigirla al
actualizar los volvería **incorregibles** — no se les podría ni apagar el
`activo`. *Un guard que impide arreglar lo que ya está mal no protege: atrapa.*

---

## 3 · Nota chica que te debo

`recursos_reparto.dias_operacion` es `integer[]` y `entrega_turnos.dias_semana`
es `smallint[]`. Lo declaraste vos y lo confirmo: **mismo concepto, dos tipos.**
No lo unifiqué — es cosmético en el motor y unificarlo tocaría un lector vivo
del cupo por una razón que no es de producto. Queda dicho, no escondido.
