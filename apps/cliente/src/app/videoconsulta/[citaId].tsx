/**
 * EL DETALLE DE UNA VIDEOCONSULTA — lado familia. `LETRA_TELEMEDICINA` §4/§5.
 *
 * ── POR QUÉ NACE UNA PANTALLA Y NO UNA FILA ───────────────────────────────
 * Medido en el turno ⓪: **el cliente no tenía detalle de UNA cita**.
 * `citas/[mascotaId]` está keyed por MASCOTA — muestra la próxima activa y
 * despliega las demás. Sirve para mirar; **no sirve para actuar sobre una**.
 * Cancelar es un acto sobre una cita concreta, y necesita su superficie.
 *
 * ── 🔴 EL BOTÓN DE ENTRAR NO EXISTE, Y ES DECISIÓN ────────────────────────
 * **No hay «entrar a la videoconsulta» ni como placeholder** (firma de CP1,
 * contra la propuesta previa de un «placeholder honesto»). *Un botón que dice
 * que vas a entrar y no te deja entrar no es honesto por llevar la palabra
 * «pronto» al lado: es la promesa rota, con aviso.* Llega en tanda 2, con el
 * video real detrás.
 *
 * ── LA VENTANA NUNCA SE ESCRIBE ───────────────────────────────────────────
 * Sale de `ventanaCancelacionMinutos(tipoServicio)`. *Un `30` tecleado
 * envejece el día que el founder mueva el parámetro, y su modo de falla es el
 * peor: la pantalla lo dice con toda confianza y el motor rebota por otro.*
 * **Si no se pudo leer, la frase no se pinta** — se ofrece cancelar sin
 * prometer un plazo que no conocemos (Ley 13: `null` no es `0`).
 *
 * ── LA PLATA ──────────────────────────────────────────────────────────────
 * **«Vuelve a tu medio de pago», con plazo honesto y JAMÁS «al instante».**
 * El sistema REGISTRA la solicitud; la ejecuta una persona. Y el mensaje de
 * éxito **distingue si había pago**: sin plata que devolver, prometer una
 * devolución sería inventarla.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  Hoja,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  cancelarTeleconsulta,
  leerCitaResuelta,
  ventanaCancelacionMinutos,
  type CitaResuelta,
} from '@epetplace/api';

import { fechaLargaHumana } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'listo'; cita: CitaResuelta };

export default function DetalleVideoconsulta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { mostrar } = useAviso();
  const { citaId = '' } = useLocalSearchParams<{ citaId?: string }>();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  /** `null` = no se pudo leer. **No es 0 y no es 30**: si no se sabe, no se
   *  promete un plazo. */
  const [ventana, setVentana] = useState<number | null>(null);
  const [hojaCancelar, setHojaCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const cargar = useCallback(() => {
    let vigente = true;
    void (async () => {
      const r = await leerCitaResuelta(citaId);
      if (!vigente) return;
      if (!r.ok) {
        setEstado({ fase: 'error' });
        return;
      }
      setEstado({ fase: 'listo', cita: r.data });
      if (r.data.tipoServicio !== null) {
        const v = await ventanaCancelacionMinutos(r.data.tipoServicio);
        if (!vigente) return;
        setVentana(v.ok ? v.data : null);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [citaId]);

  useFocusEffect(cargar);

  async function cancelar() {
    if (cancelando) return;
    setCancelando(true);
    const r = await cancelarTeleconsulta(citaId);
    setCancelando(false);
    if (!r.ok) {
      /* `ventana_cancelacion_vencida` tiene SU cara: no es un fallo, es una
         verdad del reloj. Decir «probá de nuevo» ahí sería mandar a repetir
         algo que no va a cambiar. */
      mostrar({
        texto:
          r.codigo === 'ventana_cancelacion_vencida'
            ? t('veterinaria.citaTeleVencida')
            : t('veterinaria.citaTeleError'),
        variante: 'error',
      });
      return;
    }
    setHojaCancelar(false);
    mostrar({
      texto: r.data.devolucion_registrada
        ? t('veterinaria.citaTeleCanceladaConDevolucion')
        : t('veterinaria.citaTeleCancelada'),
      variante: 'exito',
    });
    cargar();
  }

  const cabecera = (
    <Encabezado
      variante="navegacion"
      titulo={t('veterinaria.citaTeleTitulo')}
      atras
      onAtras={() => router.back()}
    />
  );

  if (estado.fase === 'cargando') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top']}>
        {cabecera}
        <View style={{ padding: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={24} />
            <Esqueleto alto={64} />
          </EsqueletoGrupo>
        </View>
      </SafeAreaView>
    );
  }

  /* Ley 13: el fallo NO se disfraza de vacío. «No pudimos leerla» y «no
     existe» son dos cosas distintas y `leerCitaResuelta` las distingue. */
  if (estado.fase === 'error') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top']}>
        {cabecera}
        <EstadoVacio
          registro="pantalla"
          titulo={t('veterinaria.citaTeleError')}
          descripcion=""
          accion={<Boton variante="primario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
        />
      </SafeAreaView>
    );
  }

  const { cita } = estado;
  const activa = !cita.cancelada && cita.estado !== 'completada';
  const noRealizada = cita.estado === 'no_realizable';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg.base }} edges={['top']}>
      {cabecera}
      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        <Tarjeta elevacion="reposo">
          <View style={{ gap: spacing[2] }}>
            <FilaDato etiqueta={t('veterinaria.citaTeleCuando')} valor={fechaLargaHumana(cita.fecha, idioma)} />
            <FilaDato etiqueta={t('veterinaria.citaTeleHora')} valor={cita.hora} />
          </View>
        </Tarjeta>

        {/* §5 · el estado terminal que marcó el profesional. **No nombra
            culpa**: el sistema no la sabe y no puede saberla. */}
        {noRealizada && (
          <Tarjeta elevacion="reposo">
            <View style={{ gap: spacing[2] }}>
              <Texto variante="cuerpo">{t('veterinaria.citaTeleNoRealizada')}</Texto>
              <Texto variante="apoyo">{t('veterinaria.citaTeleNoRealizadaDevolucion')}</Texto>
            </View>
          </Tarjeta>
        )}

        {activa && (
          <View style={{ gap: spacing[3] }}>
            {/* La ventana SOLO se dice si se pudo leer. */}
            {ventana !== null && (
              <Texto variante="apoyo">
                {t('veterinaria.citaTeleVentana', { minutos: ventana })}
              </Texto>
            )}
            <Boton
              variante="secundario"
              etiqueta={t('veterinaria.citaTeleCancelar')}
              onPress={() => setHojaCancelar(true)}
            />
          </View>
        )}
      </ScrollView>

      <Hoja
        visible={hojaCancelar}
        onCerrar={() => setHojaCancelar(false)}
        titulo={t('veterinaria.citaTeleConfirmarTitulo')}
      >
        <View style={{ gap: spacing[4] }}>
          {/* La promesa de plata, con su plazo honesto. */}
          <Texto variante="cuerpo">{t('veterinaria.citaTeleDevolucion')}</Texto>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('veterinaria.citaTeleConfirmar')}
            onPress={() => void cancelar()}
            cargando={cancelando}
          />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
