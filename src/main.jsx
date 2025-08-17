import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import StickerStudyTracker from './App.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StickerStudyTracker />
  </React.StrictMode>
)
