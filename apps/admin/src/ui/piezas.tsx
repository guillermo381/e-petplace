/**
 * LAS PIEZAS WEB DE LA MESA — construidas sobre los tokens de la casa.
 * No hay componentes de React Native acá: `packages/ui` no entra a este bundle.
 */
import type { CSSProperties, ReactNode } from 'react'
import { color, sp, radio, fuente } from '../tokens'

export function Carta({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: color.carta, border: `1px solid ${color.borde}`,
      borderRadius: radio.md, padding: sp[5], ...style,
    }}>{children}</div>
  )
}

export function Boton({
  children, onClick, variante = 'primario', disabled, type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variante?: 'primario' | 'secundario' | 'peligro'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const fondo =
    variante === 'primario' ? color.acento :
    variante === 'peligro'  ? color.peligro : 'transparent'
  const texto = variante === 'secundario' ? color.texto : '#FFFFFF'
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      style={{
        background: disabled ? color.texto3 : fondo,
        color: disabled ? '#FFFFFF' : texto,
        border: variante === 'secundario' ? `1px solid ${color.bordeFuerte}` : 'none',
        // Ley de geometría: esto se ELIGE ⇒ rectángulo suave, no píldora.
        borderRadius: radio.suave,
        padding: `${sp[2.5]}px ${sp[4]}px`,
        fontSize: 14, fontWeight: 600, fontFamily: fuente.cuerpo,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >{children}</button>
  )
}

/** Un número de plata. SIEMPRE mono y tabular (Ley 3). */
export function Monto({ valor, moneda = 'USD', tono }: {
  valor: number; moneda?: string; tono?: 'normal' | 'apagado'
}) {
  return (
    <span style={{
      fontFamily: fuente.mono, fontVariantNumeric: 'tabular-nums',
      color: tono === 'apagado' ? color.texto2 : color.texto,
      fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {moneda === 'USD' ? '$' : `${moneda} `}
      {valor.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

export function Insignia({ children, tono = 'neutro' }: {
  children: ReactNode; tono?: 'neutro' | 'alerta' | 'exito' | 'peligro'
}) {
  const c = tono === 'alerta' ? color.alerta
    : tono === 'exito' ? color.exito
    : tono === 'peligro' ? color.peligro : color.texto2
  return (
    <span style={{
      // Esto INFORMA ⇒ píldora (Ley de geometría, la otra mitad).
      borderRadius: radio.full, border: `1px solid ${c}`, color: c,
      padding: `2px ${sp[2]}px`, fontSize: 11, fontWeight: 700,
      fontFamily: fuente.cuerpo, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

/**
 * EL VACÍO QUE HABLA — y por eso recibe `porque` obligatorio.
 *
 * La consigna de F3 es literal: **jamás `$0` mudo**. Un vacío sin causa es
 * indistinguible de un error, y sobre plata de terceros esa ambigüedad es
 * exactamente lo que no se puede permitir. Por eso el `porque` no es opcional:
 * *el tipo obliga a decir por qué antes de poder mostrar nada.*
 */
export function VacioQueHabla({ titulo, porque, accion }: {
  titulo: string; porque: string; accion?: ReactNode
}) {
  return (
    <div style={{
      padding: sp[8], textAlign: 'center', color: color.texto2,
      fontFamily: fuente.cuerpo,
    }}>
      <p style={{ color: color.texto, fontWeight: 700, fontSize: 15, margin: `0 0 ${sp[2]}px` }}>
        {titulo}
      </p>
      <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5, maxWidth: 520, marginInline: 'auto' }}>
        {porque}
      </p>
      {accion ? <div style={{ marginTop: sp[4] }}>{accion}</div> : null}
    </div>
  )
}

/** Un fallo se dice como fallo, jamás como vacío (L-178). */
export function Fallo({ mensaje, detalle }: { mensaje: string; detalle?: string | null }) {
  return (
    <div style={{
      border: `1px solid ${color.peligro}`, borderRadius: radio.suave,
      padding: sp[4], color: color.peligro, background: '#FFF5F5',
      fontFamily: fuente.cuerpo, fontSize: 13,
    }}>
      <strong>{mensaje}</strong>
      {detalle ? <div style={{ marginTop: sp[1], opacity: 0.8, fontSize: 12 }}>{detalle}</div> : null}
    </div>
  )
}
