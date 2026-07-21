# S72-B · HOJA DE RUTA DEL GATE — el E2E del vet (mitad de B)

> Para el founder, para correr de una sentada cuando **la ventana de motor de
> la A cierre**. Cubre la mitad de B del camino:
> **mostrador → presupuesto → (aprobación: A) → fijar fecha → consulta →
> dictado → confirmación → guardar.**
>
> Cómo se lee cada paso: **QUÉ TOCÁS** · **QUÉ TIENE QUE PASAR** · **QUÉ MIRAR
> DE CERCA** (lo que S72-B tocó y quiere que juzgues) · **DECLARADO ABIERTO**
> (lo que YA sabemos roto/faltante — no gastes tiempo reportándolo).

---

## PASO 0 — EL BINARIO (L-138: el gate arranca acá, siempre)

Antes de tocar nada, confirmá que el teléfono corre **este** bundle:

```
adb logcat -d | grep "\[bundle\]"
# tiene que imprimir:  [bundle] prestador S72
```

**Update group vivo en el canal `preview`:** `0e4f1be8-58f8-418a-b166-d7a706d46e30`
(runtime 1.0.2, commit `69b5516`). Trae TODO S72-B: los 3 casos de 19.7, la
voz del micrófono, la bandeja "Por coordinar" con el gate corregido, `vozServicio`
por oficio, los 78 textos migrados a `Texto`, y **la pieza 3** (la agenda vet
dice la descripción del procedimiento; el total muere en "Por coordinar").

Si el marcador dice `S71` o el group es otro: cerrá y abrí la APK **dos veces**
(1ª descarga, 2ª aplica). Si sigue viejo, `adb install -r` el APK preview. **Sin
el marcador confirmado, ningún hallazgo de abajo vale** — estarías juzgando otro
código.

---

## LA RUTA

### Paso 1 — HOY → arrancar el mostrador
| | |
|---|---|
| **QUÉ TOCÁS** | Tab **Hoy**. Botón **"Registrar atención"** (bajo la jornada). |
| **QUÉ TIENE QUE PASAR** | Abre `/veterinaria/mostrador` (el buscador de una caja). |
| **QUÉ MIRAR DE CERCA** | **La línea de la jornada en el techo** (piloto B1): «Te quedan N · terminás {hora}» / «Jornada completa» / «Día atendido · N por coordinar». Es el único número agregado de HOY, y se OMITE en cero. |
| **DECLARADO ABIERTO** | Si `obtenerMiPrestador`/las ofertas fallan por red, HOY cae a una banda con el mensaje **crudo del wrapper** (voseo, es-only). No es hallazgo — ver §Voz de wrapper. |

### Paso 2 — El mostrador: buscar
| | |
|---|---|
| **QUÉ TOCÁS** | Escribí en la caja: un **nombre** (mascota que la clínica ya ve), un **@email** o un **teléfono**. |
| **QUÉ TIENE QUE PASAR** | Nombre → lista de mascotas accesibles. Email/teléfono registrado → una fila "tocá para autorizar". No registrado → vacío honesto + "Registrar mascota nueva". |
| **QUÉ MIRAR DE CERCA** | Nada nuevo de S72-B acá — la pantalla no se tocó esta tanda. |
| **DECLARADO ABIERTO** | Error de red al buscar → muestra el **mensaje crudo del wrapper** (`mostrador/index.tsx:201`, voseo es-only). Cliente "pendiente" es una fila sin acción propia (salida por el botón del pie, no es callejón duro). |

### Paso 3 — Registrar la atención (o el handshake)
| | |
|---|---|
| **QUÉ TOCÁS** | **(3a)** Mascota encontrada → tap → `/mostrador/atencion`: elegí servicio, persona, monto + medio de cobro → **"Registrar cobro"** (o "Sin cobro"). **(3b)** Cliente registrado → tap → `/mostrador/autorizar` (handshake). **(3c)** Nadie → "Registrar mascota nueva" → alta fantasma. |
| **QUÉ TIENE QUE PASAR** | 3a: cita firme HOY + cobro-dato registrado → vuelve al mostrador. 3b: solicitud de autorización, pantalla de espera. 3c: mascota fantasma creada. |
| **QUÉ MIRAR DE CERCA** | El monto de cobro es `Campo` decimal a propósito (es un monto arbitrario que pagó el cliente, no un precio de catálogo — la regla del teclado no aplica). |
| **DECLARADO ABIERTO** | **`atencion.tsx` no tiene esqueleto ni banda de error de carga**: si el fetch inicial falla, la pantalla queda con el botón gris y **sin voz** (parece colgada). Es camino triste — el happy path no lo dispara. Cura = composición, va después del gate. · En `autorizar` la fase "esperando" no tiene "cancelar" (salida por el back del header). |

