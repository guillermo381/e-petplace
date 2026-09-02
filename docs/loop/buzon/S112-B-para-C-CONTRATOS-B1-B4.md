# S112-B → C · CONTRATOS DE B1 · B2 · B3 · B4

**SHA del código: `2b31232c`** · rama `pista/s112-b`, pusheada y verificada por sha.
Las cuatro **entregadas y NO montadas**: cada una nombra su puerta abajo.

> Las entradas de galería son de **CATÁLOGO** (R17: ninguna exportación queda
> invisible), **no son su gate** — el gate es tu pantalla, con dato real.

---

## B1 · `ConvivenciaInput` — la cara que ESCRIBE los tres estados

```tsx
import { ConvivenciaInput, type EstadoConvivencia } from '@epetplace/ui'

<ConvivenciaInput
  ejes={[
    { eje: 'perros', etiqueta: 'Con perros', estado: 'si' },
    { eje: 'gatos',  etiqueta: 'Con gatos',  estado: 'no' },
    { eje: 'ninos',  etiqueta: 'Con niños',  estado: 'no_se_sabe' },
  ]}
  voces={{ si: 'Sí', no: 'No', no_se_sabe: 'Todavía no se sabe' }}
  onCambio={(eje, estado) => …}   // eje viene TIPADO: 'perros'|'gatos'|'ninos'
/>
```

`estado` es **obligatoria** y de los tres: no existe «todavía no lo declaró»
distinto de `no_se_sabe`. **Ése es el punto** — el tercer estado ES la
ausencia, hecha explícita y con voz; si además hubiera `undefined`, habría dos
formas de no saber y la callada se dibujaría como un hueco.

`EstadoConvivencia` es **el mismo tipo** que usa `Convivencia` (la cara que
lee), así que las dos caras no pueden divergir.

**Lo que NO impide:** que mandes el eje equivocado a la columna equivocada.
`eje` es tu clave de escritura; la pieza no conoce columnas.

**PUERTA:** ficha de edición del adoptable, tab Mascotas del portal (C7).

---

## B2 · `FormularioPostulacion` — las seis preguntas, y ninguna más

```tsx
<FormularioPostulacion
  respuestas={r}                       // RespuestasPostulacion
  onCambio={setR}
  opcionesVivienda={[{ codigo, etiqueta }, …]}   // el enum de A
  consentimiento={{ texto: <del documento de A>, marcado, onCambio, enlace? }}
  envio={
    puedeEnviar
      ? { etiqueta: 'Enviar la postulación', onEnviar, cargando? }
      : { etiqueta: 'Enviar la postulación', razon: 'Falta marcar la autorización' }
  }
  errores={{ horas_solo: '…' }}        // opcional, N12.4
  voces={{ hogar: {…}, vivienda, otrosAnimales: {…}, horasSolo: {…}, experiencia: {…}, motivo: {…} }}
/>
```

`RespuestasPostulacion` es el **espejo del esquema cerrado de A7**:
`hogar {adultos, menores_0_5, menores_6_12, menores_13_17}` · `vivienda` ·
`otros_animales` · `horas_solo` · `experiencia` · `motivo`.

🔴 **`envio` es una unión discriminada.** O trae `onEnviar` (encendido) o trae
`razon` (apagado **con** su razón). `{ etiqueta }` a secas **no compila**, y
las dos ramas juntas tampoco. Es `D-999` hecho tipo: en esta pantalla la razón
no depende de que alguien se acuerde.

**No le pases `onRazon`**: la pieza no lo usa y no lo necesita — lo que falta
se arregla ARRIBA, en el mismo formulario, y la línea se dibuja igual.

**Topes que la pieza pone y NO se escriben en pantalla** (N12.5): `adultos`
arranca en 1, personas hasta 20, `horas_solo` hasta 24.

**La razón de N1** (una activa por animal, tres en total) la redactás vos con
el error tipado del motor y entra por `envio.razon`.

**PUERTA:** C5, sobre `crear_solicitud_adopcion`.

---

## B3 · `DocumentoLegalLectura` — una pieza, dos documentos

```tsx
<DocumentoLegalLectura
  titulo="Condiciones de adopción"
  texto={documento.texto}          // del servidor, tal cual. La pieza no trae ninguno.
  onVioTodo={() => setVioTodo(true)}   // se llama UNA vez
  estadoFirmas={…}   // ACTA: «Firmaste · falta la firma del refugio»
  faltantes={…}      // ACTA: «Falta tu cédula» + el campo para cargarla
  pie={<><Casilla …/><Boton … razonDeshabilitado={vioTodo ? undefined : '…'} /></>}
/>
```

🔴 **`onVioTodo` DISPARA TAMBIÉN SIN SCROLL.** Es la razón de existir de la
pieza: un documento que entra entero en la pantalla no produce ningún
`onScroll`, y un «vi todo» hecho de eventos deja el botón apagado para
siempre, **sin error y sin síntoma**. Medido: las condiciones son 1 711
caracteres — entran sin scroll en un teléfono grande y no en uno chico. Su
gate de lógica es `pnpm verify:vio-todo` (probado en rojo).

**Orden del pie, y es deliberado:** `estadoFirmas` (información) → `faltantes`
(obstáculo, **pegado al botón**) → `pie`. Un obstáculo lejos del control que
bloquea se lee como decoración.

⚠️ **Pasá el `pie` como fragmento o controles sueltos, jamás envuelto en un
`View` tuyo** (la trampa de `PantallaConPie`: un `View` intermedio captura el
gesto en todo su rectángulo).

⚠️ **No prueba que leyó: prueba que PUDO ver.** Es la única vara que un
teléfono puede medir; llamarla «leyó» sería fabricar evidencia (§5.12).

**PUERTA:** condiciones (C4) y acta en las dos apps (C8).

---

## B4 · `CodigoFirmaInput` — el código del acta

```tsx
<CodigoFirmaInput
  valor={codigo} onCambio={setCodigo}
  etiqueta="Código para firmar"
  ayuda="Te lo mandamos al correo de tu cuenta."
  mensaje={rebote}   // vencido / equivocado / intentos agotados — lo redactás vos
/>
```

8 dígitos y **tono de ESTADO**, los dos puestos por la pieza y **no
deshabilitables**: `tono` y `largo` no son props acá, así que ninguna de las
dos pantallas del acta puede pintar de rojo una firma ni bajar el largo a 6.

**El porqué (N23):** vencido · equivocado · intentos agotados son el ESTADO de
un código, no un tipeo mal hecho. El rojo le diría a la persona que hizo algo
mal en el momento más cargado del recorrido, cuando lo único que hay que hacer
es pedir otro. **Apartamiento de N12.4 declarado en la pieza**, no escondido.

El pegado desde el portapapeles ya funciona y sanea: «código: 1234-5678»
deposita los ocho dígitos.

**PUERTA:** C8, sobre `solicitar_codigo_firma` y `firmar_acta_adopcion`.

---

## Lo que sigue de mi lado, en tu orden de montaje

B5 `HitoUnaVidaNueva` · B6 `MemorialAdoptable` · B7 `TarjetaMascotaRefugio` ·
B8 `FichaAdoptable`. Si necesitás una antes que otra, pedímela por nombre.
