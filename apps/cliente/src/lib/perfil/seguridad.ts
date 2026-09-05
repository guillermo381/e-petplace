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
 * ⚠️ **`alergias_detalle` llega como `unknown[]`** — el wrapper lo declara así
 * a propósito («el jsonb del snapshot tal cual»). La forma se **midió** contra
 * la base (`mascota_perfil_vigente.alergias`, 5-sep):
 * `{ estado, alergeno, categoria, evento_id, severidad, fecha_diagnostico }`.
 * Se lee con guardas de runtime y **nada se asume**: sin `alergeno` legible, el
 * ítem no entra. *Pedido a A: tiparlo — mientras sea `unknown`, cada
 * consumidor va a inventarse su propia forma, y la primera que se equivoque lo
 * va a hacer en silencio.*
 */
import type { ItemSeguridad, ProcedenciaSeguridad } from '@epetplace/ui';

/** Lo mínimo del perfil que esta pieza necesita. Se pide por forma y no por el
 *  tipo entero: así un campo nuevo en `PerfilMascota` no la toca. */
export interface FuentesDeSeguridad {
  alergiasDetalle: readonly unknown[];
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

  f.alergiasDetalle.forEach((cruda, i) => {
    if (cruda === null || typeof cruda !== 'object') return;
    const o = cruda as Record<string, unknown>;
    const alergeno = texto(o.alergeno);
    /* Sin el alérgeno no hay nada que decir, y una franja que dice «alergia» a
       secas es justo la que este módulo existe para no producir. */
    if (alergeno === null) return;
    items.push({
      id: texto(o.evento_id) ?? `alergia-${i}`,
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
