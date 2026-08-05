/**
 * EL REGISTRO DE PREMISAS INERTES — el dato del guard (S87-B, D-651 ②).
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │ UNA CONDICIÓN QUE EL CÓDIGO DECLARA «INERTE» SE MIDE CONTRA EL    │
 * │ MOTOR, NO SE DESCRIBE. SI LA PREMISA CADUCA, ROJO.                │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * QUÉ LO PARIÓ, con su literal: `(tabs)/_layout.tsx` dice textual
 * «INERTE hoy: solo el titular llega». **Era exacto en S75** (0 empleados
 * activos no titulares, medido en su acta). **Caducó solo, por un INSERT
 * en otra tabla**, y nada se puso rojo: ningún typecheck, lint ni gate
 * puede ver una premisa — **un comentario no es un guard**. Hoy cinco
 * personas ven una barra de tres que nunca se diseñó (D-651).
 *
 * POR QUÉ EL ANCLA ES EL LITERAL Y NO UNA MARCA INYECTADA, que es la
 * decisión de diseño de este archivo: la forma obvia era escribir
 * `PREMISA-INERTE(P1)` en cada sitio y que el guard buscara la marca.
 * **Los sitios viven en `apps/prestador` —territorio de C— y este
 * instrumento es de B**: inyectar marcas ahí sería clonar trabajo ajeno
 * en vez de pedirlo (método §6). El ancla es **el texto que YA está
 * escrito**. Consecuencias, las dos declaradas:
 *   · CERO escritura fuera de territorio para que el guard exista.
 *   · Si alguien reescribe o borra ese comentario, el guard sale ROJO
 *     diciendo «la premisa que vigilaba ya no está» — y eso es correcto:
 *     el guard estaba midiendo el aire y alguien tiene que venir a ver
 *     si se curó o solo se movió. **Un ancla que se puede perder en
 *     silencio no es un ancla.**
 *
 * CÓMO SE AGREGA UNA PREMISA: entrada nueva con su `sql`. La consulta se
 * escribe como **espejo de la puerta real** (L-167: se mide por el camino
 * que usa la pantalla, jamás por la defensa que uno supone) y devuelve
 * UNA fila con UNA columna `n`.
 */

/** LAS PREMISAS VIGILADAS. Cada una: qué declara · dónde lo declara ·
 *  contra qué se mide · qué pasa si caduca. */
