# S73-A · CENSO DE VOZ — el camino del dueño (ítem 6 · L-156: lo que el grep atrapa)

> **Estado: CENSO + LOTE PROPUESTO. CERO ejecutado** — el lote espera el
> gate de strings del founder y viaja junto al lote de B.

## 1 · El censo (números literales)

**(a) VOSEO en `packages/api` — la magnitud real: ~93 mensajes en 29
wrappers** (grep `Probá|Poné|Agregá|Elegí|Tocá|Contanos|Revisá|tenés|podés|intentá|Escribí`).
Top: `veterinaria-mostrador` 21 · `vacunas` 9 · `veterinaria-nota-clinica` 7 ·
`veterinaria-presupuesto` 6 · `planes` 5 · `onboarding` 5 · `direcciones` 4 ·
22 archivos más con 1–3. **D-472 decía "~18 del path vet del prestador" —
el problema es monorepo-wide e incluye el camino del dueño**
(`perfilMascota:10` · `paquetes:43,62` · `paseo:43,61` · `serviciosHogar:16` ·
`zonas:18` · `onboarding` · `citaSuelta` · `timeline` …).
**Nota estructural (no es del lote):** estos mensajes son **es-only por
arquitectura** (el wrapper entrega `mensaje` armado; la pantalla lo pinta).
La bilingüización exige migrar a `codigo→key` en pantalla — eso es D-472
(ampliada abajo), un arco, no un lote.

**(b) VOSEO en el i18n del cliente — 3 valores:**
- `es.ts:928` `errorAccion: 'No pudimos completar la acción. Probá de nuevo.'`
- `es.ts:938` `formulaTitulo: 'Lo que tenés que darle'`
- `es.ts:978` `error: 'No pudimos completar la acción. Probá de nuevo.'`

**(c) `vozServicio` (el mapa código→voz): cubre 12 de 30 tipos ACTIVOS.**
Legales por diseño: `procedimiento` **OMITE a propósito** (la asimetría
canónica D-474/§10ter) · telemedicina y emergencia son `reservable=false`
mudas · hotel/guardería/certificados/exequial: oficios sin abrir · los
procedimientos no-reservables (cirugía/eco/radio/lab) llegan al dueño vía
descripción de presupuesto, no por tipo. **El único hueco VIVO:**
`consulta_especializada` — reservable, visible en el QUÉ vet, y **cae al
`servicio_nombre` de DB** (visto en vivo: "Consulta especializada" en
castellano dentro de la UI en inglés). No existe `servicioVoz.consultaEspecializada`
en ningún diccionario (grep vacío es+en).

**(d) La verruga del para-quién: TRES keys para el MISMO trabajo, DOS
voces distintas.** `veterinaria.paraQuien: '¿Para quién es?'` (`es:444`) ·
`adiestramiento.paraQuien: 'Para quién'` (`es:474` — la voz DIFIERE) ·
`grooming.paraQuien: '¿Para quién es?'` (`es:562`, reusada por paseo desde
S61 con reuso declarado Ley 17.3). Mismo selector, misma pregunta, tres
dueños.

## 2 · EL LOTE PROPUESTO (es+en, tuteo — espera gate founder)

1. **`servicioVoz.consultaEspecializada`** (nace + entra al mapa
   `KEY_VOZ_SERVICIO`): es `'Consulta especializada'` · en
   `'Specialist visit'`.
2. **Los 3 voseo del i18n cliente** (solo cambia es; los pares en ya
   existen): `errorAccion`/`error` → `'No pudimos completar la acción.
   Prueba de nuevo.'` · `formulaTitulo` → `'Lo que tienes que darle'`.
3. **El para-quién se UNIFICA:** nace `explorar.paraQuien: '¿Para quién
   es?'` / `"Who is it for?"` — las 4 pantallas (paseo, grooming,
   adiestramiento, vet) la consumen; mueren `veterinaria.paraQuien`,
   `adiestramiento.paraQuien` y `grooming.paraQuien` (Ley 37 al
   ejecutar). La voz de adiestramiento ('Para quién', sin pregunta) se
   pierde a propósito: una acción, un nombre, todo el flujo (17.3).
4. **Los ~93 de `packages/api`: transposición a tuteo** (es-only queda
   es-only en este lote — la voz correcta primero). Ejemplos del patrón:
   `Probá de nuevo` → `Prueba de nuevo` · `No tenés acceso` → `No tienes
   acceso` · `Poné hasta cuándo` → `Pon hasta cuándo` · `Agregá` →
   `Agrega` · `Elegí` → `Elige` · `Revisá` → `Revisa`. Ejecución
   mecánica post-gate, verificable por el MISMO grep en cero.

## 3 · Enmienda de deuda propuesta

**D-472 se AMPLÍA con el número real:** ~93 mensajes en 29 wrappers
(monorepo-wide, ambos actores), es-only estructural; el lote 4 de arriba
cura el voseo, la bilingüización (codigo→key en pantalla) queda como el
cuerpo de D-472 con su disparo intacto.
