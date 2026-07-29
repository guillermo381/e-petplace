# S81-C5 — FRANJAS NOCTURNAS: el bloqueo reproducido y medido (cero cura)

> **Sesión C-S81 (29 Jul 2026).** Reproducción del bloqueo del founder
> (no pudo crear franjas entre 22:00 y 05:00), con literal por capa.
> Método: fuente (archivo:línea / `pg_constraint` / functiondef) +
> reproducción empírica in-txn con aborto por excepción (residuo
> verificado: **0** franjas nocturnas o invertidas en DB). **CERO cura
> — con el literal decide la mesa.** Una corrección de mi propia
> premisa en el camino, declarada abajo (L-084 me mordió una columna y
> el contrato S59 me corrigió el contexto).

## 1. DÓNDE REBOTA — por capa, con literal

| Capa | ¿Rebota? | Literal |
|---|---|---|
| **UI** | **SÍ — acá muere el founder** | `apps/prestador/src/components/seccion-horarios.tsx:111-114`: la grilla `HORAS` va de **05:00 a 22:00** paso 30 (comentario propio: *"grilla v1: pasos de 30 min, 05:00–22:00 (heredada de /horarios S55-B)"*). El "hasta" filtra `h > desdeSel` sobre esa misma grilla (líneas 254 y 1225) |
| **Wrapper** | **SÍ, al cruce** | `packages/api/src/wrappers/horarios.ts:289`: `if (input.horaFin <= input.horaInicio) return falla('rango_horario_invalido')` — voz (línea 38): *"La hora de fin tiene que ser después de la de inicio."* Sin tope de hora: solo regex HH:MM, fin>inicio, y solape mismo-día (línea 308) |
| **RPC** | **NO EXISTE** | la escritura de franjas va por INSERT directo bajo RLS (el wrapper pre-valida; no hay RPC guard en el camino) |
| **CHECK de DB** | **NO EXISTE** | `pg_constraint` sobre `prestador_horarios`: solo `dia_semana 0-6`, UNIQUE `(prestador, servicio, empleado, dia, hora_inicio)`, FKs y PK. **Cero CHECK de rango** — `hora_fin < hora_inicio` es insertable |

## 2. ¿LÍMITE DE HORA o CRUCE DE MEDIANOCHE? — SON DOS DEFECTOS, y la prueba pedida los separa

**Caso A — `22:00→23:30` (nocturna sin cruce):**
- UI: **muere por LÍMITE DE HORA** — "desde 22:00" es elegible (es el último valor), pero el "hasta" = `HORAS.filter(h > '22:00')` = **conjunto VACÍO**: no hay hasta posible porque la grilla no tiene 22:30+.
- Wrapper: **PASA** (23:30 > 22:00 ✓, sin tope de hora).
- Motor: **SIRVE — medido empírico**: franja `22:30→23:30` insertada in-txn produce inicios **`[22:30, 23:00]`** (2 slots). **El límite de hora vive SOLO en la UI.**

**Caso B — `22:00→06:00` (cruce de medianoche):**
- UI: **muere por IMPOSIBILIDAD DE CRUZAR** — `'06:00' > '22:00'` es falso: el picker modela un solo día; el 06:00 existe en la grilla pero nunca es elegible como fin de 22:00.
- Wrapper: **rebota tipado** (`rango_horario_invalido`, línea 289) aunque la UI lo dejara.
- **DB: LO ACEPTA — medido empírico** (`DB_acepta_cruce=t`: el INSERT pasó sin queja).
- **Motor: LO TRATA MUDO — medido empírico**: con SOLO la franja cruzada activa de noche, `_inicios_disponibles_prestador` devuelve **0 inicios** nocturnos. El porqué en el literal del body: `generate_series(0, (EXTRACT(EPOCH FROM (hora_fin - hora_inicio))/60)/duracion - 1)` — con fin<inicio el delta es negativo y la serie queda vacía, **sin error**.

**⚠️ La consecuencia que la mesa debe ver:** si mañana se "abre" el
wrapper sin tocar el lector, la franja cruzada ENTRA a la DB y **no
oferta nada en silencio** — un verosímil-falso de agenda (la clase
L-180/L-139: números válidos, significado mudo). Y el cruce no es solo
un CHECK: exige DECISIÓN DE MODELADO — la franja vive en `(dia_semana,
time, time)` sin fecha; ¿la 22:00→06:00 del miércoles oferta la
madrugada del JUEVES? Todos los lectores de ocupación asumen mismo día.

## 3. ¿HAY DECISIÓN ESCRITA QUE EXCLUYA LO NOCTURNO? — NO: ES IMPLÍCITO, y la letra dice lo contrario

- **`PORTAL_PRESTADOR` §5 nombra lo nocturno como familia LEGAL**: Familia C — *"hospedaje nocturno (estadía de varios días)"* (línea 638) y *"Un paseador puede ofrecer paseo + **cuidado nocturno**"* (línea 626).
- **Cero letra que fije 22:00/05:00 como techo**: grep `nocturn|22:00` en MODELO_PASEO, POLITICAS, DISEÑO_EXPERIENCIA, LETRA_TURNOS_S78 → el único hit es el "goteo nocturno" de notificaciones (otra cosa).
- **El origen del límite es HERENCIA DE IMPLEMENTACIÓN, no decisión**: el comentario del componente lo dice él mismo ("heredada de /horarios S55-B", commit de extracción `371457b` S59-B5). Nadie lo firmó como techo de producto.

Nota de alcance: hotel/guardería siguen en "próximamente honesto"
(SOFTLAUNCH §2) — pero el paseo nocturno de un paseador real NO está
excluido por ninguna letra, y el techo de duración vigente (300', §
MODELO_PASEO) permite un paseo 22:00→23:30 que hoy es inconfigurable
solo por la grilla de la UI.

## Corrección de premisa propia (declarada)

Mi primer intento de repro exigía franjas `servicio_id IS NOT NULL` y
falló "sin contexto" — **la fuente me corrigió con su propio literal**:
las franjas vivas son GENERALES (`servicio_id NULL`), el contrato que el
commit de extracción S59 declara textual (*"las franjas son las
GENERALES del prestador (servicio_id NULL) — relevado contra el motor
VIVO"*). Y `ps.tipo_servicio_id` no existe (es `tipo_servicio` — L-084).

**Resumen para la decisión:** el founder rebota en la PRIMERA capa (la
grilla de la UI, 05:00–22:00, herencia S55 sin firma); el wrapper solo
prohíbe el CRUCE; la DB no prohíbe nada; y el motor sirve la noche
sin cruce pero enmudece la cruzada. Levantar el límite de HORA es
barato (una grilla + cero motor); habilitar el CRUCE es modelado de
agenda (la franja no sabe de fechas) — dos decisiones de tamaño muy
distinto que hoy viven disfrazadas de un solo "no me deja".
