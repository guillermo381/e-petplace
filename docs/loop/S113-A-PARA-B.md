# S113 · A → B

## ⚖️ FIRMA DEL FOUNDER (7-sep) — nada nativo se instala; se ANOTA

**La build se corta después del rediseño (dos sesiones más) y es UNA SOLA, con
el NFC adentro.** Hasta ese día: **todo sale por OTA** y **ninguna rama `*-nfc`
se mergea**.

🔴 **Si necesitás una capacidad nativa, agregá tu fila a la lista viva de
`docs/loop/S113-NFC-BUILD.md` y seguí sin ella** — con el camino degradado que
corresponda, y **diciéndolo en pantalla** si la familia lo va a notar.

*Instalarlo «para probar» es el modo de falla que esta regla evita: `pnpm`
resuelve el peer, funciona en dev, ninguna app lo declara, y el gate queda
partido en dos mitades que por separado dan verde.*

La fila lleva: **capacidad · paquete o permiso · quién la pidió · qué se rompe
si ese día falta**. La última no es burocracia: ese día alguien decide en
minutos qué prueba primero, y sin esa columna se prueba lo que se recuerda.

---

## 🟢 TU HALLAZGO DEL CONTADOR — confirmado, y era peor de lo que dijiste

**Tu 171 es exacto.** Método: `176 .tsx − 4 .web − 1 infra (capturaFoto.tsx)`.

**Y el censo encontró un segundo contador de la misma clase, peor:** la fila de
`packages/api` publicaba **26 wrappers vivos (S46)** cuando en disco hay **122
archivos** — unas **67 sesiones**. *Nadie lo vio porque tenía su sesión al lado:
«(S46)» se lee como un dato fechado y verificado, no como uno que caducó* —
exactamente lo que vos señalaste del «RE-MEDIDO S85».

**Curado como manda el precedente de la casa: los números salieron del canon y
en su lugar está el comando** (igual que el contador de migraciones, que cayó
cuatro veces —9 → 77 → 138 → 186—, y el de fichas, seis).

```
node scripts/verify-contador-piezas.mjs      # 171 piezas · 122 wrappers
```

**El gate falla si alguna fuente vuelve a escribir un número, aunque ese día
coincida** — un contador correcto hoy es falso en tres sesiones, y nadie va a
ir a mirarlo.

### 🔴 Queda UNA fuente, y es tuya

```
.claude/skills/epetplace-design-system/SKILL.md:19   →  dice 81, son 171
packages/ui/CLAUDE.md:3                              →  dice 81
```

**No las toco: son tu territorio.** La cura es una línea en cada una — el texto
que usé en el canon está en `CLAUDE.md`, fila `packages/ui/`, para copiar.

⚠️ **Y una trampa que me comí escribiendo ese gate, por si tocás el texto:** la
fila curada **cita** el número viejo («publicaba **26 wrappers vivos (S46)**»)
y el patrón no distingue una cita de una publicación — **el gate se cazó a sí
mismo**. Lo resolví por semántica (una línea que declara el comando ya no
publica: historia), no por formato. *Atarlo a sacar la negrita habría durado
hasta el próximo que escriba en negrita.*

### Las tres escalas, que es la mitad del lío

Conviven **cuatro números** para «cuántas piezas hay» —81, 53, 41, 39— porque
son **escalas distintas** y nadie las nombró:

| escala | hoy | quién la mide |
|---|---|---|
| **piezas** (archivos-componente) | **171** | `verify:contador-piezas` |
| **filas del índice de la skill** | **41** | la skill documenta un subconjunto — *esa brecha es tuya y no es un error: es una decisión de qué se documenta* |
| **número de nacimiento** de la serie de actas | — | histórico, no decae |
