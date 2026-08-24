# S104-C — TRASPASO

Dos repos. **Monorepo:** rama `pista/s104-c` = `acb5f95c` (pusheada, verde: 4 typechecks + `verify:diseno` 54 reglas). Lo anterior de S104-C ya está en `main`; **TANDA 3 —las superficies de la salida— espera que A mergee su motor + mis superficies juntos** (mi rama ya sincronizó su `928552a7`). **Sitio `epetplace-web`:** ya en `main`, Vercel despliega solo. Nada sin commitear.

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
- **TANDA 3 · las superficies de la salida** (`aa3bc717`·`acb5f95c`, en `pista/s104-c`, espera merge de A): `/cuenta/cerrar` (DOBLE PASO — qué se va / qué queda, P15 cl.4, alineado a la Política §19.3/§19.4/§19.5: es SEUDONIMIZACIÓN, no borrado, jamás «borrar todo») + `/cuenta/exportar` (cl.5), las dos apps. Contra el motor de A (`cuenta-salida.ts`): `solicitarCierreCuenta()` → `{ programado_para, ya_estaba }` · error `requiere_camino_asistido` (backstop) · `exportarMisDatos()` → `{ enviado_a, ya_estaba }`. **Borde de A:** al confirmar se pierde el acceso EN EL ACTO (anonimización al día 30, §19.2) ⇒ el mensaje completo (fecha + correo de vuelta + el carnet) va en la pantalla de CONFIRMAR, el punto sin retorno. **Prestador:** los DOS caminos (cerrar cuenta = motor · cerrar negocio = trámite asistido, no desde la app) + aviso de único-con-acceso (leído con `obtenerMiPosicionEnPrestador` + `obtenerEquipoNegocio`). ☠️ mueren las dos Hojas de voz + claves `eliminarVoz`/`entendido`.

## 2. QUÉ QUEDA ABIERTO (bloqueo · dueño)

- **Publicar el T&C Pet Professional en el sitio — ✅ YA SE PUEDE (A completó el texto en `main` = `d8edd333`, `L-415` CERRADA).** La Disposición Transitoria Primera ya existe en el texto (5 ocurrencias, era 1); A midió los 4 criterios del founder + la regresión. **Falta publicarlo en `epetplace-web`** (mismo patrón que Privacidad: página viva + archivo inmutable). **Dueño: C**, junto con la casilla §38.10 y en el push del sitio. §4.5 exige que la Transitoria sea alcanzable desde la pantalla de aceptación.
- **La evaluación de transferencias internacionales — no existe como documento.** La produce el ABOGADO sobre `REGISTROS-PARA-EL-EXPEDIENTE.md §5` (interno, tiene la fecha del DPA 27-abr pero no la estructura de firma). **Dueño: abogado.**
- **Arbitraje §38.10** — casilla SEPARADA y OPCIONAL del prestador, con el «no» registrado. Motor de A listo (`decidirConsentimiento`, acepta `aceptado=false`). El T&C ya se puede publicar ⇒ se desbloqueó esa mitad. **Bloqueado ahora SOLO por: dónde va la casilla** (el T&C profesional se acepta en solicitar-acceso; el empleado NO acepta arbitraje). **Dueño: C hace la casilla tras la decisión de superficie del founder.**
- **Consentimiento del proveedor de IA §17.A — D-897 ⑤ → 🔴 `D-902` · FIRMADO por el founder (24-ago): NO se construye ahora.** La mitad de VOZ (§17.B) ya la cura mi §31.6 (`51d73e6a`, en main). Para la mitad de IA: **el gate de IA y el alta manual del carnet van JUNTOS y NO se construyen ahora** — sin vía manual el consentimiento no sería libre (LOPDP). La Política §14.5 publicada promete vía manual equivalente para las tres funciones y hoy NO existe para el carnet (§14.3: cero «Agregar» en la revisión; corregir lo que la IA leyó ≠ cargar lo que no vio). **La ficha D-902 queda ABIERTA con su disparo, no cerrada: ANTES de que haya usuarios reales que puedan reclamarla, O el día que se construya el gate de IA — lo que ocurra primero.** El registro canónico de la ficha lo lleva A (`DEUDAS_CANONICAS`).
- **El aviso de IA NO es una página** — vive DENTRO de la Privacidad §14-17 (medido por A, mapeo formulación-por-formulación). No reabrir esto: publicarlo aparte expondría el andamio de trabajo.

