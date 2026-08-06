# S88-B · ACTA DE CIERRE

> **Territorio:** `packages/ui` · tokens · el lint (`verify-diseno.mjs`,
> `verdicto.mjs`) — exclusivo · el censo de regresión (`verify-censo.mjs`).
> **Rama:** `pista/s87-b` (S87 y S88 corrieron en continuidad sobre la
> misma pista, con `origin/main` mergeado adentro al cierre).
> **HEAD al depositar:** el commit de este acta; el último de construcción
> es `7bd53e9` (el censo a verde por las curas del mundo).
> **Worktree:** `e-petplace-s87-B` · `verdicto.mjs` TODO VERDE ·
> WCAG 178/0 · `verify:censo` TODO VERDE · árbol limpio.

---

## 1 · LO CONSTRUIDO EN S88 (todo mergeado por A)

**Piezas (`packages/ui`):**
- **`CampoCodigo`** — las cajas por dígito (lámina firmada): `largo` por
  prop obligatoria, UN input invisible, saneo siempre, pie =
  `PieDeCampo`, a11y de un solo campo. Dos bugs cazados por smoke antes
  de un dedo: el ocultamiento a11y que escondía al propio input, y
  **`maxLength` que mataba el pegado** (trunca el crudo antes de sanear).
  Gate visual en emulador sobre `019fd467` con la medición para A: el
  valor llega **entero y exacto** al `onCambio` en dispositivo (tipeo
  `12ab34`→`1234` · pegado sucio→`87654321`) — **el off-by-one del saneo
  quedó descartado como causa del freno del founder.** Capturas en
  `scripts/capturas/s88-b-campocodigo/`.
- **`Badge`** (+`useEtiquetaBadge`) — el contador de novedades extraído
  de `BarraTabs` al ganar su 2º consumidor (el disparo de D-546); la
  barra pasó a consumirlo y su voz salió del hardcodeo al riel.
  **`forma="huella"`** (lámina de la campana): huella rellena, jamás
  número — ni en el píxel ni en el label; `accent.active` por casa,
  jamás rojo; n≤0 no dibuja; jamás anima. **`superficie="muro"`** (cura
  🔴 pre-gate, censo de C): `accent.active` del prestador en claro ES el
  hex del muro — sobre el muro la huella **invierte a papel** (§15b.2,
  precedente Insignia/Boton; cero pares WCAG nuevos). El par visual con
  el **defecto reproducido a propósito** quedó en la galería.
- **Glifo `campana`** al registry — objeto en trazo (geometría S43
  re-portada a 1.9), `huella` sin usar A PROPÓSITO: el par
  campana+novedad reparte la ley del único relleno. NO funda §6bis.

**Guards (`scripts/`):**
- **R32 — LA ESQUINA COMPARTIDA**: el guard de los 20dp que la lámina
  congeló y no existía. La aritmética MECANIZADA (gap ≥ 2×hitSlop, piso
  20 — ratificada por mesa como forma preferida de todo número de lámina
  que dependa de otro), el brazo L-197 (separación no legible → rojo
  pidiendo declararla), y **un brazo mudo cazado antes del estreno** (el
  regex de hitSlop no veía la ropa JSX `hitSlop={14}`). R31 declarado
  INTOMABLE en el propio archivo (número sin letra, protocolo A7);
  siguiente libre: R33.
- **El censo de regresión** (renombrado de `verify:premisas` por
  adjudicación, linaje en los headers): **P2 mutada** (de «no hay
  admins» a «los caminos curados por el helper y su límite intacto» —
  las dos caras sobre `empleado_roles`) · **P3** (contador del canon,
  138 vs real — A lo curó y volvió a verde solo) · **P4** (chips vs rol
  `profesional`, línea base 2) · **P5** (bundle servido × schema vivo,
  con el ensanche `exec`, el extractor con embeds-fuera tras cazar SEIS
  falsos en su estreno, y el rojo fundante `9e83b6d·tipo`) · **P1
  RETIRADA con lápida** en el cierre (abajo). El alcance se imprime
  siempre; «no pude medir» jamás degrada a verde.

**Relevamientos (3, depositados):** primitivas de preferencias (con la
medición de los 3 chips de canal contra la escala de fuente del SO — y
`medir-chips-canal.mjs` como instrumento en el repo) · P5
bundle-vs-schema · primitivas de la campana.

