/**
 * S92-BIS · B4 — LA PUERTA DE ENTRADA: configuración de auth.
 *
 * ── POR QUÉ NO SE LEE `config.toml` ─────────────────────────────────────────
 * S84 ya midió el límite y vale igual hoy: **`config.toml` es la config del
 * entorno LOCAL, no la del proyecto remoto**, que vive en el dashboard y no es
 * legible ni desde el repo ni por SQL. Leerlo y reportarlo como el estado real
 * sería exactamente la clase de verde falso que este loop persigue.
 *
 * Así que **se mide por CAMINO REAL**: se le pide al endpoint de auth que haga
 * cada cosa y se lee qué contesta. Lo que no se puede medir así, se dice.
 *
 * NO CAMBIA NADA. Censo con recomendación; cambiar la política afecta a
 * usuarios reales (freno 2).
 */
import { guardarSeg2, URL, ANON, linea } from './lib-seg2.mjs';

const filas = [];
function anotar(eje, medido, recomendacion, ok) {
  filas.push({ eje, medido, recomendacion, ok });
  linea(`  ${ok === null ? '  ' : ok ? '✅' : '🔴'} ${eje.padEnd(42)} ${medido}`);
  if (recomendacion) linea(`       ↳ ${recomendacion}`);
}

const signup = async (email, password) => {
  const r = await fetch(`${URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return { status: r.status, j: await r.json().catch(() => ({})) };
};

linea('\n══ B4 · LA PUERTA DE ENTRADA — medido por camino real ══\n');

// ── ① LARGO MÍNIMO DE CONTRASEÑA ──────────────────────────────────────────
linea('① FUERZA DE LA CONTRASEÑA\n');
{
  let minimo = null;
  for (const largo of [1, 4, 5, 6, 7, 8]) {
    const pw = 'a'.repeat(largo);
    const { status, j } = await signup(`seg2-pw${largo}-${Date.now()}@epetplace.dev`, pw);
    const rechazado = status >= 400 || j.error_code === 'weak_password';
    if (!rechazado) {
      minimo = largo;
      break;
    }
  }
  anotar(
    'largo mínimo aceptado',
    minimo === null ? 'ninguno de 1..8 fue aceptado' : `${minimo} caracteres`,
    minimo !== null && minimo <= 6
      ? `**RECOMENDACIÓN: subir a 10-12.** Con ${minimo} caracteres una clave se rompe por fuerza bruta offline en minutos. Es un cambio de una perilla del dashboard y NO invalida las claves existentes — solo rige para las nuevas y los cambios.`
      : 'razonable',
    minimo !== null && minimo >= 8,
  );

  // ② ¿rechaza contraseñas obvias / filtradas?
  const obvias = ['password', '12345678', 'qwerty123', 'aaaaaaaa'];
  const aceptadas = [];
  for (const pw of obvias) {
    const { status, j } = await signup(`seg2-obv-${Date.now()}-${pw.slice(0, 3)}@epetplace.dev`, pw);
    if (status < 400 && !j.error_code) aceptadas.push(pw);
  }
  anotar(
    'contraseñas filtradas / obvias',
    aceptadas.length === 0 ? 'las 4 probadas fueron RECHAZADAS' : `ACEPTA ${aceptadas.length} de 4 claves obvias`,
    aceptadas.length > 0
      ? '**RECOMENDACIÓN: encender «Leaked password protection» (HaveIBeenPwned) en el dashboard.** Es un toggle, cuesta cero y bloquea las claves que ya están en filtraciones públicas — que es exactamente lo que un atacante prueba primero.'
      : 'ya rechaza las obvias',
    aceptadas.length === 0,
  );
}

// ── ③ CONFIRMACIÓN DE EMAIL ───────────────────────────────────────────────
linea('\n② LA CUENTA NUEVA\n');
{
  const { status, j } = await signup(`seg2-conf-${Date.now()}@epetplace.dev`, 'Seg2-2026-larga!');
  const daSesion = !!j.access_token;
  anotar(
    'confirmación de email obligatoria',
    daSesion ? 'NO — el signup devuelve sesión de inmediato' : 'SÍ — el signup no da sesión hasta confirmar',
    daSesion
      ? 'Es DELIBERADO en esta etapa (D-299: la verificación está apagada y su encendido es un click). **Recomendación: encenderla ANTES de la corrida con amigos de S105** — hasta entonces cualquiera crea cuentas con correos que no controla.'
      : null,
    null,
  );
  anotar('¿quién puede crear cuentas?', status < 400 ? 'CUALQUIERA (signup abierto)' : `signup cerrado (HTTP ${status})`, status < 400 ? 'Correcto para un producto abierto; es lo que sostiene el alta de la app.' : null, null);

  if (j.access_token) {
    const payload = JSON.parse(Buffer.from(j.access_token.split('.')[1], 'base64').toString('utf8'));
    const horas = (payload.exp - payload.iat) / 3600;
    anotar(
      'vencimiento del access token',
      `${horas} hora(s)`,
      horas > 1
        ? `**RECOMENDACIÓN: bajar a 1 hora.** Un token robado vale ${horas}h; con refresh token la sesión no se corta igual.`
        : 'el default recomendado',
      horas <= 1,
    );
    anotar('rol del token de una cuenta nueva', `«${payload.role}»`, null, payload.role === 'authenticated');
  }
}

// ── ④ RATE LIMIT ──────────────────────────────────────────────────────────
linea('\n③ RATE LIMIT — ¿cuántos intentos fallidos tolera?\n');
{
  const correo = 'demo-prestador@epetplace.dev';
  let cortoEn = null;
  let ultimo = null;
  for (let i = 1; i <= 12; i++) {
    const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: correo, password: `no-es-la-clave-${i}` }),
    });
    ultimo = r.status;
    if (r.status === 429) {
      cortoEn = i;
      break;
    }
  }
  anotar(
    'intentos fallidos seguidos',
    cortoEn === null ? '12 intentos SIN corte (no hubo 429)' : `cortó en el intento ${cortoEn} con HTTP 429`,
    cortoEn === null
      ? '**RECOMENDACIÓN: revisar el rate limit de auth en el dashboard.** Sin corte, una lista de contraseñas se prueba entera contra una cuenta conocida. Supabase lo trae configurable por hora; el default suele ser generoso.'
      : 'hay freno',
    cortoEn !== null,
  );
  anotar('último status observado', String(ultimo), null, null);
}

// ── ⑤ LO QUE NO SE PUEDE MEDIR DESDE ACÁ, y se dice (R5) ─────────────────
linea('\n④ LO QUE NO SE PUEDE MEDIR DESDE ACÁ\n');
for (const [eje, porque] of [
  ['proveedores OAuth habilitados', 'vive en el dashboard; lo único medible es que 8 cuentas TIENEN identidad google, o sea que el proveedor está habilitado'],
  ['redirect URLs permitidas', 'vive en el dashboard — y un comodín acá es la misma clase que D-558'],
  ['vigencia del OTP y del refresh token', 'la config remota no es legible; `config.toml` es del entorno LOCAL (S84)'],
  ['plantillas de correo y su remitente', 'dashboard; S84 ya lo declaró sin medir'],
]) {
  anotar(eje, '⚠️ NO MEDIBLE desde el repo ni por SQL', porque, null);
}

guardarSeg2('b4-auth.json', filas);
linea('');
