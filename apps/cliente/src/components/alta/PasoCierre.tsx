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
  Confirmacion,
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
  registrarPesoMascota,
  registrarVacunasDeCarnet,
} from '@epetplace/api';

import { esPrecision, esSexo } from '@/lib/params';
import { subirAvatar } from '@/lib/subir-avatar';
import { parsearPrecio } from '@epetplace/i18n';
import { useTraduccion } from '@/i18n';
import { leerCarnetDelIntento, olvidarCarnetDelIntento } from '@/lib/alta/carnet-del-intento';
import { esAcuario, esOrigen, esTipoDeAgua, MODO, type BorradorAlta, type ModoAlta } from './tipos';

/**
 * 🔴 S91-D · LA IDEMPOTENCIA DEL ALTA — el founder quedó con la mascota DOBLE.
 *
 * ── QUÉ PASÓ, con la cadena entera ──────────────────────────────────────────
 * El modal ofrece «Completar ahora» y lleva al perfil con `router.replace`.
 * Pero **`replace` cambia la pantalla de arriba, no vacía la pila**: los cuatro
 * pasos del alta seguían abajo. El founder tocó atrás desde el perfil, cayó de
 * vuelta en el cierre, y el cierre **volvió a registrar**.
 *
 * ── POR QUÉ EL GUARD QUE HABÍA NO ALCANZABA ─────────────────────────────────
 * `corriendoRef` es un `useRef`: protege del doble disparo DENTRO de una vida
 * del componente. Al volver atrás el componente **se re-monta**, el ref nace
 * en `false` y el efecto corre otra vez como si fuera la primera. *Un guard de
 * instancia no puede ver un re-montaje — por definición.*
 *
 * ── LAS DOS CURAS, y por qué hacen falta LAS DOS ────────────────────────────
 * ① **La pila se vacía al salir** (`dismissAll` + `replace`): volver desde el
 *    perfil lleva al Home, jamás de vuelta al flujo. Cierra el camino.
 * ② **Esto**: la memoria sobrevive al re-montaje. Cierra el DAÑO — porque el
 *    camino de ① no es el único (un deep-link, un refresh en web y el próximo
 *    que agregue una salida nueva llegan igual acá).
 *
 * La clave es **el CONTENIDO del alta**, no un id de sesión: dos altas iguales
 * seguidas son el bug; dos mascotas distintas no comparten clave. Vive a nivel
 * de módulo justamente porque tiene que sobrevivir al desmontaje.
 *
 * ⚠️ ESTO ES EL CLIENTE, y se dice: la idempotencia REAL es del motor (una
 * restricción que haga imposible la segunda fila). **Va pedida a A** — hasta
 * que exista, esto cubre el camino medido, no todos los caminos posibles.
 */
const ALTAS_YA_HECHAS = new Map<string, string>();

/** La identidad de un alta: lo que el dueño declaró, en orden estable. */
function claveDeAlta(modo: ModoAlta, b: BorradorAlta): string {
  return [modo, b.nombre, b.especie, b.raza, b.fecha, b.precision, b.sexo, b.origen].join('\0');
}

