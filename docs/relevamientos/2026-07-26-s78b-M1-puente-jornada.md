# S78-B · M1 corto — EL PUENTE: del aviso de jornada al taller

Hallazgo del gate del founder en dispositivo: el aviso *"Todavía no tiene
jornada"* de la Hoja del miembro decía el hecho **sin camino**. Cuando se
construyó, el destino no existía (declarado, Ley 23); **ahora existe**
(A2 `8ade0a2` + turnos `44c94cb`). El CTA se monta.

## Las dos decisiones del M1

1. **¿A qué oficio, con chips de varios?** El **PRIMER oficio con chip en
   `ORDEN_OFICIOS`** (voto founder ratificado: sin selector para un caso —
   multi-oficio — que hoy no existe en datos). Las Jornadas del taller ya
   muestran a la persona con todas sus tarjetas: si el titular quería otro
   oficio, está a un taller de distancia y la persona sigue seleccionada.
2. **La preselección viaja por `?persona=<empleadoId>`.** No fue enmienda de
   `SeccionHorarios` (su `empleadoSel` ya es prop): fue enmienda de los CUATRO
   talleres — el param inicializa `empleadoJornada` y el fetch de arranque lee
   a ESA persona (las dos ramas: universal y por_servicio). `?seccion=horarios`
   ya existía en tres (verificado con literal; adiestramiento es página única y
   el param sobra sin dañar). Un id inválido rebota TIPADO en el wrapper
   (`empleado_invalido`, guard A2) — jamás franjas ajenas.

**La regla de siempre:** el CTA vive DENTRO del bloque de aviso, que solo se
pinta con ≥1 chip ⇒ el destino resuelve siempre que el CTA exista. Dos voces:
*"Cargar su jornada"* (nunca cargó) · *"Ver su jornada"* (pausada). Es el único
sólido de la Hoja (Ley 19.2 — desvincular ya había bajado a compacto).

## El barrido del punto 2, medido

Avisos de jornada en el app, por grep (`jornadaSin|nadieTitulo|jornadaPausada|
franjasActivas`):

| superficie | estado |
|---|---|
| `negocio/equipo.tsx` (la Hoja) | **puenteada en este lote** |
| `seccion-horarios.tsx` estado 2 ("Todavía nadie tiene jornada") | **vive EN el destino** — verificado: se renderiza dentro del propio taller, a scroll de distancia de "Agregar franja". No necesita puente |
| `paseo/grooming/adiestramiento/index.tsx` | los `franjasActivas` de los hubs son el CÓMPUTO de visibilidad de la oferta (S68) con su propia voz de taller — no son avisos de jornada por persona. Sin puente que deber |

## Punto 3 — los strings del flujo titular-asigna-turno

Verificación por clave (no solo por Espejo de forma): las 16 de `horarios.*`
de turnos + las 19 de `equipo.*` de la Hoja + las 2 nuevas del CTA — **1/1 en
`es.ts` Y `en.ts`**, cero faltantes, tuteo.
