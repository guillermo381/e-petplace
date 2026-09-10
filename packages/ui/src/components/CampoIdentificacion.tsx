/**
 * CampoIdentificacion — «¿A NOMBRE DE QUIÉN?» (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA DECISIÓN QUE GOBIERNA LA PIEZA: **el tipo se ELIGE, jamás se adivina.**
 *
 * El camino que parece cómodo es inferir por la cantidad de dígitos —10 es
 * cédula, 13 es RUC— y es el malo, por dos razones que se miden:
 *   · **mientras alguien tipea, TODA cédula pasa por ser un RUC incompleto**,
 *     así que la pieza estaría cambiando de tipo debajo de la mano;
 *   · **un pasaporte no tiene largo**, así que la inferencia no cubre el
 *     tercer caso y habría que pedir el tipo igual.
 * ⇒ un selector explícito arriba, **cédula por defecto** porque es lo que
 * usa casi toda familia.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── CUÁNDO SE VALIDA, Y ES LA MITAD DE LA PIEZA ─────────────────────────
 * 🔴 **NUNCA tecla por tecla.** Validar en cada pulsación pinta de rojo un
 * número que todavía se está escribiendo: la persona ve el error antes de
 * haber terminado de tipear, y lo que la pantalla le dice es «te
 * equivocaste» cuando lo único que pasa es que va por la mitad.
 *
 * Se valida en dos momentos, los dos declarados por `LARGO`:
 *   ① **cuando el valor LLEGA a su largo** (10 · 13) — ahí ya hay un número
 *      completo que juzgar;
 *   ② **al salir del campo** — para el pasaporte, que no tiene largo, y para
 *      el número que quedó corto.
 *
 * ── EL FOCO NO SE ROBA, Y ES UN DESVÍO DECLARADO ────────────────────────
 * La orden decía *«y el campo queda enfocado»*. Se implementa como **el
 * campo CONSERVA el foco**, no como «se lo devolvemos a la fuerza».
 * *Un campo que se re-enfoca solo al fallar la validación atrapa a la
 * persona adentro: no puede irse a corregir el campo de arriba, ni cerrar el
 * teclado para leer el error.* Es un anti-patrón de accesibilidad conocido y
 * choca con la Ley 17.4 —los errores DIRIGEN— porque en vez de dirigir,
 * secuestra. **Se declara en vez de hacerse callado: si el founder quería el
 * re-foco literal, es una línea.**
 *
 * ── EL AVISO DE RUC GANA SOBRE EL ERROR DE CÉDULA ───────────────────────
 * Trece dígitos en modo cédula son a la vez «cédula inválida» y «esto parece
 * un RUC». **Gana el segundo**, y va como AYUDA y no como error: uno le dice
 * a la persona qué hacer (*«cámbialo arriba»*), el otro solo le dice que
 * está mal. Ley 17.4 otra vez, y es la razón de que `PieDeCampo` distinga
 * `alarma` de `estado`.
 *
 * ── LO QUE ESTA PIEZA NO HACE ───────────────────────────────────────────
 * **No sabe cuándo hay que pedir RUC** (eso es negocio: `MODELO_FISCAL`), no
 * llama al SRI, y **no afirma que la identificación EXISTA** — el dígito
 * verificador prueba forma. Por eso la voz dice *«no parece una cédula
 * válida»*: es lo que medimos.
 *
 * ⚠️ Y **cero tarifa, cero porcentaje, cero «IVA»** adentro: esta pieza no
 * conoce impuestos. Lo vigila `R84`.
 */

import { useState } from 'react'
import { View } from 'react-native'

import { Campo } from './Campo'
import { SelectorOpcion } from './SelectorOpcion'
import { Tilde } from './tilde'
import {
  LARGO,
  esIdentificacionValida,
  soloAlfanumerico,
  soloDigitos,
  type TipoIdentificacion,
} from './identificacion-ec'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/** El dato completo. **Espejo del vocabulario de `facturas`** en la base
 *  (`tipo_identificacion` · `identificacion` · `razon_social` · `direccion` ·
 *  `email`) — no es vocabulario nuevo: la tabla ya existe y esta pieza
 *  obedece a lo que hay. */
export interface DatosIdentificacion {
  tipo: TipoIdentificacion
  identificacion: string
  /** **Obligatoria solo con RUC.** Con cédula o pasaporte viaja vacía: el
   *  campo ni se dibuja. */
  razonSocial: string
  direccion: string
  email: string
}

export interface CampoIdentificacionProps {
  valor: DatosIdentificacion
  onCambiar: (valor: DatosIdentificacion) => void
  /** `'control'` (familia) · `'oficio'` (negocio). Ley 22. */
  acento?: 'control' | 'oficio'
}

/** El orden del selector: cédula primero **porque es el caso de casi toda
 *  familia**, no por alfabeto. */
const TIPOS: readonly TipoIdentificacion[] = ['cedula', 'ruc', 'pasaporte']

