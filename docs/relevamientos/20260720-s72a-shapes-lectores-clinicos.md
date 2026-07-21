# Shapes de los lectores clínicos sin cara en prestador — S72-A0

> **Insumo de M2 para la Sesión B (boceto de P3).** Relevamiento SOLO
> LECTURA de `packages/api/src/wrappers/`, 20 Jul 2026. La fidelidad es
> literal: los shapes están pegados del archivo, no reescritos. Un boceto
> que inventa un campo lo paga en la vara cruzada.

## La corrección de la premisa (leer antes que la lista)

El pedido hablaba de **"nueve lectores construidos y desconectados"**. El
conteo real: el set de funciones con **cero uso en `apps/prestador/`** es de
**72** (mayoría escritores y lectores cara-familia). Filtrado a **lectores
del expediente de UNA mascota** quedan **ocho inequívocos + uno inferido**.
Y de esos, **dos NO están "sin cablear" — están correctamente CERRADOS al
prestador por diseño** (rechazarían al vet). El número solo no alcanza: era
un conteo correcto de una pregunta imprecisa (registrado como cuarta
aparición de L-158 en la sesión).

## Tres patrones que valen más que la lista

1. **NINGUNO de los nueve trae `procedencia`.** `grep procedencia
   packages/api/src/wrappers/*.ts` = un solo hit, y es un comentario. Choca
   con **BIO_EXPEDIENTE A3.6** (la procedencia se muestra SIEMPRE). Ver
   **D-470** (H5).
2. **NINGUNO filtra por `prestador_id` ni `cuenta_comercial_id`** — todos
   delegan en la RLS de familia / `user_tiene_acceso_a_mascota`. **El gate
   de oficio de A3 es de MOTOR, no de lector**: estos lectores no tienen hoy
   dónde poner un gate por oficio (D-463/D-464).
3. **Dos rechazarían al prestador.** `obtenerParteConsulta` lanza
   `sin_acceso` si el uid no es familia; `obtenerPresupuestosFamilia`
   depende de `presupuesto_select_familia`. **No son huecos: son diseño.**

## ⚠️ DOS ADVERTENCIAS QUE EVITAN BOCETAR SOBRE ARENA

- **`veterinario_nombre_externo` (en `VacunaDeEvento`) es un PROXY de
  origen, NO la procedencia.** La verdad está asertada en DB:
  `20260718180000_s69_a5_registrar_vacuna_mostrador.sql:101` — mostrador =
  `declarado_por_prestador`, carnet subido por familia =
  `declarado_por_familia`. Bocetar el origen de una vacuna sobre
  `veterinario_nombre_externo` es bocetar sobre el proxy, no sobre el dato.
- **En `VitalesMedidos` la AUSENCIA DE CLAVE es "no medido", garantizada
  server-side por `jsonb_strip_nulls`** (`20260719170000_s70_a5_lectores_dueno.sql:109`).
  Los cinco campos son **opcionales, no nullables** — `pesoKg?` ausente ≠
  `pesoKg: null`. La UI lee "no medido" por ausencia de clave.

---

## 1 · `leerTimelineMascota` — `timeline.ts:68`

```ts
export async function leerTimelineMascota(
  mascotaId: string,
  opciones?: { limite?: number; cursor?: string },
): Promise<ResultadoWrapper<PaginaTimeline, CodigoErrorTimeline>>
```
```ts
export interface PaginaTimeline {
  items: ItemTimeline[];
  siguiente_cursor: string | null;
}
export interface ItemTimeline {
  evento_id: string;
  tipo: string;               // código crudo de eventos_mascota.tipo
  eje_jtbd: string | null;
  fecha_evento: string;
  titulo_fuente: string | null;
  duracion_min: number | null;
  atencion_id: string | null;
  fotos_count: number;
  vacuna_nombre: string | null;
  fecha_sola: boolean;
}
```
Query (`timeline.ts:74-82`): `.from('eventos_mascota').select('id, tipo, eje_jtbd, fecha_evento, prestador_id, datos').eq('mascota_id', …).eq('soft_delete', false).neq('tipo', 'cita_servicio')`.
- **(a) eje:** transversal — es el único que **devuelve el eje como dato** (`eje_jtbd`).
- **(b) procedencia:** NO. **El arreglo más barato de los nueve:** agregar `procedencia` al select de `timeline.ts:76` (columna directa de `eventos_mascota`, cero join).
- **(c) filtro:** ninguno de prestador. Solo `mascota_id` + `soft_delete` + `tipo`.

