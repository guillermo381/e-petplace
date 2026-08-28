# S107 · CONTRATO — DOCUMENTOS, ACEPTACIONES Y ACTAS (pista A → C, D, B)

> **Publicado:** 28-ago-2026, **antes de que exista la migración** (regla S106: los artefactos que otra pista debe medir se publican aunque no estén para main).
> **Estado:** 🟡 **CONTRATO, no motor.** Los nombres están fijados y **no se mueven sin avisar acá**; los cuerpos los escribe A.
> **Fuentes:** `PLAN_S107_GUARDERIA` §4.9 y §4.10 (+ firmas ⑤ ⑥ ⑦) · **`CRITERIO_LEGAL_GUARDERIA` §4** (la arquitectura de firmas y actas) y **§3 prohibición 5** (el contacto alternativo) · `BRIEF_S107` §0 (el perímetro).
> **Desbloquea:** **D entero** (el acta es su primer consumidor de media) y el camino de contratación de **C**.

---

## ⓪ LA LÍNEA QUE ORDENA TODO EL DOCUMENTO

> ### 🔴 **ACÁ SE CONSTRUYE EL ESTANTE. EL LIBRO LO ESCRIBE LA MESA.**

**Ninguna pista redacta texto legal** — ni una cláusula, ni un resumen, **ni un placeholder en pantalla** (`BRIEF_S107` §0 · plan §0). Los documentos son **filas versionadas cuyo `contenido` llega de la mesa**, y hasta que llegue:

> ### 🔴 **COMPUERTA FAIL-CLOSED: sin documentos cargados y vigentes, la reserva de guardería NO SE ABRE.**

*Es el mismo criterio que «sin desglose no hay cobro».* **Y es lo correcto, no una molestia:** una custodia que arranca sin contrato firmado es exactamente el hueco que el memo del abogado dejó al descubierto.

⚠️ **Consecuencia para C, dicha antes de que la descubra construyendo:** hasta que la mesa cargue los textos, **el camino de reserva rebota `documentos_no_disponibles`**. La pantalla lo dice honesto —*«estamos terminando de preparar este servicio»*— y **jamás inventa un texto para poder seguir**.

---

## ① LOS DOCUMENTOS — versionados, y el texto es un DATO

```
guarderia_documentos
  codigo         text     -- vocabulario CERRADO (abajo)
  version        integer  -- 1, 2, 3…  monótona por codigo
  contenido      text     NOT NULL   -- 🔴 lo escribe la MESA, jamás una pista
  vigente_desde  timestamptz NOT NULL
  activo         boolean NOT NULL DEFAULT true
  PRIMARY KEY (codigo, version)
```

**El vocabulario, que sale de `CRITERIO_LEGAL_GUARDERIA` §4 y no se amplía de paso:**

| `codigo` | qué es |
|---|---|
| `contrato_custodia` | el contrato **dueño ↔ guardería**. 🔴 **e-PetPlace lo aloja, lo conserva y lo exhibe — NO lo firma** (regla madre del criterio §4) |
| `declaracion_sanitaria` | carnet vigente — **obligatorio por Res. 121** |
| `declaracion_comportamiento` | *el documento que decide quién responde en una mordida* |
| `autorizacion_urgencia_veterinaria` | con **tope de gasto y cadena de contactos como DATOS** (§②) |
| `autorizacion_transporte` | puerta a puerta |
| `protocolo_no_retiro` | 🔴 **se firma ACÁ y no en el momento crítico** |

> ⚠️ **`protocolo_no_retiro` es la única entrada de §6 en toda la sesión, y es una FILA, no un motor.** Se acepta al contratar; **nada de lo que describe se construye** — sin conteo, sin avisos de mora, sin camino a refugio (perímetro §0). *La firma existe para que el día que el caso ocurra, soporte tenga con qué operar.*

**Versionar en vez de editar, y por qué importa acá más que en otros lados:** en una disputa la pregunta es *qué aceptó esta familia*, y la respuesta tiene que ser **el texto exacto de ese día**. *Un documento que se edita en su lugar borra la respuesta.*

---

## ② LA ACEPTACIÓN — una vez por familia, con sus DATOS al lado

```
guarderia_aceptaciones
  familia_id        uuid
  documento_codigo  text
  documento_version integer
  aceptado_en       timestamptz NOT NULL DEFAULT now()
  aceptado_por      uuid NOT NULL       -- el user de la sesión
  PRIMARY KEY (familia_id, documento_codigo, documento_version)
  FOREIGN KEY (documento_codigo, documento_version) → guarderia_documentos
```

**Se acepta UNA vez.** Sólo se vuelve a pedir **si el documento cambia de versión** — y entonces se pide **sólo el que cambió**, no los seis.

```
guarderia_autorizaciones_familia          -- los DATOS que viajan con la aceptación
  familia_id             uuid PRIMARY KEY
  urgencia_tope_monto    numeric NOT NULL CHECK (> 0)
  urgencia_tope_moneda   text NOT NULL
  contactos              jsonb NOT NULL   -- la cadena, en orden
  contacto_alternativo   jsonb            -- nullable: puede no haber
  redes_autorizadas      boolean NOT NULL DEFAULT false
  actualizado_en         timestamptz NOT NULL DEFAULT now()
```

