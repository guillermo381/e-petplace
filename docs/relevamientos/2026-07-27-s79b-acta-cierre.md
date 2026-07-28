# S79-B · ACTA DE CIERRE DE SESIÓN

**Fecha:** 27-jul-2026 · **Sesión:** B (territorio `apps/prestador`; regla 76,
cero DB, cero docs maestros — todo motor fue PEDIDO a A y A lo entregó en
sesión). **Typecheck verde al cierre · CERO push (es del founder) · runtime
1.0.3.**

---

## 1. LO CONSTRUIDO, EN ORDEN

### T1 — El audit del Día 1 (`2f1953e`)
Inventario contra la vara doble (§2.6 los siete silenciados · §2.4 las tres
presencias), cero cura. Salida: `2026-07-27-s79b-audit-dia1.md` + el montaje
del micrófono (`2026-07-27-s79b-mic-montaje.svg`). El gate del founder sobre
el audit ordenó las curas de T2.

### T2 — Las CINCO curas del Día 1 (`722fa1d`)
1. **"Prepara tu espacio"** en el home — modo preparación del HOY: la voz
   *"Hoy no tienes citas / cuando una familia agende…"* MUERE mientras el
   espacio no es reservable (prometía un disparo inalcanzable); presiden la
   firma + las 4 tareas con su porqué + check sutil (patrón D-521). Regla de
   existencia: servicios+horarios listos → el módulo desaparece entero.
2. **La bienvenida digital §2.3** (`/bienvenida-dia1`) — carta completa, una
   acción. Nació con puente AsyncStorage DECLARADO; el puente murió en T4
   (ver §4). Firma: **"Guillermo Suárez / founder, e-PetPlace"** (literal del
   founder, `8db9ca2`).
3. **La firma de identidad en el home** (`FirmaPrestador`) + **la voz de
   oficio COMPLETA** (`lib/voz-oficio`): solo-vet y solo-adiestramiento
   estaban MUDOS y la cohorte es de vets; `oficioAmbos` murió (Ley 37).
4. **El aspiracional §2.5** al pie del HOY — texto sobrio, los 15 SON la
   comunidad.
5. **Los tres mudos hablan** — "Se despierta con el uso" en Negocio + 3
   pantallas peldaño-0 (casos heredados · estadísticas · reseñas), réplica
   exacta del patrón /liquidaciones.

Pedidos emitidos a A ese día (los DOS pagados por A en sesión): la marca de
primer ingreso (→ `registrar_primer_ingreso`, T4.6) y la columna `proposito`
(→ lector canónico en la misma RPC). + M1 del perfil recompuesto y M1 de la
vitrina, depositados en `2026-07-27-s79b-t2-bocetos-y-pedidos.md`.

### T3 — La sede y la sala de espera (`430b250`)
- **Las tres correcciones del gate:** el radio ARRANCA SIN DECLARAR (firma
  founder — contorno con el 15 como sugerencia EN LA ETIQUETA, jamás
  preselección; NULL = no declaró) · la voz de la vitrina → *"Dejar que las
  familias elijan con quién"* · la nota "bloqueado por el brief" murió.
