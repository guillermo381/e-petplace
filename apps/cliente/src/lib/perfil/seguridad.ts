/**
 * ⭐ **LO QUE HAY QUE SABER ANTES DE TOCAR A ESTA MASCOTA** (S113-C · 1.1 · C6).
 *
 * Arma los `ItemSeguridad` de `FranjaSeguridad` desde el perfil. Vive acá y no
 * en la pantalla porque **es una decisión, no un render**: qué entra a la
 * franja, con qué nombre y en qué orden. Puro: se puede probar sin montar nada.
 *
 * 🔴 **CON NOMBRE, JAMÁS «tiene alergias».** *«Tiene alergias» no le sirve a
 * nadie: el que va a bañarlo necesita saber a QUÉ.* Por eso un ítem sin nombre
 * legible **no entra**: una fila que dice «alergia» y nada más ocupa el lugar
 * de la que sí dice algo.
 *
 * ✅ **`alergias_detalle` YA ESTÁ TIPADO** (A, `31cfbdd7`): llegaba como
 * `unknown[]` y este módulo lo leía con guardas de runtime sobre una forma que
 * había medido contra la base. **Las guardas se retiran en el mismo acto que
 * llega el tipo**: sostenerlas «por las dudas» dejaría dos verdades sobre la
 * misma forma —la del compilador y la mía— y la mía envejecería sin avisar.
 * Lo único que sobrevive es el descarte del `alergeno` vacío, que **no es una
 * guarda de forma sino una decisión**: el tipo lo declara `string | null`.
 */
import type { AlergiaDeMascota } from '@epetplace/api';
import type { ItemSeguridad, ProcedenciaSeguridad } from '@epetplace/ui';

/** Lo mínimo del perfil que esta pieza necesita. Se pide por forma y no por el
 *  tipo entero: así un campo nuevo en `PerfilMascota` no la toca. */
export interface FuentesDeSeguridad {
  alergiasDetalle: readonly AlergiaDeMascota[];
  medicacion: readonly { nombre: string | null; dosis: string | null; hasta: string | null; fuente: string | null }[];
  condiciones: readonly { nombre: string | null; estado: string | null; fuente: string | null }[];
  restricciones: readonly { familia_servicio: string; severidad: string; descripcion: string | null }[];
}

/** Las voces las pone la pantalla (Ley 3); acá sólo se decide QUÉ se dice. */
export interface VocesDeSeguridad {
  alergiaA: (alergeno: string) => string;
  toma: (nombre: string, dosis: string | null) => string;
  hasta: (fecha: string) => string;
  restriccion: (servicio: string) => string;
  laFamilia: string;
  unPrestador: string;
}

const texto = (x: unknown): string | null => {
  if (typeof x !== 'string') return null;
  const t = x.trim();
  return t.length > 0 ? t : null;
};

/** `fuente` dice quién lo registró. Cualquier cosa que no sea la familia se
 *  trata como prestador: **ante la duda, el dato pesa más**, no menos. */
const procedenciaDe = (fuente: string | null): ProcedenciaSeguridad =>
  fuente === null || fuente === 'familia' ? 'familia' : 'prestador';

export function itemsDeSeguridad(f: FuentesDeSeguridad, voz: VocesDeSeguridad): ItemSeguridad[] {
  const items: ItemSeguridad[] = [];
  const vozDe = (p: ProcedenciaSeguridad): string => (p === 'familia' ? voz.laFamilia : voz.unPrestador);

  f.alergiasDetalle.forEach((a, i) => {
    const alergeno = texto(a.alergeno);
    /* Sin el alérgeno no hay nada que decir, y una franja que dice «alergia» a
       secas es justo la que este módulo existe para no producir. */
    if (alergeno === null) return;
    items.push({
      id: a.evento_id ?? `alergia-${i}`,
      clase: 'alergia',
      texto: voz.alergiaA(alergeno),
      /* Una alergia del snapshot clínico la registró quien atendió. */
      procedencia: 'prestador',
      vozProcedencia: voz.unPrestador,
    });
  });

  f.medicacion.forEach((m, i) => {
    const nombre = texto(m.nombre);
    if (nombre === null) return;
    const p = procedenciaDe(m.fuente);
    items.push({
      id: `medicacion-${i}`,
      clase: 'medicacion',
      /* La dosis va si vino; el «hasta» también. Lo que la receta no dijo, no
         se dibuja — y menos se completa. */
      texto: m.hasta !== null ? `${voz.toma(nombre, m.dosis)} · ${voz.hasta(m.hasta)}` : voz.toma(nombre, m.dosis),
      procedencia: p,
      vozProcedencia: vozDe(p),
    });
  });

  f.condiciones.forEach((c, i) => {
    const nombre = texto(c.nombre);
    if (nombre === null) return;
    const p = procedenciaDe(c.fuente);
    items.push({ id: `condicion-${i}`, clase: 'condicion', texto: nombre, procedencia: p, vozProcedencia: vozDe(p) });
  });

  f.restricciones.forEach((r, i) => {
    items.push({
      id: `restriccion-${i}`,
      clase: 'restriccion',
      texto: texto(r.descripcion) ?? voz.restriccion(r.familia_servicio),
      /* Una restricción de servicio la pone quien la va a hacer cumplir. */
      procedencia: 'prestador',
      vozProcedencia: voz.unPrestador,
    });
  });

  return items;
}
