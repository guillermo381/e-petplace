import { useEffect, useState } from 'react'
import {
  obtenerCuentasLiquidables, obtenerEventosDeCuenta, generarLiquidacion,
  type FilaLiquidable, type EventoDetalle,
} from '@api-admin'
import { color, sp, radio, fuente } from '../tokens'
import { Carta, Boton, Monto, Insignia, VacioQueHabla, Fallo } from '../ui/piezas'

/**
 * LIQUIDACIÓN AL PRESTADOR — la primera puerta (letra §2.1 #1).
 *
 * 🔴 **POR QUÉ ESTA PANTALLA MUESTRA DOS NÚMEROS Y NO UNO**
 *
 * Medido el 7-sep-2026: 329 citas pagadas, **293 sin evento económico**, 36
 * eventos, **cero liquidaciones en toda la historia**. Los cuatro productores
 * de evento faltan y los está construyendo A.
 *
 * ⇒ Un prestador con citas cobradas y sin eventos **no tiene «nada que
 * cobrar»**: tiene plata cobrada que el motor todavía no devengó. Mostrar
 * `$0` sería un dato plausible y falso sobre plata de un tercero.
 *
 * Por eso la tabla tiene **A liquidar** (lo que ya tiene evento) y **Cobrado
 * sin devengar** (lo que no), y la pantalla dice la diferencia con todas las
 * letras. **Esta pantalla NO cura el hueco: lo hace decible.**
 */
export default function Liquidaciones() {
  const [filas, setFilas] = useState<FilaLiquidable[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setError(null)
    const r = await obtenerCuentasLiquidables()
    if (!r.ok) { setError(r.mensaje); setFilas(null); return }
    setFilas(r.data)
  }

  if (error) return <Fallo mensaje={error} />
  if (filas === null) return <p style={{ color: color.texto2, fontFamily: fuente.cuerpo }}>Cargando…</p>

  const totalLiquidable = filas.reduce((s, f) => s + f.liquidable, 0)
  const totalSinDevengar = filas.reduce((s, f) => s + f.cobradoSinDevengar, 0)
  const citasSinEvento = filas.reduce((s, f) => s + f.citasSinEventoCount, 0)

  return (
    <div style={{ fontFamily: fuente.cuerpo, maxWidth: 1100 }}>
      <h1 style={{ color: color.texto, fontSize: 20, fontWeight: 800, margin: `0 0 ${sp[1]}px` }}>
        Liquidaciones
      </h1>
      <p style={{ color: color.texto2, fontSize: 14, margin: `0 0 ${sp[6]}px` }}>
        Lo que e-PetPlace le debe a cada negocio. Una liquidación por cuenta,
        país y período — un actor con varias sedes cobra una sola transferencia.
      </p>

      {/* LA BANDA DE LA VERDAD INCÓMODA. Se muestra sólo si hay hueco, y
          cuando hay, preside: es el dato que cambia cómo se lee la tabla. */}
      {citasSinEvento > 0 ? (
        <div style={{
          border: `1px solid ${color.alerta}`, background: '#FFFBF0',
          borderRadius: radio.md, padding: sp[4], marginBottom: sp[6],
        }}>
          <div style={{ color: color.alerta, fontWeight: 700, fontSize: 14, marginBottom: sp[1] }}>
            Hay plata cobrada que todavía no se puede liquidar
          </div>
          <div style={{ color: color.texto2, fontSize: 13, lineHeight: 1.55 }}>
            <strong>{citasSinEvento}</strong> citas están pagadas pero todavía no
            generaron su evento económico, por{' '}
            <Monto valor={totalSinDevengar} tono="apagado" /> en total.
            Esos importes <strong>no se pueden liquidar todavía</strong>: el evento
            es lo que fija cuánto le toca al negocio y cuánto a la plataforma.
            Los productores de evento están en construcción — hasta que existan,
            esta pantalla los muestra aparte en vez de contarlos como cero.
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: sp[6], marginBottom: sp[6] }}>
        <Carta style={{ flex: 1 }}>
          <div style={{ color: color.texto2, fontSize: 12, fontWeight: 700, marginBottom: sp[1] }}>
            A LIQUIDAR HOY
          </div>
          <div style={{ fontSize: 24 }}><Monto valor={totalLiquidable} /></div>
        </Carta>
        <Carta style={{ flex: 1 }}>
          <div style={{ color: color.texto2, fontSize: 12, fontWeight: 700, marginBottom: sp[1] }}>
            COBRADO SIN DEVENGAR
          </div>
          <div style={{ fontSize: 24 }}><Monto valor={totalSinDevengar} tono="apagado" /></div>
        </Carta>
      </div>

      {filas.length === 0 ? (
        <Carta>
          <VacioQueHabla
            titulo="No hay negocios con plata pendiente"
            porque={
              'No hay ningún evento económico pendiente de liquidar ni citas pagadas ' +
              'sin devengar. Si esperabas ver algo acá, puede ser que las citas todavía ' +
              'no se hayan cerrado, o que sus prestadores no tengan cuenta comercial ' +
              'asociada — sin cuenta no hay a quién transferirle.'
            }
          />
        </Carta>
      ) : (
        <Carta style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: color.seccion, textAlign: 'left' }}>
                <Th>Negocio</Th>
                <Th align="right">A liquidar</Th>
                <Th align="right">Cobrado sin devengar</Th>
                <Th>Estado</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <FilaCuenta
                  key={f.cuentaComercialId} fila={f}
                  abierta={abierta === f.cuentaComercialId}
                  alAbrir={() => setAbierta(abierta === f.cuentaComercialId ? null : f.cuentaComercialId)}
                  alGenerar={cargar}
                />
              ))}
            </tbody>
          </table>
        </Carta>
      )}
    </div>
  )
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{
      padding: `${sp[3]}px ${sp[4]}px`, color: color.texto2, fontSize: 11,
      fontWeight: 700, textAlign: align, borderBottom: `1px solid ${color.borde}`,
    }}>{children}</th>
  )
}

