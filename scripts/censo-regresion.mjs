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

/** ────────────────────────────────────────────────────────────────────
 *  EL EXTRACTOR DE P5 — qué consulta un árbol de `packages/api`.
 *
 *  Vive EXPORTADO para que la auto-prueba lo ejercite con fixtures
 *  (L-192: cada brazo produce su rojo antes de mirar dato real) y para
 *  que el discriminador pueda correrlo contra un ancla vieja a mano.
 *
 *  ALCANCE v1, declarado (los límites quedan escritos, no curados —
 *  adjudicación de mesa):
 *    · LITERALES solamente — un nombre construido dinámicamente es
 *      invisible; los `select(`…`)` con backtick y los trozos con `${`
 *      se CUENTAN en `dinamicas` para que el silencio no sea «no miré».
 *    · EMBEDS (`select('rel(a,b)')`) v1 FUERA — se descartan enteros.
 *    · El pareo tabla↔columna es POR SEGMENTO tras cada `.from('t')` —
 *      un archivo con varias tablas parea cada columna con la última
 *      `.from` que la precede.
 *  ──────────────────────────────────────────────────────────────────── */
export function extraerConsultasDeFuente(src) {
  const pares = [];
  const rpcs = [];
  let dinamicas = 0;
  let embedsFuera = 0;

  for (const m of src.matchAll(/\.select\(\s*`/g)) { void m; dinamicas++; }

  const segmentos = src.split(/\.from\(\s*'/).slice(1);
  for (const seg of segmentos) {
    const tabla = seg.match(/^([a-zA-Z0-9_]+)'/)?.[1];
    if (!tabla) continue;
    const cols = new Set();
    for (const s of seg.matchAll(/\.select\(\s*'([^']*)'/g)) {
      // ── EMBEDS FUERA *ENTEROS* (nombre + paréntesis), ANTES del split.
      //    El COBRO que lo parió (dirección B, cazado en la primera
      //    corrida real): `familia:familia_id (id, nombre, tipo)` partido
      //    por coma suelta ` nombre` sin su '(' — y el extractor lo
      //    atribuía a la tabla EXTERNA: 6 «faltantes» que eran columnas
      //    de embeds. Remover el embed entero pierde también su columna
      //    FK real (decir de MENOS, declarado y contado en `embedsFuera`)
      //    — el costo correcto: inventar roturas desactiva el guard.
      let plano = s[1];
      while (/[a-zA-Z0-9_:!]+\s*\([^()]*\)/.test(plano)) {
        plano = plano.replace(/[a-zA-Z0-9_:!]+\s*\([^()]*\)/g, () => { embedsFuera++; return ''; });
      }
      for (let c of plano.split(',')) {
        c = c.trim();
        if (!c || c === '*') continue;
        if (c.includes('${')) { dinamicas++; continue; }
        if (c.includes('(') || c.includes(')')) continue;
        if (c.includes(':')) c = c.split(':').pop().trim(); // alias:col → col
        if (/^[a-z0-9_]+$/i.test(c)) cols.add(c);
      }
    }
    for (const s of seg.matchAll(/\.(?:eq|neq|gt|gte|lt|lte|like|ilike|is|in|contains|order)\(\s*'([a-z0-9_]+)'/gi)) cols.add(s[1]);
    for (const s of seg.matchAll(/onConflict:\s*'([^']+)'/g)) s[1].split(',').forEach((c) => cols.add(c.trim()));
    pares.push({ tabla, cols: [...cols] });
  }
  for (const m of src.matchAll(/\.rpc\(\s*'([a-z0-9_]+)'/gi)) rpcs.push(m[1]);
  return { pares, rpcs, dinamicas, embedsFuera };
}


/** ────────────────────────────────────────────────────────────────────
 *  ⚰️ LAS RETIRADAS — cada una con su lápida. Re-vigilar un muerto es el
 *  desperdicio que este registro existe para evitar; borrarlo sin lápida
 *  es cómo se lo re-vigila en tres sesiones.
 *
 *  ⚰️ P1 (D-651) «solo el titular llega al portal del prestador»
 *  S75 → S87 (nace al registro) → RETIRADA S88, POR CURA DEL MUNDO.
 *  Su vida entera fue correcta: nació midiendo 5 personas reales contra
 *  un comentario que juraba cero, ANUNCIÓ el movimiento (5→7) sin que
 *  nadie fuera a mirar, y murió cuando la casa hizo lo que el rojo
 *  pedía — D-660/§4ter volvieron INTENCIONAL la llegada del no-titular
 *  (gestión por `user_gestiona_prestador`, pantallas del lote D-651,
 *  gate del founder), y C reescribió SIETE de los ocho sitios como
 *  LÁPIDAS («⭐ ACÁ DECÍA…»). Las 7 personas que hoy llegan por vínculo
 *  ya no son una premisa caducada: son el diseño. **El eje que queda
 *  vigilado no desaparece — se MUDÓ a P2** (los caminos del rol curados
 *  por el helper y su límite intacto): P1 vigilaba que nadie llegara
 *  sin diseño; P2 vigila que el diseño no se pudra.
 *  A lo escribió en el acta y queda acá porque es la tesis del
 *  instrumento: *el censo de regresión es el único de la casa que se
 *  pone rojo cuando el mundo mejora* — y en el cierre de S88 volvió a
 *  verde POR LAS CURAS, no por ablandarse.
 *  ⚠️ RESIDUO DECLARADO, con dueño: `apps/prestador/src/i18n/es.ts:66`
 *  es el ÚNICO de los ocho que C no reescribió — la voz «Tu acceso al
 *  día a día todavía no está disponible» y su comentario «rama inerte
 *  hoy, muere cuando la puerta abra» siguen como en S75, y la puerta
 *  abrió. Hallazgo entregado a C (S89) → **CURADO S89-C**: la voz dice
 *  el caso real (falta que el NEGOCIO esté activo, no la app), el octavo
 *  sitio ganó su lápida, y la EXENTA que vivía abajo se retiró con él.
 *  ──────────────────────────────────────────────────────────────────── */

/** LAS PREMISAS VIGILADAS. Cada una: qué declara · dónde lo declara ·
 *  contra qué se mide · qué pasa si caduca. */
export const PREMISAS = [
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
    /** SIN SITIOS DESDE EL CIERRE S88: el único («**Hoy es inerte**» en
     *  mascotas.tsx) fue CURADO por S88-C con lápida propia — «⏪ ACÁ
     *  DECÍA… CADUCÓ EL 5-AGO» — exactamente lo que este brazo vigilaba
     *  que pasara. La lápida queda clasificada como EXENTA abajo. */
    sitios: [],
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
    ficha: 'L-141 · cura P3 S89-A',
    titulo: 'el canon declara el COMANDO del contador de migraciones, y ningún número congelado volvió',
    desde: 'S89 (la cura: a la CUARTA caída — 9 → 77 → 138 → 186 — el canon dejó de escribir el número)',
    /** LA PREMISA CAMBIÓ DE FORMA CON LA CURA (S89-A, orden 3-bis ②): el
     *  canon ya no declara un número — declara los COMANDOS con que se
     *  mide (local y remoto). Lo que puede decaer ahora es OTRA cosa, y
     *  es lo que este guard vigila: (a) que la fila de inventario siga
     *  declarando los comandos, y (b) que ningún «**N migraciones**
     *  aplicadas…» resucite — la recaída natural de quien edita el canon
     *  de memoria. El ancla es la frase estable de la fila nueva. */
    sitios: [
      {
        archivo: 'CLAUDE.md',
        literal: 'El contador de migraciones NO SE ESCRIBE ACÁ',
        consecuencia:
          'la fila de inventario de `supabase/` — la que toda sesión lee al abrir; con la cura S89, su verdad es el COMANDO, no un número',
      },
    ],
    inerteMientras: {
      explicacion: 'la fila de inventario dejó de declarar los comandos, o un número congelado resucitó',
      /** YA NO SE COMPARA NÚMERO CONTRA HISTORIAL — no hay número que
       *  comparar: ésa ES la cura. (El razonamiento viejo sobre pistas
       *  atrasadas vs `origin/main` queda en el historial de git de este
       *  archivo; la clase de fallo que cubría murió con el número.) */
      medir: ({ dbQuery, leer }) => {
        void dbQuery;
        const canon = leer('CLAUDE.md');
        const detalle = [];
        let n = 0;
        if (!canon.includes('ls supabase/migrations/*.sql')) {
          n++; detalle.push({ falta: 'el comando LOCAL en la fila de inventario' });
        }
        if (!canon.includes('migration list --linked')) {
          n++; detalle.push({ falta: 'el comando REMOTO en la fila de inventario' });
        }
        // la recaída: alguien vuelve a escribir «**N migraciones** aplicadas y en el historial remoto»
        const resucitado = canon.match(/\*\*\d+ migraciones\*\* aplicadas y en el historial remoto/g);
        if (resucitado) {
          n += resucitado.length; detalle.push({ numero_congelado_resucitado: resucitado });
        }
        return { n, detalle };
      },
    },
    siCaduca:
      'toda sesión que abra leyendo el canon arranca con un inventario falso — el contador decayó CUATRO veces antes de que la cura le quitara el número a la prosa',
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

  {
    id: 'P5',
    ficha: 'S88-B (relevamiento 2026-08-05-s88b-RELEVAMIENTO-p5-bundle-vs-schema.md)',
    titulo: 'ningún bundle servido consulta un objeto que el schema vivo ya no tiene',
    desde: 'S88 (adjudicada por mesa sobre el caso vivo de preferencias)',
    /** LA LETRA DEL ENCUADRE (firma de mesa): `verify-ota` prueba que el
     *  update SE SIRVE; **P5 prueba que lo servido no consulta
     *  FANTASMAS.** Son las dos mitades del mismo paso ⓪.
     *
     *  EL HALLAZGO DE FORMA QUE RIGE: se mide contra el SCHEMA VIVO,
     *  jamás contra las migraciones posteriores — una tabla RECREADA con
     *  el mismo nombre y otro contrato pasa verde en un análisis de DDL
     *  y rompe una pantalla igual (el caso fundante: la migración
     *  `20260805000000` movió `user_notificacion_prefs` a `_legacy` y
     *  creó una nueva sin `tipo`; el bundle S86 anclado en `9e83b6d`
     *  seguía pidiendo `select('tipo, habilitada')` → 400 en producción).
     *
     *  EL ANCLA SE LEE DE `update:view` (gitCommitHash) — JAMÁS del
     *  `--message` (método §2-⑤: la etiqueta la redacta una persona; el
     *  hash es el hecho). Sin hash ⇒ sin-medir, ROJO (L-197).
     *
     *  ALCANCE v1 (escrito, no curado — adjudicación de mesa): el
     *  extractor de arriba con sus tres límites declarados; los aparatos
     *  con bundle descargado-sin-aplicar (D-650) quedan FUERA — esto
     *  mide las CABEZAS servidas por runtime, no lo que cada teléfono
     *  todavía corre. */
    sitios: [],
    alcance: {
      texto:
        'v1: literales de packages/api del ancla (embeds y strings dinámicos FUERA, contados) · cabezas servidas del canal preview por runtime · D-650 fuera de alcance',
    },
    inerteMientras: {
      explicacion:
        'pares (tabla·columna) y RPCs que un bundle servido consulta y el schema vivo ya no tiene',
      medir: ({ dbQuery, exec, leer }) => {
        void leer;
        const APPS = ['cliente', 'prestador'];
        const porAncla = new Map(); // sha → { apps:[], runtimes:[] }

        for (const app of APPS) {
          const lista = JSON.parse(
            exec(`npx eas-cli update:list --branch preview --limit 10 --json --non-interactive`, { cwd: `apps/${app}` }),
          );
          const cabezas = new Map(); // runtime → group (la más nueva)
          for (const u of lista.currentPage ?? []) {
            if (!cabezas.has(u.runtimeVersion)) cabezas.set(u.runtimeVersion, u.group);
          }
          if (cabezas.size === 0) throw new Error(`${app}: update:list no devolvió cabezas — no se puede medir`);
          for (const [rt, group] of cabezas) {
            const vista = JSON.parse(exec(`npx eas-cli update:view ${group} --json`, { cwd: `apps/${app}` }));
            const hash = (Array.isArray(vista) ? vista[0] : vista)?.gitCommitHash;
            if (!hash) throw new Error(`${app} ${group.slice(0, 8)}: sin gitCommitHash — el ancla no se lee del message (L-197)`);
            const e = porAncla.get(hash) ?? { apps: new Set(), runtimes: new Set() };
            e.apps.add(app); e.runtimes.add(rt);
            porAncla.set(hash, e);
          }
        }

        // ── extraer qué consulta cada ancla (el corpus es CHICO por la
        //    puerta única: solo packages/api)
        let totalPares = 0, totalDinamicas = 0, totalEmbeds = 0;
        const faltantes = [];
        for (const [sha, quien] of porAncla) {
          const archivos = exec(`git grep -l "\\.from('" ${sha} -- packages/api/src`, {})
            .trim().split('\n').filter(Boolean).map((l) => l.replace(`${sha}:`, ''));
          const rpcArchivos = exec(`git grep -l "\\.rpc('" ${sha} -- packages/api/src || true`, {})
            .trim().split('\n').filter(Boolean).map((l) => l.replace(`${sha}:`, ''));
          const tablas = new Map(); // tabla → Set cols
          const rpcs = new Set();
          for (const f of new Set([...archivos, ...rpcArchivos])) {
            const src = exec(`git show ${sha}:${f}`, {});
            const r = extraerConsultasDeFuente(src);
            totalDinamicas += r.dinamicas;
            totalEmbeds += r.embedsFuera;
            for (const p of r.pares) {
              const s = tablas.get(p.tabla) ?? new Set();
              p.cols.forEach((c) => s.add(c));
              tablas.set(p.tabla, s);
            }
            r.rpcs.forEach((x) => rpcs.add(x));
          }
          if (tablas.size === 0 && rpcs.size === 0)
            throw new Error(`ancla ${sha.slice(0, 8)}: el extractor no encontró NINGUNA consulta — 0 no es verde (L-192)`);

          const listaTablas = [...tablas.keys()].map((t) => `'${t}'`).join(',');
          const vivas = new Map();
          for (const row of dbQuery(
            `select table_name, column_name from information_schema.columns where table_schema='public' and table_name in (${listaTablas})`,
          )) {
            const s = vivas.get(row.table_name) ?? new Set();
            s.add(row.column_name);
            vivas.set(row.table_name, s);
          }
          const etiqueta = `${sha.slice(0, 8)} (${[...quien.apps].join('+')} · rt ${[...quien.runtimes].join(',')})`;
          for (const [tabla, cols] of tablas) {
            totalPares += cols.size;
            const cv = vivas.get(tabla);
            if (!cv) { faltantes.push({ bundle: etiqueta, tabla, falta: 'LA TABLA ENTERA' }); continue; }
            for (const c of cols) if (!cv.has(c)) faltantes.push({ bundle: etiqueta, tabla, falta: c });
          }
          if (rpcs.size > 0) {
            const listaRpcs = [...rpcs].map((r) => `'${r}'`).join(',');
            const vivasRpc = new Set(
              dbQuery(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in (${listaRpcs})`).map((r) => r.proname),
            );
            for (const r of rpcs) if (!vivasRpc.has(r)) faltantes.push({ bundle: etiqueta, rpc: r, falta: 'LA FUNCIÓN' });
          }
        }
        return {
          n: faltantes.length,
          detalle: [
            { anclas: porAncla.size, pares_verificados: totalPares, dinamicas_fuera_de_alcance: totalDinamicas, embeds_fuera_de_alcance: totalEmbeds },
            ...faltantes,
          ],
        };
      },
    },
    siCaduca:
      'una pantalla del bundle servido recibe 400 en producción SIN que nada se ponga rojo — el publish sale verde, verify-ota sale verde, y el aparato pregunta por un fantasma. El caso fundante: preferencias del cliente, bundle 9e83b6d pidiendo `tipo`',
  },
  {
    id: 'P6',
    ficha: 'S89-C (mapa de destinos del prestador §4 — depósito a A, sumada por orden de mesa S89)',
    titulo: 'la firma S88 del ocultamiento de plata rige en el catálogo (saldo_pagado jamás con audiencia de prestador)',
    desde: 'S89 (par medido por C: saldo_pagado∩prestador|ambas = 0 · salud_seguridad = 2)',
    /** LA DERIVACIÓN QUE SE VIGILA: «saldo_pagado NO se muestra al
     *  prestador» (firma de mesa S88) hoy se cumple porque NINGÚN tipo de
     *  esa categoría tiene audiencia `prestador|ambas` — se cumple por
     *  FILA AUSENTE, no por un gate. El único camino silencioso para
     *  romper la firma es que un tipo nazca con esa audiencia, y eso no
     *  lo ve ningún typecheck. Es la forma count(*)=0 exacta del censo.
     *  El contra-caso viaja adentro (par de C): la MISMA consulta sobre
     *  `salud_seguridad` da 2 — si diera 0, el instrumento dejó de
     *  distinguir y esto lanza (L-197: ROJO, jamás verde de consuelo). */
    sitios: [],
    inerteMientras: {
      explicacion: 'tipos ACTIVOS de la categoría saldo_pagado con audiencia prestador|ambas',
      medir: ({ dbQuery }) => {
        const n = dbQuery(
          "select count(*)::int as n from cat_notificacion_tipos where categoria = 'saldo_pagado' and audiencia in ('prestador','ambas') and activo",
        )[0].n;
        const par = dbQuery(
          "select count(*)::int as n from cat_notificacion_tipos where categoria = 'salud_seguridad' and audiencia in ('prestador','ambas') and activo",
        )[0].n;
        if (par === 0)
          throw new Error(
            'el contra-caso salud_seguridad dio 0 — el instrumento dejó de distinguir (esperaba > 0; ¿cambió el catálogo de categorías?)',
          );
        return { n, detalle: [{ saldo_pagado_prestador_o_ambas: n, contra_caso_salud_seguridad: par }] };
      },
    },
    siCaduca:
      'la plata del negocio le suena a quien atiende — la firma S88 se rompe por el catálogo sin que ningún gate lo vea (la campana y el correo obedecen la audiencia sin preguntar)',
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
  /** LAS LÁPIDAS DE S87-C/S88-C (cierre S88): la palabra «inerte» vive
   *  acá SOLO como CITA del texto muerto — «ACÁ DECÍA…». Una lápida no
   *  es una premisa: es la prueba de que la premisa se curó. Se eximen
   *  POR SITIO, como todo en esta lista. */
  { archivo: 'apps/prestador/src/app/(tabs)/_layout.tsx', literal: 'ACÁ DECÍA «Hoy inerte', razon: 'lápida S87-C — cita del muerto de P1' },
  { archivo: 'apps/prestador/src/app/(tabs)/_layout.tsx', literal: 'ACÁ DECÍA: «INERTE hoy', razon: 'lápida S87-C — cita del muerto de P1 (la barra de tres)' },
  { archivo: 'apps/prestador/src/app/(tabs)/negocio.tsx', literal: 'ACÁ DECÍA «inerte hasta la puerta', razon: 'lápida S87-C — cita del muerto de P1' },
  { archivo: 'apps/prestador/src/app/paseo/taller.tsx', literal: 'ACÁ DECÍA «inerte hasta la puerta', razon: 'lápida S87-C — cita del muerto de P1' },
  { archivo: 'apps/prestador/src/app/grooming/taller.tsx', literal: 'ACÁ DECÍA «inerte hasta la puerta', razon: 'lápida S87-C — cita del muerto de P1' },
  { archivo: 'apps/prestador/src/app/veterinaria/taller.tsx', literal: 'ACÁ DECÍA «inerte hasta la puerta', razon: 'lápida S87-C — cita del muerto de P1' },
  { archivo: 'apps/prestador/src/app/adiestramiento/taller.tsx', literal: 'ACÁ DECÍA «inerte hasta la puerta', razon: 'lápida S87-C — cita del muerto de P1' },
  { archivo: 'apps/prestador/src/app/(tabs)/mascotas.tsx', literal: 'ACÁ DECÍA «Hoy es inerte', razon: 'lápida S88-C — la cura del sitio de P2, con su porqué adentro (CADUCÓ EL 5-AGO)' },
  /** ⚰️ EL RESIDUO DE P1, CURADO (S89-C): acá vivía la exención de
   *  `es.ts` («rama inerte hoy» — prosa vencida con dueño). C la curó en
   *  S89: la voz dice el caso real (lo que falta es el NEGOCIO activo,
   *  no la app) y la lápida se escribió SIN la palabra vigilada a
   *  propósito — por eso esta entrada se RETIRA en vez de mutar. */
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
