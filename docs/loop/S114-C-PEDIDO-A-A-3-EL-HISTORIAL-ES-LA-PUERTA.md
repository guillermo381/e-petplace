# S114-C → A · EL HISTORIAL ES LA PUERTA (firma del founder, 8-sep)

> **El founder no encontró «¿Algo salió distinto?» en ningún lado.** El censo
> dijo por qué, y el hallazgo resultó más grande que la puerta:
> **una familia no puede abrir un servicio que ya pasó.** Eso no es de
> postventa — vale para el parte, las fotos y el acta.
>
> Todo lo de acá está **medido contra la base el 8-sep**, con su consulta.

---

## ① LO QUE MIDIÓ EL CENSO — la familia del founder (`guillo381+8`)

| | |
|---|---|
| citas de la familia | **379** · **265 ya pasaron** |
| **«confirmada» pasadas, SIN atención** | 🔴 **142** |
| «completada» pasadas | 51 (36 con atención · **15 sin**) |
| «pendiente» pasadas | 45 · canceladas 25 · no_show 1 |
| atenciones cerradas | 36 · **1 dentro de la ventana de 7 d** |
| `caso_ventana_dias()` | **7**, el motor la entrega ✅ |

**Las 142 son literalmente «el paseador no vino»** — el reclamo más frecuente
que existe. *Y una cita que nadie abrió NO TIENE atención, así que por el
camino de la atención no iban a tener puerta jamás.*

---

## ② POR QUÉ NO SE VEÍAN — dos filtros, ninguno mío, los dos correctos

```
packages/api/src/wrappers/citasMascota.ts:103
  .or(`fecha.gte.${hoyLocal()},and(fecha.is.null,presupuesto_id.not.is.null)`)

packages/api/src/wrappers/timeline.ts:190
  .neq('tipo', 'cita_servicio')     -- decisión B5.2
```

⇒ **una cita pasada no está en NINGUNA superficie**: el hub la filtra por
fecha, y el timeline excluye su evento a propósito. Las únicas que asoman son
las **37** que tienen `atencion_*_registrada` — 7 % de los 534 eventos.

⚠️ **Y corrijo una lectura mía anterior**, porque viajó a la mesa: dije que las
142 «estaban listadas y muertas al tacto». **Es falso.** Leí el filtro de
JavaScript y no la consulta. **No están listadas.** *`L-500` otra vez, cazada
al caminar y no al leer.*

---

## 🔴 EL PEDIDO — un lector de HISTORIAL de citas por mascota

Es lo único que me falta y es de tu territorio. Lo que necesito, campo por
campo, es **lo que ya devuelve `CitaActivaMascota`** más dos cosas:

```ts
export async function obtenerHistorialCitasMascota(
  mascotaId: string,
  opciones?: { limite?: number; cursor?: string },
): Promise<ResultadoWrapper<{ citas: CitaHistorialMascota[]; cursor: string | null },
                            'error_citas_mascota'>>
```

- **mismo shape que `CitaActivaMascota`** (la pantalla ya sabe dibujarlo);
- **`atencion_id` para las PASADAS** — hoy `_citasActivas` sólo lo consulta
  para las `en_curso` (`citasMascota.ts:176`), y sin él una cita atendida no
  puede abrir su recorrido;
- **`cerrada_en`** (o la hora de fin): hoy anclo la ventana en `fecha`, que es
  día sin hora, y por eso **exijo estrictamente anterior a hoy** — *una cita de
  hoy gana su puerta mañana*, declarado en el código;
- **paginado por cursor compuesto**, jamás por offset (`S99`: 55 de 62);
- **incluye canceladas y no_show**: son historia, y la familia pregunta por
  ellas. Que se puedan abrir o no lo decide la pantalla.

## 🔴 Y UNA SEGUNDA, CHICA Y CON DEFECTO VIVO — `cita_id` en `DetalleAtencion`

`apps/cliente/src/app/paseo/[atencionId].tsx` pasaba **`atencion_id` como el
id de una `'cita'`**, y el motor resuelve `'cita'` con
`evento_cita_servicio WHERE c.id = p_id` (`_caso_dueno_del_objeto`,
`20260911610000:17-25`) ⇒ la familia habría recibido **«ese objeto no existe»**
sobre una cita que sí existe.

**Es mío y ya está apagado con su razón** (`PUERTA_ALCANZABLE_ACA = false`),
porque `DetalleAtencion` **no trae `cita_id`** — medido: tiene `atencion_id` y
`evento_id`. `evento_atencion.cita_id` **ya existe en la tabla**: es una
columna más en el select. Con ella, esa puerta se re-enciende cambiando una
constante.

---

## LO QUE YO YA DEJÉ HECHO (no espera nada)

- **② la puerta EN LA FILA** del hub, con el `cita_id` correcto y **una sola
  lectura de casos** para toda la lista (`useCasosPorObjeto`, N16).
- **① la cita pasada SE ABRE**: murió el `return tarjeta` sin `Pressable` que
  sólo dejaba tapear `en_vivo`.
- **③ el gate silencioso, curado**: `diasDeVentana === undefined` devolvía
  `porque: 'sin_cerrar'` —*mentía sobre su causa*— y ahora es `'sin_ventana'`
  con un rojo en `__DEV__`. *Si esa lectura rebota, la puerta se apaga en las
  TRES pantallas y ahora lo dice.*

⚠️ **Lo construido NO está caminado y digo por qué:** con el lector filtrando
por fecha **no hay ninguna fila pasada en pantalla** donde la puerta pueda
dibujarse, y el reloj del emulador no se puede mover (imagen con Play Store).
*No es que no lo intenté: es que el sujeto no existe hasta que llegue el
lector.*

---

*Pista C · S114 · medido contra la base, con su consulta al lado.*
