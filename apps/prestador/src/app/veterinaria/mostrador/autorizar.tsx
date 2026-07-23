// ─────────────────────────────────────────────────────────────────────
// EL HANDSHAKE — la autorización de la familia en el mostrador
// (/veterinaria/mostrador/autorizar, S70). La clínica halló un cliente
// REGISTRADO (cuenta real de pet-parent); para atender o sumar una
// mascota necesita el sí de la familia — un toque, por mascota. Dosis
// baja (§15b). Espejo del alta fantasma (nueva.tsx), pero acá NO se
// inventa un fantasma: se PIDE permiso a quien ya vive.
//
// TESIS: atender a esta mascota necesita el sí de su familia — y ese sí
// está a un toque, esperándose con honestidad.
// FIRMA: la espera de marca — comportamiento: la app no finge, muestra
// con la voz honesta que está aguardando a la familia real.
// CHANEL: sin celda de navegación con chevron para el alta (el trabajo
// no es "entrar a una sección", es elegir un destino dentro de la misma
// pantalla — Celda interactiva, no CeldaNavegacion); sin subtítulos
// decorativos en la grilla; sin cronómetro ni contador de expiración en
// la espera (la honestidad es la voz, no un reloj que presiona).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Campo,
  Celda,
  Encabezado,
  EsperaDeMarca,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  SelectorEspecie,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
  type AvatarMascotaEspecie,
  type SelectorEspecieOpcion,
} from '@epetplace/ui';
import {
  buscarClienteAltaAsistida,
  buscarClientePorTelefono,
  consultarSolicitudAutorizacion,
  crearSolicitudAutorizacion,
  obtenerEspeciesActivas,
  obtenerMiPrestador,
  type MascotaDeClienteRegistrado,
} from '@epetplace/api';

import { EvitaTeclado } from '@/components/evita-teclado';
import { vozErrorVet } from '@/lib/voz-error-vet';
import { useTraduccion } from '@/i18n';

// Espejo del filtro de nueva.tsx: solo los códigos que el AvatarMascota /
// SelectorEspecie saben pintar entran a la grilla del alta.
const CODIGOS_ESPECIE_UI: readonly AvatarMascotaEspecie[] = [
  'perro', 'gato', 'conejo', 'ave', 'roedor', 'cobaya', 'pez', 'huron', 'reptil',
];
function esEspecieUi(codigo: string): codigo is AvatarMascotaEspecie {
  return (CODIGOS_ESPECIE_UI as readonly string[]).includes(codigo);
}

type Fase = 'grilla' | 'confirmar' | 'alta' | 'esperando';

