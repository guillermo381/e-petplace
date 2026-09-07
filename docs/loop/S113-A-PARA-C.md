# S113-A → C · lo que está en `main` y cómo se llama

Todo esto está **mergeado, aplicado en la base y con su wrapper exportado**
desde `@epetplace/api`. Nada acá es promesa: cada puerta tiene su cinturón con
rojos reales y las tres edges de Nexo se llamaron de verdad con la cuenta del
founder.

## A1 · el contexto — `obtenerContextoCoach(mascotaId)`

Todo lo que Nexo sabe de una mascota **en un solo viaje** (~4,6 kB medidos
sobre Thor). Trae la mascota, su momento vital, la ficha de raza publicada (o
`null` si no hay), salud (peso y serie, alergias, condiciones, medicación,
últimas 3 desparasitaciones), plan vacunal con estados, próxima cita, últimos
10 eventos, pedidos en curso y la memoria.

**Devuelve las dos formas a propósito**: los campos planos (`nombre`, `etapa`,
`alergias[]`…) que consume la edge, y los agrupados (`mascota`, `salud`…) para
la app. Usá los agrupados.

⚠️ **En memorial SÍ se puede leer** (`estado_vida: 'memorial'`) — lo que no se
hace es hablar, y eso lo corta la edge. Nada de otra mascota, nada de otra
familia, **nada aportado por un menor** (filtrado y con su rojo ejercido).

## A2 · la búsqueda — `buscarEnMiFamilia(consulta, limite?)`

Una caja que encuentra **mascotas · citas · pedidos · recuerdos · productos ·
prestadores**. Cada fila trae `{ tipo, id, titulo, subtitulo, fecha, ruta }` y
**la `ruta` viene lista para `router.push`** — la arma el servidor para que la
pantalla no tenga que saber dónde vive cada cosa.

Medido: «Thor» 59,7 ms · «vacuna» 8,7 ms · «ingles» 7,6 ms. Lo propio se
ordena antes que lo público.

- Con **menos de 2 caracteres devuelve vacío sin error**: no rebotes a quien
  está escribiendo.
- Los acentos no importan en ninguna dirección («ingles» encuentra «inglés»).
  **La ñ sí**: «muneca» no encuentra «Muñeca». Es correcto y está declarado.

## A3 · la memoria — `listarMemoriaCoach` · `agregarMemoriaCoach` · `editarMemoriaCoach` · `borrarMemoriaCoach`

Hechos que la familia escribió o confirmó. Cada uno trae su `fuente`
(`'familia'` | `'confirmado_de_ia'`) — **mostrala**: no es lo mismo lo que
alguien afirmó que lo que sólo dejó pasar. **Editar un hecho de la IA lo vuelve
de la familia** (el motor lo hace solo).

Techo de **30 por mascota** (`memoria_llena`): la memoria entera viaja en cada
pregunta.

## A4 · el hilo — `leerHiloCoach` · `guardarTurnoCoach` · `borrarHiloCoach`

Turnos numerados, `rol: 'familia' | 'nexo'`. **Retención de 30 días aplicada
por el lector**, no sólo por el purgador. `borrarHiloCoach` borra de verdad.

## 2.1 · avisos y placa

- `obtenerAvisosCoach()` → los avisos sin leer de la familia ·
  `marcarAvisoCoachLeido(id)` · `activarAvisosNexo(familiaId, activar)`.
  **Son opt-in**: sin encenderlo la lista viene vacía y eso es correcto, no un
  error. Tipos: `vacuna_vence` · `antiparasitario_vence` · `cita_manana`.
  **Ninguno lo decide un modelo.**
- `activarPlaca(token, mascotaId)` → ata una chapita fabricada. El pasaporte
  **nace con el token de la placa** (ya está grabado en metal). Si ya tenía
  pasaporte, el anterior se revoca en el mismo acto.
  `placa_ya_activada` **no dice de quién es**, a propósito.

## Y de otros lotes, por si te sirven

- `registrarMedicacionAdministrada(mascotaId, { medicamento, dosis, via?, fecha?, … })`
  — la familia anota una dosis. **No cambia `medicacion_actual`**: administrar
  no es prescribir.
- `obtenerContenidoDeRaza(especie, raza)` · `registrarFinDeVida(...)` ·
  `sugerirRaza(...)` — ya estaban.

## Lo que la familia sabe y no tenía dónde poner (nuevo)

- `registrarObservacionComportamiento(mascotaId, { texto, fecha? })` — «le
  tiene miedo a los truenos». Entra como `observacion_comportamiento`.
- `declararAlergiaFamilia(mascotaId, { alergeno, severidad, reaccion?, desde? })`
- `declararCondicionFamilia(mascotaId, { condicion, descripcion?, desde? })`

🔴 **Las dos últimas entran como `'sospechada'`, nunca confirmada, y la
pantalla tiene que decirlo.** La franja de seguridad **sí las muestra**
(verificado: llegan al perfil vigente), y el plan y guardería **no las tratan
como diagnóstico**. *La procedencia sola no alcanzaba: un lector que filtra por
«tiene alergia» no mira quién lo dijo — el estado sí lo mira todo el mundo.*

La severidad se elige entre `SEVERIDADES_ALERGIA` (leve · moderada · severa ·
anafiláctica) y **no tiene default a propósito**: poner «leve» por comodidad
sería inventar un dato clínico en el único campo que decide si alguien corre a
una clínica.

## Lo que NO existe y no lo pidas

- **Puerta de familia para adjuntar un papel a la mascota** (la bóveda, 2.2).
  Censada: `evento_archivo_adjunto` existe con su tipo activo y **cero usos**,
  pero `prestador_id` es NOT NULL — la tabla nació para el prestador durante
  una atención. Está anotado; no lo construí porque exige decidir si se afloja
  esa columna, y sus lectores del timeline filtran por `evento_padre_id`.
- **La página pública del pasaporte NO se puede servir desde la edge.** Medido:
  Supabase degrada `text/html` (y `application/xhtml+xml`) a `text/plain` en
  GET; `image/svg+xml` pasa. Necesita dominio propio. Está en pendientes.
