/**
 * S101-B · FASE 5 · CUENTA › MEDIOS DE PAGO — la lista.
 *
 * 🔴 REEMPLAZA UN «PRÓXIMAMENTE» que llevaba sesiones en `cuenta/pagos.tsx`.
 *    *Una promesa escrita en una pantalla no es una funcionalidad pendiente: es
 *    una deuda que la familia lee cada vez que entra.*
 *
 * 🔴 EL ALTA NACE AL TOCAR «AGREGAR», JAMÁS AL ABRIR ESTA PANTALLA
 *    (requisito firmado, letra §2). **Y la razón está medida:** el andamio de
 *    gate creaba un alta al abrirse — **diez altas en cuatro minutos** en el
 *    aparato del founder, todas `pendiente`, ninguna vencida, mientras las de
 *    sus reintentos previos sí lo estaban.
 *    ⇒ *Un estado que solo aparece con el paso del tiempo no se puede observar
 *      en una pantalla que reinicia su reloj cada vez que la abrís.*
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton, Encabezado, EstadoVacio, EsqueletoGrupo, Hoja, Separador, Texto, spacing, useTheme,
} from '@epetplace/ui';
import { listarTarjetasGuardadas, borrarTarjetaGuardada, type TarjetaGuardada } from '@epetplace/api';
import { FilaMedioDePago, VozVencida, desempatarMedios, nombreDeMarca, vencida } from '@/components/fila-medio-de-pago';
import { abrirAltaDeTarjeta } from '@/lib/pagos/alta-tarjeta';
import { useTraduccion } from '@/i18n';

type Estado = 'cargando' | 'error' | 'listo';

export default function MediosDePago() {
  const { t } = useTraduccion();
  const router = useRouter();
  const { theme } = useTheme();
  /* 🔴 R55: el `Encabezado` reserva su propio tope. Envolverlo en un
     `SafeAreaView` con `edges=['top']` lo reserva DOS VECES — el gate lo frenó
     y se cura, no se salta. El inset que sí hace falta es el de ABAJO, y ese
     lo pone el scroll. */
  const insets = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>('cargando');
  const [medios, setMedios] = useState<TarjetaGuardada[]>([]);
  const [aBorrar, setABorrar] = useState<TarjetaGuardada | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [voz, setVoz] = useState<string | null>(null);

  const leer = useCallback(async () => {
    const r = await listarTarjetasGuardadas();
    if (!r.ok) { setEstado('error'); return; }
    setMedios(r.data);
    setEstado('listo');
  }, []);

  /* 🔴 SOLO LEE. Abrir esta pantalla **no crea nada** — ni un alta, ni una
     fila, ni un reloj. *Es literalmente el requisito que el gate del founder
     compró.* */
  useFocusEffect(useCallback(() => { void leer(); }, [leer]));

  const agregar = useCallback(async () => {
    /* El alta nace ACÁ, al TOCAR. Al volver, la lista se relee sola por el
       efecto de foco: el desenlace lo tiene el servidor, no este botón. */
    const r = await abrirAltaDeTarjeta();
    if (!r.ok) setVoz(t('cuenta.altaNoAbrio'));
    /* El desenlace NO se resuelve acá: lo dice el servidor cuando la vista del
       WebView se cierra, y esta lista se relee sola al recuperar el foco. */
  }, [t]);

  const confirmarBorrado = useCallback(async () => {
    if (!aBorrar) return;
    setBorrando(true);
    const r = await borrarTarjetaGuardada(aBorrar.id);
    setBorrando(false);
    setABorrar(null);
    /* 🔴 La voz dice lo que pasó, y el fallo **habla hacia soporte**: borrar una
       tarjeta es del servidor, y si falló no hay nada que la familia pueda
       corregir. */
    setVoz(r.ok ? t('cuenta.medioBorrado') : t('cuenta.medioBorrarFallo'));
    await leer();
  }, [aBorrar, leer, t]);

  const hayVencida = medios.some((m) => vencida(m) === true);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('cuenta.medios')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}>
        <View style={{ paddingHorizontal: spacing[5] }}>
          <Texto variante="apoyo">{t('cuenta.mediosSub')}</Texto>
        </View>

        {estado === 'cargando' ? (
          <EsqueletoGrupo><View /></EsqueletoGrupo>
        ) : estado === 'error' ? (
          /* Ley 13: un fallo JAMÁS se disfraza de vacío. */
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.reintentar')}
                onPress={() => { setEstado('cargando'); void leer(); }}
              />
            }
          />
        ) : medios.length === 0 ? (
          <EstadoVacio titulo={t('cuenta.mediosVacioTitulo')} descripcion={t('cuenta.mediosVacio')} />
        ) : (
          <>
            <View>
              {medios.map((m) => (
                <FilaMedioDePago
                  key={m.id}
                  tarjeta={m}
                  /* Mismo desempate que en la hoja del checkout: la lista es
                     donde la persona BORRA, así que distinguir dos filas
                     idénticas acá no es comodidad — es lo que evita que borre
                     la que no era. */
                  desempate={desempatarMedios(medios).get(m.id) ?? null}
                  fin={
                    <Boton
                      variante="secundario"
                      tamaño="sm"
                      etiqueta={t('cuenta.medioBorrar')}
                      onPress={() => setABorrar(m)}
                    />
                  }
                />
              ))}
            </View>
            <VozVencida visible={hayVencida} />
          </>
        )}

        {voz ? (
          <View style={{ paddingHorizontal: spacing[5] }}>
            <Texto variante="apoyo">{voz}</Texto>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
          <Separador />
          <Boton etiqueta={t('cuenta.medioAgregar')} bloque onPress={() => void agregar()} />
        </View>
      </ScrollView>

      {/* ═══ P1 · LA DOBLE CONFIRMACIÓN ═══════════════════════════════════
          🔴 **La segunda confirmación DICE QUÉ SE BORRA, con su nombre.** *Un
          «¿estás seguro?» sin sujeto es un botón que la gente aprende a
          apretar sin leer — y acá lo que se borra es el medio con el que
          paga.* */}
      <Hoja visible={aBorrar !== null} onCerrar={() => setABorrar(null)} titulo={t('cuenta.medioBorrarTitulo')}>
        <View style={{ gap: spacing[4] }}>
          <Texto variante="cuerpo">
            {t('cuenta.medioBorrarCuerpo', {
              cual: aBorrar?.alias
                ?? [nombreDeMarca(aBorrar?.marca ?? null), aBorrar?.ultimos4 && `···· ${aBorrar.ultimos4}`]
                     .filter(Boolean).join(' '),
            })}
          </Texto>
          <Boton
            etiqueta={t('cuenta.medioBorrarConfirmar')}
            bloque
            cargando={borrando}
            onPress={() => void confirmarBorrado()}
          />
          <Boton
            variante="secundario"
            etiqueta={t('cuenta.medioBorrarCancelar')}
            bloque
            onPress={() => setABorrar(null)}
          />
        </View>
      </Hoja>
    </View>
  );
}
