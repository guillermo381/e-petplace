import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/supabase'   // inicializa la puerta única ANTES de montar
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
