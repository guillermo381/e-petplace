/**
 * S79-B (T2-B1): "PREPARA TU ESPACIO" — la tercera presencia de §2.4, en el
 * HOME (cura aprobada por el founder sobre el audit s79b-audit-dia1 §1.1).
 *
 * Las CUATRO tareas que existen (servicios · horarios · precios · equipo),
 * cada una con su POR QUÉ en voz humana, cualquier orden, SIN wizard, check
 * SUTIL (Insignia soloPunto capa 'vida' — jamás animación celebratoria).
 * La quinta (condiciones operativas) NO tiene superficie: es deuda declarada
 * en el boceto, no una pantalla inventada.
 *
 * ANATOMÍA 19.1 COMPUESTA CON `Celda` (declarado en el boceto M1):
 * `CeldaNavegacion` cumple la letra pero no tiene slot `fin` para el check —
 * acá se monta la MISMA anatomía (Icono b′ + título + detalle + chevron) sobre
 * el ladrillo de fila, que sí lo tiene. El ensanche de CeldaNavegacion (slot
 * `fin`) queda como pedido a la mesa; NO se copia el componente (L-175).
 *
 * CHECKS = SEÑAL POSITIVA VERIFICADA (patrón S78/D-521): `null` significa
 * "no se pudo verificar" (lectura caída o sin cuenta) y NO dibuja check — un
 * fallo no fabrica estado. La tarea sigue navegable siempre.
 */

import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter, type Href } from 'expo-router';
import {
  Celda,
  Icono,
  Insignia,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
  type IconoNombre,
} from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** Los cuatro talleres que existen como ruta. */
export type OficioTaller = 'veterinaria' | 'grooming' | 'paseo' | 'adiestramiento';

/** El mismo orden de prioridad que `equipo.tsx` usa para resolver el taller
 *  de una persona con varios chips — se repite el CRITERIO, no el código
 *  (allá resuelve por chips de empleado; acá por ofertas del negocio). */
const ORDEN_OFICIOS: readonly OficioTaller[] = ['veterinaria', 'grooming', 'paseo', 'adiestramiento'];

const RUTA_TALLER = {
  veterinaria: '/veterinaria/taller',
  grooming: '/grooming/taller',
  paseo: '/paseo/taller',
  adiestramiento: '/adiestramiento/taller',
} as const satisfies Record<OficioTaller, string>;

/** El nombre de la sección de OFERTA difiere por taller (medido, S98-D):
 *  paseo la llama `duraciones`; grooming y vet, `servicios`. Adiestramiento
 *  es página única y no lee `seccion` — el param sobra y no daña (mismo
 *  precedente declarado en `equipo.tsx`). */
const SECCION_OFERTA: Record<OficioTaller, string> = {
  veterinaria: 'servicios',
  grooming: 'servicios',
  paseo: 'duraciones',
  adiestramiento: 'servicios',
};

export type EstadoTareas = {
  serviciosOk: boolean;
  /** Derivado hoy de la misma data que servicios (declarado en el boceto M1). */
  preciosOk: boolean;
  /** null = no verificado (lectura caída) — sin check, sin afirmar pendiente. */
  horariosOk: boolean | null;
  /** null = no verificado (sin cuenta comercial o lectura caída). */
  equipoOk: boolean | null;
  /** ⭐ S98-D — LOS OFICIOS QUE EL NEGOCIO TIENE (hay fila de oferta, activa
   *  o no). Sale de las CUATRO lecturas de mundo que el loader ya hace: cero
   *  viaje nuevo. Vacío = todavía no eligió ningún oficio. */
  oficiosConOferta: readonly OficioTaller[];
};

