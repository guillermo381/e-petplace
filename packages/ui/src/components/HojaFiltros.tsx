/**
 * HojaFiltros — LOS NUEVE FILTROS DE LA VIDRIERA (S112-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **DEVUELVE EL OBJETO QUE VA AL MOTOR, TAL CUAL. SIN VOCABULARIO PROPIO.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `FiltrosAdoptables` es el ESPEJO de la lista blanca de `obtener_adoptables`,
 * con sus nombres exactos —`convive_perros`, `ciudad_id`, `con_pareja`—
 * incluida la forma `snake_case` que en el resto de `packages/ui` no se usa.
 * *Es deliberado:* si la hoja devolviera su propio vocabulario, la pantalla
 * necesitaría un mapa en el medio, **y ese mapa es una segunda verdad que
 * diverge sola** el día que el motor sume un filtro.
 *
 * ⚠️ **Y el tipo vive acá y no se importa de `packages/api`** por la misma
 * razón de siempre: el sistema de diseño no depende de la capa de datos. La
 * divergencia, si llega, **rompe en el sitio de llamada**: un filtro que el
 * motor quite deja este objeto sin ser asignable. Al revés —el motor suma uno
 * y la hoja no lo ofrece— no rompe nada, y está bien: *ofrecer un filtro es
 * una decisión de producto, no una consecuencia de una migración.*
 *
 * ── 🔴 CONVIVENCIA: TRES ESTADOS, Y EL TERCERO ES DE PRIMERA CLASE ───────
 * Jamás un check. Con un booleano, «todavía no se sabe» se guarda como
 * `false` **y eso afirma «no convive» sobre un animal que nadie probó** — la
 * misma trampa que `Convivencia` y `SemaforoSanitario` ya cerraron en este
 * vertical. Acá el filtro tiene **cuatro** posibilidades y no tres: los tres
 * estados **más no filtrar**, que es lo que `FiltroPills` con `activo: null`
 * expresa sin inventar un valor.
 *
 * **Y la hoja no puede insinuar que filtrar los descarta**, porque no los
 * descarta: con un filtro de convivencia activo el lector devuelve
 * `ordenPorConvivencia`, los confirmados van primero y **los «todavía no se
 * sabe» van abajo, con su título y el mismo peso** (§4.1). *Esconderlos
 * dejaría animales sin ver por un dato que falta.* Lo dibuja la lista; acá se
 * cumple **mostrando el tercer estado como una opción elegible más**, que es
 * lo que dice sin palabras que no es un descarte.
 *
 * ── 🔴 `esterilizado` ES BINARIO Y ESCONDE UNA AUSENCIA — por eso su «i» es
 *    OBLIGATORIA ──────────────────────────────────────────────────────────
 * Medido por C contra el motor: **sólo trae los declarados `si`**. Un refugio
 * que no lo declaró desaparece de los resultados, y **la persona no tiene
 * forma de saberlo**: pidió «esterilizado» y recibió una lista más corta sin
 * enterarse de que perdió animales por un dato que falta, no por un hecho.
 *
 * *Es la misma asimetría que convivencia resolvió con su tercer estado, y acá
 * NO se puede resolver igual: el motor acepta un booleano.* ⇒ lo que sí se
 * puede es **no dejar que quede callado**: `explicaEsterilizado` es
 * obligatoria y va detrás de la «i» de la casa (N22). *Un filtro que angosta
 * en silencio es peor que uno que no existe.*
 *
 * ── LAS DOS QUE EL MOTOR ACEPTA Y ESTA HOJA NO OFRECE, con su razón ──────
 * · **`edad_min_meses` / `edad_max_meses`** — traducir «cachorro / adulto /
 *   mayor» a meses **depende de la especie**, y los umbrales viven en
 *   `cat_especies_perfil`, que ningún lector de adopción trae. *Una hoja que
 *   diga «cachorro» eligiendo un número que la casa no declaró le miente a
 *   las dos especies a la vez.* Entra el día que llegue el lector.
 * · **`country_code`** — no es una elección de la familia.
 * · Y **no hay «cerca de mí»**, que sería lo natural: no existe filtro de
 *   distancia en la lista blanca, y **fabricarlo con `ciudad_id` sería
 *   llamar «cerca» a otra cosa.**
 *
 * ── CERO CONTROL NUEVO ───────────────────────────────────────────────────
 * Los nueve grupos son **ocho `FiltroPills`**: siete de selección única
 * (`activo: C | null` — el `null` ES «no filtrar») y uno de selección
 * múltiple para los tres binarios. `disposicion="envuelve"` en todos, por la
 * medición que esa pieza ya lleva escrita: *en una hoja dedicada a filtrar,
 * un riel horizontal esconde parte del eje y no dice cuánto esconde.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La lista de la vidriera (C2), sobre `obtener_adoptables`. **Entregada y no
 * montada.**
 */
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { Boton } from './Boton'
import { BotonExplicar, type ConExplicacion } from './BotonExplicar'
import type { EstadoConvivencia } from './Convivencia'
import { FiltroPills, type OpcionFiltro } from './FiltroPills'
import { Hoja } from './Hoja'
import { Texto } from './Texto'

