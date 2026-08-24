# S104-C — TRASPASO

Rama `pista/s104-c`. Todo pusheado a origin.

## 1. QUÉ ENTREGÉ (SHA · pieza)
- `54855c1d` — arco de entrada con el ritual (login/registro/recuperar/bienvenida × cliente+prestador; senda + isotipo + huella de llegada; autofill; términos + consentimiento en registro).
- `e63003cf` — «co-dueño» → familiar autorizado (firma 5.1): strings de la Hoja de eliminar + comentarios.
- `6b946ab4` — superficie de invitar a la familia (motor de A): correo + copiar enlace, solo titular.
- `fba262f3` — invitación con 3 estados (`correoSuprimido`) + `/baja` como pantalla de la APP + enlace a `/invitacion?token=`.
- `3995b054` — pantalla `/invitacion` del INVITADO (3 láminas + aceptar con token; email_no_coincide).
- `e06e46e3` — se consume el freno de A (`urlInvitacion` null-safe, fila gateada por `ENLACE_INVITACION_HABILITADO`, «Pronto»); comentario `/unirse` corregido a `/invitacion`.
- `12f4ecf2` — «Enviar por…» con la Share API nativa (sujeto al mismo freno).
- (sin SHA propio, dentro de la tanda) los 4 strings del correo en inglés muertos (D-628); relevamiento legal + las dos mediciones del aviso de IA (reporte, no código).

## 2. QUÉ QUEDA ABIERTO (bloqueo · dueño)
- **✅ CERRADO (23-ago) — `/invitacion?token=` y `/baja?t=` en `epetplace-web`.** Rama `pista/s104-c` del sitio → merge a `main` (`ff7837f`) → Vercel desplegó solo. **Medido con controles contra el objeto:** `/invitacion?token=` y `/baja?t=` dan **200** (eran 404 antes ⇒ el 200 prueba el deploy nuevo), control + `/legales` 200, control − 404; el HTML desplegado trae los marcadores funcionales (`cliente://invitacion?token=` · `functions/v1/baja-correo`), no una cáscara; POST a `baja-correo` → 200 `{"resultado":"listo"}`. `/baja` usa el endpoint `baja-correo` que A desplegó (sin anon key: el token es la credencial), con **fallback a la URL real** para que un build de Vercel sin `PUBLIC_URL_BAJA` no deje el POST muerto. `/invitacion` usa esquema `cliente://` porque los App Links siguen en PENDIENTE. Las dos noindex, fuera del sitemap y sin enlace interno (razón escrita en `verify:huerfanas`/`verify:sitemap`). **A avisado: se cumple la condición para `ENLACE_INVITACION_HABILITADO = true` — la enciende A en la OTA única (su territorio); el CORREO sigue frenado por `INVITACION_CORREO_VIVO`, decisión aparte del founder.**
- **✅ HECHO (23-ago) — Pantallas de código.** `apps/{cliente,prestador}/src/app/verificar-correo.tsx`: reusan `CampoCodigo` (8 dígitos), reenvío con cuenta regresiva de 60s, y **persisten el consentimiento al confirmar** (`confirmarAltaConCodigo` con la traza legal que viajó del registro — D-893). **Detrás del flag del SERVIDOR, sin flag propio:** la rama `!sesion_activa` de los dos `registro.tsx` navega acá; hoy autoconfirm ON ⇒ `sesion_activa=true` ⇒ nunca se monta. Dosis del ritual: cliente ceremonia entera (huella de llegada → `/onboarding`), prestador senda quieta (§7 → `marcarRegistroReciente` + `/`). Acciones DENTRO del scroll (el teclado numérico taparía un pie fijo). Tipos de ruta regenerados en las dos apps (metro typegen) ⇒ tsc + R63·C verdes. **⚠️ Ratificación pendiente de A: `reenviarCodigoAlta` en `packages/api/src/wrappers/auth.ts` + su export en `index.ts` (76(c), additive, banner puesto) — gemela de `confirmarAltaConCodigo`, `auth.resend({type:'signup'})`.** Verde: tsc api·cliente·prestador · verify:diseno 54 reglas.
- **Biométrico**: candado sobre la sesión, **NO factor de auth contra Supabase**; fallback SIEMPRE al login; sin biométrico enrolado el interruptor no aparece. `PantallaDeCandado` (B) + `expo-local-authentication` ya están — **C**.
- **Botón Pegar en `CampoCodigo`** (`getStringAsync`, 0 usos hoy) — pieza de `packages/ui`, coordinar con **B** / **C**.
- **«Enviar por…»** ya hecho (`12f4ecf2`); si aparece otro consumidor, mismo freno que copiar.
- **Botón de Google** en cliente (proveedor ya habilitado en Supabase) — **C**, espera el client ID de **A**.
- **Cura del token de push**: `InvitacionAvisos` llama `registrarTokenDeAparato` antes de restaurar la sesión → leer el `{ok, codigo}` y reintentar cuando la sesión esté lista; el catch debe distinguir «es web» del fallo real. Las DOS apps (en el cliente funciona por timing, no por diseño) — **C**.
- **Los 2 checks legales** — bloqueados por el **abogado**: 38 huecos en `terminos-plataforma`, 24 en `privacidad-app`, 6 de formulación en el aviso de IA. **No cablear a documentos que no existen.**

