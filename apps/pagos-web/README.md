# apps/pagos-web — la página del alta de tarjeta

> **Qué es:** la superficie donde una familia guarda su tarjeta. **Estática, sin build de framework, sin secretos.**
> **Nace:** S101-B · Fase 2 · 19-ago-2026 · **Letra que la manda:** `docs/LETRA_PUERTA_DE_PAGO_S101B.md` §2.

---

## 🔴 EL PRINCIPIO QUE NO SE NEGOCIA

**El PAN vive únicamente dentro del formulario de Nuvei. Esta página lo ALOJA; jamás lo LEE.**

No es doctrina de la casa: **el proveedor lo verificó dos veces el mismo día** (19-ago) — rechazó el PAN server-to-server con `401 Application is not PCI`, y aceptó el token emitido por su propio SDK en el navegador. *Es una puerta cerrada del otro lado, no una política nuestra que podamos relajar.*

**Prohibido en esta página, para siempre:**
- leer el número con `.value` o meterlo en cualquier variable nuestra;
- logs del contenido del formulario;
- analytics, tag managers, y **cualquier error-tracking que capture el DOM** (Sentry con session replay, LogRocket, hotjar y parientes). *Un replay que grabe este formulario mete el PAN en un tercero y nos vuelve PCI.*

Una versión anterior de esta página (en la Edge Function de ensayo, S101-A) **sí leía el PAN**, y se corrigió. **Funcionaba, y por eso era peligrosa:** *el PAN en una variable de nuestro JS no rompe nada visible; solo cambia en qué régimen de cumplimiento estamos parados.*

---

## Por qué vive acá y no en una Edge Function

La página de ensayo se servía desde Supabase y **la plataforma degrada HTML a texto plano a propósito** en el dominio compartido `*.supabase.co` — es anti-phishing y está bien que exista. El `TEXT/HTML; charset=UTF-8` que la hacía andar era **un rodeo frágil que deja de funcionar en silencio** el día que normalicen la comparación (`D-853`).

*La plataforma no estaba fallando: nos estaba diciendo que ése no era el lugar para servir una página.*

---

## El contrato de la URL

```
https://<host>/?alta=<handle>&volver=<url-de-retorno>
```

| Parámetro | Qué es |
|---|---|
| `alta` | **handle opaco** del alta. **No es un secreto y no identifica a nadie por sí solo** — el servidor es quien sabe de quién es. Viaja también como `uid` ante el proveedor: es el valor que entra al `stoken`, y **por eso no puede divergir** (si divergiera, el stoken daría `false` por una razón que no es la fórmula). |
| `volver` | a dónde devolver el navegador al terminar. **Se valida contra lista blanca** (`PAGOS_ESQUEMAS_VOLVER`): *un `volver` libre convertiría esta página en un redirector abierto — alguien mandaría a la familia a un sitio ajeno desde un dominio nuestro, justo después de tipear una tarjeta.* |

## Los tres desenlaces — y cuál NO dice esta página

| Desenlace | Quién lo dice |
|---|---|
| `guardada` | esta página, devolviendo el navegador con `?desenlace=guardada` |
| `rechazada` | esta página, ídem |
| **`abandonada`** | 🔴 **la APP, no esta página.** Si la familia cierra el navegador, este código ya no corre. *Un desenlace que depende de que corra el código de la página que se cerró no es un desenlace: es una suposición.* La app lo deduce del retorno sin desenlace. |

---

## Variables de entorno (proyecto de Vercel)

**Ninguna se commitea. El build es fail-closed: si falta una obligatoria, muere a la vista** — *una página de pago con config incompleta se ve bien y no cobra.*

| Variable | Oblig. | Qué es |
|---|---|---|
| `NUVEI_APP_CODE_CLIENT` | ✅ | config **pública** del SDK |
| `NUVEI_APP_KEY_CLIENT` | ✅ | config **pública** del SDK (el juego CLIENT es publicable por diseño) |
| `PAGOS_API_ALTA` | ✅ | endpoint propio que persiste la tarjeta server-side |
| `PAGOS_MODO` | — | `stg` (default) \| `prod` — **primer argumento de `Payment.init`** |
| `PAGOS_ESQUEMAS_VOLVER` | — | lista blanca de retorno, coma-separada. Default `cliente://` |
| `PAGOS_EMAIL_ALTA` | — | correo del alta ante el proveedor. **No es el de la familia**: el proveedor lo pide y no hay razón para entregarle el de la persona cuando el vínculo real lo lleva el handle |
| `NUVEI_SDK_JS` · `NUVEI_SDK_CSS` · `JQUERY_URL` | — | URLs del SDK, con default medido del repo oficial |

🔴 **`NUVEI_APP_KEY_SERVER` no entra acá jamás.** Firma cobros. **El build aborta** si detecta `APP_KEY_SERVER`, `SERVICE_ROLE` o `ARNES_SECRET` en el bundle.

---

## Lo que esta página NO tiene todavía, declarado

- **CSP (`Content-Security-Policy`).** Es hardening real y valioso para una página de pago, **y no se puso adivinando**: el SDK carga desde `cdn.paymentez.com`, jQuery desde otro host, y el widget monta sus propios elementos —posiblemente un iframe del proveedor—. Una allowlist equivocada **rompe el formulario en runtime y no lo dice en ningún build**. Se escribe cuando el ensayo muestre exactamente qué orígenes toca el SDK. *Preferimos declarar el hueco a publicar un candado que no probamos.*
- **`NUVEI_SDK_JS` sin medir contra la doc** — sale de env con default declarado. Si la doc dice otra, **se cambia la variable y no el archivo**.
- **Quién emite el handle `alta`** — es decisión de motor y pide su firma (ver la bitácora de S101-B).
