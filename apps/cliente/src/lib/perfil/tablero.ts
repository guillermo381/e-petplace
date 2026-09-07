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
  delPlanAlDia: (n: number, total: number) => string;
  vencidaHace: (f: string) => string;
  activas: (n: number) => string;
  paseosSemana: (n: number) => string;
  proxima: (f: string) => string;
  plagasAlDia: (n: number, total: number) => string;
  estimada: string;
};

export function tarjetasDelTablero(
  t: TableroMascota,
  voz: VozTablero,
  /** La próxima cita **médica**, resuelta con el catálogo `es_medico`.
   *  `null` = no hay ninguna, y la tarjeta lo dice — *no cae al paseo.* */
  medica: { fecha: string; servicio: string } | null,
): TarjetaDelTablero[] {
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
    /* 🔴 **«0 de 5» con ocho vacunas aplicadas no es un error de cuenta: es
       una voz que miente por omisión.** El motor cuenta las del plan que están
       AL DÍA —y cero es correcto si todas vencieron—, pero la pantalla decía
       sólo el número y se leía «no tiene ninguna». *Un numerador sin su unidad
       obliga a la familia a adivinar qué se está contando.* Ahora la voz dice
       «al día», y las vencidas van al contexto. */
    valor: v !== null ? voz.delPlanAlDia(v.aplicadas_del_plan, v.total_plan) : null,
    /* 🔴 **UNA FECHA PASADA NO SE DICE «PRÓXIMA»** (ojo del founder). Decía
       «próxima el 19 abr 2024 · estimada» sobre una fecha de hace dieciséis
       meses. *El motor mandaba bien el `estado` —lo trae en el mismo objeto— y
       yo lo tiraba: la voz no era una interpretación, era un campo sin leer.*
       Con `vencida` la voz cuenta desde entonces; con el resto, cuenta hacia
       adelante. `derivada` ⇒ «estimada» en los dos casos. */
    contexto:
      v?.proxima != null
        ? `${v.proxima.estado === 'vencida' ? voz.vencidaHace(v.proxima.fecha) : voz.proxima(v.proxima.fecha)}${v.proxima.derivada ? ` · ${voz.estimada}` : ''}`
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

  /* ⑤ CITAS — **la próxima MÉDICA** (ojo del founder, 2.2.2 · ③).
     🔴 `t.citas.proxima` trae *la próxima cita*, sin distinguir oficio, y en
     Thor eso era un paseo. *La tarjeta vive en «Su salud»: un paseo ahí
     responde otra pregunta, y los paseos ya tienen su lugar en Actividad.*
     La resuelve la pantalla con el catálogo de `es_medico` —el mismo filtro
     que el motor usa para atar avisos— y la pasa por `medica`. */
  out.push({
    id: 'citas',
    rotulo: voz.citas,
    valor: medica !== null ? voz.proxima(medica.fecha) : null,
    contexto: medica?.servicio ?? undefined,
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
