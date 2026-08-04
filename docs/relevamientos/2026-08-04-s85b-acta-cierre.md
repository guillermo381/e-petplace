# S85 · PISTA B — ACTA DE CIERRE

**4 de agosto de 2026.** `packages/ui` + tokens + `scripts/` + `.githooks/`.

Guarda **lo que no se reconstruye leyendo el repo**: los diagnósticos que
costaron, los frenos con su literal, y lo que quedó sin firmar. El qué y
el cómo viven en los JSDoc de cada pieza, que es donde se leen al
construir — acá no se repiten.

---

## 1 · EL PATRÓN QUE GOBERNÓ LA SESIÓN: probado en una sola configuración

Es lo más reutilizable y no vive junto en ningún lado. **Seis defectos, la
misma forma**: código correcto, verde, que se ve bien **en la pantalla
donde se lo miró** y miente en la de al lado.

| qué | se veía bien en | mentía en |
|---|---|---|
| el **▶** sobre el póster del clip | cuando el póster no reproducía | cuando la posición pasó a reproducir |
| el **renglón del nombre** | con la insignia montada al lado | sin cohorte: el nombre solo, demasiado pesado |
| la **insignia junto al nombre** | con nombres cortos | con nombre largo: `flexWrap` la tiraba abajo |
| el **valor de TresNumeros** | mirado solo | al lado del nombre: los dos en `xl`=28 |
| la **huella de `negocio`** | en la barra (wrapper nuevo) | en celda: quedó en posición de marca |
| `capaText` **sobre el muro** | en papel | sobre el muro: **1.03, invisible** |

**Ninguno rompe un build. Ninguno lo ve un lint.** Los seis se descubren
mirando **el caso vecino**, no el que se está construyendo.

> **La pregunta que los caza es siempre la misma: «¿en qué configuración
> esto se ve mal?» — y hay que hacérsela ANTES de que el founder la
> conteste con el dedo.**

---

## 2 · L-198, Y SU FRONTERA (que es lo que evita usarla al revés)

Nació de un error mío: bajé la composición de la cohorte de las apps a
`FichaPrestador` con el argumento correcto, **y la dejé esperando en la
puerta de al lado** — el techo monta `Insignia` directo, sin pasar por la
ficha. Lo cazó C.

**La pregunta no es «¿quién usa la pieza que estoy tocando?» sino «¿quién
más va a necesitar esta misma frase?» — y esa se contesta mirando el
DATO, no el componente.**

**⚠️ SU FRONTERA, o se usa para justificar lo contrario:** el radio corto
y el radio largo son los dos errores. Esta casa ya nombró el segundo —
*una pieza sin consumidor es deuda*, y por eso hoy **no** construí la
barra de progreso. Lo que los separa no es el tamaño del radio: **es que
la pregunta se conteste midiendo, no imaginando.**

- «¿Quién más necesita esto?» → **se mide** (dio dos: ficha y techo).
- «¿Quién podría necesitarlo algún día?» → **se imagina**, y ahí nace la
  prop que decora.

**La señal de que uno se pasó de largo es concreta: si al listar los
consumidores el número es CERO, no es alcance corto — es una pieza sin
dueño.**

---

## 3 · EL CENSO CAMBIÓ DE FUNCIÓN

Dejó de ser defensa contra colisiones y se volvió **forma de encontrar lo
ya resuelto**. Tres veces, y **las tres el trabajo BAJÓ al medir**:
`MarcaEleccion` en vez del clon · `accent.control` que ya resolvía por
casa · la mitad de la familia temporal (`hoy` ya era el calendario,
`todos` ya se decía con la Huella).

**⚠️ Y la carga que eso implica, que no es de quien mide:** las tres veces
funcionó **porque alguien había dejado escrito el porqué** —
`MarcaEleccion` nombraba a `FiltroPills` como consumidor en su propio
JSDoc. **El censo no encontró cosas: encontró notas.** La conclusión útil
no es *"censar antes de construir"* sino **"escribir el porqué al
construir es lo que hace que el censo del próximo sirva"**.

**Un censo es una foto, no una sentencia.** La roseta murió como glifo de
21px y volvió como pieza de vitrina: cambió el tamaño y cambió el
vecindario (`hoy` dejó de ser un sol). Se reabre por medición, no por
insistencia.

---

## 4 · MIS ERRORES, con lo que enseñan

1. **El guard que escribí ayer me gritó la razón equivocada a mí.**
   Curé cinco mensajes mentirosos y el mío nuevo decía «esto se rompió en
   quien lo CONSUME» — una causa que no verifica (mide el árbol, no mi
   cambio). **La disciplina no se aprende una vez.**
2. **Escribí la receta correcta en el commit que rompió el glifo** («la
   receta ya existe: es la de `IconoMascotas`») y **la apliqué al wrapper,
   no al registry**. **Una receta escrita y no aplicada es exactamente lo
   mismo que no tenerla — y encima da la sensación de estar cubierto.**
3. **TDZ en el ancla del corpus**: puse la declaración debajo del bloque
   que la usa. Lo cazó **correrlo**, no releerlo.
4. **Reverse-apply de una cura commiteada de A en el árbol compartido**,
   con C trabajando. Restaurado en <1 min, nada perdido. **Las pruebas de
   esa clase van en worktree o repo aparte.**
5. **Dos mediciones mías se contradijeron** (greps sobre rangos frágiles).
   → **Un instrumento que da dos respuestas distintas a la misma pregunta
   no se promedia: se cambia.** Imprimí el contenido.

---

## 5 · D-645 · LOS TRES CLONES DEL REGISTRY — y **ya divergieron**

