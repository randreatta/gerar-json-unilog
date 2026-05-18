import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import JsonConverter from './JsonConverter.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <JsonConverter />
  </StrictMode>,
)
