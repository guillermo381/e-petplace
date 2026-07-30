# S82-B r4 · R12 CONTRASTE EN LOS DOS TEMAS + R13 CONTROL CONTORNEADO

**Sesión B · 29-jul-2026.** Archivos (76h): `scripts/verify-diseno.mjs`
(R12/R13) · `scripts/verify-diseno-pares.ts` (el volcador, NUEVO) · este
reporte. El lint queda **VERDE exit 0 con 13 reglas** (12 encendieron en
auto-prueba + R9 informativa), y **los dos rojos REALES fueron
producidos** por sabotaje de baseline (no solo el fixture): R12 exit 1
contra `capa.cuidado/bg.base 1.46` · R13 exit 1 contra `hogar/index:306`.

## R12 — LA LISTA QUE PEDISTE: los que fallan HOY (censo de 56 pares, claro+oscuro)

| Par | Tema | Ratio | Mínimo | Lectura |
|---|---|---|---|---|
| `status.dangerText/status.dangerBg` | light | **4.48** | 4.5 | BORDERLINE de medición: el gate S43 compone el tinte sobre CARD y pasa; sobre BASE queda 0.02 abajo. Decisión chica: o el tinte danger sube un pelo, o se sella que danger vive sobre card. |
| `capa.identidad/bg.card` | light | **1.63** | 3 | El canto VERDE VITAL sobre papel. La letra vigente del gate S43 exime `capa.*` como "registro gráfico redundante" (glifo+voz portan el canal) — R12 lo pone a la vista: la exención se ratifica o muere EN LA MESA. Toca a CantoCurva sólido (fondo=capa) y a todo canto claro de salud. |
| `capa.identidad/bg.base` | light | **1.55** | 3 | ídem |
| `capa.cuidado/bg.card` | light | **1.54** | 3 | El canto TEAL sobre papel — el de FilaCita/paseo. Misma exención vigente, misma pregunta. |
| `capa.cuidado/bg.base` | light | **1.46** | 3 | ídem |
| `accent.controlLleno/bg.card` | dark | **2.35** | 3 | **EXENTA FIRMADA S73** (registro del entity chip: "fill-vs-fondo dark 2.24–2.47 — el blanco 8.25 carga el estado; el ojo del founder lo firmó; sube a deuda si un usuario real lo reporta"). No entra al baseline: tiene firma. |

**En dark los cantos PASAN todos** (hex vivos sobre fondo oscuro) — el
problema del canto es exclusivamente CLARO. `comunidad` y
`comunidadAmplia` pasan en ambos temas.

**Mecánica:** el volcador `verify-diseno-pares.ts` enumera los pares con
LA MISMA matemática de `verify-contrast.ts` (S43) y emite JSON; R12 los
juzga — texto 4.5 · canto 3.0 — con 1 EXENTA (firmada, con fuente) + 5
BASELINE nominal (esta tabla, arbitraje founder), **solo-baja y por
NOMBRE**: un par nuevo bajo mínimo es rojo aunque un viejo se cure. Si
el volcador no corre o no parsea, R12 **falla fuerte** (L-192). R12 no
reemplaza a verify:contrast (los 178 curados por componente): es el
barrido sistemático que aquél no hace.

## R13 — CONTROL CONTORNEADO (A6): el censo y el alcance declarado

**Censo del monorepo entero: UN solo tocable artesanal con borde** —
`hogar/index.tsx:306`, el `FiltroVida` de C (pills 44 con `borderWidth
1.5`, lote S82-C **esperando su gate**). Prestador: CERO. → baseline
NOMINAL `{hogar/index: 1}`, dueño C: **se rellena o pierde la caja en su
gate**; solo baja.

**El alcance, con sus tres bordes (escritos en el header de la regla):**
1. **apps/cliente SOLO** — A6 rige lado cliente por su propia letra
   (§9bis), y en el prestador la gramática **está/espera S78 FIRMADA usa
   contorno** para "lo que espera": un R13 bilateral fabricaría rojos
   sobre letra firmada.
2. **CHOQUE DECLARADO, no resuelto en silencio:** el eslogan de la orden
   ("nunca contorno") excede dos letras firmadas vivas — **7bis** ("SE
   CONTORNEA LO QUE SE FIJA", firmada 29-jul) y **Ley 22 TONAL** (borde
   1.5 para selección) + 22c (el compacto con borde, cuya muerte ANCHA
   ya es D-483 con mecánica al-tocarse). R13 caza lo ARTESANAL en
   pantallas — donde A6 no tenía juez —; el contorno FIRMADO de
   packages/ui (Boton secundario/compacto · SelectorOpcion seFija ·
   Campo ⚖️) es decisión de MESA: si la intención es matarlo también,
   eso es enmienda a 7bis/22, no una regla de lint.
3. **Solo estilos inline** en el tag (un StyleSheet con nombre escapa —
   limitación declarada; hoy cero casos, medido).

## Verificación

- `pnpm verify:diseno` → **VERDE exit 0**, auto-prueba **12 reglas
  encendieron** (R12 y R13 incluidas), R9 informativa declarada.
- **Rojos reales producidos** (L-192): sabotaje del baseline R12 → exit
  1 con el par real (`capa.cuidado/bg.base = 1.46`); sabotaje del
  baseline R13 → exit 1 con `hogar/index:306`.