function Chevron() {
  const { theme } = useTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <Path
        d="M9 18l6-6-6-6"
        stroke={theme.text.tertiary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ⭐ S98-D · LA CURA DEL HALLAZGO DEL FOUNDER — «UN CTA QUE PROMETE
   ESPECÍFICO Y ENTREGA GENÉRICO INFORMA SIN INFORMAR».
   Las tres primeras filas navegaban las tres a `/(tabs)/negocio`, el tab
   entero: la fila decía «tus horarios» y entregaba un tablero donde la
   palabra «horarios» no aparece. Solo `equipo` aterrizaba en su
   funcionalidad.

   EL MECANISMO NO SE INVENTA — YA EXISTÍA: los talleres leen `?seccion=`
   desde S78-B, y `equipo.tsx` ya lo usa para mandar a una persona a SU
   jornada. Acá se consume el mismo puente.

   LO QUE LA MEDICIÓN RESOLVIÓ, y por qué el caso difícil se cayó solo:
   · **HORARIOS no es por oficio.** Los 9 negocios vivos están en
     `modo_horarios = 'universal'` y las 51 franjas activas tienen
     `servicio_id IS NULL` — o sea que el taller de CUALQUIER oficio del
     negocio muestra y edita LAS MISMAS franjas. El destino es exacto
     aunque el negocio tenga tres oficios; lo único que cambia es el
     marco. Por eso acá se elige por prioridad y no se bloquea.
     🔴 SU FRONTERA, declarada e INERTE HOY: en `modo_horarios =
     'por_servicio'` las franjas SÍ son por oferta y esta elección
     volvería a ser una adivinanza. Cero negocios en ese modo hoy; el día
     que exista uno, esta línea es la que hay que volver a mirar.
   · **SERVICIOS y PRECIOS sí son por oficio.** Con UN oficio el destino
     es exacto. Con VARIOS no existe un destino único, y ahí la lista de
     mundos del tab Negocio ES el paso siguiente (elegir cuál configurar)
     — no es el mismo defecto: es el único lugar honesto que existe.
     Se declara en vez de disfrazarse. Medido: de los 5 negocios que ven
     este módulo, 2 tienen ≥2 oficios y 2 tienen cero.
   · **PRECIOS no tiene sección propia en ningún taller** — el precio se
     pone DENTRO de la sección de oferta. Su destino es el mismo que
     servicios, y eso es correcto: son dos tareas del checklist que se
     hacen en la misma pantalla, con estados de completitud distintos
     (una oferta activa puede tener precio 0). */
type ClaveTarea = 'servicios' | 'horarios' | 'precios' | 'equipo';

/** `null` = NO hay sección exacta a la que llevar; el llamador cae al tab
 *  Negocio, cuya lista de mundos es el paso que de verdad sigue. */
function destinoDe(clave: ClaveTarea, oficios: readonly OficioTaller[]): Href | null {
  if (clave === 'equipo') return '/negocio/equipo';

  const unico = oficios.length === 1 ? oficios[0] : null;
  const porPrioridad = ORDEN_OFICIOS.find((o) => oficios.includes(o)) ?? null;

  if (clave === 'horarios') {
    // Universal ⇒ cualquier taller del negocio sirve, y es exacto.
    return porPrioridad === null
      ? null
      : { pathname: RUTA_TALLER[porPrioridad], params: { seccion: 'horarios' } };
  }
  // servicios · precios: exacto SOLO con un oficio.
  return unico === null
    ? null
    : { pathname: RUTA_TALLER[unico], params: { seccion: SECCION_OFERTA[unico] } };
}

export function PreparaEspacio({ tareas }: { tareas: EstadoTareas }) {
  const router = useRouter();
  const { t } = useTraduccion();

  // Glifos del registry EXISTENTE (L-175, cero glifo nuevo): 'negocio' y
  // 'vacaciones' son STAND-IN declarados en el boceto (maletín para la oferta,
  // calendario para los horarios) — precedente del 'negocio' de cuenta
  // comercial (S59-B2).
  const filas: {
    clave: ClaveTarea;
    icono: IconoNombre;
    hecho: boolean | null;
    destino: () => void;
  }[] = (
    [
      { clave: 'servicios', icono: 'negocio', hecho: tareas.serviciosOk },
      { clave: 'horarios', icono: 'vacaciones', hecho: tareas.horariosOk },
      { clave: 'precios', icono: 'pagos', hecho: tareas.preciosOk },
      { clave: 'equipo', icono: 'equipo', hecho: tareas.equipoOk },
    ] as const
  ).map((f) => ({
    clave: f.clave,
    icono: f.icono as IconoNombre,
    hecho: f.hecho,
    destino: () => {
      const d = destinoDe(f.clave, tareas.oficiosConOferta);
      // El taller y Equipo son destinos APILADOS: se empujan, y la flecha
      // devuelve al HOY con su lista de tareas. El tab es el único que se
      // `navigate`a — empujar un tab deja la barra peleando con la pila.
      if (d === null) router.navigate('/(tabs)/negocio');
      else router.push(d);
    },
  }));

  return (
    <View style={{ gap: spacing[2] }}>
      <Texto variante="seccion">{t('preparaEspacio.titulo')}</Texto>
      <Texto variante="apoyo">{t('preparaEspacio.subtitulo')}</Texto>
      <Tarjeta elevacion="reposo" relleno="ninguno">
        {filas.map((fila, i) => (
          <View key={fila.clave}>
            {i > 0 && <Separador />}
            <Celda
              interactiva
              accessibilityRole="button"
              onPress={fila.destino}
              titulo={t(`preparaEspacio.${fila.clave}Titulo`)}
              subtitulo={t(`preparaEspacio.${fila.clave}PorQue`)}
              inicio={<Icono nombre={fila.icono} registro="aa" tamano={24} />}
              fin={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  {fila.hecho === true && (
                    <Insignia capa="vida" soloPunto etiqueta={t('preparaEspacio.checkHecho')} />
                  )}
                  <Chevron />
                </View>
              }
            />
          </View>
        ))}
      </Tarjeta>
    </View>
  );
}
