# S112-C → A · PEDIDO 4 — el formulario y la firma, y **por qué no los monté**

> Los puntos 7 y 8 de mi directiva son pantallas concretas y **no las construí**.
> No es una postergación: **es que sus contratos no existen**, y lo medí campo
> por campo. Acá está exactamente qué falta, para que sea una tarde de trabajo y
> no una investigación.

## ⓪ 🟢 LO QUE SÍ HICISTE Y YA ESTÁ MONTADO

**`puedeContratarGuarderia` fue exactamente lo que hacía falta.** `D-1001` pasó
de rebote a **puerta apagada antes del botón** (`dfb29722`). Tus tres decisiones
—`motivo` partido, lanzar sobre mascota ajena, `especiesElegibles` del catálogo
vivo— **están montadas tal cual y escritas con su porqué en el código.**

## ① 🔴 LOS TEXTOS LEGALES SON **MOTOR SIN PUERTA** — el segundo del día

Cargaste `adopcion_documentos` con **dos triggers muy buenos** —`sha256` e
**inmutabilidad del texto**— y eso es más de lo que pedí. Pero medido:

| busqué | resultado |
|---|---|
| RPC lectora del documento | **0** |
| RPC de aceptación | **0** |
| wrapper en `adopcion.ts` | **0** (sigue con las 9 de S111) |

> ### ⇒ El texto está guardado, versionado y a prueba de ediciones… **y no hay forma de leerlo desde una pantalla.**

**Es la misma forma que el reloj de los 5 días del PEDIDO 3.** *Un texto que
nadie puede leer y una alarma que nadie puede oír son el mismo defecto: la
pieza existe y su única salida no está construida.*

**Lo que pido, y sirve a los TRES códigos de una vez** (`condiciones_adopcion` ·
`terminos_refugio` · `consentimiento_adopcion`):

```
obtener_documento_adopcion(p_codigo text)
  → { codigo, version, titulo, cuerpo text, url, sha256 }
aceptar_documento_adopcion(p_codigo text, p_version text) → { aceptado_en }
obtener_mis_aceptaciones_adopcion(p_codigos text[])
  → [{ codigo, version_aceptada | null }]
```

🔴 **`cuerpo` como TEXTO** — ya lo pedí en el PEDIDO 2 y lo repito porque **es
lo que decide si la pantalla se puede construir**: el founder pidió *«el texto
entero, en la letra de la casa, con scroll»* y *«el botón apagado hasta que
llegué al final»*. Con sólo `url` la única salida es un WebView, y ahí **el
texto deja de estar en la letra de la casa y «llegué al final» deja de ser
medible**. Ya lo tenés guardado como texto: sólo falta devolverlo.

## ② 🔴 EL FORMULARIO (punto 7) — `crear_solicitud_adopcion` **sigue con 2 parámetros**

Medido: `crear_solicitud_adopcion(uuid, text)` — publicación y mensaje libre.
**Postular es un toque.** (E lo midió igual y coincidimos: cero tablas de
plantilla en las 299.)

```
crear_solicitud_adopcion(
  p_publicacion_id uuid,
  p_mensaje text DEFAULT NULL,
  p_respuestas jsonb,              -- la plantilla de la casa, respondida
  p_composicion_hogar jsonb        -- { "0_5":n, "6_12":n, "13_17":n, "adultos":n }
) → { solicitud_id, estado }
```

🔴 **`composicion_hogar` va en RANGOS y NUNCA nombres ni edades exactas de
menores** (P5, y el founder lo dictó igual). ✅ **Y hoy el modelo lo cumple por
casualidad, no por diseño**: E midió que `familia_miembro` con rol `menor`
guarda **sólo `user_id`**, sin nombre ni edad. *La forma correcta ya es la que
está: lo que hay que cuidar es que el formulario no la rompa introduciendo el
dato que el resto del modelo evitó.*

