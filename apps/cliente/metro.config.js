/**
 * Metro — configuración del cliente.
 *
 * 🔴 **ESTE ARCHIVO NO EXISTÍA** (S101-D, tanda 2). Hasta hoy la app corría con
 * el metro por defecto de Expo, sin config propia. **Se declara porque cambia
 * una premisa:** de acá en adelante, cada subida de Expo SDK tiene que mirar
 * este archivo — un default que se hereda solo deja de heredarse cuando alguien
 * escribe el archivo que lo reemplaza.
 *
 * **Su único trabajo:** que un `import Logo from './x.svg'` devuelva un
 * componente de `react-native-svg` en vez de una ruta a un asset. Nace para los
 * logos de franquicia de la puerta de pago, que son **marcas registradas de
 * terceros** y por eso **no se redibujan a mano** (orden de mesa): el `.svg`
 * vendored es la fuente de verdad y esto lo compila.
 *
 * Todo lo demás sale de `getDefaultConfig` **sin tocarse** — se agrega un
 * transformer y se mueve `svg` de asset a source. *Nada más: una config de
 * bundler que hace dos cosas es una config que nadie se anima a subir de
 * versión.*
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

config.resolver = {
  ...config.resolver,
  /* `svg` SALE de assets y ENTRA a source: si quedara en las dos listas, cuál
     gana depende del orden de resolución — y eso es justo la clase de detalle
     que funciona en una máquina y no en otra. */
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = config;
