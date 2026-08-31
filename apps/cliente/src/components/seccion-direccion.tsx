/**
 * «A DÓNDE» — **UNA PIEZA, LAS DOS PUERTAS** (S107-C, 30-ago).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 ESTO NO ES CONSTRUCCIÓN NUEVA: ES LA DE DESPENSA, EXTRAÍDA.
 * ═══════════════════════════════════════════════════════════════════════════
 * Orden del founder: *«DESPENSA YA LO RESOLVIÓ y se le dedicaron varias
 * sesiones a pulirlo. Censá cómo maneja la dirección de entrega y reusá eso
 * mismo.»*
 *
 * Censado: sus **componentes** ya eran compartidos (`DireccionHogarForm`,
 * `CeldaNavegacion`, `Hoja`); lo que vivía duplicable era **la orquestación**
 * —el estado, las tres hojas, cuándo abre cuál—. *Copiar eso habría sido la
 * segunda copia que después diverge: dos copias no divergen el día que se
 * escriben, divergen el día que alguien afina una.*
 *
 * ⇒ Se extrae con **el molde de `SeccionMedioDePago`**, que es el precedente
 * de la casa para exactamente esto: un hook con el estado y una sección que
 * lo pinta, y las dos pantallas montan la misma.
 *
 * ── LO ÚNICO QUE CAMBIA ES LA VOZ, y por eso entra por prop ──────────────
 * En despensa **entregan un pedido**; en guardería **pasan a buscar a la
 * mascota**. La pregunta es la misma —a qué dirección va alguien— así que la
 * mecánica es una y el texto lo trae quien la monta.
 *
 * ── EL CONTRATO CON EL MOTOR (A, `s107-contrato-direccion-de-recogida`) ──
 * 🔴 **Se manda un ID, JAMÁS un snapshot armado por la pantalla.** El server
 * valida contra las direcciones de quien reserva y arma el snapshot él mismo.
 * *Dejar que el cliente escriba a dónde va el animal sería la peor forma de
 * confiar en el cliente.* Un id ajeno rebota `direccion_no_valida`.
 *
 * ⚠️ **`null` es VÁLIDO y significa «la principal».** No se inventa un
 * default: si la familia no eligió, el server resuelve.
 *
 * ── ⚠️ UN LÍMITE DEL MODELO, FIRMADO, QUE NO SE TRATA COMO DEFECTO ───────
 * **Las direcciones son por USUARIO, no por hogar** (`direcciones_guardadas`
 * es por `user_id`, y su RLS también). *Si otro miembro de la familia guardó
 * una dirección, este usuario no la ve: agrega la suya y sigue.* Firma del
 * founder — no se ensancha acá.
 */

import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Boton, CeldaNavegacion, Hoja, Tarjeta, Texto, spacing } from '@epetplace/ui';
import {
  listarMisDirecciones,
  obtenerDireccionHogar,
  type DireccionGuardada,
  type DireccionHogar,
} from '@epetplace/api';

import { DireccionHogarForm } from '@/components/direccion-hogar-form';
import { useTraduccion } from '@/i18n';

export type DireccionElegida = ReturnType<typeof useDireccionEntrega>;

/**
 * `activo` = sólo lee donde hace falta. *Una pantalla que no pregunta a dónde
 * no tiene por qué pagar dos peticiones.*
 */
export function useDireccionEntrega(activo: boolean) {
  const [direccion, setDireccion] = useState<DireccionHogar | DireccionGuardada | null | 'cargando'>('cargando');
  const [direcciones, setDirecciones] = useState<DireccionGuardada[]>([]);
  /** Editar la actual · elegir entre las guardadas · crear una con alias. */
  const [hojaEditar, setHojaEditar] = useState(false);
  const [hojaLibreta, setHojaLibreta] = useState(false);
  const [hojaAlias, setHojaAlias] = useState(false);

  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    void (async () => {
      /* Misma ola: el peaje es de la PETICIÓN, no del volumen (L-223). */
      const [dir, libreta] = await Promise.all([obtenerDireccionHogar(), listarMisDirecciones()]);
      if (!vigente) return;
      if (libreta.ok) setDirecciones(libreta.data);
      setDireccion(dir.ok ? dir.data : null);
    })();
    return () => { vigente = false; };
  }, [activo]);

  const releerLibreta = useCallback(() => {
    /* La libreta se re-lee del motor, **no se parchea en memoria**: el alias y
       el id los decidió el server (L-166). */
    void listarMisDirecciones().then((r) => { if (r.ok) setDirecciones(r.data); });
  }, []);

  return {
    direccion,
    direcciones,
    /**
     * 🔴 El ID que viaja al motor. `null` = la principal, y es válido.
     * *La dirección del hogar puede no ser una fila de la libreta; ahí no hay
     * id que mandar y el server resuelve — que es exactamente lo que `null`
     * significa.*
     */
    direccionId: direccion !== 'cargando' && direccion !== null && 'id' in direccion ? direccion.id : null,
    setDireccion,
    hojaEditar, setHojaEditar,
    hojaLibreta, setHojaLibreta,
    hojaAlias, setHojaAlias,
    releerLibreta,
  };
}