/**
 * EL OBJETO QUE VIAJA AL MOTOR. Nombres y forma de la lista blanca de
 * `obtener_adoptables` — no se traducen. Ausente = no se filtra por eso.
 */
export type FiltrosAdoptables = {
  especie?: string
  talla?: string
  sexo?: string
  ciudad_id?: string
  urgente?: boolean
  esterilizado?: boolean
  con_pareja?: boolean
  convive_perros?: EstadoConvivencia
  convive_gatos?: EstadoConvivencia
  convive_ninos?: EstadoConvivencia
}

/** Los tres binarios, como códigos del grupo múltiple. */
type CodigoBinario = 'urgente' | 'esterilizado' | 'con_pareja'

export type HojaFiltrosProps = {
  visible: boolean
  onCerrar: () => void
  /**
   * Los filtros de AHORA. La hoja arranca desde acá cada vez que se abre —
   * no guarda estado entre aperturas: *una hoja que recuerda lo que la lista
   * ya olvidó muestra dos verdades a la vez.*
   */
  filtros: FiltrosAdoptables
  /** Al aplicar. El objeto va **tal cual** al motor. */
  onAplicar: (filtros: FiltrosAdoptables) => void
  /**
   * Lo que el catálogo ofrece, ya en voz de la casa. La hoja **no trae
   * ninguna lista cableada**: el día que la casa adopte una tercera especie,
   * sale del catálogo y no de acá.
   */
  opciones: {
    especies: OpcionFiltro<string>[]
    tallas: OpcionFiltro<string>[]
    sexos: OpcionFiltro<string>[]
    ciudades: OpcionFiltro<string>[]
  }
  /**
   * 🔴 OBLIGATORIA — ver la nota de `esterilizado` en la cabecera. Detrás de
   * la «i»: que el filtro sólo trae los que el refugio DECLARÓ esterilizados.
   */
  explicaEsterilizado: ConExplicacion
  /** Opcional: qué pasa con los «todavía no se sabe» al filtrar convivencia. */
  explicaConvivencia?: ConExplicacion
  /** Todas las palabras (Ley 3). */
  voces: {
    titulo: string
    aplicar: string
    limpiar: string
    grupos: {
      especie: string
      talla: string
      sexo: string
      ciudad: string
      convivePerros: string
      conviveGatos: string
      conviveNinos: string
      binarios: string
    }
    /** Las tres del eje de convivencia. `Record` = un cuarto estado rompe acá. */
    convivencia: Record<EstadoConvivencia, string>
    binarios: Record<CodigoBinario, string>
  }
}

/** El orden semántico de los tres, igual que en `ConvivenciaInput`. */
const ORDEN_CONVIVENCIA: readonly EstadoConvivencia[] = ['si', 'no', 'no_se_sabe']

