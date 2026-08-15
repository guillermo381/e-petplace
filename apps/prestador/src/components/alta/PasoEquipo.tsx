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
 * ── ✅ LOS DOS CAMINOS, CABLEADOS (A entregó `MiembroEquipo.userId`) ────
 * «De tu equipo» hereda **la persona** (`user_id` + nombre) · «nuevo» es
 * alta completa. **La anti-duplicación va por `user_id`, jamás por nombre**
 * — con el nombre, dos homónimos o una persona re-tipeada vuelven a ser
 * dos altas, que es justo lo que §8.6bis ⑤ existe para impedir.
 *
 * ⚠️ **Lo que «de tu equipo» NO hereda, medido:** el DOCUMENTO.
 * `MiembroEquipo` no lo trae y `registrarRepartidor` lo exige, así que el
 * camino corto prellena identidad y **pide el documento igual**. Fingir
 * que lo hereda sería inventarlo.
 *
 * ⚠️ **El invitado sin aceptar NO desaparece callado:** `userId === null`
 * = todavía no tiene cuenta, así que no se puede elegir — y la pantalla
 * lo DICE. Escondido en silencio, el titular lo ve en la ventana de
 * equipo de al lado y lo busca acá sin entender por qué no está.
 */

import { useCallback, useEffect, useState } from 'react';
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
  obtenerEquipoNegocio,
  obtenerPaisesDelMundo,
  puedeOfrecerRolRecepcion,
  registrarRepartidor,
  type MiembroEquipo,
  type PaisDelMundo,
  type Repartidor,
} from '@epetplace/api';

import { ControlTelefono } from '@/components/perfil-piezas';
import { PAIS_DEFAULT, bandera, componerE164, paisDe } from '@/lib/paises';
import { rechazoDeDocumento, rechazoDeNombre } from '@/lib/validacion-alta';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      repartidores: Repartidor[];
      /** Gente del equipo ELEGIBLE: con cuenta (`userId`) y no cargada ya
       *  como repartidor. La anti-duplicación es por `user_id` — con el
       *  nombre, dos homónimos vuelven a ser dos altas (§8.6bis ⑤). */
      elegibles: MiembroEquipo[];
      /** Invitados sin aceptar: NO se pueden elegir (no existen como
       *  persona del sistema todavía) y la pantalla lo DICE — esconderlos
       *  callado deja al titular buscando a alguien que ve en la ventana
       *  de equipo de al lado. */
      sinCuenta: number;
      /** `null` = NO SE PUDO LEER. No es `false`: un rol no se esconde
       *  por un error de red (ver cabecera). */
      ofreceRecepcion: boolean | null;
    };

export interface PasoEquipoProps {
  cuentaComercialId: string;
  prestadorId: string | null;
  alSumar: () => void;
  /** ⭐ S98-C · el paso registra su confirmación y el pie la ejecuta.
   *
   *  **Acá el botón de adentro NO muere, y se declara por qué:** «sumar a
   *  tu equipo» no es el guardado del PASO — es AGREGAR UNA PERSONA a una
   *  lista, y se toca N veces. Matarlo dejaría el paso con capacidad para
   *  un solo repartidor. Lo que sí cura la firma es el modo de falla real:
   *  **Continuar ya no descarta en silencio una persona a medio tipear**
   *  — la valida y la guarda antes de avanzar. */
  registrarConfirmacion: (fn: (() => Promise<boolean>) | null) => void;
}

/** LA VOZ de cada rechazo — la regla es compartida, las frases son de
 *  este campo (Ley 3). Claves LITERALES, jamás concatenadas. */
const VOZ_NOMBRE = {
  vacio: 'alta.paso4.errorNombreVacio',
  corto: 'alta.paso4.errorNombreCorto',
  sinLetras: 'alta.paso4.errorNombreSinLetras',
} as const;
const VOZ_DOCUMENTO = {
  vacio: 'alta.paso4.errorDocumentoVacio',
  corto: 'alta.paso4.errorDocumentoCorto',
} as const;

