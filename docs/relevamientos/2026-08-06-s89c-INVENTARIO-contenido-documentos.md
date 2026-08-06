# S89-C · EL CONTENIDO DE LOS DOCUMENTOS — inventario papel por papel (foco ④)

> **Solo medición contra el objeto vivo (6-ago-2026) — cero construcción,
> cero mutación.** Fuentes: `information_schema.columns`,
> `pg_get_constraintdef`, `pg_get_functiondef` (el dictado y el carnet),
> conteos sobre la DB viva. Jamás fichas ni memoria. Este depósito + la
> espec de B alimentan la lámina del arco de documentos.

## 0 · LAS IDENTIDADES TRANSVERSALES — lo que todo papel necesita

| dato | fuente viva | estado |
|---|---|---|
| Mascota: nombre · especie · raza · sexo · fecha_nacimiento (+`fecha_nacimiento_precision`) · microchip · foto · `estado_vida` | `mascotas` | ✅ EXISTE |
| Mascota: `pet_hash` (identidad digital — el destino que S66 nombró) | `mascotas.pet_hash` | ✅ EXISTE (columna viva) |
| Mascota: color / señas particulares | — | ❌ NO EXISTE (`mascotas` no tiene color; los certificados zoosanitarios suelen pedirlo) |
| Titular: nombre · email · teléfono E.164 · dirección completa | `profiles` | ⚠️ EXISTE con caveat medido en S81: en cuentas legacy `nombre` es username-como-nombre — un papel digno necesita nombre real |
| Titular: identificación (`tipo_identificacion` + `identificacion_fiscal`) | `profiles` (nacieron para factura) | ✅ EXISTE (nullable — no todo titular la tiene cargada) |
| Negocio: nombre_comercial · dirección · ciudad · teléfono · email · logo | `prestadores` | ✅ EXISTE |
| Negocio: razón social + RUC | `cuentas_comerciales` vía `prestadores.cuenta_comercial_id` | ✅ EXISTE |
| Profesional actuante: nombre · especialidades | `prestador_empleados` (y `empleado_id` estampado en TODAS las tipadas clínicas) | ✅ EXISTE |
| Profesional: número de registro / matrícula | `prestadores.matricula_profesional` | 🔶 EXISTE INCOMPLETO — **la matrícula vive en el NEGOCIO, no en el profesional**: `prestador_empleados` no tiene matrícula. En una clínica multi-vet no se puede poner el número DEL FIRMANTE |
| Profesional: credencial verificada (SENESCYT / título) | `prestador_documentos` (`registro_senescyt` · `titulo_profesional`, con veredicto admin `aprobado` — hay aprobados vivos) | 🔶 EXISTE INCOMPLETO — el documento es POR NEGOCIO (`prestador_id`), no por empleado; mismo hueco que la matrícula |
| Firma (imagen o digital) del profesional o del negocio | — | ❌ NO EXISTE en ninguna tabla |

## 1 · HISTORIA CLÍNICA (el papel de la consulta / el expediente)

Productor vivo: `sedimentar_nota_clinica` (el dictado S70 — camino real,
4 HC vivas). La constelación: un evento padre por fila + seis tipadas.

| dato del papel | fuente viva | estado |
|---|---|---|
| Motivo · anamnesis · examen físico · diagnóstico principal + CIE · diagnósticos secundarios · tratamiento · indicaciones | `evento_historia_clinica_registrada` | ✅ EXISTE |
| Vitales: peso · temperatura · FC · FR · condición corporal | mismas columnas de la HC (+`evento_peso_medicion` aparte) | ✅ EXISTE (null honesto si no se dictó — L-139) |
| Medicación con posología completa: nombre · principio activo · concentración · forma · dosis · frecuencia · duración · vía · **cantidad** · indicaciones | `evento_medicacion_prescrita` (un evento POR medicamento — decisión S70) | ✅ EXISTE |
| Exámenes pedidos: tipo · estado · urgencia · orden | `evento_examen_diagnostico` | ✅ EXISTE |
| Condiciones crónicas · alergias (con severidad, manejo, estado) | `evento_condicion_cronica_diagnosticada` · `evento_alergia_diagnosticada` | ✅ EXISTE |
| El caso que agrupa (continuidad) | `caso_clinico` (+`caso_clinico_id` en las tipadas) | ✅ EXISTE de motor; superficie D-585 |
| Quién atendió | `empleado_id` + `veterinario_user_id` en la HC | ✅ EXISTE |
| Procedencia del dato (declarado vs verificado) | `eventos_mascota.procedencia` — CHECK vivo de 3 niveles | ✅ EXISTE |
| **La EMISIÓN del papel** (render, PDF, entrega) | — | ❌ NO EXISTE — es el riel de documentos (D-477/M3: render server-side en Edge; receta = 1er consumidor declarado) |

**El hueco de la HC no es de contenido: es de SALIDA.** El producto ya
guarda una consulta más rica que muchos papeles de clínica — lo que no
sabe es imprimirla.

## 2 · CARNET DE VACUNAS

Productor vivo: `registrar_vacunas_de_carnet` (extracción Sonnet v21 +
revisión) — 32 vacunas vivas.

