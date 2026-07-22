// ─────────────────────────────────────────────────────────────────────
// M2 — ¿QUIÉN ESTÁ EN EL MOSTRADOR? (/veterinaria/mostrador, S69-B).
// UN campo, DOS fuentes en una lista: lo que la clínica ya puede ver
// (RLS) por nombre de mascota, y el buscador de alta asistida por email.
// Dosis baja (§15b).
//
// TESIS: en un campo sabés si esta mascota ya está en el sistema — y si
// no, el alta está a un toque.
// FIRMA: la salida natural — "Registrar mascota nueva" visible, jamás
// consuelo al pie (comportamiento). ENMIENDA S73 (founder, Ley 23): con
// cuenta RECONOCIDA el botón NO se dibuja — ofrecía duplicar a quien ya
// vive; el alta para esa familia va por el handshake ("Mascota nueva"
// dentro de autorizar, tipo alta_mascota — nace en la familia real).
//
// El TAP de una MASCOTA encontrada → M4 (registrar la atención, A1bis).
// Los resultados de CLIENTE (email/teléfono) informan quién es y el camino
// es "Registrar mascota nueva" (M3): para atender hace falta una mascota.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Campo,
  Celda,
  Encabezado,
  EstadoVacio,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
  type AvatarMascotaEspecie,
} from '@epetplace/ui';
import {
  buscarClienteAltaAsistida,
  buscarClientePorTelefono,
  buscarMascotasAccesibles,
  type MascotaMostrador,
  type ResultadoBusquedaCliente,
} from '@epetplace/api';

import { Text } from 'react-native';
import { EvitaTeclado } from '@/components/evita-teclado';
import { vozErrorVet } from '@/lib/voz-error-vet';
import { useTraduccion } from '@/i18n';

// Heurística del campo único: '@' → email · dígitos (con/ sin +/prefijo,
// el server normaliza) → teléfono · resto → nombre de mascota.
const RE_EMAIL_PARCIAL = /@/;
const RE_TELEFONO = /^[+\d][\d\s()+-]{4,}$/;

type Resultado =
  | { estado: 'idle' }
  | { estado: 'buscando' }
  | { estado: 'mascotas'; lista: MascotaMostrador[] }
  | { estado: 'cliente'; r: ResultadoBusquedaCliente }
  | { estado: 'error'; mensaje: string };

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}

export default function Mostrador() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [resultado, setResultado] = useState<Resultado>({ estado: 'idle' });

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResultado({ estado: 'idle' });
      return;
    }
    let vigente = true;
    setResultado({ estado: 'buscando' });
    // Debounce simple (sin lib): un email va al buscador de alta asistida;
    // el resto, a las mascotas accesibles.
    const timer = setTimeout(async () => {
      if (RE_EMAIL_PARCIAL.test(query)) {
        const r = await buscarClienteAltaAsistida(query);
        if (!vigente) return;
        setResultado(r.ok ? { estado: 'cliente', r: r.data } : { estado: 'error', mensaje: vozErrorVet(t, 'busqueda', r) });
      } else if (RE_TELEFONO.test(query)) {
        const r = await buscarClientePorTelefono(query);
        if (!vigente) return;
        setResultado(r.ok ? { estado: 'cliente', r: r.data } : { estado: 'error', mensaje: vozErrorVet(t, 'busqueda', r) });
      } else {
        const r = await buscarMascotasAccesibles(query);
        if (!vigente) return;
        setResultado(r.ok ? { estado: 'mascotas', lista: r.data } : { estado: 'error', mensaje: vozErrorVet(t, 'busqueda', r) });
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(timer);
    };
  }, [q, t]);

  function irANueva() {
    router.push({ pathname: '/veterinaria/mostrador/nueva', params: q.trim().length > 0 ? { q: q.trim() } : {} });
  }

  // La rama 'registrado' narrada a const (el narrowing por propiedad anidada
  // no sobrevive dentro del closure de onPress — S70-B2-v2).
  const registrado =
    resultado.estado === 'cliente' && resultado.r.existe === 'registrado' ? resultado.r : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('mostrador.buscarTitulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        <Campo
          label={t('mostrador.buscarLabel')}
          placeholder={t('mostrador.buscarPlaceholder')}
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />

        {/* Resultados */}
        {resultado.estado === 'mascotas' && resultado.lista.length > 0 && (
          <Tarjeta elevacion="reposo" relleno="ninguno">
            {resultado.lista.map((m, i) => (
              <View key={m.mascota_id}>
                {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/veterinaria/mostrador/atencion',
                      params: { mascotaId: m.mascota_id, nombre: m.nombre },
                    })
                  }
                  titulo={m.nombre}
                  subtitulo={t('mostrador.origenClinica')}
                  inicio={
                    <AvatarMascota
                      nombre={m.nombre}
                      especie={esEspecie(m.especie) ? m.especie : undefined}
                      tamano="sm"
                    />
                  }
                />
              </View>
            ))}
          </Tarjeta>
        )}

        {registrado !== null && (
          // S70-B2-v2: cuenta registrada → el HANDSHAKE. Tocar entra a la
          // grilla de mascotas de la familia (elegir o "Mascota nueva") y
          // pedir autorización — jamás alta fantasma sobre alguien que ya vive.
          <Tarjeta elevacion="reposo" relleno="ninguno">
            <Celda
              interactiva
              accessibilityRole="button"
              onPress={() => {
                const contacto = q.trim();
                router.push({
                  pathname: '/veterinaria/mostrador/autorizar',
                  params: {
                    userId: registrado.user_id,
                    nombre: registrado.nombre ?? '',
                    contacto,
                    tipo: RE_EMAIL_PARCIAL.test(contacto) ? 'email' : 'telefono',
                  },
                });
              }}
              titulo={registrado.nombre ?? t('mostrador.clienteSinNombre')}
              subtitulo={t('mostrador.registradoTocar')}
            />
          </Tarjeta>
        )}
        {resultado.estado === 'cliente' && resultado.r.existe === 'pendiente' && (
          <Tarjeta elevacion="reposo" relleno="ninguno">
            <Celda titulo={t('mostrador.pendienteTitulo')} subtitulo={t('mostrador.origenPendiente')} />
          </Tarjeta>
        )}

        {/* Vacío honesto — jamás "Sin información" pelado */}
        {((resultado.estado === 'mascotas' && resultado.lista.length === 0) ||
          (resultado.estado === 'cliente' && resultado.r.existe === 'no_registrado')) && (
          <EstadoVacio registro="seccion" titulo={t('mostrador.sinResultadosTitulo')} descripcion={t('mostrador.sinResultadosDetalle')} />
        )}

        {resultado.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                color: theme.status.dangerText,
              }}
            >
              {resultado.mensaje}
            </Text>
          </Tarjeta>
        )}

        {/* LA salida natural — visible salvo cuenta RECONOCIDA (Ley 23,
            S73: la puerta no ofrece lo que va a rechazar — el alta acá
            duplicaría a quien ya vive; su camino es el handshake). */}
        {registrado === null && (
          <Boton variante="primario" bloque etiqueta={t('mostrador.registrarNueva')} onPress={irANueva} />
        )}
      </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
