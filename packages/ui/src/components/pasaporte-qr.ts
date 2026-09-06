/**
 * EL QR DEL PASAPORTE — **la casa lo RECIBE, no lo genera** (S113-B · 1.3).
 *
 * ── 🔴 POR QUÉ ES UN TIPO Y NO DOS PROPS ───────────────────────────────
 * Con `qrUrl?` y `qrSvg?` sueltas se pueden pasar **las dos**, y ahí alguien
 * tiene que decidir cuál gana — una decisión que nadie firmó y que cada pieza
 * resolvería a su manera. *Un estado que no debería existir no se documenta:
 * se hace inexpresable.*
 *
 * ⚠️ **Ninguna pieza de la casa genera el código.** Se decidió así por firma
 * del founder: generarlo exige una librería que este grafo no tiene, y una
 * dependencia nueva no viaja por OTA. **Lo arma quien tenga el dato** —el
 * motor o la pantalla— y acá llega dibujado.
 */
export type QrPasaporte =
  /** Una imagen ya servida — la ruta la resuelve la pantalla (patrón S47). */
  | { tipo: 'url'; url: string }
  /** El SVG como texto, para pintarlo sin pedir red. */
  | { tipo: 'svg'; svg: string }

/**
 * ¿La mascota está perdida? **Es un HECHO con fecha, no un booleano.**
 *
 * *«Perdida» sin cuándo no le sirve a quien la encuentra: la diferencia entre
 * ayer y hace tres meses cambia lo que esa persona hace con el animal.* Por eso
 * el estado y la fecha viajan juntos o no viajan.
 */
export type EstadoPasaporte =
  | { estado: 'activo' }
  | { estado: 'perdida'; desde: string }
  /** El pasaporte dejó de valer: la página pública lo dice y nada más. */
  | { estado: 'revocado' }

/** ¿Se dibuja la tarjeta? 🔴 **En memorial NO EXISTE** — no se atenúa ni se
 *  deshabilita: *un pasaporte es para encontrar a alguien que se perdió, y
 *  ofrecérselo a una familia que ya despidió a su mascota es no haber leído
 *  la pantalla.* */
export function sePintaPasaporte({ enMemoria }: { enMemoria: boolean }): boolean {
  return !enMemoria
}

/** Los tres campos que la familia puede apagar. **Apagado = NO VIAJA** — ni a
 *  la tarjeta ni a la página: *esconderlo en la vista y mandarlo igual sería
 *  peor que no ofrecer el interruptor.* */
export interface VisibilidadPasaporte {
  contacto: boolean
  salud: boolean
  chip: boolean
}

/** Lo que la página pública puede mostrar, ya filtrado por la visibilidad.
 *  🔴 **La pieza no recibe el dato y decide: recibe lo que sobrevivió.** Así
 *  el interruptor apaga en UN lugar y no en cada superficie. */
export function filtrarPorVisibilidad<T extends { contacto?: unknown; salud?: unknown; chip?: unknown }>(
  datos: T,
  ver: VisibilidadPasaporte,
): T {
  return {
    ...datos,
    contacto: ver.contacto ? datos.contacto : undefined,
    salud: ver.salud ? datos.salud : undefined,
    chip: ver.chip ? datos.chip : undefined,
  }
}
