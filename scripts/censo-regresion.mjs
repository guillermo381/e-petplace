/**
 * EL REGISTRO DE REGRESIÓN DE CENSO — el dato del guard (S87-B → S88, D-651 ②).
 *
 * ── LINAJE (renombrado por adjudicación de mesa, S88): nació como
 *    «premisas-inertes» vigilando ramas declaradas inalcanzables. P3 y
 *    P4 lo ensancharon a su clase real: **lo que un censo midió una vez
 *    y puede decaer en silencio**. El invariante NO cambió
 *    (verde ⟺ n === 0) y los exports conservan su nombre de nacimiento
 *    (`PREMISAS`) — el linaje también vive en el código.
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
 *
 * ── EL ENSANCHE DE S88, declarado y no contrabandeado ─────────────────
 * El registro nació midiendo **el motor** (`sql`). `P3` mide **un número
 * que el canon afirma contra el objeto que lo desmiente**, y eso no cabe
 * en una consulta: hay que leer un archivo. Entra por `medir` — una
 * función JS que devuelve `{ n, detalle }` — en vez de `sql`.
 *
 * **POR QUÉ ES LA MISMA LEY Y NO OTRA COSA**, que es lo que había que
 * decidir antes de tocar nada: el defecto es idéntico —*un texto de la
 * casa fue cierto, dejó de serlo, y nada se puso rojo*—; lo único que
 * cambia es **CUÁL ES LA FUENTE**. P1/P2 se contestan contra la DB
 * porque su verdad vive ahí; P3 se contesta contra `supabase/migrations`
 * porque la suya vive ahí. La ley general que las cubre a las tres:
 *
 *   ► UNA AFIRMACIÓN QUE LA CASA DA POR CIERTA SE MIDE CONTRA SU FUENTE,
 *     O CADUCA SIN QUE NADIE SE ENTERE.
 *
 * **Y EL INVARIANTE NO SE TOCÓ:** `medir` devuelve igual un `n`, y
 * `inerte ⟺ n === 0`. Para P3 ese `n` es **la divergencia** entre lo
 * declarado y lo real — cero es «el canon dice la verdad». Si el
 * invariante se hubiera aflojado para que P3 entrara, el ensanche habría
 * costado más de lo que resuelve.
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
    /** EL ALCANCE, QUE SE IMPRIME SIEMPRE — verde o rojo (orden de mesa,
     *  S88). Un guard que no declara qué dejó afuera reporta un número
     *  que no puede defender.
     *
     *  QUÉ LO PARIÓ, y es un caso limpio: la corrida del 5-ago dio **7**
     *  donde el canon cita «5 vivas», y el reporte lo trajo como posible
     *  deriva orgánica. No lo era: **A sembró dos cuentas de prueba en
     *  S87** —`+s87prof` y `+s87recep`, las dos en Aurora, las dos del
     *  5-ago— y su acta ya declaraba *«todo recuento de acá en más las
     *  excluye o miente»*. **El instrumento vio bien y el número decía de
     *  más.** ⇒ se excluyen, y la exclusión SE DICE.
     *
     *  Y por qué el conteo de excluidas se MIDE en vez de escribirse:
     *  «excluye las de prueba» envejece igual que cualquier prosa. Si
     *  mañana hay tres, la línea lo dice sola. */
    alcance: {
      texto: 'excluye las cuentas de prueba cuyo correo lleva «+s87» (sembradas por A en S87, con su regla declarada en acta)',
      sql: `
        select count(distinct pe.user_id)::int as n
          from prestador_empleados pe
          join prestadores p on p.id = pe.prestador_id
          join auth.users u on u.id = pe.user_id
         where pe.activo
           and p.estado = 'activo'
           and not exists (select 1 from prestadores t where t.user_id = pe.user_id)
           and u.email like '%+s87%'
      `,
    },
    inerteMientras: {
      explicacion:
        'CERO personas REALES llegan al portal por vínculo activo — es decir, todo el que entra es titular de algún negocio',
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
          join auth.users u on u.id = pe.user_id
         where pe.activo
           and p.estado = 'activo'
           and not exists (select 1 from prestadores t where t.user_id = pe.user_id)
           and u.email not like '%+s87%'   -- alcance declarado arriba
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
          join auth.users u on u.id = pe.user_id
         where pe.activo
           and p.estado = 'activo'
           and not exists (select 1 from prestadores t where t.user_id = pe.user_id)
           and u.email not like '%+s87%'   -- mismo alcance que la consulta de arriba
         group by 1 order by 1
      `,
    },
    siCaduca:
      'esas personas ENTRAN al portal, y las ocho ramas de arriba dejan de ser hipotéticas de golpe',
  },

  {
    id: 'P2',
    ficha: 'D-660',
    titulo: 'los caminos del rol «administrador» están curados por el helper, y su límite intacto',
    desde: 'S88 (la MUTACIÓN — adjudicación de mesa, 5-ago-2026)',
    /** ⚰️ LA HISTORIA DE ESTA PREMISA ES SU PRIMERA MUERTE, y se conserva
     *  porque el registro es lo único que evita re-vigilar un muerto:
     *  P2 nació vigilando «el rol administrador no tiene UN portador»
     *  (S75→S88: cero filas en los dos ejes). **Caducó el 5-ago-2026 por
     *  el camino CORRECTO** — el founder gateó los primeros admins
     *  (D-652) sobre el motor que A curó (D-660). No fue deriva
     *  silenciosa: fue el evento que la premisa existía para anunciar, y
     *  lo anunció. **La mesa adjudicó: MUTA, no se retira** — el supuesto
     *  nuevo es lo que HOY sabemos cierto y se rompería en silencio:
     *
     *    ① los caminos de GESTIÓN de equipo pasan por
     *      `user_gestiona_prestador()` (el helper de D-660) — nadie
     *      compara `user_id` a mano de nuevo;
     *    ② EL LÍMITE: `empleado_roles` NO usa el helper — gatea por
     *      `dueño` a secas, A PROPÓSITO (solo el TITULAR nombra roles,
     *      firma de LETRA_ROLES_EQUIPO_S74; A lo declaró textual en su
     *      tanda ④: *«el límite: empleado_roles sigue gateando por
     *      dueño, no por gestión»*). Un admin que pudiera acuñar admins
     *      sería exactamente la fuga que este brazo vigila;
     *    ③ el trigger de gobierno (`_prestador_empleados_protege_gobierno`,
     *      D-526→D-660 tanda ④bis) también resuelve por el helper.
     *
     *  LECTURA DECLARADA A LA MESA: esto ya no es una rama «inerte» — es
     *  la regresión de un censo (la clase de P3/P4). El registro entero
     *  dejó de ser solo-inercia con P3; si el nombre del instrumento
     *  merece ensancharse, es decisión de mesa, no de esta entrada. */
    sitios: [
      {
        archivo: 'apps/prestador/src/app/(tabs)/mascotas.tsx',
        literal: '**Hoy es inerte**',
        consecuencia:
          '⚠️ PROSA VENCIDA POR LA MUTACIÓN: dice «el administrador no tiene motor» y desde el 5-ago tiene motor (D-660) Y portadores (D-652). Su cura viaja con el lote de superficie de C — se vigila que no sobreviva',
      },
    ],
    inerteMientras: {
      explicacion:
        'la suma de desviaciones contra el censo D-660: gestión sin helper + helpers en empleado_roles + trigger sin helper + gate de dueño ausente',
      /** MEDIDO AL MUTARLA (5-ago): 6/6 policies de gestión con helper ·
       *  0 helpers en empleado_roles · 2 policies gatean por dueño ·
       *  trigger con helper ⇒ desviación 0, VERDE.
       *
       *  ⚠️ EL COALESCE VA EN CADA LADO, y es un cobro propio de esta
       *  medición: las policies INSERT no tienen `polqual`, y
       *  `null || with_check` da NULL — mi primera sonda reportó las dos
       *  `_crea` como «no usan helper» cuando SÍ lo usan. Un null que se
       *  lee como veredicto es la familia L-197 en SQL. */
      medir: ({ dbQuery }) => {
        const DEF = `(coalesce(pg_get_expr(p.polqual, p.polrelid),'') || coalesce(pg_get_expr(p.polwithcheck, p.polrelid),''))`;
        // ① las SEIS policies de gestión que D-660 migró, por NOMBRE — si
        //   alguien las renombra, encontradas < 6 y esto sale ROJO
        //   nombrando el hueco (0 encontradas jamás es verde, L-197).
        const gestion = dbQuery(`
          select count(*)::int as con_helper,
                 (select count(*) from pg_policy p2 join pg_class c2 on c2.oid = p2.polrelid
                   where c2.relname in ('prestador_empleados','empleado_invitaciones')
                     and p2.polname ~ 'dueño')::int as encontradas
            from pg_policy p join pg_class c on c.oid = p.polrelid
           where c.relname in ('prestador_empleados','empleado_invitaciones')
             and p.polname ~ 'dueño'
             and ${DEF} ~ 'user_gestiona_prestador'
        `)[0];
        // ② el límite: empleado_roles SIN helper y CON gate de dueño
        const roles = dbQuery(`
          select (select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
                   where c.relname = 'empleado_roles'
                     and ${DEF} ~ 'user_gestiona_prestador')::int as con_helper,
                 (select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
                   where c.relname = 'empleado_roles'
                     and ${DEF} ~ 'dueño')::int as por_dueno
        `)[0];
        // ③ el trigger de gobierno resuelve por el helper
        const trigger = dbQuery(`
          select coalesce((select (pg_get_functiondef(p.oid) ~ 'user_gestiona_prestador')::int
            from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
           where ns.nspname='public' and p.proname='_prestador_empleados_protege_gobierno'), 0) as n
        `)[0].n;
        const n =
          (6 - Math.min(gestion.con_helper, 6)) + // gestión que perdió el helper (o se renombró)
          roles.con_helper +                       // el límite ROTO: un helper entró a empleado_roles
          (roles.por_dueno >= 1 ? 0 : 1) +         // el gate de dueño desapareció
          (trigger === 1 ? 0 : 1);                 // el trigger perdió el helper (o no existe)
        return {
          n,
          detalle: [
            {
              gestion_con_helper: `${gestion.con_helper}/6 (encontradas ${gestion.encontradas})`,
              limite_helpers_en_empleado_roles: roles.con_helper,
              limite_gate_dueno: roles.por_dueno,
              trigger_gobierno_con_helper: trigger === 1,
            },
          ],
        };
      },
    },
    siCaduca:
      'si gestión perdió el helper: alguien re-escribió una policy comparando user_id a mano — la clase exacta que D-660 censó y curó. Si empleado_roles GANÓ el helper: el límite se rompió y un administrador puede acuñar administradores (contra la firma S74). Las dos direcciones son silenciosas: nada rompe un build',
  },
  {
    id: 'P3',
    ficha: 'L-141',
    titulo: 'el canon dice la verdad sobre cuántas migraciones hay',
    desde: 'S82 (la última vez que se re-midió)',
    /** EL ANCLA NO INCLUYE EL NÚMERO, y es deliberado: el día que la mesa
     *  corrija el contador, el literal cambia — si el ancla llevara el
     *  «138», la CURA dispararía el brazo ① («el literal ya no está») y el
     *  guard castigaría exactamente lo que vino a pedir. Se ancla la parte
     *  ESTABLE de la frase. */
    sitios: [
      {
        archivo: 'CLAUDE.md',
        literal: 'migraciones** aplicadas y en el historial remoto',
        consecuencia:
          'la fila de inventario de `supabase/` — el número que toda sesión lee al abrir, y que ya decayó TRES veces (77 → 138, y el 9 de S47 antes)',
      },
    ],
    inerteMientras: {
      explicacion: 'la divergencia entre lo que el canon DECLARA y lo que el objeto TIENE',
      /** POR QUÉ SE MIDE EL HISTORIAL REMOTO Y NO LOS ARCHIVOS DEL ÁRBOL:
       *  la propia frase del canon dice «aplicadas y **en el historial
       *  remoto**». Y hay una razón operativa que pesa más: **una pista
       *  atrasada tiene menos archivos que `main`** —medido hoy: 143 en
       *  esta rama contra 157 en `origin/main`— así que contar el árbol
       *  haría que el guard denunciara «el canon miente» cuando lo que
       *  pasa es que la rama está vieja. *Un instrumento correcto sobre un
       *  árbol viejo da un número creíble y falso* (S84-B12).
       *  **MEDIDO HOY, y por eso las dos lecturas no compiten:** los 157
       *  del historial reconcilian **1:1** con los 157 `.sql` de
       *  `origin/main` — cero huérfanas en las dos direcciones. Si algún
       *  día divergen, esa divergencia es un hallazgo por sí sola. */
      medir: ({ dbQuery, leer }) => {
        const canon = leer('CLAUDE.md');
        // EL PARSER DECLARA SU PROPIA TRAMPA: `**N migraciones**` aparece
        // NUEVE veces en el canon — ocho son conteos POR SESIÓN («8
        // migraciones aplicadas y registradas»). Se ancla en la frase
        // completa de la fila de inventario, y si no matchea EXACTAMENTE
        // una vez, esto no adivina: lanza, y el guard lo convierte en
        // «no se pudo medir» (ROJO, jamás un número de consuelo).
        const m = canon.match(/\*\*(\d+) migraciones\*\* aplicadas y en el historial remoto/g);
        if (!m || m.length !== 1)
          throw new Error(
            `el canon no declara su contador de forma legible: ${m?.length ?? 0} coincidencias (esperaba 1). ` +
              `Si la frase se reescribió, el ancla de esta premisa hay que actualizarla.`,
          );
        const declarado = Number(m[0].match(/(\d+)/)[1]);
        const real = dbQuery('select count(*)::int as n from supabase_migrations.schema_migrations')[0].n;
        return {
          n: Math.abs(real - declarado),
          detalle: [{ declarado_en_el_canon: declarado, en_el_historial_remoto: real }],
        };
      },
    },
    siCaduca:
      'toda sesión que abra leyendo el canon arranca con un inventario falso — y este contador ya decayó TRES veces, que es precisamente por qué deja de confiarse a la prosa',
  },
  {
    id: 'P4',
    ficha: 'S88-A',
    titulo: 'el rol «profesional» y los chips están sincronizados (línea base conocida: 2 desincronizados)',
    desde: 'S88 (medido por A)',
    /** SIN SITIOS, y se declara por qué — es la primera premisa de esta
     *  clase: no hay un comentario mintiendo en el código. La premisa
     *  vive en una DECISIÓN DE DISEÑO del motor (la puerta de asignar
     *  gatea por CHIP, no por rol — precisamente PORQUE A midió que el
     *  rol no es confiable) y en el diagnóstico de A que la parió. Lo
     *  que se vigila no es un texto: es que la desincronización que esa
     *  decisión tolera NO CREZCA EN SILENCIO. */
    sitios: [],
    alcance: {
      texto: 'excluye las cuentas de prueba «+s87» (misma regla que P1; hoy 1 con chips, CON su fila — no afecta la línea base)',
      sql: `
        select count(*)::int as n
          from prestador_empleados pe
          join auth.users u on u.id = pe.user_id
         where pe.activo
           and u.email like '%+s87%'
           and exists (select 1 from prestador_empleado_servicios s where s.empleado_id = pe.id)
      `,
    },
    inerteMientras: {
      explicacion:
        'la desviación contra la línea base CONOCIDA (2 personas con chips sin la fila «profesional» — Los Shyris ×1 chip · Paseos Andres ×6, medido 5-ago)',
      /** LA LÍNEA BASE ES PARTE DEL REGISTRO, y la forma es la de P3:
       *  `n` = |real − conocido|. **Hoy 2 NO es un fallo — es el estado
       *  que la mesa conoce y con el que la puerta ya convive** (por eso
       *  gatea por chip). Lo que este guard vigila es el DELTA:
       *    · crece  → alguien más quedó con chips sin fila, en silencio
       *    · baja   → alguien lo curó y esta línea base quedó VIEJA —
       *      también es rojo, porque una línea base que nadie actualiza
       *      es la prosa que decae (se corrige el número de acá)
       *  Verificado al registrarla: la consulta reproduce el 2 de 5 de
       *  A exacto (Aurora ×2 y +s87prof CON fila · Shyris y Andres SIN). */
      lineaBase: 2,
      medir: ({ dbQuery }) => {
        const real = dbQuery(`
          select count(*)::int as n
            from prestador_empleados pe
            join auth.users u on u.id = pe.user_id
           where pe.activo
             and u.email not like '%+s87%'
             and exists (select 1 from prestador_empleado_servicios s where s.empleado_id = pe.id)
             and not exists (select 1 from empleado_roles r
                              where r.empleado_id = pe.id and r.rol = 'profesional')
        `)[0].n;
        const base = 2;
        return {
          n: Math.abs(real - base),
          detalle: [
            { desincronizados_hoy: real, linea_base_conocida: base },
            ...(real === base
              ? []
              : dbQuery(`
                  select p.nombre_comercial as negocio,
                         (select count(*) from prestador_empleado_servicios s
                           where s.empleado_id = pe.id)::int as chips
                    from prestador_empleados pe
                    join prestadores p on p.id = pe.prestador_id
                    join auth.users u on u.id = pe.user_id
                   where pe.activo
                     and u.email not like '%+s87%'
                     and exists (select 1 from prestador_empleado_servicios s where s.empleado_id = pe.id)
                     and not exists (select 1 from empleado_roles r
                                      where r.empleado_id = pe.id and r.rol = 'profesional')
                   order by 1
                `)),
          ],
        };
      },
    },
    siCaduca:
      'si CRECIÓ: otra persona quedó con chips sin la fila, por el mismo camino silencioso que produjo las dos primeras. Si BAJÓ: alguien curó y la línea base de este registro quedó vieja — se actualiza acá, con su fecha',
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
