# S73-B — REPORTE DE CIERRE (22 Jul 2026)

Emitido a pedido de la mesa para la transposición del acta S73. Todo lo de abajo
está verificado contra la fuente al momento de emitir (git, DB de EAS, grep) —
no contra memoria de sesión. Árbol limpio en las rutas B; el `M` vivo de
`docs/DEUDAS_CANONICAS.md` es WIP de A (transposición en vuelo) y no se tocó.
**CERO push** (main está ahead 126 — lo ejecuta el founder).

## 0. La tanda B completa (21 commits, todos en main)

`ece7b24` marcador S73 · `cb87b34` item 8a (puerta del dictado) · `a9b8686`
item 10 (mostrador no duplica + la cara del animal) · `1bf4e35` boceto caso
clínico · `500ee8d` relevamiento de equipo · `70fc60d`+`a427e89` capturas M3 ·
`c628d9e`+`6d1ae5a` D-472 tajadas 1-2 · `df00975` máquina de atención ·
`5b5daa0`+`7fca3d9` varas cruzadas M2 (rail · entity chip) · `7ce6b91`+
`14e49fa`+`5082360` motor de equipo (migraciones `20260721210000` y
`20260721230000` APLICADAS, juez verde, D-464 pagada) · `780a3e0` D-488 ·
`fe757b9`+`276140d` el Confirmar apagado habla · `01d4a23` EvitaTeclado ·
`4f83750` tren del mic · `31f3b5d` boceto puerta del mic.

## 1. El lote de strings S73-B — SIN GATEAR (cero aprobado por founder)

Todo es+en, tuteo L-148. Familias del lote:

- **D-472 tajada 1** (`c628d9e`): nace la frontera única `vozErrorVet`
  (`apps/prestador/src/lib/voz-error-vet.ts`) — keys `erroresVet.*` para las
  familias búsqueda·alta·atención·cobro·vacuna·solicitud; 9 sitios recableados
  en las 4 pantallas del mostrador. El censo real era 53 mensajes crudos (24
  con voseo), no los "~18" de la deuda.
- **D-472 tajada 2** (`6d1ae5a`): 51 pares nuevos — estructurar (5) ·
  sedimento (16) · presupuesto (22) · citaVet (2) · oferta (6); 12 sitios en 6
  pantallas. Con las dos tajadas, las 11 familias del path vet prestador
  quedan cubiertas. `veterinaria-reserva` FUERA del lote (su consumidor es el
  cliente — territorio A).