export const PREMISAS = [
  {
    id: 'P1',
    ficha: 'D-651',
    titulo: 'solo el titular llega al portal del prestador',
    /** El literal es de S75-B y era verdad ese día. */
    desde: 'S75',
    /** LOS SITIOS — OCHO, y ése es un hallazgo de esta medición: la ficha
     *  D-651 nombra UNA línea (`_layout.tsx:305`) y la misma premisa
     *  caducada está escrita en OCHO lugares. Se listan todos porque una
     *  premisa que se cura en un archivo y sobrevive en siete no se curó:
     *  quedó peor, porque ahora el repo se contradice a sí mismo. */
    sitios: [
      {
        archivo: 'apps/prestador/src/app/(tabs)/_layout.tsx',
        literal: 'Hoy inerte:',
        consecuencia: 'el tipo `EstadoSesionRaiz` porta `esGestor` dando por hecho que el que llega siempre es gestor',
      },
      {
        archivo: 'apps/prestador/src/app/(tabs)/_layout.tsx',
        literal: 'INERTE hoy: solo el titular llega',
        consecuencia: '🔴 LA BARRA DE TRES: el `.filter()` del tab NEGOCIO se le aplica a gente real, sobre un diseño que nadie hizo (D-651 ①)',
      },
      {
        archivo: 'apps/prestador/src/app/(tabs)/negocio.tsx',
        literal: 'inerte hasta la puerta',
        consecuencia: 'la prosa venció; el `useGateGestor` de adentro SÍ corre y protege — lo que caducó es la explicación, no el código (L-198)',
      },
      {
        archivo: 'apps/prestador/src/app/paseo/taller.tsx',
        literal: 'inerte hasta la puerta',
        consecuencia: 'ídem: gate de ruta VIVO, comentario vencido',
      },
      {
        archivo: 'apps/prestador/src/app/grooming/taller.tsx',
        literal: 'inerte hasta la puerta',
        consecuencia: 'ídem: gate de ruta VIVO, comentario vencido',
      },
      {
        archivo: 'apps/prestador/src/app/veterinaria/taller.tsx',
        literal: 'inerte hasta la puerta',
        consecuencia: 'ídem: gate de ruta VIVO, comentario vencido',
      },
      {
        archivo: 'apps/prestador/src/app/adiestramiento/taller.tsx',
        literal: 'inerte hasta la puerta',
        consecuencia: 'ídem: gate de ruta VIVO, comentario vencido',
      },
      {
        archivo: 'apps/prestador/src/i18n/es.ts',
        literal: 'rama inerte hoy',
        consecuencia: 'la voz «Tu acceso al día a día todavía no está disponible» se escribió para el empleado que espera la puerta — y la puerta abrió: HALLAZGO, no veredicto (¿la sigue viendo alguien?)',
      },
    ],
    inerteMientras: {
      explicacion:
        'CERO personas llegan al portal por vínculo activo — es decir, todo el que entra es titular de algún negocio',
      /** ESPEJO DE `obtenerMiPrestador` (packages/api, R1 desde S75), leído
       *  al escribir esta consulta y no de memoria:
       *    (1) `prestadores.user_id = uid`            → entra como TITULAR
       *    (2) vínculo `activo` + fila legible (RLS)  → entra SIN serlo
       *  Por eso el `NOT EXISTS` es contra `prestadores` ENTERA y no
       *  contra el negocio de la fila: el camino (1) se evalúa global, así
       *  que quien es titular de A y empleado de B llega como titular y NO
       *  cuenta acá. **Medido el 4-ago-2026: las dos formas dan 5** — la
       *  fina y la gruesa coinciden hoy; se deja la fina porque el día que
       *  difieran, la gruesa estaría diciendo de más. */
      sql: `
        select count(distinct pe.user_id)::int as n
          from prestador_empleados pe
          join prestadores p on p.id = pe.prestador_id
         where pe.activo
           and p.estado = 'activo'
           and not exists (select 1 from prestadores t where t.user_id = pe.user_id)
      `,
      /** Qué NOMBRAR cuando esté en rojo. Sin datos personales a propósito:
       *  el guard tiene que decir QUÉ se volvió alcanzable, no quién es. */
      detalle: `
        select p.nombre_comercial as negocio,
               count(*)::int      as personas,
               sum(case when (select count(*) from prestador_empleado_servicios s
                               where s.empleado_id = pe.id) > 0 then 1 else 0 end)::int as con_chips
          from prestador_empleados pe
          join prestadores p on p.id = pe.prestador_id
         where pe.activo
           and p.estado = 'activo'
           and not exists (select 1 from prestadores t where t.user_id = pe.user_id)
         group by 1 order by 1
      `,
    },
    siCaduca:
      'esas personas ENTRAN al portal, y las ocho ramas de arriba dejan de ser hipotéticas de golpe',
  },

  {
    id: 'P2',
    ficha: 'D-513',
    titulo: 'el rol «administrador» no tiene un solo portador',
    desde: 'S75',
    sitios: [
      {
        archivo: 'apps/prestador/src/app/(tabs)/mascotas.tsx',
        literal: '**Hoy es inerte**',
        consecuencia:
          'el delta declarado entre el tab NEGOCIO (`[dueño, administrador]`) y `esDueno` (dueño-only) es invisible mientras no exista un administrador',
      },
    ],
    inerteMientras: {
      explicacion: 'CERO filas con rol «administrador», en los DOS ejes que la casa usa',
      /** LAS DOS TABLAS A PROPÓSITO: `empleado_roles` es el eje vivo (el que
       *  lee `empleado_tiene_rol`) y `prestador_empleados.rol` es el eje
       *  legado que todavía tiene lector (`titular.ts`, D-486). Preguntar
       *  por uno solo sería el censo por-helper que L-173 prohíbe: se
       *  cuenta por TABLA, y las dos suman. */
      sql: `
        select ( (select count(*) from empleado_roles       where rol = 'administrador')
               + (select count(*) from prestador_empleados  where rol = 'administrador') )::int as n
      `,
      detalle: `
        select 'empleado_roles' as tabla, count(*)::int as n from empleado_roles      where rol = 'administrador'
        union all
        select 'prestador_empleados',     count(*)::int      from prestador_empleados where rol = 'administrador'
      `,
    },
    siCaduca:
      'nace el primer administrador y TODA rama `[dueño, administrador]` del código se ejecuta por primera vez en producción — sin haber corrido nunca (D-652)',
  },
];