/** Un grupo con su rótulo, y su «i» al lado si la tiene. */
function Grupo({
  rotulo,
  explica,
  children,
}: {
  rotulo: string
  explica?: ConExplicacion
  children: React.ReactNode
}) {
  return (
    <View style={{ gap: spacing[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <View style={{ flex: 1 }}>
          <Texto variante="seccion">{rotulo}</Texto>
        </View>
        {explica === undefined ? null : <BotonExplicar {...explica} />}
      </View>
      {children}
    </View>
  )
}

export function HojaFiltros({
  visible,
  onCerrar,
  filtros,
  onAplicar,
  opciones,
  explicaEsterilizado,
  explicaConvivencia,
  voces,
}: HojaFiltrosProps) {
  /* El borrador vive acá: se elige, y recién al APLICAR sale. Arranca de
     `filtros` en cada apertura — ver la nota de esa prop. */
  const [borrador, setBorrador] = useState<FiltrosAdoptables>(filtros)
  useEffect(() => {
    if (visible) setBorrador(filtros)
  }, [visible, filtros])

  const uno = <K extends 'especie' | 'talla' | 'sexo' | 'ciudad_id'>(clave: K) => ({
    activo: borrador[clave] ?? null,
    onCambio: (c: string) => setBorrador((b) => ({ ...b, [clave]: c })),
    onLimpiar: () => setBorrador(({ [clave]: _, ...resto }) => resto),
  })

  const convivencia = (clave: 'convive_perros' | 'convive_gatos' | 'convive_ninos') => ({
    opciones: ORDEN_CONVIVENCIA.map((e) => ({
      codigo: e,
      etiqueta: voces.convivencia[e],
      icono: null,
    })),
    activo: borrador[clave] ?? null,
    onCambio: (c: EstadoConvivencia) => setBorrador((b) => ({ ...b, [clave]: c })),
    onLimpiar: () => setBorrador(({ [clave]: _, ...resto }) => resto),
  })

  /* Los tres binarios en UN grupo múltiple: son del mismo eje —«mostrame
     sólo los que…»— y separarlos en tres filas de un chip cada una sería
     tres rótulos para tres palabras. */
  const binariosActivos = (['urgente', 'esterilizado', 'con_pareja'] as const).filter(
    (k) => borrador[k] === true,
  )

  return (
    <Hoja
      visible={visible}
      onCerrar={onCerrar}
      titulo={voces.titulo}
      /* `completa` y no `media`: son ocho grupos, y una hoja a media
         pantalla los deja a todos detrás de un scroll —el mismo defecto de
         forma que `FiltroPills` midió con la tira, un piso más arriba. */
      altura="completa"
      pie={
        <>
          <Boton
            etiqueta={voces.aplicar}
            bloque
            onPress={() => {
              onAplicar(borrador)
              onCerrar()
            }}
          />
          <Boton
            etiqueta={voces.limpiar}
            variante="secundario"
            bloque
            /* Limpiar es aplicar el objeto VACÍO, no un estado aparte: si
               limpiara sólo el borrador, la lista seguiría filtrada detrás
               de una hoja que dice que no hay filtros. */
            onPress={() => {
              setBorrador({})
              onAplicar({})
              onCerrar()
            }}
          />
        </>
      }
    >
      <View style={{ gap: spacing[6] }}>
        <Grupo rotulo={voces.grupos.especie}>
          <FiltroPills opciones={opciones.especies} disposicion="envuelve" {...uno('especie')} />
        </Grupo>

        <Grupo rotulo={voces.grupos.talla}>
          <FiltroPills opciones={opciones.tallas} disposicion="envuelve" {...uno('talla')} />
        </Grupo>

        <Grupo rotulo={voces.grupos.sexo}>
          <FiltroPills opciones={opciones.sexos} disposicion="envuelve" {...uno('sexo')} />
        </Grupo>

        <Grupo rotulo={voces.grupos.ciudad}>
          <FiltroPills opciones={opciones.ciudades} disposicion="envuelve" {...uno('ciudad_id')} />
        </Grupo>

        {/* LOS TRES EJES DE CONVIVENCIA, cada uno con sus TRES estados. El
            tercero se ve y se puede elegir: eso es lo que dice, sin palabras,
            que filtrar no lo descarta. */}
        <Grupo rotulo={voces.grupos.convivePerros} explica={explicaConvivencia}>
          <FiltroPills disposicion="envuelve" {...convivencia('convive_perros')} />
        </Grupo>
        <Grupo rotulo={voces.grupos.conviveGatos}>
          <FiltroPills disposicion="envuelve" {...convivencia('convive_gatos')} />
        </Grupo>
        <Grupo rotulo={voces.grupos.conviveNinos}>
          <FiltroPills disposicion="envuelve" {...convivencia('convive_ninos')} />
        </Grupo>

        {/* LOS BINARIOS. La «i» del grupo es la de `esterilizado` — el único
            de los tres que angosta escondiendo una ausencia. */}
        <Grupo rotulo={voces.grupos.binarios} explica={explicaEsterilizado}>
          <FiltroPills
            opciones={(['urgente', 'esterilizado', 'con_pareja'] as const).map((c) => ({
              codigo: c,
              etiqueta: voces.binarios[c],
              icono: null,
            }))}
            disposicion="envuelve"
            activos={binariosActivos}
            onAlternar={(c) =>
              setBorrador((b) => {
                if (b[c] === true) {
                  const { [c]: _, ...resto } = b
                  return resto
                }
                return { ...b, [c]: true }
              })
            }
          />
        </Grupo>
      </View>
    </Hoja>
  )
}
