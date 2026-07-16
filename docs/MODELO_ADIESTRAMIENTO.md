# MODELO_ADIESTRAMIENTO — El contrato del servicio de adiestramiento

> **Versión: v1.1 — S63 (15 Jul 2026).** La construcción del programa
> disparó (migración `20260715180000`): Decisión U FIRMADA en
> `MODELO_FINANCIERO.md` v2.8 · guard duro de cierre en orden (§8) ·
> vigencia vencida = reembolso proporcional declarado + motivo
> capturado sin triage (§8) · triage de causa como diferido v2 (§9).
> **Versión anterior: v1.0 — S62 (15 Jul 2026). Letra FIRMADA por el founder**
> (decisiones 1-7 resueltas en sesión founder+arquitecto S62; los seis
> corchetes de §12 CERRADOS por aprobación integral del founder
> adoptando las propuestas del arquitecto — interpretación DECLARADA:
> cualquiera se reabre como enmienda barata ANTES de que su
> construcción dispare). Dictada por el arquitecto (escritor único de
> docs, regla 76 — el commit lo hace la Sesión A).
> **Contrastes obligatorios:** `MODELO_FINANCIERO.md` v2.7 (el camino de
> la plata rige sin excepción; la Decisión U del programa secuencial se
> enmienda allí cuando la construcción dispare), `MODELO_PASEO.md` v1.5
> (el chasis de reserva/cobro que este servicio HEREDA),
> `MODELO_GROOMING.md` v1.1 (el precedente del menú de dos capas y del
> Antes/Durante/Después), `MODELO_LOYALTY.md` v1.0 §2/§3 (la progresión
> visible es narrativa, jamás juego), `POLITICAS_EPETPLACE.md` (P14
> reagendamiento como precedente; **P20 candidata — custodia — es
> precondición §10.2 y vive en la sesión de legales D-405**),
> `DISEÑO_EXPERIENCIA.md` v1.9 (gramática canónica de reserva, escalera
> del precio honesto), `DIRECCION_ARTE.md` §4 (los guijarros como
> lenguaje candidato de los objetivos alcanzados), `BIO_EXPEDIENTE.md`
> (la bitácora de la familia es sedimento del expediente).
>
> **Qué es este doc:** el modelo del ADIESTRAMIENTO como servicio — qué
> se vende, cómo se cotiza, dónde ocurre, qué registra y qué ve la
> familia. Lo cerrado, cerrado está; los huecos se declaran con su
> disparo. Ninguna feature de adiestramiento nace contradiciendo este
> contrato.

---

## 1. Qué se VENDE: sesión suelta Y programa (founder S62)

Se compran **dos formas** del mismo oficio:

- **Sesión suelta** — una sesión de adiestramiento, unidad simple.
- **Programa** — N sesiones **ORDENADAS con contenido progresivo**.
  El programa es la unidad natural del oficio: la sesión 3 no es
  intercambiable con la 7. **El programa NO es el paquete de salidas**
  (Decisión T): hereda su chasis financiero (un pago, N devengos al
  cierre de cada sesión) pero el consumo es **SECUENCIAL, jamás FIFO**
  — **Decisión U FIRMADA en S63** al disparar la construcción
  (`MODELO_FINANCIERO.md` v2.8).

**El catálogo de programas: tres niveles + especialidades (founder
S62):**

- **Básico** · **Medio** · **Experto** — la escalera troncal de
  obediencia.
- **Especialidades** — catálogo propio, paralelo a la escalera (no un
  cuarto nivel): conducta específica (ansiedad por separación,
  reactividad, caminar con correa), trucos, etc. Los nombres y el
  contenido los declara el adiestrador sobre el vocabulario de la
  plataforma (§5).
- **N sesiones por programa:** la plataforma SUGIERE rangos por nivel
  (básico 6-8 · medio 8-10 · experto 10-12); el adiestrador declara la
  N de su programa dentro del espíritu del rango (cerrado §12.4).

**Comprable ≠ registrable** (regla madre heredada del grooming): se
venden la sesión y el programa; los **objetivos/comandos trabajados**
son el vocabulario del Durante — jamás se venden sueltos.

## 2. ESPECIES: solo perros v1 (founder S62)

`especies_elegibles = ["perro"]` — techo de PLATAFORMA, espejo de la
decisión S57 del paseo. El adiestramiento felino existe pero es otro
oficio; se amplía con disparo (el primer adiestrador felino real que
lo pida Y una decisión founder).

## 3. DÓNDE: domicilio camino feliz, con DOS variantes + EN CAMPO

El adiestrador declara sus modalidades (patrón `atiende_*` del
grooming):

1. **Domicilio — CON LA FAMILIA** (camino feliz v1): el adiestrador
   trabaja en la casa, con la familia presente. El contexto del hogar
   ES parte del trabajo conductual.