/** ────────────────────────────────────────────────────────────────────
 *  LAS EXENTAS — «inerte» en su OTRA acepción.
 *
 *  POR QUÉ EXISTE ESTA LISTA, y es el hallazgo que le dio forma al guard:
 *  la palabra `inerte` en esta casa nombra TRES cosas distintas —
 *    ① una premisa de ALCANCE («esta rama no se ejecuta hoy») ← lo vigilado
 *    ② Ley 13: SIN MOVIMIENTO («inerte: sin shimmer, sin pulso»)
 *    ③ sin interacción («sin onPress el hecho es INERTE»)
 *  Un guard que grepeara la palabra gritaría sobre ② y ③ **donde no pasa
 *  nada, y se desactivaría solo** — es la dirección B de la ley de los
 *  guards (acta del método S86 §8), y el mismo defecto que M2 tuvo al
 *  ensancharse. Se exime por SITIO y con su razón escrita; nunca por
 *  regex laxa.
 *  ──────────────────────────────────────────────────────────────────── */
export const EXENTAS = [
  { archivo: 'packages/ui/src/components/Esqueleto.tsx', literal: 'Completamente INERTE', razon: 'Ley 13 — movimiento' },
  { archivo: 'apps/prestador/src/components/techo-oficio.tsx', literal: 'Ley 13 intacta: INERTE', razon: 'Ley 13 — movimiento' },
  { archivo: 'apps/prestador/src/app/(tabs)/cuenta/index.tsx', literal: 'Inerte por ley: sin shimmer', razon: 'Ley 13 — movimiento' },
  { archivo: 'apps/cliente/src/app/(tabs)/hogar/index.tsx', literal: 'Sin onPress el hecho es INERTE', razon: 'sin interacción — no es una premisa' },
  /** ⚠️ LA EXENTA INCÓMODA, y se escribe con su incomodidad a la vista.
   *  «los chips nacen con la invitación … inertes hasta la aceptación»
   *  (S76-B4) **SÍ es una premisa** — pero de una CUARTA clase que este
   *  guard no sabe medir: no es una rama declarada inalcanzable (que se
   *  contesta con un `count`), es una propiedad del DATO sostenida por
   *  todos sus lectores. Su verificación no es una consulta: es un censo
   *  de lectores («ningún lector de chips ignora `activo`»), y un censo
   *  no cabe en la forma `count(*) = 0` de este registro.
   *  Se exime DECLARANDO el hueco en vez de forzarla a una consulta que
   *  mediría otra cosa — un guard que contesta la pregunta equivocada es
   *  peor que uno que dice que no puede. **Queda como hallazgo a la mesa:
   *  si esta clase importa, pide su propio instrumento.** */
  { archivo: 'apps/prestador/src/app/negocio/equipo.tsx', literal: 'inertes hasta la aceptación', razon: 'CUARTA CLASE — propiedad del dato sostenida por sus lectores; no se contesta con un count (ver nota)' },
];

/** Las raíces que el guard barre. Si esto se achica, el guard mide menos
 *  y su silencio pasa a significar «no miré» (L-192, tercera capa) — por
 *  eso el guard ancla su corpus contra un piso. */
export const RAICES = ['apps/cliente/src', 'apps/prestador/src', 'packages/ui/src'];

/** PISO DEL CORPUS — medido el 4-ago-2026: 13 ocurrencias de `inerte` en
 *  las tres raíces. El piso NO es 13: es 8, con holgura a propósito para
 *  que curar premisas (que ES el objetivo) no dispare el ancla. Lo que el
 *  piso ataja es el derrumbe — un barrido que de golpe encuentra 2. */
export const PISO_OCURRENCIAS = 8;
