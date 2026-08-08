# S91-D · CENSO DEL PERFIL DE MASCOTA — insumo de lámina

> **Medición, no propuesta.** La letra la firma el founder en mesa; acá no se
> propone diseño. Todo lo de abajo salió del objeto vivo el 8-ago-2026:
> `information_schema` para las columnas, la fuente para la superficie, y
> `grep` sobre `apps/cliente/src` para los consumidores.
>
> La pantalla: `apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx`,
> **1449 líneas**. Su lector: `packages/api/src/wrappers/perfilMascota.ts`.

---

## ① LAS SECCIONES, EN EL ORDEN EN QUE APARECEN

| # | sección | qué contiene | de dónde sale |
|---|---|---|---|
| 0 | *(cabecera)* | foto · nombre · **raza** · edad · momento vital en voz · pastilla de estado | `mascotas` |
| 1 | **Cómo está hoy** | vacunas (próximo refuerzo) · peso · lo que falta enumerado («desparasitación · alergias») | `mascota_perfil_vigente` + carnet |
| 2 | **Identidad** | raza · sexo · nacimiento · peso · microchip · paseos en grupo · talla y pelaje | `mascotas` + perfil vigente |
| 3 | **Vacunas** | lista con su conteo; vacío educativo que termina en «Cargar carnet» | `mascota_carnet_vacunas` |
| 4 | **Documentos** | **nace PLEGADA** (decisión S89-D: «el perfil es de la mascota; sus documentos se piden, no presiden»); deriva del catálogo vivo | `cat_documentos_mascota` |
| 5 | **Su historia** | la Línea de Vida con su conteo | `eventos_mascota` |
| 6 | **Vitales** | los índices con sus guijarros | tracks + perfil vigente |

---

## ② QUÉ SE PUEDE EDITAR DESDE ACÁ — **SON TRES COSAS**

| dato | cómo | dónde |
|---|---|---|
| **la foto** | navega a `/hogar/foto-mascota` (lápiz sobre el avatar, y también tocando el avatar) | ruta aparte |
| **paseos en grupo** (`paseo_social_ok`) | `PaseoSocialHoja` | Hoja, en Identidad |
| **talla y pelaje** | `TallaPelajeHoja` — la MISMA de la reserva de grooming | Hoja, en Identidad |

**Todo lo demás del perfil es SOLO LECTURA.** Nombre, raza, sexo, fecha,
microchip, peso: se muestran y no se tocan. El peso y el microchip **ni
siquiera tienen productor del lado del dueño** — los escribe el prestador.

**⚠️ Y el hallazgo que más pesa para la lámina: NO EXISTE NINGUNA ENTRADA DE
«COMPLETAR EL PERFIL».** Medido: cero ocurrencias de `completar` en las 1449
líneas. **El modal del alta manda acá con «Completar ahora» y acá no hay nada
que completar** — la persona aterriza en una pantalla de lectura. El botón
cumple lo que dice la lámina (lleva al perfil) y el perfil todavía no tiene la
otra mitad.

---

## ③ LOS CAMPOS DEL MOTOR **SIN SUPERFICIE** — medido uno por uno

`mascotas` tiene **29 columnas**. El lector del perfil selecciona 17.

| columna | ¿la captura el alta? | ¿la muestra el perfil? | consumidores en `apps/cliente` |
|---|---|---|---|
| `origen` | **SÍ** (paso 3, cinco opciones) | **NO** | **CERO** |
| `tipo_agua` | **SÍ** (paso 2 del acuario) | **NO** | **CERO** |
| `sujeto` | lo estampa el motor | **NO** | **CERO** |
| `fecha_nacimiento_precision` | **SÍ** (CampoFecha) | **NO** *(se lee y no se pinta)* | **CERO** |
| `raza` | **SÍ** | **SÍ** | — |
| `peso_clinico_kg` | no (por letra: primera consulta) | SÍ | — |
| `microchip` | no (por letra: primera consulta) | SÍ | — |
| `talla` / `pelaje` | no (default derivado, aún sin fuente) | SÍ y editable | — |
| `criadero_id` / `refugio_id` | no | **NO** | CERO |
| `estado_vida_desde` | no | **NO** | — |
| `foto_cx/cy/z` | SÍ (encuadre) | se aplica, no se muestra | — |

