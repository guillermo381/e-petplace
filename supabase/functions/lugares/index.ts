// lugares (S79-A2) — el proxy server-side de Google Places para las DOS
// capturas de dirección (la sede del prestador y el hogar del cliente).
// Patrón LITERAL de extract-vacuna / estructurar-nota-clinica: server-side,
// verify_jwt=true, key en Deno.env, errores tipados por status, cero
// fallback silencioso (regla 36).
//
// LAS LEYES (LETRA_PERFIL_S79 §2.2, firma founder — espejadas en el
// wrapper packages/api/src/wrappers/lugares.ts, que es EL contrato):
//   · `resolver` JAMÁS responde 200 sin lat/lon numéricos de Google —
//     sin location ⇒ 422 lugar_invalido (L-139: nada se inventa).
//   · La sesión CIERRA SIEMPRE con Place Details: el `sesion` token viaja
//     en ambas acciones y Google factura por sesión.
//   · Field mask MÍNIMO en Details: id, location, formattedAddress,
//     addressComponents (la ciudad sale de `locality`).
//
// La key vive en el secret GOOGLE_PLACES_API_KEY (la crea el founder —
// la consola de Google es suya, D-289). Sin secret ⇒ 503
// sin_configuracion: el preparado-apagado dice su nombre.
//
// Contrato:
//   POST { accion: 'buscar', texto, sesion, lat?, lon? }
//     200 → { predicciones: [{ place_id, texto_principal, texto_secundario }] }
//   POST { accion: 'resolver', place_id, sesion }
//     200 → { place_id, direccion, ciudad, lat, lon }
//   error → { codigo, mensaje } con status:
//     entrada_invalida   400 — body malformado
//     sin_configuracion  503 — falta GOOGLE_PLACES_API_KEY
//     lugar_invalido     422 — Google no trajo location/dirección
//     google_rechazo     502 — Places respondió no-200
//     red                502 — no se pudo alcanzar Places

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function error(status: number, codigo: string, mensaje: string): Response {
  return json(status, { codigo, mensaje });
}

type Componente = { longText?: string; types?: string[] };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return error(400, 'entrada_invalida', 'Solo POST.');
  }

  const key = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!key) {
    return error(503, 'sin_configuracion', 'GOOGLE_PLACES_API_KEY no está configurada en este entorno.');
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return error(400, 'entrada_invalida', 'El body debe ser JSON.');
  }

  const accion = body.accion;
  const sesion = typeof body.sesion === 'string' && body.sesion.length > 0 ? body.sesion : null;
  if (!sesion) return error(400, 'entrada_invalida', 'Falta el token de sesión.');

  // ── buscar: Autocomplete (New) ─────────────────────────────────────
  if (accion === 'buscar') {
    const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
    if (texto.length < 3) return json(200, { predicciones: [] });

    const lat = typeof body.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
    const lon = typeof body.lon === 'number' && Number.isFinite(body.lon) ? body.lon : null;

    const payload: Record<string, unknown> = {
      input: texto,
      sessionToken: sesion,
      languageCode: 'es',
    };
    if (lat !== null && lon !== null) {
      payload.locationBias = {
        circle: { center: { latitude: lat, longitude: lon }, radius: 50000 },
      };
    }

    let resp: Response;
    try {
      resp = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('[lugares] autocomplete fetch:', e instanceof Error ? e.message : e);
      return error(502, 'red', 'No se pudo alcanzar el buscador de direcciones.');
    }

    if (!resp.ok) {
      console.error('[lugares] autocomplete status', resp.status, await resp.text());
      return error(502, 'google_rechazo', `Places respondió ${resp.status}.`);
    }

    const data = await resp.json();
    const sugerencias = Array.isArray(data?.suggestions) ? data.suggestions : [];
    const predicciones = [];
    for (const s of sugerencias) {
      const p = s?.placePrediction;
      if (!p?.placeId) continue;
      predicciones.push({
        place_id: p.placeId,
        texto_principal: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        texto_secundario: p.structuredFormat?.secondaryText?.text ?? null,
      });
    }
    return json(200, { predicciones });
  }

  // ── resolver: Place Details — el cierre de la sesión ───────────────
  if (accion === 'resolver') {
    const placeId = typeof body.place_id === 'string' && body.place_id.length > 0 ? body.place_id : null;
    if (!placeId) return error(400, 'entrada_invalida', 'Falta place_id.');

    const url =
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
      `?languageCode=es&sessionToken=${encodeURIComponent(sesion)}`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': key,
          // field mask MÍNIMO — cada campo extra es plata y superficie.
          'X-Goog-FieldMask': 'id,location,formattedAddress,addressComponents',
        },
      });
    } catch (e) {
      console.error('[lugares] details fetch:', e instanceof Error ? e.message : e);
      return error(502, 'red', 'No se pudo alcanzar el buscador de direcciones.');
    }

    if (!resp.ok) {
      console.error('[lugares] details status', resp.status, await resp.text());
      return error(502, 'google_rechazo', `Places respondió ${resp.status}.`);
    }

    const data = await resp.json();
    const lat = data?.location?.latitude;
    const lon = data?.location?.longitude;
    const direccion = typeof data?.formattedAddress === 'string' ? data.formattedAddress.trim() : '';

    // LA LEY 1: sin coordenadas reales o sin dirección, NO hay 200.
    if (
      typeof lat !== 'number' || !Number.isFinite(lat) ||
      typeof lon !== 'number' || !Number.isFinite(lon) ||
      direccion === ''
    ) {
      return error(422, 'lugar_invalido', 'Google no devolvió una ubicación completa para ese lugar.');
    }

    const componentes: Componente[] = Array.isArray(data?.addressComponents) ? data.addressComponents : [];
    const localidad = componentes.find((c) => c.types?.includes('locality'))?.longText;

    return json(200, {
      place_id: typeof data?.id === 'string' ? data.id : placeId,
      direccion,
      ciudad: typeof localidad === 'string' && localidad.trim() !== '' ? localidad.trim() : null,
      lat,
      lon,
    });
  }

  return error(400, 'entrada_invalida', "accion debe ser 'buscar' o 'resolver'.");
});