## 2 · `obtenerFotosDeEvento` — `timeline.ts:163`

```ts
export async function obtenerFotosDeEvento(
  eventoId: string,
): Promise<ResultadoWrapper<FotoDeEvento[], CodigoErrorTimeline>>
```
```ts
export interface FotoDeEvento {
  id: string;
  nombre_archivo: string | null;
  url: string;                // signed URL, TTL 300s
}
```
Query: `.from('evento_archivo_adjunto').select('id, nombre_archivo, bucket, storage_path, orden').eq('evento_padre_id', eventoId)` + `createSignedUrls`.
- **(a) eje:** 7 Datos pasivos (evidencia capturada).
- **(b) procedencia:** NO — join `evento_padre_id → eventos_mascota.procedencia` (la FK ya es el filtro).
- **(c) filtro:** ninguno de prestador. Doble puerta RLS (tabla + storage).

## 3 · `leerDetalleAtencion` — `timeline.ts:246`

```ts
export async function leerDetalleAtencion(
  atencionId: string,
): Promise<ResultadoWrapper<DetalleAtencion, CodigoErrorTimeline>>
```
```ts
export interface DetalleAtencion {
  atencion_id: string;
  evento_id: string | null;
  estado: string;
  iniciada_en: string | null;
  terminada_en: string | null;
  cerrada_en: string | null;
  mensaje_familia: string | null;
  titulo_fuente: string | null;
  gps_estado: string | null;
  track_gps: PuntoTrack[];
  novedades: NovedadDeAtencion[];
  fotos: FotoDeEvento[];
  servicios_aplicados: ServicioAplicadoFamilia[];
  proxima_sesion_sugerida: string | null;
  mascota_id: string | null;
  oficio: 'paseo' | 'grooming' | 'adiestramiento' | null;   // ← CIEGO AL VET
  cita_id: string | null;
}
export interface NovedadDeAtencion { novedad_codigo: string; detalle: string | null; created_at: string; }
export interface PuntoTrack { lat: number; lng: number; ts?: string; }
export interface ServicioAplicadoFamilia { codigo: string; voz: string; voz_en: string; }
```
- **(a) eje:** 4 Cuidado externo (+7 vía `track_gps`).
- **(b) procedencia:** NO — join `evento_atencion.evento_id → eventos_mascota.procedencia` (FK ya en el select).
- **(c) filtro:** ninguno de prestador (lee `prestador_id` solo para el nombre).
- **⚠️ NOTA P3 (A3.10):** su `oficio` solo resuelve `paseo|grooming|adiestramiento`. **Es CIEGO a la atención clínica vet** (devuelve `oficio: null` y payload vacío para una atención clínica). No es cablear — es EXTENDER el lector.

## 4 · `obtenerVacunaPorEvento` — `vacunas.ts:290`

```ts
export async function obtenerVacunaPorEvento(
  eventoId: string,
): Promise<ResultadoWrapper<VacunaDeEvento, 'vacuna_no_encontrada'>>
```
```ts
export interface VacunaDeEvento {
  id: string;
  nombre_vacuna: string;
  tipo_vacuna: string | null;
  fecha_aplicada: string | null;
  fecha_proxima: string | null;
  veterinario_nombre_externo: string | null;   // ← PROXY, no procedencia
  lote: string | null;
  archivo_url: string | null;                   // PATH del carnet, o null
}
```
- **(a) eje:** 3 Salud.
- **(b) procedencia:** NO — join `evento_vacuna_aplicada.evento_id → eventos_mascota.procedencia`. **`veterinario_nombre_externo` NO es la procedencia** (ver advertencia arriba).
- **(c) filtro:** ninguno de prestador. RLS `vacuna_select`.