**Método del «CERO», para que se pueda auditar:** el grep crudo daba 9 usos de
`origen` y 10 de `sujeto` en el cliente — **y ninguno es de `mascotas`**: los
de `origen` son de CITAS (`cita.origen === 'paquete'|'suelta'`, en `paseos.tsx`)
más un `<Atmosfera origen="arriba-derecha">`; los de `sujeto` son **prosa de
comentarios** («el sujeto es la mascota»). *Contar matches habría dado un
número tranquilizador y falso.*

---

## ④ LAS CUATRO DIVERGENCIAS ALTA ↔ PERFIL

1. **El origen se pregunta y no se ve en ningún lado.** El paso 3 lo captura,
   la RPC lo guarda (`p_origen` desde el 7-ago) y el cliente no lo lee nunca.
2. **El acuario no existe como acuario en su propio perfil.** Se le pregunta el
   tipo de agua y cuándo se montó, y después el perfil le habla como a un
   animal individual: dice «raza», ofrece sexo, y muestra los mismos índices.
   `sujeto` y `tipo_agua` no llegan ni al wrapper.
3. **La precisión de la fecha viaja y se pierde en el último metro.** El lector
   la trae en su `select`; la pantalla no la pinta. Una fecha ESTIMADA por
   etapa se muestra igual que una exacta — el dato honesto que el alta se
   ocupó de capturar se lee después como certeza.
4. **Lo que el perfil muestra y el alta no pide** (peso, microchip) tiene su
   razón escrita en la lámina —van a la primera consulta— y **no es una
   divergencia**: se lista para que no se lea como hueco.

---

## ⑤ DÓNDE ESTÁN HOY LAS TRES PIEZAS QUE LA MESA PREGUNTÓ

| pieza | dónde vive | entrada |
|---|---|---|
| **Papeles** | EN el perfil, sección 4, **plegada** | se despliega; la lista deriva de `cat_documentos_mascota` |
| **Bitácora** | pantalla propia `/hogar/bitacora` | **su ÚNICA entrada es `/hogar/adiestramiento`** (medido: un solo `router.push`) — **desde el perfil de la mascota no se llega** |
| **Completar perfil** | **no existe** | el modal del alta apunta al perfil; el perfil no tiene la contraparte |

**Sobre los papeles, un dato que la lámina va a necesitar:** la lista excluye a
propósito los papeles **POR ACTO** (el certificado de salud) — «un botón por
tipo no sirve para seis emisiones». Hay N certificados por mascota y hoy
**ninguna superficie del cliente los lista**, aunque su lector
(`obtenerCertificadosMascota`) existe desde S90.

---

## ⑥ LAS SALIDAS DEL PERFIL — las cinco, completas

`/carnet` · `/hogar/foto-mascota` · `/hogar/vacunas/[mascotaId]` ·
`/parte/[eventoId]` · `/paseo/[atencionId]`

**No hay salida a reservar desde el cuerpo del perfil** salvo el CTA del pie
(«Reservar un servicio para {nombre}»), ni a la bitácora, ni a editar los datos
de identidad.

---

## ⑦ DOS COSAS QUE SE VIERON MIDIENDO Y NO SON DEL PERFIL

- **`perro/generico.webp` trae el damero de transparencia HORNEADO como
  píxeles** — medido: el archivo **no tiene canal alfa**, el damero son datos
  de imagen. `gato/generico.webp` tiene fondo blanco limpio ⇒ **no es
  sistémico**. Se nota a tamaño grande (el avatar del paso 2 y del paso 4 del
  alta, y cualquier superficie futura que lo use en grande). Familia D-684.
- **El chip de entidad trunca los nombres largos** («Labrador retrie…»), por la
  ley del ancho del chip. Es de `packages/ui`; se declara, no se toca.
