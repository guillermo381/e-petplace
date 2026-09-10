// ============================================================================
// despachar-whatsapp — EL TRANSPORTE, EN MODO SOMBRA (S91-A)
// ============================================================================
// GEMELO de `despachar-push`, y gemelo A PROPÓSITO: la DB decide TODO (gates
// de §5, kill switch, techo, consentimiento) y esta función solo entrega y
// trae la verdad de vuelta. Si una fila no llega acá, es porque un gate la
// cortó y eso ya está escrito en su `resuelto_como`.
//
// ── NACE APAGADO, Y NO ES UN BORRADOR ──────────────────────────────────────
// **Sin credencial corre ENTERO, reporta `habria_entregado` y NO MANDA NADA.**
// Eso no es una versión incompleta: es la forma que la LEY DE SECUENCIA de
// `MODELO_NOTIFICACIONES` §0ter exige — lector → pieza → gate → flip, y **el
// flip de `transporte_vivo` es el ÚLTIMO acto**, con go del founder y
// destinatario de prueba propio. Push se abrió así y fue el primer canal que
// la casa abrió entero.
//
// ── LO QUE ESTA FUNCIÓN **NO** HACE, y cada «no» tiene su porqué ───────────
//   · **No marca filas en modo sombra.** Una fila tocada acá sería una
//     mentira sobre una entrega que no ocurrió.
//   · **No decide a quién escribirle.** El consentimiento con evidencia ya
//     existe desde S88-D (superficie + evidencia + guard
//     `opt_in_sin_evidencia`); acá se confía en el `resuelto_como` de la DB.
//   · **No compone texto libre.** WhatsApp utility se manda POR PLANTILLA
//     aprobada; el cuerpo lo define Meta, no nosotros.
//   · **No normaliza teléfonos.** Ver el bloque E.164 más abajo: eso es del
//     MOTOR, y meterlo acá sería la enésima superficie con su propia versión.
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ── LOS SECRETS QUE ESTA FUNCIÓN LEE ───────────────────────────────────────
// Mismo patrón que FCM en S90: los carga el FOUNDER como secrets de Supabase.
// JAMÁS al repo, jamás por chat. Los tres nombres son contrato:
//   META_WHATSAPP_TOKEN   · el token de acceso (System User, larga duración)
//   META_WABA_ID          · la WhatsApp Business Account
//   META_PHONE_NUMBER_ID  · el número remitente
const TOKEN = 'META_WHATSAPP_TOKEN';
const WABA = 'META_WABA_ID';
const PHONE = 'META_PHONE_NUMBER_ID';

/** E.164 estricto: `+` y 8..15 dígitos, el primero distinto de 0.
 *  Se VALIDA acá y no se ARREGLA: arreglar un teléfono en el transporte es
 *  inventar el país de alguien, y eso lo prohíbe P21 (el teléfono no implica
 *  país). Un número que no cumple **se saltea diciendo por qué**. */
function esE164(t: string | null | undefined): boolean {
  return typeof t === 'string' && /^\+[1-9][0-9]{7,14}$/.test(t);
}

/**
 * EL GUARD DEL DESPACHO (S92-BIS · D-713) — gemelo del de `despachar-push`.
 *
 * Medido el 9-ago-2026: un `POST` sin ninguna credencial devolvía **200** y
 * procesaba la cola. Acá el daño potencial es menor porque **WhatsApp está
 * congelado** (`transporte_vivo=false`, cola en 0, y el token cargado no es de
 * Meta) — pero el día que se descongele, la puerta ya está cerrada. *Curar lo
 * que hoy no muerde, mientras no muerde, es la única vez que sale barato.*
 *
 * El secreto vive en los secrets de la function; **no viaja en ningún bundle**
 * porque a esta función la llama la base o una mano, nunca la app.
 */