## 5 · `obtenerParteConsulta` — `veterinaria-nota-clinica.ts:418`

```ts
export async function obtenerParteConsulta(
  eventoId: string,
): Promise<ResultadoWrapper<ParteConsulta, 'parte_no_encontrado' | 'sin_acceso' | 'datos_invalidos'>>
```
```ts
export interface ParteConsulta {
  eventoId: string;
  mascotaId: string;
  fecha: string;
  negocioNombre: string | null;
  consulta: {
    motivo: string | null;
    diagnostico: string | null;
    anamnesis: string | null;
    examen: string | null;
    planTerapeutico: string | null;
    indicaciones: string | null;
  };
  vitales: VitalesMedidos;
  formula: ItemFormulaParte[];
  examenes: Array<{ tipoExamen: string; estado: string }>;
  proximoControl: string | null;
  casoCondicion: string | null;
}
export interface ItemFormulaParte {
  nombre: string;
  presentacion: string | null;
  cantidad: number | null;
  dosis: string | null;
  frecuencia: string | null;
  duracionDias: number | null;
  via: string | null;
  indicaciones: string | null;
  principioActivo: string | null;
}
export interface VitalesMedidos {   // AUSENCIA de clave = no medido (ver advertencia)
  pesoKg?: number;
  temperaturaC?: number;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  condicionCorporal?: number;
}
```
RPC `obtener_parte_consulta(p_evento_id)`.
- **(a) eje:** 3 Salud.
- **(b) procedencia:** NO — y la RPC **ya joinea la fila** (`20260719170000_s70_a5_lectores_dueno.sql:66-68`) y solo le extrae `datos`. Sumar `e.procedencia` al SELECT y al `jsonb_build_object`. **Exige migración**, no solo TS.
- **(c) filtro:** guard de **FAMILIA** (`_user_es_familia_de_mascota`), no de prestador. **⚠️ CORRECTAMENTE CERRADO AL VET (A3.10):** el parte es **voz de familia** (Ley 3); el vet no necesita el parte sino el **ORIGINAL CLÍNICO**, que es un **lector A CONSTRUIR**. Abrirle el parte sería darle la traducción en lugar de la fuente. **No se abre.**

## 6 · `obtenerCitasActivasMascota` — `citasMascota.ts:59`

```ts
export interface CitaActivaMascota {
  cita_id: string;
  fecha: string | null;      // NULL = por coordinar (D-439)
  hora: string | null;
  tipo_servicio: string | null;
  estado: 'firme' | 'en_vivo' | 'hold' | 'por_coordinar';
  prestador_id: string | null;
  prestador_nombre: string | null;
  negocio_nombre: string | null;
  atencion_id: string | null;
}
```
- **(a) eje:** 8 Administrativo (agenda/reserva). **Es el lector-vara de L-157 hecho bien** — maneja `fecha` NULL con `.or()` + `nullsFirst` + estado `por_coordinar`. La referencia para cualquier superficie que muestre citas sin fecha.
- **(b) procedencia:** N/A (cita administrativa; el timeline la excluye).
- **(c) filtro:** solo `mascota_id` + estado; RLS.

## 7 · `obtenerPaseosConTrack` — `vitales.ts:33`

```ts
export interface PaseoConTrack {
  fecha: string;
  duracionMin: number | null;
  puntos: Array<{ lat: number; lng: number }>;
}
```
- **(a) eje:** 7 Datos pasivos (GPS medido).
- **(b) procedencia:** NO — `evento_atencion.evento_id → …procedencia`, pero el select **ni trae `evento_id`** (habría que sumarlo).
- **(c) filtro:** `mascota_id` + `estado='cerrada_con_calidad'`; RLS.

## 8 · `obtenerPresupuestosFamilia` — `presupuestos-familia.ts:89`