| dato del papel | fuente viva | estado |
|---|---|---|
| Vacuna: nombre · fecha aplicada · próxima dosis · lote · dosis · vía · tipo | `evento_vacuna_aplicada` | ✅ EXISTE |
| Vocabulario cerrado de vacunas | `cat_vacunas` (7 EC) + texto libre legal | ✅ EXISTE |
| El carnet físico escaneado (respaldo) | `evento_vacuna_aplicada.archivo_url` — **32/32 vivas con archivo**, bucket privado | ✅ EXISTE |
| Quién vacunó | `veterinario_nombre_externo` (texto del carnet) o `empleado_id`/`prestador_id` | ✅ EXISTE |
| Procedencia | medido: **las 32 vivas tienen `prestador_id = null`** — TODAS nacieron del escaneo (declaradas por la familia); `verificado_por_prestador` está tipado y SIN productor (§14.2 espera) | 🔶 EXISTE INCOMPLETO — un carnet EMITIDO hoy re-emitiría dato DECLARADO, no verificado |
| Desparasitación (parte usual del carnet de la clínica) | — | ❌ NO EXISTE (D-476 lo censó: 2º tipo fecha-sola, sin tabla) |
| **La EMISIÓN del carnet** (papel propio del producto) | — | ❌ NO EXISTE |

## 3 · CERTIFICADOS — el hallazgo mayor de la medición

**`evento_certificado_emitido` EXISTE y es un CASCARÓN V0 COMPLETO:**
0 filas · **CERO productores** (`pg_proc.prosrc` en cero) · y un contrato
sorprendentemente rico: `tipo_certificado` · `numero_certificado` ·
`fecha_emision`/`fecha_vencimiento` · **`destino_pais`** (viaje) ·
`proposito` · `archivo_url` · `estado` + **revocación**
(`revocado_en`/`revocado_motivo`) + **renovación** (`renovacion_de_id`).
Es de la familia de cascarones que S67 dejó honestos (D-415).

| dato del papel | fuente viva | estado |
|---|---|---|
| Chasis de registro del certificado | `evento_certificado_emitido` | 🔶 EXISTE INCOMPLETO — tabla sin productor, sin emisor, sin render |
| Numeración (`numero_certificado`) | columna existe | 🔶 sin GENERADOR (¿por negocio? ¿por plataforma? — pregunta de mesa) |
| Contenido clínico que un certificado cita (vacunas al día, estado de salud) | §1 + §2 | ✅ EXISTE (con el caveat de procedencia) |
| Credencial del firmante | §0 | 🔶 por NEGOCIO, no por profesional |
| Firma | — | ❌ NO EXISTE |
| Render/PDF/entrega | — | ❌ NO EXISTE |
| Recetas (pariente del arco) | `prestador_recetas_frecuentes`: 0 filas; único productor `completar_historia_clinica` = RPC del portal legado con **cero consumidores en el monorepo** (clase «huérfanas se jubilan», S66) | 🔶 cascarón legacy — la receta viva del producto hoy es `evento_medicacion_prescrita` (§1) |

## 4 · LAS PREGUNTAS DE MESA — servidas sin resolver

1. **¿El carnet emitido reemplaza al escaneado o convive?** El dato
   medido muerde: las 32 vacunas vivas son TODAS del escaneo
   (declaradas). ¿El carnet emitido re-emite lo declarado, solo lo
   verificado, o **el papel mismo distingue la procedencia** (el CHECK
   de 3 niveles ya existe para decirlo)?
2. **¿Un certificado lo firma el profesional, el negocio, o ambos?**
   Corolario medido: si firma el profesional, **hoy no hay ni matrícula
   ni credencial POR EMPLEADO** (viven en el negocio) ni firma de nadie.
3. **¿Qué papel pide el dueño solo y cuál exige acto del prestador?**
   Medido: todo lo clínico nace del prestador (el dictado); el carnet
   escaneado nace del dueño. ¿La familia puede pedir su expediente/HC
   exportado sin acto del vet? (cruza con BIO_EXPEDIENTE A3 — el ACTO
   decide qué se muestra.)
4. **¿El certificado de VIAJE entra al alcance v1?** El cascarón ya trae
   `destino_pais` — la mesa decide si esa ambición V0 se honra o se
   recorta.
5. **¿La numeración del certificado es del negocio o de la plataforma?**
6. **¿La desparasitación (D-476) entra ANTES del primer carnet emitido?**
   Sin ella, el carnet del producto sale incompleto contra el papel de
   cualquier clínica.
7. **¿El cascarón V0 se ensancha o se rediseña?** L-175 manda ensanchar,
   jamás copiar — pero el contrato es pre-monorepo y la mesa decide si
   sirve como está (revocación y renovación ya vienen pensadas).

## 5 · LA BARRIDA «push» (③ de la orden) — literal depositado

`grep -in "push"` sobre `apps/prestador/src/i18n/{es,en}.ts`:
**2 ocurrencias, AMBAS comentarios que citan la propia ley** — cero en
valores de superficie:

- `es.ts:726` → `… founder en la orden de mesa S88 — «push» no es vocabulario de nadie.`
- `en.ts:520` → `… "push" is nobody's vocabulary. notifEj* are PROPOSED lines measured …`

La ley del cliente ya rige DE FACTO en el diccionario del prestador.
La extensión formal de la ley la decide el founder — no esta pista.
