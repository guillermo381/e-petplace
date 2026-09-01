/**
 * ADOPTAR — LA VIDRIERA (S111-C). *«Se presentan vidas, no inventario»* (§4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⏪ **ACÁ VIVÍA UN «PRÓXIMAMENTE HONESTO» (S73), Y SU LÁPIDA SE CUMPLIÓ.**
 * Decía *«cuando estén acá, vas a conocer a sus mascotas en adopción»* — era
 * cierto mientras no hubiera motor. **S111-A lo construyó**, así que el texto
 * pasó de honesto a falso **el mismo día**, y se retira en el acto que lo vuelve
 * falso (`L-395`): un puente que sobrevive a su río manda al próximo a construir
 * otro.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS (Ley 14):** *estos animales existen, tienen nombre y están esperando.*
 *
 * **FIRMA (Ley 15):** la cara, grande y presidiendo cada fila. §4 lo dice sin
 * rodeos —*se presentan vidas, no inventario*— y por eso el avatar es `lg` y no
 * un thumbnail al costado: **la foto no ilustra el dato, la foto ES el dato.**
 *
 * **CHANEL (Ley 16):** se quitó el contador de resultados. *Saber que hay 34 no
 * ayuda a elegir a ninguno, y convierte una lista de vidas en un inventario* —
 * exactamente lo que §4 prohíbe.
 *
 * ── 🔴 LO QUE ESTA PANTALLA NO HACE, Y NINGUNA ES UN RECORTE ────────────
 * · **No enumera estados.** El motor filtra por
 *   `cat_estados_adopcion.visible_en_vidriera`; si la pantalla listara estados,
 *   *se olvidaría del sexto el día que nazca.*
 * · **No ordena por antigüedad.** §4 pide un bloque «Llevan más tiempo
 *   esperando» y dice **explícito que NO es orden puro por antigüedad** —*los
 *   que más esperan suelen ser los más difíciles, y una primera pantalla de
 *   casos duros hace rebotar al que entró a mirar*—. Tengo `creadaEn` y
 *   **ordenar por él sería justo lo que la letra prohíbe.** El bloque entra
 *   cuando el criterio viva en el servidor; inventarlo acá es la pantalla
 *   decidiendo una regla de producto.
 * · **Sin swipe, sin descartes, sin score de match** (§10.8). No hay nada que
 *   deshabilitar: no se construyó.
 * · **Un solo filtro: especie.** Es lo único que el contrato acepta hoy. Los
 *   otros ocho de §4 —tamaño, edad, sexo, convivencia, urgentes, esterilizado,
 *   pareja, cerca de mí— **no se dibujan apagados**: un filtro que no filtra es
 *   una promesa rota a un toque de distancia (Ley 23).
 * · 🔴 **SIN FILTRO DE RAZA, y es de piedra** (§4): *filtrar por raza empuja a
 *   buscar raza.* La raza se **muestra** cuando el refugio la sabe; no se
 *   ofrece como criterio.
 *
 * ⚠️ **Y falta la PUERTA SIN CUENTA de §4** —*«desde el login hay una puerta a
 * ver mascotas en adopción»*—: medido, `obtener_adoptables` está `REVOKE`
 * de `anon` y exige `auth.uid()`. **No se rodea desde acá.** Cuando A abra la
 * función, **esta misma pantalla sirve a las dos puertas sin tocarse.**
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  SelectorOpcion,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  caraDeMascota,
  obtenerAdoptables,
  resolverUrlsFotos,
  type Adoptable,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: Adoptable[]; caras: Map<string, string> };

/** Las dos especies que la casa adopta hoy. **El día que el motor acepte otra,
 *  este arreglo se queda corto y hay que venir acá** — se declara en vez de
 *  derivarlo de un catálogo que este lector no trae. */
const ESPECIES = ['perro', 'gato'] as const;

