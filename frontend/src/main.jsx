import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'remixicon/fonts/remixicon.css'

// Mount the main App component to the root div
createRoot(document.getElementById('root')).render(
    <App />
)