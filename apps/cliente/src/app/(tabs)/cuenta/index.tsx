/**
 * CUENTA — el índice del ciclo §3.5 (S55-B3, sobre el stub S51-B2.5).
 * Mapa: Tu perfil · Tu familia · Preferencias · Pagos · Ayuda y
 * legales · Sesión y cuenta (cerrar sesión + eliminar cuenta con voz
 * honesta — letra (a): visible, espec P15 en docs, jamás borra hoy).
 * Escalera: esta pantalla no muestra datos del expediente (índice puro).
 */

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Hoja,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import { cerrarSesion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
    >
      {texto}
    </Text>
  );
}

export default function Cuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTraduccion();

  const [salirAbierta, setSalirAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [eliminarAbierta, setEliminarAbierta] = useState(false);

  // S58 (D-361): el freno del grupo se LEVANTA — el lote 3 trae los
  // íconos y las entradas hablan la Ley 19.1 (perfil usa la chapita
  // 'cuenta'; la dirección usa el pin 'ubicacion').
  const lugares = [
    { etiqueta: t('cuenta.perfil'), ruta: '/cuenta/perfil' as const, icono: 'cuenta' as const },
    { etiqueta: t('direccion.titulo'), ruta: '/cuenta/direccion' as const, icono: 'ubicacion' as const },
    { etiqueta: t('cuenta.familia'), ruta: '/cuenta/familia' as const, icono: 'familia' as const },
    // S89-D orden 7 ②: la casa de los papeles de TODA la familia (el
    // perfil de cada mascota conserva los suyos, plegados).
    { etiqueta: t('documentos.titulo'), ruta: '/cuenta/documentos' as const, icono: 'documento' as const },
    { etiqueta: t('cuenta.preferencias'), ruta: '/cuenta/preferencias' as const, icono: 'preferencias' as const },
    { etiqueta: t('cuenta.pagos'), ruta: '/cuenta/pagos' as const, icono: 'pagos' as const },
    { etiqueta: t('cuenta.ayuda'), ruta: '/cuenta/ayuda' as const, icono: 'ayuda' as const },
    // S74 — ENTRADA TEMPORAL del gate de la fusión del avatar (la lámina
    // se juzga en DISPOSITIVO: Chromium aplica borderCurve y no puede
    // desmentir el engaño que produjo). MUERE con la firma del founder,
    // junto a la lámina (Ley 37 — precedente lámina S73).
    { etiqueta: t('cuenta.laminaFusion'), ruta: '/lamina-fusion' as const, icono: 'preferencias' as const },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
        <Encabezado variante="portada" saludo={t('cuenta.titulo')} />

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          <Tarjeta relleno="ninguno">
            {lugares.map((lugar, i) => (
              <View key={lugar.ruta}>
                {i > 0 ? <Separador /> : null}
                <CeldaNavegacion
                  icono={lugar.icono}
                  titulo={lugar.etiqueta}
                  onPress={() => router.push(lugar.ruta)}
                />
              </View>
            ))}
          </Tarjeta>

          {/* ── Sesión y cuenta ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('cuenta.sesion')} />
            <Boton variante="secundario" etiqueta={t('ajustes.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            <Boton variante="compacto" etiqueta={t('cuenta.eliminarCuenta')} bloque onPress={() => setEliminarAbierta(true)} />
          </View>

          {/* ── S74-A · EL MARCADOR RENDERIZADO (L-160 enmendada / L-161):
              el [update] era SOLO console.log — logcat-only, inalcanzable
              para el founder sin cable. La identidad del build gana
              PANTALLA (receta de B, 0225701 — las dos apps no divergen).
              Voz de máquina (Ley 3); id corto = primeros 8 del updateId
              (único por publicación); embebido/dev se dice honesto.
              Camino literal: tab Cuenta → el pie. ── */}
          {/* S81-B2 (pedido a A, espejo del prestador): el lanzamiento
              EMBEBIDO de un release tiene updateId NO-nulo (el id de
              assets/app.manifest — acá sería "update 05fe7534"). El
              discriminador es isEmbeddedLaunch, no la nulidad (L-160). */}
          <Texto variante="dato">
            {/* S89 orden 7: EL SELLO — id corto + canal + FECHA del update.
                Verificar un bundle = leer este código; ningún diagnóstico de
                OTA vuelve a empezar por «¿qué bundle corre?». */}
            {!Updates.isEmbeddedLaunch && Updates.updateId !== null
              ? `update ${Updates.updateId.slice(0, 8)} · ${Updates.channel ?? 'sin canal'}${
                  Updates.createdAt
                    ? ` · ${String(Updates.createdAt.getDate()).padStart(2, '0')}/${String(
                        Updates.createdAt.getMonth() + 1,
                      ).padStart(2, '0')} ${String(Updates.createdAt.getHours()).padStart(2, '0')}:${String(
                        Updates.createdAt.getMinutes(),
                      ).padStart(2, '0')}`
                    : ''
                }`
              : 'bundle embebido / dev'}
          </Texto>

          {/* ── S82-B r13 · LA ENTRADA A LA GALERÍA DE TOKENS ──
              CRUCE DE TERRITORIO DECLARADO: esta pantalla es del cliente
              (A/C) y la toca B con AUTORIZACIÓN EXPLÍCITA del founder,
              citada: *"La entrada en Cuenta va, SIN __DEV__ — el founder
              gatea en preview y con __DEV__ no llegaría justo donde la
              necesita… Cruce declarado en el commit con mi autorización
              citada."* (S82, orden r12bis/r13.)

              SIN `__DEV__` A PROPÓSITO: el gate corre en el APK PREVIEW,
              donde `__DEV__` es false — un guard ahí la haría
              inalcanzable exactamente donde se la necesita. Es la misma
              lección que el marcador de arriba: L-161 (una superficie de
              gate se verifica ALCANZABLE en el build del founder).

              POR QUÉ ES LA ÚNICA VÍA, medido en r13: el scheme SÍ está
              horneado (el APK hermano trae `android:scheme="prestador"` +
              `"exp+prestador"` en su intent filter, y el del cliente vive
              en app.json desde el scaffold) — así que el deep link
              funciona, pero **exige cable/adb**: Chrome no abre schemes
              custom tipeados y WhatsApp no los linkea (D-509②, medido en
              S79). Sin cable no hay forma de disparar el intent. La
              entrada no es comodidad: es la vía.

              🔴 DEUDA: se RETIRA o se esconde tras un gesto ANTES del
              soft launch (1-oct-2026) — una herramienta de sesión en la
              superficie real también la alcanza un usuario. ── */}
          {/* `icono` es TIPADO (IconoNombre), jamás slot libre — el
              contrato de CeldaNavegacion lo dice en su propio JSDoc.
              Los textos van LITERALES y no por el riel i18n a propósito:
              es una herramienta de sesión con fecha de retiro, y meterle
              keys al diccionario dejaría basura que sobrevive a la deuda. */}
          <CeldaNavegacion
            icono="preferencias"
            titulo="Galería de tokens"
            detalle="herramienta de sesión — no es pantalla de producto"
            onPress={() => router.push('/gallery')}
          />
        </View>
      </ScrollView>

      <Hoja visible={salirAbierta} onCerrar={() => setSalirAbierta(false)} titulo={t('ajustes.titulo')}>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
            {t('ajustes.confirmacionCierre')}
          </Text>
          <Boton
            variante="destructivo"
            etiqueta={t('ajustes.cerrarSesion')}
            bloque
            cargando={cerrando}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void (async () => {
                await cerrarSesion();
                setCerrando(false);
                setSalirAbierta(false);
                router.replace('/bienvenida');
              })();
            }}
          />
          <Boton variante="ghost" etiqueta={t('ajustes.cancelar')} bloque onPress={() => setSalirAbierta(false)} />
        </View>
      </Hoja>

      {/* Eliminar cuenta — letra (a): la voz honesta; la política P15
          (destino del expediente, co-dueños, hitos) se firma ANTES de
          que esto ejecute nada. */}
      <Hoja visible={eliminarAbierta} onCerrar={() => setEliminarAbierta(false)} titulo={t('cuenta.eliminarCuenta')} conCerrar>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            {t('cuenta.eliminarVoz')}
          </Text>
          <Boton variante="secundario" etiqueta={t('cuenta.entendido')} bloque onPress={() => setEliminarAbierta(false)} />
        </View>
      </Hoja>
    </SafeAreaView>
  );
}