export function SeccionDireccion({
  dir,
  rotulo,
  apoyo,
}: {
  dir: DireccionElegida;
  /** «A dónde ir» · «De dónde lo pasan a buscar» — la voz es de quien monta. */
  rotulo: string;
  /** La línea que explica qué se hace con esa dirección. Opcional. */
  apoyo?: string;
}) {
  const { t } = useTraduccion();
  const { direccion, direcciones } = dir;

  return (
    <>
      <View style={{ gap: spacing[2] }}>
        <Texto variante="seccion">{rotulo}</Texto>
        {apoyo === undefined ? null : <Texto variante="apoyo">{apoyo}</Texto>}
        <Tarjeta relleno="ninguno">
          {direccion === 'cargando' || direccion === null ? (
            /* Sin ninguna guardada: la fila **invita a poner una** en vez de
               mostrar un vacío mudo. */
            <CeldaNavegacion
              icono="ubicacion"
              titulo={t('direccion.agregarOtra')}
              onPress={() => dir.setHojaEditar(true)}
            />
          ) : (
            <CeldaNavegacion
              /* El pin ya existe en el registry desde el lote b′ — se usa, no
                 se pide. */
              icono="ubicacion"
              titulo={direccion.direccion}
              detalle={[direccion.ciudad, direccion.referencias]
                .filter((x): x is string => x !== null && x !== '')
                .join(' · ')}
              /* Con UNA sola no hay libreta que abrir: el toque va derecho a
                 editarla. *Un selector de un elemento es un paso que no decide
                 nada.* */
              onPress={() =>
                direcciones.length > 1 ? dir.setHojaLibreta(true) : dir.setHojaEditar(true)
              }
            />
          )}
        </Tarjeta>
      </View>

      {/* EDITAR / CREAR LA PRIMERA — el formulario compartido de S79.
          `exigirPunto` porque el motor lo exige: `chk_direccion_con_punto`
          pide lat/lon. *Se cumple el CHECK, no se lo amplía: una dirección sin
          punto es justo lo que esa restricción existe para impedir.* */}
      <Hoja visible={dir.hojaEditar} onCerrar={() => dir.setHojaEditar(false)} titulo={rotulo} altura="completa">
        <View style={{ gap: spacing[3] }}>
          <DireccionHogarForm
            inicial={direccion !== 'cargando' && direccion !== null && !('alias' in direccion) ? direccion : null}
            exigirPunto
            onGuardada={(d) => { dir.setDireccion(d); dir.setHojaEditar(false); dir.releerLibreta(); }}
          />
        </View>
      </Hoja>

      {/* LA LIBRETA — elegir entre las guardadas. */}
      <Hoja visible={dir.hojaLibreta} onCerrar={() => dir.setHojaLibreta(false)} titulo={rotulo}>
        <View style={{ gap: spacing[2] }}>
          {direcciones.map((d) => (
            <CeldaNavegacion
              key={d.id}
              icono="ubicacion"
              titulo={d.alias}
              detalle={[d.direccion, d.ciudad].filter((x) => x !== '').join(' · ')}
              onPress={() => { dir.setDireccion(d); dir.setHojaLibreta(false); }}
            />
          ))}
          <Boton
            variante="secundario"
            bloque
            etiqueta={t('direccion.agregarOtra')}
            onPress={() => { dir.setHojaLibreta(false); dir.setHojaAlias(true); }}
          />
        </View>
      </Hoja>

      {/* CREAR OTRA, con su alias — el nombre lo elige la persona. */}
      <Hoja visible={dir.hojaAlias} onCerrar={() => dir.setHojaAlias(false)} titulo={t('direccion.agregarOtra')} altura="completa">
        <DireccionHogarForm
          inicial={null}
          exigirPunto
          conAlias
          onGuardada={(d) => { dir.setDireccion(d); dir.setHojaAlias(false); dir.releerLibreta(); }}
        />
      </Hoja>
    </>
  );
}
