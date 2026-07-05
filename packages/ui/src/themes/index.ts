import { lightTheme } from './light'
import { darkTheme } from './dark'
import { memorialTheme } from './memorial'

export { lightTheme, darkTheme, memorialTheme }

export type Theme = typeof lightTheme | typeof darkTheme | typeof memorialTheme
export type ThemeMode = 'light' | 'dark' | 'memorial'
export type ServiceKey = keyof typeof lightTheme.services
export type StatusKey = 'success' | 'warning' | 'danger' | 'info'
export type CapaKey = 'identidad' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

/** El default del producto es CLARO (B1 §7.3). Dark es opt-in. Memorial es automático (M6). */
export function getTheme(mode: ThemeMode): Theme {
  switch (mode) {
    case 'dark':     return darkTheme
    case 'memorial': return memorialTheme
    case 'light':
    default:         return lightTheme
  }
}