2. **Domicilio — RECOGIDA**: el adiestrador recoge al perro, trabaja y
   lo devuelve. **La modalidad NO se abre a prestadores reales sin la
   letra de custodia P20 firmada (§10.2, sesión D-405)** — la
   responsabilidad durante el traslado no es hueco de producto, es
   letra legal. Puede construirse y quedar en seeds DEMO.
3. **EN CAMPO** (nombre firmado §12.1): el espacio del adiestrador
   (campo, escuela, área de trabajo). Es el "local" de este oficio,
   con dirección de sede (patrón groomer).

Dirección-en-cita hereda D-339 (snapshot); el recargo por modalidad,
si el adiestrador lo declara, clona el camino del recargo de domicilio
del grooming (D-392). El traslado de la recogida NO está modelado
(espejo D-393 — la ocupación es contigua); v1 lo tolera, con
adiestradores reales se modela buffer.

## 4. PRECIO: por sesión + por programa (founder S62)

- **Precio por sesión suelta**: único del adiestrador (sin matriz por
  talla — la variable del oficio no es el tamaño sino el objetivo, y
  eso lo dice el programa).
- **Precio por PROGRAMA**: propio, declarado por el adiestrador —
  **NO es N × sesión** (normalmente porta descuento implícito; la
  plataforma no lo impone, lo permite).
- Recargo opcional por modalidad (§3), camino D-392.
- **Congelado al reservar** (patrón snapshot S54/S55): checkout jamás
  re-resuelve, cero precio calculado en el cliente, desglose
  server-side (escalera del precio honesto, DISEÑO v1.8).

## 5. ANTES / DURANTE / DESPUÉS

- **ANTES — la ficha conductual de 30 segundos:** vista FILTRADA de la
  mascota al oficio: señales conductuales (acá el circuito de
  `nervioso_otros_perros` de S46 se CIERRA — nació "para futuros
  adiestradores"), edad/momento vital, condiciones pertinentes,
  historial de programas previos **y la bitácora de la familia (§7)**.
  Jamás la HC completa.
- **DURANTE — registrar sin fricción + el medio del oficio es el
  VIDEO (founder S62):** el adiestrador registra **objetivos
  trabajados** (vocabulario registrable de la plataforma, patrón chips
  del grooming) + nota conductual + **CLIPS CORTOS de video** — la foto
  no muestra un "sentado" logrado; el movimiento sí. **Techo v1
  firmado: clips de 15-30 segundos, máximo 3 por sesión** (cerrado
  §12.3). El video es infra NUEVA (bucket propio, límite de tamaño,
  compresión en captura, reproducción en el parte) — su tanda se
  diseña con la regla 76 y es precondición §10.4. La captura jamás se
  exige en caliente (regla §8 del grooming heredada); **ninguna
  captura exigida al cierre en v1** — el piso de calidad alcanza
  (cerrado §12.6).
- **DESPUÉS — el parte que enseña:** cierre con piso de calidad (≥1
  objetivo trabajado + ≥1 nota o clip) + **mensaje a la familia** +
  **estado de progresión del programa** ("Sesión 3 de 8 — Zeus ya
  responde al llamado con distracciones") + **INSTRUCCIONES PARA LA
  FAMILIA (founder S62)**: sección propia del parte con el refuerzo de
  comportamientos entre sesiones — qué practicar, cómo y cuánto. En
  v1 las instrucciones son texto del adiestrador (con plantillas
  sugeridas del vocabulario); la tarea ESTRUCTURADA con seguimiento es
  v2 (§9). El devengo ocurre al cierre (variante (b), espejo literal
  del paseo/grooming).

## 6. LA PROGRESIÓN VISIBLE: narrativa + objetivos alcanzados (founder S62)

- **Narrativa de vínculo, jamás barra ni score** (MODELO_LOYALTY
  §2/§3 rige literal): *"Zeus ya domina 3 de los 5 comandos del
  programa básico."*
- **Los objetivos ALCANZADOS se muestran, con imagen** (founder S62):
  cada objetivo logrado gana su momento visual — lenguaje candidato:
  los **guijarros** de DIRECCION_ARTE §4 (superficie grande, momento
  de marca; el gate del founder decide el craft). No es checklist de
  tareas del dueño — es el registro celebrado de lo que la MASCOTA
  logró; la distinción es de sujeto y la letra la protege.
- Los clips del Durante son el respaldo emocional de la progresión:
  el dueño VE el "quieto" de la sesión 5.
- **Memorial y M6 apagan todo** (MODELO_LOYALTY §7.1 — estructural,
  no filtro de UI).

## 7. LA BITÁCORA DE LA FAMILIA (founder S62 — pieza nueva del ecosistema)

La familia puede registrar **lo que evidencia de su mascota** entre
sesiones — especialmente dentro de un programa: chips de conducta
observada (vocabulario compartido con los registrables del oficio,
con voz de familia) + texto libre, patrón novedades del paseo pero
**del lado familia**.

- **Es sedimento del Bio-Expediente**: la primera superficie donde la
  FAMILIA deposita evidencia conductual estructurada — el expediente
  deja de alimentarse solo del ecosistema. Información valiosísima a
  futuro (Coach, producto-que-sabe, el propio adiestrador en el Antes
  de la siguiente sesión).
- El adiestrador la VE en su Antes (la bitácora informa la sesión
  siguiente — el circuito se cierra en ambas direcciones).
- **P5 rige**: eventos aportados por menores se marcan y no acumulan
  en el motor de loyalty; el tratamiento loyalty de la bitácora sigue
  MODELO_LOYALTY §5 (expediente que se completa es fuente legítima —
  la calibración fina se decide al construir, jamás incentivo que
  induzca a inventar observaciones).
- v1 vive dentro del contexto del programa/servicio activo; la
  bitácora UNIVERSAL (sin servicio activo) es candidata natural de
  expediente — se declara, no se construye acá.

## 8. RESERVA Y COBRO: el chasis heredado ENTERO

Gramática canónica v1.8 (MASCOTA → QUÉ → DÍA → HORA → QUIÉN → PAGAR;
en el QUÉ vive sesión-o-programa + modalidad si hay más de una) ·
momento-primero · hold de 15' con expiración perezosa · regla 7.13 (no
se oferta quien no puede cobrar) · pago simulado DECLARADO hasta
Kushki · devengo al CIERRE variante (b) — en el programa, N devengos
secuenciales, uno por sesión cerrada · fee 15% genérico existente ·
**duración de sesión declarada por el adiestrador: pasos de 15',
default 60'** (cerrado §12.5) · motor de ventana INTACTO (cada sesión
entra con su `duracion_minutos`; ocupación global por prestador).

