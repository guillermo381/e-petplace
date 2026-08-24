# S104-C — TRASPASO

Dos repos. **Monorepo:** rama `pista/s104-c`, todo pusheado, A la mergea a `main`. **Sitio `epetplace-web`:** ya en `main`, Vercel despliega solo. Nada sin commitear.

Mapa de dónde retomar, no fuente de datos vivos: los números (migraciones, reglas, versiones libres) se re-miden del objeto; acá solo SHA y hechos estructurales.

## 1. QUÉ QUEDÓ (SHA · pieza)

**Sitio (`main` de epetplace-web):**
- `ff7837f` — `/invitacion?token=` y `/baja?t=`, las dos páginas del enlace del correo (esquema `cliente://` porque los App Links siguen PENDIENTE; `/baja` postea a la edge `baja-correo`).
- `4d17af0` — **Política de Privacidad de las apps, PUBLICADA** con versionado inmutable: `/legales/privacidad-app` (viva, indexada) + `/legales/privacidad-app/1-1` (archivo inmutable v1.1, noindex, la URL de evidencia). Renderiza el markdown del doc del abogado. Enlazada desde `/legales`.

**Monorepo (`pista/s104-c`):**
- (mergeado ya por A antes) el arco de entrada con el ritual, la superficie de invitar a la familia + `/invitacion` del invitado + «Enviar por…», el freno del enlace.
- `c5445b7c` — pantallas de código `/verificar-correo` (las dos apps), detrás del flag del SERVIDOR (rama `!sesion_activa`).
- `6a706e36`·`24d7f899`·`5900a9c7` — biométrico como PUERTA DE ENTRADA + umbral de inactividad de 5 min (las dos apps).
- `fb4fc11f` — «Pegar» en `CampoCodigo` (sonda `requireOptionalNativeModule`, ui).
- `9a8cde83` — botón «Entrar con Google» en el login del cliente + ruta `/auth/callback`. (El flujo lo curó A con `flowType:'pkce'` en client.ts — mi lado app no cambió.)
- `66040b4e` — D-899, aviso de privacidad del dictado (visible en pantalla).
- `51d73e6a` — §31.6, consentimiento del dictado por voz: gate de 1ª vez + toggle de revocación en preferencias.
- `58df3147` — doc `POLITICA-PRIVACIDAD-APP.md` a v1.1 + fecha + quitar el recuadro (autorizado founder).
- `33f9281a` — **borrado el marcador `terminos-inline-v1`** de las 6 superficies ⇒ el consentimiento ya guarda la URL de evidencia que A puso en `URL_LEGAL`.

## 2. QUÉ QUEDA ABIERTO (bloqueo · dueño)

- **Publicar el T&C Pet Professional — 🔴 NO se puede.** Su encabezado remite a una *Disposición Transitoria Primera* que **el texto no contiene** (aparece 1 sola vez, y es la propia remisión) — **L-415**. Además su recuadro «NO PUBLICAR» sigue vivo y su versión final que el founder pegó por chat **no está commiteada**. **Dueño: abogado/founder.** No quitar el sello.
- **La evaluación de transferencias internacionales — no existe como documento.** La produce el ABOGADO sobre `REGISTROS-PARA-EL-EXPEDIENTE.md §5` (interno, tiene la fecha del DPA 27-abr pero no la estructura de firma). **Dueño: abogado.**
- **Arbitraje §38.10** — casilla SEPARADA y OPCIONAL del prestador, con el «no» registrado. Motor de A listo (`decidirConsentimiento`, acepta `aceptado=false`). **Bloqueado por: dónde va la casilla** (el T&C profesional se acepta en solicitar-acceso; el empleado NO acepta arbitraje) **+ el T&C sin publicar.** **Dueño: C hace la casilla tras la decisión de superficie.**
- **Consentimiento del proveedor de IA §17.A — D-897 ⑤, la otra mitad.** La mitad de VOZ (§17.B) ya la cura mi §31.6 (`51d73e6a`) — cuando A mergee mi rama, deja de estar en cero. Falta si las tres funciones de IA (estructurar-nota-clinica · extract-vacuna · escribir-presencia) necesitan su gate propio «al activarlas». **Consultado a A. Dueño: A/founder modela, C hace la pantalla.**
- **El aviso de IA NO es una página** — vive DENTRO de la Privacidad §14-17 (medido por A, mapeo formulación-por-formulación). No reabrir esto: publicarlo aparte expondría el andamio de trabajo.

## 3. LAS FIRMAS QUE RIGEN

- **Biométrico = PUERTA DE ENTRADA (banca):** la huella desbloquea una sesión que YA existe, jamás crea una. Arranque en frío pide siempre (incluye matar-y-reabrir); volver del 2º plano pide solo tras 5 min; sin sesión → login sin huella; salida «Entrar con otra cuenta» = cerrar sesión + login.
- **Versión y URL del consentimiento viven JUNTOS en `packages/api`** (`URL_LEGAL` al lado de `VERSION_LEGAL`); la pantalla NO aporta la URL — tenerlas separadas fue lo que las dejó divergir (L-166). El consentimiento guarda el ARCHIVO inmutable (`…/1-1`), jamás la viva.
- **La Privacidad de la app es OTRO documento** que el `/privacidad` del sitio (otra categoría de sensibilidad); su versionado ES también el del aviso de IA (Anexo B), y la página lo dice.
- **El invitado entra como familiar autorizado** (5.1); co-dueño es v2. **Dos T&C por la puerta** (cliente `terminos_parent`, prestador `terminos_professional`) + una privacidad común.
- **Google:** client ID NUNCA en la app (Supabase lo lee de su config); flujo PKCE; redirect `cliente://auth/callback`; solo en el cliente (1ª excepción de la ley de paridad).
- **El dictado por voz:** consentimiento previo, específico y separado la 1ª vez (avisar no es consentir) y revocable desde config.

## 4. DÓNDE MEDIR

- **Privacidad publicada:** HTTP 200 en `https://www.epetplace.com/legales/privacidad-app` y `…/1-1`, con control + (`/legales` 200) y − (ruta inventada 404). El HTML de la viva trae `data-epp-version` y NO es noindex; el `/1-1` SÍ.
- **URL de evidencia del consentimiento:** `URL_LEGAL` en `packages/api/src/wrappers/auth.ts` (`privacidad` = la archivo `/1-1`; los dos términos `null` hasta que sus páginas den 200).
- **Marcador borrado:** grep `terminos-inline-v1` en `apps/` → cero.
- **Consentimientos registrados:** tabla `consentimientos` (fila por documento, con versión y URL en `metadata`). Estado del dictado: `consultarConsentimiento('dictado_voz')`.
- **T&C bloqueado (L-415):** `docs/legal/TERMINOS-PET-PROFESSIONAL.md` — el recuadro en su cabecera, y buscar «Disposición Transitoria Primera» (1 sola aparición = la remisión rota).
- **Router types (R63·C):** `apps/<app>/.expo/types/router.d.ts` (generado, gitignored; se regenera con `expo start`). Por eso rutas nuevas se commitearon con SALTAR_GATE cuando no estaban regeneradas.
- **Migraciones:** `ls supabase/migrations/*.sql` vs `npx supabase migration list --linked`.
