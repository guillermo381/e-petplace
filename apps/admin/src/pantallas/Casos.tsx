import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerBandejaCasos, type FilaBandeja } from '@api-admin'
import { color, sp, fuente } from '../tokens'
import { Carta, Insignia, VacioQueHabla, Fallo, Boton } from '../ui/piezas'

/**
 * LA BANDEJA DEL ASIENTO DE LA CASA (DIRECCION_POSTVENTA §6).
 *
 * El orden NO es el de la tabla: primero lo que la familia le pidió a la casa,
 * después lo que se le venció al prestador, después lo abierto, y lo cerrado
 * al final. *Una bandeja ordenada por fecha hace que lo urgente se hunda solo.*
 */
export default function Casos() {
  const [filas, setFilas] = useState<FilaBandeja[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verCerrados, setVerCerrados] = useState(false)
  const navegar = useNavigate()

  useEffect(() => {
    obtenerBandejaCasos().then((r) => {
      if (!r.ok) { setError(r.mensaje); return }
      setFilas(r.data)
    })
  }, [])

  if (error) return <Fallo mensaje={error} />
  if (filas === null) return <p style={{ color: color.texto2, fontFamily: fuente.cuerpo }}>Cargando…</p>

  const abiertos = filas.filter((f) => !f.esFinal)
  const cerrados = filas.filter((f) => f.esFinal)
  const visibles = verCerrados ? filas : abiertos
  const conLaCasa = abiertos.filter((f) => f.conLaCasa).length
  const vencidos = abiertos.filter((f) => f.plazoVencido).length

  return (
    <div style={{ fontFamily: fuente.cuerpo, maxWidth: 1100 }}>
      <h1 style={{ color: color.texto, fontSize: 20, fontWeight: 800, margin: `0 0 ${sp[1]}px` }}>
        Casos
      </h1>
      <p style={{ color: color.texto2, fontSize: 14, margin: `0 0 ${sp[6]}px` }}>
        Lo que las familias reclamaron. Primero lo que te pidieron a vos.
      </p>

      {abiertos.length > 0 ? (
        <div style={{ display: 'flex', gap: sp[6], marginBottom: sp[6] }}>
          <Carta style={{ flex: 1 }}>
            <div style={{ color: color.texto2, fontSize: 12, fontWeight: 700 }}>TE PIDIERON A VOS</div>
            <div style={{ fontSize: 24, fontFamily: fuente.mono, color: conLaCasa ? color.acento : color.texto }}>
              {conLaCasa}
            </div>
          </Carta>
          <Carta style={{ flex: 1 }}>
            <div style={{ color: color.texto2, fontSize: 12, fontWeight: 700 }}>PLAZO DEL PRESTADOR VENCIDO</div>
            <div style={{ fontSize: 24, fontFamily: fuente.mono, color: vencidos ? color.alerta : color.texto }}>
              {vencidos}
            </div>
          </Carta>
          <Carta style={{ flex: 1 }}>
            <div style={{ color: color.texto2, fontSize: 12, fontWeight: 700 }}>ABIERTOS</div>
            <div style={{ fontSize: 24, fontFamily: fuente.mono }}>{abiertos.length}</div>
          </Carta>
        </div>
      ) : null}

      {visibles.length === 0 ? (
        <Carta>
          <VacioQueHabla
            titulo={abiertos.length === 0 && cerrados.length === 0
              ? 'Todavía no hay ningún caso'
              : 'No hay casos abiertos'}
            porque={
              abiertos.length === 0 && cerrados.length === 0
                ? 'Nadie abrió un reclamo todavía. El motor de postventa está construido y ' +
                  'gateado, pero sus puertas —las pantallas desde donde una familia abre un ' +
                  'caso— todavía no están en las apps: hasta que existan, esta bandeja no ' +
                  'puede recibir nada. No es que estemos filtrando: no hay filas.'
                : `Los ${cerrados.length} casos que hay están todos cerrados.`
            }
            accion={cerrados.length > 0 && !verCerrados
              ? <Boton variante="secundario" onClick={() => setVerCerrados(true)}>
                  Ver los {cerrados.length} cerrados
                </Boton>
              : undefined}
          />
        </Carta>
      ) : (
        <>
          <Carta style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: color.seccion, textAlign: 'left' }}>
                  <Th>Caso</Th><Th>Motivo</Th><Th>Objeto</Th><Th>Estado</Th><Th>Abierto</Th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => (
                  <tr key={f.id}
                      onClick={() => navegar(`/casos/${f.id}`)}
                      style={{ cursor: 'pointer' }}>
                    <Td>
                      <span style={{ fontFamily: fuente.mono, fontSize: 12 }}>{f.id.slice(0, 8)}</span>
                      <div style={{ color: color.texto3, fontSize: 11 }}>clase {f.clase}</div>
                    </Td>
                    <Td>
                      <span style={{ color: color.texto, fontWeight: 600 }}>{f.motivo}</span>
                      {f.resumen ? (
                        <div style={{ color: color.texto2, fontSize: 12, maxWidth: 320 }}>{f.resumen}</div>
                      ) : null}
                    </Td>
                    <Td><span style={{ color: color.texto2 }}>{f.objetoTipo}</span></Td>
                    <Td>
                      {f.conLaCasa ? <Insignia tono="peligro">Te lo pidieron</Insignia>
                        : f.plazoVencido ? <Insignia tono="alerta">Plazo vencido</Insignia>
                        : f.esFinal ? <Insignia>{f.etapa}</Insignia>
                        : <Insignia tono="neutro">{f.etapa}</Insignia>}
                    </Td>
                    <Td><span style={{ fontFamily: fuente.mono, fontSize: 12 }}>
                      {f.creadoEn.slice(0, 10)}
                    </span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Carta>
          {cerrados.length > 0 ? (
            <div style={{ marginTop: sp[4] }}>
              <Boton variante="secundario" onClick={() => setVerCerrados(!verCerrados)}>
                {verCerrados ? 'Ocultar cerrados' : `Ver también los ${cerrados.length} cerrados`}
              </Boton>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{
    padding: `${sp[3]}px ${sp[4]}px`, color: color.texto2, fontSize: 11,
    fontWeight: 700, borderBottom: `1px solid ${color.borde}`,
  }}>{children}</th>
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td style={{
    padding: `${sp[3]}px ${sp[4]}px`, borderBottom: `1px solid ${color.borde}`,
    verticalAlign: 'top',
  }}>{children}</td>
}
