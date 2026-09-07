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
 *
 * ── LO QUE ESTE ARCHIVO DEJÓ DE DECIDIR, Y POR QUÉ ES MEJOR ────────────────
 * 🔴 La primera versión decidía acá **si la serie de peso se dibuja**
 * (`serie.length >= 2`). A la movió al servidor (`serie_dibujable`,
 * `cf976fa8`) con la razón exacta: *si cada superficie decidiera cuántos
 * puntos alcanzan, alcanzaría una que decida distinto para que el mismo animal
 * se vea de dos formas*. Acá **ya no se recalcula: se lee su campo.** Lo mismo
 * con `tendencia`, que es `null` cuando no se sabe — y `null` **no es
 * «igual»**.
 */
import type { DibujoMetrica } from '@epetplace/ui';
import type { TableroMascota } from '@epetplace/api';

export interface TarjetaDelTablero {
  id: string;
  rotulo: string;
  valor: string | null;
  contexto?: string;
  dibujo?: DibujoMetrica;
}

export type VozTablero = {
  peso: string;
  vacunas: string;
  antiparasitario: string;
  medicacion: string;
  citas: string;
  actividad: string;
  kg: (n: number) => string;
  medidoEl: (f: string) => string;
  delPlan: (n: number, total: number) => string;
  activas: (n: number) => string;
  paseosSemana: (n: number) => string;
  proxima: (f: string) => string;
  plagasAlDia: (n: number, total: number) => string;
  estimada: string;
};

export function tarjetasDelTablero(t: TableroMascota, voz: VozTablero): TarjetaDelTablero[] {
  const out: TarjetaDelTablero[] = [];

  /* ① PESO — **el servidor dice si hay línea**, no esta función. */
  const p = t.peso;
  out.push({
    id: 'peso',
    rotulo: voz.peso,
    valor: p !== null ? voz.kg(p.actual) : null,
    contexto: p !== null ? voz.medidoEl(p.fecha) : undefined,
    dibujo:
      p !== null && p.serie_dibujable
        ? { tipo: 'sparkline', serie: p.serie.map((x) => x.kg) }
        : undefined,
  });

  /* ② VACUNAS — el anillo necesita un total: **sin plan no hay fracción**, y
     un anillo vacío se lee como «cero de algo», que es una afirmación. */
  const v = t.vacunas;
  out.push({
    id: 'vacunas',
    rotulo: voz.vacunas,
    valor: v !== null ? voz.delPlan(v.aplicadas_del_plan, v.total_plan) : null,
    /* 🔴 `derivada` ⇒ **«estimada»**: *una fecha que calculamos nosotros no es
       una que alguien escribió en un carnet* (nota de A). */
    contexto:
      v?.proxima != null
        ? `${voz.proxima(v.proxima.fecha)}${v.proxima.derivada ? ` · ${voz.estimada}` : ''}`
        : undefined,
    dibujo:
      v !== null && v.total_plan > 0
        ? { tipo: 'anillo', hechos: v.aplicadas_del_plan, total: v.total_plan }
        : undefined,
  });

  /* ③ ANTIPARASITARIO — chips por plaga, con el estado que trae el servidor.
     ⚠️ **No hay catálogo de plagas** (A lo midió: cero tablas) — se dibuja lo
     que vino, sin completar una lista que nadie definió. */
  const a = t.antiparasitario;
  out.push({
    id: 'antiparasitario',
    rotulo: voz.antiparasitario,
    /* 🔴 **Con chips hay que dar valor.** Medido en la pieza: `valor === null`
       dibuja «sin registro» **y los chips igual**, o sea que dejarlo nulo
       ponía una tarjeta diciendo que no hay nada con la prueba de que sí. */
    valor:
      a !== null && a.plagas.length > 0
        ? voz.plagasAlDia(a.plagas.filter((x) => x.estado === 'al_dia').length, a.plagas.length)
        : null,
    contexto: a?.proxima != null ? voz.proxima(a.proxima) : undefined,
    dibujo:
      a !== null && a.plagas.length > 0
        ? {
            tipo: 'chips',
            chips: a.plagas.map((x) => ({
              id: x.plaga,
              texto: x.plaga,
              /* `sin_registro` ⇒ **`null`, no `false`**: la pieza los pinta
                 distinto, y decir «vencido» sin fecha sería inventarlo. */
              alDia: x.estado === 'sin_registro' ? null : x.estado === 'al_dia',
            })),
          }
        : undefined,
  });

  /* ④ MEDICACIÓN — cuántas activas. **Cero activas es un dato**, no un hueco:
     por eso acá sí puede haber número, y su voz lo dice en palabras. */
  const m = t.medicacion;
  out.push({
    id: 'medicacion',
    rotulo: voz.medicacion,
    valor: m !== null ? voz.activas(m.activas) : null,
    /* La última administración es una fecha ISO: **su lugar es el detalle**,
       no media tarjeta. *Un `2026-08-14` suelto no es contexto: es un dato en
       bruto.* */
    contexto: undefined,
  });

  /* ⑤ CITAS — la próxima. */
  const c = t.citas;
  out.push({
    id: 'citas',
    rotulo: voz.citas,
    valor: c.proxima !== null ? voz.proxima(c.proxima.fecha) : null,
    contexto: c.proxima?.servicio ?? undefined,
  });

  /* ⑥ ACTIVIDAD — barras de la semana. */
  const act = t.actividad;
  const total = act !== null ? act.paseos_semana.reduce((s, x) => s + x, 0) : 0;
  out.push({
    id: 'actividad',
    rotulo: voz.actividad,
    valor: act !== null && total > 0 ? voz.paseosSemana(total) : null,
    /* La etiqueta la exige la pieza y bien: *siete rectángulos sin resumen no
       le dicen nada a quien no ve la pantalla.* */
    dibujo:
      act !== null && total > 0
        ? { tipo: 'barras', valores: act.paseos_semana, etiqueta: voz.paseosSemana(total) }
        : undefined,
  });

  return out;
}
