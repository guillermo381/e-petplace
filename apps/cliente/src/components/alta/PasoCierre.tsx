/**
 * S91-D · EL CIERRE — la llamada atómica, y el único lugar donde los dos
 * modos difieren de verdad.
 *
 * `primera`   → `crearFamiliaConPrimeraMascota` (familia + titular + mascota)
 * `adicional` → `agregarMascotaAFamilia` (la RPC deriva la familia del caller)
 *
 * TODO LO DEMÁS ES IDÉNTICO y por eso vive una sola vez: la foto sube primero
 * y su fallo se dice (jamás se pierde en silencio, regla 36), el encuadre se
 * declara después sin frenar el alta, y el error tiene voz humana con
 * reintento.
 *
 * ── EL MODAL, con su texto firmado ──────────────────────────────────────────
 * Aparece al crear, no antes. Y detrás de «Completar ahora» hay EL PERFIL, no
 * una checklist: `MODELO_LOYALTY` §2 es literal —«la checklist es la
 * chorificación del cuidado y el dark pattern que mata el alma del
 * producto»—, y tampoco barra de progreso ni «perfil 40% completo».
 */

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  agregarMascotaAFamilia,
  crearFamiliaConPrimeraMascota,
  declararFotoMascota,
  obtenerSesion,
} from '@epetplace/api';

import { esPrecision, esSexo } from '@/lib/params';
import { subirAvatar } from '@/lib/subir-avatar';
import { useTraduccion } from '@/i18n';
import { esAcuario, esTipoDeAgua, MODO, type BorradorAlta, type ModoAlta } from './tipos';

