/**
 * PASO ④ DEL WIZARD — TU EQUIPO (S97-C · §4.1).
 *
 * ── TESIS ──────────────────────────────────────────────────────────────
 * «Quién trabaja con vos. Hoy, quien reparte.»
 *
 * ── FIRMA ──────────────────────────────────────────────────────────────
 * **Los dos caminos declarados de entrada** (firma de mesa): «de tu
 * equipo» hereda identidad · «nuevo» es alta completa. La anti-duplicación
 * es por `user_id` — la misma persona no se carga dos veces.
 *
 * ── CHANEL ─────────────────────────────────────────────────────────────
 * Se quitaron los otros roles: §8.6bis ⑤ firma que **el único rol de
 * empleado que se acepta hoy es REPARTIDOR**. Ofrecer los demás acá sería
 * duplicar la ventana de equipo que ya existe (`negocio/equipo`).
 *
 * ── 🔴 LA REGLA CONDICIONAL DE RECEPCIÓN (§2.3), CON SU PERMISIVIDAD ───
 * `puedeOfrecerRolRecepcion` decide si el rol se ofrece. **Se consume con
 * D-792 declarada:** `atiende_local` nació `DEFAULT true` y barrió los
 * cuatro oficios, así que hoy **discrimina el borde que importa** (un
 * vendedor puro, sin servicios, da `false`) y **es permisiva en el centro**
 * hasta que alguien toque el toggle del paso ②.
 * **Y el fallo NO se degrada a `false`** (orden de A, y es la correcta):
 * esconder un rol por un error de red sería decidir permisos con
 * información que no tenemos. Si la lectura falla, no afirmamos nada.
 *
 * ── ⏳ EL CAMINO «DE TU EQUIPO» NO SE MONTA TODAVÍA, y se declara ──────
 * Medido: `MiembroEquipo` (el lector vivo) expone `empleadoId`, `nombre`,
 * `activo`, `roles` y `oficios` — **no expone `user_id`**. Y la
 * anti-duplicación firmada es JUSTAMENTE por `user_id`
 * (`registrarRepartidor` lo acepta). Montar el camino sin él crearía un
 * repartidor desligado de la persona: **exactamente la doble carga que la
 * firma existe para impedir.** Pedido a A cursado; el botón entra cuando
 * el lector traiga el dato — los cuartos sin esquema no se montan.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Entrada,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  Hoja,
  HojaScroll,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import {
  listarRepartidores,
  puedeOfrecerRolRecepcion,
  registrarRepartidor,
  type Repartidor,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      repartidores: Repartidor[];
      /** `null` = NO SE PUDO LEER. No es `false`: un rol no se esconde
       *  por un error de red (ver cabecera). */
      ofreceRecepcion: boolean | null;
    };

export interface PasoEquipoProps {
  cuentaComercialId: string;
  prestadorId: string | null;
  alSumar: () => void;
}

