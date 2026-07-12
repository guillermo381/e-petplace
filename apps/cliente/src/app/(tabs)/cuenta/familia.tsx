/**
 * Cuenta · Tu familia (S55-B3) — renombrar (solo titular, RLS es la
 * puerta), miembros en LECTURA (el nombre de un miembro ajeno no es
 * legible por RLS de profiles — null honesto, hueco P1), e invitar
 * co-dueño como hueco declarado con "Pronto".
 * Escalera: no muestra datos del expediente (la familia humana no es
 * el expediente de la mascota).
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { obtenerMiFamilia, renombrarFamilia, type MiFamilia } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type TraductorCuenta = ReturnType<typeof useTraduccion>['t'];

// rol del modelo → voz humana (Ley 3: el código jamás visible)
function vozRol(rol: string, t: TraductorCuenta): string {
  switch (rol) {
    case 'adulto_titular': return t('cuenta.rolAdultoTitular');
    case 'adulto_autorizado': return t('cuenta.rolAdultoAutorizado');
    case 'menor': return t('cuenta.rolMenor');
    case 'cuidador_externo': return t('cuenta.rolCuidadorExterno');
    default: return t('cuenta.familiaMiembroAjeno');
  }
}

export default function FamiliaCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [familia, setFamilia] = useState<MiFamilia | 'cargando' | 'error'>('cargando');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerMiFamilia();
      if (!vigente) return;
      if (!r.ok) {
        setFamilia('error');
        return;
      }
      setFamilia(r.data);
      setNombre(r.data.nombre ?? '');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  const esTitular = typeof familia === 'object' && familia.mi_rol === 'adulto_titular';

  async function guardar() {
    if (guardando || typeof familia !== 'object') return;
    setGuardando(true);
    const r = await renombrarFamilia(familia.familia_id, nombre);
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('cuenta.familiaGuardado'), variante: 'exito' });
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.familia')} atras onAtras={() => router.back()} />

      {familia === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : familia === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => { setFamilia('cargando'); setIntento((n) => n + 1); }} />}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
          keyboardShouldPersistTaps="handled"
        >
          <Campo
            label={t('cuenta.familiaNombreLabel')}
            placeholder={t('cuenta.familiaNombrePlaceholder')}
            value={nombre}
            onChangeText={setNombre}
            deshabilitado={!esTitular}
            ayuda={esTitular ? undefined : t('cuenta.familiaSoloTitular')}
            autoCapitalize="words"
          />
          {esTitular ? (
            <Boton etiqueta={t('cuenta.guardar')} bloque cargando={guardando} deshabilitado={nombre.trim().length === 0} onPress={() => void guardar()} />
          ) : null}

          <View style={{ gap: spacing[3], marginTop: spacing[2] }}>
            <Text
              accessibilityRole="header"
              style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
            >
              {t('cuenta.familiaMiembros')}
            </Text>
            <Tarjeta relleno="ninguno">
              {familia.miembros.map((m, i) => (
                <View key={m.familia_miembro_id}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={`${m.nombre ?? t('cuenta.familiaMiembroAjeno')}${m.es_yo ? ` ${t('cuenta.familiaTu')}` : ''}`}
                    subtitulo={vozRol(m.rol, t)}
                  />
                </View>
              ))}
              <Separador />
              {/* hueco P1 declarado: invitar co-dueño llega con su canal */}
              <Celda
                titulo={t('cuenta.familiaInvitar')}
                fin={
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                    {t('cuenta.familiaInvitarPronto')}
                  </Text>
                }
              />
            </Tarjeta>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
