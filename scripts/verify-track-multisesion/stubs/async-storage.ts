/** Stub de AsyncStorage en memoria. `caja` queda expuesta para que el
 *  discriminador pueda sembrar el disco (forma nueva y forma vieja). */

export const caja = new Map<string, string>();

const AsyncStorage = {
  async getItem(k: string): Promise<string | null> {
    return caja.has(k) ? (caja.get(k) as string) : null;
  },
  async setItem(k: string, v: string): Promise<void> {
    caja.set(k, v);
  },
  async removeItem(k: string): Promise<void> {
    caja.delete(k);
  },
};

export default AsyncStorage;