export function PasoEquipo({
  cuentaComercialId,
  prestadorId,
  alSumar,
  registrarConfirmacion,
}: PasoEquipoProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [alta, setAlta] = useState(false);
  /** Cuando viene de «de tu equipo»: la persona ya elegida (su identidad
   *  se hereda; el documento se pide igual). `null` = alta nueva. */
  const [elegido, setElegido] = useState<MiembroEquipo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  /** ⭐ S98-C · la voz del rechazo vive EN EL CAMPO (firma del 14-ago).
   *  `Campo` ya tiene el slot de altura reservada y su `liveRegion`. */
  /* 🔴 EL TELÉFONO SE COMPONE, NO SE MANDA CRUDO (S98-C). Este paso llama al
     MISMO `registrarRepartidor` que la configuración, y `repartidores` exige
     E.164 con `+` (`repartidores_telefono_check`) mientras la RPC NO
     normaliza: mandando lo tipeado, un vendedor que escribe `0988888888`
     —como se escribe un celular acá— recibía el texto de un CHECK de
     Postgres. **El defecto tenía DOS puertas y esta era la segunda**: la curé
     en configuración y esta apareció barriendo, no leyendo. */
  const [paises, setPaises] = useState<PaisDelMundo[]>([]);
  const [paisIso, setPaisIso] = useState(PAIS_DEFAULT);
  const [eligiendoPais, setEligiendoPais] = useState(false);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorDocumento, setErrorDocumento] = useState<string | null>(null);

  /* La misma validación que la configuración, y por la misma razón medida:
     componer el indicativo NO alcanza. `+593` + `0988777666` da
     `+5930988777666` — trece dígitos que **el CHECK ACEPTA**, o sea una fila
     con un número que no existe: peor que el rebote, porque falla callado.
     Y el `0` de tránsito NO se saca a mano (Italia lo CONSERVA en su E.164):
     se valida contra el `formato` que declara el catálogo. */
  function estadoTel(): { ok: boolean; voz: string } | null {
    const crudo = telefono.replace(/[\s-]/g, '');
    if (crudo.length === 0) return null; // opcional
    const pais = paisDe(paises, paisIso);
    if (pais?.prefijo == null) return null;
    const e164 = componerE164(paises, telefono, paisIso);
    if (pais.formato === null) {
      return { ok: true, voz: t('perfilNegocio.telSinFormato', { e164, pais: pais.nombre }) };
    }
    if (new RegExp(pais.formato).test(e164)) {
      return { ok: true, voz: t('perfilNegocio.telSeGuarda', { e164 }) };
    }
    const rango = /\\d\{(\d+)(?:,(\d+))?\}/.exec(pais.formato);
    const min = rango?.[1];
    const max = rango?.[2];
    const cuantos =
      min === undefined
        ? t('perfilNegocio.telDigitosSinDato')
        : max === undefined
          ? t('perfilNegocio.telDigitos', { min })
          : t('perfilNegocio.telDigitosRango', { min, max });
    return {
      ok: false,
      voz: t('perfilNegocio.telLargoMal', { pais: pais.nombre, cuantos, pre: pais.prefijo, van: crudo.length }),
    };
  }

  const cargar = useCallback(async () => {
    // ⚠️ POSICIONAL: lo nuevo va AL FINAL, nombre incluido.
    const [reps, recepcion, equipo, rPaises] = await Promise.all([
      listarRepartidores(cuentaComercialId),
      // El vendedor puro no tiene prestador: no hay a quién preguntarle,
      // y la respuesta correcta es `false` POR DATO (cero servicios), no
      // por fallo. Se distingue de `null`, que es "no pudimos leer".
      prestadorId === null
        ? Promise.resolve({ ok: true as const, data: false })
        : puedeOfrecerRolRecepcion(prestadorId),
      obtenerEquipoNegocio(cuentaComercialId),
      // El catálogo de indicativos, en la MISMA ola: cero espera nueva.
      obtenerPaisesDelMundo(),
    ]);
    if (rPaises.ok) setPaises(rPaises.data);
    if (!reps.ok) {
      setPantalla({ estado: 'error' });
      return;
    }
    // Ya cargados como repartidor — por `user_id`, jamás por nombre.
    const yaRepartidores = new Set(
      reps.data.map((r) => r.user_id).filter((u): u is string => u !== null),
    );
    const miembros = equipo.ok ? equipo.data.miembros.filter((m) => m.activo) : [];
    setPantalla({
      estado: 'listo',
      repartidores: reps.data,
      elegibles: miembros.filter((m) => m.userId !== null && !yaRepartidores.has(m.userId)),
      sinCuenta: miembros.filter((m) => m.userId === null).length,
      ofreceRecepcion: recepcion.ok ? recepcion.data : null,
    });
  }, [cuentaComercialId, prestadorId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  /** ⭐ S98-C · devuelve SI SE PUDO — el pie del wizard lo necesita para
   *  decidir si avanza. Antes no devolvía nada y Continuar avanzaba igual,
   *  descartando en silencio a la persona a medio tipear. */
  async function guardar(): Promise<boolean> {
    if (guardando) return false;
    const n = nombre.trim();
    const d = documento.trim();

    // LA COHERENCIA, con la MISMA regla del paso ① (`lib/validacion-alta`)
    // y la voz de ESTE campo. El nombre solo se valida en el alta nueva:
    // cuando la persona viene «de tu equipo» su nombre se hereda y ni
    // siquiera se dibuja el campo.
    const malN = elegido === null ? rechazoDeNombre(n) : null;
    const malD = rechazoDeDocumento(d);
    setErrorNombre(malN === null ? null : t(VOZ_NOMBRE[malN]));
    setErrorDocumento(malD === null ? null : t(VOZ_DOCUMENTO[malD]));
    // Se marcan LOS DOS antes de salir: validar de a uno obliga a
    // descubrir los errores en fila, uno por toque.
    if (malN !== null || malD !== null) return false;
    // Un teléfono que no cumple el formato de su país NO habilita: la fuente
    // lo aceptaría MAL (trece dígitos pasan el CHECK), así que el guard vive
    // de este lado.
    if (estadoTel()?.ok === false) return false;

    setGuardando(true);
    const res = await registrarRepartidor({
      cuenta_comercial_id: cuentaComercialId,
      nombre: n,
      documento: d,
      telefono: componerE164(paises, telefono, paisIso) || undefined,
      // LA LLAVE de la anti-duplicación. Solo viaja si la persona vino
      // del equipo: en el alta nueva todavía no hay a quién atarla.
      user_id: elegido?.userId ?? undefined,
    });
    setGuardando(false);

    if (!res.ok) {
      mostrar({ texto: res.mensaje, variante: 'error' });
      return false;
    }
    setAlta(false);
    setElegido(null);
    setNombre('');
    setDocumento('');
    setTelefono('');
    mostrar({ texto: t('alta.paso4.guardado'), variante: 'exito' });
    void cargar();
    alSumar();
    return true;
  }

  /* LA CONFIRMACIÓN DEL PASO — y su regla, que es la parte pensada:
     **una persona a medio tipear se guarda; un formulario intacto no
     frena a nadie.** Sin la segunda mitad, abrir el alta por curiosidad y
     cerrarla dejaría el wizard trabado pidiendo campos que nadie quiso
     llenar (Ley 23 al revés: la puerta rechazando lo que ella misma
     ofreció como opcional). */
  const hayAlgoTipeado =
    nombre.trim().length > 0 || documento.trim().length > 0 || telefono.trim().length > 0;
  const confirmar = useCallback(async (): Promise<boolean> => {
    if (!alta || !hayAlgoTipeado) return true;
    return guardar();
    // `guardar` se re-crea por render y depende de todo el formulario: se
    // listan sus insumos reales en vez de la función.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alta, hayAlgoTipeado, nombre, documento, telefono, elegido, guardando]);

  useEffect(() => {
    registrarConfirmacion(confirmar);
    return () => registrarConfirmacion(null);
  }, [confirmar, registrarConfirmacion]);

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
          if (guardando) return;
          setAlta(false);
          setElegido(null);
          setNombre('');
        }}
        titulo={t('alta.paso4.sumarCta')}
        altura="media"
      >
        <HojaScroll>
          <EvitaTeclado>
            <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
              {/* ── CAMINO ①: DE TU EQUIPO — hereda la persona ────────── */}
              {elegido === null && pantalla.elegibles.length > 0 ? (
                <View style={{ gap: spacing[3] }}>
                  <Texto variante="seccion">{t('alta.paso4.deTuEquipo')}</Texto>
                  <Texto variante="apoyo">{t('alta.paso4.deTuEquipoVoz')}</Texto>
                  <Tarjeta elevacion="reposo" relleno="ninguno">
                    <View>
                      {pantalla.elegibles.map((m, i) => (
                        <View key={m.empleadoId}>
                          {i > 0 ? <Separador /> : null}
                          <Celda
                            titulo={m.nombre}
                            interactiva
                            accessibilityRole="button"
                            onPress={() => {
                              setElegido(m);
                              setNombre(m.nombre);
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  </Tarjeta>
                </View>
              ) : null}

              {/* El invitado que no aceptó NO desaparece callado. */}
              {elegido === null && pantalla.sinCuenta > 0 ? (
                <Texto variante="apoyo">{t('alta.paso4.sinCuenta')}</Texto>
              ) : null}

              {/* ── CAMINO ②: ALGUIEN NUEVO — alta completa ───────────── */}
              <Texto variante="seccion">
                {elegido === null ? t('alta.paso4.nuevo') : elegido.nombre}
              </Texto>
              <Texto variante="apoyo">
                {elegido === null ? t('alta.paso4.nuevoVoz') : t('alta.paso4.faltaDocumento')}
              </Texto>
              {/* El nombre heredado va FIJO: cambiarlo acá desataría la
                  persona del repartidor sin decirlo. */}
              {elegido === null ? (
                <Campo
                  label={t('alta.paso4.nombre')}
                  value={nombre}
                  onChangeText={(v) => {
                    setNombre(v);
                    if (errorNombre !== null) setErrorNombre(null);
                  }}
                  error={errorNombre ?? undefined}
                  deshabilitado={guardando}
                />
              ) : null}
              <Campo
                label={t('alta.paso4.documento')}
                value={documento}
                onChangeText={(v) => {
                  setDocumento(v);
                  if (errorDocumento !== null) setErrorDocumento(null);
                }}
                error={errorDocumento ?? undefined}
                keyboardType="number-pad"
                deshabilitado={guardando}
              />
              <ControlTelefono
                label={t('alta.paso4.telefono')}
                placeholder={t('ventas.config.repartidorTelefonoPlaceholder')}
                valor={telefono}
                onCambio={setTelefono}
                bandera={bandera(paisIso)}
                prefijo={paisDe(paises, paisIso)?.prefijo ?? ''}
                onElegirPais={() => setEligiendoPais(true)}
                ayuda={estadoTel()?.voz ?? t('ventas.config.repartidorTelefonoAyuda')}
                error={estadoTel()?.ok === false ? estadoTel()?.voz : undefined}
              />
              <Boton
                variante="primario"
                bloque
                cargando={guardando}
                /* ⭐ S98-C: el botón YA NO SE DESHABILITA por campos vacíos.
                   Un botón apagado no dice QUÉ falta — la persona se queda
                   mirando un control muerto (el defecto que S79-B ya curó
                   en el Confirmar del vet). Ahora se toca siempre y la voz
                   aparece en el campo que la causó. */
                etiqueta={t('alta.paso4.guardar')}
                onPress={() => void guardar()}
              />
            </View>
          </EvitaTeclado>
        </HojaScroll>
      </Hoja>
    <Hoja
        visible={eligiendoPais}
        onCerrar={() => setEligiendoPais(false)}
        titulo={t('ventas.config.repartidorPaisTitulo')}
      >
        <HojaScroll>
          {paises.map((pais, i) => (
            <View key={pais.codigo}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={`${bandera(pais.codigo)}  ${pais.nombre}`}
                subtitulo={
                  pais.formato === null ? t('ventas.config.repartidorPaisSinFormato') : undefined
                }
                metadataMono={pais.prefijo ?? undefined}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  setPaisIso(pais.codigo);
                  setEligiendoPais(false);
                }}
                fin={
                  pais.codigo === paisIso ? (
                    <Texto variante="dato">{t('ventas.config.repartidorPaisElegido')}</Texto>
                  ) : undefined
                }
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