export function PasoEquipo({ cuentaComercialId, prestadorId, alSumar }: PasoEquipoProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [alta, setAlta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');

  const cargar = useCallback(async () => {
    const [reps, recepcion] = await Promise.all([
      listarRepartidores(cuentaComercialId),
      // El vendedor puro no tiene prestador: no hay a quién preguntarle,
      // y la respuesta correcta es `false` POR DATO (cero servicios), no
      // por fallo. Se distingue de `null`, que es "no pudimos leer".
      prestadorId === null
        ? Promise.resolve({ ok: true as const, data: false })
        : puedeOfrecerRolRecepcion(prestadorId),
    ]);
    if (!reps.ok) {
      setPantalla({ estado: 'error' });
      return;
    }
    setPantalla({
      estado: 'listo',
      repartidores: reps.data,
      ofreceRecepcion: recepcion.ok ? recepcion.data : null,
    });
  }, [cuentaComercialId, prestadorId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function guardar() {
    if (guardando) return;
    const n = nombre.trim();
    const d = documento.trim();
    if (n.length === 0 || d.length === 0) return;

    setGuardando(true);
    const res = await registrarRepartidor({
      cuenta_comercial_id: cuentaComercialId,
      nombre: n,
      documento: d,
      telefono: telefono.trim() === '' ? undefined : telefono.trim(),
    });
    setGuardando(false);

    if (!res.ok) {
      mostrar({ texto: res.mensaje, variante: 'error' });
      return;
    }
    setAlta(false);
    setNombre('');
    setDocumento('');
    setTelefono('');
    mostrar({ texto: t('alta.paso4.guardado'), variante: 'exito' });
    void cargar();
    alSumar();
  }

  if (pantalla.estado === 'cargando') {
    return (
      <EsqueletoGrupo>
        <View style={{ gap: spacing[4] }}>
          <Esqueleto ancho="50%" alto={28} />
          <Esqueleto alto={72} />
        </View>
      </EsqueletoGrupo>
    );
  }

  if (pantalla.estado === 'error') {
    return (
      <EstadoVacio
        registro="seccion"
        titulo={t('alta.errorTitulo')}
        descripcion={t('alta.errorVoz')}
        accion={
          <Boton variante="compacto" etiqueta={t('alta.reintentar')} onPress={() => void cargar()} />
        }
      />
    );
  }

  const sinNadie = pantalla.repartidores.length === 0;

  return (
    <View style={{ gap: spacing[8] }}>
      <Entrada orden={0}>
        <View style={{ gap: spacing[2] }}>
          <Texto variante="titulo">{t('alta.paso4.titulo')}</Texto>
          <Texto variante="apoyo">{t('alta.paso4.bajada')}</Texto>
        </View>
      </Entrada>

      <View style={{ gap: spacing[3] }}>
        <Entrada orden={1}>
          <Texto variante="seccion">{t('alta.paso4.repartidor')}</Texto>
        </Entrada>

        {sinNadie ? (
          <EstadoVacio
            registro="seccion"
            titulo={t('alta.paso4.vacioTitulo')}
            descripcion={t('alta.paso4.vacioVoz')}
            accion={
              <Boton
                variante="compacto"
                etiqueta={t('alta.paso4.sumarCta')}
                onPress={() => setAlta(true)}
              />
            }
          />
        ) : (
          <Entrada orden={2}>
            <View style={{ gap: spacing[4] }}>
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <View>
                  {pantalla.repartidores.map((r, i) => (
                    <View key={r.repartidor_id}>
                      {i > 0 ? <Separador /> : null}
                      <Celda titulo={r.nombre} metadataMono={r.documento} />
                    </View>
                  ))}
                </View>
              </Tarjeta>
              <Boton
                variante="compacto"
                bloque
                etiqueta={t('alta.paso4.sumarCta')}
                onPress={() => setAlta(true)}
              />
            </View>
          </Entrada>
        )}

        {/* §2.3: si el negocio no atiende en local, el rol de recepción no
            se ofrece — y la pantalla DICE por qué en vez de callar.
            `null` (no se pudo leer) no dice nada: no afirmamos un permiso
            con información que no tenemos. */}
        {pantalla.ofreceRecepcion === false ? (
          <Entrada orden={3}>
            <Texto variante="apoyo">{t('alta.paso4.recepcionNoAplica')}</Texto>
          </Entrada>
        ) : null}
      </View>

      <Hoja
        visible={alta}
        onCerrar={() => {
          if (!guardando) setAlta(false);
        }}
        titulo={t('alta.paso4.sumarCta')}
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              <Texto variante="apoyo">{t('alta.paso4.nuevoVoz')}</Texto>
              <Campo
                label={t('alta.paso4.nombre')}
                value={nombre}
                onChangeText={setNombre}
                deshabilitado={guardando}
              />
              <Campo
                label={t('alta.paso4.documento')}
                value={documento}
                onChangeText={setDocumento}
                keyboardType="number-pad"
                deshabilitado={guardando}
              />
              <Campo
                label={t('alta.paso4.telefono')}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
                deshabilitado={guardando}
              />
              <Boton
                variante="primario"
                bloque
                cargando={guardando}
                deshabilitado={nombre.trim().length === 0 || documento.trim().length === 0}
                etiqueta={t('alta.paso4.guardar')}
                onPress={() => void guardar()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>
    </View>
  );
}
