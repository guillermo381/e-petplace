/**
 * S91-D · PASO 4/4 — «Una foto de {nombre}».
 *
 * Hereda ENTERO el acuerdo de la lámina de foto (S82,
 * `docs/laminas/2026-07-29-s82-foto-onboarding.html`): la foto se elige sin
 * recorte nativo y el ENCUADRE es de la casa (pinza + arrastre con clamp,
 * previews en vivo). Eso no se toca — está firmado y funciona.
 *
 * ── LO QUE S91 CAMBIA, y son dos cosas ──────────────────────────────────────
 * ① EL CÍRCULO YA NO ESTÁ VACÍO. Mientras no haya foto muestra la cara de su
 *   raza (o la de su especie): es el MISMO círculo que en el paso 2 acompañaba
 *   a la elección — «un elemento, dos trabajos». Antes acá había una huella
 *   genérica, que es honesta pero no le dice nada a nadie.
 * ② «AHORA NO» PASÓ DE BOTÓN A TEXTO. La ley dice foto opcional pero MUY
 *   sugerida, y ese peso visual ES esa frase: un `Boton` bloque de «Continuar»
 *   compitiendo con «Elegir foto» le decía a la persona que las dos opciones
 *   valen lo mismo. Se usa `variante="ghost"` porque es la pieza de la casa
 *   para una acción SIN CAJA (19.7: el contorno transparente murió; lo que
 *   ejecuta sin navegar va como label).
 *
 * Y lo que NO cambió porque ya estaba bien: **permiso de cámara denegado
 * JAMÁS frena el alta** — se dice y se sigue.
 */

import { useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Cabecera,
  caraDePersonaje,
  EsperaLarga,
  HojaContenido,
  Personaje,
  Texto,
  spacing,
  useTheme,
  type AvatarMascotaEspecie,
  type FotoCapturada,
} from '@epetplace/ui';
import { obtenerRazasDeEspecie, sugerirRaza } from '@epetplace/api';
import { leerBase64 } from '@/lib/subir-avatar';

import { EncuadreFoto, PreviewSuperficies } from '@/components/EncuadreFoto';
import { HojaFotoMascota } from '@/components/HojaFotoMascota';
import { ENCUADRE_DEFAULT, type Encuadre } from '@/components/foto-encuadre';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';
import { useTraduccion } from '@/i18n';
import { caraDeMascota } from '@/lib/cara-mascota';
import type { BorradorAlta } from './tipos';

