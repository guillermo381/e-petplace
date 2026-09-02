/**
 * BUSCAR UN REFUGIO POR NOMBRE (S112-C · A6, segunda mitad del lado familia).
 *
 * Voz del founder: *«en adopción **puedo buscar un refugio por nombre** y ver
 * sus animales»*.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL RECORTE A REFUGIOS VIVE EN EL SERVIDOR, Y ESO ES EL PUNTO.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `buscar_refugios` filtra por `tipo = 'refugio'` **adentro de la RPC**. Esta
 * pantalla **no lo re-implementa y no lo puede aflojar**, y esa asimetría fue
 * deliberada: la fuente natural era `v_prestadores_publicos`, y **filtrar acá
 * se habría visto exactamente igual de bien** mientras convertía esto en un
 * directorio público de TODOS los prestadores —clínicas, paseadores,
 * groomers—, buscable por nombre y sin sesión.
 *
 * *No habría sido una fuga —la vista ya es pública— sino una decisión de
 * producto que nadie tomó, y de las que se descubren cuando alguien la usa.*
 * Un filtro de una línea en una pantalla es exactamente el guard que alguien
 * afloja después sin saber por qué estaba.
 *
 * ── LOS DOS BORDES, DECIDIDOS Y NO HEREDADOS ─────────────────────────────
 * · **Anónima**, como el resto de la vidriera (medido: la RPC responde sin
 *   header `Authorization`). Y con la misma lista blanca: nombre, logo,
 *   ciudad. **Ni teléfono, ni correo, ni dirección.**
 * · **Devuelve refugios SIN animales publicados**, y es el mismo argumento con
 *   el que se eligió el lector por cuenta: *la vitrina importa más cuando el
 *   refugio no tiene ninguno publicado.* Un buscador que sólo encuentra
 *   refugios con stock le esconde a la familia justo a los que necesitan que
 *   los encuentren.
 *
 * ── SIN TEXTO ES UN DIRECTORIO, NO UN VACÍO ──────────────────────────────
 * La RPC sin texto devuelve la lista con techo. ⇒ **la pantalla abre mostrando
 * refugios**, no un campo vacío pidiendo que alguien adivine un nombre. *Un
 * buscador que no muestra nada hasta que tipeás le pide a la familia que ya
 * sepa lo que vino a averiguar.*
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  LogoNegocio,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  buscarRefugios,
  resolverUrlLogoNegocio,
  type RefugioEnBusqueda,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; lista: RefugioEnBusqueda[] };

export default function BuscarRefugios() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });

  const buscar = useCallback(async (q: string) => {
    const r = await buscarRefugios(q.trim().length === 0 ? undefined : q.trim());
    if (!r.ok) return setEstado({ fase: 'error' });
    setEstado({ fase: 'listo', lista: r.data });
  }, []);

  /* 🔴 **Se espera a que la persona deje de tipear.** Sin esto, cada tecla es
     un viaje: escribir «satori» son SEIS peticiones para mostrar una respuesta.
     Es `L-223` en su forma más cara — el techo del producto lo pone la cantidad
     de viajes, no el trabajo del servidor. 300 ms es la pausa entre teclas de
     alguien que escribe, no un número elegido por gusto. */
  useEffect(() => {
    let vigente = true;
    const id = setTimeout(() => {
      if (vigente) void buscar(texto);
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(id);
    };
  }, [texto, buscar]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('buscarRefugios.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/adoptar'))}
      />
      <EvitaTeclado>
        <View style={{ padding: spacing[5], paddingBottom: spacing[3] }}>
          <Campo
            label={t('buscarRefugios.campo')}
            value={texto}
            onChangeText={setTexto}
            autoCapitalize="none"
          />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: spacing[8] }}>
          {estado.fase === 'cargando' ? (
            <EsqueletoGrupo>
              <Esqueleto alto={64} />
              <Esqueleto alto={64} />
            </EsqueletoGrupo>
          ) : estado.fase === 'error' ? (
            /* Ley 13: un fallo JAMÁS se disfraza de «no hay refugios». *Ese
               vacío diría que nadie rescata, que es lo contrario de lo que
               pasa.* */
            <EstadoVacio
              registro="seccion"
              titulo={t('buscarRefugios.errorTitulo')}
              descripcion={t('buscarRefugios.errorDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('buscarRefugios.reintentar')}
                  onPress={() => void buscar(texto)}
                />
              }
            />
          ) : estado.lista.length === 0 ? (
            /* Dos vacíos distintos otra vez: **«no encontramos ninguno con ese
               nombre»** no es **«todavía no hay refugios»**. El primero tiene
               salida —borrar el texto—; el segundo no, y ofrecerla sería un
               camino que no lleva a nada. */
            <EstadoVacio
              registro="seccion"
              titulo={
                texto.trim().length === 0
                  ? t('buscarRefugios.vacioTitulo')
                  : t('buscarRefugios.sinResultadosTitulo')
              }
              descripcion={
                texto.trim().length === 0
                  ? t('buscarRefugios.vacioDetalle')
                  : t('buscarRefugios.sinResultadosDetalle')
              }
              accion={
                texto.trim().length === 0 ? undefined : (
                  <Boton
                    variante="secundario"
                    etiqueta={t('buscarRefugios.limpiar')}
                    onPress={() => setTexto('')}
                  />
                )
              }
            />
          ) : (
            <Tarjeta relleno="ninguno">
              {estado.lista.map((r, i) => (
                <View key={r.cuentaComercialId}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    interactiva
                    accessibilityRole="button"
                    /* 🔑 Se navega con la CUENTA COMERCIAL, que es lo que la
                       vitrina sabe resolver. `prestadorId` viaja al lado y
                       **no se usa acá a propósito**: dos ids para la misma
                       cosa es cómo alguien manda el equivocado. */
                    onPress={() =>
                      router.push({
                        pathname: '/adoptar/refugio/[cuentaId]',
                        params: { cuentaId: r.cuentaComercialId },
                      })
                    }
                    inicio={
                      /* `LogoNegocio` y no `AvatarMascota`: **un refugio es un
                         negocio**, y su fallback honesto es el monograma de su
                         nombre, no la cara de una especie. */
                      <LogoNegocio
                        nombre={r.nombre}
                        logoUrl={resolverUrlLogoNegocio(r.logoUrl)}
                        tamano={40}
                      />
                    }
                    titulo={r.nombre}
                    /* `null` = no declarada. **No se inventa una ciudad**: se
                       omite la línea. */
                    subtitulo={r.ciudad ?? undefined}
                  />
                </View>
              ))}
            </Tarjeta>
          )}
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
