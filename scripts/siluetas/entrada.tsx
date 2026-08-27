/**
 * ENTRADA DEL BANCO DE SILUETAS — lo que se monta para medir.
 *
 * Se declara UNA FILA por vez: los glifos que conviven en la misma superficie.
 * El instrumento (`scripts/medir-siluetas.mjs`) recorta cada disco, saca su
 * máscara de tinta y mide el solape entre todos los pares.
 *
 * 🔴 **IMPORTA la pieza real, jamás la reimplementa** — regla dura del founder
 * sobre la galería: *«una galería que muestra un botón que no es EL botón hace
 * firmar algo que no corre»*. Acá vale igual: medir una copia mide la copia.
 */
import { createRoot } from 'react-dom/client'
import { View } from 'react-native'
import { ControlLlamada, ThemeProvider, spacing } from '@epetplace/ui'

/** Las filas a medir. Cada entrada = una superficie con glifos que conviven. */
const FILAS = [
  {
    id: 'controles-de-llamada',
    ancho: 390,
    render: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[3] }}>
        <ControlLlamada glifo="microfono" etiqueta="micrófono" activo onPress={() => {}} />
        <ControlLlamada glifo="camara" etiqueta="cámara" activo onPress={() => {}} />
        <ControlLlamada glifo="altavoz" etiqueta="altavoz" activo onPress={() => {}} />
        <ControlLlamada glifo="girarCamara" etiqueta="girar cámara" onPress={() => {}} />
        <ControlLlamada glifo="colgar" tamaño="lg" etiqueta="colgar" onPress={() => {}} />
      </View>
    ),
  },
]

function App() {
  return (
    <ThemeProvider>
      <div style={{ background: '#111', padding: 16 }}>
        {FILAS.map((f) => (
          <div key={f.id} data-fila={f.id} style={{ width: f.ancho, marginBottom: 12 }}>
            {f.render()}
          </div>
        ))}
      </div>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('raiz')!).render(<App />)