**Los paths, exactos:**

| # | path | trazos | qué dice de sí mismo |
|---|---|---|---|
| ① | `apps/cliente/src/components/iconos-tabs.tsx` | 6 | el ORIGINAL (S53). Es **el precedente que los otros citan** |
| ② | `apps/prestador/src/components/iconos-tabs.tsx` | 7 | `:4` *"Geometría COPIADA LITERAL"* · `:5` *"(precedente S57: IconoCuenta viajó igual desde el cliente)"* · `:11` **"🔴 DEUDA DECLARADA: ESTE ARCHIVO ES UN CLON DEL REGISTRY"** |
| ③ | `apps/prestador/src/components/iconos-oficio.tsx` | 13 | `:4` *"Geometría COPIADA LITERAL del set FIRMADO en `packages/ui/Icono.tsx`"* |

**EL MECANISMO, que es lo que hay que entender antes de curar:** nadie
copió a escondidas. **El primer clon se volvió la autorización del
segundo**, y el segundo la del tercero — cada uno citó al anterior y quedó
en regla. Es la misma forma que las dos letras firmadas que se
contradicen: *cualquiera cita la que le conviene y está en regla*, solo
que acá lo que se hereda es una copia.

**🔴 Y NO ES TEÓRICO — YA DIVERGIÓ, medido hoy:**

```
cuenta:  registry .......... cy=8.2            (persona: cabeza + hombros)
         barra PRESTADOR ... cy=8.2         ✅  en sync
         barra CLIENTE ..... cy=5.1 + 13.8  🔴  la chapita VIEJA
```

El founder firmó la persona **ayer**. La divergencia no tardó un mes:
tardó **horas**. Y el clon del cliente todavía declara en su cabecera
*"cero figuras humanas (§2.4)"* — una regla que la mesa **acotó** ese
mismo día.

### LOS DOS EJES que obligaron las copias

Es la respuesta a *por qué* nadie consumió el registry, y lo que `Icono`
tiene que aceptar para que las tres mueran:

1. **EL COLOR DEL TRAZO** — la barra lo entrega ya resuelto por estado
   (activo/inactivo). `Icono` hoy lo deriva de `registro` + capa: **no
   admite un color entrante**.
2. **LA HUELLA CON TRES ESTADOS** — y éste es el que lo hace no-trivial:
   · en la mayoría, la huella **APARECE** al activarse (reposo = solo trazo);
   · en `negocio` y en el `datos` viejo, la huella **ES** el glifo y por
     tanto **RECOLOREA** en vez de aparecer;
   · en memorial degrada.

**⚠️ Por eso un `activo: boolean` NO alcanza y sería la cura equivocada:**
aplanaría justo la distinción entre *aparecer* y *recolorear*, que es la
que R22 protege — un glifo que ya ES huella no puede recibir otra encima.

**Alcance de la cura (S86): los TRES, no dos.** El tercero no es un caso
aparte: **es la prueba de que el hueco es del registry y no de quien
copia.**

---

## 6 · LO QUE QUEDA SIN FIRMAR, Y NO SE HEREDA COMO HECHO

**Nada de S85-B se vio en un teléfono salvo lo que el founder gateó en
019fcabf** — y ese gate corrió sobre un OTA **anterior** a los últimos
commits, así que sus tres últimos reportes eran fantasmas de un árbol
enterrado (medido: registry y barra en sync en los tres).

Espera ojo: la agenda contra `preferencias` · la insignia sin palabra
sobre el muro · la familia temporal **contando barras a 21px** (si no se
separan, `mes` cambia de marca — **no se engordan las barras**) · la rueda
y los chips en la casa verde · el papel al 5% · `TresNumeros` re-escalado.

**Decisiones abiertas que no son mías:**

- **§2.4 espera su depósito CON FRONTERA** — se acotó, no se derogó:
  *humanos = manos u objetos EN LA ICONOGRAFÍA DE CONTENIDO*, excepción en
  la barra de tabs. Si se deposita como derogación, se pierde la mitad que
  la sostiene.
- **`cuenta` del CLIENTE** quedó con la chapita vieja (§5). Alinearla es
  decisión de alcance, no higiene: nadie firmó que la excepción cubra las
  dos barras.
- **R12 sigue con su regresión abierta declarada** — el par de
  `darkOficio` a 4.40. Que el founder no perciba el tinte es dato sobre
  **la cura**, no sobre el defecto.
- **`papelTapizOficio` al 5% tiene su techo escrito**: a 6% cae
  `status.dangerText` (margen 0.07). Más verde **no es mover ese número**.

---

## 7 · PARA MI PRÓXIMA INSTANCIA

1. **Corré `node scripts/verdicto.mjs` y leé su PRIMERA línea** antes de
   afirmar cualquier número. Si dice "N commits DETRÁS", traé main primero.
2. **Antes de crear una pieza, medí si la casa ya la resolvió** — tres
   veces esta sesión la respuesta existía.
3. **Antes de dibujar un glifo, leé el censo de idiomas** (§1 del acta de
   S84). El candidato obvio cayó cinco veces seguidas.
4. **Cuando cures un mensaje de guard, revisá el de al lado** — el radio
   corto es mi error recurrente y aparece de tres formas distintas.
5. **Un reporte de campo se relee buscando qué lo habría producido**, no
   se traduce a la causa que uno ya tenía en la cabeza. El *"se ve raro
   debajo del nombre"* no era ubicación: era `flexWrap`.
6. **El gate del founder puede correr contra un OTA viejo.** Antes de
   curar lo que reporta, **medí si ya está curado** — pasó tres veces
   seguidas al final de esta sesión.
