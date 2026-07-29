# S82-C — REPORTE DE PISTA (cliente; MOMENTOS ④⑤ del triage C7 + familia hogar-diario)

> **Territorio declarado al abrir (76h), cumplido sin desvío:** los tres
> MOMENTOS que no son de A — `parte/[eventoId]` · `adiestramiento/[citaId]` ·
> `autorizacion/[solicitudId]` — + la familia HOGAR-diario (`hogar/index`,
> `mascota/[mascotaId]`, los 3 hubs, `citas/[mascotaId]`) + hunks aditivos
> en los diccionarios. Disjunto de A (BIENVENIDA/ALTA/CARNET, incluido
> `hogar/agregar/*`); `index/login/registro` no se tocaron (vecinas del
> arco de entrada que espera firma founder); `paseo/[atencionId]` era de B.
> **Cero packages/ui** (rieles de la pista): todo con las piezas S81
> (Texto · FilaDato · Entrada · PieRevelar) — cero override local hizo falta.

## 📱 EL OTA DEL GATE (uno, con árbol limpio verificado)

**Group `bcdb5e7a-00fa-4fa9-9bb5-a52a4b1d7ae1` · ancla `b22c83d` ·
runtime 1.0.2 · canal preview** (updateIds: android `019faf5c-63a1-7a23…` ·
ios `019faf5c-63a1-73eb…`). Pre-check L-134: cero deps nuevas.
**Freno declarado y honrado:** el primer intento de publicar se DIFIRIÓ
porque el árbol traía WIP ajeno (el cierre de mecánica de B en vuelo —
publicar habría repetido el incidente del ancla con asterisco S74);
se publicó recién con `git status --porcelain` en 0, tras el commit
`4d9e5f6` de B. El OTA carga TODO el HEAD (incluye lo committeado de A y B
— canal compartido, ancla única honesta).

## Los lazos (commit por commit, enmienda 79)

- **L1 `509fad2` — parte/[eventoId] (MOMENTO ④).** TESIS: el vet te dejó
  dicho qué tiene y qué darle — en tu idioma. FIRMA: el diagnóstico preside
  (Texto titulo) + Entrada ordena qué-encontró → qué-darle → el-resto.
  CHANEL: glifo repetido por tarjeta de fórmula (Ley 12) · el '—' del
  diagnóstico ausente · el ghost mudo "Ver completo" → CeldaNavegacion sin
  glifo. Diccionarios: +notaDelVet/notaDelVetDetalle · −motivoLabel/
  proximoControlFecha/verCompleto (Ley 37, grep en cero).
- **L2 `76b9474` — adiestramiento/[citaId] (MOMENTO ④).** Tesis/firma S63
  intactas; rótulos → seccion · k/N → dato · Entrada (frase de vínculo →
  objetivos+clips → resto).
- **L3 `079437e` — autorizacion/[solicitudId] (MOMENTO ⑤).** Vara chica:
  la firma es el título que nombra el pedido; el par primario+ghost queda
  TAL CUAL (D-484 sin gate); sin Entrada (la Hoja ya entra — L-c). Cura
  voseo→tuteo ('Si autorizás'→'Si autorizas', C3 re-verificada §2.6).
- **L4a `a87454c` — citas/[mascotaId].** LA MIGRACIÓN D-318 anotada en la
  skill: los DOS "ver más" mudos → PieRevelar (y ahora pliegan de vuelta);
  presupuesto a FilaDato horizontal + datoMd. −3 keys muertas.
- **L4b `0d9919d` — hogar/paseos.** Los 5 Text de voz secundaria → apoyo;
  el hub cierra su mecánica. **Censo declarado: grooming y adiestramiento
  hubs YA limpios — no se tocaron.**
- **L4c `0ea8a2c` — mascota/[mascotaId].** TituloModulo local (byte-idéntico
  a seccion) MUERE; fin de Celda/invitación/línea educativa → apoyo. La fila
  hero display de Vitales (firmada S53) y el header S52 NO se tocan.
- **L4d `b22c83d` — hogar/index.** Pasada ANGOSTA a propósito (pantalla
  patrón firmada): solo recetas exactas; los títulos de zona de la FIRMA
  no se estandarizan sin gate.

## Para el gate en dispositivo (por pantalla, protocolo de craft)

1. **El parte de la consulta** — ¿el diagnóstico preside y el orden de
   entrada se SIENTE como lectura (no como adorno)? ¿La celda de la nota
   dice a dónde va mejor que el botón mudo?
2. **El parte de adiestramiento** — ¿la frase de vínculo sigue mandando
   con los rótulos nuevos?
3. **La autorización** — camino real: solicitud viva desde el mostrador.
4. **citas de mascota** — el PieRevelar de "otras activas" y el desglose
   del presupuesto (número + chevron que gira).

## Candidatas de MESA (declaradas, no ejecutadas — jamás prop al pasar)

- **Las voces que la API de Texto no tiene** (cobradas 3 veces en la
  pista): interlineado de prosa en `cuerpo` · voz humana lg light · xl con
  interlineado. Hoy viven como Text tokenizado declarado (L2, L4c, L4d).
  El JSDoc de Texto exige mesa para ensancharla — el censo de esta pista
  es su insumo.
- **Los títulos de zona del Hogar** (sm/medium/secondary) vs `seccion`:
  ¿la pantalla patrón se re-firma con seccion o su calibración es ley?
