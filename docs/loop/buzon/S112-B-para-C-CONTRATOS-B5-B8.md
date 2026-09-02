# S112-B → C · CONTRATOS DE B5 · B7 · B8 (y por qué B6 no existe)

**Código termina en `24c4b9f5`.** Todas **entregadas y NO montadas**.

---

## B5 · `HitoUnaVidaNueva`

```tsx
<HitoUnaVidaNueva
  titulo="Una vida nueva empieza"          // lo escribís vos (Ley 3)
  fecha="2 de septiembre de 2026"          // YA REDACTADA por el riel
  procedencia={{ etiqueta: 'Procedencia', valor: 'Refugio Patitas del Sur' }}
/>
```

**Cero animación, y es la decisión, no una omisión.** El hito queda en la
línea de vida **con aniversario anual**: no es una felicitación que se ve una
vez, es una carta que la familia va a volver a encontrar dentro de tres años.
Confeti se ve bien la primera vez y es ruido las otras cincuenta. Si querés
que aparezca escalonada, envolvela en `Entrada` — la dosis de ceremonia es del
contexto.

**Cero acción**: no navega ni comparte. Un hito no es una oferta.

`procedencia` es opcional a propósito: el día que haya adopciones sin refugio,
un rótulo «Procedencia» sobre un vacío es peor que no decirlo.

---

## ☠️ B6 · `MemorialAdoptable` NO EXISTE, y no es un pendiente

El pedido decía «reusá, no dupliques». Al buscar qué reusar, **el memorial de
esta casa no es una pieza: es un TEMA.** `<ThemeProvider memorial>` queda
SIEMPRE encima del modo y todas las piezas ya responden; el perfil de mascota
lo compone con ~10 ramas `esMemorial` **en la pantalla**.

**Lo que te toca:** envolver la ficha del fallecido en `<ThemeProvider
memorial>` y **no pasarle `cta`, ni `apadrinar`, ni `bono`**. Eso es todo el
memorial del adoptable. En la lista, `estado="memorial"` en
`TarjetaMascotaRefugio` — el animal **no desaparece en silencio** (§4.2).

---

## B7 · `TarjetaMascotaRefugio`

```tsx
<TarjetaMascotaRefugio
  nombre="Kira" fotoUrl={foto} estado="en_rescate"
  voces={{ en_rescate:'…', publicada:'…', pausada:'…', en_proceso:'…', adoptada:'…', memorial:'…' }}
  etiqueta="Kira, en rescate"        // a11y de la tarjeta entera
  onPress={() => irAFicha(id)}
  publicacion={{
    etiqueta: 'Publicar a Kira',
    encendido: false,
    razon: 'Es adulta y no está esterilizada: se publica esterilizada.',
  }}
/>
```

🔴 **`publicacion` es unión discriminada:** o `onCambio` (se puede mover) o
`razon` (no se puede, **y es obligatoria**). `{etiqueta, encendido}` a secas
**no compila**. Es el ítem 16 del recorrido del founder.

**Ausente** = no hay interruptor (adoptada, memorial): ofrecer un control
muerto es peor que no ofrecerlo.

**El mapeo estado → color vive en la pieza**, por el mismo defecto que ya
mataste con `EstadoSolicitudAdopcion`. **Ninguno de los seis es `atencion`**:
un animal en rescate, pausado o fallecido no es un problema del sistema.

La razón se dibuja **debajo de la fila entera**, atenuada y nunca roja. Del
lado del control, `Interruptor` ganó `deshabilitado` + `razonDeshabilitado`
(→ `accessibilityHint`) — si lo montás suelto en otro lado, la línea visible
es tuya.

---

## B8 · `FichaAdoptable`

```tsx
<FichaAdoptable
  galeria={<TuCarrusel …/>}          // ⚠️ SLOT — ver abajo
  nombre="Luna"
  edad="2 años (estimada)"           // YA REDACTADA. null ⇒ se DICE
  detalles={['Perra', 'Hembra', 'Mediana']}
  semaforo={<SemaforoSanitario …/>}
  convivencia={<Convivencia …/>}
  historia="La encontraron en la vía a Nono…"
  senales={<SenalesAdoptable …/>}     // la ZONA viaja acá, como señal
  publicador={{ nombre, fotoUrl, verificacion: { texto, onExplicar, etiquetaExplicacion } }}
  bono={{ texto: '$40 · para su esterilización', onExplicar, etiquetaExplicacion }}
  apadrinar={{ texto: 'Apadrinar a Luna', onExplicar, etiquetaExplicacion }}
  reportar={{ etiqueta: 'Reportar esta publicación', onPress }}
  cta={{ etiqueta: 'Quiero adoptar a Luna', onPress }}   // o { etiqueta, razon }
  voces={{ edadNoInformada, salud, convivencia, historia, senales, publicador, bono }}
/>
```

🔴 **N19: no hay prop para cambiar el orden.** Los slots tienen NOMBRE, así
que vos decidís QUÉ va en cada bloque y **no podés decidir DÓNDE**. Probar
`orden={[…]}` no compila porque la prop no existe.

**La ubicación aproximada NO tiene prop propia**: viaja dentro de `senales`
como señal `zona`. Dos lugares para el mismo dato es cómo se contradicen.

**`cta` es unión discriminada**, igual que el «Enviar» del formulario.

**La edad llega redactada**, igual que en `TarjetaAdoptable`: el cálculo
depende del idioma y de la especie, y el riel ya lo tiene. A exporta
`describirEdad`/`describirEspera` en `packages/domain` devolviendo
`{clave, params}` — **pasalo por `t()` vos y mandame el texto.**

### ⚠️ LA GALERÍA ES SLOT, y quiero que sepas por qué antes de escribir una

El carrusel de la casa **existe**: vive DENTRO de `FichaPrestador` (~150
líneas, ~270-440) con paginado, ciclo, ancho medido, `nestedScrollEnabled` y
puntos. N17 manda extraerlo («una fuente, N consumidores; jamás se duplican»)
y **no lo extraje, con su razón: su propiedad clave la cerró el OJO DEL
FOUNDER en aparato** —«no tironea en Android», group `d139b9c0` / APK 1.0.3—
y su autor había declarado que no podía afirmarlo desde el repo. *Una
propiedad que se cerró mirando no se puede volver a cerrar leyendo.*

**Si vas a escribir un carrusel para esta ficha, decímelo antes**: eso sería
el segundo de la casa, y entonces la extracción deja de ser opcional. Lo que
necesita es **gate en aparato**, no un typecheck — y ése no es mío.

---

## Lo que gané en piezas de otros frentes, para que no te sorprenda

| pieza | qué gana | default |
|---|---|---|
| `Convivencia` | exporta `EstadoConvivencia` | — |
| `PieDeCampo` · `CampoCodigo` | `tono: 'alarma' \| 'estado'` | `'alarma'` |
| `Interruptor` | `deshabilitado` + `razonDeshabilitado` | `false` |

**Ninguna cambia a un consumidor vivo en un byte** (`L-244`).
