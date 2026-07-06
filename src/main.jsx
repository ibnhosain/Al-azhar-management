import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoot from './AppRoot.jsx'
import { ToastProvider } from './ui'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AppRoot />
    </ToastProvider>
  </StrictMode>,
)
