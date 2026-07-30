# S82-B r6 · LA EXCLUSIÓN DE A5 — el hex leído, las dos opciones, y R15

**Sesión B · 29-jul-2026.** Archivos (76h): `scripts/verify-diseno.mjs`
(R15) · `scripts/verify-diseno-pares.ts` (volcador ensanchado: + tokens) ·
este reporte. **CERO token tocado en esta ronda** — la orden pide
presentar, no decidir.

## 1. La comparación pedida (lo primero, antes de tocar nada)

`tealDark` real en palette.ts: **`#0A7268`** — HSL(174.2°, 84%, 24.3%).
`#0F5E56` — HSL(173.9°, 72%, 21.4%). **Δ matiz 0.3°, mismo carácter
oscuro-apagado. ESTÁ en la familia** — y no solo por números: la letra
de 9bis.3 excluye la familia porque *"colisiona con el acento firmado
del prestador"*, y **tealDark ES ese acento** (Ley 21 S63, `accent.cta`
oficio). Mi r5 metió `capa.cuidado` del tema claro en la exclusión
FIRMADA, y lo agrava el precedente: la fuente gana a la directiva
(§2.6) — la directiva r5 decía "extremo oscuro de la rampa" y yo no
contrasté contra 9bis.3. **Error de B declarado.**

## 2. LAS DOS OPCIONES (presentadas, no decididas — el código queda con
## tealDark VISIBLE como pendiente nominal de R15 hasta tu firma)

**(a) Otro escalón de la rampa fuera de la familia — MEDIDO: NO EXISTE
en el matiz.** La geometría lo cierra: para pasar 3:1 sobre papel, un
teal H≈174 necesita L≲33% — y TODO teal así de oscuro es la familia
(el propio #0F5E56 tiene L 21%). Medido: L36%→2.76 · L38%→2.50 ·
L40%→2.25. **Contraste ≥3 y exclusión A5 son incompatibles dentro del
matiz teal: uno de los dos cede.** La forma real de (a) es: `capa.cuidado`
claro REVIERTE al teal VIVO `#28E8DA` (una línea — la reversa de r5 para
ese token) y el canto claro de cuidado queda como estaba hasta ayer,
bajo la exención de registro gráfico del gate S43 (el glifo y la voz
portan el canal), o gana OTRO canal que tu gate decida. Costo: el par
`capa.cuidado/papel` vuelve a 1.46 — vuelve al baseline de R12 con
fuente (la exención se ratifica en vez de morir).

**(b) Queda tealDark y va como ENMIENDA A A5 a tu gate.** Costo dicho
derecho: legaliza EL acento del prestador dentro del tema del cliente —
la colisión LITERAL que la letra nombra — y erosiona la frontera S63
firmada (*tinta = decidir · teal = trabajar*). A favor: 5.51 sobre papel
y el canto claro de cuidado gana canal propio de verdad.

## 3. EL CENSO DE R15 — la exclusión estaba rota DESDE ANTES de r5

**10 tokens del tema claro del cliente resuelven a la familia HOY** —
solo 1 es de r5. Los otros **9 son PRE-EXISTENTES y nadie los censó
contra A5 desde su firma**:

| Token (tema claro) | Valor | Desde |
|---|---|---|
| `capa.cuidado` | tealDark | **r5 (mío — las opciones de arriba)** |
| `capaText.cuidado` | tealDark | S53 (el registro AA de cuidado — pills, LineaDeVida, CitaEnVivo) |
| `accent.primary` | tealDark | v4 |
| `status.infoText` | tealDark | v4 |
| `services.vet/grooming/walking/boarding/store` (×5) | tealDark | v4 (los íconos de servicio de Explorar) |
| **`accent.gradient.colors[2]`** | tealDark | **LA COLA DEL GRADIENTE FIRMA claro (`firmaUILight`)** — la familia vive adentro del Boton marca del cliente (el "Crear cuenta" de bienvenida) |

+ **4 tints alpha de base-familia** (bordes `tealBorderL` etc.) contados
como INFO, no rojo — un rgba .25 compositado no es "barro"; su destino
es de mesa.

**Por qué mis gates pasaron verdes mientras esto se rompía (tu
señalamiento, confirmado):** R12 y verify:contrast miden RATIOS — y la
familia CONTRASTA BIEN (por eso es el acento AA del prestador). Ningún
gate de la casa juzgaba IDENTIDAD. R15 llena exactamente ese agujero.

## 4. R15 — la regla

- **Operacionalización DECLARADA de la letra** (el lint necesita números;
  la letra da ejemplar + porqué): familia = matiz ±12° de #0F5E56 ·
  S≥30% · L≤35%. Verificada contra ejemplares: #0F5E56 ✓ · tealDark ✓ ·
  tealDarkNoche ✓ · teal vivo FUERA (L 53%, está en la marca) ·
  verdeVitalDark FUERA (H 133°). Ajustable en mesa — no es ley nueva.
- Alcance: valores OPACOS de los tres temas que el cliente consume
  (light/dark/memorial, volcados por el volcador); tints alpha = info.
- **10 PENDIENTES nominales** (la tabla), solo-baja: el que sale no
  vuelve, todo token NUEVO en familia es rojo. Si el volcador cae, R15
  falla fuerte (L-192).
- **Rojo producido** (no solo fixture): sabotaje de un pendiente → exit
  1 contra `light·capa.cuidado = #0A7268` real. Auto-prueba: fixture
  `#0F5E56` encendió.

## Verificación

`verify:diseno` **VERDE exit real 0 · 16 reglas** (14 con fixture
encendieron + R9 informativa + R15 nueva) · dark y memorial: CERO hits
de familia (medido — el problema es exclusivamente del tema claro).

## Para tu gate

1. **La decisión (a)/(b)** de `capa.cuidado` — §2 arriba.
2. **El arbitraje de los 9 pre-existentes** — en particular la COLA DEL
   GRADIENTE FIRMA y `capaText.cuidado` (el registro AA de cuidado en
   todo el cliente): si A5 es absoluta, el tema claro necesita cirugía
   de identidad, no de contraste; si no lo es, la letra gana alcance
   fino (¿fills/cantos sí, texto AA no?) — eso es enmienda de MESA.
