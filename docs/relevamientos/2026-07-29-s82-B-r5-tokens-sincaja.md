# S82-B r5 · LOS TOKENS DEL CANTO CLARO + Boton `sinCaja` (gate en bienvenida)

**Sesión B · 29-jul-2026.** Archivos (76h): `packages/ui/src/tokens/palette.ts` ·
`packages/ui/src/themes/light.ts` · `packages/ui/src/components/Boton.tsx` ·
`apps/cliente/src/app/bienvenida.tsx` (LA pantalla del gate, adjudicada por la
orden) · `scripts/verify-diseno.mjs` (dos solo-baja) · este reporte.
**CantoCurva y marca de agua: NO promovidas** (punto 3 de la orden — el canto
se lee al sol primero; nada que reportar ahí más que la obediencia).

## 1. Los tokens (multiplican al toque — asumido en la orden)

| Token (TEMA CLARO) | Antes | Ahora | Ratio vs papel |
|---|---|---|---|
| `capa.identidad` | verdeVital `#2BE86B` (1.55) | **verdeVitalDark `#1E7A33`** | **5.13** |
| `capa.cuidado` | teal `#28E8DA` (1.46) | **tealDark `#0A7268`** | **5.51** |
| `status.dangerText` | coralDark `#BE3535` (4.48) | **coralDarkTexto `#B93333`** (paso NUEVO en palette) | **4.69** sobre dangerBg∘papel |

- **El escalón elegido es el PRIMERO de la propia rampa que pasa** ("hasta
  pasar el mínimo" — no se saltó a Noche). La categoría NO cambió: cambió su
  valor sobre papel. **En claro, `capa` colapsa al MISMO registro que
  `capaText`** (que ya era verdeVitalDark/tealDark) — puro→AA en claro; dark y
  memorial intactos.
- **REVERSA (una línea, vive en `themes/light.ts`):**
  `identidad=palette.verdeVital · cuidado=palette.teal · dangerText=palette.coralDark`.
- Alcance de la multiplicación (medido por consumidores de `theme.capa` en
  claro): la Huella de `Icono`, los puntos de `LineaDeVida`, el marker de
  `MapaRecorrido`, `BarrasSemana`, cantos. `coralDark` tenía UN consumidor
  (dangerText light) — cirugía sin salpicadura; el escalón viejo queda en la
  rampa.
- **Gates corridos:** `verify:contrast` **178 pares / 0 fallos** (obligatorio
  por tocar palette/themes) · volcador R12: **de 6 bajo mínimo a 1 — la exenta
  FIRMADA S73** (controlLleno dark) · `BASELINE_R12` → **VACÍO** (solo-baja
  ejecutado; de vacío no se sube).

## 2. Boton `sinCaja` — la variante CANDIDATA del rol secundario

- Anatomía: **tinte sin borde** (`bg.overlay` + cero borde + texto tinta) — el
  material INTERMEDIO que el censo S81-B ya había nombrado (§7); target 44
  garantizado por el sistema de tamaños (md 48 · sm compensa con hitSlop).
- **CONVIVENCIA DECLARADA en el JSDoc:** el contorno del `secundario` (Ley 22
  TONAL) NO muere — código nuevo sigue usando `secundario`. Si el founder firma
  `sinCaja` en el gate, muere el contorno y **la enmienda a la Ley 22 pasa por
  la MESA** (jamás por lint ni por barrida silenciosa).
- **LA pantalla del gate: `bienvenida` del cliente** — "Ya tengo cuenta" bajo
  el marca. Elegida por censo: los `secundario` del cliente viven casi todos en
  ramas de ERROR (reintentar) — bienvenida es el único par primario+secundario
  SIEMPRE al sol, primera pantalla del deslogueado (vehículo Shyris).

### La auditoría del bloque permanente (bienvenida, ANTES de tocarla)

- **Preside:** el titular de EL NORTE con su acento pink — la pantalla tiene
  firma (TESIS/FIRMA declaradas desde S61-A8).
- **Contra fuentes:** Ley 4 (isotipo único) ✓ · letra S61-A8 ✓ · §5/L-c
  declarada (S81) ✓ · acento = reserva gráfica legal ✓.
- **Hallazgos:** **(a1)** el secundario con caja → lo cura esta orden.
  **(b1)** lockup/titular/legales en `<Text>` crudo con recetas que la API de
  `Texto` NO cubre (display 3xl con tracking · identidad · xs/tertiary) — es la
  candidata de mesa que C ya registró tres veces; **NO migré**: absorber sin
  receta exacta inventaría variantes (freno declarado). **(b2)** la caja gris
  del secundario compitiendo con el marca — converge con (a1). **Vacío,
  densidad, orden, agrupación, dos temas: la auditoría no encontró nada — se
  declara explícito** (corolario anti-silencio del bloque).

## 3. Coordinación del árbol vivo (tercera vez en la sesión)

C committeó su r4 EN PARALELO (los cuatro defectos del gate del Hogar): su
FiltroVida **perdió el contorno en el gate** ("NUNCA contorno — coincide con el
R13 que B mecanizó en paralelo") → **`BASELINE_R13` → VACÍO** (solo-baja
ejecutado por la cura de C; R13 queda DURA EN 0). El único rojo transitorio fue
R10 mordiendo la extracción EN VUELO de C (`filtro-pills.tsx` sin casa — el
guard haciendo su trabajo; C la declaró y el lint volvió a verde solo).

## Verificación

`verify:contrast` 178/0 · volcador 56 pares/1 exenta-firmada ·
`verify:diseno` **VERDE exit real 0, 14 reglas** (13 encendieron en
auto-prueba — incluye el R14 de C — + R9 informativa) · tsc ui **0** · tsc
cliente **0**. Nota de método contra mí misma: un `echo $?` mío tras un pipe
leyó el exit del pipe (L-191) — re-corrido con el exit del COMANDO; queda
anotado porque la lección cobra hasta al que la mecanizó.

## Para el gate del founder

1. **`sinCaja` en bienvenida** — si firma: muere el contorno del secundario +
   enmienda Ley 22 en mesa + barrida por D-318.
2. **El canto claro nuevo** (verdeVitalDark/tealDark sobre papel) — se ve en
   toda huella/punto/canto del tema claro al toque.
3. `dangerText` un pelo más oscuro — invisible salvo comparación directa.
