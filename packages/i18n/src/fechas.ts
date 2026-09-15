/**
 * Formato de fecha ÚNICO del riel (S53-B2c.1) — la voz de máquina
 * "03 ago 2023" / "03 aug 2023" por idioma vía Intl. Cero formateos
 * artesanales por pantalla: TODOS los módulos consumen esta función
 * (la cura Intl de S52 llegó a LineaDeVida; esta la vuelve ley).
 */

import type { IdiomaSoportado } from './idiomas';

/** Fecha larga en voz HUMANA por idioma — "7 de julio" / "July 7"
 *  (S55-A A3, cierra D-323/H1: nace acá al tocarse la primera pantalla
 *  que la necesitaba — el detalle del paseo la armaba artesanal). Sin
 *  año: es voz de título/contexto, no metadata (esa es la corta). */
export function fechaLargaHumana(iso: string, idioma: IdiomaSoportado): string {
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  // Timestamp con hora → día LOCAL del dispositivo (un paseo de la noche
  // en UTC-5 no puede saltar de día). Fecha-sola → partes literales
  // (jamás por Date(iso): la medianoche UTC corre el día — D-312).
  if (iso.length > 10) {
    const f = new Date(iso);
    if (Number.isNaN(f.getTime())) return iso.slice(0, 10);
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(f);
  }
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(a, m - 1, d));
}

/** Fecha con DÍA DE SEMANA en voz humana por idioma — "Lunes, 13 de julio" /
 *  "Monday, July 13" (S57-B1: headers de día de la agenda semanal; cura
 *  también el es-EC fijo del header de HOY — hallazgo D-315p). Fecha-sola
 *  por partes literales (jamás Date(iso) — D-312); sin año: voz de título. */
export function fechaDiaSemanaHumana(iso: string, idioma: IdiomaSoportado): string {
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso.slice(0, 10);
  const s = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(a, m - 1, d),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * DÍA DE SEMANA CORTO — "lun" / "mon". La tira de días y los ejes de
 * barras (S86: D-645 cobrada).
 *
 * ⚠️ NACIÓ TARDE Y ESO ES EL PUNTO. La condición de promoción estaba
 * ESCRITA —el HOY del prestador decía en su comentario *"su día en
 * `packages/i18n` llega con el TERCER consumidor"*— y para cuando se
 * cobró había **SEIS** sitios con la misma llamada a `Intl`: dos del
 * prestador (HOY · mascotas) y cuatro del cliente (los explorar de
 * veterinaria, adiestramiento, grooming y paseo).
 *
 * **La letra estaba bien y nadie la leyó, porque vivía en un comentario
 * de UNA de las copias** — el lugar donde solo la mira quien ya está
 * mirando esa copia. *Una condición de promoción que no la cuenta
 * nadie no es una condición: es una intención.*
 * ⇒ hoy la cuenta `scripts/verify-promociones.mjs`, que sale ROJO al
 * pasar el umbral. Ver D-645.
 *
 * Fecha-sola por partes literales, jamás `new Date(iso)` (D-312).
 */
export function diaSemanaCorto(iso: string, idioma: IdiomaSoportado): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  // Degrada al número de día — NUNCA a una fecha inventada (L-197).
  if (!a || !m || m < 1 || m > 12 || !d) return iso.slice(8, 10);
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  return new Intl.DateTimeFormat(locale, { weekday: 'short' })
    .format(new Date(a, m - 1, d))
    .replace('.', '');
}

/**
 * 🔴 **«dom 7 sep» / «sun sep 7» — LA FECHA CORTA CON SU DÍA (S113-B · 2.2.1).**
 *
 * Nace por orden del founder: en el tablero, *«7 de septiembre de 2026»* ocupa
 * dos líneas debajo de un dato de 18 px y la tarjeta se lee como un párrafo.
 * *Para una cita, el año casi nunca informa —es este— y el día de semana
 * informa muchísimo: la familia decide por «es domingo», no por «es el 7».*
 *
 * ⚠️ **NACE TARDE, y su censo lo dice**: cuando se fue a escribir había ya
 * **cinco sitios armando esta misma forma a mano** con `Intl` —guardería,
 * paseo, grooming y el Hogar, que además concatena `diaSemanaCorto` con el
 * número de día—. Es la historia de `diaSemanaCorto` repetida: *la condición
 * de promoción se cumplió hace rato y nadie la contaba.* Los cinco quedan
 * declarados para su dueño; migrarlos no es de esta pista.
 *
 * Fecha-sola por partes literales, jamás `new Date(iso)` (D-312), y **degrada
 * al día suelto, nunca a una fecha inventada** (L-197).
 */
