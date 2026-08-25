# ⬇️ BLOQUE PARA PEGAR AL FINAL DE `apps/cliente/assets/marcas/PROCEDENCIA.md`

> **C: pegá desde la línea de abajo, sin reescribir lo que ya está.** El registro
> de las cinco tarjetas de S101-D sigue siendo verdad y no se toca.

---

## Marca DEUNA — assets VENDORED

> **Depositados:** 24-ago-2026 · sesión **S105-B** · reparto firmado por el
> founder: **B produce, C monta**.
> **Fuente:** manual de marca oficial de Deuna, alojado en Corebook
> (`https://my.corebook.io/deuna`). **Acceso por link privado en poder del
> founder — el token NO se registra acá ni en ningún archivo del repo.**
> **Bajados por:** el founder, del Corebook oficial. **Fecha:** 24-ago-2026.
> **Versión de la arquitectura de marca vista en el manual:** *14 de abril 2025*.

| archivo | qué es | nivel en su manual | lienzo = cuerpo | aspecto |
|---|---|---|---|---|
| `ic_deuna.png` | wordmark `deuna!` | **N1 — marca principal / ecosistema** | 1583×418 | **3.787** |
| `ic_deuna_isotipo.png` | isotipo `d!` | N1 (variante) | 468×420 | **1.114** |

### Byte-idénticos al original — verificado, no afirmado

**No se redibujó, no se recortó, no se resampleó, no se recomprimió.** Los dos
archivos son copia exacta de lo que entregó el proveedor:

```
ic_deuna.png          sha256 c476c26006c186c5…
ic_deuna_isotipo.png  sha256 c29721a65b127159…
```

*Rige la misma orden de mesa que las cinco tarjetas: **son marcas registradas, el
archivo del proveedor es la fuente de verdad**. Un logo redibujado a ojo se lee
como error, no como marca.*

### El cuerpo, medido por decodificación de alfa

**Los dos vienen sin un solo píxel de padding** — el cuerpo llena el lienzo
exacto. Se midió decodificando el canal alfa, **no comparando lienzos**: es la
ley que la casa ya se cobró una vez (S104-B declaró *«ninguno de los dos assets
es el isotipo»* comparando lienzos, y era falso). **El instrumento se validó
antes de usarlo** contra un caso de resultado conocido —el splash del prestador,
245×168— y lo reprodujo exacto.

⇒ Se le pasan `w` y `h` tal cual, igual que el `viewBox` de cada SVG.

### 🔴 SON PNG, NO SVG — y por qué eso importa

El proveedor entregó raster. **No hacen falta `@2x`/`@3x`**: el wordmark tiene
1583 px de ancho y se dibuja a 44 dp, así que a densidad ×3 sobra resolución por
un factor de 12 — siempre downsamplea.

**Si Deuna entrega SVG, se reemplaza y la rama de PNG muere**: el pipeline
vectorial ya existe (`metro.config.js` + `react-native-svg-transformer`) y es
mejor. Se pidió; al depositar esto no estaba.

### Colores oficiales — medidos de los archivos

| color | hex | de dónde |
|---|---|---|
| morado Deuna | **`#4C1D80`** | **100 % de los píxeles opacos** del wordmark y del isotipo |
| verde Deuna | `#008081` | el chip «Negocios» del lockup de producto |

### 🔴 TAMAÑO MÍNIMO Y ÁREA DE RESERVA — respuesta directa del proveedor

**Fuente: grupo de soporte de Deuna, 25-ago-2026** (canal y fecha declarados; no
sale de sus láminas sino de una consulta escrita).

| | impreso | digital |
|---|---|---|
| **versión principal** (logotipo `deuna!`) | 1,9 cm | **50 px** |
| **versión símbolo** (isotipo `d!`) | 0,5 cm | **16 px** |

**Área de reserva:** *1X mínimo a cada lado, donde **X = el grosor total del
punto del signo de exclamación** (tanto en el logotipo como en el símbolo).
Ningún elemento gráfico, fotográfico, tipográfico o de textura invade ese
espacio.*

**X medido de los assets** por componentes conexas sobre el canal alfa: el punto
es **un círculo perfecto** (aspecto 1.00, llenado de elipse 0.989) de **84 px** en
el isotipo y **83 px** en el wordmark — *el proveedor es consistente consigo
mismo*. En la caja del set, **X = 4,400 dp**.

⇒ **El isotipo con su resguardo entra en la caja de 56×32, y el alto manda:
30,80 de 32, con 0,60 dp de holgura por lado.** ⚠️ **`ALTO_LOGO` no baja de 32,
`CONTENIDO_ALTO` no sube de 22, y nada más se dibuja dentro de esa caja.**

### 🔴 REGLAS DE USO QUE SU MANUAL EXIGE

De su lámina de usos sobre fondo, que marca cada combinación explícitamente:

| fondo | logo | veredicto |
|---|---|---|
| blanco | morado | ✅ |
| morado `#4C1D80` | blanco | ✅ |
| verde `#008081` | morado | ✅ |
| verde `#008081` | blanco | ❌ **prohibido** |
| morado `#4C1D80` | verde | ⚠️ condicionado (nota al pie no disponible) |

⚠️ **`bg.hundido` NO sirve como fondo en oscuro ni en memorial**: el morado da
**1.74:1** y **1.51:1** respectivamente, y ninguno de esos fondos está entre los
que el manual autoriza. En claro (`#EDEBF5`) da 9.92:1 y sí sirve.

### La grafía del nombre — la fija el manual, no nosotros

- **`deuna!`** (minúscula, con exclamación) es **el LOGOTIPO**. Existe **solo
  como asset**: jamás se tipografía con nuestras fuentes.
- **«Deuna»** (capital inicial, **sin exclamación**) es **el nombre en texto
  corrido**. Es como su propio manual lo escribe en los niveles N3 y N4 de su
  arquitectura de marca: *«Promos Deuna», «Club Deuna», «Lealtad Deuna»*.
- **`deuna`** minúscula es clave de código del proveedor, no es voz.
- ⚠️ **`DeUna` no existe en el manual.** Es una forma que inventamos nosotros;
  no se escribe más. *(Al depositar esto vivía en 223 lugares del repo, ninguno
  en pantalla.)*

### Lo que NO se depositó, y por qué

**El lockup `deuna! Negocios` y las marcas de campaña.** «Negocios» es su
**producto para el comercio** —o sea, nosotros—; lo que la familia elige en la
pantalla de pago es pagar con **su** app, que es la marca principal N1. *Depositar
el lockup de Negocios sería ponerle a la familia el logo del lado del mostrador.*
