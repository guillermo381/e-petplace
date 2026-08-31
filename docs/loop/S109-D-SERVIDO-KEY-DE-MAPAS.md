# SERVIDO AL FOUNDER · autorizar el binario local en la key de Maps

> S109-D · 31-ago-2026. **Todo medido, nada adivinado.** Lo que no pude medir
> —el SHA-1 de tu binario— viene con el comando exacto para sacarlo.

---

## ① EL PACKAGE — medido de `app.json`

```
com.epetplace.cliente
```

*(El del prestador, para cuando toque: `com.epetplace.prestador`.)*

---

## ② EL SHA-1 DE TU BINARIO — sacalo del APK QUE CORRE, no de un keystore

🔴 **Del aparato, y no de un archivo del disco**, por una razón: *el keystore que
firmó tu APK y el que creés que lo firmó pueden no ser el mismo, y el único que
importa es el que está adentro del que corre.*

Con el teléfono conectado por USB y depuración activada:

```bash
adb shell pm path com.epetplace.cliente
# devuelve algo como: package:/data/app/~~AbC.../base.apk

adb pull /data/app/~~AbC.../base.apk /tmp/cliente-local.apk

~/Library/Android/sdk/build-tools/36.0.0/apksigner verify --print-certs \
  /tmp/cliente-local.apk | grep "SHA-1"
```

La última línea imprime el dato, con este formato:

```
Signer #1 certificate SHA-1 digest: 3331ac30...
```

### ⚠️ DOS RESULTADOS POSIBLES, Y CAMBIAN LA CONCLUSIÓN

| lo que salga | qué significa |
|---|---|
| **algo distinto** de `3331ac30…` | tu binario está firmado con **otro keystore** ⇒ **la hipótesis se confirma**: autorizá ese SHA-1 y el mapa debería dibujar |
| **exactamente `3331ac30…`** | 🔴 **es el keystore de EAS** (lo mediste ya en el APK de nube) ⇒ **la firma NO es la causa**, porque sería la misma que la de nube. En ese caso **la restricción está sobre la key misma** —o le falta el package, o le falta la API— **y hay que mirar la credencial antes de agregar nada** |

*El segundo caso es real y por eso está escrito: `eas build --local` **usa el
keystore de EAS**, no uno de debug. Y en esta máquina **no existe**
`~/.android/debug.keystore` (medido), así que el binario no salió de un
`expo run:android` acá.*

---

## ③ DÓNDE SE PEGA — en palabras, y qué mirar antes

**Google Cloud Console → APIs y servicios → Credenciales.**

1. Abrí **la API key que usa la app** — es la que viaja como
   `GOOGLE_MAPS_API_KEY` (secret de EAS, environment `development`; la app la
   hornea en el manifiesto como `com.google.android.geo.API_KEY`).
2. **Restricciones de aplicación** → tiene que estar en **«Apps de Android»**.
   **Mirá primero qué hay listado** — eso contesta solo si el problema es que
   falta tu firma o si no hay ninguna autorizada.
3. **Agregar elemento** → dos campos:
   - **Nombre del paquete:** `com.epetplace.cliente`
   - **Huella digital del certificado SHA-1:** la del paso ②
4. **Restricciones de API** → que **`Maps SDK for Android`** esté entre las
   permitidas. *Una key con la firma correcta y sin esa API habilitada da el
   mismo síntoma: el mapa monta y no dibuja.*
5. Guardar. **Los cambios de restricción pueden tardar unos minutos** en
   propagarse — si no dibuja al instante, esperá antes de concluir.

---

## ④ CÓMO SE LEE EL RESULTADO

- **Dibuja** ⇒ diagnóstico **cerrado y curado en el mismo acto**. La zona ya
  estaba en la base (`lat −0.197058 · lon −78.438188 · radio 500 m`), el lector
  ya la traía y el encuadre ya era correcto: **lo único que faltaba era que
  Google autorizara esa firma.**
- **No dibuja** ⇒ la restricción está **sobre la key misma**, y volvemos con lo
  que hayas visto en el paso ③.2 (qué había listado) y ③.4 (si la API estaba).

⚠️ **Y lo que este acto NO cambia:** el APK de nube 1.0.5 **sí tiene la key
horneada** (verificado en verde) y su SHA-1 es `3331ac303cdcf82517ae1279e0900ceedce95b61`.
Si algún día distribuís ese, **también necesita estar autorizado** — conviene
agregar los dos de una vez y no volver.