export default function AutorizarMostrador() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { userId = '', nombre = '', contacto = '', tipo = 'email' } =
    useLocalSearchParams<{ userId?: string; nombre?: string; contacto?: string; tipo?: 'email' | 'telefono' }>();

  // Carga
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [cuentaId, setCuentaId] = useState<string | null>(null);
  const [mascotas, setMascotas] = useState<MascotaDeClienteRegistrado[]>([]);
  const [opciones, setOpciones] = useState<SelectorEspecieOpcion[] | null>(null);
  const cargadoRef = useRef(false);

  // Máquina de fases
  const [fase, setFase] = useState<Fase>('grilla');
  const [elegida, setElegida] = useState<MascotaDeClienteRegistrado | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState<{ solicitudId: string; mascotaNombre: string } | null>(null);

  // Alta de mascota nueva
  const [nombreMascota, setNombreMascota] = useState('');
  const [especie, setEspecie] = useState<AvatarMascotaEspecie | undefined>(undefined);

  // ── Carga en foco (una sola vez — la máquina de fases NO se reinicia) ──
  useFocusEffect(
    useCallback(() => {
      if (cargadoRef.current) return;
      cargadoRef.current = true;
      let vigente = true;
      void (async () => {
        const [prestador, esp, busqueda] = await Promise.all([
          // S75-B6 (cura R2→R1, clase 1): la cuenta owner-only devolvía
          // null al empleado; R1 resuelve por vínculo y trae el mismo
          // cuenta_comercial_id (no-regresión del titular verificada 5/5).
          obtenerMiPrestador(),
          obtenerEspeciesActivas(),
          tipo === 'email' ? buscarClienteAltaAsistida(contacto) : buscarClientePorTelefono(contacto),
        ]);
        if (!vigente) return;

        if (!prestador.ok || prestador.data.cuenta_comercial_id === null) {
          setErrorCarga(true);
          setCargando(false);
          return;
        }
        setCuentaId(prestador.data.cuenta_comercial_id);

        if (esp.ok) {
          const validas: SelectorEspecieOpcion[] = [];
          for (const e of esp.data) if (esEspecieUi(e.codigo)) validas.push({ codigo: e.codigo, nombre: e.nombre });
          setOpciones(validas);
        }

        if (!busqueda.ok || busqueda.data.existe !== 'registrado') {
          setErrorCarga(true);
          setCargando(false);
          return;
        }
        setMascotas(busqueda.data.mascotas);
        setCargando(false);
      })();
      return () => {
        vigente = false;
      };
    }, [contacto, tipo]),
  );

  // ── El poll de la espera (cada 2500ms; limpieza al desmontar/cambiar) ──
  useEffect(() => {
    if (fase !== 'esperando' || espera === null) return;
    let activo = true;
    let fallos = 0;
    const detener = (id: ReturnType<typeof setInterval>) => {
      activo = false;
      clearInterval(id);
    };
    const id = setInterval(() => {
      void (async () => {
        const r = await consultarSolicitudAutorizacion(espera.solicitudId);
        if (!activo) return;
        if (!r.ok) {
          // Fallo transitorio: seguimos sondeando, pero con tope razonable.
          fallos += 1;
          if (fallos >= 8) {
            detener(id);
            mostrar({ variante: 'error', texto: t('autorizar.error') });
            router.back();
          }
          return;
        }
        fallos = 0;
        const estado = r.data.estado;
        if (estado === 'autorizada') {
          detener(id);
          router.replace({
            pathname: '/veterinaria/mostrador/atencion',
            params: { mascotaId: r.data.mascotaId ?? '', nombre: espera.mascotaNombre },
          });
        } else if (estado === 'rechazada') {
          detener(id);
          mostrar({ variante: 'neutro', texto: t('autorizar.rechazada', { nombre }) });
          router.back();
        } else if (estado === 'expirada') {
          detener(id);
          mostrar({ variante: 'neutro', texto: t('autorizar.expirada') });
          router.back();
        }
        // 'pendiente' → seguimos sondeando.
      })();
    }, 2500);
    return () => detener(id);
  }, [fase, espera, nombre, mostrar, router, t]);

  async function pedirAtencion() {
    if (cuentaId === null || elegida === null || enviando) return;
    setEnviando(true);
    const r = await crearSolicitudAutorizacion({
      cuentaComercialId: cuentaId,
      tipo: 'atencion',
      mascotaId: elegida.mascotaId,
    });
    setEnviando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'solicitud', r) });
      return;
    }
    setEspera({ solicitudId: r.data, mascotaNombre: elegida.nombre });
    setFase('esperando');
  }

  async function pedirAlta() {
    if (cuentaId === null || especie === undefined || nombreMascota.trim().length === 0 || enviando) return;
    const nombreNueva = nombreMascota.trim();
    setEnviando(true);
    const r = await crearSolicitudAutorizacion({
      cuentaComercialId: cuentaId,
      tipo: 'alta_mascota',
      destinoUserId: userId,
      payloadAlta: { nombre: nombreNueva, especie },
    });
    setEnviando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'solicitud', r) });
      return;
    }
    setEspera({ solicitudId: r.data, mascotaNombre: nombreNueva });
    setFase('esperando');
  }

  const puedeAlta = nombreMascota.trim().length > 0 && especie !== undefined && !enviando;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('autorizar.titulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        {cargando ? (
          <EsqueletoGrupo etiqueta={t('autorizar.titulo')}>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" alto={72} />
              <Esqueleto forma="bloque" alto={72} />
              <Esqueleto forma="bloque" alto={72} />
            </View>
          </EsqueletoGrupo>
        ) : errorCarga ? (
          <EstadoVacio registro="seccion" titulo={t('autorizar.error')} descripcion={t('autorizar.errorDetalle')} />
        ) : fase === 'grilla' ? (
          <>
            <Text
              style={{
                fontFamily: typography.family.sans.light,
                fontSize: typography.size.lg,
                lineHeight: typography.size.lg * 1.35,
                color: theme.text.primary,
              }}
            >
              {t('autorizar.grillaTitulo', { nombre })}
            </Text>
            <Tarjeta elevacion="reposo" relleno="ninguno">
              {mascotas.map((m, i) => (
                <View key={m.mascotaId}>
                  {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                  <Celda
                    interactiva
                    accessibilityRole="button"
                    onPress={() => {
                      setElegida(m);
                      setFase('confirmar');
                    }}
                    titulo={m.nombre}
                    inicio={
                      <AvatarMascota nombre={m.nombre} fotoUrl={m.fotoUrl ?? undefined} especie={undefined} tamano="sm" />
                    }
                  />
                </View>
              ))}
              {mascotas.length > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
              <Celda
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  setNombreMascota('');
                  setEspecie(undefined);
                  setFase('alta');
                }}
                titulo={t('autorizar.mascotaNueva')}
              />
            </Tarjeta>
          </>
        ) : fase === 'confirmar' && elegida !== null ? (
          <>
            <Tarjeta elevacion="reposo" relleno="amplio">
              <View style={{ alignItems: 'center', gap: spacing[3] }}>
                <AvatarMascota nombre={elegida.nombre} fotoUrl={elegida.fotoUrl ?? undefined} especie={undefined} tamano="lg" />
                <Text
                  style={{
                    fontFamily: typography.family.sans.light,
                    fontSize: typography.size.xl,
                    color: theme.text.primary,
                    textAlign: 'center',
                  }}
                >
                  {elegida.nombre}
                </Text>
              </View>
            </Tarjeta>
            <Boton
              variante="primario"
              bloque
              etiqueta={t('autorizar.pedir')}
              cargando={enviando}
              onPress={() => void pedirAtencion()}
            />
            <Boton variante="compacto" bloque etiqueta={t('autorizar.volver')} onPress={() => setFase('grilla')} />
          </>
        ) : fase === 'alta' ? (
          <>
            <Text
              style={{
                fontFamily: typography.family.sans.light,
                fontSize: typography.size.lg,
                lineHeight: typography.size.lg * 1.35,
                color: theme.text.primary,
              }}
            >
              {t('autorizar.altaTitulo')}
            </Text>
            <Campo
              label={t('autorizar.nombreLabel')}
              placeholder={t('autorizar.nombrePlaceholder')}
              value={nombreMascota}
              onChangeText={setNombreMascota}
              autoCapitalize="words"
            />
            {opciones !== null && (
              <SelectorEspecie
                opciones={opciones}
                seleccionada={especie}
                onSelect={setEspecie}
                etiqueta={t('autorizar.especieLabel')}
              />
            )}
            <Boton
              variante="primario"
              bloque
              etiqueta={t('autorizar.pedir')}
              cargando={enviando}
              deshabilitado={!puedeAlta}
              onPress={() => void pedirAlta()}
            />
            <Boton variante="compacto" bloque etiqueta={t('autorizar.volver')} onPress={() => setFase('grilla')} />
          </>
        ) : fase === 'esperando' ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[10], gap: spacing[4] }}>
            <EsperaDeMarca tamano={64} />
            <Text
              style={{
                fontFamily: typography.family.sans.light,
                fontSize: typography.size.lg,
                lineHeight: typography.size.lg * 1.35,
                color: theme.text.primary,
                textAlign: 'center',
              }}
            >
              {t('autorizar.esperando', { nombre })}
            </Text>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                lineHeight: typography.size.base * 1.4,
                color: theme.text.secondary,
                textAlign: 'center',
              }}
            >
              {t('autorizar.esperandoDetalle')}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