```ts
export interface PresupuestoFamilia {
  id: string;
  mascotaId: string;
  mascotaNombre: string | null;
  negocioNombre: string | null;
  total: number;
  venceEn: string;
  recibidoEn: string;
  estadoEfectivo: 'enviado' | 'vencido';
  items: PresupuestoItemLeido[];
}
export interface PresupuestoItemLeido { id: string; nombre: string; precio: number; cantidad: number; }
```
Sin parámetros — el scope entero sale de `auth.uid()` vía RLS.
- **(a) eje:** 8 Administrativo (dinero/vigencia).
- **(b) procedencia:** N/A (tabla comercial).
- **(c) filtro:** solo `.eq('estado','enviado')` — **el lector que MÁS depende de la RLS** (`presupuesto_select_familia`). Cara-dueño: un prestador no vería nada útil.

## 9 · `obtenerParteAdiestramiento` — `adiestramiento-reserva.ts:472` — ⚠️ INFERIDO

> No pude determinar cuál era el noveno de la lista. Reporto este por
> analogía estructural con `obtenerParteConsulta`. Candidatos alternativos:
> `obtenerEstadoHogar`, `obtenerResumenServiciosHogar`.

```ts
export interface ParteAdiestramiento {
  cita_id: string;
  sesion: { numero: number; de: number } | null;
  objetivos: ObjetivoDelParte[];
  notas: { texto: string; categoria: string | null }[];
  clips: ClipDelParte[];
  mensaje_familia: string | null;
  instrucciones_familia: string | null;
  progresion: ProgresionNarrativa | null;   // cuerpo no leído — no inventar
  cerrada_en: string;
}
export interface ObjetivoDelParte {
  codigo: string;
  nombre: string;
  nombre_familia: string;
  nombre_familia_en: string;
  alcanzado: boolean;
  nota: string | null;
}
export interface ClipDelParte { storage_path: string; orden: number; duracion_segundos: number | null; descripcion: string | null; }
```
RPC `obtener_parte_adiestramiento(p_cita_id)`.
- **(a) eje:** 6 Comportamiento (+4).
- **(b) procedencia:** NO en el shape; el cuerpo de la RPC no se inspeccionó.
- **(c) filtro:** solo `p_cita_id`; guard, si existe, dentro de la RPC.

---

## Pieza 3 — la voz de la cita `procedimiento` en la agenda (REGLA FIRMADA S72-A)

Al coordinar, la cita todo-libre gana `tipo_servicio = 'procedimiento'`
(migración `20260720150000`). Pero **el vet no puede leer "Procedimiento"
donde el presupuesto dice "Limpieza dental"** — la etiqueta del tipo es
genérica a propósito. **Regla firmada por la mesa (aplica al lector de la
agenda vet Y al hero del cliente, misma voz):**

- **1 ítem** en el presupuesto → su `descripcion_libre`.
- **N ítems** → la primera + `"+N"` (p. ej. *"Limpieza dental +2"*).
- **Sin descripción** → cae a `"Procedimiento"` (la etiqueta del tipo).
- **El TOTAL jamás se muestra en estas superficies** — HOY es multi-actor
  y **D-457 puso la plata en NEGOCIO, gateada por rol**; la agenda (HOY) y
  el hero del cliente no exponen montos.

**Es lo único que le falta al guion para decir la verdad.** No se construyó
en la ventana (toca el lector, va con P3/la cara del vet). El dato vive en
`presupuesto_item.descripcion_libre` de la cita (`evento_cita_servicio.presupuesto_id`).

## Secuencia de trabajo para P3 (nota a la mesa, D-470)

- **Los cuatro baratos de procedencia (H5) son TS puro y SUBEN CON P3:**
  `leerTimelineMascota`, `obtenerVacunaPorEvento`, `obtenerFotosDeEvento`,
  `leerDetalleAtencion` — todos tocan `eventos_mascota` o tienen su FK a
  mano.
- **`obtenerParteConsulta` exige migración y NO bloquea P3 v1** — el parte
  es voz de familia; el vet usa el **original clínico**, lector nuevo.
- **`leerDetalleAtencion` extiende, no cablea** — hoy es ciego al oficio vet.
