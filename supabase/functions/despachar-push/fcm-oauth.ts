// ============================================================================
// fcm-oauth — la llave de servicio a un token de acceso de Google (S90-C)
//
// Vive APARTE del despachador por una razón de verificación, no de prolijidad:
// es la única pieza de esta función escrita a mano contra un contrato ajeno
// (RS256 + PKCS8 + el `grant_type` de Google), y separarla permite CORRERLA
// con una llave real generada al momento. **El fixture ejercita este archivo,
// no una copia de él** — copiar el algoritmo al test probaría el tubo y no el
// agua (L-207).
// ============================================================================

/** Lo que Google emite y el founder custodia. El `project_id` sale de acá y
 *  NO se hardcodea: así la llave es autodescriptiva y no puede quedar
 *  apuntando a un proyecto que no es. */
export type CuentaDeServicio = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlTexto(s: string): string {
  return base64url(new TextEncoder().encode(s));
}

/** El PEM de la cuenta de servicio a una CryptoKey. El `private_key` del JSON
 *  trae los saltos de línea como `\n` LITERALES cuando el secret viajó por una
 *  variable de entorno, y como saltos reales cuando se pegó el archivo — se
 *  normalizan las dos formas, porque las dos van a ocurrir. */
export async function importarClave(pem: string): Promise<CryptoKey> {
  const limpio = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(limpio), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/** Arma y FIRMA el JWT del `jwt-bearer` de Google. Separado del intercambio
 *  para que el fixture pueda verificar la firma sin salir a la red. */
export async function firmarAssertion(sa: CuentaDeServicio, ahora: number): Promise<string> {
  const cuerpo =
    base64urlTexto(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) +
    '.' +
    base64urlTexto(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: ahora,
        exp: ahora + 3600,
      }),
    );

  const clave = await importarClave(sa.private_key);
  const firma = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    clave,
    new TextEncoder().encode(cuerpo),
  );
  return `${cuerpo}.${base64url(new Uint8Array(firma))}`;
}

export async function tokenDeAcceso(sa: CuentaDeServicio): Promise<string> {
  const assertion = await firmarAssertion(sa, Math.floor(Date.now() / 1000));

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!r.ok) {
    // L-197: si no puede medir, sale ROJO — jamás un token vacío que después
    // produzca un 401 confuso trescientas líneas más abajo.
    throw new Error(`oauth_${r.status}: ${(await r.text()).slice(0, 180)}`);
  }
  const j = await r.json();
  if (typeof j?.access_token !== 'string') throw new Error('oauth_sin_access_token');
  return j.access_token;
}
