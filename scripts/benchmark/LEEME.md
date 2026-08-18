# Harness de medición — e-PetPlace

Mide **geometría real del DOM renderizado**. No estima nada: si no puede medir algo, devuelve `null`.

## Por qué existe
El entorno donde se escribió `BENCHMARK-TIENDA.md` tiene bloqueado por red el acceso a los
sitios de los referentes. Las proporciones con número no se podían medir desde ahí, y la regla
del encargo es que un número inventado es peor que ninguno. Este harness corre en **tu** máquina,
donde los sitios sí cargan, y llena esas tablas con números medidos.

## Arranque
```bash
npm i playwright && npx playwright install chromium
./correr.sh                 # solo lo que anda sin sesión (desatendido)
./correr.sh --con-pausa     # todo, parando para que acomodes cada pantalla
./correr.sh --solo rappi    # un referente
```

## Cómo funciona la pausa
Muchas superficies (carrito, dirección, seguimiento) necesitan sesión, dirección cargada o un
pedido en curso. Con `--pausa` el navegador se abre visible, vos acomodás la pantalla —logueás,
ponés la dirección, agregás al carrito— y cuando está como la querés medir, apretás **ENTER** en
la terminal. Recién ahí captura y mide.

La sesión se guarda en `./perfil-navegador`, así que **no tenés que loguearte de nuevo** en la
próxima corrida.

## Si no detecta las tarjetas
La autodetección busca elementos repetidos que contengan imagen y algo con forma de precio. Si
falla, abrí el inspector, copiá el selector de la tarjeta y pasalo a mano:
```bash
node medir.mjs --nombre chewy --superficie vitrina \
  --url "https://www.chewy.com/b/dog-food-386" \
  --selector "[data-testid='product-card']" --headed
```

## Qué mide
| Superficie | Qué devuelve |
|---|---|
| `vitrina` | foto/nombre/precio/control: bounding box, área, font-size. Proporciones foto÷tarjeta, control÷tarjeta, precio÷nombre. Densidad: productos en la 1ª pantalla y alto de cromo antes del primer producto. Área táctil vs 48 dp. |
| `ficha`, `carrito`, `direccion` | Composición de la primera pantalla: cada bloque con su alto y su % de pantalla. |
| `seguimiento` | Alto del mapa vs alto de la banda de estado, en px y en % de pantalla. **Este número no lo publica ninguna de las seis plataformas.** |

## Salida
- `salida/capturas/<referente>-<superficie>.png` — nombradas por lo que muestran
- `salida/datos/<referente>-<superficie>.json` — medición completa
- `salida/tabla-proporciones.md` — tabla lista para pegar en el benchmark

## Verificación del propio harness
`fixture/tienda-demo.html` es una maqueta de geometría conocida (tarjeta 176×280, foto 176×176,
nombre 14 px, precio 18 px, control 44×44, cromo 200 px). Sirve para comprobar que el medidor no
miente:
```bash
python3 -m http.server 8099 --directory fixture &
node medir.mjs --nombre MAQUETA --superficie vitrina --url http://localhost:8099/tienda-demo.html
```
Debe devolver foto 62,9 %, precio÷nombre 1,286×, cromo 200 px. Si da otra cosa, el medidor está roto.

## Advertencia de método
Esto mide **web móvil**, no la app nativa. Para catálogo y proporciones suelen coincidir en
intención, pero **no son la misma superficie**. Cualquier número que salga de acá se declara como
"medido sobre web móvil", nunca como "medido en la app".
