/**
 * LA BÓVEDA DE PAPELES (S113-A · fase 3) — la puerta de lo que la familia trae
 * de otra clínica.
 *
 * 🔴 **TRANSCRIBE, JAMÁS INTERPRETA.** No hay un campo `estado`, ni `alto`, ni
 * `bajo`, ni `diagnostico`, y no es un olvido: *decir «alto» sobre un hemograma
 * es un acto clínico, y quien lo haría acá es un modelo leyendo una foto.*
 *
 * La referencia viaja **sólo si estaba impresa**. `null` significa que el papel
 * no la traía, y la pantalla lo dice — *un rango de otra especie o de otro
 * laboratorio se lee igual de convincente y es exactamente igual de falso.*
 */
import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos guardar el papel. Prueba de nuevo.';

export type CodigoErrorBoveda =
  | 'auth_required' | 'sin_acceso'
  /** El path no está bajo la carpeta de esa mascota. Es el guard que impide
   *  que una familia termine viendo el examen de otra. */
  | 'archivo_fuera_de_carpeta'
  /** Se llamó a la puerta antes de que la subida terminara. */
  | 'archivo_no_subido'
  | 'papel_no_existe'
  | 'papel_ya_confirmado'
  | 'desconocido';

/**
 * Lo que se GUARDA en la bóveda.
 *
 * 🔴 **NO es `ClasePapel` de `nexo.ts`, y por eso no comparte nombre.** Aquélla
 * es lo que el modelo RECONOCE en la foto (`examen | receta | informe`); ésta
 * es lo que la familia ELIGE al guardar. *Dos cosas parecidas con el mismo
 * nombre son la forma más barata de que alguien las unifique un martes y
 * descubra el lunes que un `certificado` no tiene dónde caer.*
 *
 * ⚠️ **LA COSTURA ES REAL Y HAY QUE MAPEARLA**: `examen` del modelo entra como
 * `laboratorio` o `imagen` según lo que la familia confirme, y `certificado` y
 * `otro` **no tienen origen en el modelo** — sólo pueden venir de que una
 * persona los elija. Eso no es un hueco: es la pantalla de confirmación
 * haciendo su trabajo.
 */
export type ClaseEnBoveda =
  | 'laboratorio' | 'imagen' | 'receta' | 'informe' | 'certificado'
  /** Existe a propósito: *sin él, quien traiga algo que no está en la lista lo
   *  va a clasificar mal con tal de poder subirlo.* */
  | 'otro';

/** Una fila transcrita, tal como estaba impresa. */
export type ValorDePapel = {
  /** El nombre del analito SIN normalizar («HCT» y «Hematocrito» son dos
   *  cadenas distintas a propósito: dos laboratorios que llaman distinto a lo
   *  mismo pueden no estar midiendo lo mismo). */
  analito: string;
  /** Texto y no número: hay resultados que no son números («Negativo»,
   *  «< 0,1», «Trazas»). *Forzarlos a número obliga a decidir qué significan.* */
  valor: string;
  unidad?: string | null;
  /** 🔴 Sólo si estaban impresas. `null` = el papel no las traía. */
  ref_min?: string | null;
  ref_max?: string | null;
  /** El rango impreso como UN texto, aunque no se haya podido partir. */
  referencia?: string | null;
  /** 🔴 Lo que el papel DICE, tal cual lo leyó el extractor. **La única red
   *  cuando el parseo sale mal**: sin él, un valor mal leído es indistinguible
   *  de uno bien leído. */
  literal?: string | null;
};

function codigo(msg: string): CodigoErrorBoveda {
  if (msg.includes('auth_required')) return 'auth_required';
  if (msg.includes('sin_acceso')) return 'sin_acceso';
  if (msg.includes('archivo_fuera_de_carpeta')) return 'archivo_fuera_de_carpeta';
  if (msg.includes('archivo_no_subido')) return 'archivo_no_subido';
  if (msg.includes('papel_ya_confirmado')) return 'papel_ya_confirmado';
  if (msg.includes('papel_no_existe')) return 'papel_no_existe';
  return 'desconocido';
}

/** El bucket. La carpeta es la MASCOTA, y el motor lo verifica: subir a la
 *  carpeta de otra rebota. */
export const BUCKET_PAPELES = 'papeles-familia';