- **Máquina de atención** (`df00975`): voces de cargando/error/Reintentar +
  vacío con camino ("Prende un servicio en tu consultorio…" + CTA "Activar
  servicios") + `sinServicios` voseo→tuteo.
- **La puerta del dictado** (`cb87b34`): `dictadoAyuda` partida (flujo) +
  `dictadoCampoAyuda` nueva (el mic del teclado, junto al campo).
- **El Confirmar apagado** (`fe757b9` + `276140d`): la línea de posología
  ("Completa la dosis y la frecuencia para confirmar.") + la enumeración por
  guard ("Falta el motivo de consulta." · "Falta el diagnóstico." · "Falta la
  condición del caso." · "Elige el caso activo.").
- **De paso D-481** (`a9b8686`): `registradoTocar` voseo→tuteo (string tocado,
  cero barrida).

## 2. El gate en dispositivo de las pantallas B — DESBLOQUEADO (hueco de OTA hallado y cerrado)

**El hueco:** el OTA que estaba vigente al emitir este reporte NO traía las
tres curas finales. Estado verificado contra EAS (`update:list` +
`update:view`):

- Vigente entonces: group **`4c4b2b19-a01e-4d75-8a14-189f05e92160`** (branch preview,
  runtime 1.0.2, publicado 2026-07-22T03:29Z), `gitCommitHash` anclado a
  **`780a3e0`**. Trae: D-488, la máquina de atención, D-472 tajadas 1-2, el
  mostrador (Ley 23 + la cara del animal), la puerta del dictado, el marcador
  `[bundle] prestador S73` + `[update]` L-160.
- **Fuera del OTA** (posteriores a `780a3e0`): `fe757b9` (posología habla) ·
  **`276140d` 🔴** (el Confirmar enumera QUÉ falta) · **`01d4a23` 🔴**
  (EvitaTeclado — la cura del bug que el founder reportó en campo).

**RESUELTO POR MESA (22 Jul, camino (a) con verificación) — OTA PUBLICADO:**
group **`bc12ed81-17f5-4f8a-94c6-689a91b0f257`** (branch preview, runtime
1.0.2, android+ios, commit `4b501e5`; android `019f8b89-e823-764f…` · ios
`019f8b89-e823-7004…`). Entran los tres commits que faltaban: `fe757b9` ·
`276140d` 🔴 · `01d4a23` 🔴. **El guion del gate queda DESBLOQUEADO.**

La verificación que lo habilitó (literal, no supuesto): el held de
`packages/ui` es **INERTE en prestador** — en `SelectorOpcion` TODO el modo
entidad (flexBasis 48% + maxWidth 240, lengüeta, LLENO, boxShadow, centrado
N=1, flexWrap) cuelga de `entidad` default `false` y a nivel chip exige
además `opcion.avatar !== undefined`, con la rama vieja byte-idéntica como
else; `AvatarMascota` suma talla `'entidad'` al union (default `'md'`
intacto) y `sobreLleno` default `false`; los tokens `controlLleno`/
`sobreControlLleno` son aditivos y solo se leen dentro del camino entidad.
Censo prestador: 18 consumidores de `SelectorOpcion`, CERO pasa `entidad`/
`avatar`/`sobreLleno`; los 4 selectores migrados son de `apps/cliente`.
También entra al bundle la enmienda de A a `CeldaNavegacion` (`icono`
requerido→opcional, render gateado — aditiva pura, todo caller existente lo
pasa) y la muerte de `LaminaS73` (galería, el prestador no la importa —
typecheck del prestador VERDE pre-publish). Nota de mesa registrada: el chip
ya viajaba en el canal del CLIENTE desde `ac20799` — el hold era "no
construir más", no "no despachar lo construido".

**Guion del gate (desbloqueado):** paso 0 = `[update] id=…` contra el group
`bc12ed81…`, NO `embedded=true` (L-160) · el teclado arriba con el campo
enfocado en consulta/mostrador/presupuesto/taller (**L-162: la web no prueba
teclado — este gate es SOLO dispositivo**) · el Confirmar apagado diciendo
cada falta · el mostrador con cuenta reconocida SIN botón de alta (Ley 23) ·
la cara del animal en atención y cobro · la consulta abierta por URL pelada
(D-488) · el vacío de atención terminando en el taller. Capturas M3 de
referencia en `scripts/capturas/s73-b-*.png` (web; las de teclado no existen
por el límite declarado del harness).

**Pregunta de producto reportada SIN curar** (`276140d`): ¿es legal la nota
sin diagnóstico ("todavía no sé, pido exámenes")? El guard es de MOTOR
(`RAISE nota_sin_diagnostico`) — decisión de MODELO_VETERINARIA, no de UI.

## 3. El mic propio — SPIKE PASS, tren PREPARADO-INERTE

- **Veredicto del spike (`4f83750`): PASS.** `expo-speech-recognition@56.0.1`
  compila en SDK 57 — BUILD SUCCESSFUL local, 642 tareas, el módulo en el
  grafo; config plugin limpio (RECORD_AUDIO + package visibility Google en el
  manifest + los dos NSUsageDescription iOS en app.json). No hay tag sdk-57
  upstream: el riesgo era real y quedó resuelto por compilación, no deducido.
- **INERTE hasta la build:** cero import en JS — los OTA sobre runtime 1.0.2
  no lo tocan (L-134). `pnpm-lock.yaml` fue hunk único declarado (76c).
- **Qué lo despierta, en orden:** (1) la vara cruzada de A sobre el boceto de
  la puerta (`31f3b5d`, `docs/relevamientos/2026-07-21-s73b-boceto-puerta-mic.md`
  — viaja por mano del founder; UN toque arranca, escucha visible §7.1, JAMÁS
  auto-grabar, parciales por APPEND, sin reconocimiento el botón no se dibuja);
  (2) **el tren de la PRÓXIMA build nativa** — jamás una build solo por él
  (decisión S72-P4). El puente vigente sigue siendo el mic del teclado con su
  puerta abierta (`cb87b34`).

## 4. El censo del teclado del prestador (D-498) — DEPOSITADO ACÁ

Re-medido al cierre contra fuente (grep `<Campo|<TextInput` en
`apps/prestador/src/app`), **enmendando el "8 no-vet" del commit `01d4a23`:
son 12** (L-141/grep-vs-juicio; el conteo de sesión fue de memoria de tanda).

**20 pantallas con campos de texto reales.** Las 8 del path vet — CURADAS con
`EvitaTeclado` (`01d4a23`, pendiente de gate en dispositivo):
`consulta/[citaId]` (15 campos) · mostrador `index`/`nueva`/`autorizar`/
`atencion` (1·4·1·3) · `presupuesto/nuevo` (2) · `procedimientos` (1) ·
`taller` (2).

Las **12 no-vet, SIN curar** — esperan el veredicto del founder sobre la
receta antes de propagar (letra del founder: *"que eso no pase en NINGÚN
campo"*): `(tabs)/cuenta/perfil` (11 campos — la densa) · `cuenta-comercial/
nueva` (3) y `bancarios` (3) · `adiestramiento/taller` (3) y cita
`cierre`/`durante` (2·1) · paseo `cita/cierre`/`durante` (1·1) · grooming
`cita/cierre`/`durante` (1·1) · `login` (2) · `vacaciones` (1).

La causa de raíz quedó en el componente (`evita-teclado.tsx`): el manifest
trae `windowSoftInputMode=adjustResize` pero SDK 57 fuerza edge-to-edge en
Android y ahí el sistema NO achica la ventana. La receta es la de la Hoja
(KeyboardAvoidingView ios=padding/android=height, gates S45+), composición
LOCAL patrón techo-oficio; si el cliente la pide, la enmienda a `packages/ui`
es pedido a A. **El paso D-498 que sigue: los dos censos (este + el cliente de
A, `2026-07-21-s73a-censo-teclado-cliente.md`) se comparan por mano del
founder para que la casa tenga UNA receta — disparo S74.**

## 5. La vara sobre el entity chip v2 — corrió sobre el BOCETO; lo construido espera S74

- Mi vara M2 (`7fca3d9`, reporte `2026-07-21-s73b-vara-cruzada-entity-chip.md`):
  **APTO, voto V2 ratificado**, método L-158 con números (squircle 0.32,
  borde 1.5, alto 44, radius 10 — geometrías verificadas contra fuente). Dos
  enmiendas vivas: **E1** — `borderCurve` continuo es SOLO iOS; en el Android
  del founder son borderRadius simples → **la firma V1/V2 es EN DISPOSITIVO
  (D-284)**, no sobre captura web. **E2** — el slot entidad rompe el padding
  solo a la izquierda y hereda el spinner S62 del adorno.
- A construyó el V2 provisional DESPUÉS de la vara (`771b7b3`; orden invertido
  declarado en su acta, reversible) y quedó en **HOLD del founder**
  (`4ce8e78`). **Pendiente S74: la vara sobre lo CONSTRUIDO no corrió** — corre
  junto a la lectura de mesa del hold, con E1 como condición de firma. El
  registro de A (fill-vs-fondo dark 2.24–2.47 con atenuante) queda anotado:
  sube a deuda si un usuario real lo reporta.

## 6. Otros pendientes declarados de B (que no se pierdan)

- **Hallazgo L-140 legacy fuera de scope** (`5082360`, regla de la red):
  `user_tiene_acceso_a_mascota` trae `anon=X` y PUBLIC en proacl (pre-ley).
  NO tocado — a la mesa.
- **Boceto del caso clínico** (`1bf4e35`): viaja a la vara de A por mano del
  founder ANTES de construir; el lector `obtener_eventos_caso` es pedido de
  motor con gate D-464 nombrado. La pata timeline del dueño (clase C8) es
  territorio A, reportada sin ejecutar.
- **D-464 pagada con ventana declarada**: `mascota_perfil_vigente` gateado con
  ventana S73→S74; **D-489** nombra `tiene_emergencia_activa`.
- **D-486** (DROP de la columna `rol` legacy, congelada con comment) y la
  purga de los 3 empleados desactivados (**D-492**, de A).
- **La deuda del HUB VET** (de mi vara del rail, `5b5daa0`): destino vet v1
  aceptable y la deuda nace YA (clase C4/callejón) — la numera A.
