# Los dos archivos que el DOMINIO tiene que servir — `D-1100`, lote 8

Estos archivos **no viven en este repo**: viven en el sitio (`epetplace-web`,
Astro). Se generan acá porque es donde se decidió su contenido, y se copian allá
cuando la mesa firme.

**Sin ellos, los App Links del `app.json` no verifican y el enlace del correo
sigue abriendo el navegador** — o sea que la mitad nativa que este lote deja
lista no sirve de nada sola. Son la otra mitad.

---

## ① `.well-known/assetlinks.json` — Android

**Dónde:** `https://www.epetplace.com/.well-known/assetlinks.json`
**y también** `https://epetplace.com/.well-known/assetlinks.json`.

> ⚠️ **Los DOS hosts, y no es redundancia.** El `intentFilters` declara los dos,
> y Android verifica **cada host por separado**: si `epetplace.com` no sirve su
> propio archivo, ese host queda sin verificar y sus enlaces van al navegador.
> Un redirect de uno al otro **no alcanza**: la verificación no sigue redirects.

**Cómo se sirve, y las tres cosas que lo rompen en silencio:**
- `Content-Type: application/json` (no `text/plain`).
- **Sin redirect** — ni de `http` a `https`, ni de raíz a `www`. Android pide
  exactamente esa URL y no sigue saltos.
- **Con HTTPS válido.** Un certificado vencido no da error visible: da un
  enlace que abre el navegador, que es indistinguible de «todavía no lo hicimos».

### 🔴 La huella: son DOS y hay que poner las dos

`sha256_cert_fingerprints` es la huella del certificado **con el que el APK está
firmado**, y en el camino de Play hay **dos certificados distintos**:

| cuál | de dónde sale | para qué |
|---|---|---|
| **Play App Signing** | Play Console → *Integridad de la app* → *Firma de apps* | la que usan las instalaciones **desde la tienda** |
| **el keystore de EAS** | `cd apps/cliente && npx eas-cli credentials` → Android → *Keystore* | la que usan los **APK internos** (preview, F&F) |

*Poner sólo la primera deja los APK de prueba con el enlace roto, que es
exactamente donde se va a probar antes de publicar.* **Las dos entradas conviven
en el mismo array y no se pisan.**

⚠️ **`PENDIENTE-…` está escrito a propósito para que no pase por válido.** Es un
valor que rompe la verificación de forma ruidosa; una huella plausible pero
equivocada la rompe **en silencio**.

---

## ② `.well-known/apple-app-site-association` — iOS

**Dónde:** `https://www.epetplace.com/.well-known/apple-app-site-association`
— **sin extensión** (ni `.json`), `Content-Type: application/json`, sin redirect.

`appIDs` es `<TEAM_ID>.<BUNDLE_ID>`:
- **`TEAM_ID`** — Apple Developer → *Membership* (10 caracteres). **Exige la
  cuenta de Apple Developer pagada**: es acto del founder.
- **`BUNDLE_ID`** — 🔴 **NO EXISTE TODAVÍA.** Medido: `apps/cliente/app.json` no
  declara `ios.bundleIdentifier`, así que la app **nunca se construyó para iOS**.
  Elegirlo es una decisión de una sola vez: **el identificador de bundle no se
  cambia nunca** — si se toca, es una app nueva y se pierden las instalaciones
  (precedente `D-752`). El espejo de Android sería `com.epetplace.cliente`.

---

## Lo que hay que mirar después, y no es opcional

**Android verifica los App Links al INSTALAR, no al abrir el enlace.** Si el
archivo se publica después de instalar la app, el aparato sigue con el veredicto
viejo. Se re-verifica con:

```
adb shell pm verify-app-links --re-verify com.epetplace.cliente
adb shell pm get-app-links com.epetplace.cliente     # dice «verified» o no
```

*Un enlace que abre el navegador después de todo esto casi nunca es la config:
es el archivo mal servido o la verificación vieja.*
