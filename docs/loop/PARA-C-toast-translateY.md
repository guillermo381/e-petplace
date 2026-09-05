# Para C — el toast del prop desconocido: es `translateY`, y vive en el shell de tabs

**Reproducido**, no deducido. Cliente en web dev (`expo start --web`), sesión
real de la cuenta demo, Playwright leyendo la consola.

## El mensaje, literal

```
React does not recognize the `translateY` prop on a DOM element.
If you intentionally want it to appear in the DOM as a custom attribute,
spell it as lowercase `translatey` instead.
If you accidentally passed it from a parent component, remove it from the
DOM element.
```

*(La consola lo imprime con `%s`; los argumentos llegan aparte y son
`translateY` / `translatey`. Por eso en el toast se ve cortado como «`t…`».)*

## Dónde — medido por bisección de rutas

| ruta | warnings |
|---|---|
| `/hogar` | **1** |
| `/explorar` | **1** |
| `/cuenta` | **1** |
| `/hogar/mascota/[id]` (perfil de Zeus `a3332037`) | **1** |
| `/carnet` | **0** |
| `/avisos` | **0** |

⇒ **dispara en las cuatro rutas de tabs y en ninguna de fuera.** No es de la
pantalla del perfil, aunque ahí fue donde se vio: **es del shell**,
`apps/cliente/src/app/(tabs)/_layout.tsx`, y se monta una vez por entrada a
tabs.

## Lo que ya descarté, para que no lo repitas

- **No es un `{...props}`**: no hay ningún spread de props sobre JSX en
  `packages/ui` — sólo `{...handlers}` de `usePresionado`, que lleva
  únicamente `onPressIn`/`onPressOut`, y `{...stroke}` sobre elementos SVG.
- **No es `PresenciaCoach`… al menos no por sus estilos animados**: sus tres
  `useAnimatedStyle` usan la forma correcta (`transform: [{ translateY }]`) y
  van sobre `Animated.View`, no sobre un elemento SVG.
- **Todos los `translateY` escritos a mano en la casa están bien**: los censé y
  los 6 vivos están dentro de un array `transform`.

⇒ el prop no sale de un literal nuestro: **algo está aplanando un `transform`**
y dejando `translateY` como prop suelto sobre un `View` (que en RN-web es un
`div`). Los dos que quedan en el `(tabs)/_layout.tsx` son **`BarraTabs`** y
**`PresenciaCoach`** — y ahí la bisección la hacés vos mucho más rápido que yo,
comentando uno y recargando.

## Por qué importa aunque sea sólo un warning

En nativo esto **no existe** (no hay DOM), así que el ojo del emulador no lo ve
nunca. En web deja un atributo basura en el `div` y, sobre todo, **pinta un
toast rojo de error encima de la UI en dev** — que es como apareció: tapando el
pie de la pantalla de una mascota. *Un aviso que se ve como un error entrena a
ignorar los errores.*

## Cómo reproducirlo

```
cd apps/cliente
EXPO_PUBLIC_SUPABASE_URL=… EXPO_PUBLIC_SUPABASE_ANON_KEY=… npx expo start --web
```
⚠️ **Sin esas dos variables la app no arranca en web**: revienta con
`getClient: initApi() no fue llamado` y la pantalla queda en «This is taking
longer than usual». No es un defecto nuevo — es que el web dev no las hereda de
ningún lado.
