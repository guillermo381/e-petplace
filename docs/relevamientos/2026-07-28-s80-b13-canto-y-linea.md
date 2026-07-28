# S80-B13 · ① la medición del canto (tercera vuelta, SIN curar) + ② el boceto de la línea viajera

## ① EL CANTO — lo medido, esperando el screenshot del founder

**1. El degradado es POR FILA, no por lista** (literal `FilaCita.tsx`:
cada fila monta SU `LinearGradient` de su propio alto, `[color →
33%]` top→bottom). En filas contiguas dentro de la misma Tarjeta el
resultado es el SERRUCHO que la vara anticipa: 100%→33% | 100%→33% |
100%→33% — el tono se reinicia en cada borde de fila.

**2. El clipping en las curvas — el literal:**
```
Tarjeta.tsx:101  borderRadius: radius.lg,  // 16 fijo — decisión B1: cards 16
Tarjeta.tsx:103  overflow: relleno === 'ninguno' ? 'hidden' : undefined
```
El canto ocupa x∈[0,3] y la curva de radio 16 atraviesa esa banda: en
x=0 la superficie empieza en y=16, en x=3 en y≈6.7. **El borde visible
del canto SIGUE el contorno (el recorte ES la silueta), pero su primer
píxel aparece entre ~7 y 16px debajo del vértice de la tarjeta** — el
ojo lo lee como "cortado antes de llegar arriba". Simétrico abajo.

**3. LA PROPUESTA (decide el founder con el screenshot):** en LISTA
CONTIGUA el canto pasa a **SÓLIDO** (tono pleno, sin degradado por
fila) — el serrucho muere y el tono es continuo de la primera a la
última fila; la mordida de la curva queda como geometría natural de la
silueta (el sólido la disimula mejor que el degradado, porque no suma
un segundo gradiente al recorte). **El piso 33% de B3 NO se deroga: se
re-acota a su origen — la TARJETA SUELTA de la lámina**, donde el canto
es voz de UNA unidad y el degradado respira. Si se firma: el cambio es
UNA línea en `FilaCita` (packages/ui) y todas las pantallas lo heredan
— el molde trabajando.

## ② EL FILTRO — boceto de LA LÍNEA VIAJERA (enmienda de ley: boceto y gate, cero composición)

**El veredicto que la dispara:** la huella sola no lee (founder, en
dispositivo, sobre la cura B12-④).

**El porqué DECLARADO de la enmienda:** la Ley 6 (§2.6) se escribió
para la barra de TABS — un contexto donde siempre hay UNA activa, las
opciones son 3-4 mundos fijos y la huella tiene el peso de la
navegación raíz. **El filtro es OTRO trabajo:** "todos" es un estado
legal (en un tab bar no existe "ninguno"), las opciones aparecen y
desaparecen según la oferta activa, y el glifo compite con label +
avatar + insignias en el mismo techo. La huella que aparece informa
PERTENENCIA de capa, no POSICIÓN — y en un control de 4-5 opciones la
posición es lo que el ojo necesita primero.

**La anatomía propuesta:**
- Fila de segmentos como hoy (glifo 21px + label; target 44; a11y
  tablist/tab intactos). Sin riel, sin recuadro, sin pill — Ley 6
  intacta en lo que prohíbe.
- **UNA LÍNEA horizontal (2px, `radius.full` en las puntas) bajo el
  segmento activo, al ancho del CONTENIDO del segmento** (glifo+label),
  en el AA de la capa del oficio activo (`capaText.*` /
  `status.warningText`; en "todos": `text.primary`).
- **La línea VIAJA al cambiar de opción** — translateX + width animados
  con la física de la casa (`motion.duration.fast` +
  bezier(.32,.72,0,1)); §9.6 cumplido por construcción: se ve DE DÓNDE
  viene y A DÓNDE llega — el indicador ES origen→destino. Memorial:
  reemplazo directo, sin viaje (Ley 8).
- La huella del glifo activo SIGUE apareciendo (Ley 6 conserva su
  brazo); la línea agrega la POSICIÓN que faltaba. Si el founder juzga
  que con línea la huella sobra, se apaga en el mismo gate — un
  boolean, no un rediseño.
- Estados: 1 solo oficio → el filtro no se monta (regla vigente) ·
  cambio de oferta que remueve el segmento activo → la línea viaja a
  "todos" (el filtro ya resetea por dato).

**Estatus de ley:** esto NO entra por composición directa — es entrada
nueva del diccionario ("filtro de vistas con indicador de línea
viajera") y enmienda del alcance de la Ley 6 (tabs ≠ filtros). Boceto
→ gate founder → recién ahí píxeles (L-143: se firma sobre píxeles,
pero la LEY se enmienda con letra).

## ③ La lentitud restante

No se toca desde B: es la mitad wrapper (`uidActual()` de A13, gate
pendiente de A). Registrado, no perseguido.
