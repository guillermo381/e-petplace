// ─────────────────────────────────────────────────────────────────────
// B3 — EL ARMADO DEL PRESUPUESTO (/veterinaria/presupuesto/nuevo, S69-B).
// Sobre los 5 wrappers del contrato A1. Desde una cita/atención del día
// (params citaId/atencionId como FK de origen) o suelto. Dosis §15b: el
// prestador TRABAJA — densa y rápida, cero ceremonia.
//
// TESIS: en unos toques la clínica arma lo que cuesta, y la familia
// decide — con el precio congelado desde ya.
// FIRMA: el total SIEMPRE visible mientras se arma (comportamiento).
//
// VOZ HONESTA FIRMADA (mesa, sobre la nota A1): la cita del procedimiento
// nace SIN fecha. La confirmación de aprobación dice "quedó aprobado con
// precio congelado — coordiná el día", JAMÁS "quedó agendada para {fecha}".
// La coordinación de fecha es D-439 (no se dibuja acá).
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  crearPresupuestoBorrador,
  enviarPresupuesto,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  obtenerMundoVeterinariaPropio,
  registrarAprobacionPresencial,
  type ProcedimientoVeterinaria,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { vozErrorVet } from '@/lib/voz-error-vet';
import { useTraduccion } from '@/i18n';

type ItemLocal = { key: string; nombre: string; precio: number; cantidad: number };

let SEQ = 0;
function nuevaKey(): string {
  SEQ += 1;
  return `it-${SEQ}`;
}

export default function NuevoPresupuesto() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { mascotaId = '', citaId, atencionId } = useLocalSearchParams<{
    mascotaId?: string;
    citaId?: string;
    atencionId?: string;
  }>();

  const [cuentaId, setCuentaId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string>('EC');
  const [procedimientos, setProcedimientos] = useState<ProcedimientoVeterinaria[]>([]);
  const [items, setItems] = useState<ItemLocal[]>([]);
  const [nombreLibre, setNombreLibre] = useState('');
  const [precioLibre, setPrecioLibre] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const cta = await obtenerMiCuentaComercial();
      if (!vigente) return;
      if (cta.ok && cta.data) {
        setCuentaId(cta.data.id);
        setCountryCode(cta.data.countryCode);
      }
      const pr = await obtenerMiPrestador();
      if (!vigente || !pr.ok) return;
      const mundo = await obtenerMundoVeterinariaPropio(pr.data.id);
      if (!vigente || !mundo.ok) return;
      setProcedimientos(mundo.data.procedimientos.filter((p) => p.activo));
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const total = useMemo(() => items.reduce((s, it) => s + it.precio * it.cantidad, 0), [items]);

  function agregarProcedimiento(p: ProcedimientoVeterinaria) {
    setItems((xs) => [...xs, { key: nuevaKey(), nombre: p.nombre, precio: p.precio, cantidad: 1 }]);
  }
  function agregarLibre() {
    const precio = Number(precioLibre.replace(',', '.'));
    if (nombreLibre.trim().length === 0 || !Number.isFinite(precio) || precio <= 0) return;
    setItems((xs) => [...xs, { key: nuevaKey(), nombre: nombreLibre.trim(), precio, cantidad: 1 }]);
    setNombreLibre('');
    setPrecioLibre('');
  }
  function quitar(key: string) {
    setItems((xs) => xs.filter((it) => it.key !== key));
  }

  async function enviar(via: 'familia' | 'presencial') {
    if (cuentaId === null || items.length === 0 || enviando) return;
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      mostrar({ variante: 'error', texto: sesion.mensaje });
      return;
    }
    setEnviando(true);
    const borr = await crearPresupuestoBorrador({
      cuentaComercialId: cuentaId,
      mascotaId,
      items: items.map((it) => ({ descripcionLibre: it.nombre, precio: it.precio, cantidad: it.cantidad })),
      eventoCitaServicioId: typeof citaId === 'string' ? citaId : null,
      eventoAtencionId: typeof atencionId === 'string' ? atencionId : null,
      countryCode,
    });
    if (!borr.ok) {
      setEnviando(false);
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'presupuesto', borr) });
      return;
    }
    // vence en 7 días (default sensato del negocio, declarado).
    const venceEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const env = await enviarPresupuesto(borr.data, venceEn);
    if (!env.ok) {
      setEnviando(false);
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'presupuesto', env) });
      return;
    }
    if (via === 'presencial') {
      const apr = await registrarAprobacionPresencial(borr.data);
      setEnviando(false);
      if (!apr.ok) {
        mostrar({ variante: 'error', texto: vozErrorVet(t, 'presupuesto', apr) });
        return;
      }
      // VOZ HONESTA: nace sin fecha — coordiná el día (jamás "agendada para…").
      mostrar({ variante: 'exito', texto: t('presupuesto.aprobadoPresencial') });
      router.back();
      return;
    }
    setEnviando(false);
    mostrar({ variante: 'exito', texto: t('presupuesto.enviadoFamilia') });
    router.back();
  }

  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('presupuesto.titulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Procedimientos del negocio (reservable=false) — quick-add */}
        {procedimientos.length > 0 && (
          <View style={{ gap: spacing[2] }}>
            <Texto variante="seccion">
              {t('presupuesto.procedimientosTitulo')}
            </Texto>
            <Tarjeta elevacion="reposo" relleno="ninguno">
              {procedimientos.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Separador />}
                  <Celda
                    interactiva
                    accessibilityRole="button"
                    onPress={() => agregarProcedimiento(p)}
                    titulo={p.nombre}
                    metadataMono={money(p.precio)}
                  />
                </View>
              ))}
            </Tarjeta>
          </View>
        )}

        {/* Línea libre */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">
            {t('presupuesto.libreTitulo')}
          </Texto>
          <Campo label={t('presupuesto.libreNombre')} placeholder={t('presupuesto.libreNombrePlaceholder')} value={nombreLibre} onChangeText={setNombreLibre} />
          <Campo
            label={t('presupuesto.librePrecio')}
            placeholder="0.00"
            value={precioLibre}
            onChangeText={setPrecioLibre}
            keyboardType="decimal-pad"
          />
          <Boton variante="compacto" etiqueta={t('presupuesto.agregarLinea')} onPress={agregarLibre} />
        </View>

        {/* Los ítems armados + total SIEMPRE visible */}
        {items.length > 0 ? (
          <Tarjeta elevacion="reposo" relleno="ninguno">
            {items.map((it, i) => (
              <View key={it.key}>
                {i > 0 && <Separador />}
                <Celda
                  titulo={it.nombre}
                  metadataMono={money(it.precio * it.cantidad)}
                  fin={<Boton variante="ghost" tamaño="sm" etiqueta={t('presupuesto.quitar')} onPress={() => quitar(it.key)} />}
                />
              </View>
            ))}
            <Separador />
            <Celda titulo={t('presupuesto.total')} metadataMono={money(total)} />
          </Tarjeta>
        ) : (
          <Texto variante="apoyo">
            {t('presupuesto.vacioAyuda')}
          </Texto>
        )}

        {/* Las dos salidas */}
        <View style={{ gap: spacing[3] }}>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('presupuesto.enviarFamilia')}
            cargando={enviando}
            deshabilitado={items.length === 0 || cuentaId === null}
            onPress={() => void enviar('familia')}
          />
          <Boton
            variante="compacto"
            etiqueta={t('presupuesto.aprobarPresencial')}
            deshabilitado={items.length === 0 || cuentaId === null || enviando}
            onPress={() => void enviar('presencial')}
          />
        </View>
      </ScrollView>
    </View>
  );
}
