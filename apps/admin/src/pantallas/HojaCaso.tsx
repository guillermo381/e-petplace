import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  obtenerHojaDelCaso, resolverCaso, responderEnCaso, tomarCaso,
  pedirPropuestaDelCaso,
  type HojaDelCaso, type AlcanceResolucion, type PropuestaDelCaso,
} from '@api-admin'
import { color, sp, radio, fuente } from '../tokens'
import { Carta, Boton, Monto, Insignia, VacioQueHabla, Fallo } from '../ui/piezas'

/**
 * LA HOJA DEL CASO — DIRECCION_POSTVENTA §6, en una pantalla.
 *
 * Muestra: el objeto con su evidencia · el hilo entero · cuánto se pagó, cuánto
 * se puede devolver y si ese objeto tiene devengo · casos de esa familia y de
 * ese prestador en 90 días · la propuesta de la máquina **marcada como
 * propuesta**.
 *
 * 🔴 **La propuesta la prepara `postventa-hoja`** (edge de A) y llega
 * **marcada como propuesta**: se muestra, no se aplica. Quien decide es la casa
 * y queda su `decidido_por`.
 *
 * ⚠️ Esta cabecera decía, hasta el 9-sep, que «se censó `pg_proc` y no existe
 * ninguna función de propuesta». Era falso y el censo era correcto: **una edge
 * function no vive en `pg_proc`**. La edge estaba desplegada y ACTIVE mientras
 * la pantalla afirmaba su ausencia. *Un vacío honesto sobre algo que sí existe
 * no es honesto: es una afirmación equivocada con el tono de una medición.*
 *
 * 🔴 **Los contadores de 90 días son DE LA CASA** (§6): están para que quien
 * decide tenga contexto. *Jamás se le dice a una familia que reclama seguido,
 * ni se le niega nada por un número* — por eso no hay ningún umbral acá, ni
 * ningún color que los vuelva una alarma.
 */
