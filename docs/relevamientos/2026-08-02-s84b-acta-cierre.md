# S84 · PISTA B — ACTA DE CIERRE

**2 de agosto de 2026.** `packages/ui` + tokens + `scripts/`.
Cierre **SIN pasada de gate** — se difiere a S85 por decisión del founder.

Este documento guarda **lo que no se reconstruye leyendo el repo**: los
descartes con su número, los roces declarados, mis propias correcciones de
método, y lo que quedó sin firmar. Lo que sí está en el código (el qué y el
cómo) **no se repite acá** — vive en los JSDoc de cada pieza, que es donde
se lee al construir.

---

## 1 · EL CENSO DE IDIOMAS OCUPADOS — la medición que decidió tres glifos

Es lo más reutilizable de la sesión y no vive junto en ningún archivo.
**El idioma "rectángulo con renglones adentro" está ocupado CINCO veces** en
`Icono.tsx`:

| glifo | qué lo distingue |
|---|---|
| `presupuesto` | esquina doblada + dos renglones |
| `bitacora` | lomo de libreta + dos renglones |
| `caso` | carpeta (pestaña) |
| `pagos` | **billete**: rectángulo ANCHO con marcas verticales |
| `documento` | rectángulo ancho + **retrato** + dos renglones |

**Este censo mató al candidato obvio TRES VECES**, y las tres veces el
candidato era el que cualquiera habría dibujado primero:

1. **`contacto`** (B4) — iba a ser **la tarjeta de datos**. Cae: sería la
   cuarta del idioma. Ganó **el globo de diálogo**, que nombra el ACTO y no
   el canal (la sección agrupa teléfono · WhatsApp · correo · sitio, así que
   un auricular nombra uno y deja tres afuera).
2. **`documento`** (B20) — iba a ser **la cédula lisa**. La salva el
   **retrato**: es lo que separa una *identificación* de un papel cualquiera.
3. **`bancario`** (B21) — iba a ser **una tarjeta de débito**. Cae por lo
   peor: `pagos` **ya es** un rectángulo ancho con marcas, así que a 21px
   serían el mismo dibujo **y encima vecinos temáticos** — la peor colisión
   posible, porque la Ley 12 existe para que el ojo separe cosas que
   significan distinto. Ganó **el edificio con columnas**, que no tiene un
   solo pariente en el registry.

**El corolario, por si sirve de vara:** cuando un glifo nuevo cae en un
idioma ocupado, lo que hay que buscar no es otro objeto — es **el rasgo que
lo saca del idioma** (el retrato, el dentado, la cola del globo).

### Los candidatos que murieron en su gate, con su porqué

- **`contactoOndas`** (tres arcos desde un punto) — el founder eligió el
  globo porque **§1 manda dibujar el OBJETO del oficio: el globo es un
  objeto, "el alcance" es una idea.** Su riesgo declarado —confundirse con
  `ayuda` a 21px— quedó como acierto de haberlo dicho.
- **`documentoSello`** — sigue **VIVO en el registry sin firma**: nació como
  candidato B de `documento` y el founder eligió A. **No lo retiré porque
  nadie me lo ordenó**, pero es deuda: un candidato perdedor que sobrevive
  se vuelve una opción que alguien va a creer disponible. Ver §5.

---

## 2 · EL DESTELLO: EL OCRE, Y EL ROCE QUE LA FIRMA ACEPTA

La firma no eligió un color: **cerró la pregunta de qué ES el destello**,
abierta desde que el glifo nació. Las tres variantes contestaban cosas
distintas — y eso es lo que hay que recordar, no los hexes:

| variante | qué AFIRMABA | claro | oscuro |
|---|---|---|---|
| magenta de capa | **es MARCA** (lo que §5.1 implica, lo que §15b.1 permitiría) | 5.28 | 5.13 |
| teal del oficio | **es CONTROL FUNCIONAL** | 5.42 | 11.93 |
| **ocre (firmado)** | **se viste del COMERCIO** | 5.72 | 9.73 |
| oro #FCBC1D | — | **1.59 ✗** | 10.79 |

**El oro se cayó por medición, no por gusto**, y su causa es de origen:
nació como **relleno** de CTA contra el papel del CLIENTE con label en tinta
encima; acá se le pedía ser **tinta sobre papel**, el trabajo inverso. **Un
color que sirve en un solo tema es media opción.**

**⚠️ EL ROCE QUE LA FIRMA ACEPTA, y que nadie debería redescubrir con
sorpresa:** el ocre es la capa del **CONSUMO** — la misma que yo había
descartado para `contacto` con el argumento *"un canal de contacto no vende
nada"*. **Un destello de IA tampoco vende.** La firma dice que igual se
viste así, y es del founder. Queda escrito para que el día que alguien
pregunte "¿por qué la IA está en la capa del comercio?" la respuesta exista.