export function CampoIdentificacion({ valor, onCambiar, acento = 'control' }: CampoIdentificacionProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  /* `tocado` es lo que separa «todavía no terminó» de «terminó y está mal».
     Sin él, el campo nacería en rojo al montarse vacío. */
  const [tocado, setTocado] = useState(false)

  const largo = LARGO[valor.tipo]
  const completo = largo === null ? valor.identificacion.trim().length > 0 : valor.identificacion.length === largo
  const valido = completo && esIdentificacionValida(valor.tipo, valor.identificacion)

  /* Los DOS momentos de ①/②: el largo alcanzado, o el campo ya visitado. */
  const seJuzga = completo || tocado
  const pareceRuc = valor.tipo === 'cedula' && valor.identificacion.length === 13

  const cambiar = (parche: Partial<DatosIdentificacion>) => onCambiar({ ...valor, ...parche })

  const alTipear = (crudo: string) => {
    const limpio =
      valor.tipo === 'pasaporte'
        ? soloAlfanumerico(crudo)
        : /* Se sanea con UN dígito de más que el largo, a propósito: sin ese
             margen la pieza no podría enterarse de que alguien escribió 13
             dígitos en modo cédula, que es justo el aviso de abajo. */
          soloDigitos(crudo, valor.tipo === 'cedula' ? 13 : (largo ?? 13))
    cambiar({ identificacion: limpio })
  }

  /** El aviso de RUC gana sobre el error (ver la cabecera).
   *
   *  ⚠️ **Viaja por `ayuda` y no por `error`, y eso resuelve solo el tono:**
   *  `PieDeCampo` pinta la ayuda en `text.secondary` y reserva
   *  `status.dangerText` para el error. *Medido antes de escribirlo: `Campo`
   *  no expone la prop `tono` —la tiene `PieDeCampo` y su consumidor no se la
   *  pasa—, así que ensanchar `Campo` era el camino obvio y resultó
   *  innecesario.* Un aviso que dice qué hacer no es una alarma, y por eso
   *  el canal correcto ya era el sereno. */
  const mensaje: { error?: string; ayuda?: string } = pareceRuc
    ? { ayuda: t('identificacion.pareceRuc') }
    : seJuzga && !valido
      ? { error: t(valor.tipo === 'ruc' ? 'identificacion.rucInvalido' : 'identificacion.cedulaInvalida') }
      : {}

  return (
    <View style={{ gap: spacing[4] }}>
      <SelectorOpcion
        etiqueta={t('identificacion.aNombreDe')}
        opciones={TIPOS.map((tipo) => ({ codigo: tipo, etiqueta: t(`identificacion.tipo.${tipo}`) }))}
        seleccionada={valor.tipo}
        onSelect={(codigo) => {
          /* Cambiar de tipo LIMPIA el número, y no es celo: un valor saneado
             para 10 dígitos numéricos no significa nada como pasaporte, y
             dejarlo ahí haría que la persona vea su cédula bajo un rótulo que
             ya no le corresponde. También se limpia la razón social al salir
             de RUC — un dato que ya no se pide no se guarda en la sombra. */
          const tipo = codigo as TipoIdentificacion
          setTocado(false)
          cambiar({ tipo, identificacion: '', razonSocial: tipo === 'ruc' ? valor.razonSocial : '' })
        }}
        acento={acento}
        disposicion="fila"
      />

      <Campo
        label={t(`identificacion.etiqueta.${valor.tipo}`)}
        placeholder={t(`identificacion.formato.${valor.tipo}`)}
        value={valor.identificacion}
        onChangeText={alTipear}
        onBlur={() => setTocado(true)}
        /* El pasaporte acepta letras; los otros dos son numéricos. */
        keyboardType={valor.tipo === 'pasaporte' ? 'default' : 'number-pad'}
        autoCapitalize={valor.tipo === 'pasaporte' ? 'characters' : 'none'}
        autoCorrect={false}
        /* ⚠️ SIN `maxLength` — precedente medido de `CampoCodigo`: trunca el
           texto CRUDO antes de sanear, así que rompe el pegado con prefijo.
           El corte lo hace `soloDigitos`. */
        error={mensaje.error}
        ayuda={mensaje.ayuda}
        iconoDer={
          valido ? (
            /* El check: chico, quieto y al final del campo. **Sin animación**
               — Ley 6, y además la regla rectora de `Campo` es que nada se
               mueve mientras alguien tipea. Aparecer YA es la señal. */
            <Tilde color={theme.status.successText} tamano={16} grosor={2.2} />
          ) : undefined
        }
      />

      {valor.tipo === 'ruc' ? (
        <Campo
          label={t('identificacion.razonSocial')}
          placeholder={t('identificacion.razonSocialFormato')}
          value={valor.razonSocial}
          onChangeText={(razonSocial) => cambiar({ razonSocial })}
          autoCapitalize="words"
        />
      ) : null}

      <Campo
        label={t('identificacion.direccion')}
        placeholder={t('identificacion.direccionFormato')}
        value={valor.direccion}
        onChangeText={(direccion) => cambiar({ direccion })}
        autoCapitalize="sentences"
      />

      <Campo
        label={t('identificacion.email')}
        placeholder={t('identificacion.emailFormato')}
        value={valor.email}
        onChangeText={(email) => cambiar({ email })}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        /* El correo es a dónde LLEGA la factura, y por eso lo dice acá y no
           en una pantalla de ayuda: es la consecuencia de lo que escribe. */
        ayuda={t('identificacion.emailAyuda')}
      />
    </View>
  )
}
