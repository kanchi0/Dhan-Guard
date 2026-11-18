import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are loaded from local files, so the app works offline
import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)