export function PasoFoto({
  borrador,
  onAvanzar,
  onAtras,
}: {
  borrador: BorradorAlta;
  onAvanzar: (parcial: BorradorAlta) => void;
  onAtras: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const cabecera = useAltoDeCabecera('empujada');

  const nombre = borrador.nombre ?? t('alta.tuMascota');

  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  // r3 paso 2: mientras el gesto vive, el scroll padre NO compite.
  const [gestoActivo, setGestoActivo] = useState(false);
  // El encuadre vigente NO re-renderiza la pantalla: vive en ref y las
  // previews viven en el UI thread (EncuadreFoto).
  const encuadreRef = useRef<Encuadre>(ENCUADRE_DEFAULT);

  /** G5 (gate founder) — EL ESCAPARATE TAMBIÉN SIN FOTO PROPIA.
   *  Las imágenes del bucket son 1:1 (medido: 1254×1254 en origen), así que
   *  el encuadre neutro las muestra centradas y completas. Son constantes
   *  envueltas porque la pieza lee SharedValues: las previews viven en el UI
   *  thread y no se les cambia el contrato por este caso. */
  const cxFijo = useSharedValue(ENCUADRE_DEFAULT.cx);
  const cyFijo = useSharedValue(ENCUADRE_DEFAULT.cy);
  const zFijo = useSharedValue(1);
  const caraGaleria = caraDeMascota({ especie: borrador.especie, razaSlug: borrador.razaSlug });

  /* ⭐ **S116-C lote 7 · LA IDENTIFICACIÓN VIVE ACÁ, NO EN 2/3** (puntos ④ y ⑤
     del encargo).

     ⏪ En el lote 6 la sugerencia se disparaba en `PasoDatosBasicos`, al elegir
     la especie. Funcionaba, y **dejaba 2/3 llegando vacío**: la persona veía la
     grilla de especies en blanco, elegía, y recién ahí aparecía la raza. El
     encargo lo nombra: *«hoy no carga nada; tiene que llegar con la ESPECIE ya
     elegida y la RAZA de la foto ya escrita»*.

     ⇒ **se mira la foto al salir de 1/3**, y 2/3 llega resuelto. Y de paso el
     dibujo de la espera cae en su lugar: **acá la persona no puede hacer nada**,
     que es la condición que `EsperaLarga` declara para existir. *Con la
     sugerencia en 2/3 no había dónde ponerla sin bloquear un formulario que sí
     se podía llenar.*

     **La especie ya se puede proponer** (edge v12 de A): se manda sin `especie`
     y vuelve `especie_sugerida` con **su propia confianza**.

     ── LAS REGLAS, cada una con su razón ──────────────────────────────────
     · **Sólo `alta` pre-selecciona**, y especie y raza se juzgan por SEPARADO
       con su propia confianza. *Ése fue el pedido a A y es lo que permite
       llegar con la especie puesta y la raza vacía cuando el animal es un
       mestizo — que es el caso real con el que él lo probó.*
     · **`mestizo` y `sin_animal` no pre-seleccionan raza.** Son respuestas
       legítimas y ninguna es una raza del catálogo. **La especie sí sobrevive a
       `mestizo`**: un mestizo sigue siendo un perro.
     · **Si la foto se saltó, no se pregunta nada** y 2/3 llega vacío como
       antes. *No hay foto que mirar.*
     · **El fallo NO frena el alta**: se avanza igual, con lo que haya. *Una
       identificación que no salió no puede costarle a la familia el alta
       entera.* Habla en el log bajo `__DEV__` (la lección del lote 6).
     · **`deLaFoto` viaja** para que 2/3 pueda decir que esos dos datos no los
       escribió la persona. Sin esa marca, la pantalla no puede distinguir «lo
       trajo la foto» de «lo escribió ella al volver atrás». */
  const [mirando, setMirando] = useState(false);

  const avanzar = () => {
    if (foto === null) {
      onAvanzar({});
      return;
    }
    const encuadre = {
      fotoUri: foto.uri,
      conFoto: '1',
      cx: String(encuadreRef.current.cx),
      cy: String(encuadreRef.current.cy),
      z: String(encuadreRef.current.z),
    };
    setMirando(true);
    void (async () => {
      const deLaFoto: Record<string, string> = {};
      try {
        const base64 = await leerBase64(foto.uri);
        /* Sin `especie`: que la proponga. La clave no viaja —no se manda `''`—
           porque la edge rebota la cadena vacía a propósito. */
        /* 🔴 **S116-C lote 10 · EL TECHO, Y LO ENCONTRÉ COLGADO EN EL APARATO.**
           Recorriendo el punto 3 volví de 2/3 a 1/3 y toqué «Continuar» otra
           vez: **la pantalla se quedó en «Mirando la foto» más de tres
           minutos, DOS veces.** La uri que sobrevive al viaje por params ya no
           apunta a un archivo legible —el temporal del picker se limpia— y
           `fetch` no trae techo propio.

           *El código de abajo dice «se avanza SIEMPRE» y era verdad — pero sólo
           si la promesa TERMINA.* Una promesa colgada no falla: deja la
           pantalla quieta, sin error, sin log y sin salida. **Es exactamente
           la clase que esta casa ya tiene escrita** (*un arnés colgado no
           falla: su silencio se lee como progreso*), un piso más abajo.

           30 s: la identificación normal tarda 3-6 s medidos acá, así que el
           techo no corta ninguna corrida sana — y **al vencer NO rebota: cae
           al mismo `catch` y el alta sigue**, que es lo que la regla de esta
           misma función ya manda. */
        const r = await Promise.race([
          sugerirRaza({ imageBase64: base64 }),
          new Promise<never>((_, rechazar) =>
            setTimeout(() => rechazar(new Error('sugerir-raza: sin respuesta en 30 s')), 30_000),
          ),
        ]);
        if (!r.ok) {
          if (__DEV__) console.warn(`[sugerir-raza] no se pudo · codigo=${r.codigo}`);
        } else {
          const esp = r.data.especie_sugerida;
          if (esp !== null && esp.confianza === 'alta') {
            deLaFoto.especie = esp.codigo;
            /* El catálogo de razas se pide por la especie RESUELTA —la
               propuesta o la que ya viniera— porque el código que devuelve el
               modelo es un slug de ESA especie. */
            const mejor =
              r.data.mestizo || r.data.sin_animal
                ? undefined
                : r.data.candidatas.find((c) => c.confianza === 'alta');
            if (mejor !== undefined) {
              const cat = await obtenerRazasDeEspecie(esp.codigo);
              const fila = cat.ok ? cat.data.find((x) => x.slug === mejor.raza_codigo) : undefined;
              if (fila !== undefined) {
                deLaFoto.raza = fila.nombre;
                deLaFoto.razaSlug = fila.slug;
              } else if (__DEV__) {
                console.warn(`[sugerir-raza] código fuera del catálogo de ${esp.codigo}: ${mejor.raza_codigo}`);
              }
            } else if (__DEV__) {
              console.warn(
                `[sugerir-raza] sin raza con confianza alta · mestizo=${r.data.mestizo} · sin_animal=${r.data.sin_animal} · ` +
                  r.data.candidatas.map((c) => `${c.raza_codigo}:${c.confianza}`).join(', '),
              );
            }
          } else if (__DEV__) {
            console.warn(`[sugerir-raza] especie no resuelta · ${esp === null ? 'null' : esp.confianza}`);
          }
        }
      } catch (e) {
        if (__DEV__) {
          console.warn(`[sugerir-raza] excepción · ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`);
        }
      }
      /* Se avanza SIEMPRE. `deLaFoto` sólo se marca si algo se resolvió: una
         marca sin datos haría que 2/3 dijera «lo reconocimos» sobre campos
         vacíos. */
      onAvanzar({
        ...encuadre,
        ...deLaFoto,
        ...(Object.keys(deLaFoto).length > 0 ? { deLaFoto: '1' } : {}),
      });
    })();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* ⭐ **LA CABECERA DE LA CASA Y SU BARRA DE PASOS — S116-C lote 3.**
          ⏪ Tenía el `Encabezado` viejo y **ninguna marca de en qué paso
          estaba**. Lo mostró la captura, no un gate: la pantalla se veía
          bien y no decía que era el 2 de 3, así que el flujo perdía su
          sentido de avance justo en el medio. */}
      {/* ⭐ **LA ESTRUCTURA NUEVA — S116-C lote 3g.** Ciruela de FONDO y el
          contenido en una hoja del lienzo que desliza encima.
          🔴 El paso **deja de pagar `insets.bottom`**: lo paga la hoja.
          ⚠️ **`scrollEnabled` viaja adentro de `scroll`**: el gesto del
          encuadre de la foto tiene que poder frenar el scroll de la hoja, o
          mover la imagen arrastraría la pantalla entera. */}
      {/* ⭐ **LA ESPERA LARGA DE LA CASA** (punto ⑤ del encargo). Reemplaza a
          cualquier espera propia: es la MISMA pieza que el carné y el pago, y
          ésa es toda su razón de ser — *si cada pantalla arma la suya, la
          persona no lee «dos pantallas»: lee «esto no es el mismo producto»*.
          **Centrada, con su título propio**, y sin pie: de esta espera no se
          sale — la identificación termina sola y avanza. */}
      {/* ⚠️ **El contenedor sólo da el alto: `EsperaLarga` se acomoda sola.**
          Es `flex: 1` con el título arriba y la rueda centrada en lo que sobra
          —su propio comentario lo dice—, así que **un `alignItems`/`padding`
          de afuera no la centra más: la pelea.** *Centrar algo que ya se
          centra es la forma de descentrarlo.* */}
      {mirando ? (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          {/* 🔴 **EL INSET LO PAGA EL MONTAJE, no la pieza.** Medido en el emulador:
          `EsperaLarga` es `flex: 1` con `paddingVertical` propio y **sin inset
          de seguridad** —correcto, porque no sabe si la monta una pantalla con
          cabecera o una a sangre— así que a pantalla completa **su título se
          metía debajo del reloj**. *Un padding no es un inset: uno es aire de
          composición y el otro es lo que el aparato se reserva.* Lo pone quien
          la coloca, que es el único que sabe que acá va a sangre. */}
          {/* ⭐ **Y LA ESPERA GANA SU PUERTA.** ⏪ No tenía `pie`, con su razón
              escrita: *«de esta espera no se sale — la identificación termina
              sola y avanza»*. **Era cierto hasta que se colgó.** Con la
              promesa colgada (ver el techo, arriba) la persona quedaba
              encerrada: ni botón, ni error, ni atrás.

              El techo cura la causa; esto cura la CONSECUENCIA, y hacen falta
              los dos — *el techo tapa la falla que ya conozco; la puerta tapa
              la que todavía no.* La salida avanza sin reconocer nada: es lo
              mismo que hace el fallo, así que no inventa un camino nuevo. */}
          <EsperaLarga
            titulo={t('alta.mirandoTitulo')}
            apoyo={t('alta.mirandoApoyo')}
            pie={
              <Boton
                etiqueta={t('alta.mirandoSalir')}
                variante="ghost"
                bloque
                onPress={() => onAvanzar({ fotoUri: foto?.uri, conFoto: foto === null ? undefined : '1' })}
              />
            }
          />
        </SafeAreaView>
      ) : (
      <HojaContenido
        arranque={cabecera.arranque}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="empujada"
              presentacion="fondo"
              antetitulo={t('alta.nuevaMascota')}
              titulo={t('alta.paso4Titulo', { nombre })}
              onVolver={onAtras}
              etiquetaVolver={t('alta.volver')}
              pasos={{ total: 3, actual: 1, etiqueta: t('alta.paso', { actual: 1, total: 3 }) }}
            />
          </View>
        }
        scroll={{ scrollEnabled: !gestoActivo, contentContainerStyle: { flexGrow: 1 } }}
      >
        <View style={{ padding: spacing[5], paddingTop: spacing[6], gap: spacing[5], flexGrow: 1 }}>
        {foto === null ? (
          /**
           * A3 (gate del founder, 2ª pasada) — LOS DOS CAMINOS TERMINAN IGUAL.
           *
           * El de la foto ya ordenaba «contenido → preview → acciones»; éste
           * tenía «Elegir foto» en el MEDIO, con el preview colgando debajo y
           * la salida al final. Dos remates distintos para el mismo paso.
           *
           * Y el preview vivía DENTRO del contenedor centrado: su encabezado
           * («Así lo vas a ver») y su hilera están compuestos a la izquierda,
           * así que el `alignItems: 'center'` de afuera los descolocaba. Por
           * eso sale del centrado y respira a lo ancho, igual que en el otro
           * camino — **el acabado no se copió: se compartió la disposición.**
           *
           * Las dos acciones cierran juntas y las dos son `bloque`: la salida
           * gana la anatomía de secundario que la lámina le pide, y queda
           * inconfundible como salida por ser `ghost` y por ir última.
           */
          <>
            <View style={{ alignItems: 'center', gap: spacing[4], paddingTop: spacing[6] }}>
              {/* 🔴 **S116-C lote 6 · NUNCA UNA INICIAL INVENTADA.** Firma del
                  founder: *«con la foto primero todavía no hay nombre, así que
                  no hay inicial que dibujar. Poné el personaje de la especie si
                  ya se sabe, y si no, la nariz»*.

                  ⏪ **Lo que hacía, y lo produjo mi propia inversión:** montaba
                  `AvatarMascota` con `nombre = borrador.nombre ?? 'tu mascota'`
                  y **sin pasarle `especie`**. Con el orden viejo el nombre ya
                  existía en este paso, así que el monograma decía algo cierto
                  —la inicial de la mascota—. Con la foto primero **el monograma
                  pasó a ser la «T» de la palabra «tu»**: una letra que no es de
                  nadie. *El fallback no se rompió: se le fue el dato que lo
                  hacía verdadero.*

                  **Las dos mitades de la cura:**
                   ① `especie` **se pasa** — sin ella el peldaño de `Personaje`
                      de `AvatarMascota` no puede dispararse aunque la especie
                      se sepa (se sabe al volver desde 2/3). *Estaba ahí y
                      llegaba vacío.*
                   ② sin nada que mostrar, **la nariz** — que en el catálogo es
                      `Personaje especie="otro"`, la misma que la grilla de
                      especies ya usa para el pez.

                  ⚠️ **Y NO se toca la doctrina de `AvatarMascota`**, que manda
                  al monograma a las especies sin cara propia con esta razón:
                  *«el monograma dice algo verdadero —esto es Luna— sin afirmar
                  una identidad animal que no tiene con qué sostener»*. **Ahí
                  hay nombre; acá no**, así que no hay nada verdadero que decir
                  y la regla no aplica. La propia nota de B deja la salida
                  escrita: *«la pantalla que de verdad necesite una escribe su
                  fallback a la vista»*. Ésta es esa pantalla, y éste es su
                  fallback, a la vista. */}
              {caraGaleria === undefined && caraDePersonaje(borrador.especie) === undefined ? (
                <Personaje especie="otro" tamano="hogar" />
              ) : (
                <AvatarMascota
                  nombre={nombre}
                  especie={borrador.especie as AvatarMascotaEspecie | undefined}
                  fotoUrl={caraGaleria}
                  tamano="lg"
                />
              )}
              <Texto variante="apoyo" centrado>
                {t('fotoEncuadre.elegirDetalle')}
              </Texto>
              {permisoDenegado ? (
                <Texto variante="apoyo" color="danger" centrado>
                  {t('fotoEncuadre.permisoCamara')}
                </Texto>
              ) : null}
            </View>

            {/* G5: el MISMO componente, con la cara de la galería. Antes esto
                solo existía tras subir una foto propia — y es justamente el
                escaparate de los otros servicios (letra firmada). */}
            {caraGaleria !== undefined ? (
              <PreviewSuperficies
                uri={caraGaleria}
                dim={{ iw: 1254, ih: 1254 }}
                cx={cxFijo}
                cy={cyFijo}
                z={zFijo}
              />
            ) : null}

            <Boton
              variante="secundario"
              bloque
              etiqueta={t('fotoEncuadre.elegirFoto')}
              onPress={() => setHojaAbierta(true)}
            />
            {/* La salida, siempre visible y sin competir (ver cabecera ②). */}
            <Boton variante="ghost" bloque etiqueta={t('alta.ahoraNo')} onPress={avanzar} />
          </>
        ) : (
          <>
            <EncuadreFoto
              key={foto.uri}
              uri={foto.uri}
              dim={{ iw: foto.width, ih: foto.height }}
              inicial={ENCUADRE_DEFAULT}
              nombre={nombre}
              onCambio={(e) => {
                encuadreRef.current = e;
              }}
              onInteraccion={setGestoActivo}
            />
            <Boton
              variante="ghost"
              bloque
              etiqueta={t('fotoEncuadre.cargarOtra')}
              onPress={() => setHojaAbierta(true)}
            />
            <Boton etiqueta={t('alta.continuar')} bloque onPress={avanzar} />
          </>
        )}
        </View>
      </HojaContenido>
      )}

      <HojaFotoMascota
        visible={hojaAbierta}
        titulo={t('fotoEncuadre.hojaTitulo')}
        onCerrar={() => setHojaAbierta(false)}
        onFoto={(f) => {
          setPermisoDenegado(false);
          encuadreRef.current = ENCUADRE_DEFAULT;
          setFoto(f);
        }}
        onPermisoDenegado={() => setPermisoDenegado(true)}
      />
    </View>
  );
}
