# S74-B · CENSO DE LA CLASE — RPCs con rebote suave `{ok:false}` vs wrappers que no lo leen

> Origen: el hallazgo D-508 (mi `63dabe7`: "el Json no se interpreta" →
> el founder vio ÉXITO de un rebote). La mesa lo elevó a clase: es una
> decisión sobre CÓMO SE LEEN LAS RESPUESTAS DEL MOTOR — el
> verosímil-falso de L-139 del lado de la ESCRITURA.

## 1 · Método (contra el motor vivo, no contra memoria)

- **Sonda 1:** `prosrc LIKE '%''ok'', false%'` (ambos espaciados) sobre
  `pg_proc` público → **15 funciones**.
- **Sonda 2** (otros shapes suaves: `'success', false` · `'error', true`
  · `jsonb_build_object('error'…)` sin RAISE) → **CERO**. La clase es
  exactamente el patrón de la sonda 1.
- Cruce con consumidores: 31 RPCs Json-returning tienen wrapper; los
  que NO están en la lista de abajo usan RAISE tipado (`'<codigo>:
  <detalle>'`) — el patrón de la casa, que los wrappers YA manejan por
  `startsWith` (L-115). La clase suave es la EXCEPCIÓN, no la regla.

## 2 · El censo (15 funciones, una por una)

| Función | ¿Consumidor vivo? | ¿Qué le decía la pantalla al usuario en rebote? |
|---|---|---|
| `crear_empleado_directo` | **SÍ** — `equipo.ts` → `/negocio/equipo` | **ÉXITO** (la Hoja se cerraba y la lista recargaba; el founder lo vio en campo con su propio email). **CURADO HOY** (`equipo.ts`): el jsonb se lee, los 4 rebotes se tipifican (`no_es_dueno` · `email_sin_cuenta` · `email_es_prestador` · `ya_es_empleado`) y la pantalla los dice en voz humana — de paso paga el caso §5.3 de la letra de roles ("ya está en la cuenta LO DICE"). |
| `aceptar_invitacion_pendiente_login` | NO (grep monorepo: cero) | Nadie — todavía. **La regla queda escrita:** cuando el handshake in-app se cablee, su wrapper NACE leyendo el `ok:false` (esta clase no se re-estrena). |
| `rechazar_invitacion_pendiente_login` | NO (ídem) | Ídem. |
| `escenario_*` (4) · `simular_*` (6) · `test_*` (2) | NO (harness de test/simulador, cero producción) | No aplica. |

**Resultado: la clase tiene UN consumidor de producción, y está curado.**
Las tres funciones de producción son TODAS del subsistema de invitación
(estilo portal legado — pre-datan el patrón RAISE de la casa).

## 3 · La tensión declarada (regla 35) y su salida

El RPC no da campo `codigo` — la única discriminación posible HOY es el
LITERAL del `mensaje` (verificado contra `prosrc`, L-141). El wrapper lo
declara en su comentario. **La salida de raíz es de MOTOR (pedido a A,
viaja con D-509):** cuando el subsistema de invitación se toque (el
token del link, la cancelación), sus RPCs ganan `codigo` en el jsonb o
migran a RAISE tipado — y el mapeo por literal muere.

## 4 · D-511 — texto VERBATIM para depósito de A (número verificado LIBRE)

> #### D-511 — La clase del rebote suave: RPCs `{ok:false}` que los wrappers leían como éxito 🟠
> 🟠 MEDIA-ALTA (era 🔴 hasta la cura del único consumidor vivo).
> **La clase:** RPCs que devuelven rebote suave `jsonb {ok:false,
> mensaje}` en vez de RAISE tipado — un wrapper que solo mira el error
> de PostgREST convierte el rechazo del motor en ÉXITO de superficie
> (L-139 del lado de la ESCRITURA; caso índice: D-508, el founder vio
> "invitación creada" de un rebote). **Censo S74-B contra prosrc vivo
> (dos sondas, la 2ª en cero):** la clase es EXACTAMENTE 15 funciones —
> 3 de producción, TODAS del subsistema de invitación
> (`crear_empleado_directo` CURADA en S74-B · `aceptar/
> rechazar_invitacion_pendiente_login` SIN consumidor vivo) + 12 de
> test/simulador. **Las dos reglas que deja:** (1) todo wrapper futuro
> sobre esas dos funciones NACE leyendo el `ok:false`; (2) cuando D-509
> toque el subsistema, sus RPCs ganan `codigo` o migran a RAISE tipado
> (patrón de la casa) y el mapeo por literal de mensaje (tensión regla
> 35, declarada en `equipo.ts`) muere. **Disparo: el cableo del
> handshake in-app o D-509 — lo que llegue primero.** Origen: S74
> (D-508 → mesa eleva a clase; censo S74-B).

## 5 · Registro honesto del origen

La decisión que fundó el bug fue MÍA y estuvo DECLARADA ("el Json no se
interpreta en v1 — éxito = sin error", `63dabe7`): una decisión de
alcance dicha con todas las letras que igual fabricó un verosímil-falso
en campo el mismo día. La lección es de clase L-139: **declarar un
atajo no lo vuelve inocuo** — un contrato a medio leer es un contrato
que miente por vos.

## 6 · Adenda S74-B (pedido de mesa): el handshake verificado + el cinturón

**El handshake NO EXISTE — verificado por comportamiento, no por nombre:**
los únicos toques a `empleado_invitaciones` en el motor son los 5 RPCs
del subsistema (sonda a `pg_proc` completa, público y no-público) · cero
triggers · cero edge functions (las 3 vivas son walkin/nota/vacuna) ·
cero llamadas en apps (el match de `cuenta-comercial` era copy i18n de
S51). **Mi voz de la cura era la mentira fina** ("cuando entre, se une")
— angostada HOY a la verdad ("queda registrada; todavía no le llega
sola", string final a gate) y **el handshake sube a pedido de motor
BLOQUEANTE** (boceto delta §9.6): sin él la invitación no sirve por
ninguna vía.

**El cinturón construido:** `scripts/verify-rebotes-invitacion-s74.mjs`
— importa `REBOTES_INVITAR` del wrapper (fuente única, jamás copia) y lo
compara contra el `prosrc` VIVO en las dos direcciones (cada literal
presente + el conteo de `'ok', false` calza con los tipificados). Falla
RUIDOSO. Primer run: **VERDE 4/4**. Es la disciplina candidata "la
verdad la firma un assert ejecutable, jamás la tabla sola" aplicada a su
propio caso; la salida de raíz (código/RAISE) viaja con D-509.

## 7 · LECCIÓN CANDIDATA — SIN FIRMA (explícito: la mesa NO la atribuye; espera firma founder)

> **"DECLARAR UN ATAJO NO LO VUELVE INOCUO."** Origen: `63dabe7` — la
> decisión "el Json no se interpreta en v1" estaba DECLARADA con todas
> las letras, y aun así la pantalla le mintió al founder en campo el
> mismo día. Declarar deja rastro para después; no protege. El corolario
> operativo: un atajo declarado sobre un CONTRATO DE RESPUESTA (lo que
> el motor contesta) es distinto de un atajo declarado sobre alcance —
> el primero miente activamente mientras vive.
> **PENDIENTE DE FIRMA FOUNDER** — se registra como candidata, sin
> número, sin atribución de mesa.