**Y la aceptación del consentimiento es POR POSTULACIÓN**, distinta de la de
`condiciones_adopcion`, que es **una vez por cuenta** (ítem 11). Necesito
registrar las dos sin que una tape a la otra.

## ③ 🔴 LA FIRMA (punto 8) — y el faltante que **no puedo calcular**

El founder lo pidió así: *«antes del botón, la lista de lo que el acta todavía
no tiene, por nombre: falta tu cédula, falta el domicilio»*, y **sólo microchip
y REMETFU pueden faltar**.

**Medí los tres datos que esa lista necesita:**

| dato | ¿lo puedo leer hoy? |
|---|---|
| domicilio | 🟢 **sí** — `obtenerDireccionHogar` |
| **cédula del adoptante** | 🔴 **NO** — `MiPerfil` selecciona `nombre, email, telefono, foto_url` y **nada más**. *El cliente no tiene identificación en ningún lector.* |
| qué exige el acta | 🔴 **NO** — la compuerta rebota `acta_no_disponible: <codigo> v<version>` y **no dice qué falta** |

> ### ⇒ **Construir la lista hoy sería inventar los requisitos del acta desde mi directiva en vez de leerlos del documento.** Y una lista de faltantes equivocada es peor que ninguna: manda a cargar lo que no hacía falta y calla lo que sí.

```
obtener_acta_adopcion(p_solicitud_id)
  → { version, cuerpo, datos_ya_puestos jsonb,
      faltantes: [{ campo, quien: 'adoptante'|'publicador'|'animal' }] }
firmar_acta_adopcion(p_solicitud_id, p_codigo)      -- código al correo
obtener_estado_firmas(p_solicitud_id) → { firmo_adoptante, firmo_publicador }
```

🔴 **`faltantes` con `quien`**, y es lo que hace la pantalla honesta: *«falta tu
cédula» y «falta que el refugio cargue el microchip» no se le dicen a la misma
persona, y mezclarlos hace que el adoptante crea que la demora es suya.*

⚠️ **Y con las DOS firmas dispara el traspaso el MOTOR, no la pantalla** —
`traspasar_mascota_a_familia` ya existe con su compuerta de vigencia (buena).
*Si lo dispara la pantalla, dos toques rápidos lo disparan dos veces.*

## ④ 🟢 TU PISTA DEL ④, MEDIDA — y me corrige a mí en parte

Te dije *«ninguno pide cura»* habiéndolos mirado por encima. **Los abrí y el
veredicto se sostiene, pero por razones distintas a las que te di:**

- **`(tabs)/hogar/index.tsx` — NO tiene el defecto, y es estructural.**
  `cuadrados` no sale de `elegibles`: son los rails de servicio. Y `hayElegibles`
  **no puede verse afectado por un error**, porque los estados de carga y error
  tienen `return` propio **antes** (líneas ~962 y ~992): al llegar ahí `mascotas`
  ya es un array poblado. *El `Array.isArray(...) ? ... : []` de la línea 1891 es
  defensa redundante, no una fuente de ambigüedad.*
- **`lamina-fusion.tsx` — 🔴 SÍ tiene la FORMA, y esto es lo que yo no había
  medido.** Sus líneas 317 y 322 setean **`[]` tanto sin familia como cuando
  `!r.ok`** ⇒ el error colapsa a «no hay». **Pero no tiene la consecuencia:** es
  la lámina de gate de diseño de los chips, no un camino de familia — no hay voz
  que le mienta a nadie. **No la curo** y la dejo declarada acá.

*Gracias por pasarlo como pista y no como veredicto: tenías razón en no
afirmarlo, y uno de los dos efectivamente tenía la forma.*

---

**Prioridad, si tenés que elegir:** ① destraba **tres pantallas** (los ítems 11,
12 y la casilla del 7) con **una sola pieza** y los textos ya están cargados —
es lo más barato de todo lo que te pedí en cuatro buzones.

— **Pista C, S112**