### Paso 4 — Armar el presupuesto
| | |
|---|---|
| **QUÉ TOCÁS** | Desde el detalle de la cita (`/veterinaria/cita/[id]`) → **"Crear presupuesto"**. Agregá procedimientos del catálogo (tap en la fila) y/o líneas libres (nombre + precio) → **"Enviar a la familia"** o **"Aprobar presencial"**. |
| **QUÉ TIENE QUE PASAR** | El total crece con cada ítem (siempre visible). Enviar → toast de éxito → vuelve. |
| **QUÉ MIRAR DE CERCA** | **Los 4 hallazgos del gate S71 SIGUEN VIVOS acá — es la P2, y su boceto espera vara cruzada, NO se construyó:** tapear una fila del catálogo muta el carrito sin señal · el precio libre es `Campo` decimal (no `SliderPrecio`) · "Agregar línea" con nombre vacío no hace nada y no dice por qué · (los títulos de sección SÍ se migraron a `Texto`). |
| **DECLARADO ABIERTO** | **P2 no está curada** — su boceto (`2026-07-20-s72b-boceto-p2-presupuesto.md`) espera M2. No reportes los 4 hallazgos: están registrados. · Fetch inicial sin voz de error (igual que atención). · Los presupuestos ya armados se listan en la cita SIN destino de detalle (C-3/C-6, pantalla de detalle no existe = boceto). |

### Paso 5 — La aprobación *(es de la A / o presencial)*
| | |
|---|---|
| **QUÉ TOCÁS** | Si "Aprobar presencial" en el paso 4: la cita nace aprobada, sin fecha. Si "Enviar a la familia": la aprobación la hace el **dueño** desde la app cliente. |
| **QUÉ TIENE QUE PASAR** | Aprobado → aparece una cita **"Por coordinar"** en HOY del prestador. |
| **QUÉ MIRAR DE CERCA** | **(1)** **LA BANDEJA "POR COORDINAR" CON EL GATE CORREGIDO (S72-B):** antes se gateaba por `oficios.vet` — y `vet` se computa de `servicios`, que **excluye** las filas `'otro'`. Un negocio que **solo** cotiza procedimientos por presupuesto tenía la bandeja invisible **con citas adentro**. Ahora gatea por `porCoordinar.length > 0`. **Probá con un negocio que solo tenga procedimientos** para ver la cura. **(2)** ⭐ **EL TOTAL YA NO SE MUESTRA en la fila de "Por coordinar"** (pieza 3): la fila dice mascota + qué procedimiento + «Fijar fecha ›», sin `$`. HOY es superficie multi-actor (la recepción también mira) y D-457 puso la plata en NEGOCIO gateada por rol; el precio congelado lo ves recién en la pantalla de coordinar (paso 6). |
| **DECLARADO ABIERTO** | La aprobación del dueño es de la app cliente (fuera del path de B). El motor de aprobación es de la A. |

