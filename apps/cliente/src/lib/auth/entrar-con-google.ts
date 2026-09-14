import * as WebBrowser from 'expo-web-browser'
import { iniciarSesionConGoogle } from '@epetplace/api'

/**
 * ENTRAR CON GOOGLE — el mismo acto para las dos puertas (S116-C lote 3b).
 *
 * ── POR QUÉ VIVE ACÁ Y NO EN CADA PANTALLA ───────────────────────────────
 * **Es el mismo flujo para 03 (acceso) y 05 (crear cuenta), y no por
 * parecido: es literalmente el mismo acto.** El wrapper lo dice en su propio
 * comentario de `login.tsx`: *«Si es la primera vez, es un alta y el wrapper
 * registra el consentimiento»* — Google no distingue entrar de registrarse,
 * y el guard del raíz decide después a dónde va (onboarding u Hogar).
 *
 * ⇒ copiarlo en la segunda pantalla habría creado **dos caminos de alta con
 * dos consentimientos** que pueden divergir sin que nada falle. *Dos copias
 * de un flujo de identidad es la clase de duplicación que esta casa paga
 * caro: la que no rompe nada el día que se separan.*
 *
 * ⚠️ **Es un `.ts`, no una pieza**: no dibuja. `verify:piezas-locales` cuenta
 * `.tsx` de `components/`, y esto no es una pieza del catálogo — es el acto.
 *
 * ── LO QUE NO RESUELVE, dicho ────────────────────────────────────────────
 * **El LOGO de Google no existe todavía** (medido: cero en
 * `apps/cliente/assets/marcas/`, que sí tiene los seis de pago con su
 * `PROCEDENCIA.md`). El botón va **en texto**, y eso es correcto mientras
 * tanto: *la marca ajena no se redibuja, y un logo inventado es peor que su
 * ausencia.* El asset es acto del founder.
 */

/** El destino del callback. UNA constante para las dos puertas. */
export const REDIRECT_GOOGLE = 'cliente://auth/callback'

export type ResultadoGoogle =
  | { tipo: 'entro' }
  /** Cancelar NO es un error: es una decisión, y no lleva alerta roja. */
  | { tipo: 'cancelado' }
  /* El código viaja como `string` y no como la unión del wrapper: **el
     rebote de Google devuelve códigos de DOS familias** (los suyos y los de
     auth), y estrechar acá obligaría a la pantalla a conocer las dos. Lo
     único que la pantalla necesita es el mensaje —que ya viene en voz de
     producto— y poder distinguir el cancelado, que tiene su propia rama. */
  | { tipo: 'error'; mensaje: string; codigo: string }

export async function entrarConGoogle(): Promise<ResultadoGoogle> {
  const r = await iniciarSesionConGoogle({
    redirectTo: REDIRECT_GOOGLE,
    /* El navegador lo abre la app: el wrapper es agnóstico de Expo y así se
       queda. */
    abrirNavegador: async (url, redirectTo) => {
      const res = await WebBrowser.openAuthSessionAsync(url, redirectTo)
      return res.type === 'success' ? { tipo: 'exito', url: res.url } : { tipo: 'cancelado' }
    },
    /* La URL de cada documento legal la resuelve `URL_LEGAL` en
       `packages/api`: versión y URL son el mismo dato y viven juntos, para
       que no puedan divergir (`L-166`). La pantalla NO la aporta. */
  })

  if (!r.ok) {
    if (r.codigo === 'cancelado_por_usuario') return { tipo: 'cancelado' }
    return { tipo: 'error', mensaje: r.mensaje, codigo: r.codigo }
  }
  return { tipo: 'entro' }
}
