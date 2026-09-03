/**
 * EL DÍA DEL NEGOCIO — el mismo que usa la base, jamás el del reloj UTC.
 *
 * 🔴 **EL DEFECTO QUE ESTO EVITA NO FALLA.** A las 23:01 de Guayaquil el UTC
 * ya es el día siguiente: la base dice `2026-09-02` y `new Date()` dice `03`.
 * Pedirle al lector el día equivocado **devuelve filas igual** —las del otro
 * día, en otro estado— y eso se lee como defecto de la pantalla. *Cinco horas
 * de cada veinticuatro la app y la base hablan de días distintos.*
 *
 * La zona sale del contexto de arranque (`zona_horaria`), **no se escribe
 * acá**: *una zona hardcodeada en la app es una segunda fuente que diverge de
 * la base el día que la base cambie.*
 */

/** `YYYY-MM-DD` en la zona del negocio, calculado en el momento. */
export function diaDelNegocio(zona: string, ahora: Date = new Date()): string {
  /* `en-CA` da `YYYY-MM-DD` — la única forma de sacar la fecha en una zona sin
     armarla a mano con getFullYear/getMonth, que trabaja en la zona LOCAL del
     teléfono y es exactamente lo que se está evitando. */
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

/**
 * La hora de un acto, en la zona del negocio.
 *
 * ⚠️ **Lleva su fecha SÓLO si no es la del día que se está mirando.**
 *
 * 🔴 Y el caso real es más sutil de lo que parece: `Kira Tres` tiene su
 * no-recogida sellada `2026-09-03T01:53Z`, **que en Guayaquil es el 2 a las
 * 20:53** — o sea **el mismo día de su estadía**. *El sello crudo parecía de
 * otro día y no lo era.* Leer la fecha del ISO sin convertirla habría puesto
 * un «03-sept» en una fila del 2 y hecho dudar de un dato correcto.
 *
 * La fecha aparece cuando **de verdad** difiere del día mirado — por ejemplo
 * si esa misma fila se lee desde el 3. *Mostrar «20:53» a secas en una fila
 * de otro día no es incompleto: se lee como dato y miente.*
 */
export function horaDelActo(
  iso: string | null,
  zona: string,
  diaQueSeMira: string,
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hora = new Intl.DateTimeFormat('es-EC', {
    timeZone: zona,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  const dia = diaDelNegocio(zona, d);
  if (dia === diaQueSeMira) return hora;
  /* El día se dice corto y ANTES de la hora: lo excepcional adelante. */
  const corto = new Intl.DateTimeFormat('es-EC', {
    timeZone: zona,
    day: '2-digit',
    month: 'short',
  }).format(d);
  return `${corto} ${hora}`;
}