/** El path que hay que usar al subir. Se compone acá para que ninguna pantalla
 *  lo arme a mano — *un path armado en la pantalla es la puerta por la que
 *  entra el archivo de otra mascota.* */
export function pathDePapel(mascotaId: string, nombreArchivo: string): string {
  const limpio = nombreArchivo.replace(/[^\w.-]+/g, '-').slice(-80);
  return `${mascotaId}/${Date.now()}-${limpio}`;
}

/**
 * ① EL PRIMER ACTO · lo que el extractor propuso. Nace `por_confirmar` y **no
 *    entra al expediente**: en la vida de la mascota todavía no pasó nada.
 */
export async function registrarPapelExtraido(input: {
  mascotaId: string;
  clase: ClaseEnBoveda;
  archivoPath: string;
  titulo?: string;
  fechaPapel?: string;
  origen?: string;
  valores?: ValorDePapel[];
}): Promise<ResultadoWrapper<
  { papel_id: string; estado: 'por_confirmar'; valores: number }, CodigoErrorBoveda
>> {
  const { data, error } = await getClient().rpc('registrar_papel_extraido', {
    p_mascota_id: input.mascotaId,
    p_clase: input.clase,
    p_archivo_path: input.archivoPath,
    p_titulo: input.titulo ?? undefined,
    p_fecha_papel: input.fechaPapel ?? undefined,
    p_origen: input.origen ?? undefined,
    p_valores: (input.valores ?? []) as unknown as never,
  });
  if (error) return { ok: false, codigo: codigo(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  return { ok: true, data: {
    papel_id: String(o.papel_id), estado: 'por_confirmar', valores: Number(o.valores),
  } };
}

/**
 * ② EL SEGUNDO ACTO · una persona lo miró.
 *
 * 🔴 **Es lo que vuelve la confirmación inevitable**: el evento del expediente
 * nace SÓLO acá. No hay otro camino que deposite en la vida de una mascota —
 * *un guard se puede saltear con otra llamada; una pieza que no existe en el
 * primer acto, no.*
 *
 * `valores` REEMPLAZA lo extraído: es lo que pasa cuando alguien arregla una
 * fila mal leída. Sin él, se confirma lo que vino.
 */
export async function confirmarPapel(
  papelId: string,
  valores?: ValorDePapel[],
): Promise<ResultadoWrapper<
  { papel_id: string; evento_id: string; valores: number }, CodigoErrorBoveda
>> {
  const { data, error } = await getClient().rpc('confirmar_papel', {
    p_papel_id: papelId,
    p_valores: (valores ?? undefined) as unknown as never,
  });
  if (error) return { ok: false, codigo: codigo(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || o.ok !== true) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  return { ok: true, data: {
    papel_id: String(o.papel_id), evento_id: String(o.evento_id), valores: Number(o.valores),
  } };
}

export type PapelDeMascota = {
  id: string;
  clase: ClaseEnBoveda;
  titulo: string | null;
  fecha_papel: string | null;
  origen: string | null;
  archivo_path: string;
  valores: ValorDePapel[];
};

export async function obtenerPapelesDeMascota(
  mascotaId: string,
): Promise<ResultadoWrapper<PapelDeMascota[], CodigoErrorBoveda>> {
  /* Por la tabla y no por RPC: la RLS ya contesta la única pregunta que
     importa —¿esta persona tiene acceso a esta mascota?— con el mismo helper
     que todo el expediente. Un RPC acá sería un gate paralelo que hay que
     mantener sincronizado con el que ya existe. */
  const { data, error } = await getClient()
    .from('papeles_familia')
    .select('id, clase, titulo, fecha_papel, origen, archivo_path, papel_valor(analito, valor, unidad, ref_min, ref_max, orden)')
    .eq('mascota_id', mascotaId)
    .order('fecha_papel', { ascending: false, nullsFirst: false });
  if (error) return { ok: false, codigo: codigo(error.message), mensaje: MENSAJE_ERROR };
  const filas = (data ?? []) as unknown as (PapelDeMascota & { papel_valor: (ValorDePapel & { orden: number })[] })[];
  return { ok: true, data: filas.map((f) => ({
    ...f,
    valores: [...(f.papel_valor ?? [])].sort((a, b) => a.orden - b.orden),
  })) };
}