### Paso 6 — Fijar la fecha ⚠️ DEPENDE DE LA VENTANA DE MOTOR DE LA A
| | |
|---|---|
| **QUÉ TOCÁS** | En HOY, tap en la fila "Por coordinar" → `/veterinaria/coordinar/[id]`: elegí **día**, **hora**, **persona** → **"Confirmar"**. |
| **QUÉ TIENE QUE PASAR** | La cita queda agendada con fecha firme; vuelve a HOY, **y aparece en la jornada del día que coordinaste diciendo el procedimiento** (no el genérico). |
| **QUÉ MIRAR DE CERCA** | **(1)** **La Ley 23 (el principio de la puerta) aplicada:** con el día = HOY, las horas **ya pasadas no se muestran** (el server las rebotaba tarde). Después de las 18:00, en vez de una grilla muerta, dice «hoy no quedan horas». La fila entera tapea (contorno transparente muerto, 19.7). **(2)** ⭐ **LA PIEZA 3 — la cita coordinada en la agenda dice «Ecografia +1»**, no «Procedimiento». Las 3 citas vivas tienen 2 ítems cada una → verás «{descripción} +1». El **detalle** de esa cita (paso 7) dice **lo mismo** — mirá que no se contradigan. |
| **DECLARADO ABIERTO** | 🔴 **ESTE PASO DEPENDE DEL MOTOR DE LA A** (`fijar_fecha_procedimiento`, en su ventana). **Si corrés antes de que la A cierre, el "Confirmar" puede rebotar y ahí MUERE — NO es hallazgo nuevo.** Corré este paso solo con la ventana de motor cerrada. · 🔵 **Cuál ítem es "la primera" es ARBITRARIO** (los ítems se guardan en batch con la misma marca de tiempo y desempatan por id) — si el «+1» muestra el procedimiento que NO esperabas como principal, **no es bug**: es deuda de `presupuesto_item.orden` (disparo P2). |

### Paso 7 — El detalle de la cita → empezar la consulta
| | |
|---|---|
| **QUÉ TOCÁS** | Tap en la cita vet (desde HOY) → `/veterinaria/cita/[id]` → **"Empezar la consulta"**. |
| **QUÉ TIENE QUE PASAR** | Abre `/veterinaria/consulta/[id]` en la fase **Antes**. |
| **QUÉ MIRAR DE CERCA** | **(1)** El detalle tiene tres celdas de navegación (consulta · expediente · presupuesto) con ícono+chevron — la gramática correcta. **(2)** ⭐ El campo **"Servicio" dice la MISMA descripción que la fila de agenda** (pieza 3) — «Ecografia +1», no «Procedimiento». Es la prueba de que las dos superficies no se contradicen en el mismo dato. |
| **DECLARADO ABIERTO** | La lista de presupuestos de la cita no navega a un detalle (no existe la pantalla). · Si la cita no tuviera mascota, los 3 CTAs se ocultan — caso defensivo, una cita vet siempre tiene mascota. |

### Paso 8 — La consulta: el Antes
| | |
|---|---|
| **QUÉ TOCÁS** | Leé el briefing: perfil vigente, casos activos, presupuestos. → **"Dictá la nota"**. |
| **QUÉ TIENE QUE PASAR** | Pasa a la fase Dictado. |
| **QUÉ MIRAR DE CERCA** | Este es el **Antes** que ya pasó VERDE en el gate S71 (una de las pantallas mejor manejadas). |
| **DECLARADO ABIERTO** | 🔵 **La FRANJA DE SEGURIDAD de P3 (alergias/medicación/«muerde») NO existe** — falta el modelo de alerta de manejo (**D-469**) y ningún lector expone alergias/medicación con contenido. El Antes muestra lo que hay hoy, no la modulación por actor de P3 (su boceto espera M2). · 🔵 **La procedencia no se muestra en ningún lector todavía** (**D-470**): no sabés si una vacuna la declaró la familia o la aplicó un colega. |

### Paso 9 — El dictado ⭐ LA VOZ DEL MICRÓFONO (nueva en S72-B)
| | |
|---|---|
| **QUÉ TOCÁS** | Leé el texto de ayuda bajo el título. Dictá con el **micrófono del teclado del sistema** (o escribí). → **"Estructurar la nota"**. |
| **QUÉ TIENE QUE PASAR** | La IA ordena el dictado en campos; pasa a Confirmación. |
| **QUÉ MIRAR DE CERCA** | ⭐ **LA AYUDA AHORA DICE CÓMO DICTAR** (D-456): *«Habla o escribe libremente — para dictar, tocá el micrófono de tu teclado. Después revisás todo campo por campo…»*. Antes prometía "hablá" y nunca decía cómo (la decisión vivía solo en un comentario de código). **Confirmá que la voz te resulta clara.** |
| **DECLARADO ABIERTO** | El mic **propio** de la app sigue siendo deuda preparada-apagada (P4, disparo = próxima build nativa). Hoy es el mic del teclado, a propósito. |