**Y el hallazgo de alcance que la firma necesitaba:** cambiar la capa **no
se veía**, porque los tres consumidores montaban `registro="tinta"` con
color explícito. **Mi mitad era letra sin pantalla.** Lo cerró C con una
palabra (`registro="aa"` en el escriba). Sin ese aviso, el founder habría
mirado el botón y no habría visto cambio.

---

## 3 · EL MURO: LA SUPERFICIE QUE NINGUNA REGLA PODÍA VER

**El diagnóstico que vale más que el botón:** el muro del oficio es la
**única superficie del producto que no sale del tema** — vive en
`apps/prestador/components/techo-oficio`, o sea **en una app**. Todo el
barrido de contraste enumera slots del tema, así que el muro era invisible:
**`accent.cta` del oficio y el muro son el mismo hex** ⇒ contraste **1.00**,
y pasaba en verde porque nadie medía ese par.

Es la misma familia que caché en S83 cuando `verify:contrast` no medía los
temas de oficio: **allá una CASA ciega, acá una SUPERFICIE ciega.**

Se pudo mecanizar **sin cruzar territorio** porque el **color** del muro es
un token de `palette`; lo que vive en la app es su **aplicación**, no su
valor. Los doce pares quedan en el barrido; los tres que importan:

```
lightOficio  accent.cta/MURO ...... 1.00   ← invisible
darkOficio   accent.cta/MURO ...... 6.57   ← legible
             text.primary/MURO .... 2.92   ← bajo AA
papel pleno/MURO ...... 5.51 claro · 9.61 oscuro   ← el par FIRMADO §15b.2
```

**Invisible en dos temas de tres y legible en el otro** es el defecto que un
gate en un solo tema no encuentra. Por eso el número tenía que existir.

**⚠️ Lo que esa regla NO prueba, y conviene que se lea así:** mide los
números de lo que *podría* pintarse sobre el muro; **no prueba que ninguna
pantalla pinte ahí el color vedado.** Eso exigiría ver el código que monta,
y el muro se recibe por prop. Lo que cambió es que **el 1.00 ahora se ve en
vez de no existir.**

---

## 4 · MIS CORRECCIONES DE MÉTODO — cinco, y las cinco de la misma familia

Todas producen **un número creíble y falso**. Ninguna la habría encontrado
releyendo el comando: el comando estaba bien.

1. **El árbol viejo (B11).** Frené una construcción con *"la columna no
   tiene un solo lector"* — cierto, con la rama **40 commits detrás de
   main**, donde esa columna ya estaba muerta y su reemplazo tenía lector
   vivo. **Es la candidata de B12** y la única de las cinco cuyo punto ciego
   no está en el instrumento. **La cazó la mesa, no yo** — desde adentro del
   freno no había nada que mirar.
2. **El parseo que leía comentarios (B20).** Mi contador de glifos dio 35 vs
   33: la diferencia eran **dos nombres citados dentro de mis propias
   lápidas**. **L-170 exacta, cometida por mí, sobre el mismo contador con
   el que había corregido un conteo ajeno dos tandas antes.**
3. **`$?` después de un pipe (B8).** Reporté `EXIT=0` con el tsc en rojo.
   Causa raíz: **`tsc` no dice nada cuando pasa** (0 bytes, exit 0), así que
   "pasó" y "lo truncó el `head`" **se ven igual**. L-192 invertida: un
   **éxito** silencioso.
4. **El `&&` que cortó (B19).** Un `grep -c` devolvió 0 → exit 1 → la cadena
   cortó antes del lint, y leí un `/tmp` de la corrida anterior. **Lo destapó
   `verdicto.mjs`, recién nacido.**
5. **`tema === 'dark'` (B19).** Dejaba a `darkOficio` con el muro claro —
   **el mismo error de alcance que la regla venía a cerrar, un piso más
   abajo.** Lo vi **leyendo la tabla, no escribiéndola**.

**Lo que dejan construido:** `scripts/verdicto.mjs` — imprime el verdicto
(sobrevive a cualquier pipe) **y el ancla** (rama, HEAD, árbol sucio,
commits de atraso, con su punto ciego dicho: refs locales sin fetch).
**Un verdicto sin ancla dice si el código pasa, no CUÁL código pasó.**

---

## 5 · LO QUE SIGUE SIN FIRMAR, DE LO MÍO

**Nada de S84-B tuvo gate en dispositivo.** Es la deuda madre de este cierre.
Lo que sigue, en orden de riesgo:

| qué | qué hay que mirar | por qué no lo puedo cerrar yo |
|---|---|---|
| **El carrusel circular** | que **no tironee** en el borde · que el punto marque la foto **real** · que el logo **no tiemble** al reposicionar | el tirón es observable en dispositivo, **no medible desde el repo**. Declaré que no podía afirmarlo y el founder lo cerró en la pasada anterior — pero **el punto y el logo no se reportaron** |
| **`MapaZona`** | que la zona **NO se lea como un domicilio** | el número dice que el círculo se ve; no dice qué comunica |
| **`Boton acento`** | que se note **sin competir** con la foto | fue el rechazo que lo parió; ningún contraste lo dice |
| **`Boton superficie="muro"`** | composición | 5.51 dice que **se puede leer**, no que esté bien compuesto |
| **Los tres glifos comerciales** | que **se distingan ENTRE SÍ** a 21px | un set de hermanas se rompe **por adentro** antes que por afuera |
| **`FichaPrestador`** | nunca se gateó entera | — |
| **El agua 0.045** | firmada en pantalla ✅ | (cerrada) |

