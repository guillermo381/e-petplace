# S74-A · CENSO de la clase `ok:false` — LADO CLIENTE (aporte cruzado a D-511 de B)

> **CENSO, cero cura** — misma disciplina que D-495 y que la candidata L-164
> (*el censo se recorta por SUPERFICIE, no por el caso que lo disparó*).
> D-511 la deposita B (aún no está en el canon al escribir esto); este es el
> lado que A toca: los wrappers del cliente.

## 0 · La clase

Un RPC que **devuelve `jsonb` con `{ok:false, mensaje}` en vez de levantar
excepción** + un wrapper que solo mira el `error` de PostgREST ⇒ **el rebote
viaja a la pantalla como ÉXITO** (el caso vivo: el founder invitándose a sí
mismo, D-508).

## 1 · El corte por SUPERFICIE (los dos lados, no el grep de uno)

**Lado DB** (`pg_get_function_result = 'jsonb'`, excluidas
`simular_*`/`escenario_*`/`test_*` del repo de pruebas):

| Medida | Valor |
|---|---|
| RPCs jsonb que mencionan `'ok'` | **74** |
| …de esas, con **rebote suave literal** (`'ok', false`) | **3** |

Las 71 restantes usan el patrón **SANO de la casa**: `ok:true` en el retorno
y `RAISE EXCEPTION '<codigo>'` para los errores (que el wrapper normaliza por
`startsWith`, L-115). **El patrón enfermo no está difundido: es un enclave.**

**Las 3 con rebote suave — TODAS del subsistema de invitación (herencia
legacy, pre-monorepo):** `crear_empleado_directo` ·
`aceptar_invitacion_pendiente_login` · `rechazar_invitacion_pendiente_login`.

## 2 · El cruce con los wrappers

| RPC | ¿Wrapper en el monorepo? | Estado |
|---|---|---|
| `crear_empleado_directo` | **SÍ** — `equipo.ts` (territorio B) | **B YA lo curó** (`equipo.ts:131` documenta "los rebotes SUAVES") |
| `aceptar_invitacion_pendiente_login` | NO (cero hits) | sin consumidor en el monorepo |
| `rechazar_invitacion_pendiente_login` | NO (cero hits) | sin consumidor en el monorepo |

## 3 · VEREDICTO DEL LADO CLIENTE: **CERO EXPOSICIÓN**

**Ningún wrapper del camino del dueño llama a un RPC de la clase.** Los 12
`simular_*`/`escenario_*`/`test_*` que también rebotan suave viven en el repo
de pruebas y **ningún wrapper del monorepo los toca** (grep en cero). No hay
nada que curar de este lado; el enclave es del subsistema de invitación.

## 4 · Límite declarado del censo (L-164 candidata, cláusula (c))

Este censo detecta el patrón **literal** `'ok', false` en `prosrc`. **No
cubriría** un RPC que compute el flag por variable (`jsonb_build_object('ok',
v_resultado)`) ni uno que use otro nombre de campo de error. **La verdad final
la firmaría un assert ejecutable** (p. ej. un test que llame cada RPC jsonb con
entrada inválida y verifique que el wrapper propaga `ok:false`) — hoy no
existe; se declara el hueco en vez de afirmar cobertura total.