**El agendamiento del PROGRAMA (cerrado §12.2): todas las sesiones se
agendan AL COMPRAR** — cadencia semanal sugerida, mismo adiestrador
firmado (la constancia es parte del método; el calendario completo la
protege), con reagendamiento por sesión bajo letra P14. La alternativa
rolling queda registrada como variante descartada v1.

**El ORDEN del programa es letra dura (S63, founder):**

- **La reagenda respeta a las vecinas:** la fecha nueva de la sesión k
  queda ESTRICTAMENTE entre la fecha vigente de la k−1 y la de la k+1
  (error `orden_programa_violado`), y dentro de la vigencia.
- **Guard duro de cierre fuera de orden:** ninguna función de cierre —
  presente o futura — cierra la sesión k con la k−1 sin cerrar
  (`sesion_anterior_abierta`, trigger EN LA FUENTE, patrón D-386). El
  guard de reagenda protege el orden de FECHAS; este es el cierre
  defensivo.

**La VIGENCIA del programa (S63, founder):** el adiestrador declara
`vigencia_dias` en su catálogo; la matrícula la congela como fecha
límite a la compra. **Al vencer con sesiones sin ejecutar:** las
sesiones restantes se cancelan (la agenda se libera), el dueño recibe
**reembolso proporcional AUTOMÁTICO** — la suma de los precios
snapshoteados de las sesiones canceladas, SIMULADO Y DECLARADO en la
matrícula (patrón P14a; jamás toca el ledger: esas sesiones no
devengaron, regla 7.14) — y el **motivo queda capturado** en
`motivo_vencimiento` (catálogo chico: sin_uso / conflicto_horario /
problema_adiestrador / fuerza_mayor / otro). **v1 SOLO registra el
motivo (`sin_uso` por defecto) — SIN triage y SIN acción sobre él**
(diferido §9). El aviso previo es UNO y sereno (patrón P16e).

## 9. DIFERIDOS con disparo

- **Tarea estructurada con seguimiento** (v2): la instrucción del
  parte gana estado hecho/no-hecho y el adiestrador la revisa.
  Disparo: el primer adiestrador real que la pida.
- **Clases GRUPALES**: N mascotas, una sesión. Disparo: demanda real +
  letra de cupo propia.
- **Evaluación inicial como comprable** (sesión diagnóstica previa al
  programa): disparo: la conversación con el adiestrador real.
- **Adiestramiento felino / otras especies**: §2.
- **Video más allá del techo v1** (clips más largos, más clips, video
  en vivo): disparo: evidencia de uso del techo + costos medidos.