## 3. LAS FIRMAS QUE RIGEN

- **Biométrico = PUERTA DE ENTRADA (banca):** la huella desbloquea una sesión que YA existe, jamás crea una. Arranque en frío pide siempre (incluye matar-y-reabrir); volver del 2º plano pide solo tras 5 min; sin sesión → login sin huella; salida «Entrar con otra cuenta» = cerrar sesión + login.
- **Versión y URL del consentimiento viven JUNTOS en `packages/api`** (`URL_LEGAL` al lado de `VERSION_LEGAL`); la pantalla NO aporta la URL — tenerlas separadas fue lo que las dejó divergir (L-166). El consentimiento guarda el ARCHIVO inmutable (`…/1-1`), jamás la viva.
- **La Privacidad de la app es OTRO documento** que el `/privacidad` del sitio (otra categoría de sensibilidad); su versionado ES también el del aviso de IA (Anexo B), y la página lo dice.
- **El invitado entra como familiar autorizado** (5.1); co-dueño es v2. **Dos T&C por la puerta** (cliente `terminos_parent`, prestador `terminos_professional`) + una privacidad común.
- **Google:** client ID NUNCA en la app (Supabase lo lee de su config); flujo PKCE; redirect `cliente://auth/callback`; solo en el cliente (1ª excepción de la ley de paridad).
- **El dictado por voz:** consentimiento previo, específico y separado la 1ª vez (avisar no es consentir) y revocable desde config. Es libre PORQUE hay salida (la nota se escribe a mano — §17.B.5 lo exige justamente porque la voz sale a un tercero que NO es nuestro encargado). **Detalle a vigilar, no freno (medido por A):** guarda `VERSION_LEGAL.terminos_professional`, y ese T&C no está publicado (URL `null`, L-415) ⇒ la evidencia queda anclada a un texto hoy solo verificable dentro del repo. No invalida el consentimiento (la Hoja explica en pantalla qué se acepta, no manda a leer una página). **Se resuelve solo al publicar el T&C** — ahí su URL entra en `URL_LEGAL` y es una línea. Queda dicho para que nadie lo descubra en un reclamo.

## 4. DÓNDE MEDIR

- **Privacidad publicada:** HTTP 200 en `https://www.epetplace.com/legales/privacidad-app` y `…/1-1`, con control + (`/legales` 200) y − (ruta inventada 404). El HTML de la viva trae `data-epp-version` y NO es noindex; el `/1-1` SÍ.
- **URL de evidencia del consentimiento:** `URL_LEGAL` en `packages/api/src/wrappers/auth.ts` (`privacidad` = la archivo `/1-1`; los dos términos `null` hasta que sus páginas den 200).
- **Marcador borrado:** grep `terminos-inline-v1` en `apps/` → cero.
- **Consentimientos registrados:** tabla `consentimientos` (fila por documento, con versión y URL en `metadata`). Estado del dictado: `consultarConsentimiento('dictado_voz')`.
- **T&C bloqueado (L-415):** `docs/legal/TERMINOS-PET-PROFESSIONAL.md` — el recuadro en su cabecera, y buscar «Disposición Transitoria Primera» (1 sola aparición = la remisión rota).
- **Router types (R63·C):** `apps/<app>/.expo/types/router.d.ts` (generado, gitignored; se regenera con `expo start`). Por eso rutas nuevas se commitearon con SALTAR_GATE cuando no estaban regeneradas.
- **Migraciones:** `ls supabase/migrations/*.sql` vs `npx supabase migration list --linked`.
