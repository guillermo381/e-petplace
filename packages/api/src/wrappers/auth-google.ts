/**
 * ENTRAR CON GOOGLE (S104-A, tanda 2) — solo en la app del cliente.
 *
 * ── POR QUÉ EL NAVEGADOR LO ABRE LA APP Y NO ESTE PAQUETE ────────────────
 * **`packages/api` es agnóstico de Expo**: su única dependencia es
 * `@supabase/supabase-js`. Importar `expo-web-browser` acá le metería una
 * dependencia nativa a un paquete que hoy compila en cualquier lado — y lo
 * volvería imposible de usar desde el sitio o desde un script.
 * ⇒ **el llamador pasa la función que abre el navegador.** La app la tiene; el
 * paquete no la necesita.
 *
 * ── POR QUÉ EL `redirectTo` TAMBIÉN VIENE DE AFUERA ──────────────────────
 * Es un esquema de aplicación (`cliente://…`), y **este paquete lo comparten
 * las dos apps**. *Hardcodear acá el esquema de una casa sería que el paquete
 * compartido supiera cuál de sus dos consumidores lo está llamando.*
 *
 * ── LO QUE YA ESTÁ MEDIDO Y NO HACE FALTA VOLVER A VERIFICAR ─────────────
 * Google está habilitado en el proyecto (`authorize?provider=google` → 302 a
 * `accounts.google.com`, con `provider=github` → 400 como control negativo), y
 * **el `redirect_uri` que Supabase manda es `https://auth.epetplace.com/...`**,
 * no `*.supabase.co` ⇒ la pantalla de consentimiento muestra el dominio de la
 * casa. Es la precondición 🔴 de `MODELO_LOGIN` §4, y está cumplida.
 */

import { getClient } from '../client';
import { registrarConsentimientos, documentosVigentes } from './auth';
import type { SesionDueno, CodigoErrorAuth, DocumentoLegal } from './auth';
import type { ResultadoWrapper } from '../resultado';

export type ResultadoNavegador =
  | { tipo: 'exito'; url: string }
  | { tipo: 'cancelado' };

/** La app provee esto (con `WebBrowser.openAuthSessionAsync`). */
export type AbrirSesionAuth = (url: string, redirectTo: string) => Promise<ResultadoNavegador>;

export type CodigoGoogle = CodigoErrorAuth | 'cancelado_por_usuario' | 'google_no_completo';

export async function iniciarSesionConGoogle(input: {
  /** Deep link de vuelta, p. ej. `cliente://auth/callback`. Ya habilitado en
   *  el `uri_allow_list` del proyecto (`cliente://**`). */
  redirectTo: string;
  abrirNavegador: AbrirSesionAuth;
  /** URLs legales que la pantalla mostró, para el consentimiento del alta. */
  urlsLegales?: Partial<Record<DocumentoLegal, string>>;
}): Promise<ResultadoWrapper<SesionDueno & { consentimiento_registrado: boolean }, CodigoGoogle>> {
  const cliente = getClient();

  /* `skipBrowserRedirect` porque en una app nativa no hay «redirigir la
     pestaña»: hay que abrir una sesión de autenticación y esperar que vuelva. */
  const { data, error } = await cliente.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: input.redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { ok: false, codigo: 'error_desconocido', mensaje: 'No pudimos abrir el ingreso con Google.' };
  }

  const vuelta = await input.abrirNavegador(data.url, input.redirectTo);
  if (vuelta.tipo === 'cancelado') {
    /* Cancelar NO es un error: es una decisión. La pantalla no debe mostrar una
       alerta roja por esto — por eso tiene código propio y no `error_desconocido`. */
    return { ok: false, codigo: 'cancelado_por_usuario', mensaje: '' };
  }

  const code = new URL(vuelta.url).searchParams.get('code');
  if (!code) {
    return { ok: false, codigo: 'google_no_completo', mensaje: 'Google no completó el ingreso. Probá de nuevo.' };
  }

  const { data: ses, error: errSes } = await cliente.auth.exchangeCodeForSession(code);
  if (errSes || !ses?.user) {
    return { ok: false, codigo: 'google_no_completo', mensaje: 'No pudimos completar el ingreso. Probá de nuevo.' };
  }

  /* 🔴 SI ES LA PRIMERA VEZ, ESTO ES UN ALTA — y un alta acepta términos.
     Entrar con Google no exime de P23: la diferencia es que acá no hubo
     formulario donde marcarlo, así que el consentimiento se registra por el
     hecho de completar el ingreso, con los documentos que la pantalla mostró.
     Se consulta antes para no duplicar en cada login posterior. */
  let consentimiento_registrado = false;
  const { count } = await cliente
    .from('consentimientos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ses.user.id);
  if ((count ?? 0) === 0) {
    const r = await registrarConsentimientos(
      ses.user.id,
      'registro',
      documentosVigentes('registro', input.urlsLegales ?? {}),
    );
    consentimiento_registrado = r.total > 0 && r.registrados === r.total;
  } else {
    consentimiento_registrado = true; // ya lo había aceptado antes
  }

  const meta = ses.user.user_metadata as Record<string, unknown> | undefined;
  const nombre =
    (typeof meta?.nombre === 'string' && meta.nombre) ||
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    null;

  return {
    ok: true,
    data: { user_id: ses.user.id, email: ses.user.email ?? null, nombre, consentimiento_registrado },
  };
}
