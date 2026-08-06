/**
 * Cuenta · Preferencias — S88-C sobre la lámina FIRMADA
 * `docs/laminas/LAMINA_PREFERENCIAS_NOTIFICACIONES.md` (5-ago-2026) y el
 * contrato S87 (persona, categoría, canal).
 *
 * LA FORMA ES LA DEL CLIENTE (Lote 4, pista D) — **excepción §6 del
 * método: se comparte la forma, jamás la voz.** Lo que es de ESTA casa:
 * · la voz del oficio — UNA LÍNEA DE EJEMPLO POR FILA medida contra el
 *   catálogo vivo (al prestador le llegan liquidaciones, aprobaciones,
 *   altas asistidas, documentos — jamás «vacunas de tus mascotas»);
 * · los canales en voz humana FIRMADOS por el founder (S88): «En el
 *   teléfono» · «Por correo» · «WhatsApp» · «En la app» — «push» no es
 *   vocabulario de nadie;
 * · una fila cuya categoría no tiene tipos vivos NO se muestra —
 *   derivado del catálogo (`tieneTiposVivos`), no de una lista a mano
 *   (hoy: `resumen`, medido con 0 tipos);
 * · acento «oficio» (§15b.1) y MarcaDeAgua de la casa.
 *
 * Lo que rige igual que en el cliente (lámina):
 * - La pantalla LEE filas y canales del catálogo (§6 de la lámina).
 * - La verdad de celda es el ESPEJO de `preferencia_efectiva`
 *   (lib/preferencias-estado.ts, port declarado).
 * - Fila NO apagable: SIN interruptor de existencia (Ley 23) + la voz
 *   del porqué (las tres firmadas §3).
 * - `comercial` nace APAGADA — lo dice el catálogo, no esta pantalla.
 * - WhatsApp: el primer toque NO enciende — abre el consentimiento; el
 *   texto FIRMADO mostrado viaja como EVIDENCIA (§4, requisito de Meta).
 * - Permiso del SO negado: se dice, no se finge (§5; sonda v2, L-190).
 * - El escalado de fuente del sistema NO se apaga (§6).
 * - Murió la promesa «Pronto — cuando las notificaciones…» (§7).
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Interruptor,
  MarcaDeAgua,
  SelectorOpcion,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { cambiarIdioma, type IdiomaSoportado } from '@epetplace/i18n';
import {
  guardarIdiomaPreferido,
  guardarPreferenciaCanal,
  obtenerCatalogoNotificaciones,
  obtenerPreferencias,
  type CanalNotificacion,
  type CatalogoNotificaciones,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { filaEncendida, preferenciaEfectiva } from '@/lib/preferencias-estado';
import { permisoPushDelSistema, type PermisoPush } from '@/lib/permiso-push';

export default function PreferenciasCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [cambiando, setCambiando] = useState(false);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [catalogo, setCatalogo] = useState<CatalogoNotificaciones | null>(null);
  // Solo lo PERSISTIDO, keyed "categoria:canal" — el default lo pone el
  // espejo, jamás esta pantalla (contrato S87).
  const [persistidas, setPersistidas] = useState<Record<string, boolean>>({});
  const [intento, setIntento] = useState(0);
  const [permisoPush, setPermisoPush] = useState<PermisoPush>('no_medible');
  const [consentimientoWa, setConsentimientoWa] = useState<string | null>(null);
  const [guardandoWa, setGuardandoWa] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const [cat, prefs, permiso] = await Promise.all([
        // S88/A: la audiencia la DECLARA la pantalla — el motor no la adivina
        // (la misma persona puede ser dueño de mascota Y prestador).
        obtenerCatalogoNotificaciones('prestador'),
        obtenerPreferencias(),
        permisoPushDelSistema(),
      ]);
      if (!vigente) return;
      if (!cat.ok || !prefs.ok) {
        setEstado('error');
        return;
      }
      setCatalogo(cat.data);
      setPersistidas(prefs.data.notificaciones);
      setPermisoPush(permiso);
      setEstado('listo');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  async function alElegirIdioma(codigo: string) {
    if (cambiando || codigo === idioma || (codigo !== 'es' && codigo !== 'en')) return;
    setCambiando(true);
    try {
      await cambiarIdioma(codigo as IdiomaSoportado);
    } catch {
      mostrar({ texto: t('negocio.idiomaError'), variante: 'error' });
    }
    const r = await guardarIdiomaPreferido(codigo as IdiomaSoportado);
    if (!r.ok) mostrar({ texto: t('negocio.idiomaError'), variante: 'error' });
    setCambiando(false);
  }

  // ── Voces por código de catálogo (Ley 3: jamás un código crudo). Un
  // código que la pantalla no conozca cae a la descripción del catálogo.
  function vozFila(codigo: string, fallback: string): string {
    switch (codigo) {
      case 'operacion': return t('miCuenta.notifFilaOperacion');
      case 'salud_seguridad': return t('miCuenta.notifFilaSaludSeguridad');
      case 'seguridad_cuenta': return t('miCuenta.notifFilaSeguridadCuenta');
      case 'saldo_pagado': return t('miCuenta.notifFilaSaldoPagado');
      case 'relacional': return t('miCuenta.notifFilaRelacional');
      case 'resumen': return t('miCuenta.notifFilaResumen');
      case 'comercial': return t('miCuenta.notifFilaComercial');
      default: return fallback;
    }
  }
  // Las TRES voces del porqué — firmadas en la lámina §3.
  function vozPorque(codigo: string): string | null {
    switch (codigo) {
      case 'salud_seguridad': return t('miCuenta.notifPorqueSaludSeguridad');
      case 'seguridad_cuenta': return t('miCuenta.notifPorqueSeguridadCuenta');
      case 'saldo_pagado': return t('miCuenta.notifPorqueSaldoPagado');
      default: return null;
    }
  }
  /** LA LÍNEA DE EJEMPLO por fila — la voz del OFICIO (excepción §6):
   *  medida contra el catálogo, propuesta a la firma de la mesa. `null`
   *  honesto para una categoría sin línea (no se inventa). */
  function vozEjemplo(codigo: string): string | null {
    switch (codigo) {
      case 'operacion': return t('miCuenta.notifEjOperacion');
      case 'salud_seguridad': return t('miCuenta.notifEjSaludSeguridad');
      case 'seguridad_cuenta': return t('miCuenta.notifEjSeguridadCuenta');
      case 'saldo_pagado': return t('miCuenta.notifEjSaldoPagado');
      case 'relacional': return t('miCuenta.notifEjRelacional');
      case 'comercial': return t('miCuenta.notifEjComercial');
      default: return null;
    }
  }
  // Los CUATRO canales en voz humana — firmados por el founder (S88).
  function vozCanal(codigo: CanalNotificacion, fallback: string): string {
    switch (codigo) {
      case 'in_app': return t('miCuenta.canalEnApp');
      case 'push': return t('miCuenta.canalTelefono');
      case 'email': return t('miCuenta.canalCorreo');
      case 'whatsapp': return t('miCuenta.canalWhatsapp');
      default: return fallback;
    }
  }

  // ── Escritura optimista con vuelta atrás dicha (regla 36).
  async function guardarCelda(
    categoria: string,
    canal: CanalNotificacion,
    habilitada: boolean,
    evidencia?: { textoMostrado: string; metodo: string; en: string },
  ): Promise<boolean> {
    const clave = `${categoria}:${canal}`;
    const previo = { ...persistidas };
    setPersistidas((p) => ({ ...p, [clave]: habilitada }));
    const r = await guardarPreferenciaCanal({ categoria, canal, habilitada, evidencia });
    if (!r.ok) {
      setPersistidas(previo);
      mostrar({ texto: r.mensaje, variante: 'error' });
      return false;
    }
    return true;
  }

  function alTocarCanal(categoria: string, canal: CanalNotificacion, defaultCategoria: boolean) {
    const clave = `${categoria}:${canal}`;
    const actual = preferenciaEfectiva({ persistida: persistidas[clave], canal, defaultCategoria });
    if (canal === 'whatsapp' && !actual) {
      // Lámina §4: el primer toque NO enciende — abre el consentimiento.
      setConsentimientoWa(categoria);
      return;
    }
    void guardarCelda(categoria, canal, !actual);
  }

  async function alCambiarExistencia(
    categoria: string,
    canales: CanalNotificacion[],
    encender: boolean,
  ) {
    if (encender) {
      // Encender la existencia enciende EL PISO y nada más.
      const piso = catalogo?.canales.find((c) => c.esPiso)?.codigo ?? 'in_app';
      await guardarCelda(categoria, piso, true);
      return;
    }
    // Apagar la existencia apaga la fila entera (lámina §2a).
    const previo = { ...persistidas };
    setPersistidas((p) => {
      const s = { ...p };
      for (const c of canales) s[`${categoria}:${c}`] = false;
      return s;
    });
    const resultados = await Promise.all(
      canales.map((c) => guardarPreferenciaCanal({ categoria, canal: c, habilitada: false })),
    );
    const fallo = resultados.find((r) => !r.ok);
    if (fallo !== undefined && !fallo.ok) {
      setPersistidas(previo);
      mostrar({ texto: fallo.mensaje, variante: 'error' });
    }
  }

  async function confirmarWhatsapp() {
    if (consentimientoWa === null || guardandoWa) return;
    setGuardandoWa(true);
    // El texto EXACTO mostrado viaja como evidencia (§4 — Meta), resuelto
    // en el idioma en que la persona lo leyó.
    const ok = await guardarCelda(consentimientoWa, 'whatsapp', true, {
      textoMostrado: t('miCuenta.waConsentTexto'),
      metodo: 'hoja_preferencias_prestador',
      en: new Date().toISOString(),
    });
    setGuardandoWa(false);
    if (ok) setConsentimientoWa(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('miCuenta.preferencias')} atras onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[5] }}>
        <Tarjeta>
          <SelectorOpcion
            acento="oficio"
            etiqueta={t('negocio.idioma')}
            opciones={[
              { codigo: 'es', etiqueta: t('negocio.idiomaEs') },
              { codigo: 'en', etiqueta: t('negocio.idiomaEn') },
            ]}
            seleccionada={idioma}
            onSelect={(codigo) => void alElegirIdioma(codigo)}
          />
        </Tarjeta>

        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('miCuenta.notificaciones')}</Texto>
          <Texto variante="apoyo">{t('miCuenta.notifLey')}</Texto>

          {/* Lámina §5: el permiso del SO negado SE DICE — los chips de
              «En el teléfono» no fingen. `no_medible` no afirma (L-197). */}
          {permisoPush === 'negado' ? (
            <Texto variante="apoyo">{t('miCuenta.notifPermisoNegado')}</Texto>
          ) : null}

          {estado === 'cargando' ? (
            <EsqueletoGrupo>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto forma="bloque" ancho="100%" alto={120} />
                <Esqueleto forma="bloque" ancho="100%" alto={120} />
                <Esqueleto forma="bloque" ancho="100%" alto={120} />
              </View>
            </EsqueletoGrupo>
          ) : estado === 'error' || catalogo === null ? (
            <EstadoVacio
              registro="seccion"
              titulo={t('miCuenta.errorCargar')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('agenda.reintentar')}
                  onPress={() => {
                    setEstado('cargando');
                    setIntento((n) => n + 1);
                  }}
                />
              }
            />
          ) : (
            catalogo.categorias
              // La fila sin tipos vivos NO se muestra — derivado del
              // catálogo, no de una lista a mano (orden de mesa S88;
              // hoy solo `resumen`, medido con 0 tipos).
              .filter((cat) => cat.tieneTiposVivos)
              .map((cat) => {
                const canales = catalogo.canales.map((c) => c.codigo);
                const encendida = filaEncendida({
                  canales,
                  persistidas,
                  categoria: cat.codigo,
                  defaultCategoria: cat.defaultHabilitada,
                });
                const porque = cat.apagableExistencia ? null : vozPorque(cat.codigo);
                const ejemplo = vozEjemplo(cat.codigo);
                const seleccionadas = canales.filter((canal) => {
                  const efectiva = preferenciaEfectiva({
                    persistida: persistidas[`${cat.codigo}:${canal}`],
                    canal,
                    defaultCategoria: cat.defaultHabilitada,
                  });
                  // «En el teléfono» con permiso del SO negado no se pinta
                  // encendido: no llega (lámina §5).
                  if (canal === 'push' && permisoPush === 'negado') return false;
                  return efectiva;
                });
                return (
                  <Tarjeta key={cat.codigo}>
                    <View style={{ gap: spacing[3] }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                        <Text style={{ flex: 1, fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                          {vozFila(cat.codigo, cat.descripcion)}
                        </Text>
                        {/* Anatomía (b): la no apagable NO dibuja el toggle
                            que el motor va a rebotar (Ley 23). */}
                        {cat.apagableExistencia ? (
                          <Interruptor
                            encendido={encendida}
                            onCambio={(e) => void alCambiarExistencia(cat.codigo, canales, e)}
                            etiqueta={vozFila(cat.codigo, cat.descripcion)}
                          />
                        ) : null}
                      </View>

                      {/* La línea de ejemplo — la voz del OFICIO. */}
                      {ejemplo !== null ? (
                        <Texto variante="apoyo">{ejemplo}</Texto>
                      ) : null}

                      {/* Chips de canal — grilla: ENVUELVE, no trunca
                          (lámina §6; truncar «WhatsApp» es D-576). */}
                      <SelectorOpcion
                        acento="oficio"
                        etiqueta={t('miCuenta.notifPorDonde')}
                        etiquetaVisible={false}
                        disposicion="grilla"
                        multiple
                        opciones={catalogo.canales.map((c) => ({
                          codigo: c.codigo,
                          etiqueta: vozCanal(c.codigo, c.descripcion),
                          deshabilitada:
                            (c.esPiso && !cat.apagableExistencia) ||
                            (cat.apagableExistencia && !encendida) ||
                            (c.codigo === 'push' && permisoPush === 'negado'),
                        }))}
                        seleccionadas={seleccionadas}
                        onSelect={(codigo) =>
                          alTocarCanal(cat.codigo, codigo as CanalNotificacion, cat.defaultHabilitada)
                        }
                      />

                      {porque !== null ? (
                        <Texto variante="apoyo">{porque}</Texto>
                      ) : null}
                    </View>
                  </Tarjeta>
                );
              })
          )}
        </View>
      </ScrollView>

      {/* El momento del opt-in de WhatsApp (lámina §4): un momento, no un
          toggle. El literal FIRMADO mostrado ES la evidencia que se guarda. */}
      <Hoja
        visible={consentimientoWa !== null}
        onCerrar={() => setConsentimientoWa(null)}
        titulo={t('miCuenta.waConsentTitulo')}
        conCerrar
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            {t('miCuenta.waConsentTexto')}
          </Text>
          <Boton
            variante="primario"
            etiqueta={t('miCuenta.waConsentAceptar')}
            bloque
            cargando={guardandoWa}
            onPress={() => void confirmarWhatsapp()}
          />
          <Boton variante="ghost" etiqueta={t('miCuenta.waConsentCancelar')} bloque onPress={() => setConsentimientoWa(null)} />
        </View>
      </Hoja>
    </View>
  );
}
