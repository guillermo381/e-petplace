/**
 * Cuenta · Preferencias — LOTE 4 (S88-D) sobre la lámina FIRMADA
 * `docs/laminas/LAMINA_PREFERENCIAS_NOTIFICACIONES.md` (5-ago-2026) y el
 * contrato S87 (persona, categoría, canal).
 *
 * LA LEY QUE GOBIERNA (firma founder): «Elige por dónde le llegan, no si
 * le llegan.»
 *
 * - La pantalla LEE las 7 filas y los 4 canales del catálogo — hardcodear
 *   la lista la desincroniza del motor (lámina §6).
 * - La verdad de celda es el ESPEJO de `preferencia_efectiva`
 *   (lib/preferencias-estado.ts) — la ausencia NO es habilitada; murió el
 *   keyeo por tipo que pintaba todo ON.
 * - Fila NO apagable: SIN interruptor de existencia (Ley 23 — el motor
 *   rebota ese toggle) + la voz del porqué (las tres firmadas).
 * - «Novedades y ofertas» nace APAGADA: no lo defiende esta pantalla, lo
 *   dice el catálogo (`comercial.default_habilitada=false`) vía el espejo.
 * - WhatsApp: el primer toque NO enciende — abre el consentimiento, y el
 *   texto exacto mostrado viaja como EVIDENCIA (§6, requisito de Meta).
 * - Permiso del SO negado: se dice, no se finge (lámina §5; require
 *   protegido — el APK del campo no trae el nativo).
 * - El escalado de fuente del sistema NO se apaga (lámina §6): ningún
 *   allowFontScaling={false} en esta pantalla.
 * - Murió la promesa «Cuando las notificaciones lleguen al teléfono…» —
 *   el motor existe y ya habló una vez (lámina §7).
 *
 * Escalera: no muestra datos del expediente.
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
  SelectorOpcion,
  Tarjeta,
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

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [catalogo, setCatalogo] = useState<CatalogoNotificaciones | null>(null);
  // Solo lo PERSISTIDO, keyed "categoria:canal" — el default lo pone el
  // espejo, jamás esta pantalla (el contrato S87 lo dice en su JSDoc).
  const [persistidas, setPersistidas] = useState<Record<string, boolean>>({});
  const [cambiando, setCambiando] = useState(false);
  const [intento, setIntento] = useState(0);
  const [permisoPush, setPermisoPush] = useState<PermisoPush>('no_medible');
  // El momento del opt-in (lámina §4): la categoría cuyo consentimiento
  // de WhatsApp está abierto, o null.
  const [consentimientoWa, setConsentimientoWa] = useState<string | null>(null);
  const [guardandoWa, setGuardandoWa] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const [cat, prefs, permiso] = await Promise.all([
        // S88/A: la audiencia la DECLARA la pantalla — el motor no la adivina
        // (la misma persona puede ser dueño de mascota Y prestador).
        obtenerCatalogoNotificaciones('cliente'),
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
      mostrar({ texto: t('cuenta.idiomaError'), variante: 'error' });
    }
    const r = await guardarIdiomaPreferido(codigo as IdiomaSoportado);
    if (!r.ok) mostrar({ texto: t('cuenta.idiomaError'), variante: 'error' });
    setCambiando(false);
  }

  // ── Voces por código de catálogo (Ley 3: jamás un código crudo). El
  // switch mantiene las keys LITERALES (tipadas); un código que la
  // pantalla no conozca cae a la descripción del catálogo — se muestra
  // en la voz del server antes que esconderse o romper.
  function vozFila(codigo: string, fallback: string): string {
    switch (codigo) {
      case 'operacion': return t('cuenta.notifFilaOperacion');
      case 'salud_seguridad': return t('cuenta.notifFilaSaludSeguridad');
      case 'seguridad_cuenta': return t('cuenta.notifFilaSeguridadCuenta');
      case 'saldo_pagado': return t('cuenta.notifFilaSaldoPagado');
      case 'relacional': return t('cuenta.notifFilaRelacional');
      case 'resumen': return t('cuenta.notifFilaResumen');
      case 'comercial': return t('cuenta.notifFilaComercial');
      default: return fallback;
    }
  }
  // El EJEMPLO por fila (enmienda de lámina firmada, gate S88): qué
  // avisaría esta categoría, con los tipos que DE VERDAD la habitan.
  // Sin key para un código nuevo → null y la fila va sin ejemplo (el
  // ejemplo se escribe cuando la fila exista, no se inventa).
  function vozEjemplo(codigo: string): string | null {
    switch (codigo) {
      case 'operacion': return t('cuenta.notifEjOperacion');
      case 'salud_seguridad': return t('cuenta.notifEjSaludSeguridad');
      case 'seguridad_cuenta': return t('cuenta.notifEjSeguridadCuenta');
      case 'saldo_pagado': return t('cuenta.notifEjSaldoPagado');
      case 'relacional': return t('cuenta.notifEjRelacional');
      case 'comercial': return t('cuenta.notifEjComercial');
      default: return null;
    }
  }
  // Las TRES voces del porqué — firmadas en la lámina §3.
  function vozPorque(codigo: string): string | null {
    switch (codigo) {
      case 'salud_seguridad': return t('cuenta.notifPorqueSaludSeguridad');
      case 'seguridad_cuenta': return t('cuenta.notifPorqueSeguridadCuenta');
      case 'saldo_pagado': return t('cuenta.notifPorqueSaldoPagado');
      default: return null;
    }
  }
  function vozCanal(codigo: CanalNotificacion, fallback: string): string {
    switch (codigo) {
      case 'in_app': return t('cuenta.canalInApp');
      case 'push': return t('cuenta.canalPush');
      case 'email': return t('cuenta.canalEmail');
      case 'whatsapp': return t('cuenta.canalWhatsapp');
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
      // Encender la existencia enciende EL PISO y nada más: garantiza el
      // gate 4 del motor sin prometer canales que nadie eligió.
      const piso = catalogo?.canales.find((c) => c.esPiso)?.codigo ?? 'in_app';
      await guardarCelda(categoria, piso, true);
      return;
    }
    // Apagar la existencia apaga la fila entera (lámina §2a): los cuatro
    // canales a false — optimista, con vuelta atrás si el server rebota.
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
    // El texto EXACTO que se le mostró viaja como evidencia (§6 — Meta):
    // el mismo literal que la Hoja renderiza, resuelto en su idioma.
    const ok = await guardarCelda(consentimientoWa, 'whatsapp', true, {
      textoMostrado: t('cuenta.waConsentTexto'),
      metodo: 'hoja_preferencias_cliente',
      en: new Date().toISOString(),
    });
    setGuardandoWa(false);
    if (ok) setConsentimientoWa(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.preferencias')} atras onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[5] }}>
        <Tarjeta>
          <SelectorOpcion
            acento="control"
            etiqueta={t('cuenta.idioma')}
            opciones={[
              { codigo: 'es', etiqueta: t('cuenta.idiomaEs') },
              { codigo: 'en', etiqueta: t('cuenta.idiomaEn') },
            ]}
            seleccionada={idioma}
            onSelect={(codigo) => void alElegirIdioma(codigo)}
          />
        </Tarjeta>

        <View style={{ gap: spacing[3] }}>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
          >
            {t('cuenta.notificaciones')}
          </Text>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {t('cuenta.notifLey')}
          </Text>

          {/* Lámina §5: el permiso del SO negado SE DICE — los chips de
              Push no van a fingir. `no_medible` no afirma nada (L-197). */}
          {permisoPush === 'negado' ? (
            <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
              {t('cuenta.notifPermisoNegado')}
            </Text>
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
              titulo={t('cuenta.errorCargar')}
              accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => { setEstado('cargando'); setIntento((n) => n + 1); }} />}
            />
          ) : (
            catalogo.categorias
              // Enmienda de lámina (firma founder, S88): una categoría
              // con CERO tipos vivos NO se dibuja — un interruptor para
              // algo que nunca va a llegar es un toggle que no controla
              // nada (Ley 23). Derivado del catálogo: el día que nazca
              // el primer tipo (hoy, el primer digest de «Resúmenes»),
              // la fila aparece sola.
              // PARA MI AUDIENCIA, no vivos a secas (el freno de C, S88):
              // esta pantalla declaró 'cliente' arriba — filtrar por el
              // booleano ciego dejaría ese parámetro decorativo. Medido
              // al curar: hoy los dos coinciden para cliente (0 filas de
              // diferencia); el defecto era latente, no visible.
              .filter((cat) => cat.tieneTiposVivosParaMi)
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
                // Push con permiso del SO negado no se pinta encendido:
                // no llega, y un chip activo sería la pantalla mintiendo
                // sobre algo que puede medir (lámina §5).
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

                    {/* El ejemplo BAJO EL TÍTULO (forma autorizada por el
                        founder): en las no apagables el ejemplo arriba y
                        el porqué abajo, cerrando la fila. */}
                    {ejemplo !== null ? (
                      <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
                        {ejemplo}
                      </Text>
                    ) : null}

                    {/* Chips de canal — grilla: ENVUELVE, no trunca
                        (lámina §6; truncar «WhatsApp» es D-576). */}
                    <SelectorOpcion
                      acento="control"
                      etiqueta={t('cuenta.notifPorDonde')}
                      etiquetaVisible={false}
                      disposicion="grilla"
                      multiple
                      opciones={catalogo.canales.map((c) => ({
                        codigo: c.codigo,
                        etiqueta: vozCanal(c.codigo, c.descripcion),
                        // El piso de una no apagable no se toca; la fila
                        // apagable apagada deja los chips en reposo.
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
                      <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
                        {porque}
                      </Text>
                    ) : null}
                  </View>
                </Tarjeta>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* El momento del opt-in de WhatsApp (lámina §4): un momento, no un
          toggle. El literal mostrado ES la evidencia que se guarda. */}
      <Hoja
        visible={consentimientoWa !== null}
        onCerrar={() => setConsentimientoWa(null)}
        titulo={t('cuenta.waConsentTitulo')}
        conCerrar
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            {t('cuenta.waConsentTexto')}
          </Text>
          <Boton
            variante="primario"
            etiqueta={t('cuenta.waConsentAceptar')}
            bloque
            cargando={guardandoWa}
            onPress={() => void confirmarWhatsapp()}
          />
          <Boton variante="ghost" etiqueta={t('cuenta.waConsentCancelar')} bloque onPress={() => setConsentimientoWa(null)} />
        </View>
      </Hoja>
    </View>
  );
}