function FilaCuenta({ fila, abierta, alAbrir, alGenerar }: {
  fila: FilaLiquidable; abierta: boolean; alAbrir: () => void; alGenerar: () => void
}) {
  const td: React.CSSProperties = {
    padding: `${sp[3]}px ${sp[4]}px`, borderBottom: `1px solid ${color.borde}`,
    verticalAlign: 'top',
  }
  /* No se puede liquidar si no hay eventos, si la cuenta no está activa o si
     no tiene datos bancarios. Los tres motivos se DICEN, no se deducen de un
     botón gris (L-424: un guard que sólo sabe negarse manda a reintentar). */
  const impedimento =
    fila.eventosCount === 0 ? 'Sin eventos pendientes que liquidar.'
    : !fila.cuentaActiva ? 'La cuenta comercial no está activa.'
    : !fila.tieneDatosBancarios ? 'La cuenta no tiene datos bancarios cargados.'
    : null

  return (
    <>
      <tr>
        <td style={td}>
          <div style={{ color: color.texto, fontWeight: 600 }}>
            {fila.nombres.length > 0 ? fila.nombres.join(' · ') : 'Cuenta sin prestador asociado'}
          </div>
          <div style={{ color: color.texto3, fontSize: 11, fontFamily: fuente.mono, marginTop: 2 }}>
            {fila.cuentaComercialId.slice(0, 8)} · {fila.countryCode || '—'}
          </div>
        </td>
        <td style={{ ...td, textAlign: 'right' }}>
          <Monto valor={fila.liquidable} moneda={fila.moneda || 'USD'} />
          <div style={{ color: color.texto3, fontSize: 11, marginTop: 2 }}>
            {fila.eventosCount} {fila.eventosCount === 1 ? 'evento' : 'eventos'}
          </div>
        </td>
        <td style={{ ...td, textAlign: 'right' }}>
          {fila.citasSinEventoCount > 0 ? (
            <>
              <Monto valor={fila.cobradoSinDevengar} tono="apagado" />
              <div style={{ color: color.alerta, fontSize: 11, marginTop: 2 }}>
                {fila.citasSinEventoCount} citas sin evento
              </div>
            </>
          ) : <span style={{ color: color.texto3 }}>—</span>}
        </td>
        <td style={td}>
          {impedimento
            ? <Insignia tono="alerta">No liquidable</Insignia>
            : <Insignia tono="exito">Lista</Insignia>}
          {impedimento ? (
            <div style={{ color: color.texto2, fontSize: 11, marginTop: sp[1], maxWidth: 200 }}>
              {impedimento}
            </div>
          ) : null}
        </td>
        <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
          <Boton variante="secundario" onClick={alAbrir}>
            {abierta ? 'Ocultar' : 'Ver detalle'}
          </Boton>
        </td>
      </tr>
      {abierta ? (
        <tr>
          <td colSpan={5} style={{ padding: 0, background: color.seccion }}>
            <Detalle fila={fila} impedimento={impedimento} alGenerar={alGenerar} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

function Detalle({ fila, impedimento, alGenerar }: {
  fila: FilaLiquidable; impedimento: string | null; alGenerar: () => void
}) {
  const [eventos, setEventos] = useState<EventoDetalle[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  // Período por defecto: el mes en curso. Editable, porque el período es una
  // decisión de operación y no una constante del código.
  const hoy = new Date()
  const [desde, setDesde] = useState(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10))
  const [hasta, setHasta] = useState(hoy.toISOString().slice(0, 10))

  useEffect(() => {
    obtenerEventosDeCuenta(fila.cuentaComercialId).then((r) => {
      if (!r.ok) { setError(r.mensaje); return }
      setEventos(r.data)
    })
  }, [fila.cuentaComercialId])

  async function generar() {
    setGenerando(true); setError(null); setResultado(null)
    const r = await generarLiquidacion({
      cuentaComercialId: fila.cuentaComercialId,
      countryCode: fila.countryCode,
      periodoInicio: desde,
      periodoFin: hasta,
    })
    setGenerando(false)
    if (!r.ok) { setError(r.mensaje); return }
    setResultado(r.data.liquidacionId)
    alGenerar()
  }

  return (
    <div style={{ padding: sp[5] }}>
      {error ? <div style={{ marginBottom: sp[4] }}><Fallo mensaje={error} /></div> : null}

      {resultado ? (
        <div style={{
          border: `1px solid ${color.exito}`, background: '#F3FBF5', borderRadius: radio.suave,
          padding: sp[4], marginBottom: sp[4], color: color.exito, fontSize: 13,
        }}>
          <strong>Liquidación generada.</strong>{' '}
          <span style={{ fontFamily: fuente.mono }}>{resultado.slice(0, 8)}</span>
          {' '}— los eventos incluidos ya no aparecen como pendientes.
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: sp[3], marginBottom: sp[5] }}>
        <Campo label="Desde" valor={desde} alCambiar={setDesde} />
        <Campo label="Hasta" valor={hasta} alCambiar={setHasta} />
        <Boton onClick={generar} disabled={generando || impedimento !== null}>
          {generando ? 'Generando…' : 'Generar liquidación'}
        </Boton>
        {impedimento ? (
          <span style={{ color: color.texto2, fontSize: 12, paddingBottom: sp[2.5] }}>
            {impedimento}
          </span>
        ) : null}
      </div>

      {eventos === null ? (
        <p style={{ color: color.texto2, fontSize: 13 }}>Cargando eventos…</p>
      ) : eventos.length === 0 ? (
        <VacioQueHabla
          titulo="Este negocio no tiene eventos pendientes"
          porque={
            fila.citasSinEventoCount > 0
              ? `Tiene ${fila.citasSinEventoCount} citas pagadas, pero ninguna generó todavía su ` +
                'evento económico. No es que no se le deba: es que el motor aún no calculó cuánto.'
              : 'No hay citas cobradas ni eventos devengados para este negocio en el sistema.'
          }
        />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: color.texto2 }}>
              <Th>Fecha</Th><Th>Concepto</Th>
              <Th align="right">Bruto</Th><Th align="right">Plataforma</Th><Th align="right">Al negocio</Th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.id}>
                <Td><span style={{ fontFamily: fuente.mono }}>{e.fechaDevengo.slice(0, 10)}</span></Td>
                <Td>
                  {e.tipoEvento}
                  <div style={{ color: color.texto3, fontSize: 11 }}>{e.revenueStream}</div>
                </Td>
                <Td align="right"><Monto valor={e.montoBruto} moneda={e.moneda} tono="apagado" /></Td>
                <Td align="right"><Monto valor={e.montoPlataforma} moneda={e.moneda} tono="apagado" /></Td>
                <Td align="right"><Monto valor={e.montoPayout} moneda={e.moneda} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function Td({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td style={{
      padding: `${sp[2]}px ${sp[4]}px`, borderBottom: `1px solid ${color.borde}`,
      textAlign: align, color: color.texto,
    }}>{children}</td>
  )
}

function Campo({ label, valor, alCambiar }: {
  label: string; valor: string; alCambiar: (v: string) => void
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ color: color.texto2, fontSize: 11, fontWeight: 700 }}>{label}</span>
      <input type="date" value={valor} onChange={(e) => alCambiar(e.target.value)} style={{
        padding: `${sp[2]}px ${sp[3]}px`, border: `1px solid ${color.borde}`,
        borderRadius: radio.suave, fontSize: 13, fontFamily: fuente.mono,
        background: color.carta, color: color.texto,
      }} />
    </label>
  )
}
