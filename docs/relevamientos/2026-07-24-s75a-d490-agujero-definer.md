# S75-A31 · 🔴 D-490 ESTABA MEDIO ABIERTA — el agujero DEFINER (diagnóstico, migración propuesta SIN aplicar)

> **Estado: DIAGNÓSTICO CONFIRMADO. Migración PROPUESTA, espera OK founder (regla 73 — es DEFINER + DDL).**
> El founder tenía razón: con rol recepción, el empleado **SÍ puede escribir la
> consulta clínica**. Mi A28 dio verde falso — probó la POLICY, no el CAMINO.

## 1. LA VERDAD EN LA DB (A31, en orden)

1. **`guillo381+9` tiene HOY solo `recepcion`** (asignado 2026-07-24 02:11) — el
   "sin rol profesional" del founder es el estado REAL, no un recuerdo.
2. **CERO eventos clínicos escritos por +9 en producción** — el agujero no se
   explotó (el founder probó en pantalla; la HC de prueba no quedó, o la deshizo).
3. **HIPÓTESIS LÍDER CONFIRMADA:** `sedimentar_nota_clinica` es **`SECURITY
   DEFINER`** y su guard para escribir la HC es **`_user_opera_cuenta_comercial`
   = titular OR empleado activo, SIN ROL**. **DEFINER salta la RLS — las 15
   policies de D-490 no lo alcanzan.** (El `_user_clinica_tratante_del_caso`
   que sí mira rol aplica SOLO cuando viaja `p_caso`, no a la HC base.)
4. **El camino de la pantalla ES ese RPC:** `consulta/[citaId]:392` →
   `sedimentarNotaClinica` → `rpc('sedimentar_nota_clinica')`.
5. **ASSERT POR EL CAMINO REAL** (el RPC, no SQL contra la tabla), recepción-pura,
   in-txn con ROLLBACK:
   ```
   VEREDICTO: RECEPCION ESCRIBIO por el RPC DEFINER (hc insertadas=1):
   D-490 ABIERTA EN EL CAMINO REAL.
   ```
   Residuos 0 verificado (hc de la cita = 0, +9 conserva `recepcion`).

**Por qué A28 mintió:** probó `user_puede_escribir_clinico` (la policy, que SÍ
rebota recepción) — pero **el RPC DEFINER nunca la consulta**. Es la misma clase
que "el embed se prueba contra la REST API, jamás con SQL directo": un assert
contra policy no dice nada del RPC que salta RLS.

## 2. EL CENSO — ES SISTÉMICO (4 escritores DEFINER clínicos)

| RPC | DEFINER | gate de ROL | guard actual | consumidor en monorepo |
|---|---|---|---|---|
| `sedimentar_nota_clinica` | sí | **NO** (para la HC) | `_user_opera_cuenta_comercial` (activo) | `veterinaria-nota-clinica.ts` (la pantalla del gate) |
| `abrir_caso_clinico` | sí | **NO** | `_user_opera_cuenta_comercial` (activo) | `veterinaria-nota-clinica.ts` |
| `completar_historia_clinica` | sí | **NO** | `user_puede_acceder_prestador` (activo) | (sin consumidor en monorepo — legacy/portal) |
| `registrar_vacuna_mostrador` | sí | **NO** | `_user_opera_cuenta_comercial` (activo) | `veterinaria-mostrador.ts` |

Los 4 tienen `proacl` = `authenticated=X` (cualquier logueado los invoca). **La
escritura clínica por RPC DEFINER está abierta a todo empleado activo, sin
rol** — exactamente lo que la propia D-490 declaró como pendiente: *"las
escrituras por RPC DEFINER quedan cubiertas CUANDO SUS GUARDS ADOPTEN
empleado_tiene_rol"*. Cerré las 15 policies y **no toqué un solo guard DEFINER**.

## 3. LA MIGRACIÓN PROPUESTA (SIN aplicar — OK founder, regla 73)

Cada escritor DEFINER clínico gana el gate de rol de la misma puerta única
(`empleado_tiene_rol`, D-464/D-490), sobre el prestador que el RPC ya resuelve.
`registrar_vacuna_mostrador` es el borde: es el MOSTRADOR (recepción registra
vacuna walk-in, A3.4) — **ese SÍ debe incluir `recepcion`** en su ARRAY; la HC,
el caso y `completar_historia_clinica` no.

```sql
-- S75-A31 · D-490 fase 2: el gate de rol entra a los escritores DEFINER
-- clínicos (la RLS no los alcanza). OK founder pendiente. 76(g): NO RIGE
-- (cero backfill; guardas nuevas en funciones).
BEGIN;

-- sedimentar_nota_clinica: tras resolver v_prestador (o con user_puede_
-- escribir_clinico(prestador, mascota), que ya toma los dos), antes del
-- primer INSERT clínico:
--   IF NOT user_puede_escribir_clinico(v_prestador, p_mascota_id) THEN
--     RAISE EXCEPTION 'rol_sin_escritura_clinica' USING ERRCODE = '42501';
--   END IF;
-- (el helper D-490 exige dueño/profesional; recepción rebota)

-- abrir_caso_clinico: idéntico, con el prestador de la cuenta tratante.

-- completar_historia_clinica: idéntico (aunque hoy sin consumidor en el
-- monorepo, su proacl authenticated la deja invocable).

-- registrar_vacuna_mostrador: EL MOSTRADOR — gate CON recepción:
--   empleado_tiene_rol(v_prestador, ARRAY['dueño','profesional','recepcion'])
-- (recepción registra la vacuna walk-in; A3.4). NO usa
-- user_puede_escribir_clinico (que excluye recepción).

COMMIT;
```

**El literal exacto por función se completa al aplicar** (cada una resuelve su
`v_prestador` en un punto distinto; hay que leer el body completo y colocar el
guard tras esa resolución). **Verificación al aplicar:** el assert POR EL CAMINO
REAL (§1.5) con los tres JWT — titular escribe ✓, profesional escribe ✓,
recepción **rebota `rol_sin_escritura_clinica` ✓** —, más el mostrador con
recepción escribiendo vacuna ✓. `pg_get_functiondef` + `proacl` de cada una.

## 4. LO QUE SE HACE CON LA PANTALLA MIENTRAS TANTO

La cura A25 (que el empleado ABRA la consulta) **es correcta y se queda** — el
problema no era abrir, era escribir sin rol. Con esta migración, recepción abre
(A25) y la escritura rebota **en el motor** (no en la policy). **Hasta que el OK
llegue, D-490 sigue medio abierta: el OTA de la cura A25 NO debería anunciarse
como "D-490 verificada"** — abre la puerta correctamente, pero el gate de
escritura del motor todavía no está.
