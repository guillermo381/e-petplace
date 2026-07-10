# MODELO_LOYALTY — Progreso por cuidar

> **Versión: v1.0 — S50 (10 Jul 2026), Etapa A0 de RUTA_F1 v2.2.**
> Gemelo de `DISEÑO_EXPERIENCIA.md`. **Contrastes obligatorios:**
> `MODELO_PRODUCTO.md` §6.4 (la señal práctica: rechazar
> puntos/niveles/badges como juego) y §8 (éticos no negociables);
> `MODELO_FINANCIERO.md` cuando cualquier beneficio toque plata
> (regla del propio doc: se lee ANTES). **Precondición cumplida:**
> relevamiento B0c de la gamificación existente en DB viva (S50,
> reporte literal de Code) — este doc decide sobre ese piso.
> **Regla de unicidad: dos sistemas de lealtad en la misma DB está
> prohibido.** Este documento es EL sistema.

---

## 1. La decisión (founder S50, con doble check regla 67)

**(a′) Progreso visible, ganancia visible, moneda invisible.**

El camino al voto: la invisibilidad total de la ganancia (pureza
§6.4) era emocionalmente linda pero estratégicamente muda — no
orienta comportamiento porque nadie sabe qué está en juego. El
founder lo señaló desde su propia psicología de usuario ("prefiero
comprar cuando sé que hay algo que ganar, y me gusta verlo") y el
doble check confirmó: **lo que §6.4 prohíbe con nombre es la moneda
abstracta como juego** (puntos, niveles, "ganaste 500 puntos"). Lo
que el mandato del arranque pide explícito — hitos celebrados,
ganancia legible — no lo viola si la ganancia se denomina en valor
real y la moneda queda adentro.

El patrón que valida: Nubank jamás muestra tu "nivel" de cliente como
score — lo materializa en ofertas que te llegan.

## 2. Lo que el dueño VE (tres piezas, y solo tres)

1. **El progreso de cuidado, en narrativa.** Por mascota, en voz
   humana: *"Ya conocemos a Zeus casi como vos — su expediente está
   al 80%."* Jamás barra de videojuego, jamás score. El progreso
   habla del VÍNCULO (cuánto la app conoce y puede cuidar), no de un
   juego.
2. **Los beneficios GANADOS, con su porqué.** *"Tu constancia con los
   paseos de Zeus te ganó 15% en su próximo grooming."* La ganancia
   es real — plata, prioridad de agenda, acceso — denominada en
   valor, no en puntos. El porqué siempre visible: el beneficio es
   consecuencia del cuidado, y se dice.
3. **UN próximo hito visible por mascota, con su beneficio
   concreto.** *"Completá el carnet de Thor y su próximo chequeo
   tiene descuento."* Sabés qué hay para ganar y lo ves — pero es
   siempre UNO, contextual, elegido por el momento vital. **Jamás
   una checklist de tareas**: la checklist es la chorificación del
   cuidado y el dark pattern que mata el alma del producto.

## 3. Lo que el dueño JAMÁS ve

Puntos. Niveles. Scores. Contadores de moneda. Badges coleccionables.
Rankings entre dueños. Barras de XP. La palabra "gamificación" en
cualquier superficie. (Ley 3 extendida: el vocabulario del motor es
del motor.)

## 4. El motor interno — herencia del relevamiento B0c

Decisión sobre la tabla de cierre del relevamiento (conservar /
rediseñar / jubilar):

| Objeto | Decisión | Detalle |
|---|---|---|
| `transacciones_puntos` (ledger) | **CONSERVAR** | El ledger es el corazón contable del motor. Sigue acumulando por eventos de cuidado; su unidad interna ("puntos") jamás sale a UI. |
| `puntos_usuario` | **CONSERVAR con cura** | Totales/rachas/tier. La policy `pu_own` ALL se cierra (D-314) — el user jamás se edita sus puntos. Evaluar en implementación si el sujeto correcto es (user) o (user, mascota): las rachas y el progreso son POR MASCOTA; el tier de beneficios es del hogar. Decisión técnica de Code con doble check al construir. |
| `niveles` (5 tiers) | **CONSERVAR, invisibilizar** | Se reciclan como tiers INTERNOS de beneficios (qué descuento/prioridad corresponde). Nombres/colores/íconos de cara al dueño se jubilan. |
| `logros` (catálogo 18) | **REDISEÑAR** | El chasis (codigo, condicion jsonb, es_repetible, activo) sirve. El contenido se reescribe bajo §6: fuentes de CUIDADO. **La categoría `compras` se mata** (compra ≠ cuidado, §7). La `condicion` jsonb deja de estar vacía: el motor de disparo la lee (§8). |
| `logros_usuario` | **CONSERVAR** | Registro de hitos alcanzados; alimenta la narrativa ("lo lograste el…"). |
| `loyalty_b2b` | **JUBILAR (congelar)** | 0 filas, nunca usado, fuera del scope del loyalty del dueño. No se borra en A0 (decisión reversible barata); se marca fuera del sistema y su futuro se decide cuando el lado seller/prestador pida un programa propio — que NO será este doc. |
| `otorgar_puntos` (RPC) | **CONSERVAR con cura D-314** | Mecánica interna correcta (ledger → upsert → tier). Se cierra: gate de autorización + `SET search_path` + REVOKE a anon/PUBLIC. Pasa a ser llamada SOLO por el motor de disparo y el admin. |

## 5. Las fuentes de progreso (qué acumula)

Solo **eventos de cuidado real**, depositados por el ecosistema o el
dueño:

- Expediente que se completa: carnet de vacunas cargado, identidad 5D
  progresando, condiciones/alergias documentadas.
- Cuidado sostenido: servicios completados (paseo, grooming, chequeo),
  constancia en el tiempo (rachas de cuidado — §6).
- Hitos del vínculo: primer chequeo del año, plan de vacunación
  completo, transición de momento vital acompañada.
- Wearable conectado y activo (cuando exista — M-WEAR).

**Anti-fuentes explícitas:** ticket de compra (la compra alimenta el
EXPEDIENTE como evento nutricional, no el loyalty — comprar mucho no
es cuidar mejor), donaciones a refugios (§7), interacciones sociales
de Capa 3 (el afecto no se monetiza), y cualquier evento aportado por
menores (P5).

## 6. Las rachas — constancia que celebra, jamás castiga

- Una racha reconoce cuidado sostenido: *"Tres meses de paseos
  constantes con Zeus."*
- **Una racha rota JAMÁS reprocha.** Cero "vas a perder tu racha",
  cero countdowns, cero notificaciones de urgencia por racha. El
  dark pattern clásico (Duolingo) queda prohibido por escrito.
- La racha que se corta simplemente deja de mencionarse; si el
  cuidado vuelve, se celebra el regreso, no se penaliza la ausencia.
- Las rachas se calibran por especie y momento vital (un M5 senior
  no "compite" con el ritmo de un M2).

## 7. Límites duros (§8 — escritos en piedra, no configurables)

1. **El memorial JAMÁS se gamifica.** M6 y memorial apagan TODO el
   motor: cero hitos, cero rachas, cero beneficios, cero menciones.
   El silencio del motor es parte del respeto (§8.5). El apagado es
   estructural (el motor consulta momento vital ANTES de evaluar
   cualquier regla), no un filtro de UI.
2. **Las donaciones jamás otorgan beneficios comerciales.** Donar a
   un refugio no es transacción de loyalty (§8.9) — reconocerlo con
   descuentos lo convierte en compra. El agradecimiento es humano,
   no contable.
3. **Los datos de menores no acumulan** (P5): eventos con
   `aportado_por_menor=true` no generan transacciones del motor.
4. **Compra ≠ cuidado** (§5, anti-fuentes).
5. **Cero dark patterns:** sin urgencia artificial, sin pérdida
   inducida, sin FOMO, sin checklist de tareas, sin comparación
   entre dueños ni entre mascotas.
6. **Los beneficios jamás distorsionan recomendaciones clínicas**
   (§8.3/P11): un descuento puede vivir junto a una alerta de
   cuidado, pero la alerta existe por la mascota, no por el cupón —
   y el motor de alertas manda sobre el de beneficios.

## 8. El motor de disparo (construcción nueva, diseño A0)

Hoy NO existe: el relevamiento confirmó catálogo sin motor (todas las
`condicion` en `{}`, cero triggers, cero callers). Diseño:

- **Declarativo:** el catálogo `logros` rediseñado porta su
  `condicion` jsonb legible por el motor (tipo de evento, umbral,
  ventana temporal, especie/momento aplicable).
- **Se dispara por eventos del expediente** (la misma corriente que
  alimenta la Línea de Vida): el sedimento ES la señal. Sin polling
  de UI, sin lógica en pantallas.
- **Comparte infraestructura con el motor de alertas (D-137) y el de
  revelaciones (§6.4)** — tres consumidores de la misma corriente de
  eventos con propósitos distintos. Se construye una vez, en B4,
  sobre el diseño de este doc (trenza A0⇄B4).
- **Idempotente y auditable:** cada otorgamiento deja transacción en
  el ledger con referencia al evento que lo disparó (`referencia_id`
  deja de ser text libre — apunta al evento).

## 9. La trenza con B4 (promos/cupones)

Hallazgo B0c: la trenza "promos y loyalty comparten motor" hoy NO
existe en DB (cero FKs cruzadas) — **es construcción nueva, no
conexión**. El diseño: el motor de cupones/campañas del admin (que
YA opera) se convierte en el **canal de entrega** de los beneficios
del loyalty — el loyalty decide QUIÉN gana QUÉ (tiers internos,
hitos); el motor de promos lo materializa (cupón aplicable al pagar,
sobre B2). Todo beneficio que toque plata lee `MODELO_FINANCIERO.md`
antes: un descuento es un movimiento del modelo, no un regalo
contable.

## 10. Curas de seguridad — D-314 🔴

Registradas del relevamiento B0c; **criterio de disparo: la primera
migración que toque loyalty** (antes si la anon key queda expuesta a
un cliente público):

1. `otorgar_puntos`: gate de autorización en el body + `SET
   search_path` + REVOKE EXECUTE a `anon` y PUBLIC (hoy cualquiera
   con la anon key acuña puntos — el DEFINER bypasea la policy
   solo-admin del ledger).
2. Policy `pu_own` ALL en `puntos_usuario`: el user puede editarse
   sus totales directo. Se reduce a SELECT propio; la escritura es
   solo del motor.

Coherencia con la casa: el motor escribe SOLO vía funciones (puerta
única), jamás INSERT directo de apps.

## 11. Qué NO es este sistema

- No es un juego. No es una economía de puntos. No es un programa de
  compras.
- No es la revelación progresiva (§6.4) — son hermanos que comparten
  corriente de eventos: la revelación abre funcionalidades; el
  loyalty reconoce cuidado con beneficios. Ninguno usa moneda
  visible.
- No es el programa B2B de sellers/prestadores (futuro, doc propio
  si nace).

## Historial

- **v1.0 (S50, 10 Jul 2026):** redacción inicial sobre el
  relevamiento B0c. Decisión (a′) del founder con doble check.
  Herencia decidida del chasis existente, motor de disparo diseñado,
  límites §8 en piedra, D-314 registrada, trenza B4 declarada como
  construcción nueva.