export function PasoCierre({ modo, borrador }: { modo: ModoAlta; borrador: BorradorAlta }) {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const [error, setError] = useState<string | undefined>(undefined);
  const [errorDeFoto, setErrorDeFoto] = useState(false);
  const [sinFoto, setSinFoto] = useState(false);
  const [intento, setIntento] = useState(0);
  const [creada, setCreada] = useState<string | null>(null);
  const corriendoRef = useRef(false);

  const nombre = borrador.nombre ?? t('alta.tuMascota');

  useEffect(() => {
    if (corriendoRef.current) return;
    corriendoRef.current = true;
    void (async () => {
      const sesion = await obtenerSesion();
      const nombreDueno = sesion.ok && sesion.data !== null ? sesion.data.nombre : null;

      // Foto primero (S45-B4.1): sube a mascotas/{uid}/ y el vínculo entra
      // por la RPC. Si falla, se frena con error visible — jamás se pierde
      // la foto en silencio (regla 36).
      let fotoPath: string | undefined;
      if (borrador.fotoUri && !sinFoto && sesion.ok && sesion.data !== null) {
        const subida = await subirAvatar({ uri: borrador.fotoUri, userId: sesion.data.user_id });
        if (!subida.ok) {
          corriendoRef.current = false;
          setErrorDeFoto(true);
          setError(t('alta.errorFoto'));
          return;
        }
        fotoPath = subida.path;
      }

      // ── EL CAMPO DOS SE PARTE ACÁ, Y SOLO ACÁ ─────────────────────────────
      // La pantalla tiene UN slot («en espejo de la raza», firma de mesa) y el
      // motor tiene DOS parámetros MUTUAMENTE EXCLUYENTES: A los hizo rebotar
      // tipado en los dos sentidos —`raza_no_aplica_acuario` si un pez manda
      // raza, `tipo_agua_solo_pez` si otro manda agua (leído de la migración
      // 20260807183000, no del mensaje)—. Mandar los dos juntos sería un rojo
      // garantizado, así que la traducción slot→parámetro vive en un lugar
      // único y a la vista.
      //
      // `sujeto` NO se manda: lo estampa el motor desde la especie. Un cliente
      // que pudiera declarar «esto es un acuario» podría declarar que un perro
      // lo es.
      const campoDos = esAcuario(borrador.especie)
        ? esTipoDeAgua(borrador.raza)
          ? { tipo_agua: borrador.raza }
          : null
        : borrador.raza
          ? { raza: borrador.raza }
          : null;

      // ⚠️ `origen` VIAJA DESDE LA PANTALLA Y TODAVÍA NO LLEGA. Medido contra
      // la migración que A aplicó: `p_origen` aparece **cero veces**
      // (`grep -c p_origen` sobre 20260807183000 → 0), y las dos firmas vivas
      // confirman que ganaron `p_raza` y `p_tipo_agua` y nada más. La columna
      // `mascotas.origen` existe con su CHECK de nueve valores desde antes.
      // ⇒ El paso 3 pregunta cómo llegó a la casa y la respuesta se pierde en
      // el viaje. **Está declarado, no disimulado** — es el primer pedido
      // pendiente a A, y del lado de acá es UNA línea acá abajo.
      const comunes = {
        nombre_mascota: borrador.nombre ?? '',
        especie: borrador.especie ?? '',
        ...(borrador.fecha
          ? {
              fecha_nacimiento: borrador.fecha,
              ...(esPrecision(borrador.precision) ? { precision_fecha: borrador.precision } : null),
            }
          : null),
        ...(esSexo(borrador.sexo) ? { sexo: borrador.sexo } : null),
        ...(fotoPath !== undefined ? { foto_url: fotoPath } : null),
        ...campoDos,
      };

      const r =
        modo === 'primera'
          ? await crearFamiliaConPrimeraMascota({
              // dato PERSISTIDO: se traduce al crearse (idioma vigente del dueño)
              nombre_familia:
                nombreDueno !== null
                  ? t('alta.nombreFamilia', { nombre: nombreDueno })
                  : t('alta.nombreFamiliaFallback'),
              ...comunes,
            })
          : await agregarMascotaAFamilia(comunes);

      corriendoRef.current = false;
      if (!r.ok) {
        if (r.codigo === 'familia_ya_existe') {
          // Idempotencia de UX: si ya existe (doble tap, reintento), al Home.
          router.replace(MODO[modo].salida);
          return;
        }
        setError(r.mensaje);
        return;
      }

      // S82: declarar el encuadre que el paso foto trajo (solo si hubo
      // foto). DECISIÓN DECLARADA: el encuadre NO frena el alta — si
      // falla, rige el default de DB (.5/.42/1.3) y el error se dice en
      // el log (no hay silencio: el forense lo ve; la mascota ya nació).
      if (
        fotoPath !== undefined &&
        borrador.cx !== undefined &&
        borrador.cy !== undefined &&
        borrador.z !== undefined
      ) {
        const enc = await declararFotoMascota(r.data.mascota_id, {
          cx: Number(borrador.cx),
          cy: Number(borrador.cy),
          z: Number(borrador.z),
        });
        if (!enc.ok) console.error('[alta/cierre] encuadre no declarado:', enc.codigo);
      }

      // ⚠️ EL HITO NO SE EMITE TODAVÍA, Y AHORA ES UNA ESPERA, NO UN HUECO.
      // `evento_hito_narrativo` YA EXISTE (A, migración 20260807180000) con
      // sus dos claves: `vida_nueva_empieza` y `mundo_nuevo_empieza` — la
      // segunda es la del acuario, y esa distinción sola ya dice que la mesa
      // pensó los dos sujetos. Medido: la tabla está VACÍA.
      //
      // No se emite porque **la voz se firma en el gate de pantalla** (orden
      // de mesa) y ésta es la única pieza de todo el alta que no se deshace
      // barato: un hito con letra inventada ya quedó escrito en la vida de esa
      // mascota, y «corregir es AGREGAR» (D-544). La propuesta de voz va al
      // gate; encenderlo después es UNA llamada acá.
      setCreada(r.data.mascota_id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  if (error !== undefined) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg.base,
          justifyContent: 'center',
          padding: spacing[5],
        }}
      >
        <EstadoVacio
          titulo={t('alta.errorTitulo')}
          descripcion={error}
          accion={
            <View style={{ gap: spacing[2] }}>
              <Boton
                etiqueta={t('alta.probarDeNuevo')}
                onPress={() => {
                  setError(undefined);
                  setErrorDeFoto(false);
                  setIntento((n) => n + 1);
                }}
              />
              {errorDeFoto ? (
                <Boton
                  variante="ghost"
                  etiqueta={t('alta.continuarSinFoto')}
                  onPress={() => {
                    setError(undefined);
                    setErrorDeFoto(false);
                    setSinFoto(true);
                    setIntento((n) => n + 1);
                  }}
                />
              ) : null}
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        padding: spacing[5],
        paddingTop: spacing[12],
      }}
    >
      {/* Ley 13: esqueleto estático que imita el Home que viene */}
      <EsqueletoGrupo etiqueta={t('alta.guardando', { nombre })}>
        <View style={{ alignItems: 'center', gap: spacing[3] }}>
          <Esqueleto forma="circulo" alto={96} />
          <Esqueleto forma="linea" ancho="40%" />
          <View style={{ height: spacing[6] }} />
          <Esqueleto forma="bloque" ancho="100%" alto={120} />
        </View>
      </EsqueletoGrupo>

      {/* EL MODAL — texto de la lámina firmada. `onCerrar` hace lo mismo que
          «Más tarde»: cerrar sin elegir NO puede dejar a la persona en una
          pantalla de esqueleto para siempre. */}
      <Hoja
        visible={creada !== null}
        onCerrar={() => router.replace(MODO[modo].salida)}
        apertura="marca"
        titulo={t('alta.modalTitulo', { nombre })}
      >
        <View style={{ gap: spacing[4] }}>
          <Texto variante="cuerpo">{t('alta.modalCuerpo')}</Texto>
          <Texto variante="apoyo">{t('alta.modalCuando')}</Texto>
          <Boton
            etiqueta={t('alta.modalCompletar')}
            bloque
            onPress={() => {
              if (creada === null) return;
              // Detrás de esto va EL PERFIL. Jamás una checklist ni una barra
              // de progreso (MODELO_LOYALTY §2, literal en la lámina).
              router.replace({
                pathname: '/hogar/mascota/[mascotaId]',
                params: { mascotaId: creada },
              });
            }}
          />
          <Boton
            variante="ghost"
            bloque
            etiqueta={t('alta.modalMasTarde')}
            onPress={() => router.replace(MODO[modo].salida)}
          />
        </View>
      </Hoja>
    </View>
  );
}