**Índices:** skill + `packages/ui/CLAUDE.md` re-medidos contra el objeto
(52 componentes · R17 leído del lint: 75 exportaciones · 43 glifos).

## 2 · EL CIERRE DEL CENSO — el instrumento vio el mundo mejorar

Al cierre, los tres rojos eran **premisas que la sesión dio vuelta, no
defectos** (tesis de A, ahora demostrada): ⚰️ **P1 retirada** — D-660/
§4ter volvieron intencional la llegada del no-titular y C reescribió
siete de los ocho sitios como lápidas; su eje se MUDÓ a P2 (P1 vigilaba
que nadie llegara sin diseño; P2 vigila que el diseño no se pudra) ·
el sitio de **P2** curado por S88-C con lápida propia · las **ocho
lápidas** clasificadas por sitio (una lápida no es una premisa: es la
prueba de que la premisa se curó). **VERDICTO CENSO: TODO VERDE — por
las curas, no por ablandarse.**

## 3 · LO QUE NO CERRÉ, explícito

1. **El estudio 10/12/14 de la huella y el glifo campana a 21px EN
   DISPOSITIVO** — bloqueado toda la sesión por regla 87 (5554 de C,
   5556 de D; ninguno mío). **Dueño: B pide el ojo del founder en S89**
   — ya vio la campana en las dos apps sin objetar tamaño; el estudio
   está servido en la galería para que el cierre formal sea una mirada.
2. **El residuo del retiro de P1**: `apps/prestador/src/i18n/es.ts:66`
   («rama inerte hoy, muere cuando la puerta abra» — y abrió en S75) es
   el único sitio que C no reescribió. **Dueño: C (S89)**; vive como
   EXENTA marcada en el registro y esa exención SE RETIRA al curarse.
3. **P5 v1 con sus límites escritos, no curados** (adjudicación):
   literales solamente · embeds fuera (contados) · D-650 fuera de
   alcance. El árbol de montaje (la cura real del pareo por ventana de
   R32 y M2) sigue sin existir — es la deuda de instrumento que el brief
   de S87 ya listaba sin dueño.
4. **La cuarta clase de premisa** (propiedad del dato sostenida por sus
   lectores — `equipo.tsx` «inertes hasta la aceptación») sigue como
   instrumento candidato registrado, sin construir.
5. **El contador sobre el muro** (`Badge forma="contador"` +
   `superficie`) — sin consumidor, sin regla: declarado en el JSDoc para
   que gane su regla con su caso en la mano.

## 4 · NOTAS OPERATIVAS (lo que le ahorra un tropiezo al próximo)

- **Un worktree nuevo NO hereda el link de Supabase** — `supabase/.temp/`
  está fuera de git; sin copiarlo, `db query --linked` sale
  `LegacyProjectNotLinkedError`. Va al arranque de pista.
- **La galería en emulador se TRABA con flings en ráfaga** (gesto
  colgado; solo lo destraba tap + arrastre lento). La receta: arrastres
  ≥500ms con pausa, por el **canal izquierdo (x≈40)** — un drag que
  arranca sobre un TextInput no scrollea. Y `uiautomator dump` no sirve
  ahí: `EsperaDeMarca` respira en loop y nunca hay idle.
- **`maxLength` en un TextInput con saneo trunca el CRUDO antes del
  saneador** — un pegado con prefijo basura queda vacío. El tope va en
  el `slice` de lo saneado.
- **`null || with_check` da NULL**: las policies INSERT no tienen
  `polqual` — el `coalesce` va en CADA lado o la sonda reporta veredictos
  desde un null (L-197 en SQL; cobrado dos veces en la sesión).
- **El regex de `hitSlop` tiene dos ropas** (`hitSlop: 10` y
  `hitSlop={10}`) — un brazo que mira una sola estrena mudo.
- **Clipboard real en emulador sin `cmd clipboard`**: página local vía
  `http://10.0.2.2` + `document.execCommand('copy')` con gesto
  (`navigator.clipboard` exige origen seguro) + `KEYCODE_PASTE` (279).

## 5 · REGLA 87 — el aparato

**No tengo emulador propio que apagar**: los dos vivos son de C (5554) y
D (5556) y no toqué ninguno desde que la regla rige. Los servidores web
de smoke (puertos 8081/8082) quedaron muertos. Nada mío conectado.
