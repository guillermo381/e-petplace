// Perfil propio del user (S53-B2b QW1; ampliado S55-B3 para Cuenta v1).
// RLS: profiles_select / profiles_update (auth.uid() = id) — la puerta
// es la fila propia, cero DEFINER.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar tu perfil.';
const MENSAJE_ERROR_GUARDAR = 'No pudimos guardar los cambios. Prueba de nuevo.';

export interface MiPerfil {
  nombre: string | null;
  /** **La fuente es `auth.users`, jamás la copia de `profiles`.**
   *
   *  Medido S104-A: `profiles.email` es un ESPEJO (lo mantiene el trigger
   *  `on_auth_user_email_changed`), y antes de esta tanda este wrapper leía
   *  la copia PRIMERO. No divergía por suerte, no por diseño: el trigger de
   *  `auth.users` era `AFTER INSERT` y **solo INSERT**, así que nadie había
   *  podido cambiar su correo todavía. El día que exista esa pantalla, leer
   *  la copia primero mostraría el correo VIEJO como si fuera el de la
   *  cuenta — y la persona no tendría forma de saber cuál es la verdad. */
  email: string | null;
  /** E.164 sin '+' (regla 28); el display es del frontend. */
  telefono: string | null;
  /** PATH en el bucket 'mascotas' (carpeta propia) — se firma con resolverUrlFoto. */
  foto_url: string | null;
}

export async function obtenerMiPerfil(): Promise<ResultadoWrapper<MiPerfil, 'sin_sesion' | 'error_perfil'>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJE_ERROR };

  const { data, error } = await cliente
    .from('profiles')
    .select('nombre, email, telefono, foto_url')
    .eq('id', uid)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR };
  return {
    ok: true,
    data: {
      nombre: data?.nombre ?? null,
      /* AUTH PRIMERO, la copia como CACHE — el orden es la cura de S104-A.
         `profiles.email` queda como respaldo para el caso raro de una sesión
         sin email (cuentas del legado); jamás como la verdad. */
      email: sesion.session?.user.email ?? data?.email ?? null,
      telefono: data?.telefono ?? null,
      foto_url: data?.foto_url ?? null,
    },
  };
}

export interface InputActualizarMiPerfil {
  nombre?: string;
  /** Hoy: **solo dígitos, sin `+`**. `''` limpia el campo.
   *
   *  ☠️ **LA LEY YA NO ES ÉSTA — y el guard todavía sí (D-635).** La regla
   *  28 quedó **derogada para toda la casa** (firma founder, 3-ago-2026):
   *  el teléfono se guarda **E.164 entero, con su `+`**. `prestadores`
   *  migró en S84; **`profiles` no**, y el porqué está en D-635, no en el
   *  olvido.
   *
   *  *Se deja dicho acá, en el contrato, en vez de solo en la ficha: quien
   *  lea este tipo tiene que saber que el formato que exige es el viejo, o
   *  va a construir contra letra derogada creyendo que está en regla.*
   *
   *  ⚠️ Y el dato que lo vuelve urgente: **la columna ya tiene 15 filas
   *  con `+` de 24 con teléfono** — entraron por caminos que no pasan por
   *  este wrapper. *El guard no protege un formato: protege una puerta
   *  mientras quince filas entraron por la ventana.* */
  telefono?: string;
  /** PATH ya subido a mascotas/{uid}/… ; null quita la foto. */
  foto_url?: string | null;
}

/** Actualiza el perfil propio (RLS es la puerta). Solo toca lo enviado. */
export async function actualizarMiPerfil(
  input: InputActualizarMiPerfil,
): Promise<ResultadoWrapper<null, 'sin_sesion' | 'nada_que_guardar' | 'telefono_invalido' | 'error_perfil'>> {
  const cliente = getClient();
  const { data: sesion } = await cliente.auth.getSession();
  const uid = sesion.session?.user.id;
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJE_ERROR };

  const cambios: { nombre?: string; telefono?: string | null; foto_url?: string | null } = {};
  if (input.nombre !== undefined) {
    const n = input.nombre.trim();
    if (n.length > 0) cambios.nombre = n;
  }
  if (input.telefono !== undefined) {
    const tel = input.telefono.replace(/\s/g, '');
    /* 🔴 ESTE GUARD TODAVÍA EXIGE EL FORMATO VIEJO, A PROPÓSITO Y CON
       FECHA — ver D-635. Endurecerlo a `^\+\d{7,15}$` está escrito y
       medido, y **rompe `apps/cliente` el mismo día**: su pantalla de
       perfil manda `telefono` crudo desde un `Campo` sin `+`, sin prefijo
       y sin selector de país, **y lo manda SIEMPRE** (no solo cuando se
       edita). Con el guard estricto, alguien que solo cambia su NOMBRE no
       puede guardar hasta arreglar un teléfono que no tocó.

       *Los tres cuerpos —guard, captura del cliente y backfill— se mueven
       juntos o el más rápido rompe a los otros dos. Es la condición de
       D-613, y acá aplica en la dirección incómoda: la que pide esperar.* */
    if (tel.length > 0 && !/^\d{7,15}$/.test(tel)) {
      return { ok: false, codigo: 'telefono_invalido', mensaje: 'El teléfono va con código de país y solo dígitos.' };
    }
    cambios.telefono = tel.length > 0 ? tel : null;
  }
  if (input.foto_url !== undefined) cambios.foto_url = input.foto_url;
  if (Object.keys(cambios).length === 0) {
    return { ok: false, codigo: 'nada_que_guardar', mensaje: MENSAJE_ERROR_GUARDAR };
  }

  const { error } = await cliente.from('profiles').update(cambios).eq('id', uid);
  if (error) return { ok: false, codigo: 'error_perfil', mensaje: MENSAJE_ERROR_GUARDAR };
  return { ok: true, data: null };
}
