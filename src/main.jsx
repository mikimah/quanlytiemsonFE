import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { RouterProvider } from 'react-router-dom' 
import { ToastContainer } from 'react-toastify'
import router from './routes'

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
    <ToastContainer />
    <RouterProvider router={router} />
  </React.StrictMode>
)