## 3. LAS FIRMAS QUE RIGEN
- El invitado entra como **familiar autorizado** (5.1); co-dueño es v2 (transición, no alta) — no se configuran permisos (en v1 el permiso ES el escalón).
- **Dos T&C derivados de la PUERTA** + una privacidad común: cliente (registro, invitación_familia) → `terminos_parent` + `privacidad`; prestador (registro, solicitar-acceso, invitación de empleado) → `terminos_professional` + `privacidad`.
- **Aviso de IA enumera 3 funciones** (estructurar nota clínica · leer carnet · redactar presencia); el **Coach entra cuando use IA** — el aviso sube de versión ANTES de que la función esté viva, en el mismo acto. No hay decisiones exclusivamente automatizadas con efectos jurídicos (revisión humana en las 3).
- El **freno de `urlInvitacion` vive en `packages/api`** (`_enlace-invitacion.ts`), una verdad para las dos apps; se enciende con 200 medido, viaja por OTA.
- El **consentimiento se muestra en el formulario y se persiste al confirmar el código**; la privacidad se registra aunque excluya la app (P23 demuestra qué se mostró, no que alcance).

## 4. DÓNDE MEDIR (contra qué objeto)
- **Páginas del sitio**: HTTP 200 en `https://www.epetplace.com/invitacion?token=` y `/baja?t=`, con control positivo (`/legales` da 200) y negativo (una ruta inventada da 404).
- **Freno del enlace**: `ENLACE_INVITACION_HABILITADO` en `packages/api/src/wrappers/_enlace-invitacion.ts`.
- **Documentos legales completos**: contar `[[…]]` en `epetplace-web/src/borradores/{terminos-plataforma,privacidad-app,aviso-ia}.ts` y en `src/legales.ts` (a 0 salvo comentarios).
- **Funciones de IA vivas**: `functions.invoke(` en `packages/api/src/wrappers` (estructurar-nota-clinica · extract-vacuna · escribir-presencia); chat-ayuda y extract-documento existen SIN consumidor.
- **Router types (R63·C)**: `apps/<app>/.expo/types/router.d.ts` — se regenera con `expo start`; el gate lo lee. Por eso los commits de rutas nuevas (`/baja`, `/invitacion`) salieron con `SALTAR_GATE`.
- **Consentimiento registrado**: tabla `consentimientos` (fila por documento, con versión y URL en `metadata`).
- **Migraciones**: `ls supabase/migrations/*.sql` vs `npx supabase migration list --linked`.