🔴 **El `contacto_alternativo` NO es un dato de comodidad: es la prohibición 5 del criterio §3 hecha columna** — *«entregarlo a cualquier persona distinta del dueño o del contacto alternativo autorizado»* es causal de terminación del prestador. **La app tiene que poder decir en la puerta quién puede recibir al animal**, y por eso el acta lo muestra (§④).

🔴 **`redes_autorizadas` nace en `false` y es REVOCABLE.** Es **otro tratamiento con otra finalidad** (criterio §5 capa 4): el consentimiento del servicio **no lo ampara**. **Nunca pre-marcada**, nunca inferida, nunca «se activa al aceptar el contrato».

> ⚠️ **Para B:** el toggle de redes es el estándar del sistema y va **apagado**. **Para C:** si el dueño lo apaga después, **se apaga y punto** — no hay diálogo de confirmación que lo desanime. *Un consentimiento que cuesta más retirar que dar no es un consentimiento.*

**La compuerta:**

```
evaluar_documentos_guarderia(p_familia_id uuid) RETURNS jsonb
  -- { estado: 'al_dia' | 'faltan' | 'documentos_no_disponibles',
  --   faltantes: [ { codigo, version } ] }
```

**`documentos_no_disponibles` es un tercer estado a propósito, y no es un detalle:** *«la familia no aceptó»* y *«la casa todavía no cargó el texto»* son cosas distintas, y **mandarle al dueño a aceptar algo que no existe es peor que decirle la verdad.**

**Wrappers:** `obtenerDocumentosGuarderia()` (los vigentes, con su texto) · `aceptarDocumentosGuarderia({ familiaId, aceptaciones[], autorizaciones })` **en una sola transacción** · `evaluarDocumentosGuarderia(familiaId)`.

---

## ③ EL ACTA — el registro que vale más que el contrato

> **Literal del criterio §4:** *«en el litigio típico la pregunta es CUÁNDO apareció la lesión, y sin foto de entrada esa pregunta no tiene respuesta — y la carga cae sobre quien tenía al animal.»*

```
guarderia_actas
  id              uuid pk
  estadia_id      uuid NOT NULL REFERENCES guarderia_estadias(id)
  direccion       text NOT NULL CHECK (direccion IN ('recogida','devolucion'))
  levantada_por   uuid NOT NULL          -- quien recoge / quien entrega
  carnet_verificado boolean NOT NULL     -- «lo tuve a la vista»
  objetos         text                   -- qué viaja con el animal
  observaciones   text
  cerrada_en      timestamptz NOT NULL DEFAULT now()
  -- la conformidad del dueño (§④)
  conformidad     text NOT NULL DEFAULT 'sin_conformidad'
                  CHECK (conformidad IN ('sin_conformidad','conforme','con_reserva'))
  conformidad_en  timestamptz
  reserva_texto   text
  UNIQUE (estadia_id, direccion)         -- un acta por dirección, y una sola
```

**Las fotos del estado NO viven acá: son media** (`guarderia_media`, contrato hermano) **etiquetada con el animal de la estadía**. *Una foto es una foto en los dos lados; duplicar el esquema para el acta habría producido dos formas de guardar lo mismo.*

🔴 **CERRADA NO SE EDITA.** El acta nace cerrada (`cerrada_en` al insertar) y un trigger rechaza todo `UPDATE` **salvo** el bloque de conformidad. *Un registro que la parte que lo levantó puede reescribir después no prueba nada — y éste existe exactamente para probar.*

**La reserva del dueño es SU CAMPO PROPIO, no una edición** del acta del prestador: las dos versiones conviven, con fecha, y **eso es lo que hace utilizable el registro en una disputa**.

---

## ④ LA CONFORMIDAD — la sesión del dueño, jamás su dedo

> ### 🔴 **NADA DE DIBUJAR FIRMAS EN EL TELÉFONO DEL CUIDADOR: CUALQUIERA GARABATEA; UNA SESIÓN PROPIA, NO.**

**El circuito, firma ⑥ del plan:**

1. **El prestador levanta el acta** en su app, en la puerta.
2. **Al dueño le llega en SU app** y toca **«Conforme»** → sesión autenticada + sello de tiempo = **firma electrónica simple, suficiente por Ley 67** (criterio §4).
3. **Si no confirma en el momento, el acta queda con `sin_conformidad` — y LA RECOGIDA NO SE FRENA.**

⚠️ **Ese último punto es el que suele romperse al construir:** la tentación es bloquear hasta la confirmación. **No.** *Un animal esperando en la puerta mientras alguien busca el teléfono es peor que un acta sin conformar* — y `sin_conformidad` **es un HECHO con fecha, no una sentencia**: qué significa legalmente es la reescritura de §3 y es de la mesa.

**Wrappers:** `levantarActaGuarderia({ estadiaId, direccion, carnetVerificado, objetos?, observaciones?, mediaIds[] })` · `confirmarActaGuarderia({ actaId, conformidad, reservaTexto? })` — **el segundo sólo lo puede llamar la familia de esa mascota**, gateado en el server.

---

## ⑤ LO QUE ESTE CONTRATO **NO** CUBRE

- **El texto de ningún documento** — de la mesa (§⓪).
- **El protocolo de mora** — no se construye (perímetro §0).
- **La verificación física del carnet** — es del prestador **en el acta** (`carnet_verificado`), no de la app. *La app transporta el papel y lo deja verificable en la puerta; no valida un documento que no puede leer.*
- **El esquema de media** — contrato hermano (`s107-contrato-media-durante.md`).