**Decisiones abiertas que no son mías:**

- **La huella en documentos del NEGOCIO.** La resolví **por censo** para las
  tres juntas (la llevan, chica y al costado, **no como sujeto**), porque los
  glifos de dominio la llevan y los de control no. **Pero nadie la firmó.**
  Si alguna se lee como "documento de la mascota", ahí falló — y quitarla es
  una línea en cada una.
- **D-173** (¿la identidad del prestador se exhibe o se oculta?). Sin firma.
  `FichaPrestador` **da por decidido** el modelo exhibido: portada + firma +
  historia **es** ese modelo. La pieza no lo resuelve y —por la enmienda de
  método— tampoco lo espera. **Escrito para que nadie la cite como
  precedente de algo que nadie firmó.**
- **`documentoSello` sigue vivo sin firma** (§1). Retirarlo o adoptarlo es
  decisión, no higiene.
- **`sinCaja` es un nombre viejo**: la variante **tiene** superficie
  (`accent.sinCaja`, slot que S82-B r12 le dio para darle presencia). Por eso
  el botón nuevo se llama `acento` y no `primarioSinCaja`: **preferí un
  nombre sin colisión antes que el nombre exacto adentro de una colisión.**
- **El rename de `capturaFoto.tsx`** (ya hace video): **no se hace**, con
  costo medido —3 imports + **7 menciones en prosa**, tres en `apps/`— y
  condición escrita: **viaja con la próxima tanda que ya toque esos archivos
  por otra razón.** Descarté la condición "esperar un tercer consumidor de
  video": nunca se vuelve más fácil de cumplir, solo más incómoda de mirar.
  **Una condición de muerte tiene que poder cumplirse, no solo posponerse.**

---

## 6 · LO QUE MEDÍ Y NO VIVE EN NINGÚN COMMIT

- **La galería no es un instrumento de gate**, y por eso murió como tal. Su
  entrada existe, es visible y no está tras `__DEV__` — pero es **la última
  fila de una pantalla de 641 líneas** y se llama *"Galería de tokens"*, que
  es vocabulario **nuestro**. **La barrera es el nombre y el lugar, no la
  existencia.** Propuse renombrarla a *"Láminas de gate · para firmar"* (2
  líneas, archivo de C); **no se ejecutó**.
- **`v_prestadores_publicos` (18 columnas) tiene CERO lectores** en el
  monorepo. Lo que la familia ve sale de `prestadores` por RLS. **Medir la
  anatomía contra esa vista es medir contra un contrato que nadie honra.**
- **La divergencia de conteo con C** (él 32 glifos, yo 33): la diferencia era
  `contacto`, nacido **después** de su censo. **Los dos números eran
  correctos en su momento** — el caso de B12 en chiquito.
- **`liquidaciones` no existe** en el registry, aunque el nombre suene
  plausible.
- **El picker devuelve `duration` y `fileSize`** para video. Los expongo como
  **null honesto**: el dato llega, pero **garantizarlo** sigue necesitando el
  módulo (D-617). **Un null no significa "dura poco" — significa "no sé"**, y
  quien valide el ≤30 s con esto se juega a que el null no aparezca.

---

## 7 · PARA MI PRÓXIMA INSTANCIA

1. **Nada de S84-B se vio en un teléfono.** Si la pasada de S85 encuentra
   algo, **no reabras la pieza: entra como cura anotada.** Y si el carrusel
   salta en el borde, **(a) paginado está a un commit** — su código vive en
   `8813cbc` y su lápida explica por qué se descartó.
2. **Corré `node scripts/verdicto.mjs` antes de afirmar cualquier número**, y
   **leé su primera línea**. Si dice *"N commits DETRÁS de main"*, traé main
   **antes** de medir. Esa línea existe porque el error que previene me costó
   un freno equivocado.
3. **Antes de dibujar un glifo, leé el censo de la §1.** El candidato obvio
   cayó tres veces seguidas por el mismo idioma.
4. **Antes de crear una pieza, medí si la casa ya la resolvió.** Dos veces
   esta sesión la respuesta existía: `superficie="muro"` la tenía
   `LogoNegocio`, y el SVG de destellos era `CHISPA`. **L-175 no es una
   preferencia: es lo que evita dos marcas de IA.**
5. **Cuando declares que algo no se puede afirmar, decilo en el commit.** Dos
   veces esta sesión eso fue lo correcto (el tirón de Android, el corpus cero
   del `$?`), y las dos veces el "no se puede, y por esto" valió más que una
   afirmación cómoda o una regla fabricada.