function guardDespacho(req: Request): Response | null {
  const esperado = Deno.env.get('DESPACHO_SECRET');
  if (!esperado) {
    return Response.json({ error: 'despacho_sin_secreto_configurado' }, { status: 500 });
  }
  const dado = req.headers.get('x-despacho-secret');
  if (dado !== esperado) {
    return Response.json({ error: 'despacho_no_autorizado' }, { status: 401 });
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'solo_post' }, { status: 405 });
  }

  const rechazo = guardDespacho(req);
  if (rechazo) return rechazo;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ① Lo que la DB YA marcó para transporte por WhatsApp.
  // S114 multicanal: la cola es la tabla de ENTREGAS (una intención, N canales);
  // este edge ve las de 'whatsapp'. Se aplana a la forma de siempre + `entregaId`,
  // así el resto del código no cambia y sólo el MARCADO apunta a la entrega.
  const { data: pendientesRaw, error: errorSel } = await supabase
    .from('notificacion_entrega')
    .select('id, notificacion_intencion!inner(id, tipo, destinatario_user_id, datos, resuelto_como)')
    .eq('canal', 'whatsapp')
    .eq('estado', 'encolada')
    .limit(50);
  if (errorSel) {
    return Response.json({ error: 'lectura_fallo', causa: errorSel.message }, { status: 500 });
  }
  const pendientes = (pendientesRaw ?? []).map((e) => {
    const n = (e as { notificacion_intencion: Record<string, unknown> }).notificacion_intencion;
    return { entregaId: (e as { id: string }).id, ...n } as Record<string, unknown> & { entregaId: string; id: string; destinatario_user_id: string };
  });

  // ② El destinatario: su teléfono. Se mide la FORMA antes de intentar nada,
  //    porque un lote donde la mitad de los números no son E.164 tiene que
  //    poder decirlo en modo sombra — es justamente lo que el founder
  //    necesita saber ANTES de encender.
  const uids = [...new Set((pendientes ?? []).map((i) => i.destinatario_user_id).filter(Boolean))];
  const telPorUid = new Map<string, string | null>();
  if (uids.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, telefono')
      .in('id', uids as string[]);
    for (const p of perfiles ?? []) telPorUid.set(p.id, p.telefono ?? null);
  }

  let sinTelefono = 0;
  let telefonoNoE164 = 0;
  let entregables = 0;
  for (const i of pendientes ?? []) {
    const t = telPorUid.get(i.destinatario_user_id as string) ?? null;
    if (!t) sinTelefono++;
    else if (!esE164(t)) telefonoNoE164++;
    else entregables++;
  }

  const token = Deno.env.get(TOKEN);
  const waba = Deno.env.get(WABA);
  const phoneId = Deno.env.get(PHONE);

  // ── MODO VERIFICAR (`?verificar=1`) — LEE Meta, NO MANDA NADA ─────────────
  // Nace porque la credencial llegó y recién ahora «las plantillas están
  // aprobadas» es una afirmación VERIFICABLE contra el objeto en vez de una
  // palabra. Es todo GET: pide las plantillas y el estado del número.
  // *Existe separado del despacho a propósito: un diagnóstico que comparte
  // camino con un envío es un diagnóstico que algún día manda algo.*
  if (new URL(req.url).searchParams.get('verificar') === '1') {
    if (!token || !waba || !phoneId) {
      return Response.json({
        modo: 'verificar',
        error: 'sin_credencial',
        secrets_faltantes: [!token ? TOKEN : null, !waba ? WABA : null, !phoneId ? PHONE : null]
          .filter(Boolean),
      });
    }
    // ── FORMA del token, JAMÁS su valor ──────────────────────────────────
    // Meta contesta «Cannot parse access token» para varias causas distintas
    // —truncado, con comillas, con salto de línea, o directamente OTRO dato
    // pegado en el campo—. Ninguna se distingue del mensaje. Se reportan
    // METADATOS de forma (largo, prefijo, espacios, comillas): alcanza para
    // decirle al founder QUÉ arreglar y **no revela un solo carácter del
    // secreto**. *Un diagnóstico que exige pegar el valor en un chat para
    // entenderlo es un diagnóstico que filtra credenciales.*
    const forma = {
      largo: token.length,
      // Los tokens de System User de Meta empiezan con «EAA».
      empieza_con_EAA: token.startsWith('EAA'),
      tiene_espacios: /\s/.test(token),
      tiene_comillas: /["']/.test(token),
      tiene_salto: /[\r\n]/.test(token),
      // Si alguien pegó el WABA_ID o el PHONE_NUMBER_ID en el campo del token,
      // el valor es todo dígitos y corto — se caza sin verlo.
      parece_un_id_numerico: /^[0-9]{5,20}$/.test(token),
    };
    const cab = { Authorization: `Bearer ${token}` };

    /* ── ¿QUÉ PUEDE ESTE TOKEN? — `/debug_token`, y también es GET ──────────
       🔴 NACE PORQUE EL DIAGNÓSTICO CONTESTABA UNA PREGUNTA DISTINTA DE LA QUE
       SE LE CREÍA HECHA. Leer plantillas prueba `…_management` y NADA MÁS:
       `…_messaging` es el permiso de ENVIAR, y este modo no manda a propósito.
       ⇒ un token CON management y SIN messaging daba **verde entero** —
       plantillas y número leídos— **y el primer envío real fallaba.**
       *Mientras el token estuvo roto, el 401 tapaba todo y no había verde
       posible; el día que el token sirve, el hueco pasa a hacer daño.*

       Y `granular_scopes` resuelve de paso la OTRA pregunta cara: trae los
       `target_ids` por permiso, o sea **a QUÉ WABA da acceso este token**.
       *Sin eso, «¿estamos apuntando al WABA correcto?» sólo se puede
       responder por descarte —cero plantillas— y **cero es ambiguo**: puede
       ser el WABA vacío, el WABA equivocado, o un id que no existe.* */
    const rD = await fetch(
      `https://graph.facebook.com/v21.0/debug_token` +
        `?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`,
      { headers: cab },
    );
    const cD = await rD.json().catch(() => ({}));
    const dat = (cD?.data ?? {}) as Record<string, unknown>;
    const scopes: string[] = Array.isArray(dat.scopes) ? dat.scopes as string[] : [];
    const granular = Array.isArray(dat.granular_scopes) ? dat.granular_scopes as Array<
      { scope?: string; target_ids?: string[] }> : [];
    /* Los dos que el founder necesita, dichos por nombre y no por conteo:
       un «2 de 2» no dice CUÁLES, y son permisos distintos con consecuencias
       distintas. */
    const permisos = {
      whatsapp_business_messaging: scopes.includes('whatsapp_business_messaging'),
      whatsapp_business_management: scopes.includes('whatsapp_business_management'),
    };
    /* Los WABA que el token alcanza, con su número — para que elegir el
       correcto sea LEER y no adivinar. Tope 5: es un diagnóstico, no un censo. */
    const idsWaba = [...new Set(granular.flatMap((g) => g.target_ids ?? []))].slice(0, 5);
    const wabaAlcanzables = [];
    for (const id of idsWaba) {
      const rW = await fetch(
        `https://graph.facebook.com/v21.0/${id}?fields=name,timezone_id,messaging_limit_tier`, { headers: cab });
      const cW = await rW.json().catch(() => ({}));
      const rN = await fetch(
        `https://graph.facebook.com/v21.0/${id}/phone_numbers` +
          `?fields=id,display_phone_number,verified_name&limit=5`, { headers: cab });
      const cN = await rN.json().catch(() => ({}));
      /* 🔴 ¿Pudimos ENUMERAR los números de este WABA? Un fetch que falló y una
         lista vacía NO son «no coincide»: son «no sé». Se guarda aparte para que
         par_coherente no confunda una lista que no se llenó con una que no tiene
         el número (founder, 8-sep). */
      const numerosEnumeradosOk = rN.ok && Array.isArray(cN?.data);
      const numeroIds: string[] = numerosEnumeradosOk
        ? (cN.data as Record<string, unknown>[]).map((n) => String(n.id ?? '')).filter(Boolean)
        : [];
      wabaAlcanzables.push({
        id,
        name: cW?.name ?? null,
        /* 🔴 S114-A (pedido de E): el TECHO de mensajería del WABA. Entre 1K y 2K
           hay ~USD 22,60/día de diferencia, y 2.000 no es un tier estándar de
           Meta — hay que LEERLO, no suponerlo. Se lee del WABA configurado. */
        messaging_limit_tier: (cW as Record<string, unknown>)?.messaging_limit_tier ?? null,
        numeros_enumerados_ok: numerosEnumeradosOk,
        numero_ids: numeroIds,
        /* 🔴 El discriminador que el founder pidió, y sale del DATO:
           el prefijo del número dice el país. `+593` es Ecuador, `+1` no. */
        numeros: Array.isArray(cN?.data)
          ? cN.data.map((n: Record<string, unknown>) => ({
              display_phone_number: n.display_phone_number ?? null,
              verified_name: n.verified_name ?? null,
              es_ecuador: String(n.display_phone_number ?? '').replace(/\s/g, '').startsWith('+593'),
            }))
          : [],
        /* ¿Es ESTE el que tenemos configurado? Comparación contra el secreto,
           sin imprimir el secreto: el id ya viaja porque lo devolvió Meta. */
        es_el_configurado: id === waba,
      });
    }

    const rT = await fetch(
      /* 🔴 `components` — SIN ESTE CAMPO NO HAY VARIABLES `{{n}}`, y el mapeo
         no se puede escribir. *El diagnóstico traía nombre, idioma, categoría y
         estado: alcanzaba para decir «están aprobadas» y no para USARLAS.* */
      `https://graph.facebook.com/v21.0/${waba}/message_templates` +
        `?fields=name,language,category,status,quality_score,components&limit=50`,
      { headers: cab },
    );
    const cT = await rT.json().catch(() => ({}));
    const rP = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}` +
        `?fields=verified_name,code_verification_status,quality_rating,display_phone_number,platform_type`,
      { headers: cab },
    );
    const cP = await rP.json().catch(() => ({}));

    const plantillas = Array.isArray(cT?.data)
      ? cT.data.map((t: Record<string, unknown>) => {
          /* Las variables `{{n}}` viven adentro del texto de cada component.
             Se extraen acá y no en el consumidor: **el mapeo se escribe contra
             ESTA lista**, y una lista que hay que volver a parsear en cada
             lector es una lista que algún día se parsea distinto. */
          const comps = Array.isArray(t.components) ? t.components as Array<
            Record<string, unknown>> : [];
          const vars = new Set<string>();
          for (const c of comps) {
            for (const m of String(c.text ?? '').matchAll(/\{\{(\w+)\}\}/g)) vars.add(m[1]);
          }
          /* 🔴 Y LAS MISMAS VARIABLES, PERO **POR COMPONENTE** — sin esto el
             mapeo NO SE PUEDE ESCRIBIR, y peor: se puede escribir MAL.
             En la API de Meta cada component lleva su propio array de
             `parameters`, y la numeración `{{1}}` **se reinicia en cada uno**:
             el `{{1}}` del HEADER y el `{{1}}` del BODY son datos DISTINTOS que
             viajan en listas distintas. *Un set unificado los funde en una sola
             entrada y produce un mapeo que typechequea, se ve completo, y manda
             el nombre de la familia en el lugar de la fecha.* */
          const variablesPorComponente = comps
            .map((c) => ({
              tipo: String(c.type ?? '?'),
              /* Los BUTTONS de tipo URL llevan su variable en `url`, no en
                 `text` — se mira donde puede estar, no donde suele estar. */
              variables: [...new Set([
                ...String(c.text ?? '').matchAll(/\{\{(\w+)\}\}/g),
                ...String(c.url ?? '').matchAll(/\{\{(\w+)\}\}/g),
              ].map((m) => m[1]))],
            }))
            .filter((c) => c.variables.length > 0);
          return {
            name: t.name,
            language: t.language,
            category: t.category,
            status: t.status,
            /* Qué piezas trae (HEADER/BODY/FOOTER/BUTTONS) y **cuántas
               variables espera cada plantilla**: es lo que el mapeo necesita. */
            componentes: comps.map((c) => String(c.type ?? '?')),
            /* ⚠️ `variables` es el conjunto UNIFICADO: sirve para contar de un
               vistazo, **jamás para escribir el mapeo** — para eso está
               `variables_por_componente`. */
            variables: [...vars].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
            variables_por_componente: variablesPorComponente,
            /* El texto de CADA componente, no sólo el del BODY: el HEADER es
               donde suele ir el dato que la familia ve primero. */
            textos: comps.map((c) => ({
              tipo: String(c.type ?? '?'),
              texto: String(c.text ?? '').slice(0, 300),
            })).filter((c) => c.texto),
            /* El texto del BODY, que es donde vive el mensaje que la familia
               lee. Se recorta: el diagnóstico es para decidir, no para
               archivar. */
            body: String(comps.find((c) => c.type === 'BODY')?.text ?? '').slice(0, 400),
          };
        })
      : [];
    // El número que decide la tarea del founder: cuántas están en MARKETING
    // cuando deberían ser UTILITY (precio, ventana y riesgo de pausa).
    const enMarketing = plantillas.filter((t) => t.category === 'MARKETING').length;
    const enUtility = plantillas.filter((t) => t.category === 'UTILITY').length;
    const aprobadas = plantillas.filter((t) => t.status === 'APPROVED').length;

    /* 🔴 EL PAR — ¿el WABA del que LEEMOS plantillas es dueño del número desde
       el que ENVIAMOS? (pedido de E, firma founder 8-sep). TRISTATE, no boolean:
       un includes() sobre lista vacía da false SIEMPRE, y eso haría publicar
       «apuntan a cuentas distintas» sobre una lista que nunca se llenó. Se
       distingue «no pude enumerar» (null) de «enumeré y el número no está» (false).
         · null  → no se puede concluir (waba configurado no alcanzable, o no se
                   pudieron enumerar sus números): NO afirmar incoherencia.
         · true  → el número configurado ESTÁ entre los del WABA configurado.
         · false → se enumeraron números y el configurado NO está: cuentas distintas. */
    /* 🔴 EL WABA CONFIGURADO, DIRECTO — NO por el `for` sobre waba_alcanzables
       (L-318, corrección de E): un token de usuario de sistema puede no listar
       `target_ids` en sus scopes granulares, así que ese array vuelve VACÍO y
       todo lo que colgaba del bucle no corría nunca. Pero el configurado SÍ es
       alcanzable directo: `/{waba}/message_templates` responde 200 con las 10
       plantillas (http_plantillas abajo). De ACÁ salen el techo y el par. */
    const rWConf = await fetch(
      `https://graph.facebook.com/v21.0/${waba}?fields=name,messaging_limit_tier`, { headers: cab });
    const cWConf = await rWConf.json().catch(() => ({})) as Record<string, unknown>;
    /* 🔴 EL TIER vive en el NÚMERO, no en el WABA (medición de E: el WABA devuelve
       null). Se lee de /{phoneId}; se deja el del WABA como fallback por si Meta
       lo mueve. Entre 1K y 2K hay ~USD 22,60/día. */
    const rTier = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}?fields=messaging_limit_tier`, { headers: cab });
    const cTier = await rTier.json().catch(() => ({})) as Record<string, unknown>;
    const messagingLimitTier = cTier?.messaging_limit_tier ?? cWConf?.messaging_limit_tier ?? null;

    const rNConf = await fetch(
      `https://graph.facebook.com/v21.0/${waba}/phone_numbers` +
        `?fields=id,display_phone_number,verified_name&limit=10`, { headers: cab });
    const cNConf = await rNConf.json().catch(() => ({}));
    const numerosConfOk = rNConf.ok && Array.isArray((cNConf as { data?: unknown })?.data);
    const numeroIdsConf: string[] = numerosConfOk
      ? ((cNConf as { data: Record<string, unknown>[] }).data).map((n) => String(n.id ?? '')).filter(Boolean)
      : [];

    // El par, computado sobre el fetch DIRECTO (no el bucle vacío). Tristate:
    // null = no se puede concluir · true/false = enumeré y (está / no está).
    let parCoherente: boolean | null;
    let parMotivo: string;
    if (!numerosConfOk) {
      parCoherente = null; parMotivo = 'no_se_pudieron_enumerar_los_numeros';
    } else if (numeroIdsConf.length === 0) {
      parCoherente = null; parMotivo = 'el_waba_no_declara_numeros';
    } else if (numeroIdsConf.includes(phoneId)) {
      parCoherente = true; parMotivo = 'el_numero_pertenece_al_waba_configurado';
    } else {
      parCoherente = false; parMotivo = 'el_numero_no_esta_en_el_waba_configurado';
    }

    return Response.json({
      modo: 'verificar',
      token_forma: forma,
      /* 🔴 LO PRIMERO QUE HAY QUE MIRAR, y va arriba a propósito: sin los dos
         permisos, todo lo de abajo puede verse bien y el envío fallar igual. */
      token_valido: dat.is_valid ?? null,
      permisos,
      permisos_completos: permisos.whatsapp_business_messaging
        && permisos.whatsapp_business_management,
      waba_alcanzables: wabaAlcanzables,
      /* ⚠️ El id configurado ¿está entre los que el token alcanza? Si es
         `false` con token válido, el problema NO es el token: es a qué
         apunta. *Es la diferencia entre «no puedo» y «estoy mirando otra
         cosa», y hasta ahora no se podía distinguir.* */
      // 🔴 alcanzable = el fetch DIRECTO al WABA configurado respondió (o sus
      // plantillas: rT). El idsWaba del bucle puede estar vacío por scopes.
      waba_configurado_alcanzable: rWConf.ok || rT.status === 200,
      /* 🔴 EL PAR, para el gate de E: true/false SÓLO cuando se pudo enumerar;
         null cuando no se puede concluir (lista vacía ≠ no coincide). */
      par_coherente: parCoherente,
      par_coherente_motivo: parMotivo,
      /* 🔴 EL TECHO del WABA configurado, leído directo (pedido de E; antes
         colgaba del bucle vacío y nunca corría). 1K vs 2K = ~USD 22,60/día. */
      messaging_limit_tier: messagingLimitTier,
      http_debug_token: rD.status,
      http_plantillas: rT.status,
      http_numero: rP.status,
      plantillas_total: plantillas.length,
      plantillas_aprobadas: aprobadas,
      plantillas_en_marketing: enMarketing,
      plantillas_en_utility: enUtility,
      plantillas,
      numero: {
        verified_name: cP?.verified_name ?? null,
        display_phone_number: cP?.display_phone_number ?? null,
        code_verification_status: cP?.code_verification_status ?? null,
        quality_rating: cP?.quality_rating ?? null,
        platform_type: cP?.platform_type ?? null,
      },
      error_plantillas: rT.ok ? null : String(cT?.error?.message ?? '').slice(0, 240),
      error_numero: rP.ok ? null : String(cP?.error?.message ?? '').slice(0, 240),
      // Los tres números del despacho viajan TAMBIÉN acá: el founder decide
      // el encendido con una sola lectura, no con dos llamadas.
      habria_entregado: entregables,
      encoladas: pendientes?.length ?? 0,
      sin_telefono: sinTelefono,
      telefono_no_e164: telefonoNoE164,
    });
  }

  if (!token || !waba || !phoneId) {
    // ═══ MODO SOMBRA — declarado, NO un fallo ═══════════════════════════════
    // Nada se entrega y NADA se marca. Y el reporte dice las TRES cosas que
    // el founder necesita para decidir el encendido: cuántas saldrían, cuántas
    // no pueden por falta de teléfono, y cuántas no pueden porque el teléfono
    // que hay no es E.164 (que es un problema NUESTRO, no del destinatario).
    return Response.json({
      modo: 'sin_transporte_todavia',
      nota:
        'Falta al menos uno de los secrets de Meta: nada se entrega ni se marca. ' +
        'Los nombres exactos que esta función lee están en su cabecera.',
      secrets_faltantes: [
        !token ? TOKEN : null,
        !waba ? WABA : null,
        !phoneId ? PHONE : null,
      ].filter(Boolean),
      habria_entregado: entregables,
      encoladas: pendientes?.length ?? 0,
      sin_telefono: sinTelefono,
      // ⚠️ Este número es el que importa antes de encender: un teléfono fuera
      // de E.164 es un mensaje que Meta rechaza, y la cura NO es de esta
      // función (ver E.164 abajo).
      telefono_no_e164: telefonoNoE164,
    });
  }

  // ═══ DE ACÁ PARA ABAJO: EL CAMINO VIVO, que todavía NO se ejecutó nunca ══
  // Se deja escrito y NO se declara probado. La ley de secuencia dice que el
  // flip es el último acto: cuando el founder cargue los secrets, la primera
  // corrida es una PRUEBA DIRIGIDA a un destinatario suyo, igual que push.
  const URL_META = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  let entregadas = 0;
  let fallidas = 0;
  let salteadas = 0;

  for (const i of pendientes ?? []) {
    const tel = telPorUid.get(i.destinatario_user_id as string) ?? null;

    // El teléfono inválido NO es una entrega fallida del destinatario: es un
    // dato nuestro que no sirve. Se saltea y se DICE, sin quemar la intención.
    if (!esE164(tel)) {
      salteadas++;
      continue;
    }

    // La plantilla la dice la DB (`resuelto_como`), jamás esta función: el
    // nombre y el idioma de la plantilla son dato de negocio aprobado por
    // Meta, y hardcodearlos acá sería la segunda verdad.
    const rc = i.resuelto_como as Record<string, unknown> | null;
    const plantilla = rc?.plantilla;
    const idioma = rc?.plantilla_idioma;
    if (typeof plantilla !== 'string' || typeof idioma !== 'string') {
      await supabase
        .from('notificacion_entrega')
        .update({ estado: 'fallida', motivo: 'sin_plantilla_resuelta', cerrado_en: new Date().toISOString() })
        .eq('id', i.entregaId);
      fallidas++;
      continue;
    }

    /* 🔴 EL ENSAMBLADO — las variables {{n}} se armaron en registrar_intencion y
       viven en resuelto_como. Si el ensamblado NO está completo, la intención
       REBOTA: NO se manda con un hueco. Meta acepta un mensaje mal armado sin
       quejarse y lo lee la familia (firma founder ③). Un tipo con plantilla pero
       sin variables ensambladas (p.ej. pedido_confirmado, que pide 5 y no tiene
       spec) cae acá — no se manda mudo. */
    const ensCOK = rc?.ensamblado_completo;
    const vars = Array.isArray(rc?.variables) ? rc.variables as Array<{ n: number; valor: string | null }> : null;
    if (ensCOK !== true || vars === null) {
      await supabase
        .from('notificacion_entrega')
        .update({ estado: 'fallida', motivo: `ensamblado_incompleto:${JSON.stringify(rc?.ensamblado_faltante ?? null)}`, cerrado_en: new Date().toISOString() })
        .eq('id', i.entregaId);
      fallidas++;
      continue;
    }
    // los parámetros del BODY, en orden {{1}}{{2}}{{3}}…
    const parametros = [...vars]
      .sort((a, b) => a.n - b.n)
      .map((v) => ({ type: 'text', text: String(v.valor) }));

    const res = await fetch(URL_META, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: tel,
        type: 'template',
        template: {
          name: plantilla,
          language: { code: idioma },
          components: [{ type: 'body', parameters: parametros }],
        },
      }),
    });

    if (res.ok) {
      // S114 · el wamid es la llave con que el webhook de estado (whatsapp-estado)
      // va a encontrar esta entrega para marcarla entregada_aparato/leida. Se guarda
      // en el ÉXITO. `cerrado_en` queda NULL: aceptada NO es el fin del ciclo en
      // WhatsApp (a diferencia de push/email) — lo cierra el webhook al confirmar.
      const okBody = await res.json().catch(() => ({} as Record<string, unknown>));
      const wamid = (okBody as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id ?? null;
      await supabase.from('notificacion_entrega')
        .update({ estado: 'aceptada_transporte', proveedor_msg_id: wamid }).eq('id', i.entregaId);
      await supabase.from('notificacion_intencion')
        .update({ estado: 'aceptada_transporte' }).eq('id', i.id).eq('estado', 'encolada');
      entregadas++;
    } else {
      const cuerpo = await res.text();
      // Igual que en push: un fallo de INFRAESTRUCTURA no se marca `fallida`
      // —quemaría la intención por una caída ajena—; solo los 4xx de negocio.
      if (res.status >= 500) {
        fallidas++; // se reintenta en el próximo tick, sin tocar la fila
        continue;
      }
      await supabase
        .from('notificacion_entrega')
        .update({ estado: 'fallida', motivo: cuerpo.slice(0, 300), cerrado_en: new Date().toISOString() })
        .eq('id', i.entregaId);
      fallidas++;
    }
  }

  return Response.json({
    modo: 'transporte_vivo',
    encoladas: pendientes?.length ?? 0,
    entregadas,
    fallidas,
    salteadas_telefono_invalido: salteadas,
  });
});