export function fechaCortaHumana(iso: string, idioma: IdiomaSoportado): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso.slice(0, 10);
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(a, m - 1, d))
    .replace(/\./g, '')
    .replace(/,/g, '');
}

/**
 * 🔴 **«3:00 p. m.» — LA HORA EN VOZ DE FAMILIA (S116-C · lote 3b · `D-1096`).**
 *
 * Firma del founder: *«la familia lee “sáb 13 sep · 3:00 p. m.”, nunca
 * “2026-09-13 · 15:00” ni la fuente mono»*.
 *
 * ── POR QUÉ NACE Y NO SE REUSA `horaCortaDeMensaje` ───────────────────────
 * Esa función **fija `hour12: false` a propósito y lo dice en su cuerpo**: la
 * hora de un mensaje va bajo cada burbuja y con el sufijo ocupa el doble de
 * ancho. *Son dos horas distintas con dos razones opuestas escritas*, así que
 * ensanchar aquélla con una bandera habría borrado su razón. Conviven.
 *
 * ── LO QUE ACEPTA, y por qué las dos formas ───────────────────────────────
 * `'15:00'` o `'15:00:00'` —como viene de una columna `time`— y también un ISO
 * completo. **La fecha no se usa para nada**: sólo se necesita un `Date` al que
 * pedirle el formato, así que las horas sueltas se anclan a una fecha fija.
 * *Anclarlas a `new Date()` habría hecho que el resultado dependiera del día en
 * que se corre, que es la clase de cosa que no falla nunca hasta que falla.*
 *
 * Degrada al texto que entró, **jamás a una hora inventada** (`L-197`).
 */
export function horaHumana(hora: string, idioma: IdiomaSoportado): string {
  const m = /(\d{1,2}):(\d{2})/.exec(hora);
  if (m === null) return hora;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return hora;
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  /* Fecha fija y arbitraria: sólo se pinta la hora. */
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true }).format(
    new Date(2000, 0, 1, h, min),
  );
}

/**
 * 🔴 **«sáb 13 sep · 3:00 p. m.» — LA CITA COMO LA LEE LA FAMILIA.**
 *
 * Es la composición literal que el founder firmó, y vive **acá y no en cada
 * pantalla** porque el separador es parte de la forma: *tres pantallas que
 * concatenan «fecha · hora» a mano son tres lugares donde el día que la mesa
 * cambie el punto medio sólo cambian dos.*
 *
 * **Sin hora devuelve sólo la fecha** —y eso NO es un caso raro: una cita por
 * coordinar no tiene hora, y decir «sáb 13 sep · » con la cola colgando sería
 * dibujar un dato que no existe (`L-139`).
 */
export function fechaYHoraHumana(iso: string, hora: string | null, idioma: IdiomaSoportado): string {
  const f = fechaCortaHumana(iso, idioma);
  if (hora === null || hora.length === 0) return f;
  return `${f} · ${horaHumana(hora, idioma)}`;
}

/** dd mon yyyy en mono-voz (minúsculas), para metadata chica. */
export function fechaCortaMono(iso: string, idioma: IdiomaSoportado): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return iso.slice(0, 10).toLowerCase();
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  const mes = new Intl.DateTimeFormat(locale, { month: 'short' })
    .format(new Date(a, m - 1, d))
    .replace('.', '')
    .toLowerCase();
  return `${String(d).padStart(2, '0')} ${mes} ${a}`;
}

/**
 * LA HORA CORTA DE UN MENSAJE — «14:32» (S112-C · §2.3).
 *
 * Va bajo el último mensaje de cada grupo. **Sin segundos y sin fecha**: la
 * fecha ya la dice el separador de día, y repetirla en cada burbuja es el ruido
 * con formato de dato que la Ley 16 saca.
 */
