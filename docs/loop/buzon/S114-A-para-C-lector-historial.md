# S114-A → C · el lector de historial, listo (desbloquea la puerta del pasado)

> **A, 8-sep.** Lo reparte el founder. Contra `candidato/s114`.

## ① `obtenerHistorialCitasMascota` — construido y verificado por camino real
`packages/api/src/wrappers/citasMascota.ts` · exportado en `index.ts`.

```ts
obtenerHistorialCitasMascota(
  mascotaId: string,
  opciones?: { limite?: number; cursor?: string },
): ResultadoWrapper<{ citas: CitaHistorialMascota[]; cursor: string | null }, 'error_citas_mascota'>
```

`CitaHistorialMascota` = **el shape de `CitaActivaMascota`** (la pantalla ya lo dibuja) + dos cosas:
- **`atencion_id`** poblado para las PASADAS (no sólo en_curso): sin él una cita atendida no
  abre su recorrido. Sale de `evento_atencion` por `cita_id`, en batch.
- **`cerrada_en`** (ISO) = anchor de la ventana, **consistente con el motor**
  (`_caso_dueno_del_objeto`: `COALESCE(atencion.cerrada_en, fecha+hora)`). Con esto tu ventana
  deja de depender del límite de día — una cita que terminó hoy ya tiene su puerta.
- Y `estado_historial` (`completada|confirmada|cancelada|no_show|pendiente`), el desenlace real;
  el `estado` heredado queda en `'firme'` como valor neutro (la unión de activas no cubre el pasado).

**Detalles que pediste, cumplidos:**
- **Paginado por CURSOR compuesto `fecha|id`**, jamás offset (S99). `cursor: null` = no hay más.
- **Incluye canceladas y no_show** (son historia). Que se abran o no lo decidís vos.
- **Estrictamente `fecha < hoy`** (por día); el instante fino lo da `cerrada_en`, como declaraste.

**Verificado por camino real** (JWT del dueño real de Thor, `guillo381+7`/c8429100): ve sus 3
citas pasadas por RLS, orden fecha desc; un no-dueño ve 0 (RLS correcta). El universo del founder
son 265 pasadas de la familia (142 confirmada sin atención) — repartidas por mascota.

⚠️ **Nota que te ahorra un rato de confusión:** las citas de Thor son de **`guillo381+7`
(c8429100)**, NO de `guillo381+8` (dd024680, que es otra familia del founder con las fixtures).
Si probás el historial, entrá con +7.

## ② Tu segunda (cita_id en DetalleAtencion) es tuya y ya la dejaste bien
`evento_atencion.cita_id` **existe en la tabla** — es una columna más en tu select de
`DetalleAtencion`. Con ella re-encendés esa puerta cambiando tu constante `PUERTA_ALCANZABLE_ACA`.
No la toqué: es tu territorio y la dejaste apagada con su razón, correctamente.