export default function HojaCaso() {
  const { casoId = '' } = useParams()
  const navegar = useNavigate()
  const [hoja, setHoja] = useState<HojaDelCaso | null>(null)
  const [error, setError] = useState<string | null>(null)
  /* 🔴 TRES ESTADOS EXPLÍCITOS, y «cargando» es UNO de ellos — no el hueco que
     queda cuando no hay datos ni error.

     Lo que había: `if (!hoja) return <p>Cargando…</p>`. Con eso, **cualquier
     camino que no llegue a `setHoja` ni a `setError` deja el spinner para
     siempre** — y eso fue exactamente lo que pasó en producción: el wrapper
     LANZÓ (un `this` perdido dentro de supabase-js), la promesa se rechazó, y
     como no había `catch`, la pantalla se quedó cargando sin decir nada.

     *Un spinner infinito es un error sin superficie.* Y acá la casa está
     resolviendo un caso con plata de por medio: **quedarse mirando un spinner
     es lo peor que le puede pasar.** */
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    try {
      const r = await obtenerHojaDelCaso(casoId)
      if (!r.ok) { setError(r.mensaje); setHoja(null); return }
      setHoja(r.data)
    } catch (e) {
      /* El catch que faltaba. Una excepción del wrapper no puede volverse
         silencio: se dice, y se dice CON su causa — sin ella, «algo falló» manda
         a buscar el problema a cualquier lado. */
      setError(`No pudimos abrir el caso: ${e instanceof Error ? e.message : String(e)}`)
      setHoja(null)
    } finally {
      /* En `finally`: si sólo estuviera en el camino feliz, cada rama nueva de
         error tendría que acordarse de apagarlo — y la que se olvide reproduce
         este mismo defecto. */
      setCargando(false)
    }
  }, [casoId])

  useEffect(() => { cargar() }, [cargar])

  /* El orden importa: primero CARGANDO (estado propio), después ERROR, y recién
     entonces la ausencia de datos — que ya no puede confundirse con «todavía no
     llegó». */
  if (cargando) {
    return <p style={{ color: color.texto2, fontFamily: fuente.cuerpo }}>Cargando el caso…</p>
  }

  if (error) {
    return (
      <div style={{ fontFamily: fuente.cuerpo, maxWidth: 700 }}>
        <Fallo mensaje={error} />
        <div style={{ marginTop: sp[4] }}>
          <Boton variante="secundario" onClick={() => navegar('/casos')}>Volver a los casos</Boton>
        </div>
      </div>
    )
  }
  /* Sin error y sin datos: ya NO es «cargando» — es una respuesta vacía, que es
     un hecho distinto y se dice como tal. */
  if (!hoja) {
    return (
      <div style={{ fontFamily: fuente.cuerpo, maxWidth: 700 }}>
        <Fallo mensaje="El caso no devolvió datos. Puede haber sido borrado, o la respuesta llegó vacía." />
        <div style={{ marginTop: sp[4] }}>
          <Boton variante="secundario" onClick={() => navegar('/casos')}>Volver a los casos</Boton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: fuente.cuerpo, maxWidth: 1000 }}>
      <button onClick={() => navegar('/casos')} style={{
        background: 'none', border: 'none', color: color.texto2, cursor: 'pointer',
        fontSize: 13, padding: 0, marginBottom: sp[3], fontFamily: fuente.cuerpo,
      }}>← Casos</button>

      {/* ── CABECERA ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: sp[3], marginBottom: sp[1] }}>
        <h1 style={{ color: color.texto, fontSize: 20, fontWeight: 800, margin: 0 }}>
          {hoja.motivo}
        </h1>
        <Insignia tono={hoja.cerrado ? 'exito' : hoja.etapa === 'con_casa' ? 'peligro' : 'neutro'}>
          {hoja.estadoFinal ?? hoja.etapa}
        </Insignia>
        <span style={{ color: color.texto3, fontSize: 12, fontFamily: fuente.mono }}>
          {hoja.casoId.slice(0, 8)} · clase {hoja.clase}
        </span>
      </div>
      <p style={{ color: color.texto2, fontSize: 13, margin: `0 0 ${sp[6]}px` }}>
        Sobre {hoja.objeto.tipo}
        {hoja.objeto.titulo ? ` · ${hoja.objeto.titulo}` : ''}
        {hoja.objeto.fecha ? ` · ${hoja.objeto.fecha.slice(0, 10)}` : ''}
      </p>

      <div style={{ display: 'flex', gap: sp[6], alignItems: 'flex-start' }}>
        {/* ── COLUMNA IZQUIERDA: el hilo ───────────────────────────── */}
        <div style={{ flex: 1.4, minWidth: 0 }}>
          <Seccion titulo="El hilo">
            {hoja.hilo.length === 0 ? (
              <VacioQueHabla
                titulo="Todavía no hay mensajes"
                porque={
                  'El caso se abrió pero nadie escribió nada — ni la familia, ni el ' +
                  'prestador, ni la casa. El relato inicial, si lo hubo, está en la ficha ' +
                  'del objeto, no en el hilo.'
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp[3] }}>
                {hoja.hilo.map((m) => (
                  <div key={m.id} style={{
                    borderLeft: `3px solid ${
                      m.autor === 'casa' ? color.acento
                      : m.autor === 'prestador' ? color.oficio : color.bordeFuerte}`,
                    paddingLeft: sp[3],
                  }}>
                    <div style={{ display: 'flex', gap: sp[2], alignItems: 'baseline' }}>
                      <strong style={{ fontSize: 12, color: color.texto }}>{m.autor}</strong>
                      <span style={{ color: color.texto3, fontSize: 11, fontFamily: fuente.mono }}>
                        {m.creadoEn.slice(0, 16).replace('T', ' ')}
                      </span>
                      {m.tipo !== 'mensaje' ? <Insignia>{m.tipo}</Insignia> : null}
                    </div>
                    <div style={{ color: color.texto, fontSize: 13, lineHeight: 1.55, marginTop: 2 }}>
                      {m.cuerpo ?? <em style={{ color: color.texto3 }}>(sin texto)</em>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Seccion>

          {!hoja.cerrado ? <Responder casoId={hoja.casoId} alEnviar={cargar} /> : null}
        </div>

        {/* ── COLUMNA DERECHA: la plata, el contexto, la decisión ───── */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <Plata hoja={hoja} />
          <Contexto hoja={hoja} />
          <Propuesta hoja={hoja} />
          <Tomar hoja={hoja} alTomar={cargar} />
          <Decidir hoja={hoja} alDecidir={cargar} />
        </div>
      </div>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: sp[6] }}>
      <div style={{ color: color.texto2, fontSize: 11, fontWeight: 700, marginBottom: sp[2] }}>
        {titulo.toUpperCase()}
      </div>
      <Carta>{children}</Carta>
    </div>
  )
}

/** §6: cuánto se pagó, cuánto se puede devolver, y si ese objeto tiene devengo. */
function Plata({ hoja }: { hoja: HojaDelCaso }) {
  const p = hoja.plata
  return (
    <Seccion titulo="La plata">
      <Fila etiqueta="Se pagó">
        {p.pagado === null
          ? <span style={{ color: color.alerta, fontSize: 12 }}>no se pudo determinar</span>
          : <Monto valor={p.pagado} moneda={p.moneda} />}
      </Fila>
      <Fila etiqueta="Se puede devolver hasta">
        {p.devolvibleMaximo === null
          ? <span style={{ color: color.alerta, fontSize: 12 }}>—</span>
          : <Monto valor={p.devolvibleMaximo} moneda={p.moneda} />}
      </Fila>
      <Fila etiqueta="Devengo del objeto">
        {p.tieneDevengo
          ? <Insignia tono="exito">tiene evento</Insignia>
          : <Insignia tono="neutro">sin evento</Insignia>}
      </Fila>

      {/* La ausencia se explica, jamás se deja como un guión mudo. */}
      {p.porQueNoSeSabe ? (
        <p style={{ color: color.alerta, fontSize: 12, lineHeight: 1.5, margin: `${sp[3]}px 0 0` }}>
          {p.porQueNoSeSabe}
        </p>
      ) : null}

      <p style={{ color: color.texto2, fontSize: 12, lineHeight: 1.5, margin: `${sp[3]}px 0 0` }}>
        {p.tieneDevengo
          ? 'Este objeto ya devengó: la devolución va por evento inverso y la comisión ' +
            'se reversa proporcionalmente. Lo hace el motor, no esta pantalla.'
          : 'Este objeto no tiene evento económico vivo, así que la devolución no reversa ' +
            'nada del ledger. El camino lo decide el motor al resolver.'}
      </p>
    </Seccion>
  )
}

/** §6: casos de esa familia y de ese prestador en 90 días. De la casa. */
function Contexto({ hoja }: { hoja: HojaDelCaso }) {
  return (
    <Seccion titulo="Contexto de la casa">
      <Fila etiqueta="Casos de esta familia (90 días)">
        <span style={{ fontFamily: fuente.mono, fontWeight: 600 }}>{hoja.casosFamilia90d}</span>
      </Fila>
      <Fila etiqueta="Casos de este prestador (90 días)">
        <span style={{ fontFamily: fuente.mono, fontWeight: 600 }}>{hoja.casosPrestador90d}</span>
      </Fila>
      <p style={{ color: color.texto2, fontSize: 12, lineHeight: 1.5, margin: `${sp[3]}px 0 0` }}>
        Sin contar este caso. <strong>Es información para ti.</strong> No se le
        dice a la familia que reclama seguido, y no se le niega nada por un número.
      </p>
    </Seccion>
  )
}

/**
 * §6: «la propuesta de la máquina, marcada como propuesta».
 *
 * 🔴 **No se pide sola al abrir el caso**, y es decisión, no pereza: cada
 * llamada cuesta un modelo, y la casa abre la Hoja muchas veces para mirar el
 * hilo sin necesitar un resumen. Se pide cuando alguien la pide.
 *
 * 🔴 **Y el que decide es quien lee.** El texto va rotulado y sin ningún
 * botón que lo aplique: no hay camino desde acá a `resolverCaso`. *Una
 * propuesta con un botón «aceptar» al lado deja de ser una propuesta.*
 */
function Propuesta({ hoja }: { hoja: HojaDelCaso }) {
  const [pidiendo, setPidiendo] = useState(false)
  const [propuesta, setPropuesta] = useState<PropuestaDelCaso | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* El hilo puede no tener ni un mensaje con cuerpo (un caso recién abierto con
     puros `hecho`), y el edge rebota `hilo_vacio`. La puerta no ofrece lo que
     va a rechazar (Ley 23): sin material, el botón no se dibuja. */
  const hayMaterial = hoja.hilo.some((m) => typeof m.cuerpo === 'string' && m.cuerpo.trim() !== '')

  async function pedir() {
    setPidiendo(true); setError(null)
    try {
      const r = await pedirPropuestaDelCaso(hoja)
      if (!r.ok) { setError(r.mensaje); return }
      setPropuesta(r.data)
    } catch (e) {
      /* Mismo criterio que al abrir la Hoja: un camino que no llegue a
         `setPropuesta` ni a `setError` dejaría el botón girando para siempre. */
      setError(`No se pudo preparar el resumen: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPidiendo(false)
    }
  }

  return (
    <Seccion titulo="Propuesta de la máquina">
      {propuesta ? (
        <div>
          <p style={{ color: color.texto2, fontSize: 12, margin: `0 0 ${sp[2]}px` }}>
            Lo preparó la máquina leyendo el hilo. La decisión es tuya.
          </p>
          <p style={{ color: color.texto, fontSize: 13, lineHeight: 1.6, margin: `0 0 ${sp[3]}px` }}>
            {propuesta.resumenHilo}
          </p>
          <p style={{ color: color.texto, fontSize: 13, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
            {propuesta.que}
          </p>
          <p style={{ color: color.texto2, fontSize: 12, lineHeight: 1.6, margin: `${sp[2]}px 0 0` }}>
            {propuesta.porque}
          </p>
        </div>
      ) : !hayMaterial ? (
        <VacioQueHabla
          titulo="Todavía no hay nada que resumir"
          porque={
            'El hilo no tiene mensajes con texto. Cuando la familia o el prestador escriban, ' +
            'se va a poder pedir el resumen y la propuesta.'
          }
        />
      ) : (
        <div>
          <p style={{ color: color.texto2, fontSize: 12, margin: `0 0 ${sp[3]}px`, lineHeight: 1.5 }}>
            La máquina puede leer el hilo y proponer un camino, con su porqué.
            No se aplica sola.
          </p>
          <Boton onClick={pedir} disabled={pidiendo}>
            {pidiendo ? 'Leyendo el caso…' : 'Pedir el resumen y la propuesta'}
          </Boton>
        </div>
      )}
      {error ? <div style={{ marginTop: sp[3] }}><Fallo mensaje={error} /></div> : null}
    </Seccion>
  )
}

/** §6: «decidir es un toque». Y la decisión queda con su `decidido_por`. */
/**
 * TOMAR EL CASO — la puerta de la casa cuando las partes no se pusieron de acuerdo.
 *
 * §2 de la letra: **la casa entra al vencer el plazo o cuando cualquiera la
 * llama.** Sin esto, la casa veía los casos `con_prestador` en la bandeja y
 * **no podía hacer nada con ellos** — el caso central de la letra no tenía
 * puerta.
 *
 * 🔴 **Se monta SÓLO en `con_prestador`, y en ese estado `Decidir` no se
 * dibuja.** Es la Ley 23 de la casa —*la puerta no ofrece lo que va a
 * rechazar*—: el motor rebota `caso_no_tomado` si la casa intenta resolver sin
 * tomar, así que ofrecer los dos controles a la vez sería invitar a un rebote.
 */
function Tomar({ hoja, alTomar }: { hoja: HojaDelCaso; alTomar: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (hoja.cerrado || hoja.etapa !== 'con_prestador') return null

  const vencido =
    hoja.plazoHasta !== null && new Date(hoja.plazoHasta).getTime() < Date.now()

  async function tomar() {
    setEnviando(true); setError(null)
    const r = await tomarCaso(hoja.casoId)
    setEnviando(false)
    if (!r.ok) { setError(r.mensaje); return }
    alTomar()
  }

  return (
    <Seccion titulo="El caso está con el prestador">
      <p style={{ color: color.texto2, fontSize: 13, lineHeight: 1.55, margin: `0 0 ${sp[3]}px` }}>
        {vencido
          /* Los dos textos dicen un HECHO distinto, no el mismo con otro tono:
             uno es «se pasó el plazo», el otro «todavía está en plazo». Un
             único texto obligaría a leer la fecha para saber cuál es. */
          ? 'El plazo para que responda ya venció y el caso sigue abierto.'
          : 'El prestador todavía está en plazo para responder.'}
        {' '}Si la casa toma el caso, pasa a decidirlo ella y queda escrito en el hilo
        quién lo tomó.
      </p>
      {hoja.plazoHasta ? (
        <Fila etiqueta={vencido ? 'Venció' : 'Vence'}>
          <span style={{
            fontFamily: fuente.mono, fontSize: 12,
            color: vencido ? color.alerta : color.texto2,
          }}>
            {hoja.plazoHasta.slice(0, 16).replace('T', ' ')}
          </span>
        </Fila>
      ) : (
        /* Sin plazo no se inventa uno: se dice que no hay. */
        <Fila etiqueta="Plazo"><span style={{ color: color.texto3 }}>sin plazo registrado</span></Fila>
      )}
      <div style={{ marginTop: sp[4] }}>
        <Boton onClick={tomar} disabled={enviando}>
          {enviando ? 'Tomando…' : 'Tomar el caso'}
        </Boton>
      </div>
      {error ? <div style={{ marginTop: sp[3] }}><Fallo mensaje={error} /></div> : null}
    </Seccion>
  )
}

function Decidir({ hoja, alDecidir }: { hoja: HojaDelCaso; alDecidir: () => void }) {
  const [alcance, setAlcance] = useState<AlcanceResolucion | null>(null)
  const [monto, setMonto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  /* 🔴 Sin esto, los controles de resolver aparecen sobre un caso que el motor
     va a rebotar con `caso_no_tomado`. El botón de tomar (arriba) es lo que
     corresponde en ese estado — Ley 23. */
  if (!hoja.cerrado && hoja.etapa !== 'con_casa') return null

  if (hoja.cerrado) {
    return (
      <Seccion titulo="La decisión">
        <Fila etiqueta="Alcance">
          <strong>{hoja.resolucion.alcance ?? hoja.estadoFinal ?? '—'}</strong>
        </Fila>
        {hoja.resolucion.monto !== null ? (
          <Fila etiqueta="Monto devuelto"><Monto valor={hoja.resolucion.monto} /></Fila>
        ) : null}
        {hoja.resolucion.camino ? <Fila etiqueta="Camino">{hoja.resolucion.camino}</Fila> : null}
        <Fila etiqueta="Decidió">
          {hoja.decididoPor
            ? <span style={{ fontFamily: fuente.mono, fontSize: 12 }}>{hoja.decididoPor.slice(0, 8)}</span>
            : <span style={{ color: color.alerta, fontSize: 12 }}>sin registrar</span>}
        </Fila>
      </Seccion>
    )
  }

  async function decidir() {
    if (!alcance) return
    setEnviando(true); setError(null)
    const r = await resolverCaso({
      casoId: hoja.casoId,
      alcance,
      monto: alcance === 'parcial' ? Number(monto) : null,
      motivo: motivo.trim() || null,
    })
    setEnviando(false)
    if (!r.ok) { setError(r.mensaje); return }
    alDecidir()
  }

  const faltaMonto = alcance === 'parcial' && (!monto || Number(monto) <= 0)
  /* Espeja el gate del motor, no una regla propia: `parcial` y `sin_devolucion`.
     Si esto y el motor divergen, gana el motor — por eso se mide de su cuerpo. */
  const faltaRazon =
    (alcance === 'parcial' || alcance === 'sin_devolucion') && !motivo.trim()

  return (
    <Seccion titulo="Decidir">
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp[2] }}>
        {([
          ['total', 'Devolver todo'],
          ['parcial', 'Devolver una parte'],
          ['sin_devolucion', 'Sin lugar'],
        ] as const).map(([v, etiqueta]) => (
          <label key={v} style={{
            display: 'flex', gap: sp[2], alignItems: 'center', cursor: 'pointer',
            fontSize: 13, color: color.texto,
          }}>
            <input type="radio" name="alcance" checked={alcance === v}
                   onChange={() => setAlcance(v)} />
            {etiqueta}
          </label>
        ))}
      </div>

      {alcance === 'parcial' ? (
        /* El `max` sale de `devolvibleMaximo`, que esta misma Hoja ya muestra
           arriba («Se puede devolver hasta»). Sin él, la puerta ofrece un número
           que el motor va a rebotar con `monto_supera_total` — Ley 23: la puerta
           no ofrece lo que va a rechazar. Si el techo es `null` (no se pudo
           determinar lo pagado) NO se inventa uno: se deja sin `max` y decide el
           motor, que sí lo sabe. */
        <input type="number" min="0" step="0.01"
               max={hoja.plata.devolvibleMaximo ?? undefined}
               placeholder={hoja.plata.devolvibleMaximo !== null
                 ? `Monto a devolver (hasta ${hoja.plata.devolvibleMaximo})`
                 : 'Monto a devolver'}
               value={monto} onChange={(e) => setMonto(e.target.value)}
               style={campo} />
      ) : null}

      {/* 🔴 EL CAMPO SE DIBUJA EN LOS TRES ALCANCES; EL MOTOR LO EXIGE EN DOS.

          Medido del cuerpo de `caso_resolver` (9-sep), no de un reporte:
              IF p_alcance IN ('parcial','sin_devolucion')
                 AND (p_motivo IS NULL OR btrim(p_motivo) = '') -> razon_requerida

          Esta pantalla se escribió cuando la razón sólo se pedía en
          `sin_devolucion`; **la firma se movió debajo de una pantalla ya
          escrita** y quedó mandando `null` en parcial => el motor rebotaba, con
          razón, y la casa no tenía dónde escribirla.

          ⚠️ Y son DOS decisiones distintas, por eso no se resuelven con una sola
          condición: **dibujar** no es **exigir**. Se ofrece en los tres porque
          explicar una devolución total también le sirve a la familia; se bloquea
          sólo donde el motor bloquea. *Una pantalla más estricta que su motor
          también es un defecto — sólo que uno que nadie reporta, porque parece
          prudencia.* */}
      <input type="text"
             placeholder={alcance === 'parcial'
               ? 'Por qué se devuelve esa parte — la familia lo va a leer'
               : alcance === 'total'
                 ? 'Por qué se devuelve todo (opcional) — la familia lo va a leer'
                 : 'El motivo — la familia lo va a leer'}
             value={motivo} onChange={(e) => setMotivo(e.target.value)}
             style={campo} />

      {error ? <div style={{ marginTop: sp[3] }}><Fallo mensaje={error} /></div> : null}

      <div style={{ marginTop: sp[4] }}>
        <Boton onClick={decidir} disabled={!alcance || faltaMonto || faltaRazon || enviando}>
          {enviando ? 'Registrando…' : 'Registrar la decisión'}
        </Boton>
      </div>

      {/* El botón apagado dice POR QUÉ está apagado (L-424: un guard que sólo
          sabe negarse manda a reintentar). */}
      {alcance && faltaRazon ? (
        <p style={{ color: color.texto3, fontSize: 12, margin: `${sp[2]}px 0 0` }}>
          Falta escribir por qué. La familia lo va a leer.
        </p>
      ) : null}
      {!alcance ? (
        <p style={{ color: color.texto2, fontSize: 12, margin: `${sp[2]}px 0 0` }}>
          Elige qué hacer para poder registrarlo.
        </p>
      ) : faltaMonto ? (
        <p style={{ color: color.texto2, fontSize: 12, margin: `${sp[2]}px 0 0` }}>
          Una devolución parcial necesita su monto.
        </p>
      ) : (
        <p style={{ color: color.texto2, fontSize: 12, margin: `${sp[2]}px 0 0`, lineHeight: 1.5 }}>
          Queda escrito quién decidió, el hecho entra al hilo y sale el aviso.
        </p>
      )}
    </Seccion>
  )
}

function Responder({ casoId, alEnviar }: { casoId: string; alEnviar: () => void }) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    if (!texto.trim()) return
    setEnviando(true); setError(null)
    const r = await responderEnCaso(casoId, texto.trim())
    setEnviando(false)
    if (!r.ok) { setError(r.mensaje); return }
    setTexto(''); alEnviar()
  }

  return (
    <Seccion titulo="Escribir en el hilo">
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3}
        placeholder="Lo que la familia y el prestador van a leer"
        style={{ ...campo, marginTop: 0, resize: 'vertical', fontFamily: fuente.cuerpo }} />
      {error ? <div style={{ marginTop: sp[3] }}><Fallo mensaje={error} /></div> : null}
      <div style={{ marginTop: sp[3] }}>
        <Boton onClick={enviar} disabled={!texto.trim() || enviando}>
          {enviando ? 'Enviando…' : 'Enviar'}
        </Boton>
      </div>
    </Seccion>
  )
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: `${sp[1.5]}px 0`, fontSize: 13,
    }}>
      <span style={{ color: color.texto2 }}>{etiqueta}</span>
      <span style={{ color: color.texto }}>{children}</span>
    </div>
  )
}

const campo: React.CSSProperties = {
  width: '100%', marginTop: sp[3], padding: `${sp[2]}px ${sp[3]}px`,
  border: `1px solid ${color.borde}`, borderRadius: radio.suave,
  fontSize: 13, fontFamily: fuente.mono, boxSizing: 'border-box',
  background: color.carta, color: color.texto,
}