export function PasoCierre({ modo, borrador }: { modo: ModoAlta; borrador: BorradorAlta }) {
  const router = useRouter();
  /**
   * 🔴 LA SALIDA DEL ALTA — CORREGIDA EN EL GATE, y mi cura anterior era media.
   *
   * ── LA PRIMERA VERSIÓN Y POR QUÉ ERA MEDIA ─────────────────────────────────
   * Contra la doble alta puse `dismissAll()` + `replace(destino)`. Mata el
   * re-registro, sí — pero `dismissAll` deja la pila EN SU RAÍZ y `replace`
   * cambia la pantalla de arriba, que en ese momento **ES la raíz**. Resultado:
   * el perfil quedaba siendo la RAÍZ del tab, no una pantalla encima de él.
   *
   * ── LOS DOS SÍNTOMAS LO PRUEBAN, y son independientes ─────────────────────
   * El founder reportó que desde ahí «Home» devolvía AL PERFIL y «atrás» no
   * hacía NADA. Los dos dicen lo mismo desde dos lados: tocar el tab hace
   * pop-to-top —y si la raíz es el perfil, aterriza en el perfil (S63: el
   * pop-to-top vive en el PRESS del tab)—, y atrás no tiene adónde ir porque
   * **debajo del perfil no quedaba nada**. Un callejón sin salida por los dos
   * gestos, que es exactamente lo que describió.
   *
   * ── LA CURA: TRES PASOS, y el del medio es el que faltaba ─────────────────
   *   ① `dismissAll` — tira los pasos del alta (esto ya estaba y sigue siendo
   *      lo que impide re-entrar al flujo).
   *   ② `replace(salida)` — **LA RAÍZ VUELVE A SER EL HOME.** Éste es el paso
   *      nuevo: sin él, lo que se reemplaza es la raíz misma.
   *   ③ `push(destino)` — el perfil va ENCIMA del Home, no en su lugar.
   *
   * Así los dos gestos aterrizan donde deben: atrás → Home · tab → Home. Y
   * cuando destino ES la salida (los dos «más tarde»), el ③ no corre: empujar
   * el Home sobre el Home dejaría dos.
   *
   * `canDismiss()` antes, patrón vivo de la casa (`explorar/paseo/
   * disponibles.tsx`): sin él, `dismissAll` sobre una pila no-modal lanza.
   */
  const salir = (destino: Parameters<typeof router.replace>[0]) => {
    if (router.canDismiss()) router.dismissAll();
    router.replace(MODO[modo].salida);
    if (destino !== MODO[modo].salida) router.push(destino);
  };
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const [error, setError] = useState<string | undefined>(undefined);
  const [errorDeFoto, setErrorDeFoto] = useState(false);
  const [sinFoto, setSinFoto] = useState(false);
  const [intento, setIntento] = useState(0);
  const [creada, setCreada] = useState<string | null>(null);
  /** ¿El carné llegó a guardarse de verdad? Decide la voz del apoyo. */
  const [carnetGuardado, setCarnetGuardado] = useState(false);
  const corriendoRef = useRef(false);

  const nombre = borrador.nombre ?? t('alta.tuMascota');

  useEffect(() => {
    if (corriendoRef.current) return;
    // ② LA MEMORIA QUE SOBREVIVE AL RE-MONTAJE (ver cabecera del módulo): si
    // este mismo alta ya se registró, se muestra su modal en vez de volver a
    // escribir. Sin esto, volver atrás desde el perfil creaba la mascota otra
    // vez — y el dueño no tiene forma de saber que pasó.
    const clave = claveDeAlta(modo, borrador);
    const yaHecha = ALTAS_YA_HECHAS.get(clave);
    if (yaHecha !== undefined) {
      setCreada(yaHecha);
      return;
    }
    corriendoRef.current = true;
    void (async () => {
      const sesion = await obtenerSesion();
      const nombreDueno = sesion.ok && sesion.data !== null ? sesion.data.nombre : null;

      // Foto primero (S45-B4.1): sube a mascotas/{uid}/ y el vínculo entra
      // por la RPC. Si falla, se frena con error visible — jamás se pierde
      // la foto en silencio (regla 36).
      // EL ESTADO IMPOSIBLE, DICHO (ver `conFoto` en tipos.ts): el paso 4
      // declaró foto y acá no llegó la uri ⇒ se perdió en el viaje. Antes de
      // esto la mascota nacía sin foto y en silencio, que es el bug más caro
      // de diagnosticar porque no deja rastro en ningún lado.
      if (borrador.conFoto === '1' && !borrador.fotoUri && !sinFoto) {
        console.error('[alta/cierre] la foto se perdió entre el paso 4 y el cierre');
        corriendoRef.current = false;
        setErrorDeFoto(true);
        setError(t('alta.errorFotoPerdida'));
        return;
      }

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

      // ✅ S91-C · `origen` YA LLEGA. La deuda que este bloque declaraba
      // («el paso 3 pregunta cómo llegó a la casa y la respuesta se pierde
      // en el viaje») queda pagada: A sumó `p_origen` a las dos RPCs y su
      // wrapper, y acá se consume. Verificado contra la DB VIVA en el
      // momento de cablearlo, no contra la migración: las dos firmas
      // devuelven `tiene_p_origen = true`.
      const comunes = {
        nombre_mascota: borrador.nombre ?? '',
        especie: borrador.especie ?? '',
        // P7: al acuario la fecha le entra por `fecha_montaje`, no por
        // `fecha_nacimiento` — un acuario no nace, se monta, y el motor rebota
        // tipado si se cruzan (`fecha_montaje_solo_acuario`). La pantalla
        // pregunta «¿cuándo lo montaste?»; acá se manda a su columna.
        ...(borrador.fecha
          ? esAcuario(borrador.especie)
            ? { fecha_montaje: borrador.fecha }
            : {
                fecha_nacimiento: borrador.fecha,
                ...(esPrecision(borrador.precision) ? { precision_fecha: borrador.precision } : null),
              }
          : null),
        ...(esSexo(borrador.sexo) ? { sexo: borrador.sexo } : null),
        ...(fotoPath !== undefined ? { foto_url: fotoPath } : null),
        // POR GUARD, no por «si tiene algo»: el borrador viaja por params y
        // `borrador.origen` es `string`. El literal del pedido
        // (`borrador.origen ? …`) NO COMPILA contra `OrigenMascota` — rojo
        // producido antes de desviarse. `esOrigen` es el mismo patrón que
        // las tres líneas de arriba (`esPrecision`, `esSexo`, `esTipoDeAgua`).
        ...(esOrigen(borrador.origen) ? { origen: borrador.origen } : null),
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
          salir(MODO[modo].salida);
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
      ALTAS_YA_HECHAS.set(clave, r.data.mascota_id);

      /* ⭐ **LOS DOS DATOS QUE LA RPC DEL ALTA NO RECIBE — S116-C lote 3.**
         Se escriben ACÁ y no antes porque los dos **necesitan la mascota**:
         antes de esta línea no existía a quién colgárselos.

         🔴 **NINGUNO DE LOS DOS PUEDE TUMBAR EL ALTA.** La mascota ya está
         creada; si el peso o el carné fallan, *lo que corresponde es que la
         familia lo cargue después desde el expediente, no que el alta parezca
         rota por algo que ya no puede deshacerse.* Por eso van sin `await`
         que bloquee el camino y sus fallos no escriben `error`.
         ⚠️ **Y por eso el apoyo de la confirmación mira el HECHO y no la
         intención** (ver abajo): decir «guardamos su carné» porque se intentó
         sería exactamente lo que la ley del founder prohíbe. */
      if (borrador.peso !== undefined) {
        /* `parsearPrecio` y no `Number(replace(',','.'))` — me lo cazó `R88`
           y su razón alcanza al peso igual que a la plata: sobre «1.234,50» un
           parseo a mano devuelve **1.234**, que es *plausible, equivocado y
           finito*, así que `Number.isFinite` no lo frena. El formato de la
           casa es el mismo para los dos (coma decimal, punto de miles). */
        const kg = parsearPrecio(borrador.peso);
        if (Number.isFinite(kg) && kg > 0) {
          void registrarPesoMascota(r.data.mascota_id, { peso_kg: kg });
        }
      }

      const carnet = leerCarnetDelIntento(borrador.tokenIntento);
      /* 🔴 **SOLO LAS QUE TIENEN NOMBRE SE REGISTRAN — la columna es NOT NULL.**
         Las otras NO se descartaron al leer (eso contradiria la firma
         S113-D-2.4: *«una fila corregible vale mas que una que desaparece en
         silencio»*): viajaron, se mostraron diciendo que les faltaba, y se
         completan en el carnet del expediente, que es la pantalla que tiene
         ese formulario. *Lo que no se puede guardar no se manda a rebotar al
         servidor.* */
      const conNombre = (carnet?.vacunas ?? []).flatMap((v) =>
        typeof v.nombre === 'string' && v.nombre.length > 0 ? [{ ...v, nombre: v.nombre }] : [],
      );
      if (carnet !== null && conNombre.length > 0) {
        void registrarVacunasDeCarnet({
          mascota_id: r.data.mascota_id,
          vacunas: conNombre,
          archivo_url: carnet.archivo_url,
        }).then((res) => {
          if (res.ok) setCarnetGuardado(true);
        });
        olvidarCarnetDelIntento(borrador.tokenIntento);
      }

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
      {/* 🔴 **EL ESQUELETO SE VA CUANDO LA CONFIRMACIÓN LLEGA — lo mostró la
          captura, no un gate.** Yo escribí en el comentario de abajo que *«la
          confirmación ES la pantalla»* y después la monté DEBAJO del
          esqueleto, así que las dos convivían: el círculo y el bloque de
          carga quedaban flotando arriba del «¡Listo!».
          *La Hoja modal vieja tapaba el esqueleto; una pantalla no tapa nada.*
          ⇒ mientras se crea, el esqueleto (Ley 13: nada parpadea); cuando hay
          mascota, **sólo** la confirmación. */}
      {creada !== null ? null : (
      <EsqueletoGrupo etiqueta={t('alta.guardando', { nombre })}>
        <View style={{ alignItems: 'center', gap: spacing[3] }}>
          <Esqueleto forma="circulo" alto={96} />
          <Esqueleto forma="linea" ancho="40%" />
          <View style={{ height: spacing[6] }} />
          <Esqueleto forma="bloque" ancho="100%" alto={120} />
        </View>
      </EsqueletoGrupo>
      )}

      {/* ⭐ **10 · EXPEDIENTE CREADO — LA CONFIRMACIÓN DE LA CASA** (S116-C
          lote 3). ⏪ Acá vivía una **Hoja modal** que preguntaba *«¿querés
          completar el perfil?»*.

          **Por qué cambia, y no es sólo estética:** el plan §5 pide para 10
          *«confirmación con el patrón único de la casa (check + personajes +
          dato + dos acciones)»*, y la pieza `Confirmacion` de B es ese patrón.
          *Una hoja modal sobre un esqueleto deja el logro flotando encima de
          una pantalla que finge cargar; la confirmación ES la pantalla.*

          **Lo que se CONSERVA de la versión vieja, y es lo que importaba:**
           · **las dos acciones y sus destinos exactos** — «Ver expediente»
             abre el perfil recién creado (*detrás de esto va EL PERFIL, jamás
             una checklist ni una barra de progreso*, `MODELO_LOYALTY` §2) y la
             segunda sale por `MODO[modo].salida`.
           · **cerrar sin elegir sigue siendo salir**: el camino secundario
             hace lo mismo que hacía `onCerrar`. *Nadie queda atrapado en una
             pantalla de esqueleto.*
           · las claves `alta.modal*` **NO se borran**: siguen vivas en el otro
             camino del alta.

          ⚠️ **EL APOYO SE ELIGE, no se afirma de más.** Decir *«guardamos su
          foto y su carné»* cuando no se guardó ninguno de los dos es
          exactamente lo que la ley del founder del 5-sep prohíbe. **El carné
          todavía no existe en este flujo** (ver el parte), así que hoy la
          condición mira la foto — y el día que el paso del carné entre, la
          misma línea lo suma sin cambiar de forma. */}
      {creada !== null ? (
        <Confirmacion
          exclamacion={t('alta.listoExclamacion')}
          titulo={t('alta.listoTitulo', { nombre })}
          /* 🔴 **EL APOYO MIRA LO QUE DE VERDAD SE GUARDÓ.** Son tres voces
             y no una con dos huecos: *«guardamos su foto y su carné» con sólo
             uno de los dos es una frase falsa que compila perfecto* — la ley
             del founder del 5-sep, en su tercera cláusula. El carné además
             mira el RESULTADO de su escritura, no la intención. */
          apoyo={
            borrador.fotoUri && !sinFoto && carnetGuardado
              ? t('alta.listoApoyoFotoYCarnet')
              : borrador.fotoUri && !sinFoto
                ? t('alta.listoApoyoFoto')
                : carnetGuardado
                  ? t('alta.listoApoyoCarnet')
                  : t('alta.listoApoyoSolo')
          }
          /* 🔴 **EL TRÍO SALE DE LA CASA Y NO EMPIEZA POR ESTA MASCOTA — es un
             hueco declarado, no un olvido.** El encargo pide *«el trío de
             personajes con la especie de la mascota primero»*, y para eso hay
             que traducir `borrador.especie` (el string del catálogo, **once**
             especies) a `EspeciePersonaje` (**seis**).

             **Esa tabla YA EXISTE**: `CARA_LOCAL` dentro de `AvatarMascota`
             (`packages/ui`), y **no está exportada**. Escribirla acá sería una
             SEGUNDA tabla de lo mismo, y dos tablas de lo mismo divergen — el
             día que entre una especie nueva, una de las dos se olvida y nadie
             lo nota porque las dos compilan. *Preferir el trío genérico antes
             que duplicar el mapeo.* Pedido a B en el buzón. */
          primario={{
            texto: t('alta.listoVerExpediente'),
            onPress: () =>
              salir({ pathname: '/hogar/mascota/[mascotaId]', params: { mascotaId: creada } }),
          }}
          secundario={{
            texto: t('alta.listoExplorar'),
            onPress: () => salir(MODO[modo].salida),
          }}
        />
      ) : null}
    </View>
  );
}
