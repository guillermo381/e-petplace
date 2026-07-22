# S73-B · BOCETO M1–M5 — LA PUERTA DEL MIC PROPIO (dictado en vivo)

> **Estado: BOCETO — viaja a la vara cruzada de A. NO construido** (el
> import del módulo espera la BUILD; el paquete+plugin ya viajan
> inertes, `4f83750`). **Vara del founder, verbatim (S73, registro):**
> *"creía que iba a estar el ícono sobre la pantalla y automáticamente
> empezaba a escuchar, como funciona en este chat."* La decisión S70
> ("el mic es el del teclado") murió en su SEGUNDO contacto con usuario
> real — primero no se encontraba (S72), después no es lo que el
> producto promete (S73). El camino (a) — autofoco + hint — queda como
> PUENTE declarado y muere cuando este mic viva.
> **SPIKE PASS:** expo-speech-recognition@56.0.1 compila en SDK 57
> (BUILD SUCCESSFUL local; plugin aplicado: RECORD_AUDIO + package
> visibility en manifest). Fallback si el runtime decepciona en
> dispositivo: expo-audio + Edge (la vara de latencia se declara al
> founder ANTES de tomarlo).

## M1 · TESIS
**"Tocás el mic y la nota se escribe sola mientras hablás."** Escucha
EN VIVO con parciales aterrizando en el campo — la vara es este chat,
no grabá-subí-esperá.

## M1 · Las 7 preguntas (§1c)
1. **Trabajo:** dictar la nota — comando con estado vivo (empezar/parar
   escucha). No existe en el diccionario → entra por Ley 11/19 como
   patrón nuevo GATEADO (el control de dictado).
2. **¿Existe en la casa?** El estado "vivo" tiene lenguaje: glow/pill
   §7.1 (`CitaEnVivo`) — la ESCUCHA reusa esa gramática (un solo
   elemento vivo por pantalla), no inventa otra. El botón es `Boton`
   con ícono; el campo sigue siendo `Campo`.
3. **Vecinas:** la fase dictado actual (título + campo + hint puente +
   Estructurar). El mic se suma AL LADO del campo; el teclado NO muere
   (editar tipeando sigue siendo primera clase — la regla del teclado
   §15b intacta para texto libre).
4. **Tesis/firma:** la FIRMA es el comportamiento — las palabras
   apareciendo en el campo mientras el vet habla.
5. **Capa/dosis:** oficio vet, dosis baja. El estado de escucha usa la
   semántica de "en vivo" (Ley 7: glow dark-only / anillo+pill claro).
6. **Estados** ↓ M1-estados. **7. Chanel:** el hint del puente
   (`dictadoCampoAyuda`) MUERE cuando el mic viva (una puerta, no dos
   voces); el autofoco se re-evalúa en el gate (¿mic y teclado
   compitiendo al entrar?— el boceto propone: SIN autofoco cuando el
   mic exista; el teclado sube al tocar el campo, el mic al tocar el
   mic).

## M1 · ESTADOS (los exigibles)
- **Reposo:** botón mic visible junto al campo. JAMÁS auto-graba al
  entrar (**letra de mesa: consultorio = conversaciones con el dueño;
  grabar sin gesto explícito es problema de privacidad**).
- **Pidiendo permiso:** el flujo del SO, una vez; denegado → voz
  honesta con camino (ajustes) y el teclado sigue siendo la vía.
- **ESCUCHANDO (el vivo):** UN toque arranca; estado VISIBLE (anillo +
  pill "● Escuchando", gramática §7.1); los PARCIALES aterrizan en el
  campo por APPEND (jamás pisan lo tipeado); otro toque PARA.
- **Sin reconocimiento disponible** (`isRecognitionAvailable()` false /
  sin Google Speech): el botón NO se dibuja (Ley 23 — la puerta no
  ofrece lo que va a rechazar) y el teclado queda como siempre.
- **Error en vivo** (red/servicio caído a mitad): la escucha para
  DICIENDO que paró; lo ya transcrito QUEDA en el campo (nada se
  pierde); reintento = volver a tocar el mic.
- **Memorial:** no aplica (no hay consulta sobre memorial — la puerta
  del mostrador no la ofrece).

## M4 · CONTRATO DE DATOS
Entrada: audio del SO → parciales/finales de `expo-speech-recognition`
(es-EC primario; el idioma del reconocedor se releva en gate — no se
hardcodea sin probar). Salida: TEXTO al estado `dictado` existente —
**el resto del pipeline NO cambia** (estructurar → confirmación → muro
§8.3 → sedimentar: la trampa L-139 que HOY es PASS sigue rigiendo tal
cual — el mic solo cambia cómo entran las palabras). Nada se persiste
del audio (cero grabación almacenada, v1).

## M5 · DICCIONARIO
`Boton` + `Icono` (glifo mic = ícono NUEVO del set b′ → hoja de
contacto §6b + gate por ícono, DIRECCION_ARTE) · estado vivo §7.1 ·
`Campo` intacto · voces nuevas (`escuchando`, `micNoDisponible`,
`permisoMicDenegado`, es+en) al lote de gate. El hint puente y su key
mueren (Ley 37) en el MISMO commit que estrena el mic.

## Lo que pide de otros
- **Vara cruzada de A** sobre este boceto (antes de construir).
- **El glifo mic** al ilustrador de sesión (cláusula S71: SVG en
  sesión, gate por ícono).
- **La BUILD**: version bump + `eas build` preview con el tren completo
  (mic + lo que la mesa suba). El "reconoce en dispositivo" del spike
  se cierra en el PRIMER arranque de esa build (guard runtime ya
  contemplado en estados).
