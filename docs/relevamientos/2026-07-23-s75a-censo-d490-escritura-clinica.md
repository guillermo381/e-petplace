# S75-A2 · D-490 — CENSO POR SUPERFICIE + MIGRACIÓN PROPUESTA (VERIFICADA EN DRY RUN, **NO APLICADA**)

> **Estado: ESPERA OK DEL FOUNDER (regla 73).** La migración está escrita y
> corrida entera contra la DB viva **dentro de una transacción con ROLLBACK** —
> compila, el cinturón pasa y los asserts discriminan. **No se aplicó nada.**
> El literal completo está en §5 de este documento (regla 76b: texto completo,
> jamás referencia).

---

## 1. QUÉ ESTÁ ABIERTO, CON EL LITERAL

La LECTURA clínica se cerró en S73 (D-464): `user_acceso_clinico_a_mascota`
gatea con `empleado_tiene_rol(pe.prestador_id, ARRAY['dueño','profesional'])`.

La ESCRITURA **no**. Toda escritura clínica del lado prestador se autoriza con
`user_puede_acceder_prestador(prestador_id)`, y su body dice, literal:

```
  -- Dueño del prestador → sí
  IF EXISTS (SELECT 1 FROM prestadores WHERE id = p_prestador_id AND user_id = v_user_id) …
  -- Empleado activo del prestador → sí
  IF EXISTS (SELECT 1 FROM prestador_empleados
             WHERE prestador_id = p_prestador_id AND user_id = v_user_id AND activo = true) …
```

**Sin una sola mención de rol.** Hoy una recepcionista —o un empleado aceptado
y todavía sin ningún rol— puede insertar una historia clínica, prescribir
medicación, diagnosticar una condición crónica y registrar una vacuna. **Es
D-490, y es exactamente el gemelo de escritura del agujero que D-464 cerró del
lado lectura.**

---

## 2. EL EJE: NO SE INVENTA UNA LISTA

`cat_tipos_evento.es_clinico` (S67) ya existe y es la autoridad. Los **14
códigos** con `es_clinico = true`:

`alergia_diagnosticada` · `caso_clinico_abierto` · `caso_clinico_cerrado` ·
`caso_clinico_consultor_agregado` · `caso_clinico_transferido` ·
`cirugia_procedimiento` · `condicion_cronica_diagnosticada` ·
`esterilizacion` · `examen_diagnostico` · `historia_clinica_registrada` ·
`intervencion_permanente` · `medicacion_administrada` ·
`medicacion_prescrita` · `vacuna_aplicada`.

---

## 3. LA TABLA — TODA VÍA DE ESCRITURA CLÍNICA

### 3.1 · Lo que la cura TOCA (15 policies)

| # | Superficie | Gate de hoy (literal) | Después |
|---|---|---|---|
| 1 | `evento_alergia_diagnosticada.alergia_insert` | dueño-mascota **OR** `user_puede_acceder_prestador ∧ user_tiene_acceso_a_mascota` | rama dueño **verbatim** + `user_puede_escribir_clinico` |
| 2 | `evento_alergia_diagnosticada.alergia_update` | `user_puede_acceder_prestador` | `user_puede_escribir_clinico` |
| 3 | `evento_condicion_cronica_diagnosticada.condicion_insert` | ídem sin rama dueño | ídem |
| 4 | `…condicion_update` | `user_puede_acceder_prestador` | ídem |
| 5 | `evento_examen_diagnostico.examen_insert` | ídem | ídem |
| 6 | `…examen_update` | ídem | ídem |
| 7 | `evento_historia_clinica_registrada.hc_insert` | ídem | ídem |
| 8 | `…hc_update` | ídem | ídem |
| 9 | `evento_intervencion_permanente.intervencion_insert` | ídem | ídem |
| 10 | `evento_medicacion_prescrita.medicacion_insert` | ídem | ídem |
| 11 | `…medicacion_update` | ídem | ídem |
| 12 | `evento_medicacion_administrada.medicacion_adm_insert` | dueño-mascota **OR** ídem | rama dueño verbatim + gate |
| 13 | `evento_vacuna_aplicada.vacuna_insert` | dueño-mascota (**el CARNET**) **OR** ídem | rama dueño verbatim + gate |
| 14 | `…vacuna_update` | `user_puede_acceder_prestador` | `user_puede_escribir_clinico` |
| 15 | `caso_clinico.caso_clinico_insert_vet` | `pe.activo = true`, **sin rol** | `+ empleado_tiene_rol(['dueño','profesional'])` |
| — | `eventos_mascota.eventos_mascota_insert` | el padre de TODO | **gate CONDICIONAL** por `es_clinico` (§4) |

### 3.2 · Lo que la cura NO toca, y por qué (declarado, no omitido)

| Superficie | Por qué queda | Literal |
|---|---|---|
| `caso_clinico_update_clinica_tratante`, `consultor_insert_clinica_tratante`, `consultor_update_clinica_tratante` | **YA ESTABAN GATEADAS.** Su helper `_user_clinica_tratante_del_caso` lleva el rol desde S73 | `AND er.rol IN ('dueño','profesional')` |
| `evento_caso_clinico_abierto` / `_cerrado` / `_transferido`, `mascota_perfil_vigente` | **Cero policy de escritura**: se producen solo por DEFINER | `pg_policies` INSERT/UPDATE = 0 filas |
| `user_puede_acceder_prestador` · `user_tiene_acceso_a_mascota` | **NO SE TOCAN.** Blast radius relevado: 60+ policies y 22 funciones (paseo, grooming, adiestramiento, mostrador). Se agrega una puerta **nueva y angosta**; no se le cambia el sentido a una vieja y ancha | — |
| `evento_peso_medicion`, `evento_temperamento_observacion`, `evento_microchip_asignado`, `evento_archivo_adjunto`, todo grooming/paseo/adiestramiento | `es_clinico = false` en el catálogo, y su lectura tampoco pasa por el gate clínico | — |
| `evento_cita_servicio.cita_insert_prestador_walkin` / `cita_update_prestador` | **EL MOSTRADOR.** Recepción sigue recibiendo (A3.4) | — |