- **`SeccionSede`** (compartida perfil + sala): Places VIVO (espejo del
  patrón A4 del cliente), las dos leyes dichas en pantalla (*"Ubicada en el
  mapa."* solo cuando es verdad · *"Escrita a mano — sin punto en el mapa."*).
  **El tripwire de T4.1**: la pieza nació antes del contrato con un tripwire
  de compilación que DISPARÓ en la misma tanda (A aterrizó `6f864e6`) —
  murió con su trabajo hecho, cero ventana de "guardado" falso.
- **La sala de espera** (`/sala-espera`): el perfil de la sede en otro marco
  (condición de alcance cumplida — cero página institucional), voz del
  landing reusada, QUÉ FALTA con camino, QUÉ PASA DESPUÉS sin plazos.
- **M3 atrapó el loop del dedo rápido** (el CTA de la carta antes de cargar
  no escribía la marca) — curado; superseded en T4 por la marca de motor.
- El runbook del gate en dispositivo: `2026-07-27-s79b-t3-sede-sala-gate.md` §4.

### El blanco del gate — dos actos (`7706537` · `5055062`)
- **Acto 1 (hipótesis crash):** nació `PantallaCaida` — la PRIMERA
  ErrorBoundary del app — en las 4 portadas de oferta, verificada con crash
  inducido. **No atrapó en dispositivo: el blanco no era crash.**
- **Acto 2 (la cura real, diagnóstico founder+A):** `empleado_tiene_rol`
  devolvía false por el titular-null (dato roto, motor de A `cfc10d0`) y el
  gate viejo lo convertía en DENEGACIÓN CONFIRMADA — el titular expulsado
  por una cadena de `<Redirect/>` mudos: render legítimo de nada. **La ley
  nueva del hook (`useGateGestor`): LA DENEGACIÓN EXIGE LECTURA COHERENTE**
  — rol=false se contrasta con `obtenerTitularId`; titular null = dato ROTO
  → `GateRoto` habla con Reintentar y Volver, jamás expulsa. Denegación
  coherente → Redirect (Ley 23 intacta). Verificado con estado forzado
  (captura `s79b-gate-roto.png`).
- **La frontera NO se retiró: fue APP-WIDE** (voto de mesa) —
  `PantallaCaidaRaiz` exportada del root `_layout`, AUTOSUFICIENTE
  (providers propios: `useTheme` tira sin provider y el init de i18n es de
  montaje; idioma fijo `es` en el último recurso, declarado).

### T4 — Los cuatro remates (`6639de1`)
1. **El puente murió entero** (`lib/bienvenida.ts` borrado, cero fallback):
   la ceremonia es del motor (`registrarPrimerIngreso`, 1 llamada cacheada
   por sesión JS en el guard; la carta la usa como lector canónico del
   propósito — NULL honesto, el bloque solo dibuja con texto real; hoy solo
   vet2/Clínica Los Shyris). El loop del dedo rápido murió de raíz.
2. **El configurador del plan → MENSUAL** (pedido de A, T9): el campo
   escribe `precioMensualPlan`; `precioPlan` retirada de lectura y
   escritura; sugerido re-expresado en mensual (60% × mes de 4 → 2.4×, paso
   $1); la voz dice el MODELO (*"La familia paga el mes completo. Las
   salidas que no use no se descuentan."*); `planEquivale` murió — **cero
   derivación por salida en la pantalla**. Verificado en vivo: $6.00 →
   sugerido $14.00, neto $11.90 del mensual directo. Honesto declarado: los
   planes viejos per-salida leen mensual NULL → interruptor apagado hasta
   re-encender (la reforma no backfilleó, L-176).
3. **D-560 pagada — LA LISTA BLANCA:** al portal entra SOLO `activo`; todo
   lo demás (incluido el sexto estado que nazca) cae a la sala por default.
4. **D-559 pagada — `sector`** al formulario de sede (un Campo, cero motor).

---

## 2. OPERATIVO

- **Commits B (9):** `2f1953e` · `722fa1d` · `430b250` · `8db9ca2` ·
  `e3420a9` (marcador S79-B) · `7706537` · `5055062` · `6639de1` + este acta.
- **OTAs (4), todos runtime 1.0.3 canal preview, verificados con
  `eas update:list` en su turno:** `ddbc7d78` (T2+T3 — **el PRIMER update
  1.0.3 de la historia del canal**, ancla `e3420a9`) → `237a1413` (frontera,
  `7706537`) → `6bdb1e8b` (gate coherente, `5055062`) → **`d62f3259`
  (remates, `6639de1` — EL VIGENTE)**; en pantalla: `update 019fa6c3 ·
  preview`.
- **M3 con dientes:** atrapó DOS fallas reales antes del dispositivo (el
  loop del dedo rápido; y la verificación del acto 1 probó la frontera con
  crash inducido — el método que después dejó DECIR "no era crash").
  Capturas en `scripts/capturas/s79b-*`.
- **Incidentes declarados:** un `expo start` corrido desde la raíz scaffoldeó
  `tsconfig.json` stub (borrado — clase del app.json S74) · la captura T4
  CONSUMIÓ la ceremonia del demo (la carta del demo ya no reaparece; el gate
  usa cuenta virgen/vet2) · el WIP de A en el árbol jamás se tocó ni
  commiteó (76(f2), verificado en cada commit).

---

## 3. 🔴 VIVO Y SIN CERRAR — EL LOTE DE GATE (sin firma del founder)

**Nada de esto tiene firma; se cierra en la pasada única del founder
(runbook `2026-07-27-s79b-t3-sede-sala-gate.md` §4):**

1. **El lote de strings S79 completo (L-142):** `dia1.*` · `preparaEspacio.*`
   · `agenda.aspiracional` (N=15) · `sede.*` · `salaEspera.*` · `despierta.*`
   + `negocio.despierta*` · `miCuenta.oficio*` (y la muerte de `oficioAmbos`)
   · `equipo.vitrinaToggle` corregida · `caida.*` · `gateRoto.*` ·
   `taller.planModeloVoz`.
2. **El gate POR ÍCONO del micrófono** (§6bis, pendiente desde S78): la
   lámina 21px/44px, claro/oscuro, reposo/escuchando, en vecindad. Declarado:
   sin huella (glifo de control) — el veredicto es del founder.
3. **La Hoja del plan y el rebote del chip** (consumidores de A, `0b7e7a1`)
   junto al taller mensual de B — el círculo entero: el prestador configura
   el mes → la familia ve el mes.

## 4. 📌 PEDIDO ABIERTO — EL SUGERIDO DEL PLAN POR FRECUENCIA DECLARADA
**(orden del founder al cierre, registrado sin curar):**

El `sugeridoMes` de hoy asume un "mes típico de 4 salidas" — una
**frecuencia fantasma**. La regla ordenada: **el sugerido se deriva de la
frecuencia DECLARADA; sin frecuencia declarada, el campo arranca VACÍO y la
ayuda dice por qué.** *Un número inventado sobre una frecuencia fantasma es
el bug original (el ÷4) con otra ropa.* El riesgo quedó marcado EN LA FUENTE
(`paseo/taller.tsx`, comentario junto a `sugeridoMes`) para que ningún
constructor lo herede a ciegas. Qué "frecuencia declarada" es el eje (¿la
del plan del negocio? ¿los días L-D del contrato §6.1?) es letra de mesa —
no lo decide B.

## 5. Deudas candidatas acumuladas de la sesión (las deposita A, 76(a))
- El sugerido por frecuencia declarada (§4 — la mayor).
- La 5ª tarea (condiciones operativas) sin superficie ni motor.
- `CeldaNavegacion` sin slot `fin` (el check de tareas se compuso con `Celda`).
- Glifos faltantes con stand-in declarado: estadísticas · reseñas · vitrina ·
  cuenta comercial.
- La voz de la sala de espera es UNA para todos los no-activo ("en
  revisión") — suspendido/rechazado merecen su voz (decisión de letra).
- +2 viajes del modo preparación en el arranque del HOY (familia D-555).
- El idioma fijo `es` de `PantallaCaidaRaiz` (muere si el init de i18n se
  vuelve de módulo).