- **Bitácora universal** (fuera de programa): §7.
- **Triage de causa pre-reembolso al vencer vigencia** (fuerza mayor /
  conflicto de horario / falla del adiestrador) antes de soltar el
  reembolso — disparo: primer caso real con reclamo. v1 ya captura el
  motivo declarado al vencer, sin actuar sobre él.

## 10. PRECONDICIONES (bloqueantes de apertura, no de construcción)

1. **L-140** en toda función nueva del motor; RLS y REVOKE patrón de
   la casa desde el nacimiento.
2. **P20 — la letra de CUSTODIA (sesión de legales D-405):**
   transversal a todo servicio donde la mascota sale del lado de la
   familia (rige también al paseo — hueco declarado S62). Cubre:
   asignación de responsabilidad en Términos y Condiciones (letra de
   abogado ecuatoriano), protocolo de incidente con notificación
   INMEDIATA a la familia, autorización de emergencia veterinaria con
   techo de gasto, check-in/check-out con foto en recogida (la
   evidencia donde no hay track), seguro declarado y diferido.
   **Sin P20 firmada, la modalidad recogida no se abre a prestadores
   reales.**
3. **La conversación con un adiestrador REAL** es BLOQUEANTE para
   desmarcar `es_seed_preliminar` y abrir el servicio (patrón §10.3
   del grooming): valida el catálogo de programas, el vocabulario de
   objetivos, los rangos de N sesiones, los defaults de duración y el
   techo de video.
4. **La infra de video** con su tanda propia (bucket, límites,
   compresión, reproducción) antes de que el Durante la prometa en UI.

## 11. Los tests de toda feature de adiestramiento

1. ¿Respeta el menú (sesión + programa comprables; objetivos solo
   registrables)?
2. ¿El programa se consume SECUENCIAL (jamás FIFO) y su devengo es por
   sesión cerrada, variante (b)?
3. ¿El precio salió congelado del snapshot (sesión o programa +
   recargo de modalidad), desglose server-side?
4. ¿La modalidad respeta §3 — y la recogida sigue cerrada hasta P20?
5. ¿La progresión habla en narrativa + objetivos alcanzados — cero
   barras, scores, checklists de dueño — y el memorial apaga todo?
6. ¿La bitácora de la familia deposita en el expediente con P5
   respetada?
7. ¿El video respeta el techo v1 firmado y su infra existe antes de
   la promesa en UI?
8. ¿Los diferidos siguen declarados con su disparo, o su disparo sonó?

## 12. Los corchetes del borrador — CERRADOS (aprobación integral founder S62)

1. **Nombre de la modalidad:** "EN CAMPO" queda firmado.
2. **Agendamiento del programa:** todas-al-comprar con P14 por sesión.
3. **Techo de video v1:** clips 15-30s, máximo 3 por sesión.
4. **N sesiones:** rangos sugeridos por nivel, el adiestrador declara.
5. **Duración de sesión:** default 60', pasos de 15'.
6. **Captura exigida al cierre:** ninguna en v1.

*Interpretación declarada: cerrados por aprobación integral del
founder sobre el borrador; cualquiera se reabre como enmienda barata
ANTES de que su construcción dispare.*

## Historial

- **v1.1 (S63, 15 Jul 2026):** la construcción del programa disparó
  (migración `20260715180000`: `prestador_programas` +
  `programas_contratados` + k/N en la cita + RPCs + cron de vigencia;
  asserts 14/14 ROLLBACK residuos 0): **Decisión U FIRMADA**
  (`MODELO_FINANCIERO.md` v2.8 — cuarto escritor del invariante
  'pagada') · **guard duro de cierre en orden** (§8, trigger en la
  fuente) · **vigencia vencida = reembolso proporcional declarado +
  motivo capturado sin triage** (§8) · triage de causa como diferido
  v2 con disparo (§9) · `especies_elegibles` de adiestramiento pasa de
  NULL a `["perro"]` (§2 aterrizado en DB).
- **v1.0 (S62, 15 Jul 2026):** letra FIRMADA founder+arquitecto: menú
  sesión+programa con consumo secuencial (Decisión U candidata) · solo
  perros · domicilio con-la-familia / recogida (custodia P20 como
  precondición, sesión D-405) / en-campo · precio por sesión y por
  programa congelado · Antes/Durante/Después con VIDEO de clips cortos
  (techo 15-30s ×3) e instrucciones a la familia en el parte ·
  progresión narrativa + objetivos alcanzados con imagen (guijarros
  candidatos) · la BITÁCORA DE LA FAMILIA como sedimento del
  expediente (P5) · programa agendado entero al comprar (P14 por
  sesión) · chasis de reserva/cobro heredado entero · diferidos y
  precondiciones declarados · corchetes §12 cerrados por aprobación
  integral (interpretación declarada).