---

## 4. LOS TRES PUNTOS FINOS

**(a) El padre no se puede gatear entero.** `eventos_mascota` es el padre de
*todo* evento. Gatearlo por rol cerraría el mostrador, el paseo y el grooming.
El gate va **condicional**: solo si el `tipo` es `es_clinico = true` **y** el
evento viene de un prestador (`prestador_id IS NOT NULL`). Todo lo demás pasa
byte por byte como ayer.

**(b) La rama del DUEÑO se conserva verbatim.** El pet parent que carga su
carnet de vacunas sigue escribiendo lo suyo (S47-S48). El gate es del lado
prestador, no del lado familia.

**(c) El titular no se re-implementa.** `empleado_tiene_rol` ya lo cubre por su
brazo 2 (`'dueño' = ANY(p_roles) AND prestadores.user_id = auth.uid()`), así
que la puerta nueva **no** copia el `EXISTS` sobre `prestadores` — L-150.

---

## 4bis. DOS DIVERGENCIAS — **ELEVADAS A LA TABLA, NO RESUELTAS EN UN PARÉNTESIS**

**D1 · `medicacion_administrada` tiene `tabla_tipada = NULL` en el catálogo,
pero la tabla `evento_medicacion_administrada` EXISTE y tiene policies vivas.**
Es residuo de D-415 (S67 mandó a NULL 8 tipadas fantasma). **Entró a la cura**
porque su LECTURA sí está gateada como clínica (`medicacion_adm_select` llama a
`user_acceso_clinico_a_mascota`): dejarla afuera sería permitir escribir lo que
no se puede leer. **A la mesa: ¿se corrige el catálogo?** — la cura funciona
igual, pero el cinturón §5.5(b) no la cubre (chequea por `tabla_tipada`).

**D2 · `certificado_emitido` tiene `es_clinico = false`, pero su LECTURA está
gateada como clínica** (`certificado_select` → `user_acceso_clinico_a_mascota`).
**NO entró a la cura**: el catálogo es el eje, y cambiar `es_clinico` de un
código es decisión de catálogo, no de esta migración. **A la mesa: ¿el
certificado veterinario es clínico?** Si la respuesta es sí, se corrige el
catálogo y sus dos policies (`certificado_insert`/`certificado_update`) entran
por el mismo patrón — y ahí el gate del padre las alcanza solo.

---

## 5. LA MIGRACIÓN — LITERAL COMPLETO

Vive en `scratchpad/sql/d490_propuesta.sql`; al recibir el OK se deposita como
`supabase/migrations/<ts>_s75a_d490_gate_escritura_clinica.sql` y se aplica.
**Estructura:** ① la puerta nueva `user_puede_escribir_clinico(prestador,
mascota)` con `REVOKE PUBLIC/anon` + `GRANT authenticated` (L-140) · ② las 11
policies de tipadas · ③ `caso_clinico_insert_vet` · ④ el padre condicional ·
⑤ el **cinturón in-migración** (el patrón que atrapó las 10 de D-495): aborta
si hay menos de 15 policies gateadas por rol, y aborta si queda **cualquier**
tipada de un código `es_clinico = true` con escritura autorizada por el gate
viejo — *el censo no manda sobre la DB; la DB manda sobre el censo*.

**76(g) — VEDA DE ESCRITURA: NO RIGE.** DDL de policies + una función nueva.
Cero backfill, cero UPDATE de datos vivos, cero dependencia de un ancla de
conteo.

---

## 6. VERIFICACIÓN YA CORRIDA (dry run con ROLLBACK, cero escritura)

La migración entera + 5 asserts corrieron contra la DB viva en **una
transacción con `ROLLBACK`**:

```
A1 OK  profesional  -> PUEDE escribir clinico
A2 OK  recepcion    -> NO puede escribir clinico     <<< D-490
A3 OK  sin rol      -> NO puede escribir clinico
A4 OK  titular      -> PUEDE (por el brazo 2, sin re-implementar su EXISTS)
A5 OK  recepcion    -> SIGUE recibiendo (mostrador intacto, A3.4)
```

**El fixture DISCRIMINA (L-151), probado a propósito:** invertir A2 (esperar
que recepción SÍ pueda) hace reventar la corrida —
`ERROR: P0001: A2-INVERTIDA REVIENTA COMO DEBE: RECEPCION NO deberia poder
escribir clinico (D-490)`. Un assert que no puede fallar no prueba nada.

**Residuos 0, verificado después del ROLLBACK:**
`user_puede_escribir_clinico existe = false | prestador_empleados=10 |
empleado_roles=5` — la DB quedó exactamente como estaba.

---

## 7. LO QUE FALTA PARA APLICAR

1. **OK del founder** sobre el literal de §5 (regla 73).
2. Al aplicar: `pg_get_functiondef` de la función nueva + `proacl` (L-140) +
   el output del cinturón, pegados en el reporte.
3. El **paso 2 del E2E del founder** ya tiene su assert: la recepcionista
   intentando escribir clínico **rebota**.
