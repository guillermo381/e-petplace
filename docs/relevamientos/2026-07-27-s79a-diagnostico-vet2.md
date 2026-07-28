# S79-A · DIAGNÓSTICO — la falla de vet2 en dispositivo (27 Jul 2026)

**Síntoma:** con vet2 (`5e53c898…`, activo, cuenta activa) la pantalla de
oferta no carga; reintentar deja la pantalla en blanco. Bundle OTA
`019fa584`, publicado ANTES del apply del contrato.

**VEREDICTO: ninguna de las tres hipótesis. La causa es un ESLABÓN
FALTANTE DEL ALTA — `invitar_prestador` crea el prestador SIN su fila
`prestador_empleados rol='dueño'`, y el modelo de actor entero cuelga de
esa fila.** La cura es 100% de DB — **CERO OTA nuevo**: el bundle está
sano y falla correctamente sobre un dato que no existe.

---

## Las tres hipótesis, MEDIDAS Y FALSIFICADAS con literal

**H1 — privilegios por columna: FALSIFICADA.**
(a) `information_schema.column_privileges`: la tabla tiene **39
columnas**, authenticated tiene grant en **37**, y las ÚNICAS dos sin
grant son exactamente `proposito` y `direccion_envio` — el GRANT quedó
perfecto, ninguna quedó afuera por accidente.
(b) Barrido real: **cero** `select('*')`, **cero** `.select()` vacío, y
los DOS únicos embeds de `prestadores(...)` (equipo.ts:737/789) piden
columnas nombradas y concedidas.
(c) Reproducción como vet2 (`70076998…`), primero por SQL y después POR
LA CAPA POSTGREST REAL (sesión password de la demo, sin imprimir
tokens): **TODOS los caminos de la pantalla pasan** — R1 con las
columnas del wrapper (200, 1 fila) · `prestador_servicios` (0 filas,
legal) · `prestador_documentos` (2) · cuenta (1) · especialidades (0) ·
`tipos_servicio` (30) · `cat_especialidades_vet` (6) · franjas (0) ·
`modo_horarios` (1) · `resolver_fee_aplicable` (fee 15% resuelto).
De paso quedó medido qué daría un `*` extraviado:
`403 {"code":"42501","message":"permission denied for table prestadores"}`.

**H2 — mismatch bundle/esquema (firmas DROP+CREATE): FALSIFICADA.**
Por PostgREST con la ARIDAD VIEJA del bundle:
`obtener_paseadores_disponibles` con 3 params → **200 con datos**;
`obtener_veterinarios_disponibles` con 4 params → la función RESUELVE
(llega al guard `no_access_to_mascota` con la mascota sintética — cero
PGRST202, cero cache viejo). Los `DEFAULT NULL` hicieron su trabajo.

**H3 — el estado de vet2 (proposito poblado): FALSIFICADA.** Ninguna
query del bundle nombra `proposito` (la columna nació después del
publish) y todos los reads de vet2 pasan.

## LA CAUSA REAL, con la tabla que la prueba

`prestador_empleados` por prestador (medido):

| Prestador | estado | filas empleado | fila `rol='dueño'` |
|---|---|---|---|
| **Paseos Shyris** (invitado S79) | activo | **0** | **0** |
| **Clínica Los Shyris = vet2** (invitado S79) | activo | **0** | **0** |
| Clínica Aurora | activo | 4 | 1 |
| Carlos | en_revision | 1 | 1 |
| Satori | activo | 6 | 1 |
| Wizard (S58) | activo | 1 | 1 |
| Paseos Andres | activo | 2 | 1 |

**Los DOS prestadores nacidos de `invitar_prestador` son los ÚNICOS de
toda la DB sin fila de empleado.** Y nadie viva la crea: el censo de
escritores de `prestador_empleados` da `crear_empleado_directo` (invita
EMPLEADOS) y el trigger de herencia de chips — **la fila `dueño` la
materializó el BACKFILL de V0 (S67) para los titulares históricos, y
`invitar_prestador` (T4.4, minado de la invitación de empleados) no
copió ese eslabón** porque ningún camino vivo lo producía: era historia,
no motor.

**El eslabón exacto en pantalla:** el taller vet resuelve el titular vía
`obtenerTitularId` (`titular.ts:16` — `prestador_empleados` con
`rol='dueño' AND activo`) para la maquinaria de franjas
(`obtenerFranjasDeServicios`/`aplicarDiffFranjas`, los escritores que
D-540 censó como "hardcodean el titular"); para vet2 devuelve **null** y
la carga muere. Reintentar no puede curar una fila que no existe — por
eso el blanco. Y aunque alguna pantalla tolerara el null, **el motor no
puede funcionar sin esa fila**: la ocupación es de la PERSONA
(MODELO_VETERINARIA §2) — sin fila dueño no hay franjas posibles, ni
disponibilidad, ni reservas. Shyris tiene el MISMO agujero (su gate no
abrió el taller — paseador, y el founder gateó sala/carta/HOY).

## LA CURA (propuesta — NO ejecutada, como manda el mandato)

**Enteramente de DB; el OTA vigente NO se toca:**
1. `invitar_prestador` gana el espejo de V0: tras el INSERT del
   prestador, `INSERT INTO prestador_empleados (prestador_id, user_id,
   rol, activo) VALUES (…, 'dueño', true)` — la fila que TODO titular
   tiene. (Nota: el gobierno D-526 no la frena — DEFINER pasa, la llave
   de la casa.)
2. Backfill declarado de las DOS filas vivas (Shyris + vet2) — dos
   INSERTs deterministas, con 76(g) declarada y verificación de que la
   fila `recepcion`/roles NO se inventa (solo la membresía dueño, como
   V0).
3. Candidato para la mesa: `activar_prestador` suma al checklist la
   verificación "fila dueño existe" — el rebote hablado que habría
   atrapado esto ANTES del dispositivo.

Cruce declarado: es el pariente exacto de D-540 en su raíz — el arco
S73→S79 construyó QUIÉN puede atender y esta fila es el QUIÉN mismo.
