# Pantallas patrón (L-143 — lo visual se firma sobre PÍXELES)

Acá viven los PNG FIRMADOS por el founder. Las sesiones de Code
construyen COPIANDO NIVEL del patrón, no interpretando prosa; el gate
en dispositivo compara contra el patrón.

> ## ESTADO REAL (saneado S71-A0 · **primer depósito S71-B1**)
>
> Entre S68 y S70 se construyeron **18 superficies nuevas** sin un solo
> patrón que copiar — por eso **L-143 nunca llegó a ejecutarse** y las
> sesiones interpretaron prosa (deep research S71, Bloque 0).
>
> **S71-B1 rompió el cero:** el techo de la jornada del prestador pasó
> el ciclo M1 COMPLETO (boceto → vara cruzada de A con 8 enmiendas →
> construcción → gate founder VERDE en dispositivo) y **su PNG está
> depositado**. Es el acto fundacional del mecanismo: la próxima
> pantalla de ese arquetipo se construye **copiando**, no interpretando.
>
> **La tabla sigue declarando DEUDA donde no hay píxeles.** Anunciar un
> PNG que no existe es letra muerta: si una fila no dice DEPOSITADO, ese
> patrón **no se puede copiar y la superficie no se codea sin boceto
> propio con vara cruzada** (mecanismo M1, S71).

| Archivo | Pantalla | Estado |
|---|---|---|
| `jornada-prestador.png` | **Portada de jornada** (arquetipo) — el techo del HOY del prestador | ✅ **DEPOSITADO (S71-B1)** — gate founder VERDE en dispositivo |
| `hogar-v2.png` | El Hogar del cliente — "techo vivo" | ❌ **NO DEPOSITADO** (S58; la construcción se hizo sobre la letra de la adenda) |
| `prestador-agenda.png` | Agenda Hoy/Semana (dosis del prestador, §15b) | ❌ **NO DEPOSITADO** (S58) |
| `prestador-arte-paseo.png` | "El arte del paseo" (wizard de secciones, v3) | ❌ **NO DEPOSITADO** + pendiente de re-firma (enmiendas de gate v1.6; mandato S59) |
| `prestador-resumen-oferta.png` | "Tu oferta de paseo" (la portada del mundo) | ❌ **NO DEPOSITADO** + pendiente de re-firma (mandato S59) |

## Arquetipo: PORTADA DE JORNADA (`jornada-prestador.png`, S71-B1)

Qué se copia cuando una superficie nueva es la portada de un tab raíz
del **prestador**:

1. **Tres renglones, en este orden y con esta jerarquía:** la PERSONA
   (`xl` medium) · el NEGOCIO (`sm` regular) · **la forma del período**
   (`md` medium, con su propio aire). Todo en papel PLENO sobre el muro
   — la jerarquía la da el tamaño, jamás la transparencia (regla S61).
2. **El tercer renglón hace el trabajo.** Es la FIRMA de la pantalla y
   es de COMPORTAMIENTO (Ley 15, lado prestador): un dato que se mueve
   solo con la jornada — "Te quedan 2 · terminas 18:30" → "Jornada
   completa.". No es un rótulo. Si el techo solo rotula, reprueba el
   test anti-genérico y no está listo.
3. **Lo que el reloj o el SO ya dicen, NO va** (Chanel): la fecha larga
   murió acá. El renglón de dato es demasiado caro para repetir al
   sistema operativo.
4. **Toda línea del dato declara sus estados**, incluido el de omitirse.
   Vacío ≠ negocio muerto: el día sin trabajo dice qué hay en la semana.
   **JAMÁS una métrica en cero** — si no hay verdad, la línea no existe.
5. **El dato acompaña la vista:** con un toggle en el techo, el dato
   habla de lo que estás mirando (Hoy → el día; Semana → la semana).
6. **El techo cuenta el DÍA, no la lista filtrada** (guard estructural
   S61-B12): un filtro del cuerpo jamás miente el conteo del techo.
7. Constantes que no se tocan: curva 44/26 · muro `tealDark` /
   `tealDarkNoche` · isotipo blanco (el UNO por pantalla) · vidrio
   oscuro · `ToggleTecho` como control canónico sobre el muro.

**Procedencia del píxel (declarada, L-153):** el PNG es el render web a
420×900 usado en la mesa; el gate del founder fue **en dispositivo**
sobre ese mismo build. Sirve como vara de COMPOSICIÓN y COPY — para
calibrar sombra o densidad real, manda el teléfono.

## Retirado

- ~~`prestador-techo-tinta.png` — El techo de tinta (bg.tinta + curva 44/26)~~
  **DEROGADO (S71-A0).** Lo superseded `DISEÑO_EXPERIENCIA` **§15b.2
  RE-FIRMADA (v1.9, S61-B12)**: *"el muro del prestador pasa a tealDark
  #0A7268"* (`TechoTinta` → `TechoOficio`, "una sola verdad"), re-firmada
  por el founder **sobre tres variantes en píxeles**. El código lo cumple
  (`apps/prestador/src/components/techo-oficio.tsx:44`, vía
  `useMuroOficio()`, cero hex de pantalla).
  **Dato AA que la mesa debe conocer si alguna vez se reabre:** §15b.2
  registra que **`tealDark` sobre tinta mide 2.86:1 — par caído**.
  Esta tabla anunciaba el patrón derogado desde S61 y fue una de las
  causas del falso desvío del "hallazgo 2" del gate S70.

## Cómo se salda esta deuda

Un patrón queda DEPOSITADO cuando: (1) el PNG existe en esta carpeta,
(2) el founder lo firmó, y (3) la fila dice **DEPOSITADO** con su
sesión. Hasta entonces, toda superficie nueva entra por **M1** (boceto
propio + vara cruzada aprobada antes de codear).

La letra de la dosis vive en `docs/DISEÑO_EXPERIENCIA.md` §15b (v2.3) —
y la ley de la distribución, en **§15b.0 La casa del prestador**
(firmada founder S70).