export function horaCortaDeMensaje(iso: string, idioma: IdiomaSoportado): string {
  /* 🔴 **`hour12: false` EXPLÍCITO, y lo cazó un arnés y no la lectura.** Sin
     él, `es-EC` devuelve **«01:38 p. m.»** — el reloj de 12 con su sufijo—, y
     §2.3 pide «14:32». *Un formato de hora que «se ve bien» en una captura
     ocupa el doble de ancho bajo cada burbuja y no se parece a ninguna otra
     hora de la casa.* */
  return new Date(iso).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * EL SEPARADOR DE DÍA — «Hoy» · «Ayer» · «12 sep» (S112-C · §2.3).
 *
 * 🔴 **Compara por DÍA LOCAL, no por diferencia de milisegundos.** Restar 24 h
 * dice «ayer» sobre algo de anteayer a las 23:00 y «hoy» sobre algo de ayer a
 * las 23:59. *La pregunta no es cuánto tiempo pasó: es en qué día del
 * calendario de quien mira ocurrió.*
 *
 * Las voces de «Hoy» y «Ayer» llegan por parámetro: **este paquete no tiene
 * diccionario de producto**, y la casa que lee escribe sus palabras.
 */
export function etiquetaDeDiaDeMensaje(
  iso: string,
  idioma: IdiomaSoportado,
  voces: { hoy: string; ayer: string },
): string {
  const d = new Date(iso);
  const hoy = new Date();
  const aClave = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  if (aClave(d) === aClave(hoy)) return voces.hoy;
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (aClave(d) === aClave(ayer)) return voces.ayer;
  /* Con año sólo si NO es este año: «12 sep» dentro del año en curso, «12 sep
     2025» fuera. *Un año repetido en cada separador de una conversación de esta
     semana es dato que no discrimina nada.* */
  const mismoAnio = d.getFullYear() === hoy.getFullYear();
  return d.toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-EC', {
    day: 'numeric',
    month: 'short',
    ...(mismoAnio ? {} : { year: 'numeric' }),
  });
}

/**
 * 🔴 **«jueves 23 de julio» — LA FECHA DEL ANTETÍTULO (S116-C · lote 6).**
 *
 * **Sube al riel porque ganó un SEGUNDO consumidor, y ella misma lo pedía.**
 * Nació local en `hogar/index.tsx` con esta nota escrita al lado: *«Candidata
 * al RIEL (`fechaConDiaMono`) declarada: el formateo por idioma es del riel;
 * nace acá porque el riel no tiene la forma con día de semana»*. Hoy Actividad
 * necesita el mismo antetítulo ⇒ **el momento de subirla es antes de copiarla,
 * no después**: *dos pantallas con la misma función pegada son dos lugares
 * donde el día que la mesa cambie el formato sólo cambia uno.*
 *
 * ⚠️ **Recibe un `Date` y no un ISO, a diferencia de sus vecinas**, y es a
 * propósito: sus vecinas formatean una fecha-sola guardada (`D-312`: por
 * partes literales, jamás `new Date(iso)`); ésta formatea **el día de hoy del
 * aparato**, que ya es un `Date` y no pasó por ninguna columna.
 *
 * Minúsculas por Ley 3 — el antetítulo de la casa es voz de dato, no un rótulo.
 */
export function fechaConDiaHumana(d: Date, idioma: IdiomaSoportado): string {
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en-US' : 'es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(d)
    .toLowerCase();
}

/**
 * 🔴 **EL MES Y EL DÍA POR SEPARADO — lo que `BadgeFecha` pide (S116-C · lote 6).**
 *
 * La pieza de B **recibe el mes ya escrito y lo declara en su contrato**:
 * *«la pieza no formatea: el formateo de fechas vive en el riel… si aceptara
 * un `Date` tendría que elegir idioma, y una pieza que elige idioma es una
 * pieza que va a decir “SEP” en una app en inglés»*. Esta función es la otra
 * mitad de ese contrato: **el riel le entrega las dos piezas ya en su idioma.**
 *
 * Fecha-sola **por partes literales** (`D-312`), igual que `fechaCortaHumana`,
 * y **degrada a lo que entró, jamás a una fecha inventada** (`L-197`): un ISO
 * ilegible devuelve el mes vacío y el día crudo — *el badge se ve pobre y dice
 * la verdad, que es mejor que verse bien diciendo un mes que no es.*
 */
export function mesYDiaHumanos(iso: string, idioma: IdiomaSoportado): { mes: string; dia: string } {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || m < 1 || m > 12 || !d) return { mes: '', dia: iso.slice(8, 10) };
  const locale = idioma === 'en' ? 'en-US' : 'es-EC';
  const mes = new Intl.DateTimeFormat(locale, { month: 'short' })
    .format(new Date(a, m - 1, d))
    .replace(/\./g, '');
  return { mes, dia: String(d) };
}
