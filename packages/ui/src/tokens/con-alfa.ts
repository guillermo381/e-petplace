/**
 * `conAlfa` — UN COLOR DE LA CASA, A UNA FRACCIÓN.
 *
 * ── POR QUÉ SUBE A `tokens/` (S116-B) ─────────────────────────────────
 * Vivía adentro de `MapaZona.tsx`, donde nació para teñir el círculo de
 * la zona. **Apareció su segundo consumidor** —el halo del foco, que la
 * letra define como *«4 al 10 %»* del acento— y ésta es la casa que ya
 * decidió qué hacer en ese caso: `N17`, una fuente y N consumidores, con
 * el precedente de `EvitaTeclado` (`D-498`) y de `EscaleraIconos`
 * (`D-1005`). *Dos derivaciones de alfa escritas aparte son dos que
 * divergen el día que una redondee distinto.*
 *
 * ⚠️ **ESPERA UN HEX DE SEIS DÍGITOS Y NO LO VERIFICA.** No es descuido:
 * los dos montajes vivos le pasan un color del tema, que en esta casa es
 * hex (`palette` es hex; los alfa ya compuestos viven aparte, como
 * `tealAlpha16`). *Si alguien le pasa un `rgba(...)` va a devolver
 * `rgba(NaN,NaN,NaN,α)`, que es visible al instante* — preferible a un
 * guard que devuelva el color intacto y deje pasar en silencio un halo
 * opaco al 100 %.
 */
export function conAlfa(hex: string, alfa: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${r},${g},${b},${alfa})`
}