export default function Adoptar() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [especie, setEspecie] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        const r = await obtenerAdoptables({ especie: especie ?? undefined });
        if (!vigente) return;
        /* Ley 13: un fallo JAMÁS se disfraza de «no hay nadie en adopción».
           *Ese vacío diría que ningún animal espera, que es lo contrario de lo
           que pasa.* */
        if (!r.ok) {
          setEstado({ fase: 'error' });
          return;
        }
        const paths = r.data
          .map((a) => a.fotoUrl)
          .filter((x): x is string => typeof x === 'string' && x.length > 0);
        const caras = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>();
        if (!vigente) return;
        setEstado({ fase: 'listo', lista: r.data, caras });
      })();
      return () => {
        vigente = false;
      };
    }, [especie]),
  );

  const especieDe = (x: string): 'perro' | 'gato' | undefined =>
    x === 'perro' || x === 'gato' ? x : undefined;

  /** El subtítulo del animal: sólo lo que el refugio SABE.
   *  🔴 `fechaNacimiento` null significa «no se sabe», y **no se infiere una
   *  edad que nadie declaró** — el contrato del lector lo dice y acá se cumple
   *  callando, no rellenando. */
  const rasgos = (a: Adoptable): string => {
    const partes: string[] = [];
    if (a.raza !== null && a.raza.length > 0) partes.push(a.raza);
    if (a.sexo !== null && a.sexo.length > 0) {
      partes.push(t(`adoptar.sexo_${a.sexo}` as 'adoptar.sexo_macho'));
    }
    return partes.join(' · ');
  };

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('adoptar.titulo')}
        atras
        onAtras={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[5],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        {/* EL ÚNICO FILTRO QUE EL MOTOR ACEPTA. `null` = todas, y es la opción
            que preside: la vidriera se abre mostrando a todos. */}
        <SelectorOpcion
          acento="control"
          disposicion="fila"
          etiqueta={t('adoptar.filtroEspecie')}
          opciones={[
            { codigo: 'todas', etiqueta: t('adoptar.todas') },
            ...ESPECIES.map((e) => ({ codigo: e, etiqueta: t(`adoptar.especie_${e}` as 'adoptar.especie_perro') })),
          ]}
          seleccionada={especie ?? 'todas'}
          onSelect={(c) => setEspecie(c === 'todas' ? null : c)}
        />

        {estado.fase === 'cargando' ? (
          <EsqueletoGrupo>
            <Esqueleto alto={120} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        ) : estado.fase === 'error' ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('adoptar.errorTitulo')}
            descripcion={t('adoptar.errorDetalle')}
          />
        ) : estado.lista.length === 0 ? (
          /* Vacío DIGNO y verdadero: hoy hay 0 cuentas con rol `refugio` —las
             crea el admin—, así que esto es lo que se ve, y lo dice sin
             disfrazarlo de error ni de «pronto». */
          <EstadoVacio
            registro="seccion"
            icono={<Icono nombre="refugio" tamano={48} />}
            titulo={t('adoptar.vacioTitulo')}
            descripcion={t('adoptar.vacioDetalle')}
          />
        ) : (
          estado.lista.map((a) => {
            const foto = a.fotoUrl === null ? null : (estado.caras.get(a.fotoUrl) ?? null);
            /* La escalera de la casa: foto → genérico de su especie → huella.
               `razaSlug: null` A PROPÓSITO — el lector trae la raza como TEXTO
               libre, y `resolverUrlRaza` exige el slug de `cat_razas`: *una URL
               derivada del texto tipeado acierta a veces y muestra la cara
               equivocada el resto*. */
            const cara = caraDeMascota({ especie: a.especie, razaSlug: null, fotoUri: foto });
            const detalle = rasgos(a);
            return (
              <Tarjeta key={a.publicacionId} relleno="normal" elevacion="reposo">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                  {/* LA FIRMA: la cara preside. §4 — se presentan VIDAS. */}
                  <AvatarMascota
                    nombre={a.nombre}
                    fotoUrl={cara ?? undefined}
                    tamano="lg"
                  />
                  <View style={{ flex: 1, gap: spacing[1] }}>
                    <Texto variante="titulo">{a.nombre}</Texto>
                    {detalle.length > 0 ? <Texto variante="apoyo">{detalle}</Texto> : null}
                    {/* El refugio es PROCEDENCIA, no un adorno (§5: queda como
                        procedencia permanente). Si el lector no lo trae, se
                        calla en vez de poner «desconocido». */}
                    {a.publicadorNombre !== null ? (
                      <Texto variante="apoyo" color="tertiary">
                        {t('adoptar.publicadoPor', { refugio: a.publicadorNombre })}
                      </Texto>
                    ) : null}
                  </View>
                </View>
              </Tarjeta>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
