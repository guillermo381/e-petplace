/**
 * ⭐ **DEL TABLERO DEL SERVIDOR A LAS SEIS TARJETAS** (S113-C · 2.2 · C1).
 *
 * Vive acá y no en la pantalla porque **es una traducción, no un render**: de
 * `obtenerTableroMascota` a lo que `TarjetaMetrica` necesita.
 *
 * 🔴 **LA LEY QUE ATRAVIESA LAS SEIS: sin dato no hay dibujo, y no hay cero.**
 * `valor: null` deja que la pieza diga «sin registro»; un `0` o un gráfico
 * plano **afirman una medición que nadie tomó**. *Un sparkline chato no dice
 * «no sé»: dice «no cambió».*
 */
import type { DibujoMetrica } from '@epetplace/ui';
import type { TableroVivo } from '@epetplace/api';

export interface TarjetaDelTablero {
  id: string;
  rotulo: string;
  valor: string | null;
  contexto?: string;
  dibujo?: DibujoMetrica;
}

type Voz = {
  peso: string;
  vacunas: string;
  antiparasitario: string;
  medicacion: string;
  citas: string;
  actividad: string;
  medidoEl: (f: string) => string;
  delPlan: (n: number, total: number) => string;
  activas: (n: number) => string;
  paseosSemana: (n: number) => string;
  proxima: (f: string) => string;
};

const texto = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v : null;
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);

export function tarjetasDelTablero(t: TableroVivo, voz: Voz): TarjetaDelTablero[] {
  const out: TarjetaDelTablero[] = [];

  /* ① PESO — el sparkline **sólo con dos o más puntos**: con uno no hay línea
     que dibujar, y con cero menos. */
  const serie = t.peso?.serie ?? [];
  out.push({
    id: 'peso',
    rotulo: voz.peso,
    valor: t.peso?.actual != null ? `${t.peso.actual} kg` : null,
    contexto: t.peso?.fecha != null ? voz.medidoEl(t.peso.fecha) : undefined,
    dibujo: serie.length >= 2 ? { tipo: 'sparkline', serie: serie.map((p) => p.kg) } : undefined,
  });

  /* ② VACUNAS — el anillo necesita un total: **sin plan no hay fracción**, y
     un anillo vacío se lee como «cero de algo», que es una afirmación. */
  const v = t.vacunas;
  const hechas = num(v?.aplicadas_del_plan);
  const total = num(v?.total_plan);
  out.push({
    id: 'vacunas',
    rotulo: voz.vacunas,
    valor: hechas != null && total != null ? voz.delPlan(hechas, total) : null,
    contexto: texto((v?.proxima as Record<string, unknown> | undefined)?.nombre) ?? undefined,
    dibujo:
      hechas != null && total != null && total > 0
        ? { tipo: 'anillo', hechos: hechas, total }
        : undefined,
  });

  /* ③ ANTIPARASITARIO — chips por plaga. Sin registros, ni chips ni valor. */
  const a = t.antiparasitario;
  const registradas = Array.isArray(a?.registradas) ? (a.registradas as unknown[]) : [];
  out.push({
    id: 'antiparasitario',
    rotulo: voz.antiparasitario,
    valor: texto(a?.estado),
    contexto: texto((a?.proxima as Record<string, unknown> | undefined)?.fecha)
      ? voz.proxima(String((a?.proxima as Record<string, unknown>).fecha))
      : undefined,
    dibujo:
      registradas.length > 0
        ? {
            tipo: 'chips',
            chips: registradas
              .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
              .map((x, i) => ({
                id: `${String(x.plaga ?? i)}`,
                texto: String(x.plaga ?? ''),
                /* `null` = no sabemos si está al día. **No es `false`**: la
                   pieza los pinta distinto, y decir «vencido» sin fecha sería
                   inventarlo. */
                alDia: typeof x.al_dia === 'boolean' ? x.al_dia : null,
              })),
          }
        : undefined,
  });

  /* ④ MEDICACIÓN — cuántas activas. **Cero activas es un dato**, no un hueco:
     por eso acá sí puede haber número, y su voz lo dice en palabras. */
  const m = t.medicacion;
  const activas = num(m?.activas);
  out.push({
    id: 'medicacion',
    rotulo: voz.medicacion,
    valor: activas != null ? voz.activas(activas) : null,
    contexto: texto(m?.ultima_administrada) ?? undefined,
  });

  /* ⑤ CITAS — la próxima. */
  const c = t.citas;
  const prox = c?.proxima as Record<string, unknown> | undefined;
  out.push({
    id: 'citas',
    rotulo: voz.citas,
    valor: texto(prox?.fecha),
    contexto: texto(prox?.servicio) ?? undefined,
  });

  /* ⑥ ACTIVIDAD — barras de la semana. */
  const act = t.actividad;
  const semana = Array.isArray(act?.semana) ? (act.semana as unknown[]).map((x) => (typeof x === 'number' ? x : 0)) : [];
  const enSemana = num(act?.en_semana);
  out.push({
    id: 'actividad',
    rotulo: voz.actividad,
    valor: enSemana != null && enSemana > 0 ? voz.paseosSemana(enSemana) : null,
    /* La etiqueta la exige la pieza y bien: *siete rectángulos sin resumen no
       le dicen nada a quien no ve la pantalla.* */
    dibujo:
      semana.length > 0 && enSemana != null
        ? { tipo: 'barras', valores: semana, etiqueta: voz.paseosSemana(enSemana) }
        : undefined,
  });

  return out;
}
