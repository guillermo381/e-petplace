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

/**
 * 🔴 REGLA DE EXISTENCIA — UN GRUPO SIN OPCIONES NO SE DIBUJA (S112-B).
 *
 * *Un grupo de filtro con rótulo y sin opciones debajo no dice «no hay»: dice
 * «esto se rompió».* Y el caso no es un borde — **es el normal**, medido por
 * C contra la base: `cat_ciudades` tiene RLS con policies sólo para
 * `authenticated`, y `anon` **tiene el GRANT y ninguna policy** ⇒ lee **cero
 * filas SIN error**. La vidriera de adopción se mira **sin sesión por firma
 * del founder**, así que el grupo de ciudad llega vacío en el camino más
 * transitado del vertical.
 *
 * ⚠️ **Y la regla vale aunque la policy llegue**, que es lo que la vuelve una
 * regla y no un parche: sirve igual a un catálogo que falló, a un eje que
 * todavía no cargó y a un país con una sola ciudad. *El dibujo no puede
 * depender de que un catálogo siempre tenga filas.*
 *
 * Vive en UN solo lugar y no en los cuatro sitios de llamada, por la razón de
 * siempre: cuatro copias de una condición son cuatro lugares donde puede
 * faltar una.
 *
 * ── ⚖️ EL CORTE ES EN CERO Y NO EN UNA — decidido, con su medición ────────
 * *Con UNA sola opción el grupo se dibuja y filtrar no cambia nada*, y eso
 * roza la ley de la casa sobre los toques que no hacen nada. **Se midió antes
 * de decidir: `cat_ciudades` activas son EC = 8 · CO = 1**, así que el caso
 * existe hoy — aunque no llegue a esta pantalla, porque la vidriera es
 * anónima, no sabe de qué país mira quien mira, y pide el catálogo entero.
 *
 * 🔴 **Y la razón de NO cortar en una es mejor que la de cortar** (es de C,
 * y es la que decide): *un control que APARECE cuando el catálogo crece es
 * peor que uno que no angosta.* Con corte en una, el grupo «Ciudad» se
 * materializa el día que alguien agrega la segunda ciudad de Colombia —
 * **una superficie que cambia de forma según cuántas filas tiene una tabla le
 * enseña a la familia que la app es inestable**, y quien la ve dos veces no
 * puede saber qué cambió.
 *
 * Sus otras dos, conservadas porque cierran el caso: con una opción, *«sólo
 * operamos en Quito»* **es lo que la persona necesita saber** antes de
 * recorrer una lista buscando su ciudad — esconderlo le ahorra un toque
 * inútil y le cuesta el dato · y el defecto real de ese caso **no es el
 * grupo: es que la única opción no se distingue de «todas»**, y ocultar el
 * grupo borra información en vez de curarlo.
 *
 * ── ✅ Y LA REGLA SOBREVIVIÓ A QUE SU CASO SE CURARA EN EL MOTOR ──────────
 * A abrió `cat_ciudades_select_anon USING (activo = true)`
 * (`20260908600000`), así que **la lista ya no llega vacía y esta regla no se
 * dispara en el montaje de hoy**. **No se retira**, y la razón es la que las
 * dos pistas habían escrito ANTES de que la policy existiera: *el dibujo no
 * puede depender de que un catálogo siempre tenga filas.* Lo que cambió es
 * que dejó de ser el camino más transitado y volvió a ser lo que siempre
 * debió proteger — **un catálogo que no respondió.**
 */
function GrupoDeCatalogo<C extends string>({
  rotulo,
  opciones,
  activo,
  onCambio,
  onLimpiar,
}: {
  rotulo: string
  opciones: OpcionFiltro<C>[]
  activo: C | null
  onCambio: (c: C) => void
  onLimpiar: () => void
}) {
  if (opciones.length === 0) return null
  return (
    <Grupo rotulo={rotulo}>
      <FiltroPills
        opciones={opciones}
        disposicion="envuelve"
        activo={activo}
        onCambio={onCambio}
        onLimpiar={onLimpiar}
      />
    </Grupo>
  )
}

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
        {/* LOS CUATRO DE CATÁLOGO — cada uno desaparece si su lista vino
            vacía. Ver la regla de existencia arriba: el caso NORMAL de la
            vidriera anónima es que `ciudad` no traiga nada. */}
        <GrupoDeCatalogo rotulo={voces.grupos.especie} opciones={opciones.especies} {...uno('especie')} />
        <GrupoDeCatalogo rotulo={voces.grupos.talla} opciones={opciones.tallas} {...uno('talla')} />
        <GrupoDeCatalogo rotulo={voces.grupos.sexo} opciones={opciones.sexos} {...uno('sexo')} />
        <GrupoDeCatalogo rotulo={voces.grupos.ciudad} opciones={opciones.ciudades} {...uno('ciudad_id')} />

        {/* LOS TRES EJES DE CONVIVENCIA, cada uno con sus TRES estados. El
            tercero se ve y se puede elegir: eso es lo que dice, sin palabras,
            que filtrar no lo descarta.

            ⚠️ Éstos y el de binarios **no pasan por la regla de existencia, y
            no es un olvido**: sus opciones no vienen de un catálogo — las
            arma la pieza con las voces obligatorias, así que nunca pueden
            llegar vacías. *La regla protege de un catálogo que no respondió;
            acá no hay catálogo del que depender.* */}
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
