# Dos propuestas, escritas y **sin ejecutar**

Corridas sobre `9974f4c0`. Nada tocado. *Las excepciones de un consumidor
(`size.control`, `size.metrica`, `motion.coach`) quedan anotadas y sin tocar: se
deciden con el rediseño.*

---

# ① Las 5 sin consumidor y con edad — **y la pista soy yo**

El encargo decía *«preguntá a su pista antes de jubilar»*. **Se contesta sin
gastar a nadie: git dice quién las escribió, y son las cinco mías.**

| pieza | nació en | edad |
|---|---|---|
| `CierreEnCurso` | **S104-B** · «las tres piezas de la salida» | 14 d |
| `HiloDelDia` | **S107-B** · «las diez piezas del oficio» | 10 d |
| `SelectorRoster` | **S107-B** · idem | 10 d |
| `SelectorDestinoDonacion` | **S111-B** · «el destino de la donación» | 6 d |
| `BotonBajarAlFinal` | **S112-B** · «el chat de adopción» | 4 d |

## 🔴 Y la medición que cambia el diagnóstico: **su pantalla EXISTE y no las usa**

No están esperando que alguien construya su pantalla. Medido:

| pieza | pantallas de su tema | que la nombran |
|---|---|---|
| `CierreEnCurso` | 15 (paseo/salida) | **0** |
| `HiloDelDia` · `SelectorRoster` | 17 (guardería) | **0** |
| `SelectorDestinoDonacion` | 1 (checkout) | **0** |
| `BotonBajarAlFinal` | 15 (adopción) | **0** |

*Una pieza sin pantalla espera; una pieza cuya pantalla se construyó y eligió
otra cosa no espera: fue descartada sin que nadie lo dijera.*

## 🔴 Y no son cinco casos: son un PATRÓN, y el inventario lo mide

**5 con edad + 13 entregadas ahora = 18 piezas terminadas sin pantalla**, desde
al menos S104. *El problema que el rediseño tiene enfrente no es que falte una
dirección: es que se entregan piezas y las pantallas no las montan.* Y el número
del tablero lo dice más fuerte: **0 de 195 pantallas** usan el lenguaje nuevo.

## La propuesta, por pieza — **para decidir, no ejecutada**

**Ninguna se jubila hoy.** Ley 37 pide que muera lo que quedó sin razón, y acá
la razón puede estar viva del otro lado: *la pantalla pudo no montarla por
desconocimiento, no por decisión.* **Eso es una pregunta a C, no a mí.**

1. **`CierreEnCurso` (14 d)** — la más vieja y la que más se parece a un
   descarte real. **Propuesta: preguntar a C y, si su pantalla resolvió el
   cierre de otra forma, JUBILAR con lápida** (la forma de la casa: se declara,
   no se borra).
2. **`HiloDelDia` + `SelectorRoster` (10 d)** — nacieron juntas, con **ocho
   hermanas que sí se montaron**. *Que ocho de diez entraran y dos no, sugiere
   descarte y no olvido.* **Misma propuesta, en el mismo acto.**
3. **`SelectorDestinoDonacion` (6 d)** — su pantalla es **una sola** (el
   checkout). **Propuesta: esperar** — con un solo consumidor posible, seis días
   es poco y la donación puede estar detrás de una firma.
4. **`BotonBajarAlFinal` (4 d)** — **propuesta: esperar.** Cuatro días, y el
   chat de adopción sigue en obra.

⚠️ **Y la propuesta que vale más que las cuatro:** *el corte de Ley 37 no
debería ser la edad, sino la RESPUESTA.* Hoy una pieza puede quedar sin montar
durante semanas sin que nadie se entere, porque **nada mide «entregada y no
montada»**. El inventario ya lo calcula: **hacerlo un gate con baseline solo-baja
convierte 18 piezas invisibles en un número que se mira.**

---

# ② Los 45 hex en comentarios — **decaimiento, no incumplimiento**

**Cero colores aplicados a mano** (`R35` tiene razón). Los 45 son prosa que
describe tokens. Su modo de falla no es hoy: *el día que un token cambie de
valor, esos números pasan a mentir y ningún gate los mira.*

## La evidencia que la casa ya pagó

El canon registra que **la barra de tabs se pintó de NEGRO** en el gate 3 *«por
elegir el token LEYENDO su comentario»* — un rótulo que decía «el techo del
prestador» y **llevaba cuatro sesiones vencido**. No es un riesgo teórico: es un
defecto que ya ocurrió, por esta vía exacta.

## 🔴 Y hay un caso vivo hoy — aunque no es el que yo esperaba

Fui a buscar un comentario vencido y encontré algo **mejor y más incómodo**:

> `Isotipo.tsx:7` dice **`'tinta' → #1D1A2E`**, y **`palette.tinta` vale
> `#221E19`**.

**Verifiqué antes de cantarlo, y el comentario NO está vencido**: `#1D1A2E` es
`palette.textLight0`, vivo, *«también la "tinta" de CTA prestador»*. Y la propia
pieza ya se curó sola: su línea 73 declara la ambigüedad.

🔴 **Lo que eso destapa es peor que un comentario viejo: «tinta» nombra DOS
colores distintos, y lo único que impide confundirlos es prosa.** Tres archivos
lo aclaran a mano (`Isotipo.tsx:73`, `dosis.ts:13`, `light.ts:69`). *Un nombre
ocupado dos veces, desambiguado por comentarios, es la misma superficie de
decaimiento con otro traje — y es la que ya se cobró la barra negra.*

## Las dos curas, y **la segunda no reemplaza a la primera**

**(a) El comentario cita el TOKEN, no el número.** *«`text.primary` en claro»*
en vez de *«#1D1A2E»*. **Barato, y sobrevive a cualquier cambio de valor** —
pero sólo sirve para los comentarios que se escriban de ahora en más.

**(b) Un gate que los cotee — y es FACTIBLE, medido: 7 de los 45 ya citan
NOMBRE + HEX**, o sea que son cotejables automáticamente hoy:
· si el nombre existe como token ⇒ **su valor tiene que coincidir**;
· si no existe ⇒ el comentario **declara a qué se refiere** (como hace
  `Isotipo.tsx:73`), y eso también es medible.

⚠️ **Y su primer hallazgo ya está identificado sin escribirlo: «tinta»
resuelve a dos valores.** *Un gate cuyo primer rojo ya se conoce es un gate que
vale la pena — y uno cuyo primer rojo nadie puede nombrar, no* (`L-459`).

**Recomendación: las dos.** (a) frena lo nuevo, (b) mide lo viejo. *Sólo (a)
deja los 45 de hoy envejeciendo; sólo (b) los cuenta para siempre en vez de
vaciarlos.*
