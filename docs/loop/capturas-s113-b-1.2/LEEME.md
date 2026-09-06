# Capturas · las tres piezas del lote 1.2 (emulador Android, Pixel 10 Pro XL)

Claro arriba, oscuro abajo. **`Bundled` verificado en el log de Metro** antes de
capturar — ver abajo por qué eso hacía falta decirlo.

- **01** · `SugerenciaRaza` con sus tres preguntas y su confianza **en palabras,
  no en porcentaje**, más «Es mestizo» y «Es otra raza». **Nada preseleccionado**,
  que es lo que la pieza promete. Y `FichaRaza`: la revisada se dibuja colapsada
  con su nombre y su «Ver los cuidados»; **la que no está revisada no dibuja
  nada** — la línea de abajo lo confirma en los dos temas.
- **02** · `PantallaDespedida`: **en tinta, sin marca**, con la fecha en su
  campo tocable y el `campoPalabras` que inyecta la pantalla.

## 🔴 Por qué el bundle no llegaba, y era mío

Seis intentos de turnos anteriores fallaban con `Bundled` en cero. **La causa no
era caché, ni puerto, ni el dev client: era el DIRECTORIO.** Corrí `expo` desde
la raíz del monorepo en vez de desde `apps/cliente`, y desde ahí Metro resuelve
el entry point del `package.json` de la raíz —que no tiene `main:
expo-router/entry`— así que buscaba `../../App` y **el bundle fallaba al
construirse**. La app se quedaba con el último bueno y parecía caché.

El canon ya tenía la regla escrita para `eas-cli` (*«siempre desde
`apps/<app>/`»*); **vale igual para `expo start` y `expo run`**, y su daño acá
fue peor: `expo run:android` desde la raíz **generó un `android/` entero,
reformateó el `package.json` y tocó el `pnpm-lock.yaml`**. Todo revertido y
verificado.

## ⚠️ Lo que no se vio

**El botón de la despedida.** Va al fondo de la pieza, después de un espaciador
`flex: 1`, y en la sonda quedó fuera del recorte visible. *Su comportamiento —el
segundo toque nombrando a la mascota como seguridad— lo mide `verify:vida`; lo
que falta es el ojo.* Se declara en vez de darlo por visto.