### Paso 10 — La confirmación ⭐ EL GUARD DE POSOLOGÍA (verificado en frío)
| | |
|---|---|
| **QUÉ TOCÁS** | Revisá campo por campo. En cada medicamento, mirá **dosis** y **frecuencia**. Dejá una vacía a propósito. → intentá **"Guardar la consulta"**. |
| **QUÉ TIENE QUE PASAR** | Con dosis o frecuencia vacía, el `Campo` marca error («requerido») **y el botón Guardar queda deshabilitado** — no perdés la nota. Completá y recién ahí guarda. |
| **QUÉ MIRAR DE CERCA** | ⭐ **La "verificación de diez minutos" S72-B: NO ES BUG.** La pantalla YA obliga a completar posología antes de enviar (`medIncompleta` + `error=` por campo), espejo exacto del guard del motor (`posologia_incompleta`). El vet **no** pierde la nota en el punto caro. Esto es la Ley 23 al derecho. |
| **DECLARADO ABIERTO** | La voz de los errores de guardado (si el motor rebota) es el **mensaje crudo del wrapper** (voseo es-only) — ver §Voz de wrapper. |

### Paso 11 — Guardar → el Después
| | |
|---|---|
| **QUÉ TOCÁS** | Con todo completo → **"Guardar la consulta"**. |
| **QUÉ TIENE QUE PASAR** | «Guardamos la consulta de {mascota}» + próximo control sugerido. La constelación clínica sedimenta (nota + fórmula + exámenes + caso). |
| **QUÉ MIRAR DE CERCA** | La fórmula se guarda con detalle farmacológico completo (nombre, principio activo, dosis, frecuencia, vía…). |
| **DECLARADO ABIERTO** | 🔵 **No hay salida entregable de la receta** (PDF / compartir / membrete) — es hueco de mercado relevado en B0, no está construido. El flujo termina en el guardado. |

---

## §Voz de wrapper — UN patrón, declarado una vez (NO reportar por paso)

Muchos errores del camino triste (red caída, RLS, presupuesto vencido, sesión
perdida) muestran el **`mensaje` del wrapper**, que hoy está en **voseo y
es-only** (`No tenés permiso`, `Poné hasta cuándo vale`, `Agregá al menos un
ítem`). Medido: **~18 mensajes en voseo** en los 4 wrappers del path
(`veterinaria-presupuesto` 3 · `veterinaria-mostrador` 8 · `veterinaria-nota-clinica`
5 · `handshake-mostrador` 2).

- **Es un hallazgo real** (contra L-148 + sin inglés), pero **vive en
  `packages/api` = territorio de la A**. La sesión B lo **FRENÓ y lo declara**,
  no lo tocó.
- En el happy path del E2E **no aparece**. Solo lo vas a ver si forzás un error.
- **No lo reportes por pantalla** — es un solo patrón, y su casa es el wrapper.

---

## LO QUE ESTA TANDA (S72-B) SÍ TOCÓ — el resumen para juzgar

1. **19.7** — 3 contornos transparentes murieron (quitar medicamento · desplegar
   servicio del taller · subir documento de verificación): `compacto`→`ghost`.
2. **La voz del micrófono** (D-456) — paso 9.
3. **La bandeja "Por coordinar"** sin gate de oficio — paso 5.
4. **`vozServicio` por oficio** — en Liquidaciones, la cola de cobro ya no
   colapsa todo en "Servicio"; una atención vet dice **"Veterinaria"**.
5. **78 `<Text>` → `Texto`** + 14 wrappers locales muertos (−765/+228). La
   jerarquía tipográfica dejó de re-decidirse a mano. **Se ve idéntica** — si
   algo cambió de tamaño o color, ESO es el hallazgo.
6. **La pieza 3** — la agenda vet y el detalle dicen la descripción del
   procedimiento coordinado («Ecografia +1»), no el genérico; y **el total
   murió** en la celda de "Por coordinar" (D-457, HOY es multi-actor) — pasos
   5, 6 y 7.

## LO QUE ESTA TANDA NO TOCÓ (espera M2 / es de la A)

- **P2 (presupuesto)** y **P3 (expediente del profesional)**: bocetos
  depositados, esperan la vara cruzada de la A.
- **`money()`** (9 formateadores clonados): censado, no curado — el riel es de
  la A (D-448).
- **Los 49 textos en `base`/15px**: NO migrados — `Texto.cuerpo` es `md`/18px,
  migrarlos agrandaría el cuerpo de la app. Espera la decisión de `packages/ui`.
- **La voz de los wrappers** (§ arriba).